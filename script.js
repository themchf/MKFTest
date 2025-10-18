/* -------------------- Lab Database -------------------- */
const LAB_DB = {
  "WBC": { name: "WBC", synonyms: ["wbc", "white blood cell", "leukocyte"], unit: "10^3/µL", ranges: { male: [4, 11], female: [4, 11], other: [4, 11] } },
  "HGB": { name: "Hemoglobin", synonyms: ["hgb", "hemoglobin"], unit: "g/dL", ranges: { male: [13.5, 17.5], female: [12, 15.5], other: [12, 17.5] } },
  "HCT": { name: "Hematocrit", synonyms: ["hct", "hematocrit"], unit: "%", ranges: { male: [41, 53], female: [36, 46], other: [36, 53] } },
  "RBC": { name: "RBC", synonyms: ["rbc", "red blood cell", "erythrocyte"], unit: "10^6/µL", ranges: { male: [4.5, 5.9], female: [4.1, 5.1], other: [4.1, 5.9] } },
  "PLT": { name: "Platelets", synonyms: ["plt", "platelet", "platelets"], unit: "10^3/µL", ranges: { male: [150, 450], female: [150, 450], other: [150, 450] } },
  "ALT": { name: "Alanine Aminotransferase", synonyms: ["alt", "alanine aminotransferase", "sgpt"], unit: "U/L", ranges: { male: [7, 56], female: [7, 56], other: [7, 56] } },
  "AST": { name: "Aspartate Aminotransferase", synonyms: ["ast", "aspartate aminotransferase", "sgot"], unit: "U/L", ranges: { male: [10, 40], female: [10, 40], other: [10, 40] } },
  "ALP": { name: "Alkaline Phosphatase", synonyms: ["alp", "alkaline phosphatase"], unit: "U/L", ranges: { male: [45, 115], female: [30, 100], other: [30, 115] } },
  "GLU": { name: "Fasting Glucose", synonyms: ["glu", "glucose", "fasting glucose"], unit: "mg/dL", ranges: { male: [70, 99], female: [70, 99], other: [70, 99] } },
  "CREAT": { name: "Creatinine", synonyms: ["creat", "creatinine", "serum creatinine"], unit: "mg/dL", ranges: { male: [0.7, 1.3], female: [0.6, 1.1], other: [0.6, 1.3] } },
  "TSH": { name: "Thyroid Stimulating Hormone", synonyms: ["tsh", "thyroid stimulating hormone"], unit: "µIU/mL", ranges: { male: [0.4, 4.0], female: [0.4, 4.0], other: [0.4, 4.0] } },
  "FT4": { name: "Free T4", synonyms: ["ft4", "free t4", "thyroxine"], unit: "ng/dL", ranges: { male: [0.8, 1.8], female: [0.8, 1.8], other: [0.8, 1.8] } },
  "FT3": { name: "Free T3", synonyms: ["ft3", "free t3", "triiodothyronine"], unit: "pg/mL", ranges: { male: [2.3, 4.2], female: [2.3, 4.2], other: [2.3, 4.2] } },
  // Add more tests as needed
};

/* -------------------- Synonym Flattening -------------------- */
const SYN_TO_KEY = {};
for (const [key, value] of Object.entries(LAB_DB)) {
  SYN_TO_KEY[value.name.toLowerCase()] = key;
  value.synonyms.forEach(s => SYN_TO_KEY[s.toLowerCase()] = key);
}

/* -------------------- PDF Text Extraction -------------------- */
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const strings = content.items.map(i => i.str);
    text += strings.join(" ") + "\n";
  }
  return text;
}

/* -------------------- OCR (Image Reading) -------------------- */
async function ocrFile(file) {
  const { data } = await Tesseract.recognize(file, 'eng', {
    tessedit_char_whitelist: '0123456789.-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ%µ/ ',
  });
  return data.text;
}

