// --- Existing conditions array (keep as is) ---
const conditions = [
  // --- Conditions database ---
const conditions = [
  {
    keywords: ["fever", "cough", "yellow sputum"],
    diagnosis: "Bacterial Respiratory Infection",
    medicine: "Amoxicillin",
    dosage: "500 mg",
    frequency: "Three times daily",
    duration: "7 days",
    warning: "Avoid if allergic to penicillin."
  },
  {
    keywords: ["fever", "sore throat", "white patches"],
    diagnosis: "Streptococcal Pharyngitis",
    medicine: "Amoxicillin",
    dosage: "500 mg",
    frequency: "Every 12 hours",
    duration: "10 days",
    warning: "Confirm no penicillin allergy."
  },
  {
    keywords: ["runny nose", "sneezing", "sore throat", "cold"],
    diagnosis: "Common Cold",
    medicine: "Paracetamol 500 mg",
    dosage: "1–2 tablets",
    frequency: "Every 6 hours as needed",
    duration: "Up to 5 days",
    warning: "Seek medical care if symptoms persist."
  }
  /* your long condition list stays unchanged */ ];

// --- New symptom selection setup ---
const allSymptoms = [
  "fever", "cough", "yellow sputum", "sore throat", "white patches",
  "headache", "sensitivity to light", "stiff neck", "body aches",
  "runny nose", "frequent urination", "excessive thirst", "weight loss",
  "chest pain", "shortness of breath", "sweating", "diarrhea", "vomiting",
  "itching", "rash", "abdominal pain", "joint pain", "fatigue", "nausea",
  "back pain", "sneezing", "cold", "painful urination", "burning urine",
  "bloody stool", "itchy scalp", "yellow eyes", "red eyes", "night sweats"
];

// Generate buttons dynamically
const grid = document.getElementById("symptomGrid");
allSymptoms.forEach(sym => {
  const btn = document.createElement("div");
  btn.className = "symptom";
  btn.textContent = sym;
  btn.onclick = () => btn.classList.toggle("selected");
  grid.appendChild(btn);
});

// --- Updated analyze() function ---
function analyze() {
  const selected = [...document.querySelectorAll(".symptom.selected")]
    .map(el => el.textContent.toLowerCase());

  if (selected.length === 0) {
    document.getElementById("output").innerHTML = "<p>Please select at least one symptom.</p>";
    return;
  }

  let result = "<p>No exact match found. Please consult a doctor.</p>";

  for (let cond of conditions) {
    const matches = cond.keywords.filter(k => selected.includes(k.toLowerCase()));
    if (matches.length === cond.keywords.length || matches.length >= 2) {
      result = `
        <div class="result">
          <h3>Diagnosis: ${cond.diagnosis || cond.condition}</h3>
          <p><strong>Medicine:</strong> ${cond.medicine}</p>
          <p><strong>Dosage:</strong> ${cond.dosage}</p>
          ${cond.frequency ? `<p><strong>Frequency:</strong> ${cond.frequency}</p>` : ""}
          ${cond.duration ? `<p><strong>Duration:</strong> ${cond.duration}</p>` : ""}
          <p class="warning">⚠️ ${cond.warning}</p>
        </div>
      `;
      break;
    }
  }

  document.getElementById("output").innerHTML = result;
}


