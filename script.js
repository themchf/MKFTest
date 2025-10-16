/* MKF-LabAnalyzer client-side
   - Extract text from uploaded PDF (pdf.js) or scanned image (Tesseract OCR)
   - Parse lab names + numeric values using heuristics
   - Compare to reference ranges and flag results
   - Works with partial reports
*/

/* -------------------- Reference database --------------------
   Each entry:
   key: canonical id
   name: display
   synonyms: array of words to match (lowercase)
   unit: expected default unit (string or null)
   ranges: { male: [low,high], female: [low,high], other: [low,high] } (units assumed)
   note: optional
*/
const LAB_DB = {
  /* CBC */
  "WBC": {name:"WBC", synonyms:["wbc","white blood cell","white blood cells","leukocytes"], unit:"10^3/µL", ranges:{male:[4.0,11.0],female:[4.0,11.0],other:[4.0,11.0]} },
  "RBC": {name:"RBC", synonyms:["rbc","red blood cell","erythrocytes"], unit:"10^6/µL", ranges:{male:[4.5,5.9],female:[4.1,5.1],other:[4.1,5.9]} },
  "HGB": {name:"Hemoglobin", synonyms:["hb","hgb","hemoglobin"], unit:"g/dL", ranges:{male:[13.5,17.5],female:[12.0,15.5],other:[12.0,17.5]} },
  "HCT": {name:"Hematocrit", synonyms:["hct","hematocrit"], unit:"%", ranges:{male:[41,53],female:[36,46],other:[36,53]} },
  "MCV": {name:"MCV", synonyms:["mcv","mean corpuscular volume"], unit:"fL", ranges:{male:[80,100],female:[80,100],other:[80,100]} },
  "MCH": {name:"MCH", synonyms:["mch","mean corpuscular hemoglobin"], unit:"pg", ranges:{male:[27,33],female:[27,33],other:[27,33]} },
  "MCHC": {name:"MCHC", synonyms:["mchc","mean corpuscular hemoglobin concentration"], unit:"g/dL", ranges:{male:[32,36],female:[32,36],other:[32,36]} },
  "PLT": {name:"Platelets", synonyms:["plt","platelet","platelets"], unit:"10^3/µL", ranges:{male:[150,450],female:[150,450],other:[150,450]} },

  /* Iron and related */
  "IRON": {name:"Iron (serum)", synonyms:["iron","serum iron"], unit:"µg/dL", ranges:{male:[60,170],female:[60,170],other:[60,170]}},
  "FERRITIN": {name:"Ferritin", synonyms:["ferritin"], unit:"ng/mL", ranges:{male:[24,336],female:[11,307],other:[11,336]}},
  "TIBC": {name:"TIBC", synonyms:["tibc","total iron binding capacity","total iron-binding capacity"], unit:"µg/dL", ranges:{male:[240,450],female:[240,450],other:[240,450]}},
  "TRANSFERRIN_SAT": {name:"Transferrin saturation", synonyms:["transferrin saturation","tsat","transferrin sat","transferrin %"], unit:"%", ranges:{male:[20,50],female:[20,50],other:[20,50]}},

  /* Vitamins & minerals (common) */
  "VITAMIN_D": {name:"Vitamin D (25-OH)", synonyms:["vitamin d","25-oh vitamin d","25-hydroxyvitamin d","25ohd"], unit:"ng/mL", ranges:{male:[30,100],female:[30,100],other:[30,100]}},
  "VITAMIN_B12": {name:"Vitamin B12", synonyms:["vitamin b12","b12","cobalamin"], unit:"pg/mL", ranges:{male:[200,900],female:[200,900],other:[200,900]}},
  "FOLATE": {name:"Folate", synonyms:["folate","folic acid"], unit:"ng/mL", ranges:{male:[3.0,20.0],female:[3.0,20.0],other:[3.0,20.0]}},
  "MAGNESIUM": {name:"Magnesium", synonyms:["magnesium","mg"], unit:"mg/dL", ranges:{male:[1.7,2.2],female:[1.7,2.2],other:[1.7,2.2]}},
  "CALCIUM": {name:"Calcium", synonyms:["calcium","ca"], unit:"mg/dL", ranges:{male:[8.6,10.2],female:[8.6,10.2],other:[8.6,10.2]}},
  "ZINC": {name:"Zinc", synonyms:["zinc"], unit:"µg/dL", ranges:{male:[70,120],female:[70,120],other:[70,120]}},

  /* Renal / electrolytes */
  "NA": {name:"Sodium", synonyms:["na","sodium"], unit:"mmol/L", ranges:{male:[135,145],female:[135,145],other:[135,145]}},
  "K": {name:"Potassium", synonyms:["k","potassium"], unit:"mmol/L", ranges:{male:[3.5,5.1],female:[3.5,5.1],other:[3.5,5.1]}},
  "Cl": {name:"Chloride", synonyms:["cl","chloride"], unit:"mmol/L", ranges:{male:[98,107],female:[98,107],other:[98,107]}},
  "HCO3": {name:"Bicarbonate", synonyms:["hco3","bicarbonate","co2"], unit:"mmol/L", ranges:{male:[22,29],female:[22,29],other:[22,29]}},
  "BUN": {name:"BUN", synonyms:["bun","blood urea nitrogen"], unit:"mg/dL", ranges:{male:[7,20],female:[7,20],other:[7,20]}},
  "CREAT": {name:"Creatinine", synonyms:["creatinine","cr"], unit:"mg/dL", ranges:{male:[0.74,1.35],female:[0.59,1.04],other:[0.59,1.35]}},
  "EGFR": {name:"eGFR", synonyms:["egfr","gfr","estimated glomerular filtration rate"], unit:"mL/min/1.73m2", ranges:{male:[60,200],female:[60,200],other:[60,200]}},

  /* Liver */
  "AST": {name:"AST (SGOT)", synonyms:["ast","sgot"], unit:"U/L", ranges:{male:[10,40],female:[9,32],other:[9,40]}},
  "ALT": {name:"ALT (SGPT)", synonyms:["alt","sgpt"], unit:"U/L", ranges:{male:[7,56],female:[7,56],other:[7,56]}},
  "ALP": {name:"Alkaline phosphatase", synonyms:["alp","alk phos","alkaline phosphatase"], unit:"U/L", ranges:{male:[44,147],female:[44,147],other:[44,147]}},
  "BIL": {name:"Bilirubin (total)", synonyms:["bilirubin","total bilirubin","bil"], unit:"mg/dL", ranges:{male:[0.1,1.2],female:[0.1,1.2],other:[0.1,1.2]}},

  /* Thyroid */
  "TSH": {name:"TSH", synonyms:["tsh"], unit:"µIU/mL", ranges:{male:[0.4,4.0],female:[0.4,4.0],other:[0.4,4.0]}},
  "FT4": {name:"Free T4", synonyms:["ft4","free t4"], unit:"ng/dL", ranges:{male:[0.8,1.8],female:[0.8,1.8],other:[0.8,1.8]}},
  "FT3": {name:"Free T3", synonyms:["ft3","free t3"], unit:"pg/mL", ranges:{male:[2.3,4.2],female:[2.3,4.2],other:[2.3,4.2]}},

  /* Lipids */
  "CHOL": {name:"Total cholesterol", synonyms:["cholesterol","total cholesterol"], unit:"mg/dL", ranges:{male:[125,200],female:[125,200],other:[125,200]}},
  "LDL": {name:"LDL cholesterol", synonyms:["ldl","ldl-c"], unit:"mg/dL", ranges:{male:[0,129],female:[0,129],other:[0,129]}},
  "HDL": {name:"HDL cholesterol", synonyms:["hdl","hdl-c"], unit:"mg/dL", ranges:{male:[40,60],female:[50,60],other:[40,60]}},
  "TRIG": {name:"Triglycerides", synonyms:["triglycerides","trig"], unit:"mg/dL", ranges:{male:[0,150],female:[0,150],other:[0,150]}},

  /* Diabetes */
  "GLU": {name:"Glucose (fasting)", synonyms:["glucose","gluc","fasting glucose","glucose (f)"], unit:"mg/dL", ranges:{male:[70,99],female:[70,99],other:[70,99]}},
  "A1C": {name:"Hemoglobin A1c", synonyms:["a1c","hba1c"], unit:"%", ranges:{male:[4.0,5.6],female:[4.0,5.6],other:[4.0,5.6]}},

  /* Coagulation */
  "PT": {name:"Prothrombin time (PT)", synonyms:["pt"], unit:"s", ranges:{male:[11,13.5],female:[11,13.5],other:[11,13.5]}},
  "INR": {name:"INR", synonyms:["inr"], unit:"", ranges:{male:[0.8,1.2],female:[0.8,1.2],other:[0.8,1.2]}},
  "APTT": {name:"aPTT", synonyms:["aptt","ptt"], unit:"s", ranges:{male:[25,35],female:[25,35],other:[25,35]}},

  /* Inflammation */
  "ESR": {name:"ESR", synonyms:["esr","erythrocyte sedimentation rate"], unit:"mm/hr", ranges:{male:[0,15],female:[0,20],other:[0,20]}},
  "CRP": {name:"CRP", synonyms:["crp","c-reactive protein"], unit:"mg/L", ranges:{male:[0,5],female:[0,5],other:[0,5]}},

  /* Fertility (common) */
  "FSH": {name:"FSH", synonyms:["fsh"], unit:"mIU/mL", ranges:{male:[1,12],female:[1,12],other:[1,12]}},
  "LH": {name:"LH", synonyms:["lh"], unit:"mIU/mL", ranges:{male:[1,12],female:[1,12],other:[1,12]}},
  "E2": {name:"Estradiol (E2)", synonyms:["estradiol","e2"], unit:"pg/mL", ranges:{male:[10,50],female:[15,350],other:[10,350]}},
  "PROLACTIN": {name:"Prolactin", synonyms:["prolactin"], unit:"ng/mL", ranges:{male:[2,18],female:[2,29],other:[2,29]}},

  /* Serology (presence-based) */
  "HBSAG": {name:"HbsAg", synonyms:["hbsag","hepatitis b surface antigen"], unit:"", ranges:{male:[0,0],female:[0,0],other:[0,0]}, note:"qualitative"},
  "HCV": {name:"HCV Ab", synonyms:["hcv","hepatitis c antibody"], unit:"", ranges:{male:[0,0],female:[0,0],other:[0,0]}, note:"qualitative"},
  "HIV": {name:"HIV Ab", synonyms:["hiv","hiv antibody"], unit:"", ranges:{male:[0,0],female:[0,0],other:[0,0]}, note:"qualitative"},
};

