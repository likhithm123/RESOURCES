## LangChain - Building Blocks for LLM Apps
- **LangChain** is a Python / JavaScript library that gives standard building blocks: models, prompt templates, output parsers, document loaders, text splitters, retrievers, tools, and a way to chain them (**LCEL**, the pipe `|` syntax).
- Why use it: swap model providers with one line, many ready integrations (hundreds of loaders, vector stores, tools), less glue code.
```sh
pip install langchain langchain-anthropic langchain-openai langchain-community langchain-chroma langchain-huggingface langgraph
```
### Core components
| Component | What it is | Example |
|---|---|---|
| Chat model | wrapper around an LLM API | ChatAnthropic, ChatOpenAI, ChatOllama |
| Messages | SystemMessage, HumanMessage, AIMessage, ToolMessage | conversation turns |
| Prompt template | a prompt with {variables} | ChatPromptTemplate.from_messages(...) |
| Output parser / structured output | turn text into str, JSON or a Pydantic object | with_structured_output(Schema) |
| Runnable / LCEL | anything with .invoke / .stream / .batch, joined with pipe | prompt pipe model pipe parser |
| Document loader | read files / web / DBs into Documents | PyPDFLoader, WebBaseLoader |
| Text splitter | chunking | RecursiveCharacterTextSplitter |
| Embeddings + vector store | index and search | HuggingFaceEmbeddings + Chroma |
| Retriever | "given a question, return documents" | vectorstore.as_retriever(k=4) |
| Tool | a function the model can call | @tool decorator |
| Agent | model + tools in a loop | create_agent / LangGraph |
### Your first chain (LCEL)
```py
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatAnthropic(model="claude-sonnet-5-5", temperature=0)
prompt = ChatPromptTemplate.from_messages([
    ("system", "You explain {subject} to beginners in simple words with one example."),
    ("human", "{question}"),
])
chain = prompt | llm | StrOutputParser()                 # the pipe passes each output to the next step
print(chain.invoke({"subject": "databases", "question": "What is an index?"}))
for piece in chain.stream({"subject": "networks", "question": "What is DNS?"}): print(piece, end="")
answers = chain.batch([{"subject": "OS", "question": "What is a process?"}, {"subject": "OS", "question": "What is a thread?"}])
```
@chain {"subject", "question"} -> prompt template -> chat model -> string parser -> answer :: An LCEL chain
### Structured output
```py
from pydantic import BaseModel, Field
class Ticket(BaseModel):
    category: str = Field(description="billing, technical or other")
    urgency: int = Field(ge=1, le=5)
    summary: str
classifier = llm.with_structured_output(Ticket)
t = classifier.invoke("My card was charged twice for one order and I need the money back today!")
print(t.category, t.urgency, t.summary)                   # billing 5 Customer was double charged...
```
### RAG with LangChain
```py
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.runnables import RunnablePassthrough

docs = PyPDFLoader("handbook.pdf").load()                                     # 1 load
chunks = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=120).split_documents(docs)   # 2 split
store = Chroma.from_documents(chunks, HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2"),
                              persist_directory="./db")                          # 3 embed + store
retriever = store.as_retriever(search_type="mmr", search_kwargs={"k": 5})        # 4 retriever (diverse results)

rag_prompt = ChatPromptTemplate.from_template(
    "Answer only from the context. Say 'I don't know' if it is not there. Cite pages.\n\n"
    "Context:\n{context}\n\nQuestion: {question}")
fmt = lambda ds: "\n\n".join(f"[page {d.metadata.get('page', '?')}] {d.page_content}" for d in ds)
rag = {"context": retriever | fmt, "question": RunnablePassthrough()} | rag_prompt | llm | StrOutputParser()
print(rag.invoke("How many leave days do new employees get?"))
```
### Tools in LangChain
```py
from langchain_core.tools import tool
@tool
def get_order_status(order_id: str) -> str:
    """Return the delivery status of an order id like ORD-123."""             # the docstring is shown to the model
    return {"ORD-123": "shipped, arrives Friday"}.get(order_id, "not found")
@tool
def refund(order_id: str, amount: float) -> str:
    """Refund an amount for an order. Use only after the user confirms."""
    return f"refund of {amount} started for {order_id}"
llm_with_tools = llm.bind_tools([get_order_status, refund])
msg = llm_with_tools.invoke("Where is my order ORD-123?")
print(msg.tool_calls)        # [{'name': 'get_order_status', 'args': {'order_id': 'ORD-123'}, 'id': ...}]
```
### A ready-made agent in a few lines
```py
from langchain.agents import create_agent
agent = create_agent(model=llm, tools=[get_order_status, refund],
                     system_prompt="You are a support agent. Always confirm with the user before any refund.")
result = agent.invoke({"messages": [{"role": "user", "content": "Where is ORD-123?"}]})
print(result["messages"][-1].content)
```
- `create_agent` builds a LangGraph agent for you. When you need custom steps, branches, approvals or several agents, build the graph yourself with LangGraph (next section).
## LangGraph - Building Reliable Agents as Graphs
### Why a graph?
- Real agents need **loops** (try again), **branches** (if the tool failed, do X), **state** (what we know so far), **pauses** for human approval, and the ability to **resume** after a crash. A simple chain cannot do this.
- **LangGraph** models the agent as a **graph**: **nodes** are steps (functions), **edges** say what runs next, and a shared **state** object flows through. It is the most used framework for production agents.
@graph START>agent agent>tools tools>agent agent>END :: The classic agent graph: the agent node calls tools until it can answer
| Concept | Meaning |
|---|---|
| State | a typed dict shared by all nodes (messages, plan, results...) |
| Node | a Python function: takes state, returns an update to the state |
| Edge | fixed "after A go to B" |
| Conditional edge | a function looks at the state and picks the next node |
| START / END | entry and exit points |
| Reducer | how updates are merged (add_messages appends to the message list) |
| Checkpointer | saves state after every step -> memory, resume, time travel |
| Thread | one conversation / run, identified by thread_id |
| Interrupt | pause the graph and wait for a human |
| Store | long-term memory shared across threads |
| Subgraph | a graph used as a node inside another graph |
| Send | dynamically start many parallel branches (map-reduce) |
### Build a tool-calling agent graph step by step
```py
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import InMemorySaver

class State(TypedDict):
    messages: Annotated[list, add_messages]           # new messages are appended, not replaced

tools = [get_order_status, refund]
model = llm.bind_tools(tools)

def agent(state: State):                              # NODE 1: the LLM decides
    return {"messages": [model.invoke(state["messages"])]}

graph = StateGraph(State)
graph.add_node("agent", agent)
graph.add_node("tools", ToolNode(tools))              # NODE 2: runs whatever tools the LLM asked for
graph.add_edge(START, "agent")
graph.add_conditional_edges("agent", tools_condition) # tool calls? -> "tools", else -> END
graph.add_edge("tools", "agent")                      # after tools, think again
app = graph.compile(checkpointer=InMemorySaver())     # checkpointer = memory per thread

cfg = {"configurable": {"thread_id": "customer-42"}}
app.invoke({"messages": [("user", "Where is my order ORD-123?")]}, cfg)
out = app.invoke({"messages": [("user", "And when will it arrive?")]}, cfg)      # remembers the order from the same thread
print(out["messages"][-1].content)
for event in app.stream({"messages": [("user", "hi")]}, cfg, stream_mode="updates"): print(event)   # watch every step
```
### Human-in-the-loop approval
```py
from langgraph.types import interrupt, Command

@tool
def refund_with_approval(order_id: str, amount: float) -> str:
    """Refund money for an order. Needs a human manager's approval."""
    decision = interrupt({"question": f"Approve refund of {amount} for {order_id}?"})   # graph pauses here
    if decision != "yes": return "Refund rejected by manager."
    return f"Refund of {amount} done for {order_id}."

# ... build the graph with this tool and a checkpointer, then:
state = app.invoke({"messages": [("user", "Refund 499 for ORD-123 please")]}, cfg)
print(state["__interrupt__"])                        # show the question to a manager in your UI
app.invoke(Command(resume="yes"), cfg)               # continue exactly where it stopped
```
@flow (Agent decides to refund) | interrupt(): save state, pause | Manager sees the request in the UI | <Approved? ~ tool returns "rejected", agent tells the user> | (Command(resume="yes") continues the graph and the refund runs) :: Human-in-the-loop with interrupt
### A custom workflow graph: research -> write -> review loop
```py
class Report(TypedDict):
    topic: str
    notes: str
    draft: str
    feedback: str
    revisions: int

def research(s: Report):
    return {"notes": llm.invoke(f"List 8 key facts about {s['topic']} with sources.").content}
def write(s: Report):
    extra = f"\nFix this feedback: {s['feedback']}" if s.get("feedback") else ""
    return {"draft": llm.invoke(f"Write a 300-word article on {s['topic']} using:\n{s['notes']}{extra}").content,
            "revisions": s.get("revisions", 0) + 1}
def review(s: Report):
    verdict = llm.invoke(f"Review this article. Reply APPROVED or list problems:\n{s['draft']}").content
    return {"feedback": "" if verdict.strip().startswith("APPROVED") else verdict}
def route(s: Report):
    return END if not s["feedback"] or s["revisions"] >= 3 else "write"         # stop after 3 tries

g = StateGraph(Report)
g.add_node("research", research); g.add_node("write", write); g.add_node("review", review)
g.add_edge(START, "research"); g.add_edge("research", "write"); g.add_edge("write", "review")
g.add_conditional_edges("review", route, ["write", END])
report = g.compile().invoke({"topic": "How UPI payments work"})
print(report["draft"])
```
@flow (START) | research: collect facts | write: draft the article | review: approve or give feedback | <Approved or 3 revisions? ~ ^write again with feedback> | (END) :: A LangGraph workflow with a reflection loop
### Parallel branches (map-reduce) with Send
```py
from langgraph.types import Send
import operator
class Overall(TypedDict):
    topics: list[str]
    summaries: Annotated[list[str], operator.add]     # results from parallel branches are concatenated
def fan_out(s: Overall): return [Send("summarise", {"topic": t}) for t in s["topics"]]   # one branch per topic
def summarise(s: dict): return {"summaries": [llm.invoke(f"One-line summary of {s['topic']}").content]}
g = StateGraph(Overall)
g.add_node("summarise", summarise)
g.add_conditional_edges(START, fan_out, ["summarise"]); g.add_edge("summarise", END)
print(g.compile().invoke({"topics": ["Kafka", "Redis", "Docker"]})["summaries"])
```
### Persistence, time travel and production checkpointers
- `InMemorySaver` is for learning. In production use `SqliteSaver`, `PostgresSaver` or `RedisSaver` so conversations survive restarts and scale across servers.
- `app.get_state(cfg)` shows the current state; `app.get_state_history(cfg)` lists every saved step - you can replay or fork from an older step (**time travel**) to debug.
## Memory for Agents
| Memory type | What it stores | How to build it |
|---|---|---|
| Short-term (working) | the current conversation and tool results | message list in the state + checkpointer per thread |
| Long-term semantic | facts about the user ("prefers vegetarian food") | a store / database / vector DB, searched by user id |
| Episodic | past experiences ("last time this API failed, retrying worked") | saved summaries of past runs |
| Procedural | how to do things (improved instructions) | updated system prompts / skills files |
- Long conversations exceed the context window: **trim** old messages, or **summarise** older turns into a short note and keep only recent turns.
```py
from langgraph.store.memory import InMemoryStore
store = InMemoryStore()                                            # use a Postgres store in production
store.put(("users", "42", "prefs"), "diet", {"value": "vegetarian"})
item = store.get(("users", "42", "prefs"), "diet"); print(item.value)
app = graph.compile(checkpointer=InMemorySaver(), store=store)     # nodes can read / write long-term memory
```
## Multi-Agent Systems
- Several specialised agents, each with its own prompt and tools, work together. Easier to build and test than one giant agent with 40 tools.
| Architecture | How | Example |
|---|---|---|
| Supervisor | a manager agent decides which worker agent acts next | supervisor -> researcher / coder / writer |
| Hierarchical | supervisors of supervisors | large research projects |
| Network / swarm | agents hand off to each other directly | triage -> billing -> refunds |
| Sequential pipeline | fixed order of agents | planner -> builder -> tester |
| Debate / critique | agents argue or review each other | fact-checking |
@layers User | Supervisor agent (plans and routes) | Research agent (web search), Coding agent (Python sandbox), Writer agent (report) | Shared state / memory :: Supervisor multi-agent architecture
```py
from langgraph.prebuilt import create_react_agent
researcher = create_react_agent(llm, tools=[web_search], prompt="You research facts and cite sources.", name="researcher")
analyst = create_react_agent(llm, tools=[run_python], prompt="You analyse data with Python and report numbers.", name="analyst")
SUPERVISOR = "Decide who acts next: researcher, analyst, or FINISH. Reply with one word."
def supervisor(state: State):
    choice = llm.invoke([("system", SUPERVISOR)] + state["messages"]).content.strip()
    return Command(goto=END if choice == "FINISH" else choice)
team = StateGraph(State)
team.add_node("supervisor", supervisor, destinations=("researcher", "analyst", END))
team.add_node("researcher", researcher); team.add_node("analyst", analyst)
team.add_edge(START, "supervisor"); team.add_edge("researcher", "supervisor"); team.add_edge("analyst", "supervisor")
print(team.compile().invoke({"messages": [("user", "Compare India's EV sales growth in 2024 and 2025")]})["messages"][-1].content)
```
### Other multi-agent frameworks
| Framework | Style |
|---|---|
| CrewAI | role-based "crew": agents with role, goal, backstory; tasks assigned in sequence or by a manager |
| AutoGen / Microsoft Agent Framework | agents that chat with each other, group chats, code execution |
| OpenAI Agents SDK | agents, handoffs, guardrails, tracing |
| Claude Agent SDK | the agent harness behind Claude Code: tools, subagents, MCP, file and shell access |
| Google ADK | agents and multi-agent workflows on Gemini / Vertex |
| smolagents | small Hugging Face library; "code agents" write Python to act |
```py
# CrewAI in brief
from crewai import Agent, Task, Crew
analyst = Agent(role="Market analyst", goal="Find facts about the EV market", backstory="Ten years in auto research")
writer = Agent(role="Writer", goal="Write a clear one-page brief", backstory="Business journalist")
t1 = Task(description="Collect 2025 EV sales numbers for India", expected_output="bullet list with sources", agent=analyst)
t2 = Task(description="Write a brief from the research", expected_output="one page", agent=writer)
print(Crew(agents=[analyst, writer], tasks=[t1, t2]).kickoff())
```
## MCP - Model Context Protocol
- **MCP** is an open standard (introduced by Anthropic in 2024, now widely adopted) for connecting AI apps to tools and data. Think of it as a **USB-C port for AI**: write a tool server once and any MCP client (Claude, ChatGPT, IDEs, your own agent) can use it.
- An MCP **server** exposes **tools** (actions), **resources** (data to read) and **prompts** (templates). An MCP **client** inside the AI app connects to servers over stdio (local) or HTTP.
@chain AI app (MCP client) -> MCP protocol -> GitHub server / Postgres server / your company's server -> real systems :: MCP connects one agent to many tools in a standard way
```py
# pip install mcp  - a tiny MCP server exposing one tool
from mcp.server.fastmcp import FastMCP
mcp = FastMCP("library")
@mcp.tool()
def search_books(query: str) -> list[str]:
    """Search the college library catalogue by title or author."""
    return [b for b in ["Clean Code", "CLRS", "Designing Data-Intensive Applications"] if query.lower() in b.lower()]
if __name__ == "__main__":
    mcp.run()                                       # any MCP client can now call search_books
```
- **A2A (Agent2Agent)** is a related protocol for agents from different vendors to talk to each other.
## Agentic RAG
- Instead of always retrieving once, the agent **decides** when and how to search: rewrite the query, search several sources (vector DB, SQL, web), check if the results are good enough, search again, then answer.
@flow (Question) | Agent: do I need to search? | <Yes? ~ (answer directly)> | Choose source: docs / SQL / web, write the query | Grade the results | <Good enough? ~ ^rewrite the query and search again> | (Answer with citations) :: Agentic RAG
## Evaluating and Debugging Agents
- Agents can fail in more ways than chatbots: wrong tool, wrong arguments, endless loops, giving up early, hallucinated tool results, unsafe actions.
| Evaluate | How |
|---|---|
| Final answer quality | test set + LLM judge / exact checks |
| Task success rate | did it actually complete the goal (booking created, test passed)? |
| Trajectory | did it call the right tools in a sensible order? compare to a reference path |
| Tool-call accuracy | correct tool and valid arguments |
| Efficiency | number of steps, tokens, time, cost per task |
| Safety | did it respect permissions and approvals? red-team prompts |
- Use **tracing** (LangSmith, Langfuse) to see every step: prompt, tool call, result, tokens. Most bugs are found by reading traces.
- Improve by: clearer tool names and docstrings, fewer tools per agent, examples in the system prompt, structured outputs, smaller sub-agents, step limits and retries.
## Deploying Agents to Production
@layers Web / mobile UI (streams steps and tokens) | FastAPI or LangGraph Server: auth, rate limits, streaming endpoints | LangGraph app + Postgres checkpointer + long-term store | Tools: internal APIs, DB, search, sandbox (least privilege) | Model APIs / vLLM | Tracing, evals, alerts, cost dashboards :: Production agent architecture
```py
# FastAPI endpoint that streams an agent run (Server-Sent Events)
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
api = FastAPI()
class Ask(BaseModel): thread_id: str; message: str
@api.post("/agent")
async def run(ask: Ask):
    cfg = {"configurable": {"thread_id": ask.thread_id}}
    async def events():
        async for chunk, meta in app.astream({"messages": [("user", ask.message)]}, cfg, stream_mode="messages"):
            if chunk.content: yield f"data: {json.dumps({'node': meta['langgraph_node'], 'text': str(chunk.content)})}\n\n"
    return StreamingResponse(events(), media_type="text/event-stream")
```
- Production checklist: durable checkpointer, timeouts and step limits per run, retries with backoff for tools, idempotent tool actions, background workers / queues for long jobs, per-user permissions inside tools, approvals for risky actions, cost caps, tracing, an eval suite in CI, and gradual rollout (notebook 25).
## Complete Project: AI Study Assistant Agent (resume-ready)
- **Goal**: a student asks "Make me a 7-day plan for graphs and quiz me". The agent searches your notes (RAG), checks the student's progress in a database, builds a plan, creates a quiz, grades answers and saves progress.
| Part | Implementation |
|---|---|
| Knowledge | notes PDFs -> chunks -> Chroma / pgvector |
| Tools | search_notes(query), get_progress(user_id), save_plan(user_id, plan), make_quiz(topic, n), grade(answers) |
| Brain | LangGraph agent with a planner node + ReAct tool loop |
| Memory | Postgres checkpointer (conversation), store (preferences, weak topics) |
| Safety | tools only read / write this user's rows; max 12 steps; refuse off-topic requests |
| API + UI | FastAPI streaming endpoint + React or Streamlit chat |
| Quality | 40 test requests, trajectory checks, LLM-judge rubric, LangSmith traces |
| Deploy | Docker + Cloud Run, GitHub Actions running tests and evals |
@flow (Student request) | Load memory: progress + weak topics | Planner: decide steps | Agent loop: search_notes, make_quiz, ... | Save plan and quiz results | (Stream the plan + quiz to the student) :: Study assistant flow
- README must show: architecture diagram, demo GIF, eval results (task success %, average steps, cost per request), what you would improve.
## Agentic AI Interview Questions
Q: What is an AI agent and how is it different from a chatbot or a chain?
A: An agent is an LLM in a loop that chooses actions and tools at run time to achieve a goal, observing results before deciding the next step; a chatbot only replies and a chain follows steps fixed by the developer.
Q: Explain the ReAct pattern.
A: The model alternates Reasoning (thought), Acting (a tool call) and Observing (the tool result) until it can answer, which grounds its reasoning in real information.
Q: Why use LangGraph instead of a simple loop?
A: It gives explicit state, conditional routing, loops, parallel branches, persistence with checkpointers, human-in-the-loop interrupts, streaming and time-travel debugging, which makes agents reliable and production-ready.
Q: What is a checkpointer?
A: A component that saves the graph state after every step for a thread, enabling conversation memory, resuming after failures, human approval pauses and replaying past steps.
Q: How do you add human approval to an agent?
A: Call interrupt() before the risky action (or interrupt before a tool node); the graph saves state and pauses, the UI shows the request, and the run continues with Command(resume=decision).
Q: Short-term vs long-term memory?
A: Short-term is the current thread's messages and tool results kept in state; long-term is information persisted across sessions (user facts, past outcomes) in a store or database and retrieved when needed.
Q: What is MCP?
A: The Model Context Protocol, an open standard that lets AI applications connect to tool and data servers in a uniform way, so one integration works with many clients.
Q: Single agent vs multi-agent?
A: Start with one agent; move to multiple specialised agents (supervisor or handoff patterns) when tools and instructions become too many for one prompt or when roles are clearly separable.
Q: How do you stop agents from looping or running up costs?
A: Step and time limits, token budgets, loop detection, clear stop conditions, cheaper models for simple steps and tracing to spot repeated tool calls.
Q: How do you evaluate an agent?
A: Task success on a test set, trajectory and tool-call accuracy, efficiency (steps, tokens, latency, cost) and safety red-teaming, with traces for debugging.
Q: What security risks are specific to agents?
A: Prompt injection through tool results, excessive permissions, unsafe irreversible actions and data leaks across users; mitigate with least-privilege tools, approvals, validation and sandboxing (notebook 19, AI Guardrails).
Q: Explain the evaluator-optimizer pattern.
A: One LLM produces output and another critiques it against criteria; the loop repeats until the critic approves or a limit is hit, improving quality for writing, code and translation.
