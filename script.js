/* -------------------- LAB DB (same as before; units are the canonical units used for ranges) -------------------- */
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
  "VITAMIN_D": { name: "Vitamin D", synonyms: ["vitamin d","25-oh vitamin d","25-hydroxy vitamin d","25(oh)d","25ohd"], unit: "ng/mL", ranges: { male:[30,100], female:[30,100], other:[30,100] } },
  // ... add others
};

/* -------------------- Synonym flattening -------------------- */
const SYN_TO_KEY = {};
for (const [k, v] of Object.entries(LAB_DB)) {
  SYN_TO_KEY[v.name.toLowerCase()] = k;
  v.synonyms.forEach(s => SYN_TO_KEY[s.toLowerCase()] = k);
}

/* -------------------- Unit detection & conversion -------------------- */
const UNIT_RX = /\b(ng\/ml|nmol\/l|µg\/dl|ug\/dl|umol\/l|µmol\/l|mg\/dl|mmol\/l|u\/l|iu\/l|pg\/ml|µmol\/l|nmol\/L|ng\/dL|%)\b/i;

/**
 * convertToCanonical(key, value, detectedUnit)
 * - returns { convertedValue, conversionNote }
 * - if no conversion needed or unknown, returns original value with empty note
 */
function convertToCanonical(key, value, detectedUnit) {
  if (!detectedUnit) return { convertedValue: value, conversionNote: null };

  const unit = detectedUnit.toLowerCase();
  // Vitamin D: nmol/L -> ng/mL  (1 ng/mL = 2.496 nmol/L) => ng/mL = nmol/L / 2.496
  if ((key === "VITAMIN_D" || key === "VitaminD" || key.toUpperCase().includes("VITAMIN")) && unit.includes("nmol")) {
    return { convertedValue: value / 2.496, conversionNote: `${value} ${detectedUnit} → ${ (value/2.496).toFixed(2) } ng/mL` };
  }

  // Creatinine: µmol/L (umol/L) -> mg/dL: divide by 88.4
  if ((key === "CREAT" || key.toUpperCase().includes("CREAT")) && (unit.includes("umol") || unit.includes("µmol"))) {
    return { convertedValue: value / 88.4, conversionNote: `${value} ${detectedUnit} → ${(value/88.4).toFixed(3)} mg/dL` };
  }

  // Add other conversions here as needed

  return { convertedValue: value, conversionNote: null };
}

/* -------------------- Number extraction with index -------------------- */
function extractNumbersWithIndices(line) {
  const rx = /([0-9]+(?:\.[0-9]+)?)/g;
  const arr = [];
  let m;
  while ((m = rx.exec(line)) !== null) arr.push({ num: Number(m[1]), index: m.index, raw: m[1] });
  return arr;
}

/* -------------------- Detect unit token in the same line (closest common unit) -------------------- */
function detectUnitInLine(line) {
  const m = line.match(UNIT_RX);
  if (m) return m[0];
  // Some labs put unit after number: "75 nmol/L" or "75nmol/L" - try to find unit-like token near the first number
  const nums = extractNumbersWithIndices(line);
  if (nums.length) {
    const tokenWindow = line.substr(Math.max(0, nums[0].index - 10), 30);
    const mm = tokenWindow.match(UNIT_RX);
    if (mm) return mm[0];
  }
  return null;
}

