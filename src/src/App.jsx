import { useState, useEffect, useRef } from "react";

// ─── MOCK DATA (replace with Supabase in production) ───────────────────────
const MOCK_USERS = {
  "emp001": { password: "akts2024", name: "Ahmad Razif", department: "Operations", role: "employee" },
  "emp002": { password: "akts2024", name: "Lin Wei", department: "Safety", role: "employee" },
  "emp003": { password: "akts2024", name: "Priya Nair", department: "HR", role: "employee" },
  "admin":  { password: "admin888", name: "Admin Manager", department: "Management", role: "admin" },
};

const CURRENT_MODULE = {
  id: "TBM-2025-04",
  title: "April 2025 TBM Training",
  titleMandarin: "2025年4月TBM培训",
  month: "April 2025",
  windowOpen: true, // set false to show locked screen
  deadline: "Sunday, 27 April 2025 at 11:59 PM",
  videos: {
    english: "https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1",
    mandarin: "https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1",
  },
  checkpoints: [
    { at: 15, question: "What is the primary purpose of a TBM (Toolbox Meeting)?", options: ["Social gathering", "Safety briefing and awareness", "Performance review", "Team lunch"], answer: 1 },
    { at: 40, question: "How often should emergency exits be checked?", options: ["Monthly", "Yearly", "Daily before work starts", "Only after incidents"], answer: 2 },
    { at: 70, question: "Who is responsible for reporting a safety hazard?", options: ["Only the supervisor", "Only the safety officer", "Every employee", "Only management"], answer: 2 },
  ],
  quiz: [
    { q: "What does TBM stand for?", options: ["Team Building Meeting", "Toolbox Meeting", "Technical Briefing Manual", "Task Board Monitor"], answer: 1 },
    { q: "PPE stands for:", options: ["Personal Protective Equipment", "Plant Process Evaluation", "Project Planning Excel", "People Performance Efficiency"], answer: 0 },
    { q: "In case of a fire, the first action is:", options: ["Call your family", "Run to the exit immediately", "Activate the fire alarm and alert others", "Continue working"], answer: 2 },
    { q: "A near-miss incident should be:", options: ["Ignored if no injury occurred", "Reported immediately", "Discussed only with friends", "Kept private"], answer: 1 },
    { q: "The correct way to lift heavy objects is:", options: ["Bend at the waist", "Twist your body while lifting", "Bend your knees and keep back straight", "Ask someone else always"], answer: 2 },
    { q: "Chemical spills must be:", options: ["Left to dry on their own", "Reported and cleaned per SOP", "Covered with paper", "Ignored if small"], answer: 1 },
    { q: "Working at heights requires:", options: ["Just a helmet", "Proper harness and fall protection", "Only gloves", "Nothing extra"], answer: 1 },
    { q: "Emergency contact numbers should be:", options: ["Memorized by supervisors only", "Posted visibly at all work areas", "Saved only in manager's phone", "Not necessary"], answer: 1 },
    { q: "A safety data sheet (SDS) provides:", options: ["Employee salary info", "Chemical hazard and handling information", "Work schedule", "Performance targets"], answer: 1 },
    { q: "Training attendance is mandatory because:", options: ["It's a company tradition", "It ensures everyone is informed and safe", "Managers require it for reports only", "It's just a formality"], answer: 1 },
  ],
};

const COMPLETIONS_KEY = "akts_completions";

