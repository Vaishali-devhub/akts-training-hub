import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CONNECTION ──────────────────────────────────────────────────────
const supabase = createClient(
  "https://keapdqlxnslbdtfnfraa.supabase.co",
  "sb_publishable_Eajulo5M-gdKfFC-vWUXcA_CEvxFvGd"
);

// ─── LANGUAGES ────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "english",   label: "English",    native: "English",       flag: "🇬🇧" },
  { code: "mandarin",  label: "Mandarin",   native: "普通话",         flag: "🇨🇳" },
  { code: "tamil",     label: "Tamil",      native: "தமிழ்",          flag: "🇮🇳" },
  { code: "burmese",   label: "Burmese",    native: "မြန်မာဘာသာ",     flag: "🇲🇲" },
  { code: "filipino",  label: "Filipino",   native: "Filipino",      flag: "🇵🇭" },
  { code: "malay",     label: "Malay",      native: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "bangla",    label: "Bangla",     native: "বাংলা",           flag: "🇧🇩" },
];

// ─── DATA HELPERS ─────────────────────────────────────────────────────────────
async function fetchActiveModule() {
  const { data: modules } = await supabase
    .from("training_modules")
    .select("*")
    .eq("window_open", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!modules || modules.length === 0) return null;
  const m = modules[0];

  const [{ data: checkpoints }, { data: quiz }] = await Promise.all([
    supabase.from("checkpoint_questions").select("*").eq("module_id", m.id).order("order_index"),
    supabase.from("quiz_questions").select("*").eq("module_id", m.id).order("order_index"),
  ]);

  return {
    id: m.id,
    code: m.module_code,
    title: m.title,
    month: m.month_label,
    videoUrl: m.video_url,
    passScore: m.pass_score || 7,
    windowClose: m.window_close,
    checkpoints: (checkpoints || []).map(c => ({
      at: c.at_percent,
      question: c.question_text,
      options: [c.option_a, c.option_b, c.option_c, c.option_d],
      answer: c.correct_answer,
    })),
    quiz: (quiz || []).map(q => ({
      q: q.question_text,
      options: [q.option_a, q.option_b, q.option_c, q.option_d],
      answer: q.correct_answer,
    })),
  };
}

async function fetchLatestModuleForAdmin() {
  const { data: modules } = await supabase
    .from("training_modules")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);
  return modules && modules[0] ? modules[0] : null;
}

async function checkExistingCompletion(employeeId, moduleId) {
  const { data } = await supabase
    .from("completions")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("module_id", moduleId)
    .maybeSingle();
  return data;
}

function formatDeadline(windowClose) {
  if (!windowClose) return "the end of this session";
  return new Date(windowClose).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    + " at " + new Date(windowClose).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function loadYouTubeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(window.YT); return; }
    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      resolve(window.YT);
    };
  });
}