/* -------------------- Text Cleanup -------------------- */
function cleanText(text) {
  return text
    .replace(/[,]/g, ".")
    .replace(/[^0-9a-zA-Zµ%/. \n-]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/* -------------------- Number Extraction -------------------- */
function parseNumbersFromText(text) {
  const rx = /([0-9]+(?:\.[0-9]+)?)/g;
  const matches = [];
  let m;
  while ((m = rx.exec(text)) !== null) {
    matches.push({ num: Number(m[1]), index: m.index });
  }
  return matches;
}

/* -------------------- Line Handling -------------------- */
function normalizeLine(s) { return s.trim().toLowerCase(); }
function getLines(text) {
  return text.split(/\r?\n|;/).map(l => l.trim()).filter(l => l.length > 0);
}

/* -------------------- Find Labs in Text -------------------- */
function findLabsInText(text) {
  const lines = getLines(text);
  const found = {};
  for (const line of lines) {
    const lower = normalizeLine(line);
    for (const phrase in SYN_TO_KEY) {
      if (lower.includes(phrase)) {
        const key = SYN_TO_KEY[phrase];
        const nums = parseNumbersFromText(line);
        if (nums.length > 0) {
          found[key] = { value: nums[0].num, rawLine: line };
        }
      }
    }
  }
  return found;
}

/* -------------------- Interpret Value (Sex-Specific) -------------------- */
function interpretValue(key, value, sex = "other") {
  const meta = LAB_DB[key];
  if (!meta) return { flag: "Unknown", value, unit: "", name: key };
  const [low, high] = meta.ranges[sex] || meta.ranges.other;
  let flag = "Normal";
  let symbol = "–";
  if (value < low) { flag = "Low"; symbol = "↓"; }
  else if (value > high) { flag = "High"; symbol = "↑"; }
  return { flag, symbol, value, unit: meta.unit, name: meta.name, low, high };
}

/* -------------------- Prediction Logic -------------------- */
function predictConditions(labs) {
  const cond = [];
  if (labs["WBC"] && labs["WBC"].value > 11) cond.push("Possible infection (High WBC)");
  if (labs["HGB"] && labs["HGB"].value < 12) cond.push("Anemia (Low Hemoglobin)");
  if (labs["ALT"] && labs["ALT"].value > 56) cond.push("Liver cell injury (High ALT)");
  if (labs["AST"] && labs["AST"].value > 40) cond.push("Possible liver or muscle damage (High AST)");
  if (labs["CREAT"] && labs["CREAT"].value > 1.3) cond.push("Possible renal impairment (High Creatinine)");
  if (labs["TSH"] && (labs["TSH"].value < 0.4 || labs["TSH"].value > 4.0)) cond.push("Thyroid dysfunction (Abnormal TSH)");
  return cond.length > 0 ? cond : ["No major abnormalities detected"];
}

/* -------------------- Main Analyzer -------------------- */
async function analyzeReport(file, sex, age) {
  const statusText = document.getElementById("statusText");
  statusText.innerText = "Reading file...";

  let text = "";
  try {
    if (file.name.toLowerCase().endsWith(".pdf")) {
      text = await extractTextFromPDF(file);
      if (!text || text.trim().length < 50) text = await ocrFile(file);
    } else {
      text = await ocrFile(file);
    }
  } catch (err) {
    throw new Error("Failed to read file: " + err);
  }

  text = cleanText(text);
  statusText.innerText = "Parsing labs...";

  const found = findLabsInText(text);
  const flagsList = document.getElementById("flagsList");
  const predictionList = document.getElementById("predictionList");
  flagsList.innerHTML = "";
  predictionList.innerHTML = "";

  const interpreted = {};
  for (const k in found) {
    const iv = interpretValue(k, found[k].value, sex);
    interpreted[k] = iv;

    const div = document.createElement("div");
    div.className = "result-row";
    div.innerHTML = `
      <div class="result-name">${iv.name}</div>
      <div class="result-val">${iv.value.toFixed(2)} ${iv.unit}</div>
      <div class="result-flag ${iv.flag.toLowerCase()}">${iv.symbol} ${iv.flag}</div>
      <div class="result-range">${iv.low} – ${iv.high}</div>
    `;
    flagsList.appendChild(div);
  }

  document.getElementById("flagsSection").classList.remove("hidden");
  document.getElementById("predictionSection").classList.remove("hidden");

  const predictions = predictConditions(interpreted);
  predictions.forEach(p => {
    const div = document.createElement("div");
    div.className = "result-row";
    div.innerText = p;
    predictionList.appendChild(div);
  });

  statusText.innerText = "Analysis complete.";
}

/* -------------------- Event Listener -------------------- */
document.getElementById("analyzeBtn").addEventListener("click", async () => {
  const file = document.getElementById("fileInput").files[0];
  const sex = document.getElementById("sex").value;
  const age = Number(document.getElementById("age").value);
  const statusText = document.getElementById("statusText");

  if (!file) {
    statusText.innerText = "Please select a file!";
    return;
  }

  statusText.innerText = "Processing...";
  try {
    await analyzeReport(file, sex, age);
  } catch (err) {
    statusText.innerText = "Error: " + err.message;
  }
});
