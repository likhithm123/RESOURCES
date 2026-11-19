## Which Model to Use Where: Master ML Model Selection Guide
Choosing the right machine learning model is the most critical decision in practical ML engineering. Deploying a complex deep neural network when a simple logistic regression or decision tree suffices causes latency, unexplainability, and high cloud costs.

### The Real-Life Decision Framework
@flow <Do you have target labels (y)? ~ Unsupervised: Clustering (K-Means/DBSCAN) or PCA> | <Is target continuous (numbers) or categorical? ~ Regression (Linear, Ridge, XGBoost)> | <Is your data tabular rows & columns? ~ Complex text/images: Deep Learning (CNN/Transformers)> | <Do you require strict legal explainability (e.g. banking)? ~ Yes: Logistic Regression or Decision Trees> | (Deploy Ensemble Boosted Trees: XGBoost / LightGBM) :: Model Selection Decision Flow

### Comprehensive Model Comparison: Where to Use What
| Model | Real-Life Analogy | Best Use Cases | When NOT to Use | Input & Output | Time & Space Complexity |
|---|---|---|---|---|---|
| **Linear Regression** | Using a ruler to draw the best average trend line on a scatter plot. | Real estate price estimation, sales forecasting, baseline benchmark. | Non-linear data, high multicollinearity, complex feature interactions. | **In:** Numerical vector $X \in \mathbb{R}^d$<br>**Out:** Continuous real number $y \in \mathbb{R}$ | **Train:** $O(d^2 n + d^3)$<br>**Inf:** $O(d)$<br>**Space:** $O(d)$ |
| **Logistic Regression** | A loan officer with a weighted score sheet calculating passing probability. | Credit risk default prediction, medical disease risk (heart attack prob), click-through rate (CTR). | Complex non-linear boundaries without manual feature engineering. | **In:** Numerical/encoded features $X$<br>**Out:** Probability $P(y=1) \in [0, 1]$ | **Train:** $O(n \cdot d \cdot \text{iters})$<br>**Inf:** $O(d)$<br>**Space:** $O(d)$ |
| **Decision Tree** | A 20-questions flowchart game ("Is salary > 50k? Is credit score > 700?"). | Loan approvals requiring legal audits, medical triage, customer churn rules. | High variance, prone to extreme overfitting if depth is unconstrained. | **In:** Mixed categorical & numerical $X$<br>**Out:** Class label or average number | **Train:** $O(n \cdot d \log n)$<br>**Inf:** $O(\text{depth})$<br>**Space:** $O(\text{nodes})$ |
| **Random Forest** | A council of 100 diverse doctors voting independently on a patient's diagnosis. | Tabular enterprise data, churn prediction, fraud detection, handling missing data without scaling. | Ultra-low latency requirements (<1ms), text, audio, images. | **In:** Tabular dataset $X$<br>**Out:** Majority vote or average prediction | **Train:** $O(M \cdot n \cdot d \log n)$<br>**Inf:** $O(M \cdot \text{depth})$<br>**Space:** $O(M \cdot \text{nodes})$ |
| **XGBoost / LightGBM** | A master student learning from the specific mistakes made by the previous student in an exam. | **The King of Tabular Data**: Kaggle competitions, financial fraud, search ranking, ad conversion. | Unstructured data (images/speech), tiny datasets ($<500$ rows) where it easily overfits. | **In:** Dense or sparse numerical matrix<br>**Out:** Optimized score or probability | **Train:** $O(M \cdot d \cdot n \log n)$<br>**Inf:** $O(M \cdot \text{depth})$<br>**Space:** $O(M \cdot \text{nodes})$ |
| **Support Vector Machine (SVM)** | Drawing the widest possible physical safety trench separating two warring armies. | High-dimensional data where features > samples (e.g. genomics, spam classification). | Massive datasets ($n > 100,000$) where kernel matrix computation explodes memory. | **In:** Standardized numerical vector<br>**Out:** Discrete class label | **Train:** $O(n^2 d)$ to $O(n^3)$<br>**Inf:** $O(d \cdot \text{support vectors})$<br>**Space:** $O(n_{\text{sv}} \cdot d)$ |
| **K-Nearest Neighbors (KNN)** | "Tell me who your 5 closest neighbors are, and I will tell you who you are." | Recommendation systems ("customers like you also bought"), small visual similarity search. | Large datasets at inference time (must calculate distance to every training point). | **In:** Normalized vector<br>**Out:** Average or majority vote of $k$ points | **Train:** $O(1)$ (Lazy learner)<br>**Inf:** $O(n \cdot d)$ without KD-tree<br>**Space:** $O(n \cdot d)$ |
| **Naive Bayes** | Word frequency counter in spam mail ("Viagra" + "Free" = 99% spam probability). | Spam filtering, sentiment analysis, document classification with text vocabularies. | Datasets with strong feature correlations (violates the "naive independence" assumption). | **In:** Bag-of-words / TF-IDF sparse counts<br>**Out:** Most probable class | **Train:** $O(n \cdot d)$<br>**Inf:** $O(d)$<br>**Space:** $O(c \cdot d)$ |
| **K-Means Clustering** | Grouping warehouse packages into $k$ delivery truck zones based on GPS coordinates. | Customer market segmentation, image color compression, document clustering. | Non-spherical clusters, clusters of varying density, datasets with massive outliers. | **In:** Continuous numerical vectors<br>**Out:** Cluster ID $\{0, 1, \dots, k-1\}$ | **Train:** $O(k \cdot n \cdot d \cdot \text{iters})$<br>**Inf:** $O(k \cdot d)$<br>**Space:** $O(k \cdot d)$ |
| **DBSCAN** | Finding densely populated cities separated by empty countryside and ignoring lone cabins. | Spatial geographic clustering, anomaly/outlier detection, arbitrary non-linear shapes. | High-dimensional data or clusters with drastically varying densities. | **In:** Distance matrix or spatial coordinates<br>**Out:** Cluster IDs + Noise label (-1) | **Train:** $O(n \log n)$ with spatial index<br>**Inf:** $O(n)$<br>**Space:** $O(n)$ |
| **CNN (Convolutional Neural Net)** | A magnifying glass scanning small patches of an image looking for edges, curves, eyes, and faces. | Computer vision: medical radiology scans, facial recognition, autonomous driving, OCR. | Tabular spreadsheet rows where column order has no spatial relationship. | **In:** 2D/3D pixel tensors (Height x Width x Channels)<br>**Out:** Class or bounding boxes | **Train:** Heavy GPU hours<br>**Inf:** $O(\text{FLOPs})$<br>**Space:** Millions of weights |
| **Transformers & LLMs** | A team of universal translators reading an entire book simultaneously with attention spotlights. | Code generation, enterprise RAG, customer support chatbots, summarization, translation. | Simple tabular numbers where XGBoost is 100x faster, cheaper, and more accurate. | **In:** Tokenized text sequence<br>**Out:** Next token probability distribution | **Train:** Massive cluster (PetaFLOPs)<br>**Inf:** $O(L^2)$ or $O(L)$ with KV-cache<br>**Space:** Billions of parameters |

