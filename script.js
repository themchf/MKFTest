// --- Existing conditions array (keep as is) ---
const conditions = [
  // --- Conditions database ---
  {
    keywords: ["تا", "کۆکە", "بەڵغەمی زەرد"],
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
"تۆشەی گەرمی گلوو", "پەلە سپی", "سەردرد", "هەست بە ڕووناکی", "گرێی خۆشک",
"ئەزاری جەستە", "بێرهەوی دەمێن", "هێنانەوەی فراوانی خۆزگە", "تێژینی زیاتر", "کەمبوونی قەبارە", "ئەزاری سەنگ", "هەناسە کەم", "ئەرەق کرن",
"دزڵ", "قی کردن", "تەباشتی", "ئیشکی خەریکی", "ئەزاری شێوەکەت",
"ئەزاری کۆل-پوش", "خەستگی", "ئێش و خۆشک", 
"دڵ شێواندن", "دەرەی پاش", "هەست بە سرما", "هێنان بە ئازار", "هێنان سوتان", "رەنگی خوێن لە تەخت",
"خڕایی سەر", "زەردی چاو",
"سوربوونی چاو", 
"ئەرەقی شەو"
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
          <p><strong>Frequency:</strong> ${cond.frequency}</p>
          <p><strong>Duration:</strong> ${cond.duration}</p>
          <p class="warning">⚠️ ${cond.warning}</p>
        </div>
      `;
      break;
    }
  }

  document.getElementById("output").innerHTML = result;
}