function extractVideoId(embedUrl) {
  if (!embedUrl) return "";
  const match = embedUrl.match(/embed\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : "";
}

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
  .success-box { background: #f0fdf4; border: 1px solid #bbf7d0; color: var(--green); padding: 10px 14px; border-radius: 10px; font-size: 13px; margin-bottom: 16px; }

  .login-contact { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--border); text-align: center; font-size: 12px; color: var(--muted); line-height: 1.7; }

  .login-footer { max-width: 760px; width: 100%; margin-top: 48px; text-align: center; }
  .login-footer-desc { font-size: 14px; color: var(--muted); line-height: 1.7; max-width: 480px; margin: 0 auto 28px; }
  .login-footer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  .login-footer-item { display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: 12.5px; color: var(--muted); font-weight: 500; }
  .login-footer-dot { width: 36px; height: 36px; background: var(--blue-light); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
  @media (max-width: 640px) { .login-footer-grid { grid-template-columns: 1fr 1fr; } }

  .topbar { background: var(--surface); height: 56px; padding: 0 28px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid var(--border); }
  .topbar-left { display: flex; align-items: center; gap: 10px; }
  .topbar-logo { width: 26px; height: 26px; background: var(--blue); border-radius: 7px; display: flex; align-items: center; justify-content: center; }
  .topbar-name { font-weight: 700; font-size: 14px; color: var(--ink); letter-spacing: -0.2px; }
  .topbar-right { display: flex; align-items: center; gap: 10px; }
  .avatar { width: 28px; height: 28px; background: var(--blue-light); color: var(--blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; }
  .sign-out-btn { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 5px 12px; border-radius: 8px; font-size: 12px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
  .sign-out-btn:hover { border-color: var(--blue); color: var(--blue); }

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

  .video-wrap { position: relative; background: #000; border-radius: var(--radius-lg); overflow: hidden; aspect-ratio: 16/9; margin-bottom: 14px; }
  .video-wrap iframe { width: 100%; height: 100%; border: none; }
  .video-overlay { position: absolute; inset: 0; background: rgba(15,20,28,0.92); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 14px; z-index: 10; border-radius: var(--radius-lg); }
  .play-btn { width: 60px; height: 60px; background: var(--blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; border: none; font-size: 18px; color: #fff; }
  .play-btn:hover { transform: scale(1.08); background: var(--blue-dark); }
  .overlay-title { font-size: 18px; color: #fff; font-weight: 700; }
  .overlay-sub { font-size: 13px; color: rgba(255,255,255,0.5); text-align: center; max-width: 280px; line-height: 1.6; }

  .progress-track { background: #e5e7eb; border-radius: 100px; height: 5px; width: 100%; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--blue); border-radius: 100px; transition: width 0.4s; }

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

  .quiz-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 10px; }
  .q-counter { font-size: 11px; font-weight: 700; color: var(--muted); letter-spacing: 0.5px; text-transform: uppercase; }
  .q-badge { background: var(--blue-light); color: var(--blue); padding: 4px 13px; border-radius: 100px; font-size: 11px; font-weight: 700; }

  .result-circle { width: 104px; height: 104px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-direction: column; margin: 0 auto 22px; font-weight: 800; font-size: 26px; }
  .result-circle.pass { background: #f0fdf4; color: var(--green); border: 3px solid #22c55e; }
  .result-circle.fail { background: #fef2f2; color: var(--red); border: 3px solid #ef4444; }

  .ack-hero { background: var(--blue-light); border-radius: var(--radius-lg); padding: 32px; text-align: center; color: var(--ink); margin-bottom: 18px; border: 1px solid var(--blue-border); }
  .ack-icon { font-size: 40px; margin-bottom: 10px; }
  .ack-title { font-size: 22px; font-weight: 700; margin-bottom: 8px; color: var(--blue-dark); letter-spacing: -0.3px; }
  .ack-sub { color: var(--muted); font-size: 14px; line-height: 1.7; }

  .cert-block { background: var(--surface); border: 1.5px solid var(--blue-border); border-radius: var(--radius-lg); padding: 26px; text-align: center; margin-bottom: 18px; position: relative; }
  .cert-block::after { content: ''; position: absolute; inset: 7px; border: 1px dashed var(--blue-border); border-radius: 14px; pointer-events: none; }
  .cert-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
  .cert-name { font-size: 20px; font-weight: 700; margin: 4px 0; letter-spacing: -0.3px; }
  .cert-detail { font-size: 13px; color: var(--muted); margin-bottom: 3px; }

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

  .locked-icon { width: 68px; height: 68px; background: var(--blue-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; font-size: 26px; border: 1.5px solid var(--blue-border); }

  .spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--blue); border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 14px; background: var(--bg); }
  .loading-text { font-size: 13px; color: var(--muted); }

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

function LoadingScreen({ text = "Loading…" }) {
  return (
    <>
      <style>{css}</style>
      <div className="loading-screen">
        <div className="spinner"/>
        <div className="loading-text">{text}</div>
      </div>
    </>
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

  const handle = async () => {
    if (!id.trim() || !pw) { setErr("Please enter both Employee ID and password."); return; }
    setErr(""); setLoading(true);
    try {
      const { data, error } = await supabase.rpc("login_employee", {
        p_login_id: id.trim().toLowerCase(),
        p_password: pw,
      });
      if (error || !data || data.length === 0) {
        setErr("Invalid Employee ID or password. Please try again.");
        setLoading(false);
        return;
      }
      onLogin(data[0]);
    } catch (e) {
      setErr("Connection issue — please check your internet and try again.");
      setLoading(false);
    }
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
          <input className="form-input" placeholder="e.g. A-049" value={id} onChange={e=>setId(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>

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

function VideoScreen({ user, language, moduleData, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [checkpoint, setCheckpoint] = useState(null);
  const [passed, setPassed] = useState([]);
  const [started, setStarted] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const lang = LANGUAGES.find(l=>l.code===language);
  const videoId = extractVideoId(moduleData.videoUrl);

  // Load the real YouTube player once
  useEffect(() => {
    let mounted = true;
    loadYouTubeAPI().then(YT => {
      if (!mounted) return;
      playerRef.current = new YT.Player("yt-player-" + videoId, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (e) => { if (e.data === YT.PlayerState.ENDED) setProgress(100); },
        },
      });
    });
    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playerRef.current && playerRef.current.destroy) playerRef.current.destroy();
    };
  }, [videoId]);

  // Poll the REAL video position every half second
  useEffect(() => {
    if (!started) return;
    intervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player || typeof player.getDuration !== "function") return;
      const duration = player.getDuration();
      const current = player.getCurrentTime();
      if (!duration) return;
      const pct = Math.min((current / duration) * 100, 100);
      setProgress(pct);

      const next = moduleData.checkpoints.find(cp => !passed.includes(cp.at) && pct >= cp.at);
      if (next && !checkpoint) {
        player.pauseVideo();
        setCheckpoint(next);
      }
    }, 500);
    return () => clearInterval(intervalRef.current);
  }, [started, passed, checkpoint, moduleData]);

  const handleStart = () => {
    setStarted(true);
    if (playerRef.current && playerRef.current.playVideo) playerRef.current.playVideo();
  };

  const handleCheckpointPass = (cp) => {
    setPassed(p => [...p, cp.at]);
    setCheckpoint(null);
    if (playerRef.current && playerRef.current.playVideo) playerRef.current.playVideo();
  };

  return (
    <>
      <style>{css}</style>
      <div style={{minHeight:"100vh"}}>
        <TopBar user={user} onLogout={()=>{}} onAdmin={()=>{}}/>
        <div className="main">
          <div className="module-card">
            <div className="module-tag">STEP 2 OF 4 — TRAINING VIDEO</div>
            <div className="module-title">{moduleData.title}</div>
            <div className="module-sub">{lang?.flag} {lang?.label} · {moduleData.checkpoints.length} checkpoints · Watch fully to unlock quiz</div>
            <StepIndicator current={2}/>
          </div>
          <div style={{background:"#fff",borderRadius:"18px",padding:"26px",border:"1px solid var(--border)"}}>
            <div className="video-wrap">
              <div id={"yt-player-" + videoId} style={{width:"100%",height:"100%"}}/>
              {!started && (
                <div className="video-overlay">
                  <button className="play-btn" onClick={handleStart} disabled={!playerReady}>▶</button>
                  <div className="overlay-title">{playerReady ? "Ready to begin?" : "Loading video…"}</div>
                  <div className="overlay-sub">{moduleData.checkpoints.length} checkpoint questions will appear during the video — it will pause automatically. Do not close this page.</div>
                </div>
              )}
            </div>
            <div className="progress-track" style={{marginBottom:"6px"}}><div className="progress-fill" style={{width:`${progress}%`}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",color:"var(--muted)",marginBottom:"14px"}}>
              <span>Video Progress</span>
              <span style={{fontWeight:600,color:progress>=100?"var(--green)":"var(--ink)"}}>{Math.round(progress)}%</span>
            </div>
            <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
              {moduleData.checkpoints.map(cp=>(
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
      {checkpoint && <CheckpointModal checkpoint={checkpoint} onPass={()=>handleCheckpointPass(checkpoint)}/>}
    </>
  );
}

function QuizScreen({ user, language, moduleData, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const letters = ["A","B","C","D"];
  const q = moduleData.quiz[current];
  const passScore = moduleData.passScore || 7;

  const handleNext = () => {
    if (current<moduleData.quiz.length-1) { setCurrent(c=>c+1); return; }
    let s=0; moduleData.quiz.forEach((q,i)=>{ if(answers[i]===q.answer) s++; });
    setScore(s); setSubmitted(true);
  };

  if (submitted) {
    const pass = score>=passScore;
    return (
      <>
        <style>{css}</style>
        <div style={{minHeight:"100vh"}}>
          <TopBar user={user} onLogout={()=>{}} onAdmin={()=>{}}/>
          <div className="main">
            <div className="module-card"><div className="module-tag">STEP 3 OF 4 — RESULTS</div><StepIndicator current={pass?4:3}/></div>
            <div style={{background:"#fff",borderRadius:"18px",padding:"36px",textAlign:"center",border:"1px solid var(--border)"}}>
              <div className={`result-circle ${pass?"pass":"fail"}`}>{score}/{moduleData.quiz.length}<div style={{fontSize:"10px",fontWeight:700,marginTop:"3px"}}>{pass?"PASS":"FAIL"}</div></div>
              <h2 style={{fontSize:"20px",fontWeight:700,marginBottom:"8px",letterSpacing:"-0.3px"}}>{pass?"Well Done! 🎉":"Not Quite There"}</h2>
              <p style={{color:"var(--muted)",fontSize:"14px",lineHeight:1.7,marginBottom:"24px",maxWidth:"360px",margin:"0 auto 24px"}}>
                {pass?`You scored ${score}/${moduleData.quiz.length}. Proceed to sign your attendance.`:`You scored ${score}/${moduleData.quiz.length}. Minimum ${passScore}/${moduleData.quiz.length} required. ${attempt<3?`${3-attempt} attempt(s) remaining.`:"All 3 attempts used. Your manager has been notified."}`}
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
              <div className="q-counter">Question {current+1} of {moduleData.quiz.length}</div>
              <div className="q-badge">Attempt {attempt}/3</div>
            </div>
            <div className="progress-track" style={{marginBottom:"22px"}}><div className="progress-fill" style={{width:`${(current/moduleData.quiz.length)*100}%`}}/></div>
            <div className="modal-q" style={{fontSize:"16px"}}>{q.q}</div>
            {q.options.map((opt,i)=>(
              <button key={i} className={`option-btn ${answers[current]===i?"selected":""}`} onClick={()=>setAnswers({...answers,[current]:i})}>
                <span className="option-letter" style={{background:answers[current]===i?"var(--blue)":"",color:answers[current]===i?"#fff":""}}>{letters[i]}</span>{opt}
              </button>
            ))}
            <div style={{display:"flex",gap:"10px",marginTop:"8px"}}>
              {current>0&&<button className="btn-outline" style={{flex:1}} onClick={()=>setCurrent(c=>c-1)}>← Back</button>}
              <button className="btn-primary" style={{flex:2}} disabled={answers[current]===undefined} onClick={handleNext}>
                {current<moduleData.quiz.length-1?"Next →":"Submit Quiz →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AcknowledgementScreen({ user, score, language, moduleData, onDone }) {
  const [checked, setChecked] = useState(false);
  const [signed, setSigned] = useState(false);
  const [saving, setSaving] = useState(false);
  const lang = LANGUAGES.find(l=>l.code===language);
  const now = new Date().toLocaleString("en-SG",{dateStyle:"full",timeStyle:"short"});

  const handleSign = async () => {
    setSaving(true);
    await supabase.from("completions").upsert(
      { employee_id: user.id, module_id: moduleData.id, score, language },
      { onConflict: "employee_id,module_id" }
    );
    setSigned(true);
    setSaving(false);
    setTimeout(onDone, 400);
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
              <div className="cert-detail">Employee ID: {user.e_no} · {user.plant}</div>
              <div className="cert-detail">{moduleData.title}</div>
              <div className="cert-detail">Score: <strong>{score}/{moduleData.quiz.length}</strong> · {lang?.flag} {lang?.label}</div>
              <div style={{fontSize:"12px",color:"#9ca3af",marginTop:"8px"}}>{now}</div>
            </div>
            <div style={{background:"var(--blue-light)",border:"1px solid var(--blue-border)",borderRadius:"12px",padding:"18px 20px",marginBottom:"20px",fontSize:"14px",lineHeight:1.8,color:"var(--ink)"}}>
              <strong>Declaration:</strong><br/>
              I, <strong>{user.name}</strong>, confirm that I have fully watched the <strong>{moduleData.title}</strong> and completed the knowledge assessment. I understand the content and commit to applying these practices in my daily work.
            </div>
            <label style={{display:"flex",alignItems:"flex-start",gap:"12px",cursor:"pointer",marginBottom:"22px",fontSize:"14px",color:"var(--ink)",fontWeight:500}}>
              <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} style={{width:"17px",height:"17px",flexShrink:0,marginTop:"2px",accentColor:"var(--blue)"}}/>
              I agree to the above declaration and confirm my attendance for this training session.
            </label>
            <button className="btn-primary" disabled={!checked||signed||saving} onClick={handleSign}>
              {saving?"Saving…":signed?"✓ Recorded!":"Sign & Submit Attendance →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function AlreadyDoneScreen({ user, completion, moduleData, onLogout }) {
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
          <div className="cert-detail">{moduleData?.title || "Internal Training"}</div>
          <div className="cert-detail">Score: <strong>{completion?.score}/10</strong> · {lang?.flag} {lang?.label}</div>
          <div style={{fontSize:"12px",color:"#9ca3af",marginTop:"8px"}}>{completion?.completed_at ? new Date(completion.completed_at).toLocaleString("en-SG",{dateStyle:"full",timeStyle:"short"}) : ""}</div>
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
          <p style={{color:"var(--muted)",fontSize:"14px",lineHeight:1.7}}>There is no active training session right now.<br/>You will be notified when the next one opens.</p>
        </div>
      </div>
    </>
  );
}

function AdminPanel({ user, onBack }) {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [moduleRow, setModuleRow] = useState(null);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [windowOpenInput, setWindowOpenInput] = useState(true);
  const [windowCloseInput, setWindowCloseInput] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const mod = await fetchLatestModuleForAdmin();
      setModuleRow(mod);
      if (mod) {
        setVideoUrlInput(mod.video_url || "");
        setWindowOpenInput(mod.window_open);
        setWindowCloseInput(mod.window_close ? mod.window_close.slice(0,16) : "");
      }

      const { data: emps } = await supabase.from("employees").select("id, login_id, e_no, plant, name, role").eq("role","employee").order("name");
      setEmployees(emps || []);

      if (mod) {
        const { data: comps } = await supabase.from("completions").select("*").eq("module_id", mod.id);
        setCompletions(comps || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSaveModule = async () => {
    if (!moduleRow) return;
    setSaving(true); setSaveMsg("");
    const { error } = await supabase.from("training_modules").update({
      video_url: videoUrlInput,
      window_open: windowOpenInput,
      window_close: windowCloseInput ? new Date(windowCloseInput).toISOString() : null,
    }).eq("id", moduleRow.id);
    setSaving(false);
    setSaveMsg(error ? "⚠ Something went wrong saving." : "✓ Saved! Changes are live immediately for employees.");
  };

  if (loading) return <LoadingScreen text="Loading dashboard…"/>;

  const completedIds = new Set(completions.map(c=>c.employee_id));
  const completed = employees.filter(e=>completedIds.has(e.id));
  const pending = employees.filter(e=>!completedIds.has(e.id));
  const avgScore = completions.length ? Math.round(completions.reduce((s,c)=>s+c.score,0)/completions.length*10) : 0;

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
            <div style={{fontSize:"13px",color:"var(--muted)"}}>{moduleRow?.title || "No active module"} {moduleRow ? `· Closes ${formatDeadline(moduleRow.window_close)}` : ""}</div>
          </div>
          <div className="admin-stats">
            <div className="stat-card"><div className="stat-num">{employees.length}</div><div className="stat-label">Total Employees</div></div>
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
              <thead><tr><th>Employee</th><th>Plant</th><th>Status</th><th>Score</th><th>Language</th><th>Completed At</th></tr></thead>
              <tbody>
                {employees.map(emp=>{
                  const c = completions.find(c=>c.employee_id===emp.id);
                  const lang = LANGUAGES.find(l=>l.code===c?.language);
                  return (
                    <tr key={emp.id}>
                      <td><strong>{emp.name}</strong><br/><span style={{fontSize:"11px",color:"var(--muted)"}}>{emp.e_no}</span></td>
                      <td>{emp.plant}</td>
                      <td>{c?<span className="badge badge-green">✓ Done</span>:<span className="badge badge-red">Pending</span>}</td>
                      <td>{c?`${c.score}/10`:"—"}</td>
                      <td>{c?`${lang?.flag||""} ${lang?.label||c.language}`:"—"}</td>
                      <td style={{fontSize:"12px",color:"var(--muted)"}}>{c?.completed_at?new Date(c.completed_at).toLocaleString("en-SG",{dateStyle:"medium",timeStyle:"short"}):"—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{background:"#fff",borderRadius:"18px",padding:"26px",border:"1px solid var(--border)"}}>
            <div style={{fontWeight:700,fontSize:"15px",marginBottom:"6px"}}>📤 Manage This Month's Training</div>
            <div style={{fontSize:"12px",color:"var(--muted)",marginBottom:"18px"}}>Update the video link or open/close the training window. Changes apply instantly — no redeploy needed.</div>

            {saveMsg && <div className={saveMsg.startsWith("✓")?"success-box":"error-box"}>{saveMsg}</div>}

            <label className="form-label-light">Training Video URL (YouTube embed link)</label>
            <input className="form-input-light" placeholder="https://www.youtube.com/embed/VIDEO_ID" value={videoUrlInput} onChange={e=>setVideoUrlInput(e.target.value)}/>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"18px"}}>
              <div>
                <label className="form-label-light">Window Closes</label>
                <input type="datetime-local" className="form-input-light" value={windowCloseInput} onChange={e=>setWindowCloseInput(e.target.value)}/>
              </div>
              <div style={{display:"flex",alignItems:"flex-end",paddingBottom:"16px"}}>
                <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",fontWeight:500,color:"var(--ink)",cursor:"pointer"}}>
                  <input type="checkbox" checked={windowOpenInput} onChange={e=>setWindowOpenInput(e.target.checked)} style={{width:"16px",height:"16px",accentColor:"var(--blue)"}}/>
                  Training window is open
                </label>
              </div>
            </div>
            <button className="btn-primary" style={{maxWidth:"200px"}} disabled={saving} onClick={handleSaveModule}>{saving?"Saving…":"Save Changes →"}</button>
            <div style={{marginTop:"16px",fontSize:"12px",color:"var(--muted)"}}>
              ℹ️ To change quiz questions, contact your developer for now — a self-serve question editor is planned for a future update.
            </div>
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
  const [moduleData, setModuleData] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [appLoading, setAppLoading] = useState(false);

  const handleLogin = async (employee) => {
    setUser(employee);
    setAppLoading(true);

    if (employee.role === "admin") {
      setScreen("admin");
      setAppLoading(false);
      return;
    }

    const mod = await fetchActiveModule();
    if (!mod) {
      setModuleData(null);
      setScreen("locked");
      setAppLoading(false);
      return;
    }
    setModuleData(mod);

    const existing = await checkExistingCompletion(employee.id, mod.id);
    if (existing) {
      setCompletion(existing);
      setScreen("done");
      setAppLoading(false);
      return;
    }

    setScreen("language");
    setAppLoading(false);
  };

  const handleLogout = () => {
    setUser(null); setScreen("login"); setLanguage(null); setModuleData(null); setCompletion(null);
  };

  if (appLoading) return <LoadingScreen text="Checking your training status…"/>;
  if (screen==="login") return <LoginScreen onLogin={handleLogin}/>;
  if (screen==="locked") return <LockedScreen user={user} onLogout={handleLogout}/>;
  if (screen==="admin") return <AdminPanel user={user} onBack={handleLogout}/>;
  if (screen==="done") return <AlreadyDoneScreen user={user} completion={completion} moduleData={moduleData} onLogout={handleLogout}/>;
  if (screen==="language") return <LanguageScreen user={user} onSelect={l=>{setLanguage(l);setScreen("video");}}/>;
  if (screen==="video") return <VideoScreen user={user} language={language} moduleData={moduleData} onComplete={()=>setScreen("quiz")}/>;
  if (screen==="quiz") return <QuizScreen user={user} language={language} moduleData={moduleData} onComplete={s=>{setQuizScore(s);setScreen("ack");}}/>;
  if (screen==="ack") return <AcknowledgementScreen user={user} score={quizScore} language={language} moduleData={moduleData} onDone={()=>setScreen("done")}/>;
  return null;
}