function getCompletions() {
  try { return JSON.parse(localStorage.getItem(COMPLETIONS_KEY) || "{}"); } catch { return {}; }
}
function saveCompletion(userId, data) {
  const all = getCompletions();
  all[userId] = { ...all[userId], [CURRENT_MODULE.id]: data };
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(all));
}
function getUserCompletion(userId) {
  const all = getCompletions();
  return all[userId]?.[CURRENT_MODULE.id] || null;
}

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0d0f14;
    --ink2: #1a1d26;
    --surface: #f4f2ee;
    --gold: #c8a96e;
    --gold2: #e8c98e;
    --red: #c0392b;
    --green: #1a7a4a;
    --blue: #1a4a7a;
    --muted: #6b7280;
    --border: rgba(200,169,110,0.25);
    --radius: 12px;
    --shadow: 0 4px 24px rgba(0,0,0,0.12);
  }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--surface);
    color: var(--ink);
    min-height: 100vh;
  }

  h1,h2,h3,h4 { font-family: 'Syne', sans-serif; }

  .screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--ink);
    position: relative;
    overflow: hidden;
  }

  .screen::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 20% 50%, rgba(200,169,110,0.08) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, rgba(200,169,110,0.05) 0%, transparent 50%);
    pointer-events: none;
  }

  .card {
    background: #fff;
    border-radius: 20px;
    padding: 40px;
    width: 100%;
    max-width: 480px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    position: relative;
    z-index: 1;
  }

  .logo-block {
    text-align: center;
    margin-bottom: 36px;
  }

  .logo-icon {
    width: 64px;
    height: 64px;
    background: var(--ink);
    border-radius: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    border: 2px solid var(--gold);
  }

  .logo-title {
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: var(--ink);
    letter-spacing: -0.5px;
  }

  .logo-sub {
    font-size: 12px;
    color: var(--muted);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 2px;
  }

  .form-group { margin-bottom: 18px; }

  label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  input {
    width: 100%;
    padding: 12px 16px;
    border: 1.5px solid #e5e7eb;
    border-radius: var(--radius);
    font-size: 15px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s;
    background: #fafafa;
  }

  input:focus { border-color: var(--gold); background: #fff; }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: var(--radius);
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    text-decoration: none;
    letter-spacing: 0.3px;
  }

  .btn-primary {
    background: var(--ink);
    color: var(--gold);
    width: 100%;
  }

  .btn-primary:hover { background: #1a1d26; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }

  .btn-gold {
    background: var(--gold);
    color: var(--ink);
  }

  .btn-gold:hover { background: var(--gold2); transform: translateY(-1px); }

  .btn-outline {
    background: transparent;
    border: 1.5px solid var(--border);
    color: var(--ink);
  }

  .error-msg {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: var(--red);
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 16px;
  }

  /* TOPBAR */
  .topbar {
    background: var(--ink);
    padding: 0 32px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .topbar-brand {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    color: var(--gold);
    font-size: 16px;
    letter-spacing: -0.3px;
  }

  .topbar-user {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: rgba(255,255,255,0.7);
  }

  .avatar {
    width: 32px;
    height: 32px;
    background: var(--gold);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 13px;
    color: var(--ink);
  }

  /* MAIN CONTENT */
  .main {
    max-width: 860px;
    margin: 0 auto;
    padding: 40px 24px;
  }

  /* DEADLINE BANNER */
  .deadline-banner {
    background: linear-gradient(135deg, var(--ink) 0%, #1a1d26 100%);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .deadline-left { display: flex; align-items: center; gap: 14px; }

  .pulse-dot {
    width: 10px;
    height: 10px;
    background: #22c55e;
    border-radius: 50%;
    animation: pulse 2s infinite;
    flex-shrink: 0;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
    50% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
  }

  .deadline-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #fff; }
  .deadline-sub { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 2px; }

  .countdown {
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: var(--gold);
    letter-spacing: -1px;
  }

  /* MODULE CARD */
  .module-header {
    background: #fff;
    border-radius: 20px;
    padding: 32px;
    margin-bottom: 24px;
    border: 1px solid #eee;
  }

  .module-tag {
    display: inline-block;
    background: var(--ink);
    color: var(--gold);
    font-size: 11px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 100px;
    margin-bottom: 12px;
  }

  .module-title {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin-bottom: 6px;
  }

  .module-steps {
    display: flex;
    gap: 8px;
    margin-top: 24px;
    flex-wrap: wrap;
  }

  .step-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 500;
    border: 1.5px solid #e5e7eb;
    color: var(--muted);
    background: #fafafa;
  }

  .step-pill.active { border-color: var(--gold); color: var(--ink); background: #fffbf5; font-weight: 600; }
  .step-pill.done { border-color: #bbf7d0; color: var(--green); background: #f0fdf4; }

  .step-num {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    font-family: 'Syne', sans-serif;
  }

  .step-pill.active .step-num { background: var(--gold); color: var(--ink); }
  .step-pill.done .step-num { background: #22c55e; color: #fff; }

  /* LANGUAGE SELECTOR */
  .lang-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 24px;
  }

  .lang-card {
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    padding: 28px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: #fff;
  }

  .lang-card:hover { border-color: var(--gold); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
  .lang-card.selected { border-color: var(--gold); background: #fffbf5; }

  .lang-flag { font-size: 36px; margin-bottom: 8px; }
  .lang-name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; }
  .lang-native { font-size: 13px; color: var(--muted); margin-top: 2px; }

  /* VIDEO PLAYER */
  .video-wrap {
    position: relative;
    background: #000;
    border-radius: 16px;
    overflow: hidden;
    aspect-ratio: 16/9;
    margin-bottom: 20px;
  }

  .video-wrap iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  .video-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 16px;
    z-index: 10;
    border-radius: 16px;
  }

  .overlay-icon { font-size: 48px; }
  .overlay-title { font-family: 'Syne', sans-serif; font-size: 20px; color: #fff; font-weight: 700; }
  .overlay-sub { font-size: 14px; color: rgba(255,255,255,0.6); text-align: center; max-width: 320px; }

  .progress-track {
    background: #e5e7eb;
    border-radius: 100px;
    height: 6px;
    width: 100%;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold), var(--gold2));
    border-radius: 100px;
    transition: width 0.3s;
  }

  /* CHECKPOINT MODAL */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
  }

  .modal {
    background: #fff;
    border-radius: 20px;
    padding: 36px;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 30px 80px rgba(0,0,0,0.4);
  }

  .modal-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #fffbf5;
    border: 1px solid var(--gold);
    color: var(--gold);
    font-size: 11px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 100px;
    margin-bottom: 16px;
  }

  .modal-q {
    font-family: 'Syne', sans-serif;
    font-size: 19px;
    font-weight: 700;
    margin-bottom: 20px;
    line-height: 1.4;
    color: var(--ink);
  }

  .option-btn {
    width: 100%;
    text-align: left;
    padding: 14px 18px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    margin-bottom: 10px;
    cursor: pointer;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    background: #fff;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--ink);
  }

  .option-btn:hover { border-color: var(--gold); background: #fffbf5; }
  .option-btn.selected { border-color: var(--gold); background: #fffbf5; }
  .option-btn.correct { border-color: #22c55e; background: #f0fdf4; color: var(--green); }
  .option-btn.wrong { border-color: #ef4444; background: #fef2f2; color: var(--red); }

  .option-letter {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 12px;
    font-family: 'Syne', sans-serif;
    flex-shrink: 0;
  }

  /* QUIZ */
  .quiz-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .q-counter {
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: var(--muted);
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .q-score-badge {
    background: var(--ink);
    color: var(--gold);
    padding: 4px 14px;
    border-radius: 100px;
    font-size: 13px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
  }

  /* RESULTS */
  .result-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    margin: 0 auto 24px;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 32px;
  }

  .result-circle.pass { background: #f0fdf4; color: var(--green); border: 3px solid #22c55e; }
  .result-circle.fail { background: #fef2f2; color: var(--red); border: 3px solid #ef4444; }

  /* ACKNOWLEDGEMENT */
  .ack-box {
    background: linear-gradient(135deg, var(--ink), #1a1d26);
    border-radius: 20px;
    padding: 36px;
    text-align: center;
    color: #fff;
    margin-bottom: 24px;
    border: 1px solid var(--border);
    position: relative;
    overflow: hidden;
  }

  .ack-box::before {
    content: '✓';
    position: absolute;
    font-size: 200px;
    color: rgba(200,169,110,0.04);
    top: -30px;
    right: -20px;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
  }

  .ack-icon { font-size: 48px; margin-bottom: 12px; }
  .ack-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; margin-bottom: 8px; }
  .ack-sub { color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.6; }

  .cert-block {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 16px;
    padding: 28px;
    text-align: center;
    margin-bottom: 20px;
    position: relative;
  }

  .cert-block::before {
    content: '';
    position: absolute;
    inset: 6px;
    border: 1px dashed var(--border);
    border-radius: 12px;
    pointer-events: none;
  }

  .cert-name { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; margin: 8px 0 4px; }
  .cert-detail { font-size: 13px; color: var(--muted); margin-bottom: 4px; }

  /* ADMIN */
  .admin-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }

  .stat-card {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    border: 1px solid #eee;
  }

  .stat-num {
    font-family: 'Syne', sans-serif;
    font-size: 36px;
    font-weight: 800;
    color: var(--ink);
    line-height: 1;
    margin-bottom: 4px;
  }

  .stat-num.gold { color: var(--gold); }
  .stat-num.green { color: var(--green); }
  .stat-num.red { color: var(--red); }

  .stat-label { font-size: 13px; color: var(--muted); }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  th {
    text-align: left;
    padding: 10px 16px;
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--muted);
    background: #f9fafb;
    border-bottom: 1px solid #eee;
  }

  td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
  tr:last-child td { border-bottom: none; }

  .badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
  }

  .badge-green { background: #dcfce7; color: var(--green); }
  .badge-red { background: #fee2e2; color: var(--red); }
  .badge-yellow { background: #fef3c7; color: #92400e; }

  /* LOCKED SCREEN */
  .locked-icon {
    width: 80px;
    height: 80px;
    background: rgba(200,169,110,0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    font-size: 32px;
    border: 2px solid var(--border);
  }

  /* SECTION TITLE */
  .section-title {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 800;
    margin-bottom: 4px;
    letter-spacing: -0.3px;
  }

  .section-sub { font-size: 14px; color: var(--muted); margin-bottom: 24px; }

  /* UTILS */
  .text-center { text-align: center; }
  .mt-8 { margin-top: 8px; }
  .mt-16 { margin-top: 16px; }
  .mt-24 { margin-top: 24px; }
  .mt-32 { margin-top: 32px; }
  .flex { display: flex; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-12 { gap: 12px; }
  .w-full { width: 100%; }

  .divider {
    height: 1px;
    background: #f0f0f0;
    margin: 20px 0;
  }

  @media (max-width: 600px) {
    .card { padding: 28px 22px; }
    .main { padding: 24px 16px; }
    .topbar { padding: 0 16px; }
    .deadline-banner { flex-direction: column; }
    .module-steps { flex-direction: column; }
    .lang-grid { grid-template-columns: 1fr; }
    .admin-grid { grid-template-columns: 1fr 1fr; }
    .module-title { font-size: 20px; }
  }
`;

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function Logo({ size = "md" }) {
  return (
    <div className="logo-block">
      <div className="logo-icon">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="8" width="10" height="3" rx="1.5" fill="#c8a96e"/>
          <rect x="4" y="14" width="16" height="3" rx="1.5" fill="#c8a96e"/>
          <rect x="4" y="20" width="12" height="3" rx="1.5" fill="#c8a96e"/>
          <circle cx="25" cy="10" r="5" stroke="#c8a96e" strokeWidth="2"/>
          <path d="M23 10l1.5 1.5L27 8.5" stroke="#c8a96e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="logo-title">AKTS Training Hub</div>
      <div className="logo-sub">Learning Management Portal</div>
    </div>
  );
}

function TopBar({ user, onLogout, onAdmin }) {
  return (
    <div className="topbar">
      <div className="topbar-brand">AKTS Training Hub</div>
      <div className="topbar-user">
        {user.role === "admin" && (
          <button className="btn btn-gold" style={{padding:"6px 14px", fontSize:"12px"}} onClick={onAdmin}>
            Admin Panel
          </button>
        )}
        <span style={{color:"rgba(255,255,255,0.5)", fontSize:"12px"}}>{user.name}</span>
        <div className="avatar">{user.name.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
        <button onClick={onLogout} style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.5)",padding:"6px 12px",borderRadius:"8px",cursor:"pointer",fontSize:"12px"}}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

function CountdownTimer({ deadline }) {
  const [time, setTime] = useState("47:58:12");
  useEffect(() => {
    let h = 47, m = 58, s = 12;
    const t = setInterval(() => {
      s--; if(s<0){s=59;m--;} if(m<0){m=59;h--;} if(h<0){h=0;m=0;s=0;}
      setTime(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    }, 1000);
    return () => clearInterval(t);
  }, []);
  return <div className="countdown">{time}</div>;
}

function StepIndicator({ current }) {
  const steps = [
    { id: 1, label: "Language" },
    { id: 2, label: "Video" },
    { id: 3, label: "Quiz" },
    { id: 4, label: "Complete" },
  ];
  return (
    <div className="module-steps">
      {steps.map(s => (
        <div key={s.id} className={`step-pill ${current === s.id ? "active" : current > s.id ? "done" : ""}`}>
          <div className="step-num">{current > s.id ? "✓" : s.id}</div>
          {s.label}
        </div>
      ))}
    </div>
  );
}

// ─── SCREENS ────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = () => {
    setErr(""); setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const user = MOCK_USERS[id.trim().toLowerCase()];
      if (!user || user.password !== pw) { setErr("Invalid Employee ID or password. Please try again."); return; }
      onLogin({ ...user, id: id.trim().toLowerCase() });
    }, 700);
  };

  return (
    <>
      <style>{css}</style>
      <div className="screen">
        <div className="card">
          <Logo />
          {err && <div className="error-msg">⚠ {err}</div>}
          <div className="form-group">
            <label>Employee ID</label>
            <input placeholder="e.g. emp001" value={id} onChange={e=>setId(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Enter your password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} />
          </div>
          <button className="btn btn-primary" onClick={handle} disabled={loading}>
            {loading ? "Verifying…" : "Sign In →"}
          </button>
          <div style={{textAlign:"center",marginTop:"20px",fontSize:"12px",color:"var(--muted)"}}>
            🔒 This portal is for AKTS employees only.<br/>Contact HR if you need access.
          </div>
          <div className="divider"/>
          <div style={{fontSize:"11px",color:"#ccc",textAlign:"center",lineHeight:"1.6"}}>
            <strong>Demo logins:</strong><br/>
            emp001 / akts2024 &nbsp;|&nbsp; emp002 / akts2024<br/>
            admin / admin888
          </div>
        </div>
      </div>
    </>
  );
}

function LockedScreen({ user, onLogout }) {
  return (
    <>
      <style>{css}</style>
      <TopBar user={user} onLogout={onLogout} onAdmin={()=>{}} />
      <div className="main">
        <div className="card" style={{maxWidth:"560px",margin:"60px auto",textAlign:"center"}}>
          <div className="locked-icon">🔐</div>
          <h2 style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:"22px",marginBottom:"8px"}}>Training Window Closed</h2>
          <p style={{color:"var(--muted)",fontSize:"14px",lineHeight:1.7}}>
            The May 2025 TBM Training session is not yet live.<br/>
            You will receive a WhatsApp notification when it opens.
          </p>
          <div style={{background:"#f9fafb",borderRadius:"12px",padding:"20px",marginTop:"24px"}}>
            <div style={{fontSize:"12px",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px"}}>Next Session Opens</div>
            <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:"18px"}}>Saturday, 24 May 2025 · 8:00 AM</div>
          </div>
        </div>
      </div>
    </>
  );
}

function AlreadyDoneScreen({ user, completion, onLogout }) {
  return (
    <>
      <style>{css}</style>
      <TopBar user={user} onLogout={onLogout} onAdmin={()=>{}} />
      <div className="main">
        <div style={{maxWidth:"560px",margin:"40px auto"}}>
          <div className="ack-box">
            <div className="ack-icon">🎓</div>
            <div className="ack-title">Training Complete</div>
            <div className="ack-sub">You have already completed this month's TBM training. Your attendance has been recorded.</div>
          </div>
          <div className="cert-block">
            <div style={{fontSize:"12px",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"2px"}}>Certificate of Completion</div>
            <div className="cert-name">{user.name}</div>
            <div className="cert-detail">{CURRENT_MODULE.month} TBM Training</div>
            <div className="cert-detail">Score: <strong>{completion.score}/10</strong> · Language: <strong>{completion.language === "english" ? "English" : "Mandarin 中文"}</strong></div>
            <div className="cert-detail" style={{marginTop:"8px",fontSize:"12px",color:"#aaa"}}>Completed: {completion.completedAt}</div>
          </div>
        </div>
      </div>
    </>
  );
}

function LanguageScreen({ user, onSelect }) {
  const [selected, setSelected] = useState(null);
  return (
    <>
      <style>{css}</style>
      <div style={{background:"var(--ink)",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 30% 50%, rgba(200,169,110,0.07) 0%,transparent 60%)",pointerEvents:"none"}}/>
        <div className="card" style={{maxWidth:"520px",position:"relative",zIndex:1}}>
          <div className="logo-block" style={{marginBottom:"24px"}}>
            <div className="logo-title" style={{fontSize:"18px"}}>AKTS Training Hub</div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:"22px",fontWeight:800,marginTop:"16px",color:"var(--ink)"}}>Select Your Language</div>
            <div style={{fontSize:"13px",color:"var(--muted)",marginTop:"4px"}}>请选择您的培训语言 · Choose your training language</div>
          </div>

          <div className="lang-grid">
            <div className={`lang-card ${selected==="english"?"selected":""}`} onClick={()=>setSelected("english")}>
              <div className="lang-flag">🇬🇧</div>
              <div className="lang-name">English</div>
              <div className="lang-native">Training in English</div>
            </div>
            <div className={`lang-card ${selected==="mandarin"?"selected":""}`} onClick={()=>setSelected("mandarin")}>
              <div className="lang-flag">🇨🇳</div>
              <div className="lang-name">Mandarin</div>
              <div className="lang-native">普通话培训</div>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{marginTop:"24px"}}
            disabled={!selected}
            onClick={()=>selected&&onSelect(selected)}
          >
            Continue →
          </button>
        </div>
      </div>
    </>
  );
}

function CheckpointModal({ checkpoint, onPass }) {
  const [sel, setSel] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const letters = ["A","B","C","D"];

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-badge">⏸ Checkpoint Question</div>
        <div className="modal-q">{checkpoint.question}</div>
        {checkpoint.options.map((opt, i) => {
          let cls = "option-btn";
          if (submitted) { cls += i === checkpoint.answer ? " correct" : sel === i ? " wrong" : ""; }
          else if (sel === i) cls += " selected";
          return (
            <button key={i} className={cls} onClick={()=>!submitted&&setSel(i)}>
              <span className="option-letter">{letters[i]}</span>
              {opt}
            </button>
          );
        })}
        {!submitted ? (
          <button className="btn btn-primary" style={{marginTop:"8px"}} disabled={sel===null} onClick={()=>setSubmitted(true)}>
            Submit Answer
          </button>
        ) : (
          <div>
            <div style={{padding:"12px 16px",borderRadius:"10px",background: sel===checkpoint.answer?"#f0fdf4":"#fef2f2",color:sel===checkpoint.answer?"var(--green)":"var(--red)",fontSize:"14px",marginBottom:"12px",fontWeight:500}}>
              {sel === checkpoint.answer ? "✓ Correct! Well done." : `✗ The correct answer is: ${checkpoint.options[checkpoint.answer]}`}
            </div>
            <button className="btn btn-primary" onClick={onPass}>Continue Video →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function VideoScreen({ user, language, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [checkpoint, setCheckpoint] = useState(null);
  const [passedCheckpoints, setPassedCheckpoints] = useState([]);
  const [videoUnlocked, setVideoUnlocked] = useState(false);
  const [simProgress, setSimProgress] = useState(0);

  // Simulate video progress for demo (in production, use YouTube IFrame API)
  useEffect(() => {
    if (!videoUnlocked) return;
    const nextCP = CURRENT_MODULE.checkpoints.find(cp => !passedCheckpoints.includes(cp.at) && simProgress >= cp.at);
    if (nextCP) { setCheckpoint(nextCP); return; }
    if (simProgress >= 100) { setProgress(100); return; }
    const t = setTimeout(() => setSimProgress(p => Math.min(p + 0.5, 100)), 200);
    return () => clearTimeout(t);
  }, [simProgress, videoUnlocked, passedCheckpoints]);

  useEffect(() => { setProgress(simProgress); }, [simProgress]);

  const handlePassCheckpoint = () => {
    setPassedCheckpoints(p => [...p, checkpoint.at]);
    setCheckpoint(null);
  };

  return (
    <>
      <style>{css}</style>
      <div style={{background:"#f4f2ee",minHeight:"100vh"}}>
        <div className="topbar">
          <div className="topbar-brand">AKTS Training Hub</div>
          <div className="topbar-user">
            <div className="avatar">{user.name.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
            <span style={{color:"rgba(255,255,255,0.6)",fontSize:"13px"}}>{user.name}</span>
          </div>
        </div>

        <div className="main">
          <div className="module-header">
            <div className="module-tag">📹 Step 2 of 4 — Training Video</div>
            <div className="module-title">{CURRENT_MODULE.title}</div>
            <div style={{fontSize:"13px",color:"var(--muted)"}}>
              Language: {language === "english" ? "🇬🇧 English" : "🇨🇳 Mandarin 中文"} · {CURRENT_MODULE.checkpoints.length} checkpoint questions · Watch fully to unlock quiz
            </div>
            <StepIndicator current={2} />
          </div>

          <div style={{background:"#fff",borderRadius:"20px",padding:"32px",border:"1px solid #eee"}}>
            <div className="video-wrap">
              <iframe
                src={CURRENT_MODULE.videos[language]}
                allow="autoplay; encrypted-media"
                title="Training Video"
              />
              {!videoUnlocked && (
                <div className="video-overlay">
                  <div className="overlay-icon">▶</div>
                  <div className="overlay-title">Ready to start?</div>
                  <div className="overlay-sub">This video has {CURRENT_MODULE.checkpoints.length} checkpoint questions. You must answer them to continue. Do not close this page.</div>
                  <button className="btn btn-gold" onClick={()=>setVideoUnlocked(true)}>Start Training Video</button>
                </div>
              )}
            </div>

            <div className="progress-track">
              <div className="progress-fill" style={{width:`${progress}%`}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",color:"var(--muted)",marginBottom:"8px"}}>
              <span>Video Progress</span>
              <span>{Math.round(progress)}% complete</span>
            </div>

            <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginTop:"8px"}}>
              {CURRENT_MODULE.checkpoints.map(cp => (
                <div key={cp.at} style={{fontSize:"12px",padding:"4px 12px",borderRadius:"100px",background: passedCheckpoints.includes(cp.at) ? "#f0fdf4" : "#f9fafb",color: passedCheckpoints.includes(cp.at) ? "var(--green)" : "var(--muted)",border:`1px solid ${passedCheckpoints.includes(cp.at) ? "#bbf7d0" : "#e5e7eb"}`}}>
                  {passedCheckpoints.includes(cp.at) ? "✓" : "○"} Checkpoint at {cp.at}%
                </div>
              ))}
            </div>

            {progress >= 100 && (
              <div style={{marginTop:"24px",padding:"20px",background:"#f0fdf4",borderRadius:"12px",border:"1px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
                <div>
                  <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,color:"var(--green)"}}>✓ Video Complete!</div>
                  <div style={{fontSize:"13px",color:"var(--muted)",marginTop:"2px"}}>All checkpoints passed. You're ready for the quiz.</div>
                </div>
                <button className="btn btn-primary" onClick={onComplete}>Take Quiz →</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {checkpoint && <CheckpointModal checkpoint={checkpoint} onPass={handlePassCheckpoint} />}
    </>
  );
}

function QuizScreen({ user, language, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const letters = ["A","B","C","D"];
  const q = CURRENT_MODULE.quiz[current];

  const handleSelect = (i) => { if (!submitted) setAnswers({...answers, [current]: i}); };

  const handleNext = () => {
    if (current < CURRENT_MODULE.quiz.length - 1) setCurrent(current + 1);
    else {
      let s = 0;
      CURRENT_MODULE.quiz.forEach((q, i) => { if (answers[i] === q.answer) s++; });
      setScore(s); setSubmitted(true);
    }
  };

  const handleRetry = () => {
    setAttempt(a=>a+1); setAnswers({}); setCurrent(0); setSubmitted(false); setScore(0);
  };

  if (submitted) {
    const passed = score >= 7;
    return (
      <>
        <style>{css}</style>
        <div style={{background:"var(--surface)",minHeight:"100vh"}}>
          <div className="topbar">
            <div className="topbar-brand">AKTS Training Hub</div>
          </div>
          <div className="main">
            <div style={{maxWidth:"560px",margin:"0 auto"}}>
              <div className="module-header">
                <div className="module-tag">📊 Step 3 of 4 — Quiz Results</div>
                <StepIndicator current={passed ? 4 : 3} />
              </div>
              <div style={{background:"#fff",borderRadius:"20px",padding:"36px",textAlign:"center",border:"1px solid #eee"}}>
                <div className={`result-circle ${passed?"pass":"fail"}`}>
                  {score}/10
                  <div style={{fontSize:"12px",fontWeight:500,marginTop:"4px"}}>{passed?"PASS":"FAIL"}</div>
                </div>
                <h2 style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:"20px",marginBottom:"8px"}}>{passed ? "Well Done! 🎉" : "Not Quite There"}</h2>
                <p style={{color:"var(--muted)",fontSize:"14px",lineHeight:1.7,marginBottom:"24px"}}>
                  {passed
                    ? `You scored ${score}/10 (${score*10}%). You may now complete your attendance acknowledgement.`
                    : `You scored ${score}/10. A minimum of 7/10 is required. ${attempt < 3 ? `You have ${3-attempt} attempt(s) remaining.` : "You've used all 3 attempts. Your manager has been notified."}`}
                </p>

                {!passed && attempt < 3 && (
                  <button className="btn btn-outline" style={{marginBottom:"12px",width:"100%"}} onClick={handleRetry}>
                    🔄 Rewatch & Retry (Attempt {attempt+1}/3)
                  </button>
                )}
                {passed && (
                  <button className="btn btn-primary" onClick={() => onComplete(score)}>
                    Complete & Sign Acknowledgement →
                  </button>
                )}
                {!passed && attempt >= 3 && (
                  <div style={{padding:"16px",background:"#fef2f2",borderRadius:"12px",color:"var(--red)",fontSize:"13px"}}>
                    ⚠ Maximum attempts reached. Your supervisor has been flagged. Please speak to your manager.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div style={{background:"var(--surface)",minHeight:"100vh"}}>
        <div className="topbar">
          <div className="topbar-brand">AKTS Training Hub</div>
          <div className="topbar-user">
            <span style={{color:"rgba(255,255,255,0.5)",fontSize:"12px"}}>Attempt {attempt}/3</span>
          </div>
        </div>
        <div className="main">
          <div style={{maxWidth:"600px",margin:"0 auto"}}>
            <div className="module-header">
              <div className="module-tag">📝 Step 3 of 4 — Knowledge Check</div>
              <StepIndicator current={3} />
            </div>
            <div style={{background:"#fff",borderRadius:"20px",padding:"36px",border:"1px solid #eee"}}>
              <div className="quiz-header">
                <div className="q-counter">Question {current+1} of {CURRENT_MODULE.quiz.length}</div>
                <div className="q-score-badge">{Object.keys(answers).length} Answered</div>
              </div>
              <div className="progress-track" style={{marginBottom:"24px"}}>
                <div className="progress-fill" style={{width:`${((current)/CURRENT_MODULE.quiz.length)*100}%`}}/>
              </div>
              <div className="modal-q" style={{fontSize:"17px",marginBottom:"20px"}}>{q.q}</div>
              {q.options.map((opt, i) => (
                <button key={i} className={`option-btn ${answers[current]===i?"selected":""}`} onClick={()=>handleSelect(i)}>
                  <span className="option-letter" style={{background: answers[current]===i?"var(--gold)":"#f3f4f6",color: answers[current]===i?"var(--ink)":"inherit"}}>{letters[i]}</span>
                  {opt}
                </button>
              ))}
              <div style={{display:"flex",gap:"12px",marginTop:"8px"}}>
                {current > 0 && <button className="btn btn-outline" style={{flex:1}} onClick={()=>setCurrent(c=>c-1)}>← Back</button>}
                <button className="btn btn-primary" style={{flex:2}} disabled={answers[current]===undefined} onClick={handleNext}>
                  {current < CURRENT_MODULE.quiz.length-1 ? "Next →" : "Submit Quiz →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AcknowledgementScreen({ user, score, language, onDone }) {
  const [checked, setChecked] = useState(false);
  const [signed, setSigned] = useState(false);
  const now = new Date().toLocaleString("en-SG", {dateStyle:"full",timeStyle:"short"});

  const handleSign = () => {
    setSigned(true);
    saveCompletion(user.id, { score, language, completedAt: now, name: user.name });
    setTimeout(onDone, 300);
  };

  return (
    <>
      <style>{css}</style>
      <div style={{background:"var(--surface)",minHeight:"100vh"}}>
        <div className="topbar"><div className="topbar-brand">AKTS Training Hub</div></div>
        <div className="main">
          <div style={{maxWidth:"560px",margin:"0 auto"}}>
            <div className="module-header">
              <div className="module-tag">✅ Step 4 of 4 — Acknowledgement</div>
              <StepIndicator current={4} />
            </div>
            <div style={{background:"#fff",borderRadius:"20px",padding:"36px",border:"1px solid #eee"}}>
              <div className="cert-block">
                <div style={{fontSize:"11px",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"2px",marginBottom:"8px"}}>Training Record</div>
                <div className="cert-name">{user.name}</div>
                <div className="cert-detail">Employee ID: {user.id.toUpperCase()} · {user.department}</div>
                <div className="cert-detail">Module: {CURRENT_MODULE.title}</div>
                <div className="cert-detail">Quiz Score: <strong>{score}/10</strong> ({score*10}%) · Language: {language === "english" ? "English" : "Mandarin 中文"}</div>
                <div className="cert-detail" style={{marginTop:"8px",fontSize:"12px",color:"#aaa"}}>Date: {now}</div>
              </div>

              <div style={{background:"#fffbf5",border:"1px solid var(--border)",borderRadius:"12px",padding:"20px",marginBottom:"20px",fontSize:"14px",lineHeight:1.7,color:"var(--ink)"}}>
                <strong>Declaration:</strong><br/>
                I, <strong>{user.name}</strong>, confirm that I have fully watched the <strong>{CURRENT_MODULE.title}</strong> training video and completed the knowledge assessment. I understand the content covered and commit to applying these practices in my daily work.
              </div>

              <label style={{display:"flex",alignItems:"flex-start",gap:"12px",cursor:"pointer",marginBottom:"24px",textTransform:"none",letterSpacing:"normal",fontSize:"14px",color:"var(--ink)",fontWeight:"normal"}}>
                <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} style={{width:"18px",height:"18px",flexShrink:0,marginTop:"2px",accentColor:"var(--gold)"}}/>
                I agree to the above declaration and confirm my attendance for this TBM training session.
              </label>

              <button className="btn btn-primary" disabled={!checked || signed} onClick={handleSign}>
                {signed ? "✓ Recorded!" : "Sign & Submit Attendance →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AdminPanel({ onBack }) {
  const completions = getCompletions();
  const allUsers = Object.entries(MOCK_USERS).filter(([,u])=>u.role==="employee");
  const completed = allUsers.filter(([id]) => completions[id]?.[CURRENT_MODULE.id]);
  const pending = allUsers.filter(([id]) => !completions[id]?.[CURRENT_MODULE.id]);
  const avgScore = completed.length
    ? Math.round(completed.reduce((sum,[id])=>sum+(completions[id][CURRENT_MODULE.id].score||0),0)/completed.length*10)
    : 0;

  return (
    <>
      <style>{css}</style>
      <div style={{background:"var(--surface)",minHeight:"100vh"}}>
        <div className="topbar">
          <div className="topbar-brand">AKTS Training Hub · Admin</div>
          <button className="btn btn-outline" style={{color:"#fff",borderColor:"rgba(255,255,255,0.2)",padding:"8px 16px",fontSize:"13px"}} onClick={onBack}>← Back</button>
        </div>
        <div className="main" style={{maxWidth:"900px"}}>
          <div style={{marginBottom:"32px"}}>
            <div className="section-title">Admin Dashboard</div>
            <div className="section-sub">{CURRENT_MODULE.title} · Window: Open until {CURRENT_MODULE.deadline}</div>
          </div>

          <div className="admin-grid">
            <div className="stat-card">
              <div className="stat-num">{allUsers.length}</div>
              <div className="stat-label">Total Employees</div>
            </div>
            <div className="stat-card">
              <div className="stat-num green">{completed.length}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-num red">{pending.length}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card">
              <div className="stat-num gold">{avgScore}%</div>
              <div className="stat-label">Avg. Quiz Score</div>
            </div>
          </div>

          <div style={{background:"#fff",borderRadius:"20px",overflow:"hidden",border:"1px solid #eee",marginBottom:"24px"}}>
            <div style={{padding:"20px 24px",borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:"16px"}}>Completion Report</div>
              <div style={{fontSize:"12px",color:"var(--muted)"}}>Export → CSV</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Language</th>
                  <th>Completed At</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map(([id, u]) => {
                  const c = completions[id]?.[CURRENT_MODULE.id];
                  return (
                    <tr key={id}>
                      <td><strong>{u.name}</strong><br/><span style={{fontSize:"11px",color:"var(--muted)"}}>{id}</span></td>
                      <td>{u.department}</td>
                      <td>{c ? <span className="badge badge-green">✓ Done</span> : <span className="badge badge-red">Pending</span>}</td>
                      <td>{c ? `${c.score}/10` : "—"}</td>
                      <td>{c ? (c.language === "english" ? "🇬🇧 EN" : "🇨🇳 ZH") : "—"}</td>
                      <td style={{fontSize:"12px"}}>{c?.completedAt || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{background:"#fff",borderRadius:"20px",padding:"28px",border:"1px solid #eee"}}>
            <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:"16px",marginBottom:"16px"}}>📤 Upload Next Month's Video</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"16px"}}>
              <div className="form-group" style={{margin:0}}>
                <label>English Video URL (YouTube/Vimeo)</label>
                <input placeholder="https://youtube.com/embed/..." />
              </div>
              <div className="form-group" style={{margin:0}}>
                <label>Mandarin Video URL (YouTube/Vimeo)</label>
                <input placeholder="https://youtube.com/embed/..." />
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"16px"}}>
              <div className="form-group" style={{margin:0}}>
                <label>Window Open (Date + Time)</label>
                <input type="datetime-local"/>
              </div>
              <div className="form-group" style={{margin:0}}>
                <label>Window Close (Date + Time)</label>
                <input type="datetime-local"/>
              </div>
            </div>
            <button className="btn btn-primary" style={{maxWidth:"240px"}}>Save & Schedule →</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── APP CONTROLLER ──────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("login"); // login | home | language | video | quiz | ack | done | admin
  const [language, setLanguage] = useState(null);
  const [quizScore, setQuizScore] = useState(0);

  const handleLogin = (u) => {
    setUser(u);
    if (u.role === "admin") { setScreen("admin"); return; }
    const done = getUserCompletion(u.id);
    if (done) { setScreen("done"); return; }
    if (!CURRENT_MODULE.windowOpen) { setScreen("locked"); return; }
    setScreen("language");
  };

  const handleLogout = () => { setUser(null); setScreen("login"); setLanguage(null); };

  if (screen === "login") return <LoginScreen onLogin={handleLogin}/>;
  if (screen === "locked") return <LockedScreen user={user} onLogout={handleLogout}/>;
  if (screen === "admin") return <AdminPanel onBack={handleLogout}/>;
  if (screen === "done") {
    const c = getUserCompletion(user.id);
    return <AlreadyDoneScreen user={user} completion={c} onLogout={handleLogout}/>;
  }
  if (screen === "language") return <LanguageScreen user={user} onSelect={(l)=>{setLanguage(l);setScreen("video");}}/>;
  if (screen === "video") return <VideoScreen user={user} language={language} onComplete={()=>setScreen("quiz")}/>;
  if (screen === "quiz") return <QuizScreen user={user} language={language} onComplete={(s)=>{setQuizScore(s);setScreen("ack");}}/>;
  if (screen === "ack") return <AcknowledgementScreen user={user} score={quizScore} language={language} onDone={()=>setScreen("done")}/>;

  return null;
}
