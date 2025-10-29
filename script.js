// List of symptoms and their recommended medicines
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

// Get DOM elements
const symptomButtonsContainer = document.getElementById("symptom-buttons");
const outputDiv = document.getElementById("output");

// Create symptom buttons
Object.keys(symptomData).forEach(symptom => {
  const btn = document.createElement("button");
  btn.classList.add("symptom-btn");
  btn.textContent = symptom;

  // On click: show medicine suggestion immediately
  btn.addEventListener("click", () => {
    const recommendation = symptomData[symptom];
    outputDiv.innerHTML = `
      <div class="result">
        <h3>Symptom: ${symptom}</h3>
        <p><strong>Recommended Medicine:</strong> ${recommendation}</p>
      </div>
    `;

    // Button click animation
    document.querySelectorAll(".symptom-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });

  symptomButtonsContainer.appendChild(btn);
});
