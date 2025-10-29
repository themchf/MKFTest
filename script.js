const symptoms = [
  "Fever", "Cough", "Sore throat", "Headache", "Nausea", "Vomiting",
  "Fatigue", "Muscle pain", "Shortness of breath", "Chest pain",
  "Runny nose", "Diarrhea", "Abdominal pain", "Dizziness",
  "Yellow sputum", "Chills", "Sneezing", "Loss of appetite"
];

const symptomList = document.getElementById("symptomList");
const output = document.getElementById("output");
let selectedSymptoms = [];

// Generate clickable symptom tags
symptoms.forEach(symptom => {
  const div = document.createElement("div");
  div.className = "symptom";
  div.textContent = symptom;
  div.onclick = () => toggleSymptom(symptom, div);
  symptomList.appendChild(div);
});

function toggleSymptom(symptom, element) {
  if (selectedSymptoms.includes(symptom)) {
    selectedSymptoms = selectedSymptoms.filter(s => s !== symptom);
    element.classList.remove("selected");
  } else {
    selectedSymptoms.push(symptom);
    element.classList.add("selected");
  }
}

function analyze() {
  if (selectedSymptoms.length === 0) {
    output.innerHTML = `<p>Please select at least one symptom.</p>`;
    return;
  }

  let results = [];

  if (selectedSymptoms.includes("Fever") && selectedSymptoms.includes("Cough")) {
    results.push({
      title: "Possible Cold or Flu",
      medicine: "Paracetamol (500 mg) every 6 hours + Warm fluids + Rest"
    });
  }

  if (selectedSymptoms.includes("Cough") && selectedSymptoms.includes("Yellow sputum")) {
    results.push({
      title: "Possible Bacterial Chest Infection",
      medicine: "Amoxicillin 500 mg every 8 hours for 5 days (doctor consultation recommended)"
    });
  }

  if (selectedSymptoms.includes("Headache")) {
    results.push({
      title: "General Headache",
      medicine: "Ibuprofen 400 mg every 6 hours after food"
    });
  }

  if (selectedSymptoms.includes("Nausea") || selectedSymptoms.includes("Vomiting")) {
    results.push({
      title: "Possible Gastric Upset",
      medicine: "Ondansetron 4 mg every 8 hours if needed + Hydration"
    });
  }

  if (results.length === 0) {
    results.push({
      title: "Mild or Non-Specific Symptoms",
      medicine: "Rest, fluids, and simple pain relief if needed."
    });
  }

  displayResults(results);
}

function displayResults(results) {
  output.innerHTML = results.map(r => `
    <div class="result-card">
      <h2>${r.title}</h2>
      <p><strong>Recommended:</strong> ${r.medicine}</p>
    </div>
  `).join("");
}
