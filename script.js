/* -------------------- Enhanced Lab DB (keep same structure; add units where helpful) -------------------- */
const LAB_DB = {
  "WBC": { name: "WBC", synonyms: ["wbc","white blood cell","leukocyte"], unit: "10^3/µL", ranges: { male:[4,11], female:[4,11], other:[4,11] } },
  "HGB": { name: "Hemoglobin", synonyms: ["hgb","hemoglobin","hb"], unit: "g/dL", ranges: { male:[13.5,17.5], female:[12,15.5], other:[12,17.5] } },
  "HCT": { name: "Hematocrit", synonyms: ["hct","hematocrit"], unit: "%", ranges: { male:[41,53], female:[36,46], other:[36,53] } },
  "RBC": { name: "RBC", synonyms: ["rbc","red blood cell","erythrocyte"], unit: "10^6/µL", ranges: { male:[4.5,5.9], female:[4.1,5.1], other:[4.1,5.9] } },
  "PLT": { name: "Platelets", synonyms: ["plt","platelet","platelets"], unit: "10^3/µL", ranges: { male:[150,450], female:[150,450], other:[150,450] } },
  "ALT": { name: "Alanine Aminotransferase", synonyms: ["alt","alanine aminotransferase","sgpt"], unit: "U/L", ranges: { male:[7,56], female:[7,56], other:[7,56] } },
  "AST": { name: "Aspartate Aminotransferase", synonyms: ["ast","aspartate aminotransferase","sgot"], unit: "U/L", ranges: { male:[10,40], female:[10,40], other:[10,40] } },
  "ALP": { name: "Alkaline Phosphatase", synonyms: ["alp","alkaline phosphatase"], unit: "U/L", ranges: { male:[45,115], female:[30,100], other:[30,115] } },
  "GLU": { name: "Fasting Glucose", synonyms: ["glu","glucose","fasting glucose","blood sugar"], unit: "mg/dL", ranges: { male:[70,99], female:[70,99], other:[70,99] } },
  "CREAT": { name: "Creatinine", synonyms: ["creat","creatinine","serum creatinine"], unit: "mg/dL", ranges: { male:[0.7,1.3], female:[0.6,1.1], other:[0.6,1.3] } },
  "TSH": { name: "Thyroid Stimulating Hormone", synonyms: ["tsh","thyroid stimulating hormone"], unit: "µIU/mL", ranges: { male:[0.4,4.0], female:[0.4,4.0], other:[0.4,4.0] } },
  "FT4": { name: "Free T4", synonyms: ["ft4","free t4","thyroxine"], unit: "ng/dL", ranges: { male:[0.8,1.8], female:[0.8,1.8], other:[0.8,1.8] } },
  "FT3": { name: "Free T3", synonyms: ["ft3","free t3","triiodothyronine"], unit: "pg/mL", ranges: { male:[2.3,4.2], female:[2.3,4.2], other:[2.3,4.2] } },
  // Add more tests if needed...
};

/* -------------------- Build flattened synonym map -------------------- */
const SYN_TO_KEY = {};
for (const [k, v] of Object.entries(LAB_DB)) {
  SYN_TO_KEY[v.name.toLowerCase()] = k;
  v.synonyms.forEach(s => SYN_TO_KEY[s.toLowerCase()] = k);
}

/* -------------------- OCR / PDF extraction (same as before, but we cleanup aggressively) -------------------- */
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

async function ocrFile(file) {
  const { data } = await Tesseract.recognize(file, 'eng', {
    tessedit_char_whitelist: '0123456789.,-()[]%µ/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ',
    logger: m => {}
  });
  return data.text;
}