/* -------------------- Choose best number on line (prefers outside parentheses, prefers number near unit) -------------------- */
function pickBestNumberForLine(line, metaKey) {
  const nums = extractNumbersWithIndices(line);
  if (nums.length === 0) return null;

  // If only one number -> likely the result
  if (nums.length === 1) return { rawValue: nums[0].num, usedRawIdx: nums[0].index, detectedUnit: detectUnitInLine(line) };

  // remove numbers that are inside parentheses/ranges (likely reference range)
  const parenRanges = [];
  const prx = /[\(\[\{][^\)\]\}]*[\)\]\}]/g;
  let pm;
  while ((pm = prx.exec(line)) !== null) parenRanges.push({ start: pm.index, end: pm.index + pm[0].length });

  const outside = nums.filter(n => !parenRanges.some(p => n.index >= p.start && n.index <= p.end));
  if (outside.length === 1) return { rawValue: outside[0].num, usedRawIdx: outside[0].index, detectedUnit: detectUnitInLine(line) };
  if (outside.length > 1) {
    // prefer number closest to unit token (if present)
    const unitIdx = (line.toLowerCase().indexOf((detectUnitInLine(line) || '').toLowerCase()));
    if (unitIdx >= 0) {
      let best = outside[0], bestd = Math.abs(outside[0].index - unitIdx);
      for (const n of outside) {
        const d = Math.abs(n.index - unitIdx);
        if (d < bestd) { best = n; bestd = d; }
      }
      return { rawValue: best.num, usedRawIdx: best.index, detectedUnit: detectUnitInLine(line) };
    }
    // fallback: prefer first outside number
    return { rawValue: outside[0].num, usedRawIdx: outside[0].index, detectedUnit: detectUnitInLine(line) };
  }

  // else all numbers inside parentheses -> fallback heuristics:
  // if first number is very close to label start, pick it
  return { rawValue: nums[0].num, usedRawIdx: nums[0].index, detectedUnit: detectUnitInLine(line) };
}

/* -------------------- Interpret value: uses rawValue (converted if needed) for logic, displayValue separately -------------------- */
function interpretValueWithUnits(key, rawValue, detectedUnit, sex = 'other') {
  const meta = LAB_DB[key];
  if (!meta) return { name: key, rawValue, displayValue: rawValue, unit: detectedUnit || '', flag: 'Unknown', symbol: '–', low: null, high: null, conversionNote: null };

  // Convert rawValue to canonical (LAB_DB) unit if needed
  const conv = convertToCanonical(key, rawValue, detectedUnit);
  const converted = conv.convertedValue;
  const conversionNote = conv.conversionNote;

  // use converted (full precision) for comparisons
  const [low, high] = meta.ranges[sex] || meta.ranges.other;
  let flag = 'Normal', symbol = '–';
  if (!isNaN(converted)) {
    if (converted < low) { flag = 'Low'; symbol = '↓'; }
    else if (converted > high) { flag = 'High'; symbol = '↑'; }
  } else {
    flag = 'Unknown';
  }

  // create display-friendly value without altering comparison base
  let displayValue;
  if (!isFinite(converted) || isNaN(converted)) displayValue = rawValue;
  else {
    // rounding choices: maintain 2 decimals for small values, 1 for moderate, integer for large
    if (converted >= 100) displayValue = Math.round(converted);
    else if (converted >= 10) displayValue = Math.round(converted * 10) / 10;
    else displayValue = Math.round(converted * 100) / 100;
  }

  const returnObj = {
    name: meta.name,
    rawValue: rawValue,
    convertedValue: converted,
    displayValue: displayValue,
    unit: meta.unit,        // canonical unit we display with value (after conversion)
    detectedUnit: detectedUnit,
    conversionNote: conversionNote,
    flag: flag,
    symbol: symbol,
    low, high
  };

  return returnObj;
}

/* -------------------- findLabsInText (simple pass; uses pickBestNumberForLine) -------------------- */
function getLines(text) {
  return text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
}

