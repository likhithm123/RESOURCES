## Model Evaluation
### Regression metrics
| Metric | Formula | Meaning |
|---|---|---|
| MAE | mean of abs(y - pred) | average error in the same unit ("off by Rs 40,000 on average"); robust to outliers |
| MSE | mean of (y - pred)^2 | punishes big errors more |
| RMSE | square root of MSE | same unit as y; common default |
| MAPE | mean of abs(y - pred) / y | percentage error (bad when y is near 0) |
| R^2 | 1 - SS_residual / SS_total | share of variance explained: 1 = perfect, 0 = no better than the mean |
| Adjusted R^2 | penalises extra useless features | comparing models with different feature counts |
### Classification: the confusion matrix
@grid . Predicted-Yes Predicted-No / Actual-Yes TP* FN / Actual-No FP TN* :: Confusion matrix: correct predictions on the diagonal
| Term | Meaning | Disease test example |
|---|---|---|
| True Positive (TP) | predicted yes, actually yes | sick person correctly flagged |
| True Negative (TN) | predicted no, actually no | healthy person correctly cleared |
| False Positive (FP) | predicted yes, actually no (Type I error) | healthy person told they are sick |
| False Negative (FN) | predicted no, actually yes (Type II error) | sick person missed - dangerous |
| Metric | Formula | Question it answers |
|---|---|---|
| Accuracy | (TP + TN) / total | how often is the model right? (misleading on imbalanced data) |
| Precision | TP / (TP + FP) | when it says "yes", how often is it right? |
| Recall (sensitivity, TPR) | TP / (TP + FN) | of all real "yes", how many did it catch? |
| Specificity (TNR) | TN / (TN + FP) | of all real "no", how many were cleared? |
| F1 score | 2 x P x R / (P + R) | balance of precision and recall |
| ROC-AUC | area under the TPR vs FPR curve over all thresholds | ranking quality: 0.5 = random, 1 = perfect |
| PR-AUC | area under precision-recall curve | better than ROC-AUC for rare positives |
| Log loss | cross-entropy of predicted probabilities | quality of probabilities |
### Worked example
- 100 patients, 10 actually sick. The model flags 12: 8 sick (TP) and 4 healthy (FP); it misses 2 sick (FN); TN = 86.
- Accuracy = (8 + 86) / 100 = **94%**. Precision = 8 / 12 = **66.7%**. Recall = 8 / 10 = **80%**. F1 = 2 x 0.667 x 0.8 / (0.667 + 0.8) = **0.727**.
| Prefer high recall when... | Prefer high precision when... |
|---|---|
| missing a positive is costly | a false alarm is costly |
| cancer screening, fraud detection, security threats | spam filter (do not hide real mail), recommending a risky loan, legal decisions |
- **Threshold tuning**: lowering the threshold (0.5 -> 0.3) raises recall and lowers precision; choose using the business cost of each error, or the PR curve.
```py
from sklearn.metrics import confusion_matrix, classification_report, roc_auc_score, precision_recall_curve
pred = clf.predict(X_test); proba = clf.predict_proba(X_test)[:, 1]
print(confusion_matrix(y_test, pred))
print(classification_report(y_test, pred))            # precision, recall, F1 per class
print("ROC-AUC", roc_auc_score(y_test, proba))
prec, rec, thr = precision_recall_curve(y_test, proba)  # pick the threshold that meets e.g. recall >= 0.9
```
- Multiclass: macro average (each class equal), weighted average (by class size), micro average (pool all decisions).
## Hyperparameter Tuning
| Method | Idea |
|---|---|
| Manual / rules of thumb | start from good defaults |
| Grid search | try every combination (slow) |
| Random search | try random combinations (usually better for the same time) |
| Bayesian optimisation (Optuna, Hyperopt) | learns which areas are promising |
| Early stopping | stop boosting / training when validation stops improving |
```py
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold
from scipy.stats import randint
search = RandomizedSearchCV(RandomForestClassifier(random_state=0),
    {"n_estimators": randint(100, 600), "max_depth": [None, 6, 10, 20], "min_samples_leaf": randint(1, 10), "max_features": ["sqrt", 0.5]},
    n_iter=30, scoring="f1", cv=StratifiedKFold(5, shuffle=True, random_state=0), n_jobs=-1, random_state=0)
search.fit(X_train, y_train)
print(search.best_params_, search.best_score_)
best = search.best_estimator_                         # finally evaluate once on the untouched test set
```
## Explainability
- **Feature importance** (trees), **coefficients** (linear models), **permutation importance** (how much the score drops when a feature is shuffled), **SHAP values** (each feature's contribution to each single prediction), **LIME** (local simple explanation), partial dependence plots.
- Needed for trust, debugging, fairness and regulation (loans, insurance, healthcare).
```py
import shap
explainer = shap.TreeExplainer(rf)
shap_values = explainer.shap_values(X_test.iloc[:200])
shap.summary_plot(shap_values, X_test.iloc[:200])    # which features push predictions up or down
```
## Common Real-World Problems and Fixes
| Problem | Fix |
|---|---|
| imbalanced classes | right metrics, class weights, SMOTE, threshold tuning |
| data leakage | split first, pipelines, check suspicious "too good" features |
| too little data | simpler models, regularisation, augmentation, transfer learning, collect more |
| noisy labels | clean data, robust losses, label review |
| high-cardinality categories | target / frequency encoding, embeddings, CatBoost |
| concept / data drift after deployment | monitor input and prediction distributions, retrain on new data |
| unfair / biased predictions | check metrics per group, remove proxy features, fairness constraints |
| model works offline but not in production | training-serving skew: use the same feature code (feature store), validate inputs |
## From Notebook to Production (MLOps basics)
@chain Data -> Feature pipeline -> Training (tracked experiments) -> Model registry -> Deployment (API / batch) -> Monitoring -> Retraining trigger :: The ML lifecycle in production
| Practice | Tools |
|---|---|
| Experiment tracking (parameters, metrics, models) | MLflow, Weights and Biases |
| Data and model versioning | DVC, Git LFS, model registry |
| Feature store | Feast, Tecton, cloud feature stores |
| Pipelines / orchestration | Airflow, Prefect, Kubeflow, SageMaker / Vertex pipelines |
| Serving | FastAPI + Docker, BentoML, Seldon, KServe, SageMaker endpoints |
| Monitoring | Evidently, WhyLabs, Prometheus + Grafana (latency, errors, drift) |
| Batch vs online inference | nightly scoring jobs vs real-time API |
```py
# Serve a trained scikit-learn pipeline with FastAPI
import joblib
from fastapi import FastAPI
from pydantic import BaseModel
joblib.dump(model, "house_price.joblib")             # after training
api = FastAPI(); m = joblib.load("house_price.joblib")
class House(BaseModel):
    size_sqft: float
    rooms: int
    city: str
    age: int
@api.post("/predict")
def predict(h: House):
    return {"price": float(m.predict(pd.DataFrame([h.model_dump()]))[0])}
```
- **Deployment patterns**: shadow deployment (new model scores silently), canary / A/B tests on live traffic, champion-challenger (notebook 25 explains these deployment strategies).
- Models in production and their security (model theft, poisoning, input validation) are covered in notebooks 19 and 23.
## End-to-End Example: Predicting Customer Churn
1. **Problem**: predict which telecom customers will leave next month so the retention team can call them. Metric: recall on churners at a precision of at least 50% (calls cost money).
2. **Data**: 50,000 customers: tenure, monthly charges, contract type, complaints, data usage, payments; label churned yes / no (14% yes).
3. **EDA**: churners have month-to-month contracts, high charges, more complaints.
4. **Preprocessing**: impute missing charges with the median, one-hot encode contract / payment type, scale numbers, create "charges per month of tenure" and "complaints in last 90 days".
5. **Split**: stratified 80 / 20; 5-fold CV on the training part.
6. **Models**: baseline logistic regression (PR-AUC 0.48) -> random forest (0.58) -> LightGBM with class weights (0.64).
7. **Threshold**: choose 0.32 to get 72% recall at 51% precision.
8. **Explain**: SHAP shows contract type, complaints and tenure drive churn - shared with the business.
9. **Deploy**: weekly batch scoring job writes risk scores to the CRM; FastAPI endpoint for single customers.
10. **Monitor**: weekly drift report; retrain monthly; measure how many called customers stayed (business impact).
## ML Projects That Help Your Resume
| Project | Skills shown |
|---|---|
| House price prediction with a deployed API and a web form | regression, preprocessing, pipelines, FastAPI, Docker |
| Credit card fraud detection on imbalanced data | precision / recall trade-off, SMOTE, threshold tuning, PR-AUC |
| Customer segmentation with a dashboard | clustering, PCA, Streamlit |
| Movie / product recommender | collaborative filtering, matrix factorisation, embeddings |
| Sentiment analysis of product reviews | NLP, TF-IDF vs transformers |
| Demand / sales forecasting | time series features, LightGBM, backtesting |
| Model monitoring demo | drift detection, MLflow, retraining pipeline |
## Machine Learning Interview Questions
Q: What is the difference between supervised and unsupervised learning?
A: Supervised learning trains on labelled examples to predict a target (regression / classification); unsupervised learning finds structure in unlabelled data (clustering, dimensionality reduction).
Q: Explain the bias-variance trade-off.
A: Bias is error from overly simple assumptions (underfitting); variance is sensitivity to the training data (overfitting). Increasing complexity lowers bias but raises variance; we choose the complexity that minimises validation error.
Q: How do you detect and prevent overfitting?
A: Training score much higher than validation score signals it. Prevent with more data, simpler models, regularisation (L1 / L2, dropout), cross-validation, early stopping, pruning and feature selection.
Q: L1 vs L2 regularisation?
A: L1 adds the absolute weights and drives some to zero (feature selection); L2 adds squared weights and shrinks them smoothly (handles correlated features).
Q: Precision vs recall - when do you prefer each?
A: Precision when false positives are costly (spam filtering), recall when false negatives are costly (disease or fraud detection); F1 balances both.
Q: Why is accuracy misleading for imbalanced data?
A: Predicting the majority class gives high accuracy while missing every minority case; use precision, recall, F1 and PR-AUC instead.
Q: What is cross-validation?
A: Splitting training data into k folds, training on k-1 and validating on the remaining fold k times, then averaging, to get a reliable performance estimate and tune hyperparameters.
Q: Bagging vs boosting?
A: Bagging trains models independently on bootstrap samples and averages them to reduce variance (random forest); boosting trains models sequentially, each correcting previous errors, to reduce bias (XGBoost).
Q: How does a decision tree choose a split?
A: It tries candidate splits and chooses the one that most reduces impurity (Gini or entropy for classification, variance for regression).
Q: Why does random forest work better than one tree?
A: Averaging many de-correlated trees (random rows and random feature subsets) reduces variance while keeping low bias.
Q: How does gradient boosting work?
A: It starts with a simple prediction and repeatedly fits small trees to the current residuals (gradients of the loss), adding each with a learning rate.
Q: What is the kernel trick in SVM?
A: Computing similarities as if data were mapped to a higher-dimensional space without doing the mapping, so a linear boundary there becomes non-linear in the original space.
Q: Explain k-means and how to choose k.
A: Assign points to the nearest centroid and move centroids to cluster means until stable; choose k using the elbow method or silhouette score and business sense.
Q: What is PCA?
A: A linear method that projects data onto orthogonal directions of maximum variance to reduce dimensions while keeping most information.
Q: What is data leakage?
A: When information unavailable at prediction time (from the test set or the future) is used in training, producing unrealistically good results; prevent with proper splits and pipelines.
Q: How do you handle missing values?
A: Understand why they are missing, then drop, impute (mean / median / mode / model-based), or add missing-indicator features; fit imputers on training data only.
Q: Why do we scale features?
A: Distance- and gradient-based algorithms are dominated by large-scale features and converge slowly otherwise; tree models do not need scaling.
Q: What is gradient descent and what does the learning rate do?
A: An iterative method that updates parameters opposite to the loss gradient; the learning rate controls step size - too high diverges, too low is slow.
Q: What is ROC-AUC?
A: The probability that the model ranks a random positive above a random negative, computed from the TPR vs FPR curve over all thresholds.
Q: How would you deploy and monitor a model?
A: Package the preprocessing and model in a pipeline, serve via an API or batch job in a container, version it in a registry, and monitor latency, errors, input drift and prediction quality with retraining triggers.
Q: Parametric vs non-parametric models?
A: Parametric models have a fixed number of parameters (linear regression); non-parametric models grow with the data (KNN, decision trees).
Q: What is the curse of dimensionality?
A: As features increase, data becomes sparse and distances less meaningful, so models need far more data and overfit more easily.
