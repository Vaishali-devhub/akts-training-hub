import { useState, useEffect } from "react";

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const MOCK_USERS = {
  "emp001": { password: "akts2024", name: "Ahmad Razif", department: "Operations", role: "employee" },
  "emp002": { password: "akts2024", name: "Lin Wei", department: "Safety", role: "employee" },
  "emp003": { password: "akts2024", name: "Priya Nair", department: "HR", role: "employee" },
  "admin":  { password: "admin888", name: "Admin Manager", department: "Management", role: "admin" },
};

const LANGUAGES = [
  { code: "english",   label: "English",    native: "English",       flag: "🇬🇧" },
  { code: "mandarin",  label: "Mandarin",   native: "普通话",         flag: "🇨🇳" },
  { code: "tamil",     label: "Tamil",      native: "தமிழ்",          flag: "🇮🇳" },
  { code: "burmese",   label: "Burmese",    native: "မြန်မာဘာသာ",     flag: "🇲🇲" },
  { code: "filipino",  label: "Filipino",   native: "Filipino",      flag: "🇵🇭" },
  { code: "malay",     label: "Malay",      native: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "bangla",    label: "Bangla",     native: "বাংলা",           flag: "🇧🇩" },
];

// Video is always English for now (captions/translation coming in a later phase)
const VIDEO_URL = "https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1";

