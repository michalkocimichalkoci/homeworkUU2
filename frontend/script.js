const API_URL = 'http://localhost:3000';

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tabs button').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.getElementById(`btn-tab-${tabName}`).classList.add('active');

    loadAllData();
}

async function loadAllData() {
    try {
        const carsResponse = await fetch(`${API_URL}/vehicles/list`);
        const refResponse = await fetch(`${API_URL}/refuelings/list`);
        
        const vehicles = await carsResponse.json();
        const refuelings = await refResponse.json();

        renderVehiclesList(vehicles);
        renderVehicleSelect(vehicles);
        renderHistoryTable(refuelings, vehicles);
        renderDashboard(refuelings, vehicles);

    } catch (error) {
        console.error("Chyba při načítání dat:", error);
    }
}

function renderVehiclesList(vehicles) {
    const list = document.getElementById('vehicles-list');
    list.innerHTML = '';
    
    vehicles.forEach(v => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${v.name} 
            <button class="btn-delete" style="margin-left: 10px; font-size: 0.8em;" onclick="deleteVehicle('${v.id}')">Delete</button>
        `;
        list.appendChild(li);
    });
}

async function deleteVehicle(id) {
    if(confirm("Are you sure you want to delete this vehicle? All its refuelings will be lost!")) {
        try {
            await fetch(`${API_URL}/vehicles/${id}`, { method: 'DELETE' });
            loadAllData(); 
        } catch (error) {
            alert("Nepodařilo se smazat automobil.");
        }
    }
}

async function saveVehicle() {
    const nameInput = document.getElementById('veh-name').value;
    const msgBox = document.getElementById('veh-msg');
    
    msgBox.textContent = "Ukládám...";
    msgBox.className = "";

    try {
        const response = await fetch(`${API_URL}/vehicles/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nameInput })
        });

        const result = await response.json();

        if (!response.ok) {
            msgBox.textContent = result.error;
            msgBox.className = "error";
        } else {
            msgBox.textContent = "Saved successfully!";
            msgBox.className = "success";
            document.getElementById('veh-name').value = '';
            loadAllData();
        }
    } catch (error) {
        msgBox.textContent = "Chyba připojení k serveru.";
        msgBox.className = "error";
    }
}

function renderVehicleSelect(vehicles) {
    const select = document.getElementById('ref-vehicle');
    const currentVal = select.value; 
    
    select.innerHTML = '<option value="">Select vehicle...</option>';
    
    vehicles.forEach(v => {
        const option = document.createElement('option');
        option.value = v.id;
        option.textContent = v.name;
        select.appendChild(option);
    });

    if (currentVal) select.value = currentVal;
}

function clearRefuelingForm() {
    document.getElementById('ref-odometer').value = '';
    document.getElementById('ref-amount').value = '';
    document.getElementById('ref-vehicle').value = '';
    document.getElementById('ref-msg').textContent = '';
}

async function saveRefueling() {
    const odo = document.getElementById('ref-odometer').value;
    const amount = document.getElementById('ref-amount').value;
    const vehicleId = document.getElementById('ref-vehicle').value;
    const msgBox = document.getElementById('ref-msg');

    msgBox.textContent = "Ukládám...";
    msgBox.className = "";

    try {
        const response = await fetch(`${API_URL}/refuelings/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                odometer: odo, 
                amountOfFuel: amount, 
                vehicleId: vehicleId 
            })
        });

        const result = await response.json();

        if (!response.ok) {
            msgBox.textContent = result.error;
            msgBox.className = "error";
        } else {
            msgBox.textContent = "Saved successfully!";
            msgBox.className = "success";
            clearRefuelingForm();
            loadAllData();
        }
    } catch (error) {
        msgBox.textContent = "Chyba připojení k serveru.";
        msgBox.className = "error";
    }
}

function renderHistoryTable(refuelings, vehicles) {
    const tbody = document.getElementById('history-tbody');
    tbody.innerHTML = '';

    const sortedRefuelings = [...refuelings].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedRefuelings.forEach(ref => {
        const tr = document.createElement('tr');
        
        const car = vehicles.find(v => v.id === ref.vehicleId);
        const carName = car ? car.name : 'Unknown vehicle';

        const dateObj = new Date(ref.date);
        const niceDate = dateObj.toLocaleDateString('cs-CZ');

        tr.innerHTML = `
            <td>${niceDate}</td>
            <td>${ref.odometer} km</td>
            <td>${ref.amountOfFuel}</td>
            <td>${carName}</td>
            <td><button class="btn-delete" onclick="deleteRefueling('${ref.id}')">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteRefueling(id) {
    if(confirm("Are you sure you want to delete this record?")) {
        try {
            await fetch(`${API_URL}/refuelings/${id}`, { method: 'DELETE' });
            loadAllData();
        } catch (error) {
            alert("Nepodařilo se smazat záznam.");
        }
    }
}

function renderDashboard(refuelings, vehicles) {
    const tbody = document.getElementById('dashboard-tbody');
    tbody.innerHTML = '';

    if (vehicles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2">First, add your car on the Vehicles tab.</td></tr>`;
        return;
    }

    vehicles.forEach(vehicle => {
        const vRefs = refuelings.filter(r => r.vehicleId === vehicle.id);
        
        let avgText = "No data yet. The figures will start appearing after your second refueling.";
        
        if (vRefs.length >= 2) {
            vRefs.sort((a, b) => a.odometer - b.odometer);
            
            const firstRef = vRefs[0];
            const lastRef = vRefs[vRefs.length - 1];
            
            const distanceTraveled = lastRef.odometer - firstRef.odometer;
            
            let totalFuelUsed = 0;
            for (let i = 1; i < vRefs.length; i++) {
                totalFuelUsed += vRefs[i].amountOfFuel;
            }

            if (distanceTraveled > 0) {
                const avg = (totalFuelUsed / distanceTraveled) * 100;
                avgText = `${avg.toFixed(2)} l / 100 km`;
            }
        } else if (vRefs.length === 1) {
            avgText = "Record one more refueling to calculate.";
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${vehicle.name}</td>
            <td>${avgText}</td>
        `;
        tbody.appendChild(tr);
    });
}

loadAllData();
