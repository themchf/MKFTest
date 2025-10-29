:root {
  --bg:#070707;
  --card:#0f1112;
  --accent:#ff0066;
  --cyan:#00ffd1;
  --muted:#9aa2a6;
  --text:#e6eef0;
}

*{box-sizing:border-box;}
body {
  margin:0;
  font-family:Inter, system-ui, Roboto, Arial;
  background:linear-gradient(#020202,var(--bg));
  color:var(--text);
}
.container {
  max-width:480px;
  margin:24px auto;
  padding:18px;
}
header h1 {
  margin:0;
  color:var(--accent);
}
.muted {
  color:var(--muted);
  margin-bottom:12px;
}
.card {
  background:var(--card);
  padding:16px;
  border-radius:12px;
  box-shadow:0 6px 30px rgba(0,0,0,0.6);
  margin-top:12px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:14px;
}

/* Symptom tags */
.symptom-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  width: 100%;
}
.symptom {
  background: #071017;
  border: 1px solid var(--cyan);
  color: var(--text);
  border-radius: 20px;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}
.symptom:hover {
  background: rgba(0,255,209,0.1);
}
.symptom.selected {
  background: var(--cyan);
  color: #000;
  box-shadow: 0 0 12px var(--cyan);
}

/* Button */
button {
  background:linear-gradient(180deg,var(--accent),#ff2a8a);
  color:white;
  border:none;
  padding:12px 20px;
  border-radius:10px;
  cursor:pointer;
  font-weight:700;
  font-size:1rem;
  transition:0.2s;
}
button:hover {
  filter: brightness(1.2);
}
button:active{transform:translateY(1px);}

/* Results */
.result-card {
  background:var(--card);
  padding:12px;
  border-radius:10px;
  margin-top:12px;
  box-shadow:0 4px 20px rgba(0,255,209,0.3);
}
.result-card h2 {
  margin:0 0 6px 0;
  color:var(--cyan);
  font-size:1.05rem;
}
.result-card p {
  margin:2px 0;
  font-size:0.95rem;
}

.disclaimer {
  margin-top:18px;
  color:var(--muted);
  font-size:13px;
  text-align:center;
}
