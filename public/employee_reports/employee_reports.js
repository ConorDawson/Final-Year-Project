window.onload = async function(){

    const ids = await getEmployeeID();
    const years = await getReportWorkYears();
    console.log("Years:", years);

    if (Array.isArray(ids) && ids.length > 0) { 
    console.log("Employee IDs:", ids);

    const idSelect = document.getElementById('employee_id');
    idSelect.innerHTML = ""; 

    for (let id of ids) {  
        const idOption = document.createElement('option');
        idOption.value = id;
        idOption.textContent = id;
        idSelect.appendChild(idOption);
    }
} else {
    console.log("No ids available.");
}



if (Array.isArray(years) && years.length > 0) {
    console.log("Employee work years:", years);

    const yearSelect = document.getElementById('select_year');
    yearSelect.innerHTML = ""; 

    for (let year of years) {  
        const yearOption = document.createElement('option');
        yearOption.value = year;
        yearOption.textContent = year;
        yearSelect.appendChild(yearOption);
    }
} else {
    console.log("No years available.");
}


    document.getElementById("generateReport").addEventListener("click", async function () {
        id = document.getElementById("employee_id").value;
        year = document.getElementById("select_year").value;
        console.log("Selected ID:", id);
        console.log("Selected Year:", year);
        getEmployeeInfo(id);

        getEmployeeInfo(id);
        const clientHours = await getEmployeeReport();
        generateReportTable(clientHours);
        getFullMonthlyWork();

    });

    
}

async function getEmployeeID() {

    try {
        const response = await axios.post('/getEmployeeIDs', {
            
        });
        console.log(response.data);
        return response.data;
    } catch (err) {
        console.error('Error fetching employee ids:', err);
        return null;
    }
};

async function getReportWorkYears(){
    try {
        const response = await axios.post('/getEmployeeReportWorkYears', {
            
        });
        console.log(response.data);
        return response.data;
    } catch (err) {
        console.error('Error fetching years:', err);
        return null;
    }

}


async function getEmployeeReport() {
    id = document.getElementById("employee_id").value;
    year = document.getElementById("select_year").value;
    try{
        const response = await axios.post('/getEmployeeReport',{
            id: id,
            year: year
        })
        console.log(response.data);
        return response.data;
    }catch (err){
        console.error('Error fetching employee report:', err);
        return null;
    }
}

function generateReportTable(clientHours) {
    console.log("Client Hours in generate table:", clientHours);  

    if (!clientHours || !clientHours.client_hours || !Array.isArray(clientHours.client_hours)) {
        console.log("No valid client_hours data available.");
        return;
    }

    const tableBody = document.getElementById("individualReportTableBody");
    tableBody.innerHTML = '';  

    let totalHoursSum = 0;  

    // Loop through client_hours array
    clientHours.client_hours.forEach(([clientName, totalHours]) => {
        totalHours = parseFloat(totalHours);

        const row = document.createElement('tr');

        const clientCell = document.createElement('td');
        clientCell.textContent = clientName;
        row.appendChild(clientCell);

        const hoursCell = document.createElement('td');
        hoursCell.textContent = totalHours.toFixed(2);
        row.appendChild(hoursCell);

        const detailCell = document.createElement('td');
        const detailButton = document.createElement('button');
        detailButton.classList.add('detailButton');
        detailButton.setAttribute('data-client', clientName);

        const icon = document.createElement('i');
        icon.classList.add('fa-solid', 'fa-circle-info');
        detailButton.appendChild(icon);
        detailCell.appendChild(detailButton);
        row.appendChild(detailCell);

        tableBody.appendChild(row);
        totalHoursSum += totalHours;

        detailButton.addEventListener('click', function() {
            const client = detailButton.getAttribute('data-client');
            getMonthlyIndividualClients(client);
        });
    });

    
    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `<td><b>Total</b></td><td><b>${totalHoursSum.toFixed(2)}</b></td><td></td>`;
    tableBody.appendChild(totalRow);
}




function generateMonthlyReportTable(response) {
    
    const monthlyData = response.monthly_report;

    const modalTableBody = document.getElementById("modalTableBody");
    modalTableBody.innerHTML = ''; 

    // Populate the table with data
    monthlyData.forEach((data) => {
        const row = document.createElement('tr');
        
    
        const monthCell = document.createElement('td');
        monthCell.textContent = data.month; 
        row.appendChild(monthCell);
        
        
        const hoursCell = document.createElement('td');
        hoursCell.textContent = data.total_hours; 
        row.appendChild(hoursCell);
        
        
        modalTableBody.appendChild(row);
    });

    
    const modalTitle = document.getElementById("modalTitle");
    modalTitle.textContent = "Monthly Report"; 

    
    const modal = document.getElementById("t");
    modal.style.display = "block"; 
}