/* -------------------- OCR artifact fixes & normalization -------------------- */
function normalizeOCRArtifacts(s) {
  // Common misreads: O->0, l->1, I->1, S->5 etc. Be conservative.
  return s
    .replace(/,/g, '.')             // comma decimals -> dot
    .replace(/O(?=\d)/g, '0')       // O followed by digit -> 0
    .replace(/\bO\b/g, '0')
    .replace(/\bS(?=\d)/g, '5')
    .replace(/[lI](?=\d)/g, '1')    // l or I before digit -> 1
    .replace(/[^0-9a-zA-Zµ%().\-\s\/:—–\[\]]/g, '')  // remove weird punctuation but keep range punctuation
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/* -------------------- Utility: Levenshtein distance (small implementation for fuzzy matching) -------------------- */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const v0 = Array(b.length + 1).fill(0);
  const v1 = Array(b.length + 1).fill(0);
  for (let i = 0; i <= b.length; i++) v0[i] = i;
  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= b.length; j++) v0[j] = v1[j];
  }
  return v1[b.length];
}

/* -------------------- Find best matching synonym (fuzzy) -------------------- */
function findBestKeyForPhrase(phrase) {
  const p = phrase.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  if (!p) return null;
  // Exact first
  if (SYN_TO_KEY[p]) return SYN_TO_KEY[p];
  // Otherwise fuzzy search among synonyms and names
  let best = null;
  let bestScore = Infinity;
  for (const syn of Object.keys(SYN_TO_KEY)) {
    const score = levenshtein(p, syn);
    if (score < bestScore) { bestScore = score; best = SYN_TO_KEY[syn]; }
  }
  // Heuristic: if score reasonably small relative to length, accept
  if (bestScore <= Math.max(2, Math.floor(p.length * 0.3))) return best;
  return null;
}

/* -------------------- Extract numbers in a line with their positions -------------------- */
function extractNumbersWithIndices(line) {
  const rx = /([0-9]+(?:\.[0-9]+)?)/g;
  const nums = [];
  let m;
  while ((m = rx.exec(line)) !== null) {
    nums.push({ num: Number(m[1]), index: m.index, match: m[1] });
  }
  return nums;
}

/* -------------------- Parse parentheses/range tokens e.g. (12-15.5) or [12 – 15] -------------------- */
function extractRangeFromLine(line) {
  const rx = /[\(\[\{]\s*([0-9]+(?:\.[0-9]+)?)\s*[–\-\u2013\u2014]\s*([0-9]+(?:\.[0-9]+)?)\s*[\)\]\}]/;
  const m = line.match(rx);
  if (m) return [Number(m[1]), Number(m[2])];
  return null;
}

/* -------------------- Determine which numeric value on a line is the actual result -------------------- */
function pickBestNumberForKey(line, keyMeta) {
  // Clean for consistent indexing
  const nums = extractNumbersWithIndices(line);
  if (nums.length === 0) return null;
  if (nums.length === 1) return nums[0].num;

  // If there's a parenthetical range, ignore numbers inside parentheses as possible "reference range"
  const parens = [];
  const parenRx = /[\(\[\{].*?[\)\]\}]/g;
  let pm;
  while ((pm = parenRx.exec(line)) !== null) parens.push({ start: pm.index, end: pm.index + pm[0].length });

  // Filter numbers that are outside parentheses first
  const outside = nums.filter(n => !parens.some(p => n.index >= p.start && n.index <= p.end));
  if (outside.length === 1) return outside[0].num;
  if (outside.length > 1) {
    // Heuristic: choose the number closest to the unit if unit appears
    if (keyMeta && keyMeta.unit) {
      const unitIdx = line.toLowerCase().indexOf(keyMeta.unit.toLowerCase());
      if (unitIdx >= 0) {
        let best = outside[0]; let bestDist = Math.abs(outside[0].index - unitIdx);
        outside.forEach(n => {
          const d = Math.abs(n.index - unitIdx);
          if (d < bestDist) { best = n; bestDist = d; }
        });
        return best.num;
      }
    }
    // Otherwise pick the number nearest to the start of the line after the word (assume result column)
    return outside[0].num;
  }

  // If all numbers are inside parentheses => maybe single value + range both inside (rare). Pick first number as default result.
  return nums[0].num;
}

/* -------------------- Improved findLabsInText: checks whole document, columns, and fuzzy name matches -------------------- */
function getLines(text) {
  return text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
}