/* -------------------- Utility: flatten synonyms -> lookup -------------------- */
const SYN_TO_KEY = {};
for (const [k,v] of Object.entries(LAB_DB)) {
  for (const s of v.synonyms) SYN_TO_KEY[s.toLowerCase()] = k;
  SYN_TO_KEY[v.name.toLowerCase()] = k;
}

/* -------------------- Text extraction helpers -------------------- */

// Try to extract text from PDF using pdf.js
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
  let fullText = "";
  for (let p=1; p<=pdf.numPages; p++){
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const strings = content.items.map(i => i.str);
    fullText += strings.join(" ") + "\n";
  }
  return fullText;
}

// Fallback: OCR with Tesseract (images or scanned PDFs converted to images)
async function ocrFile(file) {
  const {data} = await Tesseract.recognize(file, 'eng', {logger: m => {
    // console.log(m);
  }});
  return data.text;
}

/* -------------------- Parsing heuristics -------------------- */

// Extract numeric tokens from a line (value + optional unit)
function parseNumbersFromText(text) {
  // match patterns like 12.3, 12, 1,234, 4.5E-3, 12 mg/dL etc.
  const rx = /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|\d+\.\d+|\d+)(?:\s*(e|E|×)\s*[-+]?\d+)?\s*(?:([^\s,;%()]+))?/g;
  const matches = [];
  let m;
  while ((m = rx.exec(text)) !== null) {
    // capture number and following token (possible unit)
    let raw = m[1].replace(/,/g,'');
    let num = Number(raw);
    let unit = m[3] ? m[3].replace(/[,:;]$/,'') : "";
    matches.push({num, unit, index: m.index});
  }
  return matches;
}

