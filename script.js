// -------------------- MKF Pharma - script.js --------------------
// Local Drug Database Version with full clinical fields
// Includes: Class, Indications, Mechanism, Usage, Side Effects, Contraindications, Interactions, Pregnancy

const DEV_LOCAL_DB = {
  "aspirin": {
    name: "Aspirin",
    class: "Salicylate (NSAID)",
    indications: ["Pain", "Fever", "Inflammation", "Low-dose for MI prevention"],
    mechanism: "Irreversible inhibition of COX-1 and COX-2 → decreased prostaglandin and thromboxane synthesis.",
    usage: "Take 1 tablet (325–650 mg) every 4–6 hours as needed for pain or fever; do not exceed 4 g/day.",
    sideEffects: ["Gastrointestinal bleeding", "Ulceration", "Nausea", "Tinnitus (at high doses)"],
    contraindications: ["Peptic ulcer disease", "Bleeding disorders", "Children with viral infections (risk of Reye’s syndrome)"],
    interactions: ["Warfarin", "Corticosteroids", "Alcohol", "Other NSAIDs"],
    pregnancy: "Avoid in the third trimester due to risk of premature closure of the ductus arteriosus."
  },

  "amoxicillin": {
    name: "Amoxicillin",
    class: "Beta-lactam antibiotic (penicillin class)",
    indications: ["Bacterial infections", "Otitis media", "Sinusitis", "Pneumonia"],
    mechanism: "Inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins → cell lysis.",
    usage: "Take 500 mg every 8 hours or 875 mg every 12 hours; complete full course as prescribed.",
    sideEffects: ["Rash", "Diarrhea", "Nausea", "Allergic reactions (anaphylaxis rare)"],
    contraindications: ["Hypersensitivity to penicillins or beta-lactams"],
    interactions: ["Methotrexate (increased toxicity)", "Oral contraceptives (reduced effectiveness)"],
    pregnancy: "Generally considered safe (Category B)."
  },

  "metformin": {
    name: "Metformin",
    class: "Biguanide (antidiabetic)",
    indications: ["Type 2 diabetes mellitus", "Polycystic ovary syndrome (off-label)"],
    mechanism: "Decreases hepatic glucose production, decreases intestinal absorption of glucose, and improves insulin sensitivity.",
    usage: "Start with 500 mg once daily with meals; gradually increase to 1000 mg twice daily as tolerated.",
    sideEffects: ["Nausea", "Diarrhea", "Abdominal discomfort", "Rare: lactic acidosis"],
    contraindications: ["Severe renal impairment (eGFR < 30 mL/min/1.73 m²)", "Metabolic acidosis", "Severe hepatic disease"],
    interactions: ["Alcohol", "Iodinated contrast media (hold before and after imaging)", "Cimetidine"],
    pregnancy: "Generally safe; used in gestational diabetes under supervision."
  },

  // Add more drugs below using this same format...
};

// -------------------- Elements --------------------
const searchBtn = document.getElementById("search-btn");
const sampleBtn = document.getElementById("sample-btn");
const input = document.getElementById("drug-input");
const resultsDiv = document.getElementById("results");
const historyList = document.getElementById("history-list");

let searchHistory = [];

// -------------------- Core Search Logic --------------------
function searchDrug(drugName) {
  const key = drugName.toLowerCase().trim();

  if (!key) {
    alert("Please enter a drug name.");
    return;
  }

  const drug = DEV_LOCAL_DB[key];

  if (drug) {
    renderDrug(drug);
    addToHistory(drugName);
  } else {
    resultsDiv.classList.remove("hidden");
    resultsDiv.innerHTML = `
      <p style="color:#c0392b"><strong>No results found</strong> for "${drugName}".</p>
      <p>Try another drug name or check your spelling.</p>
    `;
  }
}

// -------------------- Render Function --------------------
function renderDrug(drug) {
  resultsDiv.classList.remove("hidden");

  resultsDiv.innerHTML = `
    <h2>${drug.name || "Unknown Drug"}</h2>
    <p><strong>Class:</strong> ${drug.class || "Information not available"}</p>
    <p><strong>Indications:</strong> ${drug.indications ? drug.indications.join(", ") : "Information not available"}</p>
    <p><strong>Mechanism of Action:</strong> ${drug.mechanism || "Information not available"}</p>
    <p><strong>Usage:</strong> ${drug.usage || "Usage information not available."}</p>
    <p><strong>Side Effects:</strong> ${drug.sideEffects ? drug.sideEffects.join(", ") : "Information not available"}</p>
    <p><strong>Contraindications:</strong> ${drug.contraindications ? drug.contraindications.join(", ") : "Information not available"}</p>
    <p><strong>Interactions:</strong> ${drug.interactions ? drug.interactions.join(", ") : "Information not available"}</p>
    <p><strong>Pregnancy:</strong> ${drug.pregnancy || "Information not available"}</p>
  `;
}

// -------------------- Search History --------------------
function addToHistory(drugName) {
  if (!searchHistory.includes(drugName)) {
    searchHistory.push(drugName);
    renderHistory();
  }
}

function renderHistory() {
  historyList.innerHTML = "";
  searchHistory.forEach((drug) => {
    const div = document.createElement("div");
    div.textContent = drug;
    div.classList.add("history-item");
    div.style.cursor = "pointer";
    div.onclick = () => searchDrug(drug);
    historyList.appendChild(div);
  });
}

// -------------------- Event Listeners --------------------
searchBtn.addEventListener("click", () => searchDrug(input.value));
sampleBtn.addEventListener("click", () => {
  input.value = "aspirin";
  searchDrug("aspirin");
});
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchDrug(input.value);
});