function findLabsInText(text) {
  // Normalize artifacts aggressively
  text = normalizeOCRArtifacts(text);
  const lines = getLines(text);
  const found = {};

  // Build an index of lowercased lines for quick search
  const lowerLines = lines.map(l => l.toLowerCase());

  // First pass: direct phrase match in each line (exact or fuzzy)
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const lower = lowerLines[i];

    // If the line contains a colon-separated table (Test : value) or has multiple columns with many spaces, attempt column parsing
    // Column parsing: split on 2+ spaces -> many lab tables use that
    const cols = raw.split(/\s{2,}/).map(c => c.trim()).filter(c => c);
    if (cols.length >= 2) {
      // try to match first column to a test name
      const c0 = cols[0].toLowerCase();
      const possibleKey = findBestKeyForPhrase(c0);
      if (possibleKey) {
        // try to find numeric value among other columns (prefer column 1 or last)
        let numericCandidate = null;
        for (let j = 1; j < cols.length; j++) {
          const numMatch = extractNumbersWithIndices(cols[j]);
          if (numMatch.length > 0) { numericCandidate = Number(numMatch[0].num); break; }
        }
        // fallback: pick best number from entire line
        if (numericCandidate === null) {
          numericCandidate = pickBestNumberForKey(raw, LAB_DB[possibleKey]);
        }
        if (numericCandidate !== null) found[possibleKey] = { value: numericCandidate, rawLine: raw };
        continue;
      }
    }

    // If phrase appears anywhere in line (exact synonyms)
    for (const phrase of Object.keys(SYN_TO_KEY)) {
      if (lower.includes(phrase)) {
        const key = SYN_TO_KEY[phrase];
        const value = pickBestNumberForKey(raw, LAB_DB[key]);
        if (value !== null) found[key] = { value, rawLine: raw };
      }
    }

    // If no exact synonym matched, do a fuzzy attempt on the whole line first token(s)
    // Take first 1-3 words as candidate phrase
    const tokens = lower.split(/\s+/);
    for (let take = 3; take >= 1; take--) {
      const candidatePhrase = tokens.slice(0, take).join(' ');
      const possibleKey = findBestKeyForPhrase(candidatePhrase);
      if (possibleKey) {
        const value = pickBestNumberForKey(raw, LAB_DB[possibleKey]);
        if (value !== null) found[possibleKey] = { value, rawLine: raw };
        break;
      }
    }
  }

  // Second pass: If some tests still missing but there are lines with test name in header and a column below with numbers
  // (simple vertical table detection). We'll look for column headers that match any lab name then grab column values on subsequent lines.
  // Build tokens of each line split by whitespace
  const tokenized = lines.map(l => l.split(/\s+/));
  for (let col = 0; col < 6; col++) { // check first few columns
    // gather column candidate header words
    for (let r = 0; r < Math.min(4, tokenized.length); r++) {
      const head = (tokenized[r][col] || '').toLowerCase();
      if (!head) continue;
      const key = findBestKeyForPhrase(head);
      if (key && !found[key]) {
        // search below for first numeric in same column
        for (let rr = r + 1; rr < tokenized.length; rr++) {
          const valToken = (tokenized[rr][col] || '');
          const num = parseFloat(valToken.replace(',', '.'));
          if (!isNaN(num)) { found[key] = { value: num, rawLine: lines[rr] }; break; }
        }
      }
    }
  }

  return found;
}

/* -------------------- Interpret Value using sex-specific ranges and meta ranges -------------------- */
function interpretValue(key, value, sex = "other", age = null) {
  const meta = LAB_DB[key];
  if (!meta) return { flag: "Unknown", value, unit: "", name: key };
  const range = meta.ranges[sex] || meta.ranges.other;
  const [low, high] = range;
  let flag = "Normal", symbol = "–";
  if (value < low) { flag = "Low"; symbol = "↓"; }
  else if (value > high) { flag = "High"; symbol = "↑"; }
  // Round value smartly: if value >=100 use 0 decimals, else 1-2 decimals
  let displayValue = value;
  if (value >= 100) displayValue = Math.round(value);
  else if (value >= 10) displayValue = Math.round(value * 10) / 10;
  else displayValue = Math.round(value * 100) / 100;
  return { flag, symbol, value: displayValue, unit: meta.unit, name: meta.name, low, high };
}