// Normalize a text line: lowercase, remove extra chars
function normalizeLine(s){ return s.trim().toLowerCase().replace(/\s+/g,' '); }

// Given full text, produce array of lines
function getLines(text) {
  // split by newline, semicolon and double-space heuristics
  return text.split(/\r?\n|;|(?<=\.)\s{2,}/).map(l=>l.trim()).filter(l=>l.length>0);
}

/* Attempt to find lab name and value in lines:
   - for each line look for known synonyms; if found, try to parse numeric in same line
   - also check neighbor tokens (next lines) if same line missing number
*/
function findLabsInText(text) {
  const lines = getLines(text);
  const found = {}; // key -> {value, unit, rawLine, confidence}
  for (let i=0;i<lines.length;i++){
    const L = normalizeLine(lines[i]);
    // tokenized words
    const words = L.split(/[\s,()\/]+/).filter(Boolean);
    // search for synonyms substrings (n-grams)
    for (let n=words.length; n>=1; n--) {
      for (let start=0; start+ n <= words.length; start++){
        const phrase = words.slice(start,start+n).join(' ');
        if (SYN_TO_KEY[phrase]) {
          const key = SYN_TO_KEY[phrase];
          // try parse numbers in the same line
          const nums = parseNumbersFromText(lines[i]);
          if (nums.length>0) {
            // pick number closest after phrase
            let best = nums[0];
            for (const numObj of nums) {
              if (numObj.index > 0) { best = numObj; break; }
            }
            found[key] = {value: best.num, unit: best.unit || "", rawLine: lines[i], confidence: 0.95};
          } else {
            // look ahead a couple lines
            let got = false;
            for (let j=1;j<=2 && (i+j) < lines.length; j++){
              const nums2 = parseNumbersFromText(lines[i+j]);
              if (nums2.length>0) {
                found[key] = {value: nums2[0].num, unit: nums2[0].unit || "", rawLine: lines[i] + " | " + lines[i+j], confidence: 0.8};
                got = true; break;
              }
            }
            if (!got) {
              // check the same line for "positive"/"negative" (qualitative)
              if (/\b(positive|negative|reactive|nonreactive|detected|not detected|detected)\b/.test(lines[i])) {
                const q = lines[i].match(/\b(positive|negative|reactive|nonreactive|detected|not detected)\b/);
                found[key] = {value: q ? q[0] : "present", unit:"", rawLine: lines[i], confidence:0.7};
              }
            }
          }
        }
      }
    }
  }
  return found;
}

