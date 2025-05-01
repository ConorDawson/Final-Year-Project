let paySchedulesData = [];
window.onload = async function () {
    console.log("Predicted Report JS Loaded");

    try {
        // Initially load data and build the table and charts
        const clientData = await getPredictedReports(12); // Default to 12 months
        const grouped = groupMonthlyClientData(clientData);
        const yearly = groupYearlyData(grouped);
        const paySchedules = await getPaySchedules();
        paySchedulesData = paySchedules;

        console.log("Grouped Client Data:", grouped);
        console.log("Yearly Data:", yearly);
        console.log("Pay Schedules:", paySchedules);

        buildYearlyTable(yearly, paySchedules);
        createPieChart(yearly);      
        createLineChart(grouped);     
        monthlyGroupedData = groupMonthlyClientData(clientData);

    } catch (error) {
        console.error("Error during data fetching and table creation:", error);
    }

    document.getElementById('downloadReport').addEventListener('click', () => {
        const table = document.getElementById('reportTable');
        const rows = Array.from(table.rows).map(row => Array.from(row.cells).map(cell => cell.innerText));
        const csvContent = rows.map(rowArray => rowArray.join(",")).join("\n");
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const fileName = `Current_Profit_Loss_Percentages_for_${startDate}_to_${endDate}.csv`;
    
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    document.getElementById('loadingScreen').style.display = 'none';

    document.getElementById('generateReport').addEventListener('click', async function() {
        // Show the loading screen
        document.getElementById('loadingScreen').style.display = 'block';

        const dropdown = document.getElementById('monthsDropdown');
        const selectedValue = dropdown.value;
        console.log('Selected months:', selectedValue);

        try {
            // Fetch the new predicted reports based on selected months
            const clientData = await getPredictedReports(selectedValue); 
            const grouped = groupMonthlyClientData(clientData);
            const yearly = groupYearlyData(grouped);
            const paySchedules = await getPaySchedules();

            buildYearlyTable(yearly, paySchedules);
            createPieChart(yearly);       
            createLineChart(grouped);     

            document.getElementById('loadingScreen').style.display = 'none';

        } catch (error) {
            console.error("Error generating the report:", error);
            document.getElementById('loadingScreen').style.display = 'none';
        }
    });
};

function getPredictedReports(selectedMonths) {
    console.log("Fetching predicted reports...");
  
    return axios.post('/predicted_reports', { months: selectedMonths }) // Pass selected months dynamically
      .then(response => {
        console.log("Predicted reports response:", response.data);
        return response.data;
      })
      .catch(error => {
        console.error("Error fetching predicted reports:", error);
        return [];
      });
}

function groupMonthlyClientData(data) {
    const grouped = {};

    data.forEach(entry => {
        const client = entry["Client"];
        const month = entry["Month"];
        const hours = parseFloat(entry["Total Hours Worked"]) || 0;
        const cost = parseFloat(entry["Total Cost (£)"]) || 0;

        const key = `${client}_${month}`;

        if (!grouped[key]) {
            grouped[key] = {
                Client: client,
                Month: month,
                "Total Hours Worked": 0,
                "Total Cost (£)": 0
            };
        }

        grouped[key]["Total Hours Worked"] += hours;
        grouped[key]["Total Cost (£)"] += cost; 
    });

    return Object.values(grouped).sort((a, b) => {
        if (a.Client === b.Client) {
            return a.Month.localeCompare(b.Month);
        }
        return a.Client.localeCompare(b.Client);
    });
}

function groupYearlyData(data) {
    const yearlyGrouped = {};

    data.forEach(entry => {
        const client = entry["Client"];
        const hours = parseFloat(entry["Total Hours Worked"]) || 0;
        const cost = parseFloat(entry["Total Cost (£)"]) || 0;

        if (!yearlyGrouped[client]) {
            yearlyGrouped[client] = {
                Client: client,
                "Total Hours Worked": 0,
                "Total Cost (£)": 0
            };
        }

        yearlyGrouped[client]["Total Hours Worked"] += hours;
        yearlyGrouped[client]["Total Cost (£)"] += cost;
    });

    return Object.values(yearlyGrouped);
}

function getPaySchedules() {
    console.log("Fetching payschedules");

    return axios.post('/getClientPaySchedules', {})
        .then(response => {
            console.log("Pay Schedule response:", response.data);
            return response.data;
        })
        .catch(error => {
            console.error("Error fetching Pay schedules:", error);
            return [];
        });
}

function buildYearlyTable(yearlyData, paySchedules) {
    const tableBody = document.getElementById("reportTableBody");
    tableBody.innerHTML = ""; 

    let allHoursWorked = 0;
    let totalCost = 0;
    let totalClientPayment = 0;

    const dropdown = document.getElementById('monthsDropdown');
    const selectedValue = dropdown.value; 

    yearlyData.forEach(clientYear => {
        const clientName = clientYear["Client"];
        const hours = parseFloat(clientYear["Total Hours Worked"]) || 0;
        const cost = parseFloat(clientYear["Total Cost (£)"]) || 0;

        const payData = paySchedules.find(p => p.company_name === clientName);
        let payment = 0;
        if (payData) {
            const paymentAmount = parseFloat(payData.client_payment_amount) || 0;
            const billingSchedule = payData.client_billing_schedule;

            // Calculate the monthly payment based on the billing schedule
            switch (billingSchedule) {
                case 'A': // Annual
                    payment = paymentAmount / 12;
                    break;
                case 'BA': // Bi-Annual
                    payment = paymentAmount / 6;
                    break;
                case 'Q': // Quarterly
                    payment = paymentAmount / 3;
                    break;
                case 'M': // Monthly
                    payment = paymentAmount;
                    break;
                default:
                    payment = 0;
            }
        }

        const adjustedPayment = payment * selectedValue;

        allHoursWorked += hours;
        totalCost += cost;
        totalClientPayment += adjustedPayment;

        const profitLoss = cost > 0 ? ((adjustedPayment - cost) / cost) * 100 : 0;
        const profitLossSign = profitLoss > 0 ? '↑' : profitLoss < 0 ? '↓' : '';
        const profitLossColor = profitLoss > 0 ? 'green' : profitLoss < 0 ? 'red' : 'black';
        const profitLossStyle = `color: ${profitLossColor}; font-weight: bold;`;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="clientName"><strong>${clientName}</strong></td>
            <td>${hours.toFixed(2)}</td>
            <td>£${cost.toFixed(2)}</td>
            <td>£${adjustedPayment.toFixed(2)}</td> <!-- Updated to show adjusted payment -->
            <td style="${profitLossStyle}">${profitLoss.toFixed(2)}% ${profitLossSign}</td>
            <td><button onclick="monthlyToast('${clientName}')"><i class="fa-solid fa-circle-info"></i></button></td>
        `;

        tableBody.appendChild(row);
    });

    const totalProfitLoss = totalCost > 0 ? ((totalClientPayment - totalCost) / totalCost) * 100 : 0;
    const totalProfitLossSign = totalProfitLoss > 0 ? '↑' : totalProfitLoss < 0 ? '↓' : '';
    const totalProfitLossColor = totalProfitLoss > 0 ? 'green' : totalProfitLoss < 0 ? 'red' : 'black';
    const totalProfitLossStyle = `color: ${totalProfitLossColor}; font-weight: bold;`;

    const totalRow = document.createElement("tr");
    totalRow.innerHTML = `
        <td><strong>Total</strong></td>
        <td><strong>${allHoursWorked.toFixed(2)}</strong></td>
        <td><strong>£${totalCost.toFixed(2)}</strong></td>
        <td><strong>£${totalClientPayment.toFixed(2)}</strong></td>
        <td style="${totalProfitLossStyle}"><strong>${totalProfitLoss.toFixed(2)}% ${totalProfitLossSign}</strong></td>
        <td></td>
    `;

    tableBody.appendChild(totalRow);
}

function createPieChart(yearlyData) {
    const ctx = document.getElementById("costChart").getContext("2d");

    if (window.costChartInstance) {
        window.costChartInstance.destroy();
    }

    const labels = yearlyData.map(item => item.Client);
    const data = yearlyData.map(item => item["Total Cost (£)"]);

    window.costChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Yearly Cost (£)',
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Yearly Cost Breakdown per Client'
                }
            }
        }
    });
}
function createLineChart(groupedData) {
    const ctx = document.getElementById('profitLossChart').getContext('2d');

    if (window.lineChartInstance) {
        window.lineChartInstance.destroy();
    }

    const monthsSet = new Set();
    const clientMap = {};
    let minVal = Infinity;
    let maxVal = -Infinity;

    groupedData.forEach(entry => {
        const client = entry.Client;
        const month = entry.Month;
        const hours = parseFloat(entry["Total Hours Worked"]) || 0;

        monthsSet.add(month);

        if (!clientMap[client]) {
            clientMap[client] = {};
        }

        clientMap[client][month] = hours;

        if (hours < minVal) minVal = hours;
        if (hours > maxVal) maxVal = hours;
    });

    const allMonths = Array.from(monthsSet).sort();
    const datasets = Object.entries(clientMap).map(([client, monthData], index) => {
        const color = `hsl(${(index * 60) % 360}, 70%, 60%)`;

        return {
            label: client,
            data: allMonths.map(month => monthData[month] || 0),
            borderColor: color,
            fill: false,
            tension: 0.3
        };
    });

    const yMin = Math.floor(minVal - 1);
    const yMax = Math.ceil(maxVal + 1);

    window.lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: allMonths,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Hours Worked by Client'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: yMin,
                    max: yMax
                }
            }
        }
    });

    console.log("Line chart months:", allMonths);
    console.log("Line chart datasets:", datasets);
}

function monthlyToast(clientName) {
    console.log("Client:", clientName);

    const payData = paySchedulesData.find(p => p.company_name === clientName);
    let monthlyPayment = 0;

    if (payData) {
        const billingSchedule = payData.client_billing_schedule;
        const paymentAmount = parseFloat(payData.client_payment_amount) || 0;

        switch (billingSchedule) {
            case 'A': // Annual
                monthlyPayment = paymentAmount / 12;
                break;
            case 'BA': // Bi-Annual
                monthlyPayment = paymentAmount / 6;
                break;
            case 'Q': // Quarterly
                monthlyPayment = paymentAmount / 3;
                break;
            case 'M': // Monthly
                monthlyPayment = paymentAmount;
                break;
            default:
                monthlyPayment = 0;
        }
    }

    const clientEntries = monthlyGroupedData.filter(entry => entry.Client === clientName);

    if (clientEntries.length === 0) {
        document.getElementById("modalTitle").innerText = `${clientName}`;
        document.getElementById("modalBody").innerHTML = `<p>No data available for this client.</p>`;
    } else {
        document.getElementById("modalTitle").innerText = `${clientName} - Monthly Breakdown`;

        let bodyHtml = `<table style="width: 100%; border-collapse: collapse;">`;
        bodyHtml += `
            <tr>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">Month</th>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">Hours Worked</th>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">Cost (£)</th>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">Monthly Payment (£)</th>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">Profit/Loss (£)</th>
            </tr>
        `;

        clientEntries.forEach(entry => {
            const totalCost = entry["Total Cost (£)"];
            const profitLoss = monthlyPayment - totalCost;

            bodyHtml += `
                <tr>
                    <td>${entry.Month}</td>
                    <td>${entry["Total Hours Worked"].toFixed(2)}</td>
                    <td>£${totalCost.toFixed(2)}</td>
                    <td>£${monthlyPayment.toFixed(2)}</td>
                    <td style="color: ${profitLoss >= 0 ? 'green' : 'red'};">
                        £${profitLoss.toFixed(2)}
                    </td>
                </tr>
            `;
        });

        bodyHtml += `</table>`;
        document.getElementById("modalBody").innerHTML = bodyHtml;
    }

    document.getElementById("t").style.display = "block";
}

function closeToast() {
    document.getElementById("t").style.display = "none";
}




