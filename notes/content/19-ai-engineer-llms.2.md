## RAG - Retrieval Augmented Generation (complete guide)
### Why RAG exists
- An LLM only knows what was in its training data. It does **not** know your company's documents, yesterday's news or a private database, and when it does not know it may **hallucinate**.
- **RAG** fixes this: first **retrieve** the most relevant pieces of your documents, then put them in the prompt, then let the LLM **generate** the answer from them.
- Simple picture: a closed-book exam (plain LLM) versus an **open-book exam** (RAG). The student is the same; in the open-book exam they look up the right page first.
@chain Question -> Retrieve relevant chunks from your documents -> Add them to the prompt -> LLM answers using them -> Answer with sources :: RAG in one line
| Benefit | Why |
|---|---|
| Fresh and private knowledge | update the documents, not the model |
| Fewer hallucinations | the answer is grounded in real text |
| Sources / citations | the user can check the page |
| Cheaper than fine-tuning | no training needed |
| Access control | retrieve only what this user may see |
### RAG vs fine-tuning vs long context
| Method | Use when | Weak point |
|---|---|---|
| Prompting only | general knowledge tasks | no private data |
| RAG | answers must come from a changing set of documents | quality depends on retrieval |
| Fine-tuning | you need a new style, format or skill (not new facts) | costly, must retrain when data changes |
| Stuffing everything in a long context | small document sets | slow, expensive, "lost in the middle" |
- These combine: a fine-tuned model can also use RAG.
### The two pipelines
@flow (INDEXING - done once, offline) | Load documents (PDF, web, DB) | Clean the text | Split into chunks | Embed every chunk | (Store vectors + text + metadata in a vector DB) :: Pipeline 1: build the index
@flow (QUERY TIME - every question) | Embed the question | Search the vector DB for the top-k nearest chunks | (optional) Rerank and filter | Build the prompt: instructions + chunks + question | LLM generates the answer | (Return the answer + sources) :: Pipeline 2: answer a question
## RAG Step 1: Loading and Cleaning Documents
- Sources: PDF, Word, HTML pages, Markdown, Notion / Confluence, emails, tickets, databases, code, audio transcripts.
- Tools: `pypdf`, `PyMuPDF`, `unstructured`, `docling`, `markitdown`, LlamaParse, LangChain / LlamaIndex loaders. Scanned PDFs need **OCR** (Tesseract, cloud OCR, or a vision LLM).
- Cleaning: remove headers / footers / page numbers, fix broken lines and hyphenation, keep tables as Markdown, keep headings, drop duplicates.
- Always keep **metadata**: file name, page number, section title, date, author, access level. You need it for citations and filters.
```py
import fitz                                            # PyMuPDF
def load_pdf(path):
    pages = []
    for i, page in enumerate(fitz.open(path), start=1):
        text = " ".join(page.get_text().split())       # collapse whitespace
        if text: pages.append({"text": text, "source": path, "page": i})
    return pages
```
## RAG Step 2: Chunking
- A **chunk** is a small piece of a document that is embedded and retrieved on its own. We chunk because (1) embedding models have a size limit, (2) one vector cannot represent a 50-page file well, (3) sending only the relevant paragraphs saves tokens.
- Too **small**: the chunk loses meaning ("It increased by 20%" - what increased?). Too **large**: many topics get mixed and the vector becomes vague. Typical start: **300-800 tokens with 10-20% overlap**.
@cells chunk-1 chunk-2 chunk-3 :: Overlap: the end of chunk 1 is repeated at the start of chunk 2 so a sentence cut at the border is not lost
| Strategy | How | When |
|---|---|---|
| Fixed size | every N characters / tokens with overlap | simple baseline |
| Recursive | split by paragraphs, then sentences, then words until the size fits | best default for prose |
| Sentence / paragraph | natural language boundaries | articles, FAQs |
| Structure-aware | by Markdown / HTML headings, one section per chunk | manuals, docs |
| Semantic | start a new chunk when the meaning changes (embedding distance jumps) | mixed-topic text |
| Code-aware | by function / class | source code |
| Table / row-aware | keep a table together, repeat its header | reports |
| Parent-child (small-to-big) | search small chunks, send their bigger parent section to the LLM | precise search + enough context |
| Contextual chunking | an LLM writes a 1-2 sentence summary of where the chunk sits, added before embedding | chunks that are unclear alone |
```py
def chunk_text(text, size=800, overlap=120):
    """Recursive-style splitter: prefer paragraph, then sentence, then word boundaries."""
    chunks, start = [], 0
    while start < len(text):
        end = min(start + size, len(text))
        if end < len(text):
            for sep in ("\n\n", ". ", " "):                      # try to cut at a natural boundary
                cut = text.rfind(sep, start + size // 2, end)
                if cut != -1: end = cut + len(sep); break
        chunks.append(text[start:end].strip())
        if end >= len(text): break
        start = max(end - overlap, start + 1)
    return [c for c in chunks if c]
# with LangChain:
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=120)
```
## RAG Step 3: Embedding and Indexing
- Embed every chunk with one embedding model and store vector + text + metadata. Embed in **batches**. Store a hash of each chunk so unchanged chunks are not re-embedded when a file is updated (**incremental indexing**).
- If you change the embedding model you must re-embed **everything**.
## RAG Step 4: Retrieval
### Dense, sparse and hybrid search
| Type | How it matches | Strong at | Weak at |
|---|---|---|---|
| Dense (vector) search | meaning, via embeddings | synonyms, paraphrases | exact codes, names, rare words |
| Sparse (keyword) search: BM25 / TF-IDF | shared words, rare words count more | exact terms: "error E-4012", product ids | different wording |
| Hybrid search | run both and merge the results | best overall | a little more work |
- **Reciprocal Rank Fusion (RRF)** merges two ranked lists: score(doc) = sum over lists of 1 / (60 + rank). Documents ranked high in both lists win.
@chain Question -> vector search top 20 + BM25 top 20 -> merge with RRF -> rerank -> best 5 chunks :: Hybrid retrieval with reranking
```py
def rrf(rank_lists, k=60):
    scores = {}
    for ranks in rank_lists:                       # each list: chunk ids from best to worst
        for pos, cid in enumerate(ranks):
            scores[cid] = scores.get(cid, 0) + 1 / (k + pos + 1)
    return sorted(scores, key=scores.get, reverse=True)
```
### Top-k, thresholds and filters
- **top-k**: how many chunks to fetch (commonly retrieve 20-50, then keep the best 3-8 after reranking). Too few = missing facts; too many = noise and cost.
- **Similarity threshold**: drop chunks below a score so irrelevant text is not sent.
- **Metadata filters**: department, date range, language, and most importantly **who is allowed to see the document**.
- **MMR** (Maximal Marginal Relevance): pick chunks that are relevant **and** different from each other, so you do not get five copies of the same paragraph.
### Reranking
- The first search is fast but rough. A **reranker** (cross-encoder) reads the question and each candidate chunk **together** and gives an accurate relevance score. It is slower, so it is used only on the top 20-50 candidates.
- Models: Cohere Rerank, BAAI bge-reranker, Jina reranker, Voyage rerank, or an LLM asked to score.
```py
from sentence_transformers import CrossEncoder
reranker = CrossEncoder("BAAI/bge-reranker-base")
def rerank(question, chunks, keep=5):
    scores = reranker.predict([(question, c["text"]) for c in chunks])
    return [c for c, _ in sorted(zip(chunks, scores), key=lambda p: -p[1])[:keep]]
```
### Query transformation (make the question easier to search)
| Technique | What it does |
|---|---|
| Query rewriting | an LLM rewrites a vague or chat-style question into a clear standalone one ("and its price?" -> "What is the price of the iPhone 16?") |
| Multi-query | generate 3-5 different phrasings, search all, merge |
| HyDE | let the LLM write a fake answer, embed that, and search with it (answers look like documents) |
| Step-back | ask a more general question first to fetch background |
| Decomposition | split "compare A and B" into separate questions |
| Routing | choose the right source: vector DB, SQL database, web search or no retrieval |
| Self-query | the LLM extracts filters from the question ("in 2025" -> year = 2025) |
## RAG Step 5: Building the Prompt (augmentation)
- Put the instructions first, then the retrieved chunks each with an id, then the question. Tell the model to use only the context and to say "I don't know" when the answer is missing.
- Order matters: models pay most attention to the **start and end** of the context ("lost in the middle"), so put the best chunks first (or first and last).
- Stay inside the token budget: system prompt + chunks + chat history + space for the answer.
```py
def build_prompt(question, chunks):
    context = "\n\n".join(f"[{i + 1}] (source: {c['source']} p.{c['page']})\n{c['text']}" for i, c in enumerate(chunks))
    return f"""Answer the question using ONLY the context below.
If the context does not contain the answer, say "I could not find this in the documents."
Cite the sources you used like [1], [2].

<context>
{context}
</context>

Question: {question}"""
```
## RAG Step 6: Generation
- Use a low temperature (0 - 0.3) for factual answers. Stream the answer to the user. Return the list of sources with the answer.
- Optional **grounding check**: a second LLM call verifies that each sentence is supported by the chunks.
## A Complete RAG Program (no framework, about 60 lines)
```py
# pip install chromadb sentence-transformers pymupdf anthropic
import fitz, chromadb, hashlib, anthropic
from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
store = chromadb.PersistentClient(path="./rag_db").get_or_create_collection("docs", metadata={"hnsw:space": "cosine"})
llm = anthropic.Anthropic()

def index_pdf(path):
    """INDEXING: load -> chunk -> embed -> store."""
    ids, texts, metas = [], [], []
    for page_no, page in enumerate(fitz.open(path), start=1):
        text = " ".join(page.get_text().split())
        for n, chunk in enumerate(chunk_text(text)):                 # chunk_text from Step 2
            ids.append(hashlib.md5(f"{path}:{page_no}:{n}".encode()).hexdigest())
            texts.append(chunk); metas.append({"source": path, "page": page_no})
    if texts:
        store.upsert(ids=ids, documents=texts, metadatas=metas,
                     embeddings=embedder.encode(texts, normalize_embeddings=True).tolist())
    return len(texts)

def retrieve(question, k=5):
    """RETRIEVAL: embed the question, fetch the nearest chunks."""
    res = store.query(query_embeddings=embedder.encode([question], normalize_embeddings=True).tolist(), n_results=k)
    return [{"text": d, **m, "distance": dist} for d, m, dist in zip(res["documents"][0], res["metadatas"][0], res["distances"][0])]

def answer(question):
    """AUGMENT + GENERATE."""
    chunks = [c for c in retrieve(question, k=8) if c["distance"] < 0.75][:5]      # threshold drops unrelated text
    if not chunks: return "I could not find this in the documents.", []
    msg = llm.messages.create(model="claude-sonnet-5-5", max_tokens=600, temperature=0,
                              messages=[{"role": "user", "content": build_prompt(question, chunks)}])
    return msg.content[0].text, [(c["source"], c["page"]) for c in chunks]

print(index_pdf("company_policy.pdf"), "chunks indexed")
text, sources = answer("How many days of paid leave do employees get?")
print(text, sources)
```
## Advanced RAG Patterns
| Pattern | Idea | Use when |
|---|---|---|
| Naive RAG | embed -> top-k -> generate | first version |
| Advanced RAG | query rewriting + hybrid search + reranking + better chunking | production quality |
| Parent-document / small-to-big | match small chunks, return the larger parent | answers need surrounding text |
| Sentence-window | match one sentence, return it with neighbours | precise facts |
| Multi-vector | store several vectors per document (summary, questions it answers, chunks) | long documents |
| Contextual retrieval | prepend an LLM-written context line to each chunk before embedding and BM25 | chunks unclear on their own |
| Corrective RAG (CRAG) | grade the retrieved chunks; if weak, rewrite the query or search the web | unreliable knowledge base |
| Self-RAG | the model decides when to retrieve and checks its own answer | higher accuracy needs |
| Agentic RAG | an agent plans, calls retrieval tools several times, combines results | multi-step questions |
| GraphRAG | build a knowledge graph of entities and relations, retrieve connected facts and community summaries | "how are X and Y related?", whole-corpus questions |
| Multimodal RAG | embed images, tables, charts (or their descriptions) | PDFs with figures, slides |
| SQL / structured RAG (text-to-SQL) | the LLM writes a SQL query; the result becomes the context | numbers in databases |
| Conversational RAG | rewrite the follow-up using chat history before retrieving | chatbots |
| Cache-augmented | cache answers for repeated or similar questions (semantic cache) | high traffic, cost control |
@flow (Question) | Retrieve chunks | <Grader: are the chunks relevant? ~ Rewrite the query or use web search> | Generate an answer | <Checker: is the answer supported by the chunks? ~ ^retrieve again> | (Final answer with citations) :: Corrective / self-checking RAG loop
### GraphRAG in simple words
- Normal RAG finds chunks that look like the question. It struggles with "What are the main themes across all 500 reports?" or "Which suppliers are linked to this delayed project?".
- GraphRAG first asks an LLM to pull out **entities** (people, companies, products) and **relationships** from every chunk and stores them as a graph (Neo4j or similar). It also writes summaries for groups of connected entities.
- At question time it walks the graph from the entities in the question and uses connected facts and summaries as context.
@graph Project-A>Supplier-X Supplier-X>Factory-Pune Project-A>Manager-Ravi Factory-Pune>Strike-June :: A knowledge graph answers "Why was Project A late?" by following links
## Evaluating RAG
- Never ship RAG by "it looks fine". Build a **test set** of 50-200 real questions with the correct answer and the correct source, and measure every change.
| What | Metric | Meaning |
|---|---|---|
| Retrieval | Hit rate / Recall@k | is the correct chunk inside the top k? |
| Retrieval | Precision@k | how many of the top k are actually relevant? |
| Retrieval | MRR | how high is the first correct chunk (1 / rank)? |
| Retrieval | nDCG | are the best chunks ranked above the weaker ones? |
| Generation | Faithfulness / groundedness | is every claim supported by the retrieved context? (catches hallucination) |
| Generation | Answer relevance | does the answer address the question? |
| Generation | Context relevance | was the retrieved context useful and not noisy? |
| Generation | Answer correctness | does it match the reference answer? |
| System | Latency, cost per question, refusal rate | production health |
- The **RAG triad**: context relevance, groundedness, answer relevance.
- Tools: **RAGAS**, DeepEval, TruLens, LangSmith, Arize Phoenix, promptfoo. Many metrics use an **LLM as a judge** with a clear rubric; check the judge against human labels sometimes.
```py
def recall_at_k(test_set, k=5):
    hits = 0
    for q in test_set:                                        # q = {"question": ..., "source": ..., "page": ...}
        got = retrieve(q["question"], k)
        hits += any(c["source"] == q["source"] and c["page"] == q["page"] for c in got)
    return hits / len(test_set)
```
## Why RAG Fails and How to Fix It
| Symptom | Likely cause | Fix |
|---|---|---|
| "I don't know" although the answer exists | bad chunking or retrieval miss | better chunk size, hybrid search, query rewriting, raise k then rerank |
| Wrong document retrieved | exact terms / codes needed | add BM25 keyword search, metadata filters |
| Answer mixes unrelated facts | chunks too large or k too high | smaller chunks, reranker, threshold |
| Correct chunk retrieved but ignored | lost in the middle, weak prompt | reorder chunks, stronger instructions, fewer chunks |
| Hallucinated details | model fills gaps | "only from context", temperature 0, grounding check, citations |
| Tables and numbers are wrong | PDF parsing destroyed the table | table-aware parser, Markdown tables, text-to-SQL |
| Outdated answers | stale index | incremental re-indexing, date metadata, delete old versions |
| Follow-up questions fail | "it", "that one" have no meaning alone | rewrite with chat history |
| Slow | big k, slow reranker, long prompt | cache, smaller k, faster models, streaming |
| User sees another team's data | no access filter | store access labels in metadata and always filter |
## RAG in Production
- **Ingestion pipeline**: scheduled or event-driven jobs detect new / changed / deleted files, re-chunk and re-embed only what changed.
- **Security**: filter by user permissions at retrieval time; treat retrieved text as untrusted (it may contain a **prompt injection**); remove personal data where required.
- **Cost and speed**: cache embeddings and frequent answers, use a small model for query rewriting and a strong one for the final answer, compress or summarise long chunks.
- **Observability**: log the question, the retrieved chunk ids and scores, the prompt, the answer, latency, tokens and user feedback (thumbs up / down). Use the bad cases to grow the test set.
- **Frameworks**: LlamaIndex (data and retrieval focused), LangChain / LangGraph (chains and agents), Haystack, DSPy. Managed options: AWS Bedrock Knowledge Bases, Azure AI Search, Vertex AI Search.
```py
# The same RAG with LlamaIndex in a few lines
# pip install llama-index
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
docs = SimpleDirectoryReader("./company_docs").load_data()
index = VectorStoreIndex.from_documents(docs)                 # chunk + embed + store
engine = index.as_query_engine(similarity_top_k=5)
print(engine.query("What is the refund policy?"))
```
## RAG Interview Questions
Q: What is RAG and why is it used?
A: Retrieval Augmented Generation fetches relevant pieces of external documents and gives them to the LLM with the question, so answers are grounded in up-to-date, private data with sources, and hallucinations drop - without retraining the model.
Q: Walk me through a RAG pipeline.
A: Indexing: load documents, clean, chunk, embed, store in a vector DB with metadata. Query: embed the question, retrieve top-k (hybrid), rerank, build a grounded prompt, generate, return answer and citations.
Q: How do you choose chunk size and overlap?
A: Start around 300-800 tokens with 10-20% overlap, then test on a question set: smaller chunks for precise facts, larger or parent-child chunks when answers need context; split on structure (headings, paragraphs) rather than blindly.
Q: Dense vs sparse retrieval, and why hybrid?
A: Dense matches meaning through embeddings, sparse (BM25) matches exact words. Hybrid merges both (for example with RRF) so both paraphrases and exact ids / names are found.
Q: What does a reranker do?
A: A cross-encoder scores each (question, chunk) pair together for accurate relevance and reorders the top candidates; it improves precision before the context is sent to the LLM.
Q: How do you evaluate a RAG system?
A: Retrieval metrics (recall@k, MRR, nDCG) on a labelled question set and generation metrics (faithfulness, answer relevance, correctness) with tools like RAGAS, plus latency, cost and user feedback.
Q: How do you reduce hallucinations?
A: Better retrieval, a prompt that restricts answers to the context and allows "I don't know", low temperature, citations, a grounding / verification step and thresholds that refuse when nothing relevant is found.
Q: RAG or fine-tuning?
A: RAG for knowledge that changes or must be cited; fine-tuning for behaviour, tone, format or a special skill. They can be combined.
Q: What is HyDE?
A: Hypothetical Document Embeddings: generate a hypothetical answer with the LLM and search with its embedding, because an answer-like text is closer to the stored documents than a short question.
Q: How do you handle access control in RAG?
A: Store permission labels as metadata on every chunk and apply the user's permissions as a filter inside the retrieval query, never after generation.
Q: What is "lost in the middle"?
A: Models use information at the beginning and end of a long context better than the middle, so put the most relevant chunks first / last and keep the context short.
