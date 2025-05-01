window.onload = async function () {
    console.log("individual_report.js loaded");
    console.log(sessionStorage.getItem("lastname") + " " + sessionStorage.getItem("firstname") + " " + sessionStorage.getItem("employee_id"));

    forename = sessionStorage.getItem("firstname");
    surname = sessionStorage.getItem("lastname");
    employee_id = sessionStorage.getItem("employee_id");


    const years = await getEmployeeWorkYears();
    if (years && years.work_years.length > 0) {
        console.log("Employee work years:", years.work_years);

        const yearSelect = document.getElementById('select_year');
        yearSelect.innerHTML = ""; 

        for (let year of years.work_years) {
            const yearOption = document.createElement('option');
            yearOption.value = year;
            yearOption.textContent = year;
            yearSelect.appendChild(yearOption);
        }
    } else {
        console.log("No years available.");
    }

    const Year = document.getElementById("select_year").value;
    const initalReportData = await getEmployeeYearlyWork(Year);       
    generateReportTable(initalReportData.client_hours);
    getFullMonthlyWork(Year);


   

    document.getElementById("reportHeading").innerHTML = forename + " " + surname + " - My Work Breakdown " + Year;
    document.getElementById("generateReport").addEventListener("click", async function () {
    document.getElementById("reportHeading").innerHTML = "";
    const selectedYear = document.getElementById("select_year").value;
    const employee_id = sessionStorage.getItem("employee_id");
    document.getElementById("reportHeading").innerHTML = forename + " " + surname + " - My Work Breakdown " + selectedYear;

    if (!selectedYear) {
        console.error("No year selected.");
        alert("Please select a year before generating the report.");
        return;
    }
    console.log(`Generating report for Employee ID: ${employee_id}, Year: ${selectedYear}`);
    const reportData = await getEmployeeYearlyWork(selectedYear);

    if (reportData && reportData.client_hours) {
        console.log("Report Data:", reportData);
        generateReportTable(reportData.client_hours);
    } else {
        console.error("Failed to generate report.");
        alert("Error generating report. Please try again.");
    }

    getFullMonthlyWork(selectedYear);
});
   
    
document.getElementById("downloadReport").addEventListener("click", function () {
    const table = document.getElementById("individualReportTableBody");
    const rows = table.getElementsByTagName("tr");

    let csvContent = "Client Name,Total Hours\n"; 

    
    Array.from(rows).forEach((row) => {
        const cells = row.getElementsByTagName("td");
        let rowData = [];
        Array.from(cells).forEach((cell) => {
            rowData.push(cell.textContent.trim());
        });
        csvContent += rowData.join(",") + "\n"; 
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "work_report.csv";  
    link.click();  
});

document.getElementById("downloadModal").addEventListener("click", function () {
    const modalTable = document.getElementById("modalTableBody");
    const rows = modalTable.getElementsByTagName("tr");

    let csvContent = "Month,Hours\n"; 

    Array.from(rows).forEach((row) => {
        const cells = row.getElementsByTagName("td");
        let rowData = [];
        Array.from(cells).forEach((cell) => {
            rowData.push(cell.textContent.trim());
        });
        csvContent += rowData.join(",") + "\n"; 
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "monthly_breakdown.csv";  
    link.click();  
});


};

getEmployeeWorkYears = async () => {
    try {
        const response = await axios.post('/getEmployeeWorkYears', {
            employee_id
        });
        console.log(response.data);
        return response.data;
    } catch (err) {
        console.error('Error fetching employee work years:', err);
        return null;
    }
};


getEmployeeYearlyWork = async (year) => {
    try {
        const response = await axios.post('/getEmployeeYearlyWork', {
            employee_id,
            year
        });
        console.log(response.data);
        return response.data;
    } catch (err) {
        console.error('Error fetching employee yearly work:', err);
        return null;
    }
}


function generateReportTable(clientHours) {
    const tableBody = document.getElementById("individualReportTableBody");
    tableBody.innerHTML = '';  

    let totalHoursSum = 0;  

    clientHours.forEach(([clientName, totalHours]) => {
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
        detailButton.setAttribute('data-start-date', '2025-01-01'); 
        detailButton.setAttribute('data-end-date', '2025-12-31'); 

        // Create icon element
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
    
    const totalClientCell = document.createElement('td');
    totalClientCell.textContent = 'Total';
    totalClientCell.style.fontWeight = 'bold';  
    totalRow.appendChild(totalClientCell);

    const totalHoursCell = document.createElement('td');
    totalHoursCell.textContent = totalHoursSum.toFixed(2);  
    totalHoursCell.style.fontWeight = 'bold';  
    totalRow.appendChild(totalHoursCell);

    const emptyCell = document.createElement('td');
    totalRow.appendChild(emptyCell);

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
    const employee_id = sessionStorage.getItem("employee_id");
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
let lineChartInstance = null;  

function createLineChart(monthlyChartData) {
    const labels = monthlyChartData.map(item => item.month);
    const totalHours = monthlyChartData.map(item => parseFloat(item.total_hours));

    const year = document.getElementById("select_year").value;
    document.getElementById("monthlyBreakdownH1").textContent = "Monthly Work Breakdown for " + year;

    const ctx = document.getElementById('monthlyBreakdownCanvas').getContext('2d');

    // If a chart already exists, destroy it before creating a new one
    if (lineChartInstance) {
        lineChartInstance.destroy();  
    }

    // Create the line chart
    lineChartInstance = new Chart(ctx, {
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

        const clientNames = chartData.map(item => item[0]);
        const totalHours = chartData.map(item => parseFloat(item[1]));

        const ctx = document.getElementById('clientWorkBreakdownCanvas').getContext('2d');

        if (window.myPieChart) {
            window.myPieChart.destroy();
        }

        // Create the pie chart
        window.myPieChart = new Chart(ctx, {
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















