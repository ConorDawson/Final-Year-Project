# Predictive Client Profitability and Resource Management System

## Overview
This project explores how **predictive analytics** can enhance **client profitability assessment** and **resource allocation** for businesses that rely on time-based client servicing.  
The system uses **machine learning models**, specifically a **Random Forest Regressor**, to forecast future resource requirements based on historical timesheet and profitability data.  

The goal is to provide a tool that allows businesses to identify low-profit clients, predict future workloads, and make data-driven decisions to improve overall profitability.

---

## Project Objective
To determine whether predictive cost analysis — when combined with employee timesheet tracking — can:
- Improve the accuracy of client profitability assessments  
- Enhance business decision-making for resource management  
- Support strategic planning by visualizing profit trends and forecasts  

---

## Reasoning and Methodology

### 1. Data-Driven Profit Analysis
Traditional client profit analysis methods are largely **manual** and **reactive**, often identifying unprofitable clients after the loss has already occurred.  
This project adopts a **data-driven approach** by leveraging historical work hours, billing data, and profit reports to **predict** future resource requirements and client profitability.

### 2. Predictive Modelling Approach
Initially, the project explored several statistical and machine learning methods:
- **James-Stein Estimator:** Investigated for its potential to reduce prediction variance but proved challenging in practical implementation.
- **Genetic Algorithms & SVMs:** Tested but deprioritized due to complexity and performance issues.
- **Random Forest Regressor:** Chosen for its balance of **accuracy**, **interpretability**, and **robustness** with small to medium-sized datasets.  

The **Random Forest Regressor** was ultimately selected due to its:
- Low tendency to overfit  
- Ability to handle multivariate data  
- Built-in feature importance analysis  

---

## System Architecture

### 1. Core Components
- **Frontend:** React.js (for building an intuitive interface and visualization of profit/loss data)
- **Backend:** Node.js with Express (for handling requests, routing, and integration with predictive models)
- **Machine Learning Layer:** Python (using Scikit-learn for model training, evaluation, and predictions)
- **Database:** PostgreSQL (to store client data, employee timesheets, and profit history)

### 2. Data Flow
1. Employee timesheet and client data are stored in PostgreSQL.  
2. Python scripts process this data to generate training datasets.  
3. The **Random Forest Regressor** model predicts future resource usage and profitability.  
4. The React interface visualizes:
   - Historical profit and resource data  
   - Predicted future performance  
   - Cost breakdowns per client or employee  

---

## Technologies Used

| Category | Technology | Purpose |
|-----------|-------------|----------|
| **Frontend** | React.js, Chart.js | Building UI and displaying analytics/graphs |
| **Backend** | Node.js, Express | Handling API requests and routing |
| **Machine Learning** | Python, Scikit-learn, Pandas, NumPy | Data preprocessing and model training |
| **Database** | PostgreSQL | Storing client, employee, and profit data |
| **Visualization** | Plotly, Matplotlib (optional) | Graphical representation of results |
| **Version Control** | Git & GitHub | Source code management and collaboration |

---

## Key Features
- **Profit Prediction:** Uses Random Forest regression to predict client profitability.  
- **Resource Forecasting:** Estimates future employee hour requirements per client.  
- **Dynamic Reporting:** Generates customizable visual reports for meetings or management.  
- **Data Integration:** Pulls timesheet data directly into predictive workflows.  
- **Feature Importance Insights:** Highlights which client attributes most affect profitability.  

---

## Machine Learning Process

1. **Data Preprocessing:**  
   - Cleaned and normalized timesheet and client profitability data.  
   - Filtered by relevant features (e.g., employee role, project duration, client type).  

2. **Model Training:**  
   - Implemented using `RandomForestRegressor` from `scikit-learn`.  
   - Tuned parameters such as `n_estimators` and `max_depth` to balance accuracy and performance.  

3. **Model Evaluation:**  
   - Evaluated using Mean Absolute Error (MAE) and R² score.  
   - Tested on multiple data subsets to ensure consistency.  

4. **Deployment:**  
   - Exposed model predictions via REST API endpoints for use in the frontend.  

---

## Lessons Learned & Reasoning

- **Data Quality Is Crucial:** The model’s accuracy heavily depends on consistent, complete, and clean data.  
- **Balance Between Accuracy and Performance:** Random Forest provided reliable results without heavy computational cost.  
- **Integration Over Innovation:** Embedding predictive features into existing workflows (like timesheets) improves real-world usability.  
- **Iterative Development:** Frequent testing and retraining helped fine-tune performance and usability.  

---

## Future Improvements
- Implement role-based user authentication for administrators.  
- Add predictive breakdowns at the employee level.  
- Integrate real-time data synchronization from external systems (e.g., CRM or payroll).  
- Automate model retraining as new data is collected.  

---

## Conclusion
This project successfully demonstrates that **predictive cost analysis**, when integrated with **employee timesheet tracking**, can significantly improve **profitability forecasting** and **resource management**.  
Although real-world implementation requires large, consistent datasets and ongoing refinement, this prototype proves that machine learning models like **Random Forest Regressors** can provide actionable insights that help businesses optimize their operations and profitability.

---

## Author
**Conor Dawson**  
BSc (Hons) in Software Development 