// ─── AUTO-COMPUTED MONTH/DATE — no manual editing needed each month ──────────
function getModuleMeta() {
  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const id = `INT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const title = `${monthLabel} Internal Training`;

  // Deadline = upcoming Sunday at 11:59 PM
  const deadlineDate = new Date(now);
  let addDays = (7 - now.getDay()) % 7;
  if (addDays === 0) addDays = 7;
  deadlineDate.setDate(now.getDate() + addDays);
  const deadline = deadlineDate.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + " at 11:59 PM";

  return { id, title, month: monthLabel, deadline };
}

const MODULE_META = getModuleMeta();

const CURRENT_MODULE = {
  ...MODULE_META,
  windowOpen: true, // set false to preview the locked screen
  checkpoints: [
    { at: 15, question: "What is the primary purpose of this Internal Training?", options: ["Social gathering", "Safety briefing and awareness", "Performance review", "Team lunch"], answer: 1 },
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
function getCompletions() { try { return JSON.parse(localStorage.getItem(COMPLETIONS_KEY) || "{}"); } catch { return {}; } }
function saveCompletion(userId, data) { const all = getCompletions(); all[userId] = { ...all[userId], [CURRENT_MODULE.id]: data }; localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(all)); }
function getUserCompletion(userId) { const all = getCompletions(); return all[userId]?.[CURRENT_MODULE.id] || null; }

// ─── STYLES — clean white / blue corporate theme ─────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #1f2329;
    --bg: #f6f7f9;
    --surface: #ffffff;
    --blue: #2563eb;
    --blue-dark: #1d4ed8;
    --blue-light: #eff6ff;
    --blue-border: rgba(37,99,235,0.25);
    --red: #c0392b;
    --green: #15803d;
    --muted: #667085;
    --border: #e5e7eb;
    --radius: 12px;
    --radius-lg: 18px;
  }

  body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--ink); min-height: 100vh; -webkit-font-smoothing: antialiased; }

  h1,h2,h3,h4 { font-family: 'Inter', sans-serif; }

  /* ── LOGIN ── */
  .login-page { min-height: 100vh; background: var(--bg); display: flex; flex-direction: column; align-items: center; padding: 56px 20px 40px; }

  .login-brandrow { display: flex; align-items: center; gap: 10px; margin-bottom: 36px; }
  .login-brandrow-icon { width: 34px; height: 34px; background: var(--blue); border-radius: 9px; display: flex; align-items: center; justify-content: center; }
  .login-brandrow-name { font-weight: 700; font-size: 16px; color: var(--ink); letter-spacing: -0.2px; }

  .login-card { background: var(--surface); border-radius: var(--radius-lg); padding: 40px; width: 100%; max-width: 400px; box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06); border: 1px solid var(--border); }

  .login-card-title { font-size: 22px; font-weight: 700; color: var(--ink); margin-bottom: 4px; letter-spacing: -0.3px; text-align: center; }
  .login-card-sub { font-size: 13px; color: var(--muted); margin-bottom: 28px; text-align: center; }

  .form-label { display: block; font-size: 12px; font-weight: 600; color: var(--ink); margin-bottom: 7px; }
  .form-input { width: 100%; padding: 12px 14px; background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); font-size: 14px; font-family: 'Inter', sans-serif; color: var(--ink); outline: none; transition: all 0.15s; margin-bottom: 16px; }
  .form-input::placeholder { color: #9ca3af; }
  .form-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px var(--blue-light); }

  .btn-primary { width: 100%; padding: 12px; background: var(--blue); color: #fff; border: none; border-radius: var(--radius); font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .btn-primary:hover { background: var(--blue-dark); }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .btn-outline { padding: 11px 20px; background: var(--surface); color: var(--ink); border: 1.5px solid var(--border); border-radius: var(--radius); font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 7px; }
  .btn-outline:hover { border-color: var(--blue); color: var(--blue); }

  .btn-dark { padding: 11px 20px; background: var(--ink); color: #fff; border: none; border-radius: var(--radius); font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 7px; }
  .btn-dark:hover { background: #000; }

  .error-box { background: #fef2f2; border: 1px solid #fecaca; color: var(--red); padding: 10px 14px; border-radius: 10px; font-size: 13px; margin-bottom: 16px; }

  .login-contact { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--border); text-align: center; font-size: 12px; color: var(--muted); line-height: 1.7; }

  .login-footer { max-width: 760px; width: 100%; margin-top: 48px; text-align: center; }
  .login-footer-desc { font-size: 14px; color: var(--muted); line-height: 1.7; max-width: 480px; margin: 0 auto 28px; }
  .login-footer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  .login-footer-item { display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: 12.5px; color: var(--muted); font-weight: 500; }
  .login-footer-dot { width: 36px; height: 36px; background: var(--blue-light); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 15px; }

  @media (max-width: 640px) { .login-footer-grid { grid-template-columns: 1fr 1fr; } }

  /* ── TOPBAR ── */
  .topbar { background: var(--surface); height: 56px; padding: 0 28px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid var(--border); }
  .topbar-left { display: flex; align-items: center; gap: 10px; }
  .topbar-logo { width: 26px; height: 26px; background: var(--blue); border-radius: 7px; display: flex; align-items: center; justify-content: center; }
  .topbar-name { font-weight: 700; font-size: 14px; color: var(--ink); letter-spacing: -0.2px; }
  .topbar-right { display: flex; align-items: center; gap: 10px; }
  .avatar { width: 28px; height: 28px; background: var(--blue-light); color: var(--blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; }
  .sign-out-btn { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 5px 12px; border-radius: 8px; font-size: 12px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
  .sign-out-btn:hover { border-color: var(--blue); color: var(--blue); }

  /* ── MAIN ── */
  .main { max-width: 800px; margin: 0 auto; padding: 32px 24px; }
  .main-wide { max-width: 920px; margin: 0 auto; padding: 32px 24px; }

  .module-card { background: var(--surface); border-radius: var(--radius-lg); padding: 26px 30px; margin-bottom: 18px; border: 1px solid var(--border); }
  .module-tag { display: inline-flex; align-items: center; gap: 5px; background: var(--blue-light); color: var(--blue); font-size: 11px; font-weight: 700; letter-spacing: 0.5px; padding: 4px 12px; border-radius: 100px; margin-bottom: 12px; }
  .module-title { font-size: 22px; font-weight: 700; letter-spacing: -0.3px; margin-bottom: 4px; color: var(--ink); }
  .module-sub { font-size: 13px; color: var(--muted); }

  .steps { display: flex; gap: 6px; margin-top: 18px; flex-wrap: wrap; }
  .step { display: flex; align-items: center; gap: 6px; padding: 6px 13px; border-radius: 100px; font-size: 12px; font-weight: 500; border: 1.5px solid var(--border); color: var(--muted); background: var(--bg); }
  .step.active { border-color: var(--blue); color: var(--blue); background: var(--blue-light); font-weight: 600; }
  .step.done { border-color: #bbf7d0; color: var(--green); background: #f0fdf4; }
  .step-num { width: 17px; height: 17px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; }
  .step.active .step-num { background: var(--blue); color: #fff; }
  .step.done .step-num { background: #22c55e; color: #fff; }

  /* ── LANGUAGE SCREEN ── */
  .lang-page { min-height: 100vh; background: var(--bg); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .lang-card { background: var(--surface); border-radius: var(--radius-lg); padding: 40px; width: 100%; max-width: 420px; box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06); border: 1px solid var(--border); }
  .lang-card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; justify-content: center; }
  .lang-card-logo-icon { width: 30px; height: 30px; background: var(--blue); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  .lang-card-name { font-weight: 700; font-size: 13px; color: var(--ink); }

  .lang-title { font-size: 21px; font-weight: 700; color: var(--ink); margin-bottom: 4px; letter-spacing: -0.3px; text-align: center; }
  .lang-sub { font-size: 13px; color: var(--muted); margin-bottom: 22px; line-height: 1.6; text-align: center; }

  .lang-select-wrap { position: relative; margin-bottom: 16px; }
  .lang-select { width: 100%; padding: 13px 42px 13px 14px; background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); font-size: 14px; font-family: 'Inter', sans-serif; color: var(--ink); font-weight: 500; outline: none; appearance: none; cursor: pointer; transition: all 0.15s; }
  .lang-select:focus { border-color: var(--blue); box-shadow: 0 0 0 3px var(--blue-light); }
  .lang-arrow { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--muted); }

  .lang-preview { display: flex; align-items: center; gap: 12px; padding: 13px 16px; background: var(--blue-light); border: 1.5px solid var(--blue-border); border-radius: var(--radius); margin-bottom: 18px; }
  .lang-preview-flag { font-size: 24px; }
  .lang-preview-name { font-weight: 700; font-size: 14px; color: var(--ink); }
  .lang-preview-native { font-size: 12px; color: var(--muted); }

  /* ── VIDEO ── */
  .video-wrap { position: relative; background: #000; border-radius: var(--radius-lg); overflow: hidden; aspect-ratio: 16/9; margin-bottom: 14px; }
  .video-wrap iframe { width: 100%; height: 100%; border: none; }
  .video-overlay { position: absolute; inset: 0; background: rgba(15,20,28,0.92); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 14px; z-index: 10; border-radius: var(--radius-lg); }
  .play-btn { width: 60px; height: 60px; background: var(--blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; border: none; font-size: 18px; color: #fff; }
  .play-btn:hover { transform: scale(1.08); background: var(--blue-dark); }
  .overlay-title { font-size: 18px; color: #fff; font-weight: 700; }
  .overlay-sub { font-size: 13px; color: rgba(255,255,255,0.5); text-align: center; max-width: 280px; line-height: 1.6; }

  .progress-track { background: #e5e7eb; border-radius: 100px; height: 5px; width: 100%; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--blue); border-radius: 100px; transition: width 0.4s; }

  /* ── MODAL ── */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(15,20,28,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
  .modal { background: var(--surface); border-radius: var(--radius-lg); padding: 32px; max-width: 460px; width: 100%; box-shadow: 0 24px 64px rgba(0,0,0,0.25); }
  .modal-badge { display: inline-flex; align-items: center; gap: 6px; background: var(--blue-light); color: var(--blue); font-size: 11px; font-weight: 700; letter-spacing: 0.5px; padding: 4px 11px; border-radius: 100px; margin-bottom: 14px; }
  .modal-q { font-size: 17px; font-weight: 700; margin-bottom: 18px; line-height: 1.4; color: var(--ink); }

  .option-btn { width: 100%; text-align: left; padding: 12px 15px; border: 1.5px solid var(--border); border-radius: var(--radius); margin-bottom: 8px; cursor: pointer; font-size: 13.5px; font-family: 'Inter', sans-serif; background: var(--surface); transition: all 0.15s; display: flex; align-items: center; gap: 10px; color: var(--ink); font-weight: 500; }
  .option-btn:hover { border-color: var(--blue); background: var(--blue-light); }
  .option-btn.selected { border-color: var(--blue); background: var(--blue-light); }
  .option-btn.correct { border-color: #22c55e; background: #f0fdf4; color: var(--green); }
  .option-btn.wrong { border-color: #ef4444; background: #fef2f2; color: var(--red); }
  .option-letter { width: 24px; height: 24px; border-radius: 6px; background: var(--bg); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px; flex-shrink: 0; }

  /* ── QUIZ ── */
  .quiz-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 10px; }
  .q-counter { font-size: 11px; font-weight: 700; color: var(--muted); letter-spacing: 0.5px; text-transform: uppercase; }
  .q-badge { background: var(--blue-light); color: var(--blue); padding: 4px 13px; border-radius: 100px; font-size: 11px; font-weight: 700; }

  .result-circle { width: 104px; height: 104px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-direction: column; margin: 0 auto 22px; font-weight: 800; font-size: 26px; }
  .result-circle.pass { background: #f0fdf4; color: var(--green); border: 3px solid #22c55e; }
  .result-circle.fail { background: #fef2f2; color: var(--red); border: 3px solid #ef4444; }

  /* ── ACK ── */
  .ack-hero { background: var(--blue-light); border-radius: var(--radius-lg); padding: 32px; text-align: center; color: var(--ink); margin-bottom: 18px; border: 1px solid var(--blue-border); }
  .ack-icon { font-size: 40px; margin-bottom: 10px; }
  .ack-title { font-size: 22px; font-weight: 700; margin-bottom: 8px; color: var(--blue-dark); letter-spacing: -0.3px; }
  .ack-sub { color: var(--muted); font-size: 14px; line-height: 1.7; }

  .cert-block { background: var(--surface); border: 1.5px solid var(--blue-border); border-radius: var(--radius-lg); padding: 26px; text-align: center; margin-bottom: 18px; position: relative; }
  .cert-block::after { content: ''; position: absolute; inset: 7px; border: 1px dashed var(--blue-border); border-radius: 14px; pointer-events: none; }
  .cert-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
  .cert-name { font-size: 20px; font-weight: 700; margin: 4px 0; letter-spacing: -0.3px; }
  .cert-detail { font-size: 13px; color: var(--muted); margin-bottom: 3px; }

  /* ── ADMIN ── */
  .admin-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin-bottom: 24px; }
  .stat-card { background: var(--surface); border-radius: var(--radius-lg); padding: 20px 22px; border: 1px solid var(--border); }
  .stat-num { font-size: 32px; font-weight: 800; line-height: 1; margin-bottom: 4px; letter-spacing: -0.5px; color: var(--ink); }
  .stat-num.blue { color: var(--blue); }
  .stat-num.green { color: var(--green); }
  .stat-num.red { color: var(--red); }
  .stat-label { font-size: 12px; color: var(--muted); font-weight: 500; }

  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 10px 16px; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); background: #fafbfc; border-bottom: 1px solid var(--border); }
  td { padding: 13px 16px; border-bottom: 1px solid #f1f2f4; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fafbfc; }

  .badge { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; }
  .badge-green { background: #dcfce7; color: var(--green); }
  .badge-red { background: #fee2e2; color: var(--red); }

  .form-label-light { display: block; font-size: 12px; font-weight: 600; color: var(--ink); margin-bottom: 7px; }
  .form-input-light { width: 100%; padding: 12px 14px; background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); font-size: 14px; font-family: 'Inter', sans-serif; color: var(--ink); outline: none; transition: all 0.15s; margin-bottom: 16px; }
  .form-input-light:focus { border-color: var(--blue); box-shadow: 0 0 0 3px var(--blue-light); }

  /* ── LOCKED ── */
  .locked-icon { width: 68px; height: 68px; background: var(--blue-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; font-size: 26px; border: 1.5px solid var(--blue-border); }

  .divider { height: 1px; background: var(--border); margin: 18px 0; }

  @media (max-width: 600px) {
    .main, .main-wide { padding: 18px 14px; }
    .topbar { padding: 0 14px; }
    .module-card { padding: 18px; }
    .module-title { font-size: 19px; }
    .lang-card, .login-card { padding: 26px 22px; }
    .admin-stats { grid-template-columns: 1fr 1fr; }
    .steps { flex-direction: column; }
    th:nth-child(n+5), td:nth-child(n+5) { display: none; }
  }
`;

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function LogoIcon({ size = 26, color = "#fff" }) {
  const s = size * 0.62;
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="5" width="7" height="2" rx="1" fill={color}/>
      <rect x="2" y="9" width="11" height="2" rx="1" fill={color}/>
      <rect x="2" y="13" width="8" height="2" rx="1" fill={color}/>
      <circle cx="15" cy="7" r="3.5" stroke={color} strokeWidth="1.5"/>
      <path d="M13.5 7l1 1 2-2" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TopBar({ user, onLogout, onAdmin }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="topbar-logo"><LogoIcon size={26}/></div>
        <div className="topbar-name">AKTS Training Hub</div>
      </div>
      <div className="topbar-right">
        {user?.role === "admin" && <button className="btn-dark" style={{padding:"5px 13px",fontSize:"12px"}} onClick={onAdmin}>Admin Panel</button>}
        <span style={{fontSize:"13px",color:"var(--muted)"}}>{user?.name}</span>
        <div className="avatar">{user?.name?.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
        <button className="sign-out-btn" onClick={onLogout}>Sign Out</button>
      </div>
    </div>
  );
}

function StepIndicator({ current }) {
  const steps = [{id:1,label:"Language"},{id:2,label:"Video"},{id:3,label:"Quiz"},{id:4,label:"Complete"}];
  return (
    <div className="steps">
      {steps.map(s => (
        <div key={s.id} className={`step ${current===s.id?"active":current>s.id?"done":""}`}>
          <div className="step-num">{current>s.id?"✓":s.id}</div>
          {s.label}
        </div>
      ))}
    </div>
  );
}

// ─── SCREENS ─────────────────────────────────────────────────────────────────
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
    }, 600);
  };

  return (
    <>
      <style>{css}</style>
      <div className="login-page">
        <div className="login-brandrow">
          <div className="login-brandrow-icon"><LogoIcon size={34}/></div>
          <div className="login-brandrow-name">AKTS Training Hub</div>
        </div>

        <div className="login-card">
          <div className="login-card-title">Sign in to your account</div>
          <div className="login-card-sub">Enter your employee credentials to continue.</div>

          {err && <div className="error-box">⚠ {err}</div>}

          <label className="form-label">Employee ID</label>
          <input className="form-input" placeholder="e.g. EMP001" value={id} onChange={e=>setId(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>

          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="Enter your password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>

          <button className="btn-primary" onClick={handle} disabled={loading}>{loading?"Verifying…":"Sign In →"}</button>

          <div className="login-contact">
            This portal is exclusively for AKTS employees.<br/>
            Contact AKTS HSE if you need access.
          </div>
        </div>

        <div className="login-footer">
          <div className="login-footer-desc">
            Complete your mandatory training on your own schedule, within the open window. Fully digital, fully trackable.
          </div>
          <div className="login-footer-grid">
            <div className="login-footer-item"><div className="login-footer-dot">🌐</div>Available in 7 languages</div>
            <div className="login-footer-item"><div className="login-footer-dot">▶</div>Interactive video checkpoints</div>
            <div className="login-footer-item"><div className="login-footer-dot">📝</div>10-question knowledge quiz</div>
            <div className="login-footer-item"><div className="login-footer-dot">✅</div>Digital attendance & sign-off</div>
          </div>
        </div>
      </div>
    </>
  );
}

function LanguageScreen({ user, onSelect }) {
  const [selected, setSelected] = useState("");
  const lang = LANGUAGES.find(l => l.code === selected);

  return (
    <>
      <style>{css}</style>
      <div className="lang-page">
        <div className="lang-card">
          <div className="lang-card-top">
            <div className="lang-card-logo-icon"><LogoIcon size={30}/></div>
            <div className="lang-card-name">AKTS Training Hub</div>
          </div>
          <div className="lang-title">Select Your Language</div>
          <div className="lang-sub">Choose the language for your training session.<br/>请选择您的培训语言 · Pilih bahasa anda</div>

          <div className="lang-select-wrap">
            <select className="lang-select" value={selected} onChange={e=>setSelected(e.target.value)}>
              <option value="" disabled>— Select a language —</option>
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.flag}  {l.label} — {l.native}</option>
              ))}
            </select>
            <div className="lang-arrow">⌄</div>
          </div>

          {lang && (
            <div className="lang-preview">
              <div className="lang-preview-flag">{lang.flag}</div>
              <div>
                <div className="lang-preview-name">{lang.label}</div>
                <div className="lang-preview-native">{lang.native}</div>
              </div>
            </div>
          )}

          <button className="btn-primary" disabled={!selected} onClick={()=>selected&&onSelect(selected)}>Continue →</button>
          <div style={{marginTop:"14px",textAlign:"center",fontSize:"12px",color:"var(--muted)"}}>
            Hello, <strong>{user.name}</strong> — your preference will be saved.
          </div>
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
        {checkpoint.options.map((opt,i) => {
          let cls = "option-btn";
          if (submitted) cls += i===checkpoint.answer?" correct":sel===i?" wrong":"";
          else if (sel===i) cls += " selected";
          return (
            <button key={i} className={cls} onClick={()=>!submitted&&setSel(i)}>
              <span className="option-letter" style={{background:sel===i&&!submitted?"var(--blue)":"",color:sel===i&&!submitted?"#fff":""}}>{letters[i]}</span>{opt}
            </button>
          );
        })}
        {!submitted
          ? <button className="btn-primary" style={{marginTop:"8px"}} disabled={sel===null} onClick={()=>setSubmitted(true)}>Submit Answer</button>
          : <>
              <div style={{padding:"12px 16px",borderRadius:"10px",background:sel===checkpoint.answer?"#f0fdf4":"#fef2f2",color:sel===checkpoint.answer?"var(--green)":"var(--red)",fontSize:"13px",marginBottom:"12px",fontWeight:500}}>
                {sel===checkpoint.answer?"✓ Correct! Great job.":`✗ Correct answer: ${checkpoint.options[checkpoint.answer]}`}
              </div>
              <button className="btn-primary" onClick={onPass}>Continue Video →</button>
            </>
        }
      </div>
    </div>
  );
}

