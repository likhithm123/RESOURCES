## Sequence Models: RNN, LSTM, GRU
- Text, speech, stock prices and sensor readings are **sequences**: order matters. A **Recurrent Neural Network (RNN)** reads one step at a time and keeps a **hidden state** (memory) that is passed to the next step: h_t = tanh(W x_t + U h_(t-1) + b).
@chain x1 -> [RNN cell] -> h1 -> [RNN cell] + x2 -> h2 -> [RNN cell] + x3 -> h3 -> output :: An RNN unrolled over time (the same weights at every step)
- Problem: over long sequences gradients vanish, so plain RNNs forget early words ("The **cat**, which ate all the fish my neighbour bought yesterday, **was** full").
- **LSTM (Long Short-Term Memory)** adds a **cell state** (a memory conveyor belt) and three **gates**: forget gate (what to erase), input gate (what new info to store), output gate (what to reveal). **GRU** is a simpler version with two gates (update, reset).
| Model | Strength | Weakness |
|---|---|---|
| RNN | simple | forgets long context, slow (sequential) |
| LSTM / GRU | remembers longer context | still sequential (cannot parallelise over time), struggles with very long text |
| Transformer | attends to all positions at once, parallel, long context | cost grows with sequence length squared |
| Sequence task | Example |
|---|---|
| many-to-one | sentiment of a review |
| one-to-many | image captioning |
| many-to-many (aligned) | part-of-speech tagging |
| sequence-to-sequence (encoder-decoder) | translation, summarisation |
```py
class SentimentLSTM(nn.Module):
    def __init__(self, vocab, emb=128, hidden=128):
        super().__init__()
        self.emb = nn.Embedding(vocab, emb)                       # word id -> vector
        self.lstm = nn.LSTM(emb, hidden, batch_first=True, bidirectional=True)
        self.out = nn.Linear(2 * hidden, 2)
    def forward(self, ids):                                       # ids: batch x seq_len
        h, _ = self.lstm(self.emb(ids))
        return self.out(h.mean(dim=1))                            # average over time -> class scores
```
## Attention and Transformers
### Attention in simple words
- When reading "The animal did not cross the street because **it** was too tired", to understand "it" you look back at "animal". **Attention** lets every token look at every other token and decide how much each matters.
- Each token makes three vectors: **Query** (what am I looking for?), **Key** (what do I contain?), **Value** (what information do I give). Score = how well my Query matches each Key; softmax turns scores into weights; output = weighted sum of Values.
- Formula: **Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V**. Dividing by sqrt(d_k) keeps scores from becoming too large.
@grid . The animal tired it / it 0.05 0.71* 0.14 0.10 :: Attention weights of "it": most attention goes to "animal"
### Worked mini example
- Two tokens, d_k = 2. Query of token 1 q = [1, 0]. Keys: k1 = [1, 0], k2 = [0, 1]. Values: v1 = [10, 0], v2 = [0, 10].
1. Scores: q.k1 = 1, q.k2 = 0. Scale by sqrt(2): 0.707, 0.
2. Softmax: e^0.707 = 2.03, e^0 = 1 -> weights 2.03 / 3.03 = **0.67** and **0.33**.
3. Output = 0.67 x [10, 0] + 0.33 x [0, 10] = **[6.7, 3.3]** - mostly token 1's information, some of token 2's.
### Multi-head attention and the transformer block
- **Multi-head attention**: run several attentions in parallel (e.g. 12 heads), each learning a different relationship (grammar, meaning, position), then combine.
- **Positional encoding**: attention ignores order by itself, so position information is added to embeddings (sinusoidal, learned, or rotary RoPE in modern LLMs).
- A **transformer block** = multi-head self-attention -> add and layer-norm -> feed-forward network -> add and layer-norm. Stack many blocks (GPT-style models have dozens).
@layers Token embeddings + positional encoding | Multi-head self-attention | Add + LayerNorm (residual) | Feed-forward network (per token) | Add + LayerNorm | x N blocks | Output head: next-token probabilities / class :: Transformer block
| Transformer family | Attention | Trained to | Good for | Examples |
|---|---|---|---|---|
| Encoder-only | sees the whole sentence (bidirectional) | fill in masked words | understanding: classification, NER, embeddings | BERT, RoBERTa |
| Decoder-only | sees only previous tokens (causal mask) | predict the next token | generation, chat, code | GPT, Claude, Llama |
| Encoder-decoder | encoder reads input, decoder generates with cross-attention | map input to output | translation, summarisation | T5, BART, Whisper |
- Why transformers won: fully parallel training on GPUs, long-range context, they scale smoothly with more data and parameters (scaling laws). Downsides: attention cost is O(n^2) in sequence length (fixed by FlashAttention, sparse / linear attention, KV caching at inference).
```py
import torch.nn.functional as F
def attention(Q, K, V, causal=False):                     # Q, K, V: batch x tokens x d
    scores = Q @ K.transpose(-2, -1) / Q.size(-1) ** 0.5
    if causal:                                             # decoder: a token cannot see the future
        n = scores.size(-1); scores = scores.masked_fill(torch.triu(torch.ones(n, n, dtype=torch.bool), 1), float("-inf"))
    return F.softmax(scores, dim=-1) @ V
Q = torch.tensor([[[1., 0.]]]); K = torch.tensor([[[1., 0.], [0., 1.]]]); V = torch.tensor([[[10., 0.], [0., 10.]]])
print(attention(Q, K, V))                                  # tensor([[[6.70, 3.30]]]) - matches the worked example
```
## Embeddings
- An **embedding** maps a discrete thing (word, product, user) to a dense vector so that similar things are close. Learned by a network (`nn.Embedding`), by word2vec / GloVe (older), or by transformer encoders (sentence embeddings).
- Classic example: vector("king") - vector("man") + vector("woman") is close to vector("queen").
- Uses: semantic search and RAG, recommendations (user and item embeddings), clustering, duplicate detection (details in notebook 19).
## Generative Models
| Model | Idea | Examples |
|---|---|---|
| Autoencoder | encoder compresses input to a small code, decoder rebuilds it; trained to reconstruct | denoising, anomaly detection |
| Variational Autoencoder (VAE) | the code is a probability distribution, so you can sample new data | image generation, latent spaces in Stable Diffusion |
| GAN | a generator makes fakes, a discriminator tries to spot them; both improve | StyleGAN faces, super-resolution |
| Diffusion model | learn to remove noise step by step; generation starts from pure noise | Stable Diffusion, FLUX, Imagen, video models |
| Autoregressive transformer | predict the next token | GPT-style LLMs, music, code |
@chain Training: clean image -> add noise step by step -> model learns to predict the noise | Generation: random noise -> remove predicted noise 30-50 times (guided by the text prompt) -> new image :: Diffusion models
## Training at Scale
| Technique | Purpose |
|---|---|
| GPUs / TPUs | massively parallel matrix maths |
| Mixed precision (FP16 / BF16) | 2x faster, half the memory |
| Gradient accumulation | simulate big batches on small GPUs |
| Gradient checkpointing | trade compute for memory |
| Data parallel (DDP) | copy the model on each GPU, split the batch |
| Model / tensor / pipeline parallel, FSDP / ZeRO | split a model too big for one GPU |
| Quantisation (8-bit, 4-bit) | smaller, faster inference |
| Distillation | small student model learns from a big teacher |
| Pruning | remove unimportant weights |
- Track experiments (Weights and Biases / MLflow), fix random seeds, save checkpoints, watch training and validation curves.
## Deploying Deep Learning Models
- Export: TorchScript, **ONNX** (portable), TensorRT (NVIDIA speed-up), Core ML / TensorFlow Lite (phones), quantise for CPUs.
- Serve: FastAPI + Docker for small models; TorchServe / Triton / BentoML / Ray Serve / KServe; vLLM / TGI for LLMs (notebook 19). Use batching, GPU autoscaling, and monitor latency, throughput, GPU memory and drift.
```py
# export a trained model to ONNX for fast, portable inference
model.eval()
dummy = torch.randn(1, 3, 224, 224)
torch.onnx.export(model, dummy, "model.onnx", input_names=["image"], output_names=["logits"], dynamic_axes={"image": {0: "batch"}})
import onnxruntime as ort
sess = ort.InferenceSession("model.onnx"); print(sess.run(None, {"image": dummy.numpy()})[0].shape)
```
## Deep Learning Projects for Your Resume
| Project | Skills |
|---|---|
| Plant disease / X-ray classifier with transfer learning, deployed as a web app | CNNs, augmentation, fine-tuning, ONNX, FastAPI |
| Real-time object detection (helmet / mask / traffic) with YOLO on video | detection, video pipelines, edge deployment |
| Fine-tune BERT for sentiment or resume-job matching | transformers, Hugging Face, evaluation |
| Build a tiny GPT from scratch on Shakespeare / Telugu text | attention, tokenisation, training loops |
| Speech-to-text app with Whisper + summarisation | audio models, LLM pipelines |
| Image generation app with Stable Diffusion + LoRA on your own style | diffusion, fine-tuning, GPU serving |
## Deep Learning Interview Questions
Q: Why do we need activation functions?
A: Without non-linear activations, any stack of layers collapses into one linear function and cannot learn complex patterns.
Q: Explain backpropagation.
A: After a forward pass computes the loss, the chain rule is applied from the output layer backwards to compute the gradient of the loss with respect to every weight; an optimizer then updates the weights.
Q: What is the vanishing gradient problem and how is it solved?
A: Gradients shrink as they pass back through many layers (sigmoid / tanh, long RNNs), so early layers stop learning; ReLU activations, residual connections, normalisation, good initialisation and LSTMs / transformers fix it.
Q: Batch norm vs layer norm?
A: Batch norm normalises each feature across the batch (CNNs); layer norm normalises across the features of each sample, independent of batch size (transformers, RNNs).
Q: How does dropout reduce overfitting?
A: It randomly disables neurons during training so the network cannot rely on specific units, acting like an ensemble of thinner networks; it is turned off at inference.
Q: Why are CNNs good for images?
A: Convolutions share weights across positions and look at local neighbourhoods, giving translation-equivariant feature detectors with far fewer parameters than dense layers.
Q: What do residual connections do?
A: They add a layer's input to its output (F(x) + x), giving gradients a direct path backwards so very deep networks train well.
Q: LSTM vs transformer?
A: LSTMs process tokens sequentially with gated memory; transformers use self-attention to relate all tokens in parallel, capturing long-range dependencies and scaling much better.
Q: Explain self-attention.
A: Each token builds query, key and value vectors; attention weights come from softmax of query-key similarities (scaled by sqrt(d_k)), and the output is the weighted sum of values.
Q: Why divide by sqrt(d_k) in attention?
A: Dot products grow with dimension; scaling keeps softmax inputs in a range where gradients do not vanish.
Q: BERT vs GPT?
A: BERT is an encoder trained with masked-language modelling for understanding tasks; GPT is a decoder trained to predict the next token for generation.
Q: What is transfer learning?
A: Reusing a model pre-trained on a large dataset and adapting it (feature extraction or fine-tuning) to a new task with less data.
Q: Adam vs SGD?
A: Adam adapts per-parameter learning rates with momentum and converges fast with little tuning; SGD with momentum can generalise slightly better for some vision tasks.
Q: How do you choose a learning rate?
A: Start from known defaults (1e-3 Adam, 1e-1 SGD), run a learning-rate range test, use warm-up and a decay schedule, and watch validation loss.
Q: How do diffusion models generate images?
A: They learn to predict and remove noise added to images; generation starts from random noise and repeatedly denoises, guided by a text embedding.
Q: How do you deploy a deep learning model efficiently?
A: Export to ONNX / TorchScript, quantise or distil if needed, serve with batching on an inference server or optimised runtime, and monitor latency, throughput and drift.
