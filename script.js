<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Symptom Analyzer</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: #f4f6fa;
    }
    h2 {
      text-align: center;
    }
    #symptom-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
      margin-bottom: 20px;
    }
    .symptom-btn {
      background: #e0e0e0;
      border: none;
      padding: 10px 15px;
      border-radius: 20px;
      cursor: pointer;
      transition: 0.3s;
      font-size: 15px;
    }
    .symptom-btn.active {
      background: #4caf50;
      color: white;
    }
    #analyze-btn {
      display: block;
      margin: 0 auto 20px auto;
      background: #2196f3;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    }
    .result {
      background: white;
      border-radius: 10px;
      padding: 15px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 500px;
      margin: 0 auto;
    }
    .warning {
      color: red;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <h2>Symptom Analyzer</h2>

  <div id="symptom-buttons"></div>

  <button id="analyze-btn" onclick="analyze()">Analyze</button>

  <div id="output"></div>

  <script>
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
        keywords: ["headache", "sensitivity to light", "stiff neck"],
        diagnosis: "Possible Meningitis",
        medicine: "Seek immediate hospital care",
        dosage: "-",
        frequency: "-",
        duration: "-",
        warning: "Emergency condition. Do not self-treat."
      },
      {
        keywords: ["fever", "body aches", "runny nose"],
        diagnosis: "Seasonal Influenza",
        medicine: "Oseltamivir",
        dosage: "75 mg",
        frequency: "Twice daily",
        duration: "5 days",
        warning: "Start within 48 hours of symptom onset."
      },
      {
        keywords: ["frequent urination", "excessive thirst", "weight loss"],
        diagnosis: "Possible Diabetes Mellitus (Type 2)",
        medicine: "Metformin",
        dosage: "500 mg",
        frequency: "Twice daily",
        duration: "Ongoing (long-term)",
        warning: "Monitor blood glucose regularly. Contraindicated in severe kidney disease."
      }
      // You can continue adding the rest of your conditions here...
    ];

    // Collect unique symptoms from all conditions
    const allSymptoms = [...new Set(conditions.flatMap(c => c.keywords))];

    // Display buttons for each symptom
    const symptomContainer = document.getElementById("symptom-buttons");
    allSymptoms.forEach(symptom => {
      const btn = document.createElement("button");
      btn.textContent = symptom;
      btn.className = "symptom-btn";
      btn.onclick = () => btn.classList.toggle("active");
      symptomContainer.appendChild(btn);
    });

    function analyze() {
      const selectedSymptoms = Array.from(document.querySelectorAll(".symptom-btn.active"))
                                   .map(btn => btn.textContent.toLowerCase());

      let result = "<p>No exact match found. Please consult a doctor.</p>";

      for (let cond of conditions) {
        const matches = cond.keywords.every(k => selectedSymptoms.includes(k.toLowerCase()));
        if (matches) {
          result = `
            <div class="result">
              <h3>Diagnosis: ${cond.diagnosis}</h3>
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
  </script>

</body>
</html>