function VideoScreen({ user, language, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [checkpoint, setCheckpoint] = useState(null);
  const [passed, setPassed] = useState([]);
  const [started, setStarted] = useState(false);
  const [sim, setSim] = useState(0);
  const lang = LANGUAGES.find(l=>l.code===language);

  useEffect(() => {
    if (!started) return;
    const next = CURRENT_MODULE.checkpoints.find(cp=>!passed.includes(cp.at)&&sim>=cp.at);
    if (next) { setCheckpoint(next); return; }
    if (sim>=100) { setProgress(100); return; }
    const t = setTimeout(()=>setSim(p=>Math.min(p+0.4,100)),200);
    return ()=>clearTimeout(t);
  }, [sim,started,passed]);

  useEffect(()=>setProgress(sim),[sim]);

  return (
    <>
      <style>{css}</style>
      <div style={{minHeight:"100vh"}}>
        <TopBar user={user} onLogout={()=>{}} onAdmin={()=>{}}/>
        <div className="main">
          <div className="module-card">
            <div className="module-tag">STEP 2 OF 4 — TRAINING VIDEO</div>
            <div className="module-title">{CURRENT_MODULE.title}</div>
            <div className="module-sub">{lang?.flag} {lang?.label} · {CURRENT_MODULE.checkpoints.length} checkpoints · Watch fully to unlock quiz</div>
            <StepIndicator current={2}/>
          </div>
          <div style={{background:"#fff",borderRadius:"18px",padding:"26px",border:"1px solid var(--border)"}}>
            <div className="video-wrap">
              <iframe src={VIDEO_URL} allow="autoplay; encrypted-media" title="Training Video"/>
              {!started && (
                <div className="video-overlay">
                  <button className="play-btn" onClick={()=>setStarted(true)}>▶</button>
                  <div className="overlay-title">Ready to begin?</div>
                  <div className="overlay-sub">{CURRENT_MODULE.checkpoints.length} checkpoint questions will appear during the video. Do not close this page.</div>
                </div>
              )}
            </div>
            <div className="progress-track" style={{marginBottom:"6px"}}><div className="progress-fill" style={{width:`${progress}%`}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",color:"var(--muted)",marginBottom:"14px"}}>
              <span>Video Progress</span>
              <span style={{fontWeight:600,color:progress>=100?"var(--green)":"var(--ink)"}}>{Math.round(progress)}%</span>
            </div>
            <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
              {CURRENT_MODULE.checkpoints.map(cp=>(
                <div key={cp.at} style={{fontSize:"12px",padding:"5px 12px",borderRadius:"100px",fontWeight:500,background:passed.includes(cp.at)?"#f0fdf4":"var(--bg)",color:passed.includes(cp.at)?"var(--green)":"var(--muted)",border:`1px solid ${passed.includes(cp.at)?"#bbf7d0":"var(--border)"}`}}>
                  {passed.includes(cp.at)?"✓":"○"} Checkpoint {cp.at}%
                </div>
              ))}
            </div>
            {progress>=100 && (
              <div style={{marginTop:"18px",padding:"16px 20px",background:"#f0fdf4",borderRadius:"12px",border:"1px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
                <div>
                  <div style={{fontWeight:700,color:"var(--green)",fontSize:"14px"}}>✓ Video Complete!</div>
                  <div style={{fontSize:"13px",color:"var(--muted)",marginTop:"2px"}}>All checkpoints passed. Proceed to the quiz.</div>
                </div>
                <button className="btn-primary" style={{width:"auto",padding:"11px 22px"}} onClick={onComplete}>Take Quiz →</button>
              </div>
            )}
          </div>
        </div>
      </div>
      {checkpoint && <CheckpointModal checkpoint={checkpoint} onPass={()=>{setPassed(p=>[...p,checkpoint.at]);setCheckpoint(null);}}/>}
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

  const handleNext = () => {
    if (current<CURRENT_MODULE.quiz.length-1) { setCurrent(c=>c+1); return; }
    let s=0; CURRENT_MODULE.quiz.forEach((q,i)=>{ if(answers[i]===q.answer) s++; });
    setScore(s); setSubmitted(true);
  };

  if (submitted) {
    const pass = score>=7;
    return (
      <>
        <style>{css}</style>
        <div style={{minHeight:"100vh"}}>
          <TopBar user={user} onLogout={()=>{}} onAdmin={()=>{}}/>
          <div className="main">
            <div className="module-card"><div className="module-tag">STEP 3 OF 4 — RESULTS</div><StepIndicator current={pass?4:3}/></div>
            <div style={{background:"#fff",borderRadius:"18px",padding:"36px",textAlign:"center",border:"1px solid var(--border)"}}>
              <div className={`result-circle ${pass?"pass":"fail"}`}>{score}/10<div style={{fontSize:"10px",fontWeight:700,marginTop:"3px"}}>{pass?"PASS":"FAIL"}</div></div>
              <h2 style={{fontSize:"20px",fontWeight:700,marginBottom:"8px",letterSpacing:"-0.3px"}}>{pass?"Well Done! 🎉":"Not Quite There"}</h2>
              <p style={{color:"var(--muted)",fontSize:"14px",lineHeight:1.7,marginBottom:"24px",maxWidth:"360px",margin:"0 auto 24px"}}>
                {pass?`You scored ${score}/10 (${score*10}%). Proceed to sign your attendance.`:`You scored ${score}/10. Minimum 7/10 required. ${attempt<3?`${3-attempt} attempt(s) remaining.`:"All 3 attempts used. Your manager has been notified."}`}
              </p>
              {!pass&&attempt<3&&<button className="btn-outline" style={{marginBottom:"12px"}} onClick={()=>{setAttempt(a=>a+1);setAnswers({});setCurrent(0);setSubmitted(false);setScore(0);}}>🔄 Retry (Attempt {attempt+1}/3)</button>}
              {pass&&<button className="btn-primary" style={{maxWidth:"280px",margin:"0 auto"}} onClick={()=>onComplete(score)}>Complete & Sign Attendance →</button>}
              {!pass&&attempt>=3&&<div style={{padding:"14px",background:"#fef2f2",borderRadius:"12px",color:"var(--red)",fontSize:"13px"}}>⚠ Maximum attempts reached. Please speak to your supervisor.</div>}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div style={{minHeight:"100vh"}}>
        <TopBar user={user} onLogout={()=>{}} onAdmin={()=>{}}/>
        <div className="main">
          <div className="module-card"><div className="module-tag">STEP 3 OF 4 — KNOWLEDGE CHECK</div><StepIndicator current={3}/></div>
          <div style={{background:"#fff",borderRadius:"18px",padding:"30px",border:"1px solid var(--border)"}}>
            <div className="quiz-header">
              <div className="q-counter">Question {current+1} of {CURRENT_MODULE.quiz.length}</div>
              <div className="q-badge">Attempt {attempt}/3</div>
            </div>
            <div className="progress-track" style={{marginBottom:"22px"}}><div className="progress-fill" style={{width:`${(current/CURRENT_MODULE.quiz.length)*100}%`}}/></div>
            <div className="modal-q" style={{fontSize:"16px"}}>{q.q}</div>
            {q.options.map((opt,i)=>(
              <button key={i} className={`option-btn ${answers[current]===i?"selected":""}`} onClick={()=>setAnswers({...answers,[current]:i})}>
                <span className="option-letter" style={{background:answers[current]===i?"var(--blue)":"",color:answers[current]===i?"#fff":""}}>{letters[i]}</span>{opt}
              </button>
            ))}
            <div style={{display:"flex",gap:"10px",marginTop:"8px"}}>
              {current>0&&<button className="btn-outline" style={{flex:1}} onClick={()=>setCurrent(c=>c-1)}>← Back</button>}
              <button className="btn-primary" style={{flex:2}} disabled={answers[current]===undefined} onClick={handleNext}>
                {current<CURRENT_MODULE.quiz.length-1?"Next →":"Submit Quiz →"}
              </button>
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
  const lang = LANGUAGES.find(l=>l.code===language);
  const now = new Date().toLocaleString("en-SG",{dateStyle:"full",timeStyle:"short"});

  const handleSign = () => {
    setSigned(true);
    saveCompletion(user.id,{score,language,completedAt:now,name:user.name});
    setTimeout(onDone,400);
  };

  return (
    <>
      <style>{css}</style>
      <div style={{minHeight:"100vh"}}>
        <TopBar user={user} onLogout={()=>{}} onAdmin={()=>{}}/>
        <div className="main">
          <div className="module-card"><div className="module-tag">STEP 4 OF 4 — ACKNOWLEDGEMENT</div><StepIndicator current={4}/></div>
          <div style={{background:"#fff",borderRadius:"18px",padding:"30px",border:"1px solid var(--border)"}}>
            <div className="cert-block">
              <div className="cert-label">Training Completion Record</div>
              <div className="cert-name">{user.name}</div>
              <div className="cert-detail">Employee ID: {user.id.toUpperCase()} · {user.department}</div>
              <div className="cert-detail">{CURRENT_MODULE.title}</div>
              <div className="cert-detail">Score: <strong>{score}/10</strong> ({score*10}%) · {lang?.flag} {lang?.label}</div>
              <div style={{fontSize:"12px",color:"#9ca3af",marginTop:"8px"}}>{now}</div>
            </div>
            <div style={{background:"var(--blue-light)",border:"1px solid var(--blue-border)",borderRadius:"12px",padding:"18px 20px",marginBottom:"20px",fontSize:"14px",lineHeight:1.8,color:"var(--ink)"}}>
              <strong>Declaration:</strong><br/>
              I, <strong>{user.name}</strong>, confirm that I have fully watched the <strong>{CURRENT_MODULE.title}</strong> and completed the knowledge assessment. I understand the content and commit to applying these practices in my daily work.
            </div>
            <label style={{display:"flex",alignItems:"flex-start",gap:"12px",cursor:"pointer",marginBottom:"22px",fontSize:"14px",color:"var(--ink)",fontWeight:500}}>
              <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} style={{width:"17px",height:"17px",flexShrink:0,marginTop:"2px",accentColor:"var(--blue)"}}/>
              I agree to the above declaration and confirm my attendance for this training session.
            </label>
            <button className="btn-primary" disabled={!checked||signed} onClick={handleSign}>
              {signed?"✓ Recorded!":"Sign & Submit Attendance →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function AlreadyDoneScreen({ user, completion, onLogout }) {
  const lang = LANGUAGES.find(l=>l.code===completion?.language);
  return (
    <>
      <style>{css}</style>
      <TopBar user={user} onLogout={onLogout} onAdmin={()=>{}}/>
      <div className="main" style={{maxWidth:"540px"}}>
        <div className="ack-hero">
          <div className="ack-icon">🎓</div>
          <div className="ack-title">Training Complete</div>
          <div className="ack-sub">You have already completed this month's training. Your attendance has been recorded.</div>
        </div>
        <div className="cert-block">
          <div className="cert-label">Certificate of Completion</div>
          <div className="cert-name">{user.name}</div>
          <div className="cert-detail">{CURRENT_MODULE.month} Internal Training</div>
          <div className="cert-detail">Score: <strong>{completion?.score}/10</strong> · {lang?.flag} {lang?.label}</div>
          <div style={{fontSize:"12px",color:"#9ca3af",marginTop:"8px"}}>{completion?.completedAt}</div>
        </div>
      </div>
    </>
  );
}

function LockedScreen({ user, onLogout }) {
  return (
    <>
      <style>{css}</style>
      <TopBar user={user} onLogout={onLogout} onAdmin={()=>{}}/>
      <div className="main" style={{maxWidth:"500px",paddingTop:"56px",textAlign:"center"}}>
        <div style={{background:"#fff",borderRadius:"18px",padding:"48px 32px",border:"1px solid var(--border)"}}>
          <div className="locked-icon">🔐</div>
          <h2 style={{fontSize:"21px",fontWeight:700,marginBottom:"8px",letterSpacing:"-0.3px"}}>Training Window Closed</h2>
          <p style={{color:"var(--muted)",fontSize:"14px",lineHeight:1.7}}>The next session is not yet live.<br/>You will be notified when it opens.</p>
          <div style={{background:"var(--bg)",borderRadius:"12px",padding:"18px",marginTop:"22px"}}>
            <div style={{fontSize:"10px",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px"}}>Next Session Opens</div>
            <div style={{fontWeight:700,fontSize:"16px"}}>Check back next month</div>
          </div>
        </div>
      </div>
    </>
  );
}

function AdminPanel({ onBack }) {
  const completions = getCompletions();
  const allUsers = Object.entries(MOCK_USERS).filter(([,u])=>u.role==="employee");
  const completed = allUsers.filter(([id])=>completions[id]?.[CURRENT_MODULE.id]);
  const pending = allUsers.filter(([id])=>!completions[id]?.[CURRENT_MODULE.id]);
  const avgScore = completed.length?Math.round(completed.reduce((s,[id])=>s+(completions[id][CURRENT_MODULE.id].score||0),0)/completed.length*10):0;

  return (
    <>
      <style>{css}</style>
      <div style={{minHeight:"100vh"}}>
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-logo"><LogoIcon size={26}/></div>
            <div className="topbar-name">AKTS Training Hub <span style={{color:"var(--blue)",fontSize:"10px",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginLeft:"8px"}}>Admin</span></div>
          </div>
          <button className="sign-out-btn" onClick={onBack}>← Exit Admin</button>
        </div>
        <div className="main-wide">
          <div style={{marginBottom:"24px"}}>
            <div style={{fontSize:"24px",fontWeight:800,letterSpacing:"-0.3px",marginBottom:"3px"}}>Dashboard</div>
            <div style={{fontSize:"13px",color:"var(--muted)"}}>{CURRENT_MODULE.title} · Closes {CURRENT_MODULE.deadline}</div>
          </div>
          <div className="admin-stats">
            <div className="stat-card"><div className="stat-num">{allUsers.length}</div><div className="stat-label">Total Employees</div></div>
            <div className="stat-card"><div className="stat-num green">{completed.length}</div><div className="stat-label">Completed</div></div>
            <div className="stat-card"><div className="stat-num red">{pending.length}</div><div className="stat-label">Pending</div></div>
            <div className="stat-card"><div className="stat-num blue">{avgScore}%</div><div className="stat-label">Avg. Score</div></div>
          </div>
          <div style={{background:"#fff",borderRadius:"18px",overflow:"hidden",border:"1px solid var(--border)",marginBottom:"18px"}}>
            <div style={{padding:"16px 22px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontWeight:700,fontSize:"15px"}}>Completion Report</div>
              <div style={{fontSize:"12px",color:"var(--blue)",cursor:"pointer",fontWeight:600}}>Export CSV →</div>
            </div>
            <table>
              <thead><tr><th>Employee</th><th>Department</th><th>Status</th><th>Score</th><th>Language</th><th>Completed At</th></tr></thead>
              <tbody>
                {allUsers.map(([id,u])=>{
                  const c=completions[id]?.[CURRENT_MODULE.id];
                  const lang=LANGUAGES.find(l=>l.code===c?.language);
                  return (
                    <tr key={id}>
                      <td><strong>{u.name}</strong><br/><span style={{fontSize:"11px",color:"var(--muted)"}}>{id}</span></td>
                      <td>{u.department}</td>
                      <td>{c?<span className="badge badge-green">✓ Done</span>:<span className="badge badge-red">Pending</span>}</td>
                      <td>{c?`${c.score}/10`:"—"}</td>
                      <td>{c?`${lang?.flag} ${lang?.label}`:"—"}</td>
                      <td style={{fontSize:"12px",color:"var(--muted)"}}>{c?.completedAt||"—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{background:"#fff",borderRadius:"18px",padding:"26px",border:"1px solid var(--border)"}}>
            <div style={{fontWeight:700,fontSize:"15px",marginBottom:"6px"}}>📤 Upload Next Month's Training Video</div>
            <div style={{fontSize:"12px",color:"var(--muted)",marginBottom:"18px"}}>Upload your video to YouTube as <strong>Unlisted</strong>, then paste the embed link below. Captions/multi-language video coming in a later phase — for now everyone watches the same English video.</div>
            <label className="form-label-light">Training Video URL (YouTube embed link)</label>
            <input className="form-input-light" placeholder="https://www.youtube.com/embed/VIDEO_ID"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"18px"}}>
              <div><label className="form-label-light">Window Opens</label><input type="datetime-local" className="form-input-light"/></div>
              <div><label className="form-label-light">Window Closes</label><input type="datetime-local" className="form-input-light"/></div>
            </div>
            <button className="btn-primary" style={{maxWidth:"200px"}}>Save & Schedule →</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("login");
  const [language, setLanguage] = useState(null);
  const [quizScore, setQuizScore] = useState(0);

  const handleLogin = (u) => {
    setUser(u);
    if (u.role==="admin") { setScreen("admin"); return; }
    const done = getUserCompletion(u.id);
    if (done) { setScreen("done"); return; }
    if (!CURRENT_MODULE.windowOpen) { setScreen("locked"); return; }
    setScreen("language");
  };

  const handleLogout = () => { setUser(null); setScreen("login"); setLanguage(null); };

  if (screen==="login") return <LoginScreen onLogin={handleLogin}/>;
  if (screen==="locked") return <LockedScreen user={user} onLogout={handleLogout}/>;
  if (screen==="admin") return <AdminPanel onBack={handleLogout}/>;
  if (screen==="done") return <AlreadyDoneScreen user={user} completion={getUserCompletion(user.id)} onLogout={handleLogout}/>;
  if (screen==="language") return <LanguageScreen user={user} onSelect={l=>{setLanguage(l);setScreen("video");}}/>;
  if (screen==="video") return <VideoScreen user={user} language={language} onComplete={()=>setScreen("quiz")}/>;
  if (screen==="quiz") return <QuizScreen user={user} language={language} onComplete={s=>{setQuizScore(s);setScreen("ack");}}/>;
  if (screen==="ack") return <AcknowledgementScreen user={user} score={quizScore} language={language} onDone={()=>setScreen("done")}/>;
  return null;
}
