// Connection with Express.js.
const express = require("express");
const app = express();
const fs = require('fs');

// CORS enables secure communication between frontend and backend.
const cors = require("cors");
app.use(cors());

// Entries into computer, OS gives ports to application, to exchange data.
const port = 3000;

// To translate incoming data in JSON.
app.use(express.json());

// It enables data saving.
const DATA_FILE = "./data.json";

// Temporary variables for work-testing purposes, basically a db.
let vehicles = [];
let refuelings = [];

// Node premade function to save data
function saveDataToFile() {
  try {
    const dataToSave = {
      vehicles: vehicles,
      refuelings: refuelings,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2));
  } catch (error) {
    console.error("Nepodařilo se uložit data do souboru:", error);
  }
}

// Node premade function to load data
function loadDataFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileContent = fs.readFileSync(DATA_FILE, "utf8");
      const data = JSON.parse(fileContent);
      vehicles = data.vehicles || [];
      refuelings = data.refuelings || [];
      console.log("Data loaded successfully.");
    } else {
      console.log("No data file exists yet, we are starting fresh.");
    }
  } catch (error) {
    console.error("Error occured while loading data.", error);
  }
}

// Loading data from saved file
loadDataFromFile();

// Endpoint allowing extraction of vehicle list.
app.get("/vehicles/list", (req, res) => {
  res.json(vehicles);
});

// Endpoint allowing vehicle saving.
app.post("/vehicles/create", (req, res) => {
  // This extracts the vehicle name that the user typed into the input form.
  const { name } = req.body;

  // Validation rules.
  if (!name || name.trim() === "") {
    return res
      .status(400)
      .json({ error: "Nothing to save, write your name into the form!" });
  }
  if (name.length > 30) {
    return res
      .status(400)
      .json({ error: "Can't be saved, maximum number of characters is 30!" });
  }

  const exists = vehicles.find(
    (v) => v.name.toLowerCase() === name.toLowerCase(),
  );
  if (exists) {
    return res
      .status(400)
      .json({ error: "Can't be saved, this vehicle already exists!" });
  }

  // Generates vehicle ID
  const newVehicle = {
    id: Math.random().toString(36).substring(2, 11),
    name: name.trim(),
  };

  // Saves the new car
  vehicles.push(newVehicle);
  saveDataToFile();
  // Sends the newly created vehicle to the frontend
  res.json(newVehicle);
});

// This returns the history array containing all refueling events tracked so far
app.get("/refuelings/list", (req, res) => {
  res.json(refuelings);
});

// Endpoint that grabs the fuel amount, odometer reading, and which vehicle it belongs to from frontend.
app.post("/refuelings/create", (req, res) => {
  const { amountOfFuel, odometer, vehicleId } = req.body;

  // Various validations
  if (!vehicleId) {
    return res
      .status(400)
      .json({ error: "Can't be saved, select your vehicle!" });
  }
  if (!odometer || Number(odometer) <= 0) {
    return res
      .status(400)
      .json({ error: "Can't be saved, fill in the odometer status!" });
  }
  if (!amountOfFuel || Number(amountOfFuel) <= 0)
    return res
      .status(400)
      .json({ error: "Can't be saved, fill in the amount of fuel!" });
  if (isNaN(odometer) || isNaN(amountOfFuel))
    return res
      .status(400)
      .json({ error: "Can't be saved, this must be a number!" });

  // Veryfying new odometer value is higher than the previous
  const vehicleRefuelings = refuelings.filter((r) => r.vehicleId === vehicleId);
  if (vehicleRefuelings.length > 0) {
    const maxOdo = Math.max(...vehicleRefuelings.map((r) => r.odometer));
    if (Number(odometer) <= maxOdo) {
      return res.status(400).json({
        error:
          "Can't be saved, something's wrong with your odometer, it must be higher than the last time.",
      });
    }
  }

  // Endpoint that creates new record about refueling
  const newRefueling = {
    id: Math.random().toString(36).substring(2, 11),
    amountOfFuel: Number(amountOfFuel),
    odometer: Number(odometer),
    date: new Date().toISOString(),
    vehicleId: vehicleId,
  };

  refuelings.push(newRefueling);
  saveDataToFile();
  res.json(newRefueling);
});

// Delete endpoints

app.delete("/refuelings/:id", (req, res) => {
  const idToDelete = req.params.id;
  refuelings = refuelings.filter((r) => r.id !== idToDelete);
  saveDataToFile();
  res.json({ message: "Deleted successfully!" });
});

app.delete("/vehicles/:id", (req, res) => {
  const idToDelete = req.params.id;
  vehicles = vehicles.filter((v) => v.id !== idToDelete);
  refuelings = refuelings.filter((r) => r.vehicleId !== idToDelete);
  saveDataToFile();
  res.json({ message: "Deleted successfully!" });
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