/* -------------------- Interpretation & comparison -------------------- */

// Compare numeric value vs ranges for sex and produce flag & severity
function interpretValue(key, value, unitReported, sex) {
  const meta = LAB_DB[key];
  if (!meta) return {flag:"unknown", note:"No reference", expectedUnit: null};
  const ranges = meta.ranges;
  const expectedUnit = meta.unit || "";
  const sexKey = (sex === 'female' ? 'female' : (sex === 'male' ? 'male' : 'other'));
  const ref = ranges[sexKey] || ranges['other'] || null;
  if (!ref) return {flag:"unknown", note:"No ref range for sex", expectedUnit};
  const low = ref[0], high = ref[1];

  // handle qualitative (no numeric)
  if (typeof value !== 'number' || isNaN(value)) {
    // return as qualitative
    return {flag:"qualitative", note:value, expectedUnit};
  }

  // convert units if necessary for common mismatches (simple conversions)
  // NOTE: this is limited: we support few conversions (glucose mg/dL <-> mmol/L)
  let val = value;
  const reported = (unitReported || "").toLowerCase();
  if (expectedUnit) {
    if (expectedUnit.includes("mg/dl") && reported.includes("mmol/l")) {
      // glucose or lipids? best-effort: glucose  mmol/L -> mg/dL multiply 18
      val = value * 18;
    } else if (expectedUnit.includes("mmol/l") && reported.includes("mg/dl")) {
      val = value / 18;
    }
    // more conversions can be added as needed
  }

  let flag = "normal";
  if (val < low) flag = "low";
  else if (val > high) flag = "high";

  // severity heuristic
  let severity = "mild";
  if (flag === "low" || flag === "high") {
    const pct = Math.abs((val - (flag==="low"? low : high)) / ((flag==="low"? low : high) || 1));
    if (pct > 0.5) severity = "marked"; else if (pct > 0.2) severity = "moderate";
  } else severity = "normal";

  const note = `Ref ${low}–${high} ${expectedUnit||""}`;
  return {flag, severity, note, expectedUnit, reportedUnit: unitReported, valueConverted: val};
}

/* -------------------- Main driver -------------------- */