## Supervised Learning Algorithms
### 1. Linear Regression
- **Idea**: fit the best straight line (or plane) through the data: y = w1 x1 + w2 x2 + ... + b. "Best" = smallest **Mean Squared Error** (average of squared differences between prediction and truth).
- Example: price = 5,000 x size_sqft + 200,000. A 1,000 sq ft flat -> 5,200,000.
- Solved by the **normal equation** w = (X^T X)^-1 X^T y (small data) or gradient descent (large data).
- Assumptions: linear relationship, independent errors, constant error variance (homoscedasticity), normally distributed errors, little multicollinearity.
@graph x1-y x2-y :: Each feature contributes weight x value to the prediction
```py
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
lr = LinearRegression().fit(X_train, y_train)
pred = lr.predict(X_test)
print(lr.coef_, lr.intercept_)
print("MAE", mean_absolute_error(y_test, pred), "RMSE", mean_squared_error(y_test, pred) ** 0.5, "R2", r2_score(y_test, pred))
ridge = Ridge(alpha=1.0).fit(X_train, y_train); lasso = Lasso(alpha=0.1).fit(X_train, y_train)   # regularised versions
```
- **Polynomial regression**: add x^2, x^3 features to fit curves (still linear in the weights).
### 2. Logistic Regression (classification)
- **Idea**: compute a weighted sum z = w.x + b, squash it with the **sigmoid** sigma(z) = 1 / (1 + e^-z) to get a probability between 0 and 1. Predict class 1 if probability >= 0.5 (the threshold can be tuned).
- Loss: **log loss / binary cross-entropy** = -[y log p + (1 - y) log(1 - p)] - punishes confident wrong answers heavily.
- Example: probability a student passes from hours studied: 2 h -> 0.2, 6 h -> 0.85.
- Multiclass: one-vs-rest or **softmax** (multinomial). Coefficients are interpretable (log-odds).
```py
from sklearn.linear_model import LogisticRegression
clf = LogisticRegression(max_iter=1000, class_weight="balanced").fit(X_train, y_train)
proba = clf.predict_proba(X_test)[:, 1]          # probability of class 1
pred = (proba >= 0.4).astype(int)                # custom threshold to catch more positives
```
### 3. K-Nearest Neighbours (KNN)
- **Idea**: to classify a new point, look at the **k closest** training points and take a majority vote (or the average for regression). "Tell me who your neighbours are."
- Distance: Euclidean sqrt(sum (a - b)^2), Manhattan sum abs(a - b), cosine. **Scale features first.**
- No training phase (lazy learner); prediction is slow for big data (KD-trees / ball trees / approximate search help). Small k -> overfit (noisy), large k -> underfit. Choose k by cross-validation (odd k for 2 classes).
```py
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
knn = make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=5)).fit(X_train, y_train)
```
### 4. Naive Bayes
- **Idea**: use Bayes' theorem, assuming features are independent given the class ("naive"). P(spam given words) is proportional to P(spam) x P(word1 given spam) x P(word2 given spam) x ...
- Worked example: 40% of emails are spam. "free" appears in 60% of spam and 5% of normal mail. P(spam given "free") = 0.6 x 0.4 / (0.6 x 0.4 + 0.05 x 0.6) = 0.24 / 0.27 = **0.89**.
- Very fast, works well for text (spam, sentiment) with few samples. Types: Multinomial (word counts), Bernoulli (word present / absent), Gaussian (continuous features). Laplace smoothing avoids zero probabilities.
```py
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
spam = make_pipeline(TfidfVectorizer(stop_words="english"), MultinomialNB())
spam.fit(["win free money now", "meeting at 10 tomorrow", "free prize click here", "project report attached"], [1, 0, 1, 0])
print(spam.predict(["claim your free prize", "see you at the meeting"]))   # [1 0]
```
### 5. Decision Trees
- **Idea**: ask a series of yes / no questions about features, like a flowchart, until you reach an answer. Each split is chosen to make the groups as **pure** as possible.
@tree Income>50k?(Owns house?(Approve,Check credit score),Credit score>700?(Approve*,Reject)) :: A loan approval decision tree
| Split criterion | Formula | Meaning |
|---|---|---|
| Gini impurity | 1 - sum p_i^2 | 0 = pure; used by CART / scikit-learn |
| Entropy | - sum p_i log2 p_i | 0 = pure, 1 = 50/50 (2 classes) |
| Information gain | entropy(parent) - weighted entropy(children) | choose the split with the highest gain |
| Variance reduction | for regression trees | choose the split that most reduces variance |
- Worked example: 10 samples, 6 yes / 4 no. Gini = 1 - (0.6^2 + 0.4^2) = 1 - 0.52 = **0.48**. Entropy = -(0.6 log2 0.6 + 0.4 log2 0.4) = **0.971**.
- Pros: easy to explain, handles numbers and categories, no scaling needed, captures non-linear rules. Cons: **overfits** easily -> limit max_depth, min_samples_leaf, or prune.
```py
from sklearn.tree import DecisionTreeClassifier, export_text
tree = DecisionTreeClassifier(max_depth=4, min_samples_leaf=20, random_state=0).fit(X_train, y_train)
print(export_text(tree, feature_names=list(X_train.columns)))   # readable if / else rules
```
### 6. Ensemble learning: bagging, random forest and boosting
- **Ensemble** = combine many models; the group is better than any single one ("wisdom of the crowd").
| Method | How | Reduces | Examples |
|---|---|---|---|
| Bagging | train many models on random bootstrap samples (in parallel) and average / vote | variance (overfitting) | Random Forest |
| Boosting | train models one after another, each fixing the previous one's errors | bias | AdaBoost, Gradient Boosting, XGBoost, LightGBM, CatBoost |
| Stacking | a meta-model learns how to combine several different models | both | competition solutions |
| Voting | simple majority / average of different models | variance | quick ensembles |
@layers Training data | Bootstrap sample 1 -> Tree 1, Bootstrap sample 2 -> Tree 2, Bootstrap sample 3 -> Tree 3 | Majority vote / average -> final prediction :: Random forest (bagging + random feature subsets)
### Random Forest
- Many decision trees, each trained on a random sample of rows **and** considering a random subset of features at each split (so the trees differ). Classification = majority vote; regression = average.
- Strong default for tabular data, little tuning, gives **feature importance**, robust to outliers, out-of-bag (OOB) score for free validation.
```py
from sklearn.ensemble import RandomForestClassifier
rf = RandomForestClassifier(n_estimators=300, max_depth=None, min_samples_leaf=2, n_jobs=-1, oob_score=True, random_state=42).fit(X_train, y_train)
print(rf.oob_score_)
imp = pd.Series(rf.feature_importances_, index=X_train.columns).sort_values(ascending=False); print(imp.head(10))
```
### Gradient Boosting (XGBoost, LightGBM, CatBoost)
- Start with a simple prediction (the mean). Fit a small tree to the **errors** (residuals), add it with a small learning rate, fit the next tree to the remaining errors, and so on. Each tree is a small correction.
- Usually the **best accuracy on tabular data** (wins most Kaggle tabular competitions). Key hyperparameters: n_estimators, learning_rate, max_depth, subsample, colsample, regularisation; use early stopping on a validation set.
- **XGBoost**: regularised, fast, handles missing values. **LightGBM**: very fast, leaf-wise growth, big data. **CatBoost**: handles categorical features natively.
```py
import xgboost as xgb
model = xgb.XGBClassifier(n_estimators=2000, learning_rate=0.05, max_depth=6, subsample=0.8, colsample_bytree=0.8,
                          eval_metric="auc", early_stopping_rounds=50)
model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
print(model.best_iteration)
```
### 7. Support Vector Machines (SVM)
- **Idea**: find the boundary (hyperplane) that separates the classes with the **widest margin**. The closest points that define the margin are the **support vectors**.
- **Soft margin** (parameter C): allow some mistakes; large C = fewer mistakes but narrower margin (risk of overfitting).
- **Kernel trick**: when data is not linearly separable, implicitly map it to a higher dimension where it is. Kernels: linear, polynomial, **RBF** (Gaussian, most common; parameter gamma).
- Strong for medium-size, high-dimensional data (text); slow on very large datasets; needs scaling.
```py
from sklearn.svm import SVC
svm = make_pipeline(StandardScaler(), SVC(kernel="rbf", C=1.0, gamma="scale", probability=True)).fit(X_train, y_train)
```
### Choosing a supervised algorithm
| Situation | Try first |
|---|---|
| tabular data, need accuracy | gradient boosting (LightGBM / XGBoost), random forest |
| need a simple, explainable baseline | linear / logistic regression, small decision tree |
| text classification with little data | TF-IDF + logistic regression or naive Bayes |
| images, audio, long text | deep learning (CNNs, transformers - notebook 24) |
| very small dataset | regularised linear models, SVM, KNN |
| many features, few rows | Lasso / Ridge, SVM |
## Unsupervised Learning
### K-Means clustering
- **Idea**: split data into k groups so each point is close to its group's centre (centroid).
@flow (Choose k and place k random centroids) | Assign every point to the nearest centroid | Move each centroid to the mean of its points | <Did assignments change? ~ (Done: k clusters)> | ^repeat :: K-means algorithm
- Choose k with the **elbow method** (plot inertia vs k; pick the bend) or the **silhouette score** (-1 to 1, higher is better). Use k-means++ initialisation. Scale features. Assumes round, similar-size clusters.
- Example: segment shop customers by annual spend and visits into "bargain hunters", "loyal big spenders", "occasional buyers" for targeted offers.
```py
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
Xs = StandardScaler().fit_transform(customers[["annual_spend", "visits", "avg_basket"]])
for k in range(2, 8):
    km = KMeans(n_clusters=k, n_init=10, random_state=0).fit(Xs)
    print(k, round(km.inertia_), round(silhouette_score(Xs, km.labels_), 3))
customers["segment"] = KMeans(n_clusters=4, n_init=10, random_state=0).fit_predict(Xs)
```
### Other clustering methods
| Method | Idea | Good for |
|---|---|---|
| Hierarchical (agglomerative) | repeatedly merge the closest clusters; a dendrogram shows the tree | small data, choosing k visually |
| DBSCAN | dense regions become clusters; sparse points are noise | odd-shaped clusters, outlier detection, no k needed |
| Gaussian Mixture Models | soft clustering with probabilities | overlapping groups |
### Dimensionality reduction
- **Curse of dimensionality**: with many features, data becomes sparse, distances lose meaning and models overfit.
- **PCA (Principal Component Analysis)**: finds new axes (principal components) that capture the most **variance**; keep the top few. Steps: standardise -> covariance matrix -> eigenvectors / eigenvalues -> project onto the top components. "Explained variance ratio" says how much information each keeps.
- **t-SNE / UMAP**: non-linear methods to visualise high-dimensional data (embeddings) in 2D. **LDA** (Linear Discriminant Analysis): supervised reduction that maximises class separation.
```py
from sklearn.decomposition import PCA
pca = PCA(n_components=0.95)                     # keep enough components for 95% of the variance
Xp = pca.fit_transform(StandardScaler().fit_transform(X))
print(Xp.shape, pca.explained_variance_ratio_[:5])
```
### Association rules and anomaly detection
- **Association rules** (market-basket analysis, Apriori / FP-Growth): "people who buy bread and butter also buy milk". Support = how often the items appear together; confidence = P(milk given bread, butter); lift > 1 = a real association.
- **Anomaly detection**: Isolation Forest, One-Class SVM, Local Outlier Factor, autoencoders - for fraud, intrusion detection, machine failures.
```py
from sklearn.ensemble import IsolationForest
iso = IsolationForest(contamination=0.01, random_state=0).fit(transactions)
transactions["is_anomaly"] = iso.predict(transactions) == -1
```
## Reinforcement Learning (overview)
- An **agent** takes **actions** in an **environment**, gets **rewards**, and learns a **policy** (which action to take in each **state**) that maximises total future reward.
@chain Agent observes state -> takes action -> environment gives reward + new state -> agent updates its policy -> repeat :: Reinforcement learning loop
- Key ideas: exploration vs exploitation (try new things vs use what works: epsilon-greedy), discount factor gamma (future rewards are worth a little less), **Q-learning** (learn the value Q(state, action)), **Deep Q-Networks**, **policy gradients / PPO** (also used to align LLMs with human feedback: RLHF). Examples: AlphaGo, game AI, robotics, recommendation and ad bidding.
- Q-learning update: Q(s, a) = Q(s, a) + alpha x [reward + gamma x max Q(s', a') - Q(s, a)].