document.getElementById("closeModal").addEventListener("click", function() {
    const modal = document.getElementById("t");
    modal.style.display = "none"; 
});

window.addEventListener("click", function(event) {
    const modal = document.getElementById("t");
    if (event.target === modal) {
        modal.style.display = "none"; 
    }
});


function getMonthlyIndividualClients(client) {
    year = document.getElementById("select_year").value;
    employee_id = sessionStorage.getItem("employee_id");
    company_name = client;
    console.log("Client Name: ", company_name);
    console.log("Year: ", year);        
    console.log("Employee ID: ", employee_id);

    axios.post('/getMonthlyIndividualClients', {
        employee_id,
        year,
        company_name
    }).then((response) => {
        console.log(response.data);
        const monthlyData = response.data;
        generateMonthlyReportTable(monthlyData);
    }).catch((error) => {
        console.error('Error fetching monthly individual clients:', error);
        alert('Error fetching monthly individual clients. Please try again.');
    }
    );
}

function getFullMonthlyWork() {
    const year = document.getElementById("select_year").value;
    const employee_id = document.getElementById("employee_id").value;
    console.log("Year: ", year);
    console.log("Employee ID: ", employee_id);

    axios.post('/getFullMonthlyWorkEmployee', {
        employee_id,
        year
    }).then((response) => {
        console.log('getFullMonthlyWork', response.data);
        const monthlyChartData = response.data.monthly_chart; 
        console.log('monthlyChartData', monthlyChartData);
        createLineChart(monthlyChartData);

    }).catch((error) => {
        console.error('Error fetching monthly chart clients:', error);
        alert('Error fetching monthly chart clients. Please try again.');
    });
}


function createLineChart(monthlyChartData) {
    
    const labels = monthlyChartData.map(item => item.month);
    const totalHours = monthlyChartData.map(item => parseFloat(item.total_hours));

    
    document.getElementById("monthlyBreakdownChart").innerHTML = "<canvas id='monthlyChart'></canvas>";
    year = document.getElementById("select_year").value;

    document.getElementById("monthlyBreakdownH1").textContent = "Monthly Work Breakdow for  " + year;

    
    const ctx = document.getElementById('monthlyChart').getContext('2d');

    // Create the line chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Hours',
                data: totalHours,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    createPieChart();
}

async function createPieChart() {
    const year = document.getElementById("select_year").value;
    const employee_id = sessionStorage.getItem("employee_id");
    
    try {
        const response = await axios.post('/getEmployeeYearlyWork', {
            employee_id,
            year
        });
        console.log(response.data);
        const chartData = response.data.client_hours; 

        // Extract client names and hours from the response data
        const clientNames = chartData.map(item => item[0]);
        const totalHours = chartData.map(item => parseFloat(item[1]));

    
        document.getElementById("clietnWorkBreakdown").innerHTML = "<canvas id='clientPieChart'></canvas>";

        
        const ctx = document.getElementById('clientPieChart').getContext('2d');

        // Create the pie chart
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: clientNames,
                datasets: [{
                    label: 'Client Work Hours',
                    data: totalHours,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true
            }
        });

    } catch (err) {
        console.error('Error fetching employee yearly work:', err);
        alert('Error fetching employee yearly work. Please try again.');
    }
}


getEmployeeInfo = async (id) => {
    try {
        const response = await axios.post('/getEmployeeInfo', {
            id: id
        });
        console.log(response.data);
        fillEmployeeInfo(response.data.employee_data);
        } catch (err) {
        console.error('Error fetching employee info:', err);
    }
}

async function fillEmployeeInfo(employee_data) {
    if (!employee_data || employee_data.length === 0) {
        console.error('No employee data received.');
        return;
    }

    
    const [forename, surname, email, role, wage] = employee_data[0];
    const id = document.getElementById("employee_id").value; // Get employee ID from the input/select

    // Assign data to the HTML elements using `textContent`
    document.getElementById("employeeName").textContent = `Name: ${forename} ${surname}`;
    document.getElementById("employeeID").textContent = `Employee ID: ${id}`;
    document.getElementById("employeeEmail").textContent = `Email: ${email}`;
    document.getElementById("employeeWage").textContent = `Hourly Wage: ${wage}`;
    document.getElementById("employeeDepartment").textContent = `Employee Department: ${role}`;

    console.log("Employee information filled successfully!");
}
