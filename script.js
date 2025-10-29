const symptomData = {
  "fever": "Paracetamol 500mg every 6 hours if needed.",
  "cough": "Dextromethorphan syrup 10ml every 8 hours.",
  "sore throat": "Lozenges or warm salt-water gargle twice daily.",
  "headache": "Ibuprofen 400mg every 8 hours after food.",
  "runny nose": "Cetirizine 10mg once daily.",
  "nausea": "Domperidone 10mg before meals.",
  "vomiting": "Ondansetron 4mg every 8 hours if required.",
  "diarrhea": "Oral rehydration salts + Loperamide if severe.",
  "constipation": "Lactulose syrup 15ml at night.",
  "abdominal pain": "Buscopan 10mg every 8 hours.",
  "fatigue": "Multivitamin once daily.",
  "dizziness": "Meclizine 25mg once daily.",
  "allergy": "Loratadine 10mg once daily.",
  "insomnia": "Melatonin 3mg before sleep.",
  "anxiety": "Low-dose propranolol or consult a doctor.",
  "heartburn": "Omeprazole 20mg before breakfast.",
  "shortness of breath": "Seek immediate medical care!",
  "chest pain": "⚠️ Emergency — go to hospital immediately!"
};

const symptomButtonsContainer = document.getElementById("symptom-buttons");
const outputDiv = document.getElementById("output");
const analyzeBtn = document.getElementById("analyze-btn");
let selectedSymptoms = [];

// Create buttons dynamically
Object.keys(symptomData).forEach(symptom => {
  const btn = document.createElement("button");
  btn.classList.add("symptom-btn");
  btn.textContent = symptom;

  btn.addEventListener("click", () => {
    btn.classList.toggle("active");

    if (btn.classList.contains("active")) {
      selectedSymptoms.push(symptom);
    } else {
      selectedSymptoms = selectedSymptoms.filter(s => s !== symptom);
    }

    analyzeBtn.style.display = selectedSymptoms.length > 0 ? "block" : "none";
  });

  symptomButtonsContainer.appendChild(btn);
});

// Analyze selected symptoms
function analyze() {
  if (selectedSymptoms.length === 0) return;

  // Build lists
  const symptomsList = selectedSymptoms.map(s => `<li>${s}</li>`).join("");
  const medicinesList = selectedSymptoms.map(s => `<li>${symptomData[s]}</li>`).join("");

  // Create one unified prescription card
  outputDiv.innerHTML = `
    <div class="result-card">
      <h2>MKF Prescription Summary</h2>

      <div class="result-section">
        <h3>🩺 Selected Symptoms:</h3>
        <ul>${symptomsList}</ul>
      </div>

      <div class="result-section">
        <h3>💊 Recommended Medicines:</h3>
        <ul>${medicinesList}</ul>
      </div>
    </div>
  `;

  // Scroll to output smoothly
  outputDiv.scrollIntoView({ behavior: "smooth" });
}
