document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('fileInput').addEventListener('change', function(event) {
        handleFiles(event.target.files);
    });
    document.getElementById('addRowBtn').addEventListener('click', function() {
        addRow();
    });
});

let rowCount = 0; // Initialize a row count variable
const roleMapping = {
    "Back Office": "Back Office",
    "ISFT Assistant": "ISFT Assistant",
    "ISFT Lead": "ISFT Lead",
    "PSS": "PSS",
    "Special Event": "Special Event",
    "Summer Manager": "Summer Manager",
    "Summer Teacher": "Summer Teacher",
    "Teacher - Assistant": "Teacher - Assistant",
    "Teacher - Lead": "Teacher - Lead",
    "Teacher - Online Class": "Teacher - Online Class"
    // Add more mappings as necessary
};

function isValidDate(d) {
    return !isNaN(d) && d !== null && d !== undefined;
}

function convertExcelDate(excelDateValue) {
    const dateOrigin = new Date(Date.UTC(1899, 11, 31)); // Adjust to correct Excel's leap year bug
    try {
        const dateOut = new Date(dateOrigin.getTime() + excelDateValue * 86400000);
        return dateOut.toISOString().slice(0, 10);
    } catch (error) {
        console.error('Date conversion error:', error);
        return 'Invalid date';
    }
}

function handleFiles(files) {
    if (files.length > 0) {
        var file = files[0];
        if (/\.(xls|xlsx)$/i.test(file.name)) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var data = new Uint8Array(e.target.result);
                var workbook = XLSX.read(data, { type: 'array', cellDates: true }); // Enable cell date processing
                var firstSheetName = workbook.SheetNames[0];
                var worksheet = workbook.Sheets[firstSheetName];

                const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const filteredData = rawData.slice(3).filter(row => {
                    const [date, hours, location, role] = row;                                       
                    const isValidRow = role && isValidDate(date) && location;
                    return isValidRow;
                }).map(row => {
                    const [date, hours, location, role] = row;
                    const formattedDate = typeof date === 'number' ? convertExcelDate(date) : new Date(date).toISOString().slice(0, 10);
                    const transformedRole = roleMapping[role] || role;
                    return [formattedDate, hours, location, transformedRole];
                });

                filteredData.forEach(row => {
                    addRow(row[0], row[1], row[2], row[3]);
                });

            };
            reader.readAsArrayBuffer(file);
        } else {
            alert("Please select a valid Excel file (.xls or .xlsx).");
        }
    }
}

function addRow(date = null, hours = 0, location = "", role = null) {
    rowCount++; // Increment the row count to ensure unique IDs
    const table = document.getElementById('timeSheetTable').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();

    // Add Delete button column
    let newCell = newRow.insertCell(0);
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn btn-danger btn-sm';
    deleteButton.innerText = 'Delete';
    deleteButton.addEventListener('click', function() {
        const row = this.closest('tr');
        row.remove();
    });
    newCell.appendChild(deleteButton);

    // Add Date column
    newCell = newRow.insertCell(1);
    newCell.innerHTML = `<input type="date" class="form-control form-control-sm" id="date-${rowCount}" value="${date ? date : ''}">`;

    // Add Hours column
    newCell = newRow.insertCell(2);
    newCell.innerHTML = `<input type="number" class="form-control form-control-sm" id="hours-${rowCount}" step="0.1" value="${hours ? hours : 0}">`;

    // Add Location column
    newCell = newRow.insertCell(3);
    newCell.innerHTML = `<input type="text" class="form-control form-control-sm" id="location-${rowCount}" placeholder="Location" value="${location ? location : ''}">`;

    // Add Role column
    newCell = newRow.insertCell(4);
    const roleSelect = document.getElementById('roleInputTemplate').cloneNode(true);
    roleSelect.style.display = 'block';
    roleSelect.id = `role-${rowCount}`; // Ensure unique ID
    if (role) roleSelect.value = role;
    newCell.appendChild(roleSelect);
}
