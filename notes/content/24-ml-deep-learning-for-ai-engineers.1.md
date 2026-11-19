# Deep Learning for AI and ML Engineers - Neural Networks to Transformers
This notebook explains deep learning in simple words with diagrams and working PyTorch code: neurons, forward and backward propagation (with a hand-worked example), activation and loss functions, optimizers, regularisation, CNNs for images, RNNs / LSTMs for sequences, attention and transformers, embeddings, transfer learning, generative models, training at scale, deployment and interview questions.
## Why Deep Learning
- Classic ML needs humans to design features (e.g. "number of edges in the image"). **Deep learning learns the features itself** from raw data (pixels, audio, text) using many layers: early layers learn simple patterns (edges), later layers combine them into complex ones (eyes -> faces).
- It shines with large data and unstructured inputs: vision, speech, language, recommendations, generation. For small tabular datasets, gradient boosting is usually better.
@layers Pixels | Layer 1: edges and colours | Layer 2: shapes and textures | Layer 3: parts (eyes, wheels) | Output: "cat" (0.97) :: Deep networks build features layer by layer
## The Artificial Neuron
- A neuron computes a **weighted sum** of its inputs plus a **bias**, then applies an **activation function**: output = f(w1 x1 + w2 x2 + ... + wn xn + b).
- Analogy: deciding to go to a movie. Inputs: friends going (x1), good reviews (x2), rain (x3). Weights say how much each matters (friends 0.6, reviews 0.3, rain -0.5). If the weighted total crosses a threshold, you go.
@chain x1 x w1 + x2 x w2 + x3 x w3 + b -> activation f -> output :: One neuron
### Activation functions (they add non-linearity)
- Without activations, stacking layers is still just one linear function. Activations let networks learn curves and complex patterns.
| Activation | Formula | Range | Use / note |
|---|---|---|---|
| Sigmoid | 1 / (1 + e^-x) | 0 to 1 | binary output probability; vanishing gradients in deep nets |
| Tanh | (e^x - e^-x) / (e^x + e^-x) | -1 to 1 | zero-centred; still saturates |
| ReLU | max(0, x) | 0 to infinity | default for hidden layers: fast, no saturation for x > 0; "dying ReLU" if stuck at 0 |
| Leaky ReLU | x if x > 0 else 0.01x | all reals | fixes dying ReLU |
| GELU / SiLU (Swish) | smooth ReLU-like curves | - | transformers, modern CNNs |
| Softmax | e^xi / sum e^xj | probabilities summing to 1 | multiclass output layer |
## Neural Network Structure
- **Input layer** (one node per feature) -> **hidden layers** -> **output layer** (1 node for regression, 1 sigmoid node for binary, k softmax nodes for k classes). Every node in one layer connects to every node in the next in a **fully connected (dense)** layer.
@layers Input: x1, x2, x3 | Hidden 1: 4 neurons (ReLU) | Hidden 2: 4 neurons (ReLU) | Output: 2 classes (softmax) :: A multilayer perceptron (MLP)
- Number of parameters of a dense layer = inputs x outputs + outputs (biases). A 784 -> 128 layer has 784 x 128 + 128 = **100,480** parameters.
## How a Network Learns
### 1. Forward propagation
- Data flows from input to output; each layer computes z = W x + b and a = f(z). The final output is compared with the true answer by the **loss function**.
### 2. Loss functions
| Task | Loss | Formula idea |
|---|---|---|
| Regression | Mean Squared Error | mean (y - y_hat)^2 |
| Regression with outliers | MAE / Huber | abs error / mix |
| Binary classification | Binary cross-entropy | -[y log p + (1 - y) log(1 - p)] |
| Multiclass | Categorical cross-entropy | -log(probability of the correct class) |
| Embeddings / similarity | Contrastive / triplet loss | pull similar pairs together, push different ones apart |
### 3. Backpropagation
- Uses the **chain rule** of calculus to compute how much each weight contributed to the error, from the output layer back to the first layer. These are the **gradients**.
### 4. Update with an optimizer
- w = w - learning_rate x gradient (gradient descent). Repeat over many mini-batches and epochs.
@flow (Mini-batch of data) | Forward pass: compute predictions | Loss: compare with true labels | Backward pass: gradients via chain rule | Optimizer step: update all weights | <More batches / epochs? ~ (Evaluate on validation data)> | ^next batch :: The training loop
### Backpropagation by hand (one neuron)
- Input x = 2, weight w = 0.5, bias b = 0, target y = 3, linear output y_hat = w x + b, loss L = (y_hat - y)^2, learning rate 0.1.
1. Forward: y_hat = 0.5 x 2 = 1. Loss = (1 - 3)^2 = 4.
2. Gradient: dL/dy_hat = 2 (y_hat - y) = -4. dy_hat/dw = x = 2. Chain rule: dL/dw = -4 x 2 = **-8**. dL/db = -4.
3. Update: w = 0.5 - 0.1 x (-8) = **1.3**. b = 0 - 0.1 x (-4) = 0.4.
4. Next forward: y_hat = 1.3 x 2 + 0.4 = 3.0 -> loss 0. The weight moved in the right direction.
### Optimizers
| Optimizer | Idea |
|---|---|
| SGD | plain gradient step on each mini-batch |
| SGD + momentum | keeps velocity, rolls through small bumps |
| RMSProp | per-parameter step sizes based on recent gradient size |
| Adam | momentum + RMSProp; strong default (lr 1e-3) |
| AdamW | Adam with correct weight decay; default for transformers |
- **Learning-rate schedules**: warm-up, step decay, cosine decay, reduce-on-plateau. **Batch size**: bigger = smoother gradients and faster on GPUs, but may generalise slightly worse.
### Problems in training deep networks
| Problem | Cause | Fix |
|---|---|---|
| Vanishing gradients | gradients shrink through many sigmoid / tanh layers | ReLU-family activations, residual connections, good initialisation, normalisation |
| Exploding gradients | gradients blow up (RNNs) | gradient clipping, normalisation |
| Overfitting | network memorises training data | more data, augmentation, dropout, weight decay, early stopping |
| Slow / unstable training | bad learning rate, unscaled inputs | LR finder / schedule, normalise inputs, batch / layer norm |
| Dead neurons | ReLU stuck at 0 | Leaky ReLU, lower learning rate |
### Regularisation and normalisation
- **Dropout**: randomly switch off a fraction (e.g. 20-50%) of neurons each training step so the network cannot rely on a few; disabled at inference.
- **Weight decay (L2)**, **early stopping** (stop when validation loss rises), **data augmentation** (flips, crops, colour jitter for images; noise, synonym swaps for text).
- **Batch normalisation**: normalise each layer's inputs over the batch -> faster, more stable training (CNNs). **Layer normalisation**: normalise across features of each sample (transformers, RNNs).
- **Weight initialisation**: Xavier / Glorot (tanh), He / Kaiming (ReLU) keep signal sizes stable across layers.
## PyTorch from Zero
```py
# pip install torch torchvision
import torch, torch.nn as nn, torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset
device = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")

# Tensors: like NumPy arrays that can live on a GPU and track gradients
a = torch.tensor([[1., 2.], [3., 4.]], requires_grad=True)
b = (a ** 2).sum(); b.backward(); print(a.grad)          # autograd: d(sum a^2)/da = 2a

class MLP(nn.Module):                                      # a network = a class with layers + forward()
    def __init__(self, n_in, n_hidden, n_out):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(n_in, n_hidden), nn.ReLU(), nn.Dropout(0.2),
                                 nn.Linear(n_hidden, n_hidden), nn.ReLU(), nn.Linear(n_hidden, n_out))
    def forward(self, x): return self.net(x)

X = torch.randn(1000, 20); y = (X[:, 0] + X[:, 1] > 0).long()       # toy data: 2 classes
train = DataLoader(TensorDataset(X[:800], y[:800]), batch_size=64, shuffle=True)
val = DataLoader(TensorDataset(X[800:], y[800:]), batch_size=256)
model = MLP(20, 64, 2).to(device)
opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
for epoch in range(20):
    model.train()
    for xb, yb in train:
        xb, yb = xb.to(device), yb.to(device)
        loss = F.cross_entropy(model(xb), yb)              # forward + loss
        opt.zero_grad(); loss.backward(); opt.step()       # backward + update
    model.eval(); correct = 0
    with torch.no_grad():                                  # no gradients needed for evaluation
        for xb, yb in val: correct += (model(xb.to(device)).argmax(1) == yb.to(device)).sum().item()
    print(epoch, round(loss.item(), 3), correct / 200)
torch.save(model.state_dict(), "mlp.pt")                   # save weights
```
| PyTorch piece | Role |
|---|---|
| torch.Tensor | data and parameters (CPU / GPU) |
| autograd | computes gradients automatically (loss.backward()) |
| nn.Module | building block for layers and models |
| Dataset / DataLoader | load data in shuffled mini-batches |
| torch.optim | optimizers (SGD, Adam, AdamW) |
| model.train() / model.eval() | switch dropout / batch-norm behaviour |
| torch.no_grad() | inference without tracking gradients |
- **Keras / TensorFlow** is the other big framework (`model.compile(...)`, `model.fit(...)`); **JAX** is popular in research. PyTorch dominates research and most LLM work.
## Convolutional Neural Networks (CNNs) - Images
### Why not a normal dense network?
- A 224 x 224 colour image has 150,528 inputs; a dense layer to 1,000 neurons needs 150 million weights and ignores the fact that nearby pixels belong together. **CNNs** use small shared filters that slide over the image.
### Convolution
- A **filter / kernel** (e.g. 3 x 3) slides across the image; at each position it multiplies element-wise and sums, producing a **feature map** that lights up where the pattern (an edge, a corner) appears. The filter values are **learned**.
@grid 1 0 1 / 0 1 0 / 1 0 1 :: A 3x3 filter slides over the image; each output = sum of (patch x filter)
| Term | Meaning |
|---|---|
| Kernel / filter size | 3 x 3 or 5 x 5 window |
| Stride | how many pixels the filter moves each step |
| Padding | adding zeros around the border ("same" keeps the size) |
| Channels | depth: 3 for RGB input; number of filters for later layers |
| Output size | (W - K + 2P) / S + 1 |
| Pooling | shrink feature maps: max pooling keeps the strongest value in each 2 x 2 window |
| Receptive field | how much of the original image one neuron "sees" (grows with depth) |
- Example: 32 x 32 input, 5 x 5 kernel, padding 0, stride 1 -> (32 - 5 + 0) / 1 + 1 = **28 x 28** feature map. With 2 x 2 max pooling -> 14 x 14.
@chain Image 3x224x224 -> [Conv + ReLU] x2 -> MaxPool -> [Conv + ReLU] x2 -> MaxPool -> ... -> Flatten / global pool -> Dense -> Softmax (1000 classes) :: A typical CNN
| Famous architecture | Key idea |
|---|---|
| LeNet (1998) | first practical CNN (digits) |
| AlexNet (2012) | deep CNN on GPUs + ReLU + dropout; started the deep learning boom |
| VGG | many 3 x 3 convolutions stacked |
| GoogLeNet / Inception | parallel filters of different sizes |
| ResNet | **residual (skip) connections** output = F(x) + x -> very deep networks (152 layers) train well |
| MobileNet / EfficientNet | efficient for phones (depthwise separable convolutions, compound scaling) |
| Vision Transformer (ViT), ConvNeXt | transformers / modern CNNs for images |
```py
class SmallCNN(nn.Module):
    def __init__(self, n_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(), nn.MaxPool2d(2),     # 32x32 -> 16x16
            nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(), nn.MaxPool2d(2),    # 16x16 -> 8x8
            nn.Conv2d(64, 128, 3, padding=1), nn.ReLU(), nn.AdaptiveAvgPool2d(1))               # -> 128 x 1 x 1
        self.head = nn.Linear(128, n_classes)
    def forward(self, x): return self.head(self.features(x).flatten(1))
```
### Computer vision tasks
| Task | Output | Models |
|---|---|---|
| Image classification | one label per image | ResNet, EfficientNet, ViT |
| Object detection | boxes + labels | YOLO, Faster R-CNN, DETR |
| Semantic / instance segmentation | label per pixel / per object | U-Net, Mask R-CNN, SAM |
| Face recognition | identity embeddings | FaceNet, ArcFace |
| OCR | text from images | CRNN, TrOCR, vision LLMs |
| Image generation | new images | diffusion models, GANs |
## Transfer Learning and Fine-Tuning
- Instead of training from scratch, start from a model pre-trained on a huge dataset (ImageNet, the internet) and adapt it to your task. Needs far less data and time.
- **Feature extraction**: freeze the pre-trained layers, train only a new output head. **Fine-tuning**: also unfreeze some / all layers with a small learning rate.
```py
import torchvision
model = torchvision.models.resnet18(weights="IMAGENET1K_V1")
for p in model.parameters(): p.requires_grad = False             # freeze the backbone
model.fc = nn.Linear(model.fc.in_features, 3)                    # new head: e.g. 3 plant-disease classes
opt = torch.optim.AdamW(model.fc.parameters(), lr=1e-3)          # train only the head first
```
- For text: start from BERT / RoBERTa (classification, NER) or an LLM with LoRA (notebook 19).