async function analyzeReport(file, sex, age, unitSystem) {
  const statusText = document.getElementById('statusText');
  statusText.innerText = 'Reading file...';
  let text = "";
  const name = file.name.toLowerCase();

  try {
    if (name.endsWith('.pdf')) {
      // try PDF text extraction
      statusText.innerText = 'Extracting text from PDF...';
      try {
        text = await extractTextFromPDF(file);
        // heuristic: if extracted text short, maybe scanned PDF -> OCR
        if (!text || text.trim().length < 50) {
          statusText.innerText = 'PDF appears scanned — running OCR...';
          text = await ocrFile(file);
        }
      } catch (e) {
        // fallback to OCR
        console.warn("pdf text extraction failed:", e);
        statusText.innerText = 'PDF parsing failed — running OCR fallback...';
        text = await ocrFile(file);
      }
    } else {
      // image
      statusText.innerText = 'Running OCR on image...';
      text = await ocrFile(file);
    }
  } catch (err) {
    console.error(err);
    throw new Error("Failed to extract text from file: " + err.message);
  }

  statusText.innerText = 'Parsing labs...';
  const found = findLabsInText(text);

  // interpret found
  const results = [];
  for (const [k,v] of Object.entries(found)) {
    const valueRaw = v.value;
    const unitRaw = (v.unit || "").replace(/\./g,'').replace(/\s*/g,'');
    const interp = interpretValue(k, Number(valueRaw), unitRaw, sex);
    results.push({
      key:k, name: LAB_DB[k].name, rawLine: v.rawLine, value: valueRaw, unit: unitRaw,
      flag: interp.flag, severity: interp.severity || 'normal', note: interp.note || '', expectedUnit: interp.expectedUnit, converted: interp.valueConverted
    });
  }

  // Also produce a summary: which test categories found vs missing
  const summary = [];
  for (const [k,meta] of Object.entries(LAB_DB)) {
    if (results.find(r=>r.key===k)) summary.push({key:k, name:meta.name, found:true});
  }

  return {results, summary, rawText: text};
}

/* -------------------- UI wiring -------------------- */

document.getElementById('analyzeBtn').addEventListener('click', async ()=>{
  const f = document.getElementById('fileInput').files[0];
  if (!f) { alert('Please choose a PDF or image file'); return; }
  const sex = document.getElementById('sex').value;
  const age = Number(document.getElementById('age').value) || null;
  const unitSystem = document.getElementById('unitSystem').value;

  document.getElementById('statusText').innerText = 'Starting analysis...';
  try {
    const out = await analyzeReport(f, sex, age, unitSystem);
    renderResults(out);
    document.getElementById('statusText').innerText = 'Analysis complete';
  } catch (err) {
    console.error(err);
    document.getElementById('statusText').innerText = 'Error: ' + (err.message || err);
  }
});

function renderResults(out) {
  const resultsEl = document.getElementById('results');
  const list = document.getElementById('resultsList');
  const summary = document.getElementById('summaryList');
  list.innerHTML = '';
  summary.innerHTML = '';

  if (!out.results.length) {
    list.innerHTML = '<div class="small">No recognizable numeric labs were found. Try a clear PDF or a different report format.</div>';
  } else {
    for (const r of out.results) {
      const row = document.createElement('div'); row.className='result-row';
      const name = document.createElement('div'); name.className='result-name'; name.textContent = r.name;
      const val = document.createElement('div'); val.className='result-val'; val.textContent = `${r.value} ${r.unit || r.expectedUnit || ''}`;
      const flag = document.createElement('div'); flag.className='result-flag';
      if (r.flag === 'low') { flag.className += ' flag-low'; flag.textContent = 'LOW'; }
      else if (r.flag === 'high') { flag.className += ' flag-high'; flag.textContent = 'HIGH'; }
      else if (r.flag === 'qualitative') { flag.className += ' flag-normal'; flag.textContent = r.value.toString(); }
      else { flag.className += ' flag-normal'; flag.textContent = 'Normal'; }
      const note = document.createElement('div'); note.className='small'; note.textContent = r.note || '';
      row.appendChild(name); row.appendChild(val); row.appendChild(flag);
      const wrap = document.createElement('div'); wrap.style.flex='1'; wrap.appendChild(row); if (note) wrap.appendChild(note);
      list.appendChild(wrap);
    }
  }

  // summary: list keys we found
  const foundKeys = new Set(out.results.map(r=>r.key));
  for (const [k,meta] of Object.entries(LAB_DB)) {
    if (foundKeys.has(k)) {
      const it = document.createElement('div'); it.className='summary-item'; it.textContent = `${meta.name} — detected`;
      summary.appendChild(it);
    }
  }

  resultsEl.classList.remove('hidden');
}

