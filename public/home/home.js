let currentWeekStartDate = new Date();

function fetchEmployeeName() {
    const urlParams = new URLSearchParams(window.location.search);
    const forename = sessionStorage.getItem("firstname");
    const surname = sessionStorage.getItem("lastname");

    if (forename && surname) {
        document.getElementById('employee-name').textContent = `Timesheet for ${forename} ${surname}`;
    }
}

async function fetchClients() {
    try {
        // Fetch clients and timesheet hours concurrently
        const [clientsResponse, hoursResponse] = await Promise.all([
            fetch('/api/clients'),
            fetch('/api/timesheet-hours', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id: sessionStorage.getItem("employee_id") })
            })
        ]);

        if (!clientsResponse.ok || !hoursResponse.ok) {
            throw new Error('Error fetching data');
        }

        const clients = await clientsResponse.json();
        const hours = await hoursResponse.json();

        const tableBody = document.getElementById('client-rows');
        const tableHeader = document.querySelector('thead tr');

        
        tableBody.innerHTML = '';
        tableHeader.innerHTML = '<th>Client Name</th>';

        // Prepare table header (dates for the week)
        const weekDates = getWeekDates(currentWeekStartDate);
        const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        weekDates.forEach((date, index) => {
            const th = document.createElement('th');
            th.textContent = `${weekDays[index]} (${getFormattedDate(date)})`;
            tableHeader.appendChild(th);
        });

        // Build table rows for each client
        clients.forEach(client => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${client.company_name}</td>`;

            weekDates.forEach(date => {
                const formattedDate = formatDate(date); 
                const matchingEntry = hours.find(
                    hour => hour.company_name === client.company_name && formatDate(hour.work_date) === formattedDate
                );
                const hoursWorked = matchingEntry ? matchingEntry.hours : '';
                row.innerHTML += `<td><input type="text" class="day-input" data-date="${formattedDate}" value="${hoursWorked}"></td>`;
            });

            tableBody.appendChild(row);
        });

        document.querySelectorAll('.day-input').forEach(input => {
            input.addEventListener('input', validateHoursInput);
        });

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function validateHoursInput(event) {
    const value = event.target.value;
    
    // Remove any non-numeric characters
    event.target.value = value.replace(/[^0-9.]/g, '');
    
    // If the value is greater than 24, reset it to 24
    if (parseFloat(event.target.value) > 24) {
        event.target.value = '24';
    }
    
    // If the value is an invalid number, reset it
    if (event.target.value === '') {
        event.target.value = '0';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

function getWeekDates(startDate) {
    const weekDates = [];
    const day = startDate.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Sunday is 0, Monday is 1
    const startOfWeek = new Date(startDate);
    startOfWeek.setDate(startDate.getDate() + diff);

    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        weekDates.push(date);
    }

    return weekDates;
}

function getFormattedDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

window.onload = () => {
    fetchEmployeeName();
    fetchClients();

    document.getElementById('submit-button').addEventListener('click', submitTimesheet);
};

function goToPreviousWeek() {
    currentWeekStartDate.setDate(currentWeekStartDate.getDate() - 7);
    fetchClients();
}

function goToNextWeek() {
    const currentDate = new Date();
    if (currentWeekStartDate.getTime() < currentDate.getTime()) {
        currentWeekStartDate.setDate(currentWeekStartDate.getDate() + 7);
        fetchClients();
    } else {
        alert("You cannot go beyond the current week.");
    }
}

async function submitTimesheet() {
    const clientRows = document.querySelectorAll('#client-rows tr');
    const employee_id = sessionStorage.getItem("employee_id");
    const timesheetData = [];

    clientRows.forEach((row) => {
        const clientName = row.querySelector('td').textContent;
        const inputs = row.querySelectorAll('input');

        inputs.forEach((input) => {
            const date = input.getAttribute('data-date');
            const hours = input.value;

            // Validate hours before submission
            if (hours !== '' && (isNaN(hours) || parseFloat(hours) < 0 || parseFloat(hours) > 24)) {
                alert(`Invalid hours input for ${clientName} on ${date}. Please enter a value between 0 and 24.`);
                return;
            }

            if (hours) {
                timesheetData.push({ clientName, date, hours, employee_id });
            }
        });
    });

    if (timesheetData.length === 0) {
        alert("No timesheet data to submit!");
        return;
    }

    try {
        const response = await fetch('/submitTimesheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(timesheetData),
        });

        if (response.ok) {
            alert('Timesheet submitted successfully!');
        } else {
            throw new Error('Error submitting timesheet');
        }
    } catch (error) {
        console.error('Error submitting timesheet:', error);
    }
}
