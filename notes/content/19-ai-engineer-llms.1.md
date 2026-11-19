# AI Engineer - Generative AI, LLMs, RAG, FastAPI and Deployment
This notebook is written for a person who has never studied AI. It starts from "what is AI" in simple words and goes step by step to building, deploying and securing real LLM applications. Every idea has an example, and every tool has working code. Read it in order.
## The Big Picture in Simple Words
- **Artificial Intelligence (AI)**: making computers do tasks that normally need human thinking (understand language, recognise images, make decisions).
- **Machine Learning (ML)**: instead of writing rules by hand, we show the computer many examples and it learns the pattern. Example: show 10,000 emails marked spam / not spam and it learns to spot spam.
- **Deep Learning (DL)**: machine learning that uses **neural networks** with many layers. Very good with images, sound and text.
- **Generative AI (GenAI)**: models that **create** new content - text, images, code, audio, video - instead of only choosing a label.
- **Large Language Model (LLM)**: a very large neural network trained on huge amounts of text to **predict the next word**. ChatGPT, Claude, Gemini and Llama are LLMs.
@layers Artificial Intelligence | Machine Learning | Deep Learning | Generative AI | Large Language Models :: Each box is a part of the box above it
| Traditional software | Machine learning | Generative AI |
|---|---|---|
| you write the rules | the model learns rules from data | the model creates new content |
| if amount > 10000 then flag | fraud model gives a risk score | "write an email explaining this fraud alert" |
| always the same output | a prediction (number / label) | text, image, code |
### What an AI Engineer does
- A **data scientist** studies data and builds models. An **ML engineer** trains and deploys models. An **AI engineer** builds **products on top of ready models** (mostly LLMs): chatbots, search over company documents, agents that do tasks, copilots.
- Daily work: call model APIs, write prompts, build RAG pipelines, connect tools, write back-end APIs (FastAPI), test answer quality, deploy with Docker and cloud, watch cost and safety.
@chain Problem -> Choose model -> Prompt + context (RAG) -> Tools / agents -> API (FastAPI) -> Deploy (Docker, cloud) -> Evaluate + monitor :: The AI engineering workflow
## Machine Learning Basics You Need First
- **Dataset**: a table of examples. **Features** (X) are the inputs; the **label** (y) is the answer we want to predict.
- **Training**: the model adjusts its internal numbers (**parameters / weights**) to reduce its mistakes on the training data. **Inference**: using the trained model on new data.
| Type | Idea | Example |
|---|---|---|
| Supervised learning | learn from examples with correct answers | house price prediction, spam detection |
| Unsupervised learning | find patterns without answers | group similar customers |
| Self-supervised learning | the data creates its own answers (hide a word, predict it) | how LLMs are trained |
| Reinforcement learning | learn by reward and punishment | game playing, robots |
- **Train / validation / test split**: learn on the training part, tune on validation, report the final score on test data the model never saw.
- **Overfitting**: the model memorises the training data and fails on new data (like a student who memorised answers). **Underfitting**: the model is too simple to learn the pattern.
- Common metrics: accuracy, precision, recall, F1 for classification; MAE / RMSE for regression. Full details are in notebook 15 (Machine Learning).
```py
# A complete tiny ML example with scikit-learn
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
X, y = load_iris(return_X_y=True)                              # 150 flowers, 4 measurements each
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)                                    # training
print(accuracy_score(y_test, model.predict(X_test)))           # inference + evaluation -> about 1.0
```
## Deep Learning Basics
### The neuron and the network
- A **neuron** takes numbers in, multiplies each by a **weight**, adds a **bias**, and passes the sum through an **activation function**: output = f(w1*x1 + w2*x2 + ... + b).
- A **neural network** is layers of neurons: input layer -> hidden layers -> output layer. More layers = "deep".
@layers Input layer: x1, x2, x3 | Hidden layer 1 (weights + activation) | Hidden layer 2 | Output layer: prediction :: A feed-forward neural network
| Activation | Formula idea | Used for |
|---|---|---|
| ReLU | max(0, x) | hidden layers (default) |
| Sigmoid | squashes to 0..1 | yes/no output |
| Tanh | squashes to -1..1 | older networks, RNNs |
| Softmax | turns scores into probabilities that add to 1 | choosing one class / next token |
| GELU | smooth ReLU | transformers |
### How a network learns
1. **Forward pass**: put the input in and get a prediction.
2. **Loss**: measure how wrong it is (cross-entropy for classes, mean squared error for numbers).
3. **Backpropagation**: calculate how much each weight contributed to the error (the gradient) using the chain rule.
4. **Gradient descent**: move each weight a small step in the direction that reduces the loss. Step size = **learning rate**.
5. Repeat over many **batches** and **epochs** (one epoch = one pass over all the data).
@flow (Take a batch of data) | Forward pass -> prediction | Compute loss (how wrong) | Backpropagation -> gradients | Update weights (optimizer: Adam) | <More epochs? ~ (Trained model)> | ^next batch :: Training loop
```py
# The same loop in PyTorch
import torch, torch.nn as nn
model = nn.Sequential(nn.Linear(4, 16), nn.ReLU(), nn.Linear(16, 3))     # 4 inputs -> 16 hidden -> 3 classes
loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
X = torch.randn(120, 4); y = torch.randint(0, 3, (120,))
for epoch in range(100):
    logits = model(X)               # forward pass
    loss = loss_fn(logits, y)       # how wrong
    optimizer.zero_grad()
    loss.backward()                 # backpropagation
    optimizer.step()                # update weights
```
| Network type | Good at | Idea |
|---|---|---|
| MLP (feed-forward) | tables of numbers | fully connected layers |
| CNN | images | small filters slide over the image |
| RNN / LSTM | sequences (older) | read one step at a time with memory |
| Transformer | text, images, audio (today's standard) | attention: every word looks at every other word |
| Diffusion model | image / video generation | learn to remove noise step by step |
Deeper coverage (regularisation, optimizers, CNN and RNN details, the maths) is in notebook 24.
## How Large Language Models Work
### Tokens
- An LLM does not read letters or words. Text is cut into **tokens** (pieces of words). "unbelievable" may become "un", "believ", "able". Roughly 1 token = 4 characters = 0.75 English words.
- Each token has an id number. Pricing and limits are counted in tokens.
@cells The cat sat on the mat :: tokens -> ids like 464 3797 3332 319 262 2603
```py
import tiktoken
enc = tiktoken.get_encoding("cl100k_base")
ids = enc.encode("AI engineering is fun")
print(ids, len(ids), [enc.decode([i]) for i in ids])
```
### Embeddings
- Each token id is turned into a **vector** (a list of numbers, e.g. 768 or 1536 numbers) called an **embedding**. Words with similar meaning get vectors that are close together. This is how the model "understands" meaning.
### The Transformer and attention
- The **Transformer** (2017 paper "Attention Is All You Need") is the architecture inside every modern LLM.
- **Self-attention**: for every token the model asks "which other tokens matter for understanding me?" In "The animal did not cross the street because **it** was tired", attention links "it" to "animal".
- A transformer stacks many blocks. Each block = multi-head self-attention + a feed-forward network + normalisation + residual connections. **Positional encoding** tells the model the order of tokens.
@layers Input text -> tokens -> embeddings + position | Transformer block 1: self-attention + feed-forward | Transformer blocks 2 ... N | Final layer: probability of every possible next token :: Inside an LLM (decoder-only)
- **Next-token prediction**: the model outputs a probability for every token in its vocabulary; one is picked; it is added to the text; repeat. That loop is called **autoregressive generation**.
@flow (Prompt: "The capital of France is") | Model computes probabilities: Paris 0.92, Lyon 0.01 ... | Pick a token (sampling) | Append it to the text | <End token or limit reached? ~ ^continue> | (Return the answer) :: How an LLM writes one token at a time
| Model family | Type | Use |
|---|---|---|
| GPT, Claude, Gemini, Llama, Mistral | decoder-only | generating text, chat, code |
| BERT, RoBERTa | encoder-only | understanding: classification, embeddings |
| T5, BART | encoder-decoder | translation, summarising |
### Training an LLM (three stages)
1. **Pre-training**: learn language by predicting the next token on a huge part of the internet (self-supervised, months on thousands of GPUs).
2. **Fine-tuning / instruction tuning**: train further on question-answer style data so it follows instructions.
3. **Alignment** (RLHF and similar methods): humans rate answers so the model becomes helpful and safe.
### Important words
| Term | Meaning |
|---|---|
| Context window | the maximum tokens the model can read at once (prompt + answer), e.g. 200k |
| Parameters | the learned numbers; "7B model" = 7 billion parameters |
| Temperature | randomness: 0 = most likely token every time, 1 = creative |
| Top-p (nucleus) | choose only from the smallest set of tokens whose probability adds to p |
| Top-k | choose only from the k most likely tokens |
| Max tokens | upper limit on the length of the answer |
| Stop sequence | text at which generation stops |
| Hallucination | a confident answer that is wrong or made up |
| Knowledge cutoff | the date after which the model knows nothing |
| System prompt | instructions that set the role and rules for the whole chat |
| Multimodal | the model can also take images / audio / video |
| Reasoning / thinking models | models that think step by step internally before answering |
> An LLM has no memory between API calls. The "memory" of a chat is your application sending the earlier messages again each time.
### Open vs closed models
| Closed (API) models | Open-weight models |
|---|---|
| OpenAI GPT, Anthropic Claude, Google Gemini | Meta Llama, Mistral, Gemma, Qwen, DeepSeek, Phi |
| best quality, nothing to host | run on your own machine or cloud, full privacy and control |
| pay per token, data leaves your system | you manage GPUs; cost depends on usage |
- Run open models locally with **Ollama** (`ollama run llama3.2`), serve at scale with **vLLM** or **TGI**, find models on **Hugging Face**.
## Calling an LLM from Code
```py
# pip install anthropic openai
import anthropic
client = anthropic.Anthropic()                                  # reads ANTHROPIC_API_KEY from the environment
msg = client.messages.create(
    model="claude-sonnet-5-5", max_tokens=500, temperature=0.2,
    system="You are a friendly tutor. Explain in simple words with one example.",
    messages=[{"role": "user", "content": "What is an API?"}],
)
print(msg.content[0].text, msg.usage.input_tokens, msg.usage.output_tokens)
# The OpenAI-compatible style (works with OpenAI, Ollama, vLLM, Groq and many others)
from openai import OpenAI
oai = OpenAI()
r = oai.chat.completions.create(model="gpt-4o-mini", messages=[
    {"role": "system", "content": "Answer in one sentence."},
    {"role": "user", "content": "What is an API?"}])
print(r.choices[0].message.content)
```
### Chat memory and streaming
```py
history = []
def chat(user_text):
    history.append({"role": "user", "content": user_text})
    reply = client.messages.create(model="claude-sonnet-5-5", max_tokens=400, messages=history).content[0].text
    history.append({"role": "assistant", "content": reply})      # send the whole history next time
    return reply
with client.messages.stream(model="claude-sonnet-5-5", max_tokens=300, messages=[{"role": "user", "content": "Tell a short story"}]) as stream:
    for text in stream.text_stream: print(text, end="", flush=True)   # words appear as they are generated
```
### Structured output and tool calling
- **Structured output**: ask for JSON that matches a schema so your code can use the answer safely.
- **Tool calling (function calling)**: you describe functions; the model replies "call get_weather with city = Pune"; your code runs the function and sends the result back; the model writes the final answer.
@chain User question -> LLM decides: call tool get_weather(city) -> your code runs the function -> result sent back to LLM -> LLM writes the final answer :: Tool calling loop
```py
tools = [{
    "name": "get_weather", "description": "Get the current temperature of a city in Celsius",
    "input_schema": {"type": "object", "properties": {"city": {"type": "string"}}, "required": ["city"]},
}]
def get_weather(city): return {"city": city, "temp_c": 29}
messages = [{"role": "user", "content": "Is it hot in Pune right now?"}]
resp = client.messages.create(model="claude-sonnet-5-5", max_tokens=500, tools=tools, messages=messages)
while resp.stop_reason == "tool_use":
    call = next(b for b in resp.content if b.type == "tool_use")
    result = get_weather(**call.input)                                           # run the real function
    messages += [{"role": "assistant", "content": resp.content},
                 {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": str(result)}]}]
    resp = client.messages.create(model="claude-sonnet-5-5", max_tokens=500, tools=tools, messages=messages)
print(resp.content[0].text)
```
## Prompt Engineering
- A **prompt** is the input you give the model. Good prompts = clear instructions + the right context + the format you want.
| Technique | What you do | Example |
|---|---|---|
| Zero-shot | just ask | "Classify this review as positive or negative: ..." |
| Few-shot | give 2-5 examples first | "great -> positive, awful -> negative, okay I guess -> ?" |
| Role / system prompt | tell the model who it is | "You are a senior Java interviewer." |
| Chain of thought | ask it to reason step by step | "Think step by step before the final answer." |
| Output format | fix the shape of the answer | "Reply only as JSON: {\"label\": ..., \"reason\": ...}" |
| Delimiters | separate instructions from data | put the document inside <document> tags |
| Decomposition / prompt chaining | split a big task into small prompts | outline -> draft -> review |
| Self-consistency | ask several times, take the majority answer | maths problems |
| ReAct | reason, act with a tool, observe, repeat | agents |
| Grounding | "answer only from the context; say I don't know otherwise" | RAG |
```txt
You are a support assistant for an online store.

Rules:
- Answer ONLY from the text inside <context>. If the answer is not there, say "I don't know".
- Keep the answer under 80 words and use simple English.
- End with the source id in square brackets.

<context>
[doc-12] Orders can be returned within 7 days of delivery. Refunds take 5 working days.
</context>

Question: Can I return a phone after 10 days?
```
- A good prompt has: **role**, **task**, **context**, **rules / constraints**, **examples**, **output format**.
- Tips: be specific, put long documents first and the question last, give examples of both good and bad cases, ask for JSON when code will read the answer, set temperature 0 for factual tasks, test prompts on a fixed set of questions (an **eval set**) whenever you change them.
- **Context engineering**: deciding what goes into the context window (instructions, retrieved documents, tool results, memory, history) - this matters more than clever wording.
## Embeddings
- An **embedding model** turns a whole piece of text into one vector that captures its **meaning**. Similar meaning -> vectors point in a similar direction.
- "How do I reset my password?" and "I forgot my login password" have almost no words in common but very similar embeddings.
@grid dog 0.82 0.10 / puppy 0.80 0.12 / car 0.05 0.91 :: Simplified 2-number embeddings: dog and puppy are close, car is far
| Similarity measure | Idea |
|---|---|
| Cosine similarity | angle between two vectors: 1 = same direction, 0 = unrelated (most common) |
| Dot product | cosine x lengths; same as cosine when vectors are normalised |
| Euclidean distance | straight-line distance: smaller = more similar |
Formula: cosine(a, b) = (a . b) / (|a| x |b|)
```py
# pip install sentence-transformers
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")       # 384 numbers per text, free, runs on a laptop
docs = ["How do I reset my password?", "Steps to bake a chocolate cake", "I forgot my login password"]
emb = model.encode(docs, normalize_embeddings=True)
query = model.encode("cannot sign in to my account", normalize_embeddings=True)
scores = emb @ query                                # cosine similarity because the vectors are normalised
for d, s in sorted(zip(docs, scores), key=lambda p: -p[1]): print(round(float(s), 2), d)
```
| Embedding model | Dimensions | Notes |
|---|---|---|
| all-MiniLM-L6-v2 | 384 | small, fast, good for learning |
| BAAI bge-m3 / bge-large | 1024 | strong open models, multilingual |
| OpenAI text-embedding-3-small / large | 1536 / 3072 | API, good quality |
| Cohere embed v3, Voyage, Google gemini-embedding | 1024+ | API |
- Uses: semantic search, RAG, recommendations, clustering, duplicate detection, classification. Always use the **same** embedding model for documents and queries.
## Vector Databases
- A **vector database** stores embeddings and finds the **nearest** ones to a query vector very fast, even among millions.
- Exact search compares the query with every vector (slow). Vector DBs use **ANN** (Approximate Nearest Neighbour) indexes that are a little less exact but hundreds of times faster.
| Index | How it works | Notes |
|---|---|---|
| Flat | compare with everything | exact, fine for under ~100k vectors |
| HNSW | a layered graph: jump across far links, then walk to near neighbours | fast and accurate, most popular, uses more RAM |
| IVF | cluster the vectors, search only the nearest clusters | less memory, tune nprobe |
| PQ (product quantisation) | compress vectors into short codes | huge data, lower accuracy |
@graph Q-A A-B B-C A-D D-E :: HNSW: start at an entry point and hop to the neighbour that is closer to the query until no neighbour is closer
| Vector store | Type | Good for |
|---|---|---|
| FAISS | library (in memory) | learning, research, single machine |
| Chroma | lightweight DB | prototypes, local apps |
| pgvector | PostgreSQL extension | you already use Postgres; SQL + vectors together |
| Qdrant, Weaviate, Milvus | open-source servers | production scale, filtering, hybrid search |
| Pinecone | fully managed cloud | no operations work |
| Elasticsearch / OpenSearch, MongoDB Atlas, Redis | existing DBs with vector search | hybrid keyword + vector |
- Each record = **id + vector + metadata** (source, page, date, user) + the original text. **Metadata filtering** restricts search (only documents of this user, only year 2026).
```py
# pip install chromadb
import chromadb
client = chromadb.PersistentClient(path="./vectordb")
col = client.get_or_create_collection("notes")              # uses a default embedding model
col.add(ids=["1", "2", "3"],
        documents=["Refunds take 5 working days.", "Orders can be returned within 7 days.", "We deliver in 2 days in metro cities."],
        metadatas=[{"topic": "refund"}, {"topic": "return"}, {"topic": "delivery"}])
res = col.query(query_texts=["how long to get my money back?"], n_results=2, where={"topic": {"$in": ["refund", "return"]}})
print(res["documents"][0], res["distances"][0])
```
```sql
-- The same idea in PostgreSQL with pgvector
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE chunks (id bigserial PRIMARY KEY, doc text, body text, embedding vector(384));
CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops);
SELECT body, 1 - (embedding <=> $1) AS similarity FROM chunks ORDER BY embedding <=> $1 LIMIT 5;   -- <=> is cosine distance
```
