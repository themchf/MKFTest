<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MKF Prescriptions</title>
  <link rel="stylesheet" href="style.css">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f8f9fb;
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 850px;
      margin: 40px auto;
      background: #ffffff;
      padding: 25px 30px;
      border-radius: 16px;
      box-shadow: 0 3px 20px rgba(0, 0, 0, 0.08);
    }

    header {
      text-align: center;
      margin-bottom: 25px;
    }

    h1 {
      margin: 0;
      color: #007bff;
    }

    .muted {
      color: #666;
      font-size: 15px;
    }

    #symptom-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
      margin: 30px 0;
    }

    .symptom-btn {
      background: #e0e0e0;
      border: none;
      padding: 10px 18px;
      border-radius: 25px;
      cursor: pointer;
      transition: 0.25s ease;
      font-size: 15px;
    }

    .symptom-btn:hover {
      background: #d0d0d0;
    }

    .symptom-btn.active {
      background: #28a745;
      color: white;
      box-shadow: 0 0 8px rgba(40, 167, 69, 0.5);
    }

    .result {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 1px 8px rgba(0, 0, 0, 0.1);
      margin-top: 20px;
    }

    .warning {
      color: red;
      font-weight: bold;
    }

    .disclaimer {
      text-align: center;
      color: #888;
      font-size: 13px;
      margin-top: 25px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>MKF Prescriptions</h1>
      <p class="muted">Tap your symptoms to get a diagnosis</p>
    </header>

    <!-- Dynamic Symptom Buttons -->
    <div id="symptom-buttons"></div>

    <!-- Diagnosis Output -->
    <div id="output"></div>

    <p class="disclaimer">⚠️ This tool is for educational guidance only. Always consult a doctor for serious symptoms.</p>
  </div>

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
    ];

    // Generate unique symptoms as buttons
    const allSymptoms = [...new Set(conditions.flatMap(c => c.keywords))];
    const container = document.getElementById("symptom-buttons");

    allSymptoms.forEach(symptom => {
      const btn = document.createElement("button");
      btn.textContent = symptom;
      btn.className = "symptom-btn";
      btn.onclick = () => {
        btn.classList.toggle("active");
        analyze();
      };
      container.appendChild(btn);
    });

    function analyze() {
      const selected = Array.from(document.querySelectorAll(".symptom-btn.active"))
        .map(btn => btn.textContent.toLowerCase());

      let result = "<p>No exact match found. Try adding more symptoms or consult a doctor.</p>";

      for (let cond of conditions) {
        const matchAll = cond.keywords.every(k => selected.includes(k.toLowerCase()));
        if (matchAll) {
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
