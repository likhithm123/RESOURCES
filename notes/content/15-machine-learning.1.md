# Machine Learning - From Zero to Advanced
This notebook teaches machine learning from the very beginning in simple words: what ML is, the maths you actually need, data preprocessing, every major algorithm (how it works, the intuition, the formula, a worked example and scikit-learn code), model evaluation, tuning, the full project workflow, MLOps basics and the most asked interview questions.
## What is Machine Learning
- Normal programming: **you write the rules**, the computer applies them to data to get answers. Machine learning: **you give data and answers**, the computer learns the rules (a **model**) by itself, then uses it on new data.
@chain Traditional: Rules + Data -> Program -> Answers | Machine learning: Data + Answers -> Training -> Model (rules) -> new Data -> Predictions :: Programming vs machine learning
- Example: spam filter. Writing rules by hand ("contains FREE") breaks easily. Instead show 50,000 emails labelled spam / not spam; the model learns which patterns matter.
- Everyday ML: YouTube / Netflix recommendations, Google Maps arrival time, face unlock, UPI fraud alerts, Swiggy delivery time, credit scores, voice assistants, ChatGPT.
### Types of machine learning
| Type | Learns from | Goal | Examples |
|---|---|---|---|
| Supervised | labelled data (input + correct answer) | predict the answer for new inputs | price prediction, spam detection |
| Unsupervised | unlabelled data | find structure / groups / patterns | customer segments, anomaly detection |
| Semi-supervised | few labels + many unlabelled | use both | labelling medical images cheaply |
| Self-supervised | labels created from the data itself | learn representations | LLMs predicting the next word |
| Reinforcement learning | rewards from actions in an environment | best sequence of actions | games, robots, ad bidding |
| Supervised task | Output | Example | Algorithms |
|---|---|---|---|
| Regression | a number | house price, temperature, delivery time | linear regression, random forest, XGBoost |
| Classification | a category | spam / not spam, disease yes / no, digit 0-9 | logistic regression, decision tree, SVM, KNN, naive Bayes |
### Key words
| Term | Meaning |
|---|---|
| Dataset | a table of examples (rows) |
| Feature (X) | an input column: size, location, age |
| Label / target (y) | the answer column: price, spam |
| Sample / instance | one row |
| Model | the learned function f(X) -> y |
| Parameters | numbers the model learns (weights) |
| Hyperparameters | settings you choose before training (tree depth, learning rate, k) |
| Training | adjusting parameters to reduce error on training data |
| Inference / prediction | using the trained model on new data |
| Loss / cost function | a number measuring how wrong the model is |
| Generalisation | doing well on data the model has never seen |
## The Maths You Need (simple version)
### Linear algebra
- **Vector**: a list of numbers, one row of features: [size = 1200, rooms = 3, age = 5]. **Matrix**: a table of numbers (the whole dataset: rows x features).
- **Dot product**: a . b = a1 x b1 + a2 x b2 + ... - the heart of linear models and neural networks (weighted sum).
- Matrix multiplication, transpose, inverse, eigenvalues / eigenvectors (used in PCA).
### Statistics and probability
| Concept | Meaning |
|---|---|
| Mean / median / mode | average / middle value / most common value |
| Variance / standard deviation | how spread out the values are |
| Percentiles, IQR | position-based spread (outlier detection: below Q1 - 1.5 IQR or above Q3 + 1.5 IQR) |
| Correlation | how two variables move together (-1 to +1); correlation is not causation |
| Probability, conditional probability P(A given B) | chance of A when B is known |
| Bayes' theorem | P(A given B) = P(B given A) x P(A) / P(B) - basis of naive Bayes |
| Normal distribution | bell curve; 68-95-99.7% within 1-2-3 standard deviations |
| Hypothesis testing, p-value | is a difference real or random? (notebook 29) |
### Calculus: gradient descent (how models learn)
- The **loss** tells how wrong the model is. The **gradient** (derivative) tells which direction makes the loss bigger. Move the parameters a small step in the **opposite** direction; repeat.
- Analogy: walking down a foggy hill to the valley by always stepping in the steepest downhill direction. Step size = **learning rate**.
@flow (Start with random weights) | Predict on training data | Compute the loss | Compute gradients (slope of loss for each weight) | Update: w = w - learning_rate x gradient | <Loss still decreasing? ~ (Stop: model trained)> | ^repeat (next iteration / epoch) :: Gradient descent
| Variant | Uses | Notes |
|---|---|---|
| Batch gradient descent | all data per step | stable, slow for big data |
| Stochastic (SGD) | one sample per step | noisy, fast |
| Mini-batch | 32-512 samples per step | standard in practice |
| Momentum, RMSProp, Adam | adaptive steps | Adam is the default for deep learning |
- Learning rate too high: jumps around / diverges. Too low: very slow. Use learning-rate schedules or try 0.1, 0.01, 0.001.
```py
import numpy as np
# Learn y = 3x + 2 with gradient descent from scratch
rng = np.random.default_rng(0)
X = rng.uniform(0, 10, 100); y = 3 * X + 2 + rng.normal(0, 1, 100)
w, b, lr = 0.0, 0.0, 0.01
for epoch in range(2000):
    pred = w * X + b
    err = pred - y
    loss = (err ** 2).mean()                  # mean squared error
    dw, db = 2 * (err * X).mean(), 2 * err.mean()   # gradients
    w, b = w - lr * dw, b - lr * db           # step downhill
print(round(w, 2), round(b, 2), round(loss, 3))   # about 3.0 2.0 1.0
```
## The ML Project Workflow
@flow (1. Define the problem and the success metric) | 2. Collect data | 3. Explore the data (EDA) | 4. Clean and preprocess | 5. Feature engineering | 6. Split train / validation / test | 7. Train baseline then better models | 8. Evaluate and tune hyperparameters | 9. Final test on held-out data | 10. Deploy (API) | (11. Monitor, retrain when data changes) :: End-to-end ML workflow
- Always start with a **baseline** (predict the average / the most common class, or a simple linear model) - a fancy model must beat it.
## Data Preprocessing (most of the real work)
### Exploratory Data Analysis (EDA)
```py
import pandas as pd, numpy as np
df = pd.read_csv("houses.csv")
df.shape; df.head(); df.info(); df.describe()             # size, types, summary statistics
df.isna().sum()                                            # missing values per column
df["city"].value_counts()                                  # category counts
df.select_dtypes("number").corr()["price"].sort_values()   # which numbers relate to price
df.hist(figsize=(12, 8)); df.boxplot(column="price", by="city")   # distributions and outliers (matplotlib)
```
### Handling missing values
| Method | When |
|---|---|
| Drop rows | few rows missing, randomly |
| Drop column | mostly empty / useless column |
| Fill with mean / median | numeric (median if there are outliers) |
| Fill with mode / "Unknown" | categorical |
| Forward / backward fill | time series |
| Model-based (KNN imputer, iterative imputer) | important features, enough data |
| Add an "is_missing" flag | when missingness itself carries information |
### Handling outliers
- Detect with box plots, IQR rule, z-score (|z| > 3). Then remove (data errors), cap / clip (winsorise), transform (log), or use robust models (tree-based models, median, Huber loss).
### Encoding categorical variables
| Method | How | Use |
|---|---|---|
| Label / ordinal encoding | small = 0, medium = 1, large = 2 | categories with an order |
| One-hot encoding | one 0/1 column per category | nominal categories with few values (city) |
| Target / mean encoding | replace category with the average target (careful: leakage, use cross-validation) | many categories |
| Frequency encoding | replace with how often it appears | many categories |
| Embeddings | learned vectors | deep learning, huge vocabularies |
### Feature scaling
| Method | Formula | Use |
|---|---|---|
| Standardisation (StandardScaler) | z = (x - mean) / std | most algorithms (linear models, SVM, KNN, PCA, neural networks) |
| Min-max normalisation | (x - min) / (max - min) -> 0..1 | neural networks, images |
| Robust scaling | (x - median) / IQR | data with outliers |
| Log transform | log(1 + x) | skewed data (income, prices) |
- Distance- and gradient-based algorithms need scaling (KNN, SVM, linear / logistic regression, neural nets, k-means). **Tree models do not** (decision trees, random forest, XGBoost).
### Feature engineering
- Create better inputs: dates -> day of week, month, is_weekend; text -> length, word counts, TF-IDF; price per square foot; interaction terms; binning ages into groups; aggregations per customer (number of orders, average spend).
- **Feature selection**: remove useless / duplicate features - correlation filtering, mutual information, L1 (Lasso) regularisation, tree feature importance, recursive feature elimination.
### Train / validation / test split and data leakage
- **Training set** to learn, **validation set** to tune, **test set** used **once** at the end for an honest score. Typical 70 / 15 / 15 or 80 / 20 with cross-validation.
- **Stratified split** keeps class proportions (important for imbalanced data). **Time series**: split by time (train on the past, test on the future) - never shuffle.
- **Data leakage**: information from the test set or the future sneaks into training, giving fake high scores. Examples: scaling with the mean of the whole dataset before splitting; a feature that is only known after the event ("refund issued" when predicting fraud). Fix: split first; fit preprocessing on training data only (use a **Pipeline**).
### A complete preprocessing pipeline
```py
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
X, y = df.drop(columns="price"), df["price"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
num = X.select_dtypes("number").columns; cat = X.select_dtypes("object").columns
pre = ColumnTransformer([
    ("num", Pipeline([("impute", SimpleImputer(strategy="median")), ("scale", StandardScaler())]), num),
    ("cat", Pipeline([("impute", SimpleImputer(strategy="most_frequent")), ("onehot", OneHotEncoder(handle_unknown="ignore"))]), cat),
])
model = Pipeline([("pre", pre), ("rf", RandomForestRegressor(n_estimators=300, random_state=42))])
model.fit(X_train, y_train)                         # imputer / scaler learn ONLY from training data -> no leakage
print(model.score(X_test, y_test))                  # R^2 on unseen data
```
### Imbalanced data
- Example: 1% fraud, 99% normal. A model saying "never fraud" gets 99% accuracy but is useless.
- Fixes: use the right metrics (precision, recall, F1, PR-AUC), class weights (`class_weight="balanced"`), resampling (random over / under-sampling, **SMOTE** creates synthetic minority samples), threshold tuning, anomaly-detection approaches, collect more minority data.
## Bias, Variance, Overfitting and Underfitting
| | Underfitting (high bias) | Good fit | Overfitting (high variance) |
|---|---|---|---|
| training error | high | low | very low |
| test error | high | low | high |
| cause | model too simple, too few features | right complexity | model too complex, too little data, noise memorised |
| fix | more features, more complex model, less regularisation | - | more data, regularisation, simpler model, dropout, early stopping, cross-validation |
- Analogy: a student who did not study (underfit) vs one who memorised past papers word for word and fails new questions (overfit) vs one who understood the concepts (good fit).
- **Bias-variance trade-off**: total error = bias^2 + variance + irreducible noise. Making a model more complex lowers bias but raises variance.
### Regularisation
| Type | Adds to the loss | Effect |
|---|---|---|
| L2 (Ridge) | lambda x sum of w^2 | shrinks weights smoothly; handles correlated features |
| L1 (Lasso) | lambda x sum of abs(w) | pushes some weights to exactly 0 -> feature selection |
| Elastic Net | mix of L1 and L2 | both |
| Dropout, early stopping, data augmentation | (neural networks) | less overfitting |
### Cross-validation
- **K-fold**: split training data into k parts (5 or 10); train on k-1, validate on the remaining one; repeat k times; average the scores. More reliable than one split. Use **stratified** k-fold for classification and **TimeSeriesSplit** for time data.
@cells val train train train train :: 5-fold cross-validation, round 1 (the validation fold moves each round)
