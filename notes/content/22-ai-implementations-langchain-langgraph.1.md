# Generative AI and Agentic AI - From Basics to Implementation (LangChain, LangGraph, Agents)
This notebook takes you from "what is generative AI" to building real AI agents, step by step, in simple words. It covers what an agent is, how it thinks, the tools you need, LangChain, LangGraph, memory, multi-agent systems, MCP, evaluation, deployment and a complete project you can put on your resume. Notebook 19 (AI Engineer) explains LLMs, prompts, embeddings and RAG; read it first if those words are new.
## Generative AI in Simple Words
- **Generative AI** creates new things: text, code, images, audio, video, 3D, music. You describe what you want (a **prompt**) and the model generates it.
- It learned patterns from huge amounts of examples. A text model learned how language flows; an image model learned how pictures look.
| Kind | Example models | Example use |
|---|---|---|
| Text / chat / code | GPT, Claude, Gemini, Llama, Mistral, Qwen, DeepSeek | chatbots, writing, coding assistants |
| Image | Stable Diffusion, FLUX, Imagen, DALL-E, Midjourney | design, ads, thumbnails |
| Audio / speech | Whisper (speech-to-text), ElevenLabs / TTS models | transcription, voice bots |
| Video | Veo, Sora, Runway | short clips, animation |
| Multimodal | models that read images + text together | answer questions about screenshots, invoices |
| Embeddings | text-embedding, bge, e5 | search, RAG (not generative, but always used with it) |
### How the main generative models work (one line each)
- **LLMs (transformers)**: predict the next token again and again (notebook 19).
- **Diffusion models (images / video)**: start from pure random noise and remove noise step by step, guided by the text prompt, until a clear picture appears.
- **GANs (older)**: a generator makes fakes and a discriminator tries to catch them; both improve by competing.
- **VAEs**: compress data into a small code and learn to rebuild it; sampling new codes gives new data.
@chain Random noise -> remove a little noise (guided by "a cat on a bike") -> ... 30-50 steps ... -> final image :: Diffusion: image generation as step-by-step denoising
### The GenAI application stack
@layers Your product (web / mobile UI) | Application logic: prompts, RAG, agents, tools, memory, guardrails | Frameworks: LangChain, LangGraph, LlamaIndex, CrewAI, SDKs | Models: API models (Claude, GPT, Gemini) or open models (Llama, Qwen) | Infrastructure: GPUs, vector DB, databases, cloud, monitoring :: The generative AI stack
## From Chatbot to Agent
- A **chatbot** answers one message at a time using what it knows.
- A **workflow** is a fixed sequence of LLM calls written by you (step 1 summarise, step 2 translate).
- An **AI agent** is an LLM that **decides by itself** which steps to take and which **tools** to use to reach a goal, looking at the result of each step before choosing the next. It can search, read files, run code, call APIs, update databases.
- Analogy: a chatbot is someone who answers from memory; a workflow is a recipe followed exactly; an agent is a smart assistant who is given a goal ("book me the cheapest flight to Delhi on Friday morning"), plans, uses the phone and the internet, checks the results, and comes back when done.
| | Chatbot | Workflow (chain) | Agent |
|---|---|---|---|
| who decides the steps | nobody, one reply | the developer, fixed | the LLM, at run time |
| tools | none | used in fixed places | chosen by the model |
| loops | no | usually no | yes, until the goal is reached |
| predictability | high | high | lower (needs guardrails) |
| good for | Q&A | known, repeatable tasks | open-ended, multi-step tasks |
> Rule: use the simplest thing that works. Start with one good prompt, then a workflow, and use an agent only when the steps really cannot be known in advance.
### What "agentic AI" means
- **Agentic AI** = systems where AI acts with some independence: it **plans**, **uses tools**, **remembers**, **reflects** on its own work and may **collaborate** with other agents, to finish multi-step goals with little human help.
## The Parts of an Agent
@layers Goal / user task | LLM brain: reasoning and planning | Tools (search, code, APIs, DB), Memory (short-term + long-term), Knowledge (RAG) | Guardrails + human approval | Environment: the real systems it acts on :: Anatomy of an AI agent
| Part | Role | Example |
|---|---|---|
| LLM (the brain) | understands the goal, decides the next action | Claude, GPT, Llama |
| Instructions (system prompt) | role, rules, style, when to stop | "You are a travel agent. Never pay without confirmation." |
| Tools | functions the agent can call | web_search, get_weather, run_sql, send_email |
| Memory | remembers the conversation and past facts | chat history, user preferences in a database |
| Planning | breaks the goal into steps | "1 search flights 2 compare 3 ask user 4 book" |
| Reflection | checks its own output and fixes mistakes | "the total does not match - recompute" |
| Guardrails | limits on what it may do | max 10 steps, approval before payment |
### The agent loop (ReAct: Reason + Act)
@flow (User gives a goal) | THINK: what should I do next? | <Need a tool? ~ (ANSWER: give the final result)> | ACT: call the tool with arguments | OBSERVE: read the tool result | ^back to THINK with the new information :: The ReAct agent loop
```txt
Goal: "What is the weather in the city where the Taj Mahal is, in Fahrenheit?"
Thought: The Taj Mahal is in Agra. I need Agra's weather.
Action: get_weather(city="Agra")
Observation: {"temp_c": 31}
Thought: Convert 31 C to F: 31 x 9/5 + 32 = 87.8
Action: calculator(expression="31*9/5+32")
Observation: 87.8
Answer: It is about 87.8 F in Agra right now.
```
### An agent from scratch (no framework, about 40 lines)
- Building one by hand first shows that an agent is just **a loop around an LLM with tool calling**.
```py
# pip install anthropic
import json, anthropic
client = anthropic.Anthropic()                                  # ANTHROPIC_API_KEY from the environment

def get_weather(city: str) -> dict: return {"city": city, "temp_c": 31}          # replace with a real API
def calculator(expression: str) -> str:
    allowed = set("0123456789+-*/(). ")
    if not set(expression) <= allowed: return "error: only arithmetic is allowed"   # guardrail
    return str(eval(expression))

TOOLS = {"get_weather": get_weather, "calculator": calculator}
SCHEMAS = [
    {"name": "get_weather", "description": "Current temperature in Celsius for a city",
     "input_schema": {"type": "object", "properties": {"city": {"type": "string"}}, "required": ["city"]}},
    {"name": "calculator", "description": "Evaluate an arithmetic expression",
     "input_schema": {"type": "object", "properties": {"expression": {"type": "string"}}, "required": ["expression"]}},
]

def run_agent(goal: str, max_steps: int = 8) -> str:
    messages = [{"role": "user", "content": goal}]
    for step in range(max_steps):                               # guardrail: never loop forever
        resp = client.messages.create(model="claude-sonnet-5-5", max_tokens=1000, tools=SCHEMAS,
                                      system="You are a helpful agent. Use tools when needed. Be brief.", messages=messages)
        messages.append({"role": "assistant", "content": resp.content})
        if resp.stop_reason != "tool_use":                      # no more tools -> final answer
            return "".join(b.text for b in resp.content if b.type == "text")
        results = []
        for block in resp.content:
            if block.type == "tool_use":
                try: out = TOOLS[block.name](**block.input)     # ACT
                except Exception as e: out = f"error: {e}"      # errors go back to the model so it can recover
                print(f"step {step}: {block.name}({block.input}) -> {out}")
                results.append({"type": "tool_result", "tool_use_id": block.id, "content": json.dumps(out)})
        messages.append({"role": "user", "content": results})   # OBSERVE
    return "Stopped: too many steps."

print(run_agent("What is the weather in the city of the Taj Mahal, in Fahrenheit?"))
```
## Agent Design Patterns
| Pattern | How it works | Use when |
|---|---|---|
| Prompt chaining | output of step 1 is input of step 2 (fixed) | tasks with clear stages: outline -> draft -> polish |
| Routing | a classifier / LLM sends the request to the right specialist | support: billing vs technical vs refund |
| Parallelisation | run several LLM calls at once and combine (sectioning or voting) | review code for security, style and bugs at the same time |
| Orchestrator-workers | a planner LLM splits the task and assigns sub-tasks to workers, then merges | research reports, large code changes |
| Evaluator-optimizer (reflection) | one LLM writes, another critiques, repeat until good | translation, writing, code with tests |
| ReAct agent | think -> act -> observe loop with tools | open-ended tool use |
| Plan-and-execute | make the full plan first, then execute steps, re-plan if needed | long tasks, cheaper models for execution |
| Human-in-the-loop | pause for approval / correction at risky points | payments, emails, deleting data |
| Multi-agent | several specialised agents talk or hand off work | complex projects with distinct roles |
@flow (Request) | Router LLM classifies the intent | <Is it billing? ~ Technical agent or FAQ RAG> | (Billing agent with payment tools) :: Routing pattern
@flow (Task: write a blog post) | Writer LLM drafts | Critic LLM scores and lists problems | <Score >= 8? ~ ^Writer revises using the critique> | (Publish) :: Evaluator-optimizer (reflection) loop
## Tools Required to Build GenAI and Agentic AI (the complete toolkit)
| Need | Tools to learn |
|---|---|
| Language | Python (main), TypeScript / JavaScript (web agents) |
| Model APIs | Anthropic, OpenAI, Google Gemini, Mistral, Groq, Together, AWS Bedrock, Azure OpenAI, Vertex AI |
| Open / local models | Hugging Face, Ollama, vLLM, llama.cpp, LM Studio |
| Agent frameworks | LangGraph, LangChain, LlamaIndex (agents and workflows), CrewAI, Microsoft AutoGen / Agent Framework, OpenAI Agents SDK, Claude Agent SDK, Google ADK, smolagents, PydanticAI, Semantic Kernel |
| Tool protocol | MCP (Model Context Protocol) servers and clients |
| Embeddings and vector DB | sentence-transformers, OpenAI / Voyage / Cohere embeddings; Chroma, FAISS, pgvector, Qdrant, Pinecone, Weaviate, Milvus |
| Document parsing | PyMuPDF, unstructured, docling, LlamaParse, Tesseract OCR |
| Web and data tools | Tavily / Brave / SerpAPI search, Firecrawl / Playwright (browse), SQL databases, REST APIs |
| Code execution sandbox | E2B, Docker, Modal, Jupyter kernels |
| Back end | FastAPI, Pydantic, Celery / Redis queues, PostgreSQL |
| Front end | Streamlit / Gradio (fast demos), React / Next.js, Vercel AI SDK, Chainlit |
| Memory | Redis, Postgres, vector stores, Mem0, Zep, LangGraph checkpointers / stores |
| Evaluation | LangSmith, promptfoo, DeepEval, RAGAS, Braintrust, Arize Phoenix |
| Observability | LangSmith, Langfuse, OpenTelemetry, Helicone |
| Guardrails | NeMo Guardrails, Guardrails AI, Llama Guard, Presidio |
| Deployment | Docker, Cloud Run / ECS / Kubernetes, LangGraph Platform, Modal, GitHub Actions |
@chain Python + model API -> prompts + tool calling -> RAG (vector DB) -> agent framework (LangGraph) -> memory + guardrails -> FastAPI + UI -> Docker + cloud -> evals + tracing :: The learning order for building agents