/* -------------------- Prediction logic (use meta ranges where possible) -------------------- */
function predictConditions(labs) {
  const cond = [];
  // Use LAB_DB ranges to derive some predictions instead of magic numbers
  if (labs["WBC"] && labs["WBC"].value > (LAB_DB["WBC"].ranges.other[1] || 11)) cond.push("Possible infection (High WBC)");
  if (labs["HGB"] && labs["HGB"].value < (LAB_DB["HGB"].ranges.other[0] || 12)) cond.push("Anemia (Low Hemoglobin)");
  if (labs["ALT"] && labs["ALT"].value > (LAB_DB["ALT"].ranges.other[1] || 56)) cond.push("Liver cell injury (High ALT)");
  if (labs["AST"] && labs["AST"].value > (LAB_DB["AST"].ranges.other[1] || 40)) cond.push("Possible liver or muscle damage (High AST)");
  if (labs["CREAT"] && labs["CREAT"].value > (LAB_DB["CREAT"].ranges.other[1] || 1.3)) cond.push("Possible renal impairment (High Creatinine)");
  if (labs["TSH"] && (labs["TSH"].value < (LAB_DB["TSH"].ranges.other[0] || 0.4) || labs["TSH"].value > (LAB_DB["TSH"].ranges.other[1] || 4.0))) cond.push("Thyroid dysfunction (Abnormal TSH)");
  if (cond.length === 0) cond.push("No major abnormalities detected");
  return cond;
}

/* -------------------- Main analyzeReport (ties everything together) -------------------- */
async function analyzeReport(file, sex = "other", age = null) {
  const statusText = document.getElementById('statusText');
  statusText.innerText = 'Reading file...';
  let text = "";
  try {
    if (file.name && file.name.toLowerCase().endsWith('.pdf')) {
      text = await extractTextFromPDF(file);
      if (!text || text.trim().length < 30) text = await ocrFile(file);
    } else {
      text = await ocrFile(file);
    }
  } catch (err) {
    throw new Error("Failed to read file: " + err);
  }

  text = normalizeOCRArtifacts(text);
  statusText.innerText = 'Parsing labs...';

  const found = findLabsInText(text);
  const flagsList = document.getElementById('flagsList');
  const predictionList = document.getElementById('predictionList');
  flagsList.innerHTML = ''; predictionList.innerHTML = '';

  const interpreted = {};
  for (const k of Object.keys(found)) {
    const rawValue = found[k].value;
    const iv = interpretValue(k, rawValue, sex, age);
    interpreted[k] = iv;

    const div = document.createElement('div');
    div.className = 'result-row';
    div.innerHTML = `
      <div class="result-name">${iv.name}</div>
      <div class="result-val">${iv.value} ${iv.unit}</div>
      <div class="result-flag ${iv.flag.toLowerCase()}">${iv.symbol} ${iv.flag}</div>
      <div class="result-range">${iv.low} – ${iv.high}</div>
    `;
    flagsList.appendChild(div);
  }

  document.getElementById('flagsSection').classList.remove('hidden');
  document.getElementById('predictionSection').classList.remove('hidden');

  const predictions = predictConditions(interpreted);
  predictions.forEach(p => {
    const div = document.createElement('div');
    div.className = 'result-row';
    div.innerText = p;
    predictionList.appendChild(div);
  });

  statusText.innerText = 'Analysis complete.';
}

/* -------------------- UI Event Listener -------------------- */
document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const file = document.getElementById('fileInput').files[0];
  const sex = document.getElementById('sex').value || 'other';
  const age = Number(document.getElementById('age').value) || null;
  const statusText = document.getElementById('statusText');
  if (!file) { statusText.innerText = 'Please select a file!'; return; }
  statusText.innerText = 'Processing...';
  try {
    await analyzeReport(file, sex, age);
  } catch (err) {
    statusText.innerText = 'Error: ' + err.message;
  }
});
