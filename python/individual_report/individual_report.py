import psycopg2
from flask import Flask, jsonify, request
from python.database import get_db_connection

app = Flask(__name__)

# XOR decryption function
def xor_decrypt(text, key=5):
    """
    XOR decryption for the encrypted text.
    """
    return ''.join([chr(ord(char) ^ key) for char in text])

# XOR encryption function
def xor_encrypt(text, key=5):
    """
    XOR encryption for the given text.
    """
    return ''.join([chr(ord(char) ^ key) for char in text])


def getEmployeeWorkYears(data):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        employee_id = data.get('employee_id')
        print("Reached getEmployeeWorkYears")

        # Query to get all distinct years worked
        cursor.execute("""
            SELECT DISTINCT EXTRACT(YEAR FROM work_date) AS year
            FROM timesheet_hours2
            WHERE employee_id = %s
            ORDER BY year DESC;
        """, (employee_id,))

        years = [row[0] for row in cursor.fetchall()]  

        if years:
            return jsonify({'work_years': years}) 
        else:
            return jsonify({'error': 'No work records found for employee'}), 404

    except Exception as e:
        print("Error fetching data:", e)
        return jsonify({'error': 'Internal Server Error'}), 500
    finally:
        if conn:
            conn.close()

def get_client_hours_for_employee(data):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        employee_id = data.get('employee_id')
        year = data.get('year')
        print("Reached get_client_hours")

        cursor.execute("""
            SELECT
                th.company_name,
                SUM(th.hours) as total_hours
            FROM timesheet_hours2 th
            WHERE th.employee_id = %s AND EXTRACT(YEAR FROM th.work_date) = %s
            GROUP BY th.company_name;
        """, (employee_id, year))

        client_hours = cursor.fetchall()
        print(client_hours)

        decrypted_client_hours = [(xor_decrypt(company_name), total_hours) for company_name, total_hours in client_hours]

        if decrypted_client_hours:
            return {'client_hours': decrypted_client_hours}  
        else:
            return {'error': 'No client hours found for employee'}

    except Exception as e:
        print("Error fetching data:", e)
        return {'error': 'Internal Server Error'}  
    
    finally:
        if conn:
            conn.close()

def get_individual_monthly_report(data):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        employee_id = data.get('employee_id')
        year = data.get('year')
        company_name = data.get('company_name')

        encrypted_company_name = xor_encrypt(company_name)  
        print("Reached get_individual_monthly_report")

        cursor.execute("""
            SELECT
                EXTRACT(MONTH FROM th.work_date) AS month,
                SUM(th.hours) AS total_hours
            FROM timesheet_hours2 th
            WHERE th.employee_id = %s 
                AND EXTRACT(YEAR FROM th.work_date) = %s 
                AND th.company_name = %s
            GROUP BY EXTRACT(MONTH FROM th.work_date)
            ORDER BY month;
        """, (employee_id, year, encrypted_company_name))

        monthly_report = cursor.fetchall()
        print(monthly_report)

        month_names = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]
        
        report_data = []
        for month, total_hours in monthly_report:
            month_name = month_names[int(month) - 1]  
            report_data.append({ 'month': month_name, 'total_hours': total_hours })

        if report_data:
            return {'monthly_report': report_data}  
        else:
            return {'error': 'No monthly report found for employee'}

    except Exception as e:
        print("Error fetching data:", e)
        return {'error': 'Internal Server Error'}  
    
    finally:
        if conn:
            conn.close()


def get_monthly_chart(data):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        employee_id = data.get('employee_id')
        year = data.get('year')
      
        print("Reached get_monthly_chart")

        cursor.execute("""
            SELECT
                EXTRACT(MONTH FROM th.work_date) AS month,
                SUM(th.hours) AS total_hours
            FROM timesheet_hours2 th
            WHERE th.employee_id = %s 
                AND EXTRACT(YEAR FROM th.work_date) = %s 
            GROUP BY EXTRACT(MONTH FROM th.work_date)
            ORDER BY month;
        """, (employee_id, year))

        monthly_data = cursor.fetchall()
        print(f"Fetched monthly data: {monthly_data}")

        if not monthly_data:
            return {'error': 'No monthly chart data found for employee'}

        month_names = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]
        
        chart_data = []
        for month, total_hours in monthly_data:
            if 1 <= int(month) <= 12:
                month_name = month_names[int(month) - 1]  # Convert month number to month name
                chart_data.append({'month': month_name, 'total_hours': total_hours})

        if chart_data:
            return {'monthly_chart': chart_data}  # Return the structured chart data
        else:
            return {'error': 'No valid monthly chart data found for employee'}
        
    except Exception as e:
        print("Error fetching data:", e)
        return {'error': 'Internal Server Error'}  
    
    finally:
        if conn:
            conn.close()
