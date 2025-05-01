import psycopg2
from flask import Flask, jsonify, request
from python.current_reports.current_reports import fetch_client_data, process_client_data, calculate_profit_loss, prepare_final_data
from python.current_reports.monthly_details import fetch_monthly_report
from python.timesheet.timesheet import submit_timesheet
from python.employee.add_employee import add_new_employee
from python.employee.get_employees import getEmployees
from python.employee.update_employee import update_employee
from python.employee.delete_employee import delete_employee
from python.individual_report.individual_report import getEmployeeWorkYears, get_client_hours_for_employee, get_individual_monthly_report, get_monthly_chart
from python.clients.get_client import getClients
from python.clients.delete_clients import delete_client
from python.clients.add_client import add_new_client
from python.clients.update_client import update_client
from python.employee_reports.get_employee_ids import getEmployeeIDs
from python.employee_reports.get_years_for_employee_report import getEmployeeReportWorkYears
from python.employee_reports.get_employee_report_data import get_report_data
from python.employee_reports.get_individual_employee import get_individual_employee
from python.predictive_reports.predictive_reports import get_employee_client_hours_with_wages
from python.predictive_reports.get_client_payments import fetch_client_payments
app = Flask(__name__)




@app.route('/api/client_hours', methods=['GET'])
def get_client_hours():
    """
    Fetches all necessary data from the database for each client based on the selected date range,
    and calculates total hours worked, cost, and profit/loss %.
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    try:
        rows = fetch_client_data(start_date, end_date)
        client_data = process_client_data(rows)
        client_data = calculate_profit_loss(client_data, start_date, end_date)
        response_data = prepare_final_data(client_data)

        return jsonify(response_data)

    except Exception as e:
        print(f"Error fetching or processing data: {e}")
        return jsonify({'error': 'Error fetching data'}), 500
    
@app.route('/api/monthly_report', methods=['GET'])
def get_monthly_report():
    client = request.args.get('client')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not client or not start_date or not end_date:
        return jsonify({"error": "Client, Start Date, and End Date parameters are required"}), 400

    try:
        response_data = fetch_monthly_report(client, start_date, end_date)
        return response_data  

    except Exception as e:
        print(f"Error fetching or processing data: {e}")
        return jsonify({'error': 'Error fetching data'}), 500


@app.route('/submitTimesheet', methods=['POST'])
def submit_timesheet_route():
    return submit_timesheet()  


@app.route('/add_new_employee', methods=['POST'])
def insert_employee():
     return add_new_employee()


@app.route('/add_new_client', methods=['POST'])
def insert_client():
    return add_new_client()

@app.route('/getAllEmployees', methods=['GET'])
def get_all_employees():
    response_data =getEmployees()
    return response_data

@app.route('/update_employee', methods=['POST'])
def save_update_employee():
    print("reached app.py")
    data = request.get_json()  
    print("Received data:", data)
    
    try:
        update_employee(data)
        return jsonify({"message": "Employee updated successfully"}), 200
    except Exception as e:
        print(f"Error updating employee: {e}")
        return jsonify({"message": "Error updating employee"}), 500
    
@app.route('/delete_employee', methods=['POST'])
def call_delete_employee():
    data = request.get_json()
    print("Received data:", data)
    
    try:
        delete_employee(data)
        return jsonify({"message": "Employee deleted successfully"}), 200
    except Exception as e:
        print(f"Error deleting employee: {e}")
        return jsonify({"message": "Error deleting employee"}), 500
    

@app.route('/getEmployeeWorkYears',methods=['POST'])
def get_years_for_employee():
    data = request.get_json()
    print("Recieved data:",data)
    try:
        response_data = getEmployeeWorkYears(data)
        return response_data
    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({'error': 'Error fetching data'}), 500
    

@app.route('/getEmployeeYearlyWork', methods=['POST'])
def get_hours_for_client():
    data = request.get_json()
    print("Received data:", data)

    try:
        response_data = get_client_hours_for_employee(data)  
        return jsonify(response_data)  
    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({'error': 'Error fetching data'}), 500

@app.route('/getMonthlyIndividualClients', methods=['POST'])
def get_individual_report_monthly_details():
    data = request.get_json()
    print("Received data:", data)

    try:
        response_data = get_individual_monthly_report(data)  
        return jsonify(response_data)  
    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({'error': 'Error fetching data'}), 500


@app.route('/getFullMonthlyWorkEmployee', methods=['POST'])
def monthly_individual_chart():
    data = request.get_json()
    print("Received data:", data)

    try:
        response_data = get_monthly_chart(data)  
        return jsonify(response_data)  
    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({'error': 'Error fetching data'}), 500


@app.route('/getAllClients', methods=['GET'])
def get_all_clientss():
    response_data =getClients()
    return response_data


@app.route('/delete_client', methods=['POST'])
def call_delete_client():
    data = request.get_json()
    print("Received data:", data)
    
    try:
        delete_client(data)
        return jsonify({"message": "Client deleted successfully"}), 200
    except Exception as e:
        print(f"Error deleting employee: {e}")
        return jsonify({"message": "Error deleting client"}), 500

@app.route('/update_client', methods=['POST'])
def call_update_client():
    data = request.get_json()
    print("Received data:", data)
    return update_client()



@app.route('/getEmployeeIDs', methods=['POST'])
def get_employee_ids():

    try:
        response_data = getEmployeeIDs()  
        return jsonify(response_data)  
    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({'error': 'Error fetching data'}), 500
        

@app.route('/getEmployeeReportWorkYears', methods=['POST'])
def get_employee_report_years():
    try:
        response_data = getEmployeeReportWorkYears()
        return jsonify(response_data)  
    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({'error': 'Error fetching data'}), 500
    

@app.route('/getEmployeeReport', methods=['POST'])
def get_employee_report():
    data = request.get_json()
    print("Received data:", data)

    try:
        response_data= get_report_data(data)
        return jsonify(response_data)  
    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({'error': 'Error fetching data'}), 500

@app.route('/getEmployeeInfo', methods=['POST'])
def get_employee_info():
    data = request.get_json()
    print("Received data:", data)

    try:
        response_data = get_individual_employee(data)  
        return jsonify(response_data)  
    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({'error': 'Error fetching data'}), 500

@app.route('/predicted_reports', methods=['POST'])
def predictive_report_call():
    print("Reached App.py for predictive reports")

    try:
        data = request.get_json()
        months = int(data.get('months', 12))  

        response_data = get_employee_client_hours_with_wages(months)  
        return jsonify(response_data) 
    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({'error': 'Error fetching data'}), 500

    
@app.route('/getClientPaySchedules', methods=['POST'])
def get_client_pay_schedules():
    try:
        response_data = fetch_client_payments()
        return jsonify(response_data)  
    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({'error': 'Error fetching data'}), 500
    





if __name__ == '__main__':
    app.run(port=5001)
