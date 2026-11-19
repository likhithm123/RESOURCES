# Data Scientist & Data Analyst: Statistics, SQL & Pandas
An applied technical handbook on end-to-end data pipelines, statistical hypothesis testing (p-values, A/B testing), advanced SQL analytical window functions, and Pandas performance optimization.

## The Data Lifecycle & Mental Model
- **The Role Distinction:**
  - **Data Analyst:** Focuses on *historical hindsight and insight* ("What happened last quarter? Why did customer churn increase in Germany? What is our monthly recurring revenue?").
  - **Data Scientist:** Focuses on *future foresight and automated decisions* ("Which users will churn next month? What price point maximizes checkout conversion using machine learning?").
- **Non-Technical Real-Life Analogy (The Crude Oil Refinery):**
  - **Raw Data (Crude Oil):** Sticky, impure, unformatted server logs and clickstream events straight out of the ground.
  - **ETL / Cleaning (Distillation Tower):** Filtering out missing values, imputing nulls, casting types, and aggregating tables.
  - **Data Analyst (Quality Control & Operations Dashboard):** Measures fuel efficiency, tracks daily output barrels, and alerts managers when a pipe is leaking.
  - **Data Scientist (Petrochemical Engineer):** Uses refined petroleum to synthesize new high-performance rocket fuel and polymers (predictive neural networks and personalization models).

@flow [Raw Clickstream Logs & Transactions] | [ETL Ingestion & Cleaning] | [Feature Engineering & Normalization] | [Statistical Hypothesis & A/B Testing] | [Executive Dashboards & ML Predictions] :: The Data Science Analytics Pipeline

## Advanced SQL for Analytics: Window Functions & CTEs
Window functions compute aggregates over partitions without collapsing rows (unlike `GROUP BY`):

```sql
-- Calculate 7-Day Moving Average Revenue and Customer Rank by Spend
WITH DailyRevenue AS (
    SELECT 
        DATE(created_at) AS order_date,
        SUM(amount) AS daily_total
    FROM orders
    WHERE status = 'completed'
    GROUP BY DATE(created_at)
)
SELECT 
    order_date,
    daily_total,
    -- 7-day trailing moving average window
    AVG(daily_total) OVER (
        ORDER BY order_date 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7d
FROM DailyRevenue
ORDER BY order_date DESC;

-- Dense Rank of Top 3 Spending Customers per Country
SELECT 
    customer_id, country, total_spend,
    DENSE_RANK() OVER (PARTITION BY country ORDER BY total_spend DESC) AS country_rank
FROM customer_aggregates
QUALIFY country_rank <= 3;
```

## Statistical Foundations & A/B Testing
- **Null Hypothesis ($H_0$):** The new checkout design has zero effect on conversion rate.
- **Alternative Hypothesis ($H_1$):** The new checkout design increases conversion rate.
- **p-value:** The probability of observing results at least as extreme as our experiment purely by random chance, assuming $H_0$ is true. If $p < 0.05$ (5% threshold), we reject the null hypothesis and declare statistical significance!
- **Type I Error ($\alpha$):** False positive (claiming a feature works when it was just random noise).
- **Type II Error ($\beta$):** False negative (failing to detect a real improvement).
- **Minimum Detectable Effect (MDE) & Power ($1 - \beta = 80\%$):** Determines required sample size before launching any experiment!

## High-Performance Pandas Operations
```python
import numpy as np
import pandas as pd

# Vectorized operation vs Slow for-loop
df = pd.DataFrame({
    'unit_price': np.random.uniform(10.0, 100.0, 1000000),
    'quantity': np.random.randint(1, 10, 1000000),
    'discount': np.random.choice([0.0, 0.1, 0.2], 1000000)
})

# FAST: Vectorized NumPy backend (C-speed, SIMD instructions)
df['total_revenue'] = df['unit_price'] * df['quantity'] * (1 - df['discount'])

# SLOW ANTI-PATTERN (DO NOT USE IN PRODUCTION):
# df['total_revenue'] = df.apply(lambda row: row['unit_price'] * row['quantity'] * (1 - row['discount']), axis=1)
```
- **Performance:** Vectorized operations run ~100x to 300x faster than `.apply()` or Python row iterations!
