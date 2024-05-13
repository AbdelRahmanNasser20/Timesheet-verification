document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('fileInput').addEventListener('change', function(event) {
        handleFiles(event.target.files);
    });
});

function handleFiles(files) {
    if (files.length > 0) {
        var file = files[0];
        if (/\.(xls|xlsx)$/i.test(file.name)) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var data = new Uint8Array(e.target.result);
                var workbook = XLSX.read(data, {type: 'array', cellDates: true}); // Enable cell date processing
                var firstSheetName = workbook.SheetNames[0];
                var worksheet = workbook.Sheets[firstSheetName];

                const rawData = XLSX.utils.sheet_to_json(worksheet, { range: 2, header: 1 });

                // Filter and map data to extract only the first 4 columns, ensuring each row has at least 4 columns
                const filteredData = rawData.filter(row => row.length >= 4).map(row => {
                    return row.slice(0, 4).map(cell => {
                        // Format date cells to a more readable string format
                        if (cell instanceof Date) {
                            return cell.toLocaleDateString("en-US");  // Formats the date as MM/DD/YYYY
                        }
                        return cell;
                    });
                });

                // console.log(filteredData);  // Output filtered and processed data to the console

                // Assuming normalizeData and populateTimeSheetTable are defined elsewhere and ready to use                
                // var normalizedData = normalizeData(filteredData); // Normalize the data if needed
                populateTimeSheetTable(filteredData.slice(1)); // Populate the table with normalized data
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert("Please select a valid Excel file (.xls or .xlsx).");
        }
    }
}

function isValidNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}
function populateTimeSheetTable(entries) {
    console.log("Preparing to populate table...");
    console.log(entries);
    if (!entries || !Array.isArray(entries)) {
        console.error('Invalid or empty entries array:', entries);
        return;
    }

    const tableBody = document.getElementById('timeSheetTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; // Clear existing entries
    entries.forEach(entry => {
        const row = tableBody.insertRow();
        row.insertCell(0).innerHTML = '<input type="checkbox" name="record">';  // Checkbox for selecting the record

        // Create editable cells for each entry data point
        createEditableCell(row, entry.date, 'date');
        createEditableCell(row, entry.role, 'role', true);  // Assuming role is a dropdown
        createEditableCell(row, entry.hours, 'hours');
        createEditableCell(row, entry.location, 'location', true);  // Assuming location is a dropdown
    });
}

function createEditableCell(row, value, type, isSelect = false) {
    const cell = row.insertCell();
    cell.textContent = value;
    cell.setAttribute('data-value', value);

    cell.addEventListener('click', function() {
        if (cell.querySelector('input') || cell.querySelector('select')) return; // prevent multiple inputs or selects

        if (isSelect) {
            const select = document.getElementById(`${type}InputTemplate`).cloneNode(true);
            select.style.display = 'block';
            select.value = value; // Set the current value as selected
            select.classList.add('form-select');
            select.addEventListener('change', function() {
                cell.setAttribute('data-value', this.value);
                cell.textContent = this.value;
                cell.removeChild(select); // Remove select after change
            });
            select.addEventListener('blur', function() {
                if (!select.contains(document.activeElement)) {
                    cell.textContent = select.value;
                    cell.setAttribute('data-value', select.value);
                    cell.removeChild(select); // Remove select when focus is lost
                }
            });
            cell.innerHTML = ''; // Clear the cell before appending
            cell.appendChild(select);
            select.focus();
        } else {
            const input = document.createElement('input');
            input.type = (type === 'hours') ? 'number' : 'text';
            input.value = value;
            input.classList.add('form-control');
            input.addEventListener('blur', function() {
                cell.textContent = input.value;
                cell.setAttribute('data-value', input.value);
                cell.removeChild(input); // Remove input after focus is lost
            });
            input.addEventListener('keydown', function(event) {
                if (event.key === 'Enter') {
                    input.blur();
                }
            });
            cell.innerHTML = ''; // Clear the cell before appending
            cell.appendChild(input);
            input.focus();
        }
    });
}

function saveChanges(cell, value) {
    cell.innerHTML = value;
    cell.setAttribute('data-value', value);
    // Optional: Here you could also update the server with the new value
    console.log('Updated value:', value);
}

function convertExcelDate(excelDateValue) {
    console.log("Attempting to convert Excel date:", excelDateValue);
    if (!isValidDate(excelDateValue)) {
        console.error('Invalid Excel date value:', excelDateValue);
        return 'Invalid date';
    }
    
    const dateOrigin = new Date(Date.UTC(1899, 11, 31)); // Adjust to correct Excel's leap year bug
    try {
        const dateOut = new Date(dateOrigin.getTime() + excelDateValue * 86400000);
        return dateOut.toISOString().slice(0, 10);
    } catch (error) {
        console.error('Date conversion error:', error);
        return 'Invalid date';
    }
}

function normalizeData(dataRows) {
    return dataRows.slice(1).map(row => ({
        date: row[0] ? convertExcelDate(row[0]) : 'No date', // Check if date exists before conversion
        hours: typeof row[1] === 'number' ? row[1] : 'No hours', // Validate hours
        location: row[2] || 'No location', // Provide default value if undefined
        position: row[3] || 'No position', // Provide default value if undefined
        totals: typeof row[4] === 'number' ? row[4] : 'No totals' // Validate totals
    }));
}
