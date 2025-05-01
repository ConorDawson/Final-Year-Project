from flask import Flask, jsonify, request
from python.database import get_db_connection
from datetime import datetime
from collections import defaultdict
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import numpy as np

ENCRYPTION_KEY = 5
app = Flask(__name__)

def xor_decrypt(cipher_text):
    return ''.join(chr(ord(char) ^ ENCRYPTION_KEY) for char in cipher_text)

def get_employee_client_hours_with_wages(num_months):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT 
        c.company_name,
        th.employee_id,
        th.hours,
        th.work_date,
        u.employee_wage
    FROM clients c
    LEFT JOIN timesheet_hours2 th ON th.company_name = c.company_name
    LEFT JOIN employee_pay u ON u.employee_id = th.employee_id
    ORDER BY c.company_name, th.employee_id, th.work_date;
    """

    cursor.execute(query)
    rows = cursor.fetchall()

    decrypted_rows = []
    for row in rows:
        company_name, employee_id, hours, work_date, wage = row
        company_name = xor_decrypt(company_name)
        decrypted_rows.append((company_name, employee_id, hours, work_date, wage))

    grouped_data = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: {"hours": 0.0, "cost": 0.0})))
    latest_wage_per_employee = {}

    for company, emp_id, hours, date, wage in decrypted_rows:
        if not date or not emp_id:
            continue

        if isinstance(date, str):
            date = datetime.strptime(date[:10], "%Y-%m-%d")

        month_key = date.strftime("%Y-%m")

        if wage is not None:
            latest_wage_per_employee[emp_id] = float(wage)

        if hours:
            wage_float = float(wage) if wage else 0.0
            grouped_data[company][emp_id][month_key]["hours"] += float(hours)
            grouped_data[company][emp_id][month_key]["cost"] += wage_float * float(hours)

    # Prepare global training data
    X_all = []
    y_all = []

    employee_month_data = defaultdict(list)
    for company, employees in grouped_data.items():
        for emp_id, months in employees.items():
            df = pd.DataFrame([
                {"Month": month, "Hours": data["hours"]}
                for month, data in months.items()
            ])
            df["Month"] = pd.to_datetime(df["Month"])
            df = df.sort_values("Month")

            if len(df) < 3:
                continue

            df["MonthIndex"] = (df["Month"] - df["Month"].min()).dt.days // 30
            df["MonthNum"] = df["Month"].dt.month
            df["Quarter"] = df["Month"].dt.quarter
            df["Lag_1"] = df["Hours"].shift(1)
            df["Lag_2"] = df["Hours"].shift(2)
            df = df.dropna()

            if len(df) < 3:
                continue

            X_emp = df[["MonthIndex", "MonthNum", "Quarter", "Lag_1", "Lag_2"]].values
            y_emp = df["Hours"].values

            X_all.extend(X_emp)
            y_all.extend(y_emp)
            employee_month_data[emp_id].append((df, company))

    if len(X_all) == 0:
        return jsonify({"error": "Not enough data to train the model."})

    # Train global model
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_all)
    y_all = np.array(y_all)

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_scaled, y_all)

    # Evaluate global model
    y_pred = model.predict(X_scaled)
    r2 = r2_score(y_all, y_pred)
    mae = mean_absolute_error(y_all, y_pred)
    rmse = np.sqrt(mean_squared_error(y_all, y_pred))

    print(f"Model Evaluation:")
    print(f"  R² Score: {r2:.4f}")
    print(f"  MAE: {mae:.2f}")
    print(f"  RMSE: {rmse:.2f}")

    # Generate predictions for each employee
    result = []

    for emp_id, data_list in employee_month_data.items():
        for df, company in data_list:
            last_month = df["Month"].max()
            last_index = df["MonthIndex"].max()
            current_lag1 = df.iloc[-1]["Hours"]
            current_lag2 = df.iloc[-2]["Hours"]

            wage_float = latest_wage_per_employee.get(emp_id, 0.0)

            for i in range(1, num_months + 1):
                future_index = last_index + i
                future_month = last_month + pd.DateOffset(months=i)
                month_num = future_month.month
                quarter = (month_num - 1) // 3 + 1

                input_features = [[future_index, month_num, quarter, current_lag1, current_lag2]]
                input_scaled = scaler.transform(input_features)

                pred = model.predict(input_scaled)[0]
                result.append({
                    "Client": company,
                    "Employee ID": emp_id,
                    "Month": future_month.strftime("%Y-%m"),
                    "Total Hours Worked": round(pred, 2),
                    "Total Cost (£)": round(pred * wage_float, 2)
                })

                current_lag2 = current_lag1
                current_lag1 = pred

    return result


if __name__ == "__main__":
    app.run(debug=True)