function normalizeOCRArtifacts(s) {
  return s.replace(/,/g, '.').replace(/[^0-9A-Za-zµ%().\-\s\/:\[\]]/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function findLabsInText(text) {
  text = normalizeOCRArtifacts(text);
  const lines = getLines(text);
  const found = {};

  for (const line of lines) {
    const lower = line.toLowerCase();

    // quick exact phrase match
    for (const phrase of Object.keys(SYN_TO_KEY)) {
      if (lower.includes(phrase)) {
        const key = SYN_TO_KEY[phrase];
        const pick = pickBestNumberForLine(line, key);
        if (pick && pick.rawValue !== null) {
          found[key] = { rawValue: pick.rawValue, detectedUnit: pick.detectedUnit, rawLine: line };
        }
      }
    }

    // fuzzy-first-token fallback (if no exact phrase matched)
    if (Object.keys(found).length === 0) {
      const firstTokens = lower.split(/\s+/).slice(0,3).join(' ');
      const maybeKey = (function(){ // very small heuristic
        if (SYN_TO_KEY[firstTokens]) return SYN_TO_KEY[firstTokens];
        // try trimmed tokens
        for (const syn of Object.keys(SYN_TO_KEY)) {
          if (levenshtein(syn, firstTokens) <= Math.max(1, Math.floor(firstTokens.length * 0.25))) return SYN_TO_KEY[syn];
        }
        return null;
      })();
      if (maybeKey) {
        const pick = pickBestNumberForLine(line, maybeKey);
        if (pick) found[maybeKey] = { rawValue: pick.rawValue, detectedUnit: pick.detectedUnit, rawLine: line };
      }
    }
  }

  return found;
}

/* small levenshtein used in fuzzy fallback */
function levenshtein(a, b) {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({length: a.length+1}, ()=>Array(b.length+1).fill(0));
  for (let i=0;i<=a.length;i++) dp[i][0]=i;
  for (let j=0;j<=b.length;j++) dp[0][j]=j;
  for (let i=1;i<=a.length;i++){
    for (let j=1;j<=b.length;j++){
      dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1] + (a[i-1]===b[j-1]?0:1));
    }
  }
  return dp[a.length][b.length];
}

/* -------------------- Main analyzeReport: ties it together and uses interpretValueWithUnits -------------------- */
async function analyzeReport(file, sex='other', age=null) {
  const statusText = document.getElementById('statusText');
  statusText.innerText = 'Reading file...';

  let text = '';
  try {
    if (file.name && file.name.toLowerCase().endsWith('.pdf')) {
      text = await extractTextFromPDF(file); // assume this exists in your environment
      if (!text || text.trim().length < 30) text = await ocrFile(file); // assume exists
    } else {
      text = await ocrFile(file);
    }
  } catch (err) {
    throw new Error('Failed to read file: ' + err);
  }

  text = normalizeOCRArtifacts(text);
  statusText.innerText = 'Parsing labs...';

  const found = findLabsInText(text);
  const flagsList = document.getElementById('flagsList');
  const predictionList = document.getElementById('predictionList');
  flagsList.innerHTML = ''; predictionList.innerHTML = '';

  const interpreted = {};
  for (const k of Object.keys(found)) {
    const f = found[k];
    // interpret using unit-aware function
    const iv = interpretValueWithUnits(k, f.rawValue, f.detectedUnit, sex);
    interpreted[k] = iv;

    // Build display element
    const div = document.createElement('div');
    div.className = 'result-row';
    div.innerHTML = `
      <div class="result-name">${iv.name}</div>
      <div class="result-val">${iv.displayValue} ${iv.unit}</div>
      <div class="result-flag ${iv.flag.toLowerCase()}">${iv.symbol} ${iv.flag}</div>
      <div class="result-range">${iv.low} – ${iv.high}</div>
      ${iv.conversionNote ? `<div class="result-note" style="font-size:0.8rem;color:#666">(${iv.conversionNote})</div>` : ''}
      <div class="result-raw" style="display:none">${JSON.stringify(f)}</div>
    `;
    flagsList.appendChild(div);

    // debug: print to console to help you tune further
    console.debug('LAB PARSE:', k, 'rawLine:', f.rawLine, 'rawValue:', f.rawValue, 'detectedUnit:', f.detectedUnit, 'converted:', iv.convertedValue, 'flag:', iv.flag);
  }

  document.getElementById('flagsSection').classList.remove('hidden');
  document.getElementById('predictionSection').classList.remove('hidden');

  // small predictions (you can keep your full predictor)
  const predictions = predictConditions ? predictConditions(interpreted) : ['No predictor available'];
  predictionList.innerHTML = '';
  predictions.forEach(p => {
    const div = document.createElement('div');
    div.className = 'result-row';
    div.innerText = p;
    predictionList.appendChild(div);
  });

  statusText.innerText = 'Analysis complete.';
}

/* -------------------- Event binder (same as before) -------------------- */
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
