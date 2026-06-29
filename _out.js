const { useState, useEffect } = React;
const MONTHS = ["Janeiro", "Fevereiro", "Mar\xE7o", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const SK = {
  members: "sk_members",
  referrals: "sk_referrals",
  nextId: "sk_nextId",
  credentials: "sk_credentials",
  passReqs: "sk_passReqs",
  seekJrs: "sk_seekjrs",
  jrReferrals: "sk_jr_referrals",
  nextJrId: "sk_nextJrId",
  levelNotifs: "sk_lvnotifs",
  offers: "sk_offers"
};
const db = window.supabase.createClient(
  "https://upgefuunepjtvppybmki.supabase.co",
  "sb_publishable_pOWmpcmw6vqEvYIJyWOjcQ_qtW7AITg"
);
const mMember = (r) => ({ id: r.id, name: r.name, whatsapp: r.whatsapp, pixKey: r.pix_key, notes: r.notes, admId: r.adm_id ? String(r.adm_id) : null });
const mRef = (r) => ({ id: r.id, memberId: String(r.member_id), clientName: r.client_name, whatsapp: r.whatsapp, productType: r.product_type || "auto", productValue: Number(r.product_value || 0), commission: Number(r.commission || 0), year: r.year, month: r.month, day: r.day, paid: r.paid, isNew: r.is_new, status: r.status || (r.paid ? "pago" : Number(r.product_value || 0) > 0 ? "a_pagar" : "aguardando"), observacoes: r.observacoes || null, paidAt: r.paid_at || null, createdAt: r.created_at || null });
const mJrRef = (r) => ({ id: r.id, jrId: String(r.jr_id), clientName: r.client_name, whatsapp: r.whatsapp, productType: r.product_type || "auto", productValue: Number(r.product_value || 0), commission: Number(r.commission || 0), year: r.year, month: r.month, day: r.day, paid: r.paid, isNew: r.is_new, status: r.status || (r.paid ? "pago" : Number(r.product_value || 0) > 0 ? "a_pagar" : "aguardando"), observacoes: r.observacoes || null, paidAt: r.paid_at || null, createdAt: r.created_at || null });
const mSeekJr = (r) => ({ id: r.id, name: r.name, whatsapp: r.whatsapp, seekId: String(r.seek_id), pin: r.pin, isNew: r.is_new, pixKey: r.pix_key || null });
const mPassReq = (r) => ({ id: r.id, phone: r.phone, type: r.type, resolved: r.resolved });
const mNotif = (r) => ({ id: r.id, memberId: String(r.member_id), levelId: r.level_id, dismissed: r.dismissed });
const mOffer = (r) => ({ id: r.id, url: r.url, caption: r.caption, category: r.category || "zero-km" });
const mAdm = (r) => ({ id: r.id, name: r.name, whatsapp: r.whatsapp, pixKey: r.pix_key, notes: r.notes });
const mSpin = (r) => ({ id: r.id, seekId: r.seek_id ? String(r.seek_id) : null, jrId: r.jr_id ? String(r.jr_id) : null, referralId: r.referral_id ? String(r.referral_id) : null, value: Number(r.value), paid: r.paid || false, createdAt: r.created_at });
const mSpinPending = (r) => ({ id: r.id, seekId: r.seek_id ? String(r.seek_id) : null, jrId: r.jr_id ? String(r.jr_id) : null, referralId: r.referral_id ? String(r.referral_id) : null, createdAt: r.created_at });
const SPIN_PRIZES = [
  { label: "R$ 5", value: 5, color: "#E63333", prob: 0.4, span: 60 },
  { label: "R$ 10", value: 10, color: "#FF7700", prob: 0.25, span: 60 },
  { label: "R$ 15", value: 15, color: "#DDAA00", prob: 0.15, span: 60 },
  { label: "R$ 20", value: 20, color: "#22AA44", prob: 0.1, span: 60 },
  { label: "R$ 50", value: 50, color: "#2277EE", prob: 0.07, span: 60 },
  { label: "R$100", value: 100, color: "#8833BB", prob: 0.03, span: 60 }
];
(() => {
  let c = 0;
  SPIN_PRIZES.forEach((p) => {
    p.start = c;
    c += p.span;
  });
})();
function buildCreds(rows) {
  const o = {};
  (rows || []).forEach((r) => {
    o[r.key] = { login: r.login, pin: r.pin };
  });
  return o;
}
const PRODUCT_TYPES = [
  { id: "auto", name: "Autom\xF3veis Zero KM", rate: 1e-3, icon: "\u{1F697}" },
  { id: "semi", name: "Autom\xF3veis Semi Novos", rate: 12e-4, icon: "\u{1F698}" },
  { id: "cons", name: "Cons\xF3rcios", rate: 2e-3, icon: "\u{1F91D}" },
  { id: "corp", name: "Empresariais", rate: 12e-4, icon: "\u{1F3E2}" }
];
const ADM_RATES = { auto: 5e-3, semi: 7e-3, cons: 0.01, corp: 5e-3 };
function admComm(refs) {
  return refs.reduce((s, r) => s + (r.productValue || 0) * (ADM_RATES[r.productType] || 5e-3), 0);
}
const SEEK_LEVELS = [
  { id: "start", name: "Seek Start", min: 0, max: 9, bonus: 0, cssClass: "level-bronze", progressClass: "progress-bronze", color: "#CD7F32" },
  { id: "one", name: "Seek One", min: 10, max: 19, bonus: 0.05, cssClass: "level-silver", progressClass: "progress-silver", color: "#A8A8A8" },
  { id: "plus", name: "Seek Plus", min: 20, max: 49, bonus: 0.1, cssClass: "level-gold", progressClass: "progress-gold", color: "#FFD700" },
  { id: "pro", name: "Seek Pro", min: 50, max: 99, bonus: 0.15, cssClass: "level-diamond", progressClass: "progress-diamond", color: "#4FC3F7" },
  { id: "elite", name: "Seek Elite", min: 100, max: Infinity, bonus: 0.2, cssClass: "level-emerald", progressClass: "progress-emerald", color: "#50C878" }
];
const JR_LEVELS = [
  { id: "jr1", name: "JR 1", min: 0, max: 5e5, bonus: 0.05 },
  { id: "jr2", name: "JR 2", min: 5e5, max: 1e6, bonus: 0.07 },
  { id: "jr3", name: "JR 3", min: 1e6, max: 15e5, bonus: 0.1 },
  { id: "jr4", name: "JR 4", min: 15e5, max: Infinity, bonus: 0.12 }
];
const JR_GRADUATION = 2e6;
const ADM_PHONE = "51996509660";
const ADM_PIN = "0000";
function sg(k) {
  try {
    const r = localStorage.getItem(k);
    return r ? JSON.parse(r) : null;
  } catch (e) {
    return null;
  }
}
function sd(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
  }
}
function sameId(a, b) {
  if (a === void 0 || a === null || b === void 0 || b === null) return false;
  return String(a) === String(b);
}
function cleanupLegacyStorageKeys() {
  const legacyKeys = ["sk_m", "sk_c", "sk_creds", "sk_r", "sk_n", "sk_jr", "sk_jrs", "sk_reqs", "sk_pass_requests"];
  let removed = [];
  legacyKeys.forEach((k) => {
    if (localStorage.getItem(k) !== null) {
      localStorage.removeItem(k);
      removed.push(k);
    }
  });
  if (removed.length) {
    console.log("[SEEK cleanup] removed obsolete legacy keys (data was NOT merged back, by design):", removed);
  }
}
const fBRL = (v) => Number.isFinite(v) ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00";
const fCD = (n) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function fDate(r) {
  if (r.day) return `${String(r.day).padStart(2, "0")}/${String(r.month).padStart(2, "0")}/${r.year}`;
  return `${MONTHS[(r.month || 1) - 1].slice(0, 3)}/${r.year}`;
}
function todayISO() {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function maskPhone(raw) {
  const d = (raw || "").replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)})${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)})${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)})${d.slice(2, 7)}-${d.slice(7)}`;
}
function calcPoints(total) {
  return Math.floor(total / 1e5);
}
function getSeekLevel(pts) {
  return SEEK_LEVELS.find((l) => pts >= l.min && pts <= l.max) || SEEK_LEVELS[0];
}
function getJrLevel(vol) {
  return JR_LEVELS.find((l) => vol >= l.min && vol < l.max) || JR_LEVELS[0];
}
function levelProgress(pts) {
  const lv = getSeekLevel(pts);
  if (lv.id === "elite") return 100;
  return Math.min(100, Math.round((pts - lv.min) / (lv.max - lv.min + 1) * 100));
}
function calcCommission(val, prodId, level) {
  const pt = PRODUCT_TYPES.find((p) => p.id === prodId) || PRODUCT_TYPES[0];
  return val * pt.rate * (1 + level.bonus);
}
const Ic = ({ d, s = 20, c = "currentColor", ...p }) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, d);
const IcGrid = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" })) });
const IcUsers = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }), /* @__PURE__ */ React.createElement("circle", { cx: "9", cy: "7", r: "4" }), /* @__PURE__ */ React.createElement("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }), /* @__PURE__ */ React.createElement("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })) });
const IcBook = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20" }), /* @__PURE__ */ React.createElement("path", { d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" })) });
const IcOut = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }), /* @__PURE__ */ React.createElement("polyline", { points: "16 17 21 12 16 7" }), /* @__PURE__ */ React.createElement("line", { x1: "21", y1: "12", x2: "9", y2: "12" })) });
const IcPlus = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "5", x2: "12", y2: "19" }), /* @__PURE__ */ React.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" })) });
const IcLeft = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement("polyline", { points: "15 18 9 12 15 6" }) });
const IcX = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })) });
const IcTrash = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M3 6h18" }), /* @__PURE__ */ React.createElement("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }), /* @__PURE__ */ React.createElement("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })) });
const IcCheck = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement("polyline", { points: "20 6 9 17 4 12" }) });
const IcClock = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("polyline", { points: "12 6 12 12 16 14" })) });
const IcEdit = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }), /* @__PURE__ */ React.createElement("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })) });
const IcStar = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement("polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" }) });
const IcEye = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3" })) });
const IcEyeOff = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" }), /* @__PURE__ */ React.createElement("line", { x1: "1", y1: "1", x2: "23", y2: "23" })) });
const IcKey = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "7.5", cy: "15.5", r: "5.5" }), /* @__PURE__ */ React.createElement("path", { d: "M21 2l-9.6 9.6" }), /* @__PURE__ */ React.createElement("path", { d: "M15.5 7.5l3 3L22 7l-3-3" })) });
const IcSrch = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /* @__PURE__ */ React.createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })) });
const IcPhone = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement("path", { d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" }) });
const IcShare = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "18", cy: "5", r: "3" }), /* @__PURE__ */ React.createElement("circle", { cx: "6", cy: "12", r: "3" }), /* @__PURE__ */ React.createElement("circle", { cx: "18", cy: "19", r: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "8.59", y1: "13.51", x2: "15.42", y2: "17.49" }), /* @__PURE__ */ React.createElement("line", { x1: "15.41", y1: "6.51", x2: "8.59", y2: "10.49" })) });
const IcBell = (p) => /* @__PURE__ */ React.createElement(Ic, { ...p, d: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }), /* @__PURE__ */ React.createElement("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" })) });
const IcWA = ({ s = 20, fill = "currentColor", ...p }) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill, ...p }, /* @__PURE__ */ React.createElement("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" }));
function SeekNetworkLogo() {
  return /* @__PURE__ */ React.createElement("img", { src: "logo-completo.png", alt: "SEEK NETWORK", style: { width: "100%", maxWidth: 400, display: "block", margin: "0 auto", mixBlendMode: "multiply" } });
}
function SeekNetworkMark() {
  return /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 900, fontSize: "0.85rem", color: "#111111", textShadow: "0 0 4px rgba(255,255,255,0.9),1px 1px 3px rgba(255,255,255,0.8),-1px -1px 3px rgba(255,255,255,0.8)", letterSpacing: "0.03em", textAlign: "center", whiteSpace: "nowrap" } }, "SEEK NETWORK");
}
function SMedal({ levelId, size = 52, lit }) {
  const cols = {
    start: { bg: "linear-gradient(135deg,#E08030,#CD7F32,#B8692A)", border: "#A0522D", glow: "rgba(160,100,20,0.6)", inset: "rgba(255,200,80,0.3)" },
    one: { bg: "linear-gradient(135deg,#D8D8D8,#C0C0C0,#A8A8A8)", border: "#A8A8A8", glow: "rgba(120,120,120,0.4)", inset: "rgba(255,255,255,0.65)" },
    plus: { bg: "linear-gradient(135deg,#FFE44D,#FFD700,#DAA520)", border: "#DAA520", glow: "rgba(200,160,0,0.55)", inset: "rgba(255,255,150,0.45)" },
    pro: { bg: "linear-gradient(135deg,#B9F2FF,#E0F7FF,#B9F2FF)", border: "#89CFF0", glow: "rgba(100,180,220,0.4)", inset: "rgba(200,240,255,0.6)" },
    elite: { bg: "linear-gradient(135deg,#6FD89A,#50C878,#3DAD63)", border: "#2E8B57", glow: "rgba(30,120,60,0.5)", inset: "rgba(150,255,180,0.4)" }
  };
  const col = cols[levelId] || cols.start;
  if (!lit) {
    return /* @__PURE__ */ React.createElement("div", { style: { width: size, height: size, borderRadius: "50%", background: "#2A2A2A", boxShadow: "1px 2px 6px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("img", { src: "icone-app.png", style: { width: "98%", height: "98%", objectFit: "contain", filter: "brightness(0) invert(1)", opacity: 0.25 }, alt: "" }));
  }
  return /* @__PURE__ */ React.createElement("div", { style: { width: size, height: size, borderRadius: "50%", background: col.bg, boxShadow: `2px 3px 12px ${col.glow},0 0 0 2px ${col.border},inset 0 0 ${Math.round(size * 0.4)}px ${col.inset}`, display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("img", { src: "icone-app.png", style: { width: "98%", height: "98%", objectFit: "contain", filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.4))" }, alt: "" }));
}
function LevelUpModal({ level, onClose }) {
  const msgs = {
    one: "Voc\xEA alcan\xE7ou o Seek One! Sua dedica\xE7\xE3o est\xE1 rendendo frutos reais. Continue firme, o melhor est\xE1 por vir!",
    plus: "Seek Plus conquistado! Voc\xEA est\xE1 entre os melhores indicadores. Seu esfor\xE7o e consist\xEAncia s\xE3o inspiradores!",
    pro: "Seek Pro! Poucos chegam at\xE9 aqui. Voc\xEA \xE9 uma refer\xEAncia de excel\xEAncia \u2014 continue voando alto!",
    elite: "SEEK ELITE! O topo do sistema. Voc\xEA se tornou lend\xE1rio. Orgulho total \u2014 voc\xEA redefiniu o que \xE9 poss\xEDvel!"
  };
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(10,10,10,0.7)", backdropFilter: "blur(12px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn .35s ease" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--bg)", borderRadius: 32, boxShadow: "0 0 80px rgba(0,0,0,0.35)", padding: "40px 28px", maxWidth: 340, width: "100%", textAlign: "center", animation: "slideUp .4s cubic-bezier(.32,.72,0,1)" } }, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16, display: "flex", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(SMedal, { levelId: level.id, size: 110, lit: true })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 } }, "\u{1F389} Novo N\xEDvel Alcan\xE7ado!"), /* @__PURE__ */ React.createElement("span", { className: `level-badge ${level.cssClass}`, style: { fontSize: "1rem", padding: "10px 24px", display: "inline-flex", marginBottom: 18 } }, level.name), /* @__PURE__ */ React.createElement("p", { style: { fontSize: ".9rem", color: "var(--black)", fontWeight: 600, lineHeight: 1.75, marginBottom: 18, marginTop: 14 } }, msgs[level.id] || "Parab\xE9ns pelo novo n\xEDvel!"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".8rem", color: "var(--muted)", fontWeight: 700, marginBottom: 24, padding: "10px 14px", borderRadius: 14, background: "var(--bg)", boxShadow: "var(--nm-in)" } }, "B\xF4nus de comiss\xE3o: ", /* @__PURE__ */ React.createElement("span", { style: { color: level.color, fontWeight: 900 } }, "+", (level.bonus * 100).toFixed(0), "%")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark btn-full", style: { padding: 14, fontSize: ".88rem" }, onClick: onClose }, "Continuar \u{1F680}")));
}
function Spinner() {
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" } }, /* @__PURE__ */ React.createElement("svg", { width: "32", height: "32", viewBox: "0 0 24 24", fill: "none", stroke: "var(--muted)", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { animation: "spin 1s linear infinite" } }, /* @__PURE__ */ React.createElement("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" })), /* @__PURE__ */ React.createElement("style", null, "@keyframes spin{to{transform:rotate(360deg)}}"));
}
function Div() {
  return /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "linear-gradient(90deg,transparent,var(--gray),transparent)", margin: "2px 0" } });
}
function Empty({ text }) {
  return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "36px 20px", color: "var(--muted)", fontSize: ".85rem", fontWeight: 500 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "2rem", marginBottom: 10, opacity: 0.3 } }, "\u25CC"), text);
}
function Fld({ label, children }) {
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "label" }, label), children);
}
function PhoneInput({ value, onChange, autoFocus }) {
  function h(e) {
    onChange(e.target.value.replace(/\D/g, "").slice(0, 11));
  }
  return /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement("input", { className: "inp", type: "tel", inputMode: "numeric", value: maskPhone(value || ""), onChange: h, placeholder: "(DD)9XXXX-XXXX", autoFocus, style: { paddingRight: 44 } }), /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", color: "#25D366", pointerEvents: "none", display: "flex", alignItems: "center" } }, /* @__PURE__ */ React.createElement(IcWA, { s: 19, fill: "#25D366" })));
}
function PlainPhoneInput({ value, onChange, autoFocus }) {
  function h(e) {
    onChange(e.target.value.replace(/\D/g, "").slice(0, 11));
  }
  return /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement("input", { className: "inp", type: "tel", inputMode: "numeric", value: value || "", onChange: h, placeholder: "SOMENTE N\xDAMEROS", autoFocus, style: { paddingRight: 44 } }), /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", color: "#25D366", pointerEvents: "none", display: "flex", alignItems: "center" } }, /* @__PURE__ */ React.createElement(IcWA, { s: 19, fill: "#25D366" })));
}
function PinInput({ value, onChange, autoFocus }) {
  const [show, setShow] = useState(false);
  return /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement("input", { className: "inp", type: show ? "text" : "password", inputMode: "numeric", maxLength: 4, value, onChange: (e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4)), placeholder: "\u2022\u2022\u2022\u2022", autoFocus, style: { textAlign: "center", fontSize: "1.4rem", letterSpacing: ".5em", fontWeight: 800 } }), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setShow(!show), style: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)" } }, show ? /* @__PURE__ */ React.createElement(IcEyeOff, { s: 17 }) : /* @__PURE__ */ React.createElement(IcEye, { s: 17 })));
}
function CurrencyInput({ value, onChange, disabled }) {
  const [disp, setDisp] = useState(value ? fCD(value) : "");
  function h(e) {
    const d = e.target.value.replace(/\D/g, "");
    if (!d) {
      setDisp("");
      onChange(0);
      return;
    }
    const n = parseInt(d, 10) / 100;
    setDisp(fCD(n));
    onChange(n);
  }
  return /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: ".85rem", fontWeight: 600, pointerEvents: "none" } }, "R$"), /* @__PURE__ */ React.createElement("input", { className: "inp", style: { paddingLeft: 40 }, type: "text", inputMode: "numeric", value: disp, onChange: h, placeholder: "0,00", disabled }));
}
function ProductSelect({ value, onChange }) {
  return /* @__PURE__ */ React.createElement("div", { className: "product-select-grid" }, PRODUCT_TYPES.map((p) => /* @__PURE__ */ React.createElement("button", { key: p.id, type: "button", className: `product-card${value === p.id ? " selected" : ""}`, onClick: () => onChange(p.id) }, /* @__PURE__ */ React.createElement("div", { className: "product-card-icon" }, p.icon), /* @__PURE__ */ React.createElement("div", { className: "product-card-name" }, p.name), /* @__PURE__ */ React.createElement("div", { className: "product-card-rate" }, Number((p.rate * 100).toFixed(2)).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }), "%"))));
}
function LevelBadge({ points, small }) {
  const lv = getSeekLevel(points);
  return /* @__PURE__ */ React.createElement("span", { className: `level-badge ${lv.cssClass}`, style: small ? { fontSize: ".6rem", padding: "3px 9px" } : {} }, lv.name);
}
function ProgressBar({ pct, className, label, sub }) {
  return /* @__PURE__ */ React.createElement("div", null, (label || sub) && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: ".68rem", fontWeight: 700, color: "var(--muted)" } }, /* @__PURE__ */ React.createElement("span", null, label), /* @__PURE__ */ React.createElement("span", { style: { color: "var(--black)", fontWeight: 800 } }, sub || `${Math.round(pct)}%`)), /* @__PURE__ */ React.createElement("div", { className: "progress-bar-wrap" }, /* @__PURE__ */ React.createElement("div", { className: `progress-bar-fill ${className}`, style: { width: `${Math.min(100, pct)}%` } })));
}
function MedalsShowcase({ points }) {
  const curIdx = SEEK_LEVELS.findIndex((l) => l.id === getSeekLevel(points).id);
  return /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "20px 18px" } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 16, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement(IcStar, { s: 14 }), "Minhas Conquistas"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 } }, SEEK_LEVELS.map((lv, i) => {
    const lit = i <= curIdx;
    return /* @__PURE__ */ React.createElement("div", { key: lv.id, style: { textAlign: "center", transition: "opacity .6s" } }, /* @__PURE__ */ React.createElement(SMedal, { levelId: lv.id, size: 50, lit }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".54rem", fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", marginTop: 6, color: lit ? "var(--black)" : "var(--muted)" } }, lv.name.replace("Seek ", "")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".5rem", color: "var(--muted)", marginTop: 1 } }, lv.max === Infinity ? `${lv.min}+` : `${lv.min}-${lv.max}`, " pts"), lit && lv.bonus > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".5rem", fontWeight: 800, color: lv.color, marginTop: 2 } }, "+", (lv.bonus * 100).toFixed(0), "%"));
  })));
}
function Sheet({ title, onClose, children }) {
  return /* @__PURE__ */ React.createElement("div", { className: "overlay", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "sheet", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "handle" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800, fontSize: ".95rem" } }, title), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(IcX, { s: 17, c: "var(--muted)" }))), children));
}
function Confirm({ title, msg, onCancel, onOk }) {
  return /* @__PURE__ */ React.createElement(Sheet, { title, onClose: onCancel }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: ".88rem", color: "var(--muted)", fontWeight: 500, lineHeight: 1.6, marginBottom: 24 } }, msg), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", onClick: onCancel }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", style: { color: "var(--red)" }, onClick: onOk }, "Excluir")));
}
function TopBar({ title, left, right, logo }) {
  return /* @__PURE__ */ React.createElement("div", { className: "top-bar", style: { maxWidth: 640, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 44 } }, left), logo ? /* @__PURE__ */ React.createElement(SeekNetworkMark, null) : /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800, fontSize: ".92rem", letterSpacing: ".04em" } }, title), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 44, display: "flex", justifyContent: "flex-end" } }, right));
}
function StatCard({ label, value, color }) {
  return /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "16px" } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 7 } }, label), /* @__PURE__ */ React.createElement("div", { className: "stat-n", style: { color: color || "var(--black)" } }, value));
}
function LoginScreen({ onLogin, credentials, members, seekJrs }) {
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [solicitarSenha, setSolicitarSenha] = useState(false);
  const [solPhone, setSolPhone] = useState("");
  const [solErr, setSolErr] = useState("");
  const [solOk, setSolOk] = useState(false);
  function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    const digits = phone.replace(/\D/g, "");
    const pin = pass.trim();
    console.log(`[SEEK login] attempt \u2014 phoneDigits="${digits}" pinLength=${pin.length}`);
    if (!digits || !pin) {
      setErr("Preencha telefone e senha.");
      console.log("[SEEK login] aborted: empty phone or pin");
      return;
    }
    if (digits === ADM_PHONE && pin === ADM_PIN) {
      console.log("[SEEK login] matched MASTER");
      onLogin({ role: "master" });
      return;
    }
    for (const [k, c] of Object.entries(credentials)) {
      if (!String(k).startsWith("adm_")) continue;
      const stored = (c.login || "").replace(/\D/g, "");
      if (stored === digits && c.pin === pin) {
        const admId = k.replace("adm_", "");
        onLogin({ role: "adm", admId });
        return;
      }
    }
    for (const [k, c] of Object.entries(credentials)) {
      if (String(k).startsWith("jr_") || String(k).startsWith("adm_")) continue;
      const stored = (c.login || "").replace(/\D/g, "");
      if (stored === digits && c.pin === pin) {
        onLogin({ role: "member", memberId: k });
        return;
      }
    }
    for (const mb of members) {
      const wa = (mb.whatsapp || "").replace(/\D/g, "");
      if (wa !== digits) continue;
      const cred = credentials[String(mb.id)] || { pin: "0000" };
      if (cred.pin === pin) {
        onLogin({ role: "member", memberId: String(mb.id) });
        return;
      }
    }
    for (const [k, c] of Object.entries(credentials)) {
      if (!String(k).startsWith("jr_")) continue;
      const stored = (c.login || "").replace(/\D/g, "");
      if (stored === digits && c.pin === pin) {
        const jrId = k.replace("jr_", "");
        onLogin({ role: "jr", jrId });
        return;
      }
    }
    for (const jr of seekJrs) {
      const wa = (jr.whatsapp || "").replace(/\D/g, "");
      if (wa !== digits) continue;
      const cred = credentials[`jr_${jr.id}`] || { pin: "0000" };
      if (cred.pin === pin) {
        onLogin({ role: "jr", jrId: jr.id });
        return;
      }
    }
    setErr("Telefone ou senha incorretos.");
  }
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 22px" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 } }, /* @__PURE__ */ React.createElement(SeekNetworkLogo, null), /* @__PURE__ */ React.createElement("div", { style: { width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 26 } }, /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, style: { width: "100%", display: "flex", flexDirection: "column", gap: 13 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "login-inp",
      type: "tel",
      inputMode: "numeric",
      value: phone,
      onChange: (e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11)),
      placeholder: "TELEFONE (SOMENTE N\xDAMEROS)",
      autoFocus: true
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "login-inp",
      type: showPass ? "text" : "password",
      value: pass,
      onChange: (e) => setPass(e.target.value.replace(/\D/g, "").slice(0, 4)),
      placeholder: "SENHA (4 D\xCDGITOS)",
      inputMode: "numeric",
      maxLength: 4,
      style: { paddingRight: 52 }
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowPass(!showPass),
      style: {
        position: "absolute",
        right: 18,
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "var(--muted)"
      }
    },
    showPass ? /* @__PURE__ */ React.createElement(IcEyeOff, { s: 17 }) : /* @__PURE__ */ React.createElement(IcEye, { s: 17 })
  )), err && /* @__PURE__ */ React.createElement("p", { style: { textAlign: "center", fontSize: ".76rem", fontWeight: 700, color: "var(--red)", padding: "4px 8px", borderRadius: 10, background: "rgba(192,57,43,0.07)" } }, err), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      className: "btn btn-dark btn-full",
      style: { padding: 16, fontSize: ".84rem", letterSpacing: ".1em", borderRadius: 50, marginTop: 4 }
    },
    "Entrar"
  )), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setSolicitarSenha(true);
    setSolPhone("");
    setSolErr("");
    setSolOk(false);
  }, style: { background: "none", border: "none", cursor: "pointer", fontSize: ".78rem", fontWeight: 700, color: "var(--muted)", fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: 3 } }, "Esqueceu sua senha?")))), solicitarSenha && /* @__PURE__ */ React.createElement("div", { className: "overlay", onClick: () => setSolicitarSenha(false) }, /* @__PURE__ */ React.createElement("div", { className: "sheet", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "handle" }), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 900, fontSize: "1rem", marginBottom: 16 } }, "\u{1F510} Solicitar Nova Senha"), solOk ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "24px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "2rem", marginBottom: 12 } }, "\u2705"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".9rem", marginBottom: 8 } }, "Solicita\xE7\xE3o enviada!"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".8rem", color: "var(--muted)", marginBottom: 20 } }, "O administrador foi notificado e vai liberar seu novo acesso em breve."), /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark btn-full", onClick: () => setSolicitarSenha(false) }, "Fechar")) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: ".84rem", color: "var(--muted)", lineHeight: 1.6 } }, "Digite seu telefone cadastrado (somente n\xFAmeros). O administrador receber\xE1 a solicita\xE7\xE3o e liberar\xE1 seu novo acesso."), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "inp",
      type: "tel",
      inputMode: "numeric",
      value: solPhone,
      onChange: (e) => setSolPhone(e.target.value.replace(/\D/g, "").slice(0, 11)),
      placeholder: "TELEFONE (SOMENTE N\xDAMEROS)",
      autoFocus: true
    }
  ), solErr && /* @__PURE__ */ React.createElement("div", { style: { color: "var(--red)", fontSize: ".76rem", fontWeight: 700 } }, solErr), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", onClick: () => setSolicitarSenha(false) }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark btn-full", onClick: () => {
    const d = solPhone.replace(/\D/g, "");
    if (!d) {
      setSolErr("Digite seu telefone.");
      return;
    }
    db.from("pass_requests").insert({ phone: d, type: "forgot", resolved: false }).then(({ error }) => {
      if (error) {
        setSolErr("Erro ao enviar. Tente novamente.");
      } else {
        setSolOk(true);
      }
    });
  } }, "Solicitar"))))));
}
function FirstLoginScreen({ userName, onSave, onLogout }) {
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  function submit(e) {
    e.preventDefault();
    setErr("");
    if (!/^\d{4}$/.test(pin1)) {
      setErr("A nova senha deve ter exatamente 4 d\xEDgitos num\xE9ricos.");
      return;
    }
    if (pin1 !== pin2) {
      setErr("As senhas n\xE3o coincidem. Digite novamente.");
      return;
    }
    if (pin1 === "0000") {
      setErr("Escolha uma senha diferente de 0000.");
      return;
    }
    onSave(pin1);
    setSaved(true);
  }
  if (saved) {
    return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "3rem" } }, "\u2705"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: "1.1rem" } }, "Senha alterada com sucesso!"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".84rem", color: "var(--muted)", fontWeight: 600 } }, "Entrando no painel...")));
  }
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 22px" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 24 } }, /* @__PURE__ */ React.createElement(SeekNetworkLogo, null), /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "28px 22px" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 22 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "2rem", marginBottom: 10 } }, "\u{1F510}"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 900, fontSize: "1.05rem", marginBottom: 8 } }, "Primeiro acesso"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".83rem", color: "var(--muted)", lineHeight: 1.65 } }, "Ol\xE1", userName ? `, ${userName}` : "", ".", " ", "Por seguran\xE7a, voc\xEA precisa criar uma senha pessoal antes de continuar.", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("strong", null, "A senha deve ter 4 d\xEDgitos num\xE9ricos"), " e n\xE3o pode ser 0000.")), /* @__PURE__ */ React.createElement("form", { onSubmit: submit, style: { display: "flex", flexDirection: "column", gap: 14 } }, /* @__PURE__ */ React.createElement(Fld, { label: "Nova senha (4 d\xEDgitos)" }, /* @__PURE__ */ React.createElement(PinInput, { value: pin1, onChange: setPin1, autoFocus: true })), /* @__PURE__ */ React.createElement(Fld, { label: "Confirmar nova senha" }, /* @__PURE__ */ React.createElement(PinInput, { value: pin2, onChange: setPin2 })), err && /* @__PURE__ */ React.createElement("div", { style: { color: "var(--red)", fontSize: ".78rem", fontWeight: 700, textAlign: "center", padding: "8px 12px", borderRadius: 10, background: "rgba(192,57,43,0.07)" } }, err), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-dark btn-full", style: { padding: 15, marginTop: 4, fontSize: ".86rem", letterSpacing: ".06em" } }, "Salvar e Entrar"))), /* @__PURE__ */ React.createElement("button", { onClick: onLogout, style: { background: "none", border: "none", cursor: "pointer", fontSize: ".76rem", fontWeight: 700, color: "var(--muted)", fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: 3, textAlign: "center" } }, "Voltar ao login")));
}
const HELP_ITEMS = {
  adm: [
    { q: "Como recebo as indica\xE7\xF5es dos meus SEEKs?", a: "As indica\xE7\xF5es aparecem automaticamente no sino de notifica\xE7\xF5es. Clique no sino para ver, abra a indica\xE7\xE3o e preencha o produto e valor." },
    { q: "Como confirmo uma venda?", a: 'Abra a indica\xE7\xE3o nas notifica\xE7\xF5es, preencha os dados e clique no bot\xE3o verde "INDICADO".' },
    { q: "Quando devo marcar como pago?", a: 'Todo dia 10 do m\xEAs, acesse suas indica\xE7\xF5es e clique em "PAGAR" em cada venda do m\xEAs anterior.' },
    { q: "Como cadastro um novo SEEK?", a: 'V\xE1 na aba "SEEK", clique em "+ Novo" e preencha os dados. A senha inicial \xE9 sempre 0000.' },
    { q: "Como vejo o desempenho dos meus SEEKs?", a: "No painel principal voc\xEA v\xEA o ranking e os totais. Clique em cada SEEK para ver detalhes." }
  ],
  member: [
    { q: "Como fa\xE7o uma indica\xE7\xE3o?", a: 'Clique em "Indicar" ou "+ Nova Indica\xE7\xE3o", preencha o nome e WhatsApp do cliente e envie. O vendedor ser\xE1 notificado automaticamente.' },
    { q: "Quando recebo minha comiss\xE3o?", a: 'Ap\xF3s o vendedor confirmar a venda, o valor vai para "A Pagar". Todo dia 10 o vendedor realiza os pagamentos.' },
    { q: "O que \xE9 a Roleta da Sorte?", a: "A cada indica\xE7\xE3o confirmada como venda pelo vendedor, voc\xEA ganha uma chance de girar a roleta e ganhar um b\xF4nus em dinheiro. A roleta aparece no seu pr\xF3ximo login." },
    { q: "Como subo de n\xEDvel?", a: "Acumule pontos atrav\xE9s das suas vendas indicadas. 1 ponto = R$ 100.000 em vendas. Veja os n\xEDveis na tela de Regras." },
    { q: "Como compartilho meu cart\xE3o?", a: 'Clique em "Compartilhar Cart\xE3o" e envie a mensagem pelo WhatsApp para seus contatos.' }
  ],
  jr: [
    { q: "Como fa\xE7o uma indica\xE7\xE3o?", a: 'Clique em "Indicar", preencha o nome e WhatsApp do cliente. Seu SEEK padrinho e o vendedor ser\xE3o notificados.' },
    { q: "Quem \xE9 meu padrinho SEEK?", a: "O SEEK que te cadastrou no sistema. Voc\xEA pode ver o nome do seu padrinho no seu painel." },
    { q: "Quando recebo minha comiss\xE3o?", a: 'Ap\xF3s o vendedor confirmar a venda como conclu\xEDda, o valor entra em "A Pagar". Os pagamentos s\xE3o feitos todo dia 10.' },
    { q: "Como me torno um SEEK?", a: "Ao atingir R$ 2.000.000 em volume total de vendas acumuladas, voc\xEA \xE9 promovido automaticamente a SEEK." },
    { q: "O que \xE9 a Roleta da Sorte?", a: "A cada indica\xE7\xE3o confirmada como venda, voc\xEA ganha uma chance de girar a roleta e ganhar um b\xF4nus. Ela aparece no seu pr\xF3ximo login." }
  ]
};
function HelpModal({ role, onClose }) {
  const faqs = HELP_ITEMS[role] || [];
  const [open, setOpen] = useState(null);
  return /* @__PURE__ */ React.createElement("div", { className: "overlay", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "sheet", onClick: (e) => e.stopPropagation(), style: { maxHeight: "88vh" } }, /* @__PURE__ */ React.createElement("div", { className: "handle" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 900, fontSize: "1rem" } }, "\u2753 Ajuda"), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(IcX, { s: 17, c: "var(--muted)" }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10, maxHeight: "72vh", overflowY: "auto" } }, faqs.map((item, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "nm-in", style: { padding: "12px 14px", cursor: "pointer" }, onClick: () => setOpen(open === i ? null : i) }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".84rem", color: "var(--black)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 } }, /* @__PURE__ */ React.createElement("span", null, item.q), /* @__PURE__ */ React.createElement("span", { style: { color: "var(--muted)", flexShrink: 0, fontSize: ".8rem" } }, open === i ? "\u25B2" : "\u25BC")), open === i && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".78rem", color: "var(--muted)", lineHeight: 1.7, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--gray)" } }, item.a))))));
}
function RemuneracaoPanel({ isMaster, onBack, isAdm = false }) {
  return /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 640, margin: "0 auto" } }, /* @__PURE__ */ React.createElement(TopBar, { title: "Remunera\xE7\xE3o & Regras", left: onBack && /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onBack }, /* @__PURE__ */ React.createElement(IcLeft, { s: 18 })) }), /* @__PURE__ */ React.createElement("div", { className: "page", style: { paddingBottom: 110 } }, /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "20px 18px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".88rem", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 } }, "\u{1F3F7}\uFE0F Produtos & Comiss\xF5es"), PRODUCT_TYPES.map((p, i) => /* @__PURE__ */ React.createElement("div", { key: p.id, className: "rem-row" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "1.1rem" } }, p.icon), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, fontSize: ".84rem" } }, p.name)), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800, fontSize: ".84rem" } }, Number((p.rate * 100).toFixed(2)).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }), "% do valor"))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, fontSize: ".74rem", color: "var(--muted)", lineHeight: 1.6 } }, "* O b\xF4nus de n\xEDvel \xE9 aplicado sobre a comiss\xE3o base do produto.")), /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "20px 18px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".88rem", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 } }, "\u{1F3C6} Sistema de N\xEDveis SEEK"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".75rem", color: "var(--muted)", marginBottom: 14, lineHeight: 1.6 } }, "1 ponto a cada R$ 100.000,00 vendidos acumulados."), SEEK_LEVELS.map((lv, i) => /* @__PURE__ */ React.createElement("div", { key: lv.id, className: "rem-row" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement(SMedal, { levelId: lv.id, size: 34, lit: true }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".82rem" } }, lv.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)" } }, lv.max === Infinity ? `${lv.min}+ pts` : `${lv.min}\u2013${lv.max} pts`))), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800, fontSize: ".82rem", color: lv.color || "var(--black)" } }, lv.bonus === 0 ? "Sem b\xF4nus" : `+${(lv.bonus * 100).toFixed(0)}%`)))), /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "20px 18px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".88rem", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 } }, "\u2B50 Sistema SEEK JR"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".75rem", color: "var(--muted)", marginBottom: 14, lineHeight: 1.6 } }, "JR ganha a mesma comiss\xE3o de indica\xE7\xE3o. O SEEK recebe b\xF4nus extra sobre as comiss\xF5es do JR.", /* @__PURE__ */ React.createElement("br", null), "\u{1F4C5} Indica\xE7\xF5es do JR zeram todo dia 1\xB0 do m\xEAs. Barra de gradua\xE7\xE3o cont\xEDnua at\xE9 R$ 2M."), JR_LEVELS.map((lv) => /* @__PURE__ */ React.createElement("div", { key: lv.id, className: "rem-row" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".82rem" } }, lv.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)" } }, lv.max === Infinity ? `Acima de ${fBRL(lv.min)}` : `${fBRL(lv.min)} a ${fBRL(lv.max)}`)), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, color: "var(--green)" } }, (lv.bonus * 100).toFixed(0), "% b\xF4nus"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)" } }, "para o SEEK")))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, padding: "12px 14px", borderRadius: 14, background: "var(--bg)", boxShadow: "var(--nm-in)", fontSize: ".74rem", color: "var(--muted)", lineHeight: 1.7 } }, "\u{1F393} ", /* @__PURE__ */ React.createElement("strong", null, "Gradua\xE7\xE3o:"), " Ap\xF3s R$ 2.000.000,00 em vendas totais acumuladas, o SEEK JR vira SEEK.")), /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "20px 18px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".88rem", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 } }, "\u{1F3B0} Roleta da Sorte"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".75rem", color: "var(--muted)", marginBottom: 14, lineHeight: 1.7 } }, "A cada indica\xE7\xE3o cadastrada (status A Pagar), o SEEK ou SEEK JR que fez a indica\xE7\xE3o ganha automaticamente ", /* @__PURE__ */ React.createElement("strong", null, "1 chance de girar a Roleta da Sorte"), ".", /* @__PURE__ */ React.createElement("br", null), "A roleta aparece no pr\xF3ximo login do SEEK/SEEK JR, antes do painel principal. Se houver mais de uma chance acumulada, elas s\xE3o apresentadas uma por vez."), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".78rem", marginBottom: 8, color: "var(--black)" } }, isMaster ? "Premia\xE7\xE3o (resultado ponderado por software):" : "Pr\xEAmios dispon\xEDveis:"), SPIN_PRIZES.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.value, className: "rem-row", style: { padding: "8px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 16, height: 16, borderRadius: "50%", background: p.color, flexShrink: 0 } }), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: ".84rem" } }, p.label)), isMaster && /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800, fontSize: ".84rem", color: p.color } }, (p.prob * 100).toFixed(0), "% de chance"))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, padding: "10px 12px", borderRadius: 12, background: "var(--bg)", boxShadow: "var(--nm-in)", fontSize: ".73rem", color: "var(--muted)", lineHeight: 1.7 } }, isMaster ? "\u{1F4A1} A roleta possui 6 fatias iguais visualmente, mas a probabilidade de cada pr\xEAmio \xE9 controlada por software. O valor ganho \xE9 somado ao total a receber do SEEK/JR e aparece no extrato." : "\u{1F4A1} O valor ganho \xE9 somado ao total a receber e aparece no extrato. A cada venda confirmada pelo vendedor, voc\xEA ganha 1 chance de girar.")), isAdm && /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "20px 18px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".88rem", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 } }, "\u{1F4BC} Minha Comiss\xE3o de Vendedor"), [
    { id: "auto", name: "Autom\xF3veis Zero KM", pct: "0,5%" },
    { id: "semi", name: "Autom\xF3veis Semi Novos", pct: "0,7%" },
    { id: "cons", name: "Cons\xF3rcios", pct: "1,0%" },
    { id: "corp", name: "Empresariais", pct: "0,5%" }
  ].map((item) => /* @__PURE__ */ React.createElement("div", { key: item.id, className: "rem-row" }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, fontSize: ".84rem" } }, item.name), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800, fontSize: ".84rem" } }, item.pct))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, fontSize: ".74rem", color: "var(--muted)", lineHeight: 1.6 } }, "* Aplicado sobre o valor total de cada neg\xF3cio confirmado."))));
}
function APagarModal({ commissions, spinItems, allRefs = [], onClose }) {
  const comTotal = commissions.reduce((s, r) => s + r.commission, 0);
  const spinTotal = spinItems.reduce((s, r) => s + r.value, 0);
  const total = comTotal + spinTotal;
  const allLookup = [...allRefs, ...commissions];
  const avulsos = spinItems.filter((s) => !allLookup.some((r) => sameId(r.id, s.referralId)));
  return /* @__PURE__ */ React.createElement("div", { className: "overlay", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "sheet", onClick: (e) => e.stopPropagation(), style: { maxHeight: "90vh" } }, /* @__PURE__ */ React.createElement("div", { className: "handle" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 900, fontSize: "1rem" } }, "\u{1F4B0} A Receber"), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(IcX, { s: 17, c: "var(--muted)" }))), /* @__PURE__ */ React.createElement("div", { style: { overflowY: "auto", maxHeight: "64vh" } }, commissions.length === 0 && spinItems.length === 0 && /* @__PURE__ */ React.createElement(Empty, { text: "Nenhum item pendente!" }), /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "0 14px" } }, commissions.map((r, i) => {
    const pt = PRODUCT_TYPES.find((p) => p.id === r.productType) || PRODUCT_TYPES[0];
    const linked = spinItems.find((s) => sameId(s.referralId, r.id));
    return /* @__PURE__ */ React.createElement(React.Fragment, { key: r.id }, /* @__PURE__ */ React.createElement("div", { style: { padding: "11px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".8rem", marginBottom: 3 } }, "Cliente: ", r.clientName), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", lineHeight: 1.6 } }, pt.icon, " ", pt.name, "\xA0\xB7\xA0Venda: ", fBRL(r.productValue), "\xA0\xB7\xA0Comiss\xE3o: ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--red)", fontWeight: 800 } }, fBRL(r.commission))), linked && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "#8833BB", fontWeight: 700, marginTop: 3 } }, "\u{1F3B0} B\xF4nus Roleta desta indica\xE7\xE3o: ", fBRL(linked.value))), (i < commissions.length - 1 || avulsos.length > 0) && /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "rgba(0,0,0,.06)" } }));
  }), avulsos.map((s, i) => {
    const dt = s.createdAt ? new Date(s.createdAt) : null;
    const dtStr = dt ? `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}` : "";
    return /* @__PURE__ */ React.createElement(React.Fragment, { key: "av_" + s.id }, /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "#8833BB", fontWeight: 800 } }, "\u{1F3B0} B\xF4nus Roleta Avulso"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".67rem", color: "var(--muted)", marginTop: 2 } }, fBRL(s.value), dtStr ? ` \xB7 ${dtStr}` : "")), i < avulsos.length - 1 && /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "rgba(0,0,0,.06)" } }));
  }), (commissions.length > 0 || spinItems.length > 0) && /* @__PURE__ */ React.createElement("div", { style: { borderTop: "2px solid rgba(0,0,0,.06)", padding: "10px 0 12px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 3 } }, comTotal > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".69rem", fontWeight: 600 } }, "Comiss\xF5es: ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--red)", fontWeight: 800 } }, fBRL(comTotal))), spinTotal > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".69rem", fontWeight: 600 } }, "B\xF4nus Roleta: ", /* @__PURE__ */ React.createElement("span", { style: { color: "#8833BB", fontWeight: 800 } }, fBRL(spinTotal))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".62rem", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" } }, "\u{1F4B0} Total a Receber"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 900, fontSize: "1rem", color: "var(--red)" } }, fBRL(total)))))))));
}
function SeekJrPanel({ jr, referrals, seekMember, credentials, onLogout, onAddReferral, onChangePin, offers, spinRewards }) {
  const now = /* @__PURE__ */ new Date();
  const [sm, setSm] = useState(now.getMonth() + 1);
  const [sy, setSy] = useState(now.getFullYear());
  const [showAdd, setShowAdd] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showJrOffers, setShowJrOffers] = useState(false);
  const [showExtrato, setShowExtrato] = useState(false);
  const [showRegras, setShowRegras] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAPagar, setShowAPagar] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [cfPin, setCfPin] = useState("");
  const [pinErr, setPinErr] = useState("");
  const credKey = `jr_${jr.id}`;
  const cred = credentials[credKey] || { pin: "0000" };
  const curY = now.getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => curY - 1 + i);
  const myRefs = referrals.filter((r) => sameId(r.jrId, jr.id));
  const monthRefs = myRefs.filter((r) => r.month === sm && r.year === sy);
  const monthVol = monthRefs.reduce((s, r) => s + r.productValue, 0);
  const monthCom = monthRefs.reduce((s, r) => s + r.commission, 0);
  const monthComDue = monthRefs.filter((r) => !r.paid).reduce((s, r) => s + r.commission, 0);
  const totalVol = myRefs.reduce((s, r) => s + r.productValue, 0);
  const gradPct = Math.min(100, totalVol / JR_GRADUATION * 100);
  const graduated = totalVol >= JR_GRADUATION;
  const jrLv = getJrLevel(totalVol);
  const jrLvIdx = JR_LEVELS.findIndex((l) => l.id === jrLv.id);
  const jrLvPct = jrLv.max === Infinity ? 100 : Math.min(100, Math.round((totalVol - jrLv.min) / (jrLv.max - jrLv.min) * 100));
  const initials = jr.name.trim().slice(0, 2).toUpperCase();
  const bonusRoleta = (spinRewards || []).filter((s) => sameId(s.jrId, jr.id)).reduce((s, r) => s + r.value, 0);
  const bonusRoletaPendente = (spinRewards || []).filter((s) => sameId(s.jrId, jr.id) && !s.paid).reduce((s, r) => s + r.value, 0);
  function changePin(e) {
    e.preventDefault();
    setPinErr("");
    if (oldPin !== cred.pin) {
      setPinErr("Senha atual incorreta.");
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setPinErr("Deve ter 4 d\xEDgitos.");
      return;
    }
    if (newPin !== cfPin) {
      setPinErr("Senhas n\xE3o coincidem.");
      return;
    }
    onChangePin(credKey, newPin);
    setOldPin("");
    setNewPin("");
    setCfPin("");
    setShowPin(false);
    alert("Senha alterada!");
  }
  function shareCard() {
    const msg = encodeURIComponent(`Seek Network

Ol\xE1, convido voc\xEA para ir \xE0 Motomec\xE2nica Volkswagen e conversar com o Consultor de Vendas Junior. Voc\xEA pode agendar sua visita pelo WhatsApp: (51)996509660

Voc\xEA foi indicado(a) por: ${jr.name} \u2014 ID: ${jr.id}JR`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }
  function RefForm({ onClose, onSave }) {
    const [cn, setCn] = useState("");
    const [wa, setWa] = useState("");
    const [obs, setObs] = useState("");
    const today = todayISO();
    function save(e) {
      e.preventDefault();
      if (!cn.trim()) return;
      const parts = today.split("-").map(Number);
      onSave({ clientName: cn.trim().toUpperCase(), whatsapp: wa, productType: "auto", productValue: 0, commission: 0, year: parts[0], month: parts[1], day: parts[2], isNew: true, jrId: jr.id, observacoes: obs.trim() ? obs.trim().toUpperCase() : null });
      onClose();
    }
    return /* @__PURE__ */ React.createElement("form", { onSubmit: save, style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement(Fld, { label: "Nome do Cliente" }, /* @__PURE__ */ React.createElement("input", { className: "inp", value: cn, onChange: (e) => setCn(e.target.value.toUpperCase()), placeholder: "Nome completo", autoFocus: true, autoCapitalize: "characters", style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement(Fld, { label: "WhatsApp do Cliente" }, /* @__PURE__ */ React.createElement(PhoneInput, { value: wa, onChange: setWa })), /* @__PURE__ */ React.createElement(Fld, { label: "Observa\xE7\xF5es (opcional)" }, /* @__PURE__ */ React.createElement("textarea", { className: "inp", rows: 2, value: obs, onChange: (e) => setObs(e.target.value.toUpperCase()), placeholder: "Informa\xE7\xF5es adicionais para o vendedor...", autoCapitalize: "characters", style: { resize: "vertical", textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "12px 14px", fontSize: ".76rem", color: "var(--muted)", lineHeight: 1.6, fontWeight: 600 } }, "O vendedor preencher\xE1 produto e valor ao confirmar a venda. Voc\xEA receber\xE1 sua chance na roleta! \u{1F3B0}"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-full", onClick: onClose }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-dark btn-full" }, "Indicar!")));
  }
  const sorted = [...monthRefs].sort((a, b) => new Date(b.year, (b.month || 1) - 1, b.day || 1) - new Date(a.year, (a.month || 1) - 1, a.day || 1));
  return /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 640, margin: "0 auto", minHeight: "100vh" } }, /* @__PURE__ */ React.createElement(TopBar, { logo: "SEEK NETWORK", right: /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", style: { fontSize: ".9rem" }, onClick: () => setShowHelp(true) }, "\u2753"), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onLogout }, /* @__PURE__ */ React.createElement(IcOut, { s: 17, c: "var(--muted)" }))) }), /* @__PURE__ */ React.createElement("div", { style: { padding: "4px 16px 8px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.55rem", fontWeight: 900, color: "var(--black)", letterSpacing: ".06em" } }, "SEEK JR")), /* @__PURE__ */ React.createElement("div", { className: "page", style: { paddingBottom: 30 } }, /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "22px 20px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "member-avatar", style: { width: 52, height: 52, borderRadius: 18, fontSize: "1rem" } }, initials), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: "1rem" } }, jr.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginTop: 3 } }, "ID: ", /* @__PURE__ */ React.createElement("b", { style: { color: "var(--black)" } }, jr.id, "JR")), seekMember && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)", fontWeight: 600, marginTop: 2 } }, "SEEK: ", /* @__PURE__ */ React.createElement("b", { style: { color: "var(--black)" } }, "#", String(seekMember.id).padStart(3, "0")), " \xB7 ", seekMember.name))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("select", { className: "inp", style: { flex: 1 }, value: sm, onChange: (e) => setSm(Number(e.target.value)) }, MONTHS.map((m, i) => /* @__PURE__ */ React.createElement("option", { key: m, value: i + 1 }, m))), /* @__PURE__ */ React.createElement("select", { className: "inp", style: { width: 90 }, value: sy, onChange: (e) => setSy(Number(e.target.value)) }, years.map((y) => /* @__PURE__ */ React.createElement("option", { key: y, value: y }, y)))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 } }, [["Indica\xE7\xF5es M\xEAs", monthRefs.length, null], ["Valor M\xEAs", fBRL(monthVol), null], ["A Receber", fBRL(monthComDue + bonusRoletaPendente), "var(--red)"], ["Total Acumulado", fBRL(totalVol), null]].map(([l, v, c]) => l === "A Receber" ? /* @__PURE__ */ React.createElement("button", { key: l, className: "nm-in", style: { padding: "12px 14px", textAlign: "left", border: "none", cursor: "pointer", background: "var(--bg)" }, onClick: () => setShowAPagar(true) }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 6 } }, l, " \u25B8"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".9rem", color: "var(--red)" } }, v)) : /* @__PURE__ */ React.createElement("div", { key: l, className: "nm-in", style: { padding: "12px 14px" } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 6 } }, l), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".9rem", color: c || "var(--black)" } }, v)))), bonusRoletaPendente > 0 && /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "12px 14px", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".72rem", fontWeight: 800, color: "var(--muted)" } }, "\u{1F3B0} B\xF4nus Roleta pendente"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 900, fontSize: ".92rem", color: "var(--red)" } }, "+ ", fBRL(bonusRoletaPendente))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".6rem", color: "var(--muted)", fontWeight: 600, marginTop: 4 } }, "Inclu\xEDdo no total A Receber \xB7 toque no card para ver detalhes")), graduated && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 10, padding: "8px 14px", borderRadius: 12, background: "rgba(29,122,58,0.1)", fontSize: ".76rem", fontWeight: 800, color: "var(--green)", textAlign: "center" } }, "\u{1F393} Graduado para SEEK!"), /* @__PURE__ */ React.createElement(ProgressBar, { pct: gradPct, className: "progress-jr", label: "Progresso para SEEK", sub: `${fBRL(totalVol)} / ${fBRL(JR_GRADUATION)}` }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8, display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "N\xEDvel JR \u2192 b\xF4nus do SEEK"), /* @__PURE__ */ React.createElement("span", { style: { color: "var(--green)", fontWeight: 900 } }, jrLv.name, " \u2014 ", (jrLv.bonus * 100).toFixed(0), "%")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5, marginBottom: 8 } }, JR_LEVELS.map((lv, i) => /* @__PURE__ */ React.createElement("div", { key: lv.id, style: { flex: 1, textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { height: 8, borderRadius: 99, background: i <= jrLvIdx ? "var(--green)" : "var(--gray)", marginBottom: 4, transition: "all .5s", boxShadow: i <= jrLvIdx ? "0 0 6px rgba(29,122,58,.4)" : "none" } }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".54rem", fontWeight: 800, color: i <= jrLvIdx ? "var(--green)" : "var(--muted)" } }, lv.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".5rem", color: "var(--muted)" } }, (lv.bonus * 100).toFixed(0), "%")))), /* @__PURE__ */ React.createElement(
    ProgressBar,
    {
      pct: jrLvPct,
      className: "progress-emerald",
      label: `Progresso ${jrLv.name}`,
      sub: jrLv.max === Infinity ? "M\xE1ximo!" : fBRL(jrLv.max - totalVol) + " para pr\xF3x."
    }
  ))), /* @__PURE__ */ React.createElement("button", { className: "btn-green-opp", onClick: () => setShowAdd(true) }, /* @__PURE__ */ React.createElement(IcPlus, { s: 22, c: "#fff" }), "Encontrei uma Oportunidade"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-green btn-full", style: { padding: 14, gap: 8, fontSize: ".86rem" }, onClick: shareCard }, "\u{1F4F2} Compartilhar Cart\xE3o"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement("button", { className: "btn", style: { padding: 12 }, onClick: () => {
    setShowPin(true);
    setOldPin("");
    setNewPin("");
    setCfPin("");
    setPinErr("");
  } }, /* @__PURE__ */ React.createElement(IcKey, { s: 15 }), "Senha"), /* @__PURE__ */ React.createElement("button", { className: "btn", style: { padding: 12 }, onClick: () => setShowRegras(true) }, "\u{1F4CB} Regras")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", style: { padding: 12 }, onClick: () => setShowJrOffers(true) }, "\u{1F3F7}\uFE0F Ofertas"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".62rem", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", paddingLeft: 4 } }, MONTHS[sm - 1], " ", sy, " \u2014 Indica\xE7\xF5es"), /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "6px 16px" } }, sorted.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "Nenhuma indica\xE7\xE3o no per\xEDodo" }) : sorted.map((r, i, arr) => /* @__PURE__ */ React.createElement("div", { key: r.id }, /* @__PURE__ */ React.createElement("div", { style: { padding: "13px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".87rem" } }, r.clientName), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", fontWeight: 600 } }, fDate(r))), r.whatsapp && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 } }, /* @__PURE__ */ React.createElement(IcWA, { s: 13, fill: "#25D366" }), maskPhone(r.whatsapp)), r.status === "aguardando" ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".72rem", color: "var(--yellow)", marginBottom: 6, fontWeight: 700 } }, "\u23F3 Aguardando confirma\xE7\xE3o do vendedor") : /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".72rem", color: "var(--muted)", marginBottom: 6 } }, PRODUCT_TYPES.find((p) => p.id === r.productType)?.icon, " ", PRODUCT_TYPES.find((p) => p.id === r.productType)?.name, " \xB7 ", fBRL(r.productValue)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, r.status !== "aguardando" && /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, color: r.paid ? "var(--green)" : "var(--red)" } }, fBRL(r.commission)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".7rem", fontWeight: 700, padding: "4px 10px", borderRadius: 50, background: "var(--bg)", boxShadow: "var(--nm-out)", color: r.status === "aguardando" ? "var(--yellow)" : r.status === "pago" || r.paid ? "var(--green)" : "var(--red)", marginLeft: "auto" } }, r.status === "aguardando" ? "Aguardando" : r.status === "pago" || r.paid ? "Pago" : "A Pagar"))), i < arr.length - 1 && /* @__PURE__ */ React.createElement(Div, null)))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark btn-full", style: { padding: 14, marginTop: 12 }, onClick: () => setShowExtrato(true) }, "\u{1F4CB} Extrato")), showAdd && /* @__PURE__ */ React.createElement(Sheet, { title: "Nova Indica\xE7\xE3o", onClose: () => setShowAdd(false) }, /* @__PURE__ */ React.createElement(RefForm, { onClose: () => setShowAdd(false), onSave: onAddReferral })), showJrOffers && /* @__PURE__ */ React.createElement(OffersPanel, { offers: offers || [], onClose: () => setShowJrOffers(false), isAdm: false, onAddOffer: () => {
  }, onDeleteOffer: () => {
  } }), showExtrato && /* @__PURE__ */ React.createElement(ExtratoModal, { role: "jr", data: { jr, referrals: referrals.filter((r) => sameId(r.jrId, jr.id)), seekMember, spinRewards: (spinRewards || []).filter((s) => sameId(s.jrId, jr.id)) }, onClose: () => setShowExtrato(false) }), showAPagar && /* @__PURE__ */ React.createElement(APagarModal, { commissions: referrals.filter((r) => sameId(r.jrId, jr.id) && !r.paid && (r.status === "a_pagar" || r.productValue > 0)), spinItems: (spinRewards || []).filter((s) => sameId(s.jrId, jr.id) && !s.paid), allRefs: referrals.filter((r) => sameId(r.jrId, jr.id)), onClose: () => setShowAPagar(false) }), showPin && /* @__PURE__ */ React.createElement(Sheet, { title: "Alterar Senha", onClose: () => setShowPin(false) }, /* @__PURE__ */ React.createElement("form", { onSubmit: changePin, style: { display: "flex", flexDirection: "column", gap: 18 } }, /* @__PURE__ */ React.createElement(Fld, { label: "Senha Atual" }, /* @__PURE__ */ React.createElement(PinInput, { value: oldPin, onChange: setOldPin, autoFocus: true })), /* @__PURE__ */ React.createElement(Fld, { label: "Nova Senha" }, /* @__PURE__ */ React.createElement(PinInput, { value: newPin, onChange: setNewPin })), /* @__PURE__ */ React.createElement(Fld, { label: "Confirmar" }, /* @__PURE__ */ React.createElement(PinInput, { value: cfPin, onChange: setCfPin })), pinErr && /* @__PURE__ */ React.createElement("div", { style: { color: "var(--red)", fontSize: ".78rem", fontWeight: 700 } }, pinErr), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-full", onClick: () => setShowPin(false) }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-dark btn-full" }, "Salvar")))), showRegras && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 200, background: "var(--bg)", overflowY: "auto" } }, /* @__PURE__ */ React.createElement(RemuneracaoPanel, { onBack: () => setShowRegras(false) })), showHelp && /* @__PURE__ */ React.createElement(HelpModal, { role: "jr", onClose: () => setShowHelp(false) }));
}
function MemberPanel({ member, referrals, jrReferrals, seekJrs, credentials, onLogout, onAddReferral, onAddJr, onChangePin, levelNotifs, onDismissNotif, offers, spinRewards }) {
  const now = /* @__PURE__ */ new Date();
  const [sm, setSm] = useState(now.getMonth() + 1);
  const [sy, setSy] = useState(now.getFullYear());
  const [showAdd, setShowAdd] = useState(false);
  const [showAddJr, setShowAddJr] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showMemberOffers, setShowMemberOffers] = useState(false);
  const [showJrOffers, setShowJrOffers] = useState(false);
  const [showExtrato, setShowExtrato] = useState(false);
  const [showRegras, setShowRegras] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAPagar, setShowAPagar] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [cfPin, setCfPin] = useState("");
  const [pinErr, setPinErr] = useState("");
  const cred = credentials[member.id] || credentials[String(member.id)] || { pin: "0000" };
  const curY = now.getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => curY - 1 + i);
  const myRefs = referrals.filter((r) => sameId(r.memberId, member.id));
  const monthRefs = myRefs.filter((r) => r.month === sm && r.year === sy);
  const totalSales = myRefs.reduce((s, r) => s + r.productValue, 0);
  const points = calcPoints(totalSales);
  const level = getSeekLevel(points);
  const lvPct = levelProgress(points);
  const myJrs = seekJrs.filter((j) => sameId(j.seekId, member.id));
  const myJrRefs = jrReferrals.filter((r) => myJrs.some((j) => sameId(j.id, r.jrId)));
  const prodBreakdown = PRODUCT_TYPES.map((pt) => {
    const refs = monthRefs.filter((r) => r.productType === pt.id);
    return { ...pt, count: refs.length, volume: refs.reduce((s, r) => s + r.productValue, 0), commission: refs.reduce((s, r) => s + r.commission, 0) };
  });
  const monthCom = monthRefs.reduce((s, r) => s + r.commission, 0);
  const monthComPaid = monthRefs.filter((r) => r.paid).reduce((s, r) => s + r.commission, 0);
  const monthComDue = monthRefs.filter((r) => !r.paid).reduce((s, r) => s + r.commission, 0);
  const jrBonus = myJrs.reduce((total, jr) => {
    const jrTotalVol = myJrRefs.filter((r) => sameId(r.jrId, jr.id)).reduce((s, r) => s + r.productValue, 0);
    const jrLv = getJrLevel(jrTotalVol);
    const jrComm = myJrRefs.filter((r) => sameId(r.jrId, jr.id) && r.month === sm && r.year === sy).reduce((s, r) => s + r.commission, 0);
    return total + jrComm * jrLv.bonus;
  }, 0);
  const initials = member.name.trim().slice(0, 2).toUpperCase();
  const bonusRoleta = (spinRewards || []).filter((s) => sameId(s.seekId, member.id)).reduce((s, r) => s + r.value, 0);
  const bonusRoletaPendente = (spinRewards || []).filter((s) => sameId(s.seekId, member.id) && !s.paid).reduce((s, r) => s + r.value, 0);
  const myLevelNotif = (levelNotifs || []).find((n) => sameId(n.memberId, member.id) && !n.dismissed);
  const nextLevel = level.id === "elite" ? null : SEEK_LEVELS[SEEK_LEVELS.findIndex((l) => l.id === level.id) + 1];
  function changePin(e) {
    e.preventDefault();
    setPinErr("");
    if (oldPin !== cred.pin) {
      setPinErr("Senha atual incorreta.");
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setPinErr("Deve ter 4 d\xEDgitos.");
      return;
    }
    if (newPin !== cfPin) {
      setPinErr("Senhas n\xE3o coincidem.");
      return;
    }
    onChangePin(member.id, newPin);
    setOldPin("");
    setNewPin("");
    setCfPin("");
    setShowPin(false);
    alert("Senha alterada!");
  }
  function shareCard() {
    const msg = encodeURIComponent(`Seek Network

Ol\xE1, convido voc\xEA para ir \xE0 Motomec\xE2nica Volkswagen e conversar com o Consultor de Vendas Junior. Voc\xEA pode agendar sua visita pelo WhatsApp: (51)996509660

Voc\xEA foi indicado(a) por: ${member.name} \u2014 ID: #${String(member.id).padStart(3, "0")}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }
  function RefForm({ onClose, onSave }) {
    const [cn, setCn] = useState("");
    const [wa, setWa] = useState("");
    const [obs, setObs] = useState("");
    const today = todayISO();
    function save(e) {
      e.preventDefault();
      if (!cn.trim()) return;
      const parts = today.split("-").map(Number);
      onSave({ clientName: cn.trim().toUpperCase(), whatsapp: wa, productType: "auto", productValue: 0, commission: 0, year: parts[0], month: parts[1], day: parts[2], isNew: true, observacoes: obs.trim() ? obs.trim().toUpperCase() : null });
      onClose();
    }
    return /* @__PURE__ */ React.createElement("form", { onSubmit: save, style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement(Fld, { label: "Nome do Cliente" }, /* @__PURE__ */ React.createElement("input", { className: "inp", value: cn, onChange: (e) => setCn(e.target.value.toUpperCase()), placeholder: "Nome completo", autoFocus: true, autoCapitalize: "characters", style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement(Fld, { label: "WhatsApp do Cliente" }, /* @__PURE__ */ React.createElement(PhoneInput, { value: wa, onChange: setWa })), /* @__PURE__ */ React.createElement(Fld, { label: "Observa\xE7\xF5es (opcional)" }, /* @__PURE__ */ React.createElement("textarea", { className: "inp", rows: 2, value: obs, onChange: (e) => setObs(e.target.value.toUpperCase()), placeholder: "Informa\xE7\xF5es adicionais para o vendedor...", autoCapitalize: "characters", style: { resize: "vertical", textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "12px 14px", fontSize: ".76rem", color: "var(--muted)", lineHeight: 1.6, fontWeight: 600 } }, "O vendedor preencher\xE1 produto e valor ao confirmar a venda. Voc\xEA receber\xE1 sua chance na roleta! \u{1F3B0}"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-full", onClick: onClose }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-dark btn-full" }, "Indicar!")));
  }
  function JrForm({ onClose, onSave }) {
    const [name, setName] = useState("");
    const [wa, setWa] = useState("");
    const [pix, setPix] = useState("");
    const [pin, setPin] = useState("0000");
    const [pe, setPe] = useState("");
    function save(e) {
      e.preventDefault();
      if (!name.trim() || !wa) return;
      if (!/^\d{4}$/.test(pin)) {
        setPe("Deve ter 4 d\xEDgitos.");
        return;
      }
      onSave({ name: name.trim().toUpperCase(), whatsapp: wa, pixKey: pix.trim().toUpperCase() || null, pin, seekId: member.id });
      onClose();
    }
    return /* @__PURE__ */ React.createElement("form", { onSubmit: save, style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement(Fld, { label: "Nome do SEEK JR" }, /* @__PURE__ */ React.createElement("input", { className: "inp", value: name, onChange: (e) => setName(e.target.value.toUpperCase()), placeholder: "Nome completo", autoFocus: true, autoCapitalize: "characters", style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement(Fld, { label: "Telefone (Login \u2014 somente n\xFAmeros)" }, /* @__PURE__ */ React.createElement(PlainPhoneInput, { value: wa, onChange: setWa })), /* @__PURE__ */ React.createElement(Fld, { label: "Chave PIX (opcional)" }, /* @__PURE__ */ React.createElement("input", { className: "inp", value: pix, onChange: (e) => setPix(e.target.value.toUpperCase()), placeholder: "CPF, E-MAIL OU CHAVE", autoCapitalize: "characters", style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "14px", display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)" } }, "\u{1F511} Acesso"), /* @__PURE__ */ React.createElement(Fld, { label: "Senha inicial (4 d\xEDgitos)" }, /* @__PURE__ */ React.createElement(PinInput, { value: pin, onChange: setPin }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".68rem", color: "var(--muted)", marginTop: 4, display: "block" } }, "Padr\xE3o: 0000. JR pode alterar."), pe && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--red)", fontSize: ".74rem", fontWeight: 700 } }, pe))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-full", onClick: onClose }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-dark btn-full" }, "Cadastrar JR")));
  }
  const sorted = [...monthRefs].sort((a, b) => new Date(b.year, (b.month || 1) - 1, b.day || 1) - new Date(a.year, (a.month || 1) - 1, a.day || 1));
  return /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 640, margin: "0 auto", minHeight: "100vh" } }, myLevelNotif && /* @__PURE__ */ React.createElement(LevelUpModal, { level: getSeekLevel(points), onClose: () => onDismissNotif(myLevelNotif.id) }), /* @__PURE__ */ React.createElement(TopBar, { logo: "SEEK NETWORK", right: /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", style: { fontSize: ".9rem" }, onClick: () => setShowHelp(true) }, "\u2753"), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onLogout }, /* @__PURE__ */ React.createElement(IcOut, { s: 17, c: "var(--muted)" }))) }), /* @__PURE__ */ React.createElement("div", { style: { padding: "4px 16px 8px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.55rem", fontWeight: 900, color: "var(--black)", letterSpacing: ".06em" } }, "SEEK")), /* @__PURE__ */ React.createElement("div", { className: "page", style: { paddingBottom: 30 } }, /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "22px 20px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "member-avatar", style: { width: 52, height: 52, borderRadius: 18, fontSize: "1rem" } }, initials), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: "1rem" } }, member.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)", fontWeight: 600, marginTop: 2 } }, "ID #", /* @__PURE__ */ React.createElement("b", { style: { color: "var(--black)" } }, String(member.id).padStart(3, "0")))), /* @__PURE__ */ React.createElement(LevelBadge, { points })), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement(
    ProgressBar,
    {
      pct: lvPct,
      className: level.progressClass,
      label: `${points} pts \xB7 ${level.name} \u2014 ${lvPct}% do n\xEDvel`,
      sub: nextLevel ? `${nextLevel.min - points} pts para ${nextLevel.name}` : "N\xEDvel M\xE1ximo!"
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("select", { className: "inp", style: { flex: 1 }, value: sm, onChange: (e) => setSm(Number(e.target.value)) }, MONTHS.map((m, i) => /* @__PURE__ */ React.createElement("option", { key: m, value: i + 1 }, m))), /* @__PURE__ */ React.createElement("select", { className: "inp", style: { width: 90 }, value: sy, onChange: (e) => setSy(Number(e.target.value)) }, years.map((y) => /* @__PURE__ */ React.createElement("option", { key: y, value: y }, y)))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".6rem", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 } }, "Indica\xE7\xF5es por Produto \u2014 ", MONTHS[sm - 1], " ", sy), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 } }, prodBreakdown.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.id, className: "nm-in", style: { padding: "10px 8px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "1.1rem", marginBottom: 4 } }, p.icon), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".58rem", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)", marginBottom: 5 } }, p.name.replace("Empresariais", "Empresar.")), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 900, fontSize: "1rem", color: "var(--black)" } }, p.count), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".64rem", color: "var(--muted)", marginTop: 2 } }, fBRL(p.volume)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".66rem", color: "var(--green)", fontWeight: 800, marginTop: 1 } }, fBRL(p.commission)))))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } }, [["Comiss\xE3o Total", fBRL(monthCom), "var(--green)"], ["B\xF4nus JR", fBRL(jrBonus), "var(--green)"], ["A Receber", fBRL(monthComDue + bonusRoletaPendente), "var(--red)"], ["Recebido", fBRL(monthComPaid), "var(--green)"]].map(([l, v, c]) => l === "A Receber" ? /* @__PURE__ */ React.createElement("button", { key: l, className: "nm-in", style: { padding: "12px 14px", textAlign: "left", border: "none", cursor: "pointer", background: "var(--bg)" }, onClick: () => setShowAPagar(true) }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 6 } }, l, " \u25B8"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".9rem", color: "var(--red)" } }, v)) : /* @__PURE__ */ React.createElement("div", { key: l, className: "nm-in", style: { padding: "12px 14px" } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 6 } }, l), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".9rem", color: c } }, v)))), bonusRoletaPendente > 0 && /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "12px 14px", marginTop: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".72rem", fontWeight: 800, color: "var(--muted)" } }, "\u{1F3B0} B\xF4nus Roleta pendente"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 900, fontSize: ".92rem", color: "var(--red)" } }, "+ ", fBRL(bonusRoletaPendente))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".6rem", color: "var(--muted)", fontWeight: 600, marginTop: 4 } }, "Inclu\xEDdo no total A Receber \xB7 toque no card para ver detalhes"))), /* @__PURE__ */ React.createElement(MedalsShowcase, { points }), /* @__PURE__ */ React.createElement("button", { className: "btn-green-opp", onClick: () => setShowAdd(true) }, /* @__PURE__ */ React.createElement(IcPlus, { s: 22, c: "#fff" }), "Encontrei uma Oportunidade"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark btn-full", style: { padding: 14, marginTop: 4 }, onClick: () => setShowAddJr(true) }, /* @__PURE__ */ React.createElement(IcPlus, { s: 18, c: "#fff" }), "Cadastrar SEEK JR"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-green btn-full", style: { padding: 14, gap: 8, fontSize: ".86rem" }, onClick: shareCard }, "\u{1F4F2} Compartilhar Cart\xE3o"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement("button", { className: "btn", style: { padding: 12 }, onClick: () => {
    setShowPin(true);
    setOldPin("");
    setNewPin("");
    setCfPin("");
    setPinErr("");
  } }, /* @__PURE__ */ React.createElement(IcKey, { s: 14 }), "Senha"), /* @__PURE__ */ React.createElement("button", { className: "btn", style: { padding: 12 }, onClick: () => setShowRegras(true) }, "\u{1F4CB} Regras")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", style: { padding: 12 }, onClick: () => setShowMemberOffers(true) }, "\u{1F3F7}\uFE0F Ofertas"), myJrs.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".62rem", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", paddingLeft: 4, marginBottom: 10 } }, "Meus SEEK JR (", myJrs.length, ")"), /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "6px 16px" } }, myJrs.map((jr, i) => {
    const jrTotal = myJrRefs.filter((r) => sameId(r.jrId, jr.id)).reduce((s, r) => s + r.productValue, 0);
    const jrMonthRefs = myJrRefs.filter((r) => sameId(r.jrId, jr.id) && r.month === sm && r.year === sy);
    const jrMonthCom = jrMonthRefs.reduce((s, r) => s + r.commission, 0);
    const jrLv = getJrLevel(jrTotal);
    return /* @__PURE__ */ React.createElement("div", { key: jr.id }, /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".86rem" } }, jr.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", fontWeight: 600, marginTop: 2 } }, "ID: ", jr.id, "JR \xB7 ", jrLv.name)), /* @__PURE__ */ React.createElement("span", { className: "tag-jr" }, "JR")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".72rem", color: "var(--muted)", marginBottom: 6 } }, "M\xEAs: ", fBRL(jrMonthRefs.reduce((s, r) => s + r.productValue, 0)), " \xB7 Total: ", fBRL(jrTotal)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--green)", fontWeight: 700, marginBottom: 8 } }, "B\xF4nus meu: ", fBRL(jrMonthCom * jrLv.bonus), " (", (jrLv.bonus * 100).toFixed(0), "%)"), /* @__PURE__ */ React.createElement(
      ProgressBar,
      {
        pct: Math.min(100, jrTotal / JR_GRADUATION * 100),
        className: "progress-jr",
        label: "JR \u2192 SEEK",
        sub: fBRL(jrTotal) + "/" + fBRL(JR_GRADUATION)
      }
    )), i < myJrs.length - 1 && /* @__PURE__ */ React.createElement(Div, null));
  }))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".62rem", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", paddingLeft: 4 } }, MONTHS[sm - 1], " ", sy, " \u2014 Indica\xE7\xF5es"), /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "6px 16px" } }, sorted.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "Nenhuma indica\xE7\xE3o no per\xEDodo" }) : sorted.map((r, i, arr) => /* @__PURE__ */ React.createElement("div", { key: r.id }, /* @__PURE__ */ React.createElement("div", { style: { padding: "13px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".87rem" } }, r.clientName), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", fontWeight: 600 } }, fDate(r))), r.whatsapp && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 } }, /* @__PURE__ */ React.createElement(IcWA, { s: 13, fill: "#25D366" }), maskPhone(r.whatsapp)), r.status === "aguardando" ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".72rem", color: "var(--yellow)", marginBottom: 6, fontWeight: 700 } }, "\u23F3 Aguardando confirma\xE7\xE3o do vendedor") : /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".72rem", color: "var(--muted)", marginBottom: 6 } }, PRODUCT_TYPES.find((p) => p.id === r.productType)?.icon, " ", PRODUCT_TYPES.find((p) => p.id === r.productType)?.name, " \xB7 ", fBRL(r.productValue)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, r.status !== "aguardando" && /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, color: r.paid ? "var(--green)" : "var(--red)" } }, fBRL(r.commission)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".7rem", fontWeight: 700, padding: "4px 10px", borderRadius: 50, background: "var(--bg)", boxShadow: "var(--nm-out)", color: r.status === "aguardando" ? "var(--yellow)" : r.status === "pago" || r.paid ? "var(--green)" : "var(--red)", marginLeft: "auto" } }, r.status === "aguardando" ? "Aguardando" : r.status === "pago" || r.paid ? "Pago" : "A Pagar"))), i < arr.length - 1 && /* @__PURE__ */ React.createElement(Div, null)))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark btn-full", style: { padding: 14, marginTop: 12 }, onClick: () => setShowExtrato(true) }, "\u{1F4CB} Extrato")), showMemberOffers && /* @__PURE__ */ React.createElement(OffersPanel, { offers: offers || [], onClose: () => setShowMemberOffers(false), isAdm: false, onAddOffer: () => {
  }, onDeleteOffer: () => {
  } }), showExtrato && /* @__PURE__ */ React.createElement(ExtratoModal, { role: "member", data: { member, referrals: referrals.filter((r) => sameId(r.memberId, member.id)), jrReferrals, seekJrs, spinRewards: (spinRewards || []).filter((s) => sameId(s.seekId, member.id)) }, onClose: () => setShowExtrato(false) }), showAPagar && /* @__PURE__ */ React.createElement(APagarModal, { commissions: referrals.filter((r) => sameId(r.memberId, member.id) && !r.paid && (r.status === "a_pagar" || r.productValue > 0)), spinItems: (spinRewards || []).filter((s) => sameId(s.seekId, member.id) && !s.paid), allRefs: referrals.filter((r) => sameId(r.memberId, member.id)), onClose: () => setShowAPagar(false) }), showAdd && /* @__PURE__ */ React.createElement(Sheet, { title: "Encontrei uma Oportunidade", onClose: () => setShowAdd(false) }, /* @__PURE__ */ React.createElement(RefForm, { onClose: () => setShowAdd(false), onSave: onAddReferral })), showAddJr && /* @__PURE__ */ React.createElement(Sheet, { title: "Cadastrar SEEK JR", onClose: () => setShowAddJr(false) }, /* @__PURE__ */ React.createElement(JrForm, { onClose: () => setShowAddJr(false), onSave: onAddJr })), showPin && /* @__PURE__ */ React.createElement(Sheet, { title: "Alterar Senha", onClose: () => setShowPin(false) }, /* @__PURE__ */ React.createElement("form", { onSubmit: changePin, style: { display: "flex", flexDirection: "column", gap: 18 } }, /* @__PURE__ */ React.createElement(Fld, { label: "Senha Atual" }, /* @__PURE__ */ React.createElement(PinInput, { value: oldPin, onChange: setOldPin, autoFocus: true })), /* @__PURE__ */ React.createElement(Fld, { label: "Nova Senha" }, /* @__PURE__ */ React.createElement(PinInput, { value: newPin, onChange: setNewPin })), /* @__PURE__ */ React.createElement(Fld, { label: "Confirmar" }, /* @__PURE__ */ React.createElement(PinInput, { value: cfPin, onChange: setCfPin })), pinErr && /* @__PURE__ */ React.createElement("div", { style: { color: "var(--red)", fontSize: ".78rem", fontWeight: 700 } }, pinErr), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-full", onClick: () => setShowPin(false) }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-dark btn-full" }, "Salvar")))), showRegras && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 200, background: "var(--bg)", overflowY: "auto" } }, /* @__PURE__ */ React.createElement(RemuneracaoPanel, { onBack: () => setShowRegras(false) })), showHelp && /* @__PURE__ */ React.createElement(HelpModal, { role: "member", onClose: () => setShowHelp(false) }));
}
function AdmDashboard({ members, referrals, jrReferrals, seekJrs, sm, setSm, sy, setSy, onNav, passReqs, credentials, onDeleteRef, onDeleteJrRef, spinRewards, showPaymentReminder, hideAdmCommission }) {
  const curY = (/* @__PURE__ */ new Date()).getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => curY - 2 + i);
  const fil = referrals.filter((r) => r.month === sm && r.year === sy);
  const jrFil = jrReferrals.filter((r) => r.month === sm && r.year === sy);
  const totV = [...fil, ...jrFil].reduce((s, r) => s + r.productValue, 0);
  const spinAP = (spinRewards || []).filter((s) => !s.paid).reduce((s, r) => s + r.value, 0);
  const comAP = [...fil, ...jrFil].filter((r) => !r.paid).reduce((s, r) => s + r.commission, 0) + spinAP;
  const comP = [...fil, ...jrFil].filter((r) => r.paid).reduce((s, r) => s + r.commission, 0);
  const pendReqs = (passReqs || []).filter((r) => !r.resolved);
  const newSeekRefs = referrals.filter((r) => r.isNew);
  const newJrRefs = jrReferrals.filter((r) => r.isNew);
  const newJrs = seekJrs.filter((j) => j.isNew);
  const allTotV = [...referrals, ...jrReferrals].reduce((s, r) => s + r.productValue, 0);
  const [expandedRef, setExpandedRef] = useState(null);
  const rankMap = {};
  fil.forEach((r) => {
    rankMap[r.memberId] = (rankMap[r.memberId] || 0) + r.commission;
  });
  const ranking = Object.entries(rankMap).map(([mid, t]) => ({ member: members.find((m) => String(m.id) === mid), total: Number(t) })).filter((x) => x.member).sort((a, b) => b.total - a.total);
  function RefNotifCard({ r, isJr }) {
    const seek = isJr ? seekJrs.find((j) => sameId(j.id, r.jrId)) : members.find((m) => sameId(m.id, r.memberId));
    const seekParent = isJr && seek ? members.find((m) => sameId(m.id, seek.seekId)) : null;
    const pt = PRODUCT_TYPES.find((p) => p.id === r.productType) || PRODUCT_TYPES[0];
    const digits = (r.whatsapp || "").replace(/\D/g, "");
    const phone = digits ? digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}` : "";
    const isExpanded = expandedRef === r.id;
    return /* @__PURE__ */ React.createElement("div", { style: { cursor: "pointer" }, onClick: () => setExpandedRef(isExpanded ? null : r.id) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, paddingTop: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 900, fontSize: "1rem", color: "var(--green)", marginBottom: 3 } }, r.clientName || "Novo cliente"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)", fontWeight: 600, display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" } }, isJr && /* @__PURE__ */ React.createElement("span", { className: "tag-jr" }, "JR"), isJr && seek && /* @__PURE__ */ React.createElement("span", null, seek.name), isJr && seekParent && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { style: { opacity: 0.5 } }, "\u2192"), /* @__PURE__ */ React.createElement("span", null, "SEEK: ", seekParent.name)), !isJr && seek && /* @__PURE__ */ React.createElement("span", null, "SEEK: ", seek.name))), /* @__PURE__ */ React.createElement("div", { style: { flexShrink: 0, display: "flex", gap: 6, alignItems: "center" } }, !r.paid && /* @__PURE__ */ React.createElement("button", { className: "btn", style: { padding: "5px 10px", fontSize: ".7rem", color: "var(--red)" }, onClick: (e) => {
      e.stopPropagation();
      if (window.confirm(`Apagar indica\xE7\xE3o de "${r.clientName}"?`)) {
        isJr ? onDeleteJrRef(r.id) : onDeleteRef(r.id);
      }
    } }, /* @__PURE__ */ React.createElement(IcTrash, { s: 13 }), "Apagar"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".7rem", color: "var(--muted)" } }, "\u25BE"))), isExpanded && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, padding: "12px 14px", borderRadius: 14, background: "var(--bg)", boxShadow: "var(--nm-in)", display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".74rem", fontWeight: 700, display: "flex", gap: 6, alignItems: "center" } }, pt.icon, " ", pt.name, " \xB7 ", fBRL(r.productValue)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".74rem", fontWeight: 800, color: r.paid ? "var(--green)" : "var(--red)" } }, "Comiss\xE3o: ", fBRL(r.commission)), r.whatsapp && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".74rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement(IcWA, { s: 14, fill: "#25D366" }), maskPhone(r.whatsapp)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)" } }, fDate(r)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" } }, phone && /* @__PURE__ */ React.createElement("a", { href: `https://wa.me/${phone}`, target: "_blank", style: { textDecoration: "none" } }, /* @__PURE__ */ React.createElement("button", { className: "btn", style: { padding: "8px 14px", fontSize: ".76rem", gap: 6, color: "#25D366" } }, /* @__PURE__ */ React.createElement(IcWA, { s: 15, fill: "#25D366" }), "WhatsApp")), /* @__PURE__ */ React.createElement("button", { className: "btn", style: { padding: "8px 14px", fontSize: ".76rem", color: "var(--yellow)" }, onClick: (e) => {
      e.stopPropagation();
      onNav("editRef", r);
    } }, /* @__PURE__ */ React.createElement(IcEdit, { s: 13 }), "Editar"))));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "page", style: { paddingBottom: 110 } }, showPaymentReminder && /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderLeft: "3px solid var(--green)" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "1.2rem" } }, "\u{1F4C5}"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, lineHeight: 1.5 } }, "Todo dia 10 verifique as vendas do m\xEAs e marque como Pago")), pendReqs.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "18px", border: "1.5px solid rgba(192,57,43,.3)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 9, height: 9, borderRadius: "50%", background: "var(--red)", animation: "pulse 1.4s ease-in-out infinite" } }), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".86rem", color: "var(--red)" } }, "Solicita\xE7\xF5es de Senha (", pendReqs.length, ")")), pendReqs.map((req, i, arr) => {
    const m = members.find((x) => sameId(x.id, req.memberId));
    const c = credentials[req.memberId] || {};
    return /* @__PURE__ */ React.createElement("div", { key: req.id }, /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".86rem", marginBottom: 4 } }, m ? m.name : `#${req.memberId}`), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".72rem", color: "var(--muted)", marginBottom: 8 } }, maskPhone(c.login), " \xB7 Senha atual: ", c.pin)), i < arr.length - 1 && /* @__PURE__ */ React.createElement(Div, null));
  })), /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "14px 16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("select", { className: "inp", style: { flex: 1 }, value: sm, onChange: (e) => setSm(Number(e.target.value)) }, MONTHS.map((m, i) => /* @__PURE__ */ React.createElement("option", { key: m, value: i + 1 }, m))), /* @__PURE__ */ React.createElement("select", { className: "inp", style: { width: 90 }, value: sy, onChange: (e) => setSy(Number(e.target.value)) }, years.map((y) => /* @__PURE__ */ React.createElement("option", { key: y, value: y }, y))))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement(StatCard, { label: "Qtde Vendas", value: fil.length + jrFil.length }), /* @__PURE__ */ React.createElement(StatCard, { label: "Valor Total", value: fBRL(totV) }), /* @__PURE__ */ React.createElement(StatCard, { label: "A Pagar", value: fBRL(comAP), color: "var(--red)" }), /* @__PURE__ */ React.createElement(StatCard, { label: "Pago", value: fBRL(comP), color: "var(--green)" })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, [["A Pagar", [...referrals, ...jrReferrals].filter((r) => !r.paid && (r.status === "a_pagar" || r.productValue > 0)).length, "var(--red)", "pending", IcClock], ["Pagas", [...referrals, ...jrReferrals].filter((r) => r.paid).length, "var(--green)", "paid", IcCheck]].map(([l, v, c, dest, Ico]) => /* @__PURE__ */ React.createElement("button", { key: l, className: "nm", style: { padding: "16px 14px", textAlign: "left", border: "none", cursor: "pointer", background: "var(--bg)" }, onClick: () => onNav(dest) }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 8, display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement(Ico, { s: 11, c }), l), /* @__PURE__ */ React.createElement("div", { className: "stat-n", style: { fontSize: "1.1rem", color: c } }, v)))), (spinRewards || []).filter((s) => !s.paid).length > 0 && /* @__PURE__ */ React.createElement(StatCard, { label: "\u{1F3B0} B\xF4nus Roleta Pendente", value: fBRL((spinRewards || []).filter((s) => !s.paid).reduce((s, r) => s + r.value, 0)), color: "#8833BB" }), !hideAdmCommission && /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "18px" } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 12, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement(IcStar, { s: 13 }), "\u{1F4BC} Minha Comiss\xE3o"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "12px" } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 4 } }, MONTHS[sm - 1].slice(0, 3), " ", sy), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, color: "var(--green)" } }, fBRL(admComm([...fil, ...jrFil])))), /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "12px" } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 4 } }, "Total Geral"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, color: "var(--green)" } }, fBRL(admComm([...referrals, ...jrReferrals])))))), ranking.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { paddingLeft: 4, marginBottom: 10 } }, "Ranking ", MONTHS[sm - 1], " ", sy), /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "6px 16px" } }, ranking.map((item, i) => {
    const pts = calcPoints(referrals.filter((r) => sameId(r.memberId, item.member.id)).reduce((s, r) => s + r.productValue, 0));
    return /* @__PURE__ */ React.createElement("div", { key: item.member.id }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, padding: "12px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 34, height: 34, borderRadius: 12, background: "var(--bg)", boxShadow: "var(--nm-out)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: ".8rem", flexShrink: 0 } }, i + 1), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, item.member.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", fontWeight: 600, marginTop: 2, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", null, "#", String(item.member.id).padStart(3, "0")), /* @__PURE__ */ React.createElement(LevelBadge, { points: pts, small: true }))), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, color: "var(--green)", flexShrink: 0 } }, fBRL(item.total))), i < ranking.length - 1 && /* @__PURE__ */ React.createElement(Div, null));
  }))));
}
function AdmMembers({ members, referrals, jrReferrals, seekJrs, credentials, onSelect, onAdd, onDelete, onUpdatePin, onDeleteJr }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [credM, setCredM] = useState(null);
  const [newPin, setNewPin] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);
  const sorted = [...members].filter((m) => m.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  function MemberForm({ onCancel, onSave }) {
    const [name, setName] = useState("");
    const [wa, setWa] = useState("");
    const [pix, setPix] = useState("");
    const [notes, setNotes] = useState("");
    const [pin, setPin] = useState("0000");
    const [pe, setPe] = useState("");
    function submit(e) {
      e.preventDefault();
      if (!name.trim()) return;
      if (!/^\d{4}$/.test(pin)) {
        setPe("Deve ter 4 d\xEDgitos.");
        return;
      }
      onSave({ name: name.trim().toUpperCase(), whatsapp: wa, pixKey: pix.trim().toUpperCase(), notes: notes.trim().toUpperCase(), login: wa, pin });
    }
    return /* @__PURE__ */ React.createElement("form", { onSubmit: submit, style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement(Fld, { label: "Nome Completo" }, /* @__PURE__ */ React.createElement("input", { className: "inp", value: name, onChange: (e) => setName(e.target.value.toUpperCase()), placeholder: "Nome", autoFocus: true, autoCapitalize: "characters", style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement(Fld, { label: "Telefone (Login \u2014 somente n\xFAmeros)" }, /* @__PURE__ */ React.createElement(PlainPhoneInput, { value: wa, onChange: setWa })), /* @__PURE__ */ React.createElement(Fld, { label: "Chave PIX" }, /* @__PURE__ */ React.createElement("input", { className: "inp", value: pix, onChange: (e) => setPix(e.target.value.toUpperCase()), placeholder: "CPF, E-MAIL OU CHAVE", autoCapitalize: "characters", style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement(Fld, { label: "Observa\xE7\xF5es" }, /* @__PURE__ */ React.createElement("textarea", { className: "inp", rows: 2, value: notes, onChange: (e) => setNotes(e.target.value.toUpperCase()), autoCapitalize: "characters", style: { resize: "vertical", textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "14px", display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)" } }, "\u{1F511} Acesso ao App"), /* @__PURE__ */ React.createElement(Fld, { label: "Senha inicial" }, /* @__PURE__ */ React.createElement(PinInput, { value: pin, onChange: setPin }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".68rem", color: "var(--muted)", marginTop: 4, display: "block" } }, "Padr\xE3o: 0000."), pe && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--red)", fontSize: ".74rem", fontWeight: 700 } }, pe))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-full", onClick: onCancel }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-dark btn-full" }, "Cadastrar")));
  }
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TopBar, { title: "SEEK", right: onAdd ? /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark", style: { padding: "9px 14px", fontSize: ".74rem", borderRadius: 14 }, onClick: () => setShowAdd(true) }, /* @__PURE__ */ React.createElement(IcPlus, { s: 14, c: "#fff" }), "Novo") : null }), /* @__PURE__ */ React.createElement("div", { className: "page", style: { paddingBottom: 110 } }, /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" } }, /* @__PURE__ */ React.createElement(IcSrch, { s: 16 })), /* @__PURE__ */ React.createElement("input", { className: "inp", style: { paddingLeft: 42, textTransform: "uppercase" }, placeholder: "Buscar membro", value: search, onChange: (e) => setSearch(e.target.value.toUpperCase()), autoCapitalize: "characters" })), sorted.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "Nenhum membro" }) : sorted.map((m) => {
    const pts = calcPoints(referrals.filter((r) => sameId(r.memberId, m.id)).reduce((s, r) => s + r.productValue, 0));
    const lv = getSeekLevel(pts);
    const myJrs = seekJrs.filter((j) => sameId(j.seekId, m.id));
    const initials = m.name.trim().slice(0, 2).toUpperCase();
    const cred = credentials[m.id] || credentials[String(m.id)] || {};
    return /* @__PURE__ */ React.createElement(React.Fragment, { key: m.id }, /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "13px 16px", display: "flex", flexDirection: "row", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { style: { display: "flex", alignItems: "center", gap: 12, flex: 1, background: "none", border: "none", cursor: "pointer", minWidth: 0, textAlign: "left" }, onClick: () => onSelect(m) }, /* @__PURE__ */ React.createElement("div", { className: "member-avatar" }, initials), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, m.name), /* @__PURE__ */ React.createElement(LevelBadge, { points: pts, small: true }), myJrs.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "tag-jr" }, myJrs.length, " JR")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", fontWeight: 600, marginTop: 2 } }, "#", String(m.id).padStart(3, "0"), " \xB7 ", pts, " pts", cred.login ? ` \xB7 ${maskPhone(cred.login)}` : ""))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexShrink: 0 } }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => {
      setCredM(m);
      setNewPin("");
      setPinErr("");
    } }, /* @__PURE__ */ React.createElement(IcKey, { s: 14 })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => setConfirmDel(m) }, /* @__PURE__ */ React.createElement(IcTrash, { s: 14, c: "var(--red)" })))), myJrs.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { paddingLeft: 16, paddingBottom: 8, borderTop: "1px solid var(--gray)", marginTop: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".6rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", margin: "6px 0 6px" } }, "SEEK JR (", myJrs.length, ")"), myJrs.map((jr) => /* @__PURE__ */ React.createElement("div", { key: jr.id, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: ".82rem" } }, jr.name), /* @__PURE__ */ React.createElement("span", { className: "tag-jr", style: { marginLeft: 6 } }, jr.id, "JR"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".66rem", color: "var(--muted)", marginTop: 1 } }, maskPhone(jr.whatsapp))), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", style: { width: 28, height: 28, borderRadius: 8 }, onClick: () => onSelect({ ...jr, _isJr: true, seekMember: m }) }, /* @__PURE__ */ React.createElement(IcEdit, { s: 12 })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", style: { width: 28, height: 28, borderRadius: 8 }, onClick: () => {
      if (window.confirm(`Excluir SEEK JR "${jr.name}"?`)) onDeleteJr(jr.id);
    } }, /* @__PURE__ */ React.createElement(IcTrash, { s: 12, c: "var(--red)" }))))));
  })), showAdd && onAdd && /* @__PURE__ */ React.createElement(Sheet, { title: "Novo SEEK", onClose: () => setShowAdd(false) }, /* @__PURE__ */ React.createElement(MemberForm, { onCancel: () => setShowAdd(false), onSave: (d) => {
    onAdd(d);
    setShowAdd(false);
  } })), confirmDel && /* @__PURE__ */ React.createElement(Confirm, { title: "Excluir membro", msg: `Excluir "${confirmDel.name}" e todas as indica\xE7\xF5es?`, onCancel: () => setConfirmDel(null), onOk: () => {
    onDelete(confirmDel.id);
    setConfirmDel(null);
  } }), credM && (() => {
    const cred = credentials[credM.id] || { login: credM.whatsapp || "", pin: "0000" };
    const phone = cred.login ? cred.login.startsWith("55") && cred.login.length >= 12 ? cred.login : `55${cred.login}` : "";
    function savePin() {
      if (!/^\d{4}$/.test(newPin)) {
        setPinErr("Deve ter 4 d\xEDgitos.");
        return;
      }
      onUpdatePin(credM.id, newPin);
      setPinErr("");
      setNewPin("");
      setCredM(null);
    }
    function sendWA() {
      const msg = encodeURIComponent(`Ol\xE1 ${credM.name}! Credenciais SEEK:
Login: ${maskPhone(cred.login)}
Senha: ${cred.pin}`);
      window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    }
    return /* @__PURE__ */ React.createElement(Sheet, { title: "Credenciais", onClose: () => setCredM(null) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "12px 14px" } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 3 } }, "Login"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700 } }, maskPhone(cred.login) || "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "12px 14px" } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 3 } }, "Senha"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 900, fontSize: "1.8rem", letterSpacing: ".5em" } }, cred.pin)), /* @__PURE__ */ React.createElement(Fld, { label: "Nova senha" }, /* @__PURE__ */ React.createElement(PinInput, { value: newPin, onChange: setNewPin, autoFocus: true }), pinErr && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--red)", fontSize: ".74rem", fontWeight: 700, marginTop: 4 } }, pinErr)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", onClick: () => setCredM(null) }, "Fechar"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark btn-full", onClick: savePin }, "Salvar")), phone && /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", onClick: sendWA, style: { gap: 8 } }, /* @__PURE__ */ React.createElement(IcWA, { s: 15 }), "WhatsApp")));
  })());
}
function EditMemberForm({ member, onClose, onSave }) {
  const [name, setName] = useState(member.name || "");
  const [wa, setWa] = useState((member.whatsapp || "").replace(/\D/g, ""));
  const [pix, setPix] = useState(member.pixKey || "");
  const [notes, setNotes] = useState(member.notes || "");
  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim().toUpperCase(), whatsapp: wa, pixKey: pix.trim().toUpperCase(), notes: notes.trim().toUpperCase() });
  }
  return /* @__PURE__ */ React.createElement(Sheet, { title: "Editar Membro", onClose }, /* @__PURE__ */ React.createElement("form", { onSubmit: submit, style: { display: "flex", flexDirection: "column", gap: 14 } }, /* @__PURE__ */ React.createElement(Fld, { label: "Nome" }, /* @__PURE__ */ React.createElement("input", { className: "inp", value: name, onChange: (e) => setName(e.target.value.toUpperCase()), autoFocus: true, autoCapitalize: "characters", style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement(Fld, { label: "Telefone (Login \u2014 somente n\xFAmeros)" }, /* @__PURE__ */ React.createElement(PlainPhoneInput, { value: wa, onChange: setWa })), /* @__PURE__ */ React.createElement(Fld, { label: "PIX" }, /* @__PURE__ */ React.createElement("input", { className: "inp", value: pix, onChange: (e) => setPix(e.target.value.toUpperCase()), autoCapitalize: "characters", style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement(Fld, { label: "Notas" }, /* @__PURE__ */ React.createElement("textarea", { className: "inp", value: notes, onChange: (e) => setNotes(e.target.value.toUpperCase()), rows: 2, autoCapitalize: "characters", style: { resize: "vertical", textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-full", onClick: onClose }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-dark btn-full" }, "Salvar"))));
}
function AdmMemberDetail({ member, referrals, jrReferrals, seekJrs, credentials, onBack, onAddReferral, onUpdateReferral, onTogglePaid, onDeleteReferral, onDeleteMember, onUpdateMember, onUpdatePin, spinRewards, onToggleSpinPaid }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editRef, setEditRef] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [delMember, setDelMember] = useState(false);
  const [showCreds, setShowCreds] = useState(false);
  const [showExtrato, setShowExtrato] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinErr, setPinErr] = useState("");
  const myRefs = [...referrals].filter((r) => sameId(r.memberId, member.id)).sort((a, b) => new Date(b.year, (b.month || 1) - 1, b.day || 1) - new Date(a.year, (a.month || 1) - 1, a.day || 1));
  const totalSales = myRefs.reduce((s, r) => s + r.productValue, 0);
  const points = calcPoints(totalSales);
  const level = getSeekLevel(points);
  const totC = myRefs.reduce((s, r) => s + r.commission, 0);
  const totP = myRefs.filter((r) => r.paid).reduce((s, r) => s + r.commission, 0);
  const memberUnpaidSpin = (spinRewards || []).filter((s) => sameId(s.seekId, member.id) && !s.paid).reduce((s, r) => s + r.value, 0);
  const totAP = myRefs.filter((r) => !r.paid).reduce((s, r) => s + r.commission, 0) + memberUnpaidSpin;
  const comAP = myRefs.filter((r) => !r.paid && (r.status === "a_pagar" || r.productValue > 0)).reduce((s, r) => s + r.commission, 0);
  const spinPaid = (spinRewards || []).filter((s) => sameId(s.seekId, member.id) && s.paid).reduce((s, r) => s + r.value, 0);
  const cred = credentials[member.id] || { login: member.whatsapp || "", pin: "0000" };
  const myJrs = seekJrs.filter((j) => sameId(j.seekId, member.id));
  const initials = member.name.trim().slice(0, 2).toUpperCase();
  const memberBonusRoleta = (spinRewards || []).filter((s) => sameId(s.seekId, member.id)).reduce((s, r) => s + r.value, 0);
  function ReferralForm({ initial, onCancel, onSave, label }) {
    const [cn, setCn] = useState(initial && initial.clientName || "");
    const [wa, setWa] = useState(initial && initial.whatsapp || "");
    const [prodType, setProdType] = useState(initial && initial.productType || "auto");
    const [val, setVal] = useState(initial && initial.productValue || 0);
    const [date, setDate] = useState(() => initial && initial.year && initial.month ? `${initial.year}-${String(initial.month).padStart(2, "0")}-${String(initial.day || 1).padStart(2, "0")}` : todayISO());
    const commission = val > 0 ? calcCommission(val, prodType, level) : 0;
    function submit(e) {
      e.preventDefault();
      if (!cn.trim()) return;
      const parts = date.split("-").map(Number);
      onSave({ clientName: cn.trim().toUpperCase(), whatsapp: wa, productType: prodType, productValue: val, commission, year: parts[0], month: parts[1], day: parts[2], isNew: false });
    }
    return /* @__PURE__ */ React.createElement("form", { onSubmit: submit, style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement(Fld, { label: "Nome do Cliente" }, /* @__PURE__ */ React.createElement("input", { className: "inp", value: cn, onChange: (e) => setCn(e.target.value.toUpperCase()), placeholder: "Nome completo", autoFocus: true, autoCapitalize: "characters", style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement(Fld, { label: "WhatsApp" }, /* @__PURE__ */ React.createElement(PhoneInput, { value: wa, onChange: setWa })), /* @__PURE__ */ React.createElement(Fld, { label: "Tipo de Produto" }, /* @__PURE__ */ React.createElement(ProductSelect, { value: prodType, onChange: setProdType })), /* @__PURE__ */ React.createElement(Fld, { label: "Valor do Neg\xF3cio" }, /* @__PURE__ */ React.createElement(CurrencyInput, { value: val, onChange: setVal })), /* @__PURE__ */ React.createElement(Fld, { label: "Data" }, /* @__PURE__ */ React.createElement("input", { className: "inp", type: "date", value: date, onChange: (e) => setDate(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Comiss\xE3o (", level.name, " +", (level.bonus * 100).toFixed(0), "%)"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800, fontSize: "1.1rem", color: "var(--green)" } }, fBRL(commission))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-full", onClick: onCancel }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-dark btn-full" }, label)));
  }
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TopBar, { title: member.name.split(" ")[0], left: /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onBack }, /* @__PURE__ */ React.createElement(IcLeft, { s: 18 })), right: /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => setShowEdit(true) }, /* @__PURE__ */ React.createElement(IcEdit, { s: 15 })) }), /* @__PURE__ */ React.createElement("div", { className: "page", style: { paddingBottom: 30 } }, /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "20px 18px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "member-avatar", style: { width: 52, height: 52, borderRadius: 18, fontSize: "1rem" } }, initials), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: "1rem" } }, member.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)", fontWeight: 600, marginTop: 2 } }, "#", String(member.id).padStart(3, "0"), " \xB7 ", myRefs.length, " indica\xE7\xF5es")), /* @__PURE__ */ React.createElement(LevelBadge, { points, small: true })), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement(ProgressBar, { pct: levelProgress(points), className: level.progressClass, label: `${points} pts \u2014 ${level.name}`, sub: `${levelProgress(points)}%` })), (member.whatsapp || member.pixKey) && /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "10px 13px", marginBottom: 10, display: "flex", flexDirection: "column", gap: 5 } }, member.whatsapp && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".8rem", fontWeight: 600, display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement(IcWA, { s: 14, fill: "#25D366" }), maskPhone(member.whatsapp)), member.pixKey && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".8rem", fontWeight: 600 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".6rem", fontWeight: 800, color: "var(--muted)", marginRight: 6 } }, "PIX"), member.pixKey)), myJrs.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "10px 13px", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 6 } }, "SEEK JR (", myJrs.length, ")"), myJrs.map((jr) => /* @__PURE__ */ React.createElement("div", { key: jr.id, style: { fontSize: ".78rem", fontWeight: 600, display: "flex", justifyContent: "space-between", padding: "2px 0" } }, /* @__PURE__ */ React.createElement("span", null, jr.name), /* @__PURE__ */ React.createElement("span", { className: "tag-jr" }, jr.id, "JR")))), /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "10px 13px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 2 } }, "Acesso"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".8rem", fontWeight: 700 } }, maskPhone(cred.login), " \xB7 ", cred.pin)), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", style: { width: 30, height: 30, borderRadius: 9 }, onClick: () => {
    setShowCreds(true);
    setNewPin("");
    setPinErr("");
  } }, /* @__PURE__ */ React.createElement(IcKey, { s: 13 }))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 } }, [
    ["Total Gerado", fBRL(totC), "var(--black)"],
    ["Com. A Pagar", fBRL(comAP), "var(--red)"],
    ["Com. Pagas", fBRL(totP), "var(--green)"],
    ["\u{1F3B0} Roleta Pend.", fBRL(memberUnpaidSpin), "var(--red)"],
    ["\u{1F3B0} Roleta Paga", fBRL(spinPaid), "var(--green)"]
  ].map(([l, v, c], i, arr) => /* @__PURE__ */ React.createElement("div", { key: l, className: "nm-in", style: { padding: "10px 8px", textAlign: "center", gridColumn: i === arr.length - 1 && arr.length % 2 !== 0 ? "span 2" : void 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".52rem", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 } }, l), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".76rem", color: c } }, v))))), onAddReferral && /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark btn-full", style: { padding: 14 }, onClick: () => setShowAdd(true) }, /* @__PURE__ */ React.createElement(IcPlus, { s: 16, c: "#fff" }), "Nova Indica\xE7\xE3o"), (() => {
    const confirmedRefs = myRefs.filter((r) => r.paid || r.status === "a_pagar" || r.productValue > 0);
    const waitingRefs = myRefs.filter((r) => !r.paid && r.status === "aguardando" && !r.productValue);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, confirmedRefs.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { paddingLeft: 4 } }, "Indica\xE7\xF5es"), /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "4px 16px" } }, confirmedRefs.map((r, i) => {
      const digits = (r.whatsapp || "").replace(/\D/g, "");
      const phone = digits ? digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}` : "";
      const pt = PRODUCT_TYPES.find((p) => p.id === r.productType) || PRODUCT_TYPES[0];
      const linkedSpin = (spinRewards || []).find((s) => sameId(s.referralId, r.id));
      return /* @__PURE__ */ React.createElement("div", { key: r.id }, /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".86rem" } }, r.clientName), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", fontWeight: 600 } }, fDate(r))), r.whatsapp && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 } }, phone ? /* @__PURE__ */ React.createElement("a", { href: `https://wa.me/${phone}`, target: "_blank", style: { display: "flex", alignItems: "center", gap: 5, color: "#25D366", textDecoration: "none" } }, /* @__PURE__ */ React.createElement(IcWA, { s: 14, fill: "#25D366" }), maskPhone(r.whatsapp)) : /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 5 } }, /* @__PURE__ */ React.createElement(IcWA, { s: 14, fill: "#25D366" }), maskPhone(r.whatsapp))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".72rem", color: "var(--muted)", marginBottom: 4 } }, pt.icon, " ", pt.name, " \xB7 ", fBRL(r.productValue)), linkedSpin && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", fontWeight: 700, color: "#8833BB", marginBottom: 4 } }, "\u{1F3B0} B\xF4nus roleta: ", fBRL(linkedSpin.value), linkedSpin.paid ? " \u2713" : ""), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, color: r.paid ? "var(--green)" : "var(--red)" } }, fBRL(r.commission)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 7, alignItems: "center" } }, r.status === "pago" || r.paid ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".72rem", fontWeight: 800, color: "var(--green)", display: "inline-flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement(IcCheck, { s: 11 }), "Pago") : onTogglePaid ? /* @__PURE__ */ React.createElement("button", { className: "pill", style: { background: "linear-gradient(135deg,#1D7A3A,#22AA44)", color: "#fff", border: "none", boxShadow: "2px 2px 8px rgba(29,122,58,.3)" }, onClick: () => onTogglePaid(r.id) }, "PAGAR") : /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".72rem", fontWeight: 800, color: "var(--muted)" } }, "A Pagar"), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", style: { width: 28, height: 28, borderRadius: 9 }, onClick: () => setEditRef(r) }, /* @__PURE__ */ React.createElement(IcEdit, { s: 12 })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", style: { width: 28, height: 28, borderRadius: 9 }, onClick: () => {
        if (window.confirm(`Apagar "${r.clientName}"?`)) onDeleteReferral(r.id);
      } }, /* @__PURE__ */ React.createElement(IcTrash, { s: 12, c: "var(--red)" }))))), i < confirmedRefs.length - 1 && /* @__PURE__ */ React.createElement(Div, null));
    }))), waitingRefs.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { paddingLeft: 4, color: "var(--yellow)" } }, "\u23F3 Aguardando confirma\xE7\xE3o"), /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "4px 16px" } }, waitingRefs.map((r, i) => {
      const digits = (r.whatsapp || "").replace(/\D/g, "");
      const phone = digits ? digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}` : "";
      return /* @__PURE__ */ React.createElement("div", { key: r.id }, /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".86rem" } }, r.clientName), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", fontWeight: 600 } }, fDate(r))), r.whatsapp && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 } }, phone ? /* @__PURE__ */ React.createElement("a", { href: `https://wa.me/${phone}`, target: "_blank", style: { display: "flex", alignItems: "center", gap: 5, color: "#25D366", textDecoration: "none" } }, /* @__PURE__ */ React.createElement(IcWA, { s: 14, fill: "#25D366" }), maskPhone(r.whatsapp)) : /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 5 } }, /* @__PURE__ */ React.createElement(IcWA, { s: 14, fill: "#25D366" }), maskPhone(r.whatsapp))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".72rem", fontWeight: 700, color: "var(--yellow)", display: "inline-flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement(IcClock, { s: 11 }), "Aguardando"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 7, alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", style: { width: 28, height: 28, borderRadius: 9 }, onClick: () => setEditRef(r) }, /* @__PURE__ */ React.createElement(IcEdit, { s: 12 })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", style: { width: 28, height: 28, borderRadius: 9 }, onClick: () => {
        if (window.confirm(`Apagar "${r.clientName}"?`)) onDeleteReferral(r.id);
      } }, /* @__PURE__ */ React.createElement(IcTrash, { s: 12, c: "var(--red)" }))))), i < waitingRefs.length - 1 && /* @__PURE__ */ React.createElement(Div, null));
    }))), confirmedRefs.length === 0 && waitingRefs.length === 0 && /* @__PURE__ */ React.createElement(Empty, { text: "Nenhuma indica\xE7\xE3o" }));
  })(), /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark btn-full", style: { padding: 14, marginTop: 4 }, onClick: () => setShowExtrato(true) }, "\u{1F4CB} Extrato"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", style: { color: "var(--red)", padding: 14 }, onClick: () => setDelMember(true) }, /* @__PURE__ */ React.createElement(IcTrash, { s: 14 }), "Excluir membro")), showAdd && /* @__PURE__ */ React.createElement(Sheet, { title: "Nova Indica\xE7\xE3o", onClose: () => setShowAdd(false) }, /* @__PURE__ */ React.createElement(ReferralForm, { onCancel: () => setShowAdd(false), onSave: (d) => {
    onAddReferral(d);
    setShowAdd(false);
  }, label: "Salvar" })), editRef && /* @__PURE__ */ React.createElement(Sheet, { title: "Editar Indica\xE7\xE3o", onClose: () => setEditRef(null) }, /* @__PURE__ */ React.createElement(ReferralForm, { initial: editRef, onCancel: () => setEditRef(null), onSave: (d) => {
    onUpdateReferral(editRef.id, d);
    setEditRef(null);
  }, label: "Salvar" })), showEdit && /* @__PURE__ */ React.createElement(EditMemberForm, { member, onClose: () => setShowEdit(false), onSave: (d) => {
    onUpdateMember(member.id, d);
    setShowEdit(false);
  } }), showExtrato && /* @__PURE__ */ React.createElement(ExtratoModal, { role: "member", isAdm: true, data: { member, referrals: myRefs, jrReferrals, seekJrs, spinRewards: (spinRewards || []).filter((s) => sameId(s.seekId, member.id)) }, onClose: () => setShowExtrato(false), onTogglePaid }), showCreds && (() => {
    const phone = cred.login ? cred.login.startsWith("55") && cred.login.length >= 12 ? cred.login : `55${cred.login}` : "";
    function saveP() {
      if (!/^\d{4}$/.test(newPin)) {
        setPinErr("Deve ter 4 d\xEDgitos.");
        return;
      }
      onUpdatePin(member.id, newPin);
      setPinErr("");
      setNewPin("");
      setShowCreds(false);
    }
    function sendP() {
      const msg = encodeURIComponent(`Ol\xE1 ${member.name}! Nova senha SEEK:
Login: ${maskPhone(cred.login)}
Senha: ${newPin || cred.pin}`);
      window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    }
    return /* @__PURE__ */ React.createElement(Sheet, { title: "Credenciais", onClose: () => setShowCreds(false) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "12px 14px" } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 3 } }, "Login"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700 } }, maskPhone(cred.login))), /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "12px 14px" } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 3 } }, "Senha"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 900, fontSize: "1.8rem", letterSpacing: ".5em" } }, cred.pin)), /* @__PURE__ */ React.createElement(Fld, { label: "Nova senha" }, /* @__PURE__ */ React.createElement(PinInput, { value: newPin, onChange: setNewPin, autoFocus: true }), pinErr && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--red)", fontSize: ".74rem", fontWeight: 700, marginTop: 4 } }, pinErr)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", onClick: () => setShowCreds(false) }, "Fechar"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark btn-full", onClick: saveP }, "Salvar")), phone && /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", onClick: sendP, style: { gap: 8 } }, /* @__PURE__ */ React.createElement(IcWA, { s: 15 }), "WhatsApp")));
  })(), delMember && /* @__PURE__ */ React.createElement(Confirm, { title: "Excluir", msg: `Excluir "${member.name}" e todas as indica\xE7\xF5es?`, onCancel: () => setDelMember(false), onOk: () => {
    onDeleteMember(member.id);
    setDelMember(false);
  } }));
}
function BellPanel({ members, referrals, jrReferrals, seekJrs, onClose, onEditRef, onDeleteRef, onDeleteJrRef, onMarkRead, passReqs }) {
  const allRefs = [...referrals.filter((r) => r.isNew), ...jrReferrals.filter((r) => r.isNew)];
  const newJrs = seekJrs.filter((j) => j.isNew);
  const forgotReqs = (passReqs || []).filter((r) => r.type === "forgot" && !r.resolved);
  const total = allRefs.length + newJrs.length + forgotReqs.length;
  const [expanded, setExpanded] = useState(null);
  function RefCard({ r, isJr, idx }) {
    const seek = isJr ? seekJrs.find((j) => j.id === r.jrId) : members.find((m) => sameId(m.id, r.memberId));
    const seekParent = isJr && seek ? members.find((m) => sameId(m.id, seek.seekId)) : null;
    const pt = PRODUCT_TYPES.find((p) => p.id === r.productType) || PRODUCT_TYPES[0];
    const digits = (r.whatsapp || "").replace(/\D/g, "");
    const phone = digits ? digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}` : "";
    const isExp = expanded === r.id;
    const bg = idx % 2 === 0 ? "#FFFFFF" : "#F4F4F4";
    return /* @__PURE__ */ React.createElement("div", { style: { background: bg, borderRadius: 12, marginBottom: 4, padding: "10px 12px", cursor: "pointer" }, onClick: () => setExpanded(isExp ? null : r.id) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, isJr ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 5, marginBottom: 2 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 900, fontSize: ".95rem" } }, seek ? seek.name : "?"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 900, fontSize: ".82rem", color: "#1565C0" } }, " JR")) : /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 900, fontSize: ".95rem", marginBottom: 2 } }, seek ? seek.name : "?"), isJr && seekParent && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", fontWeight: 600, marginBottom: 2 } }, "Padrinho: ", /* @__PURE__ */ React.createElement("b", { style: { color: "var(--black)" } }, seekParent.name)), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".88rem", color: "var(--green)" } }, r.clientName || "\u2014"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", marginTop: 2 } }, pt.icon, " ", pt.name, " \xB7 ", fDate(r))), /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".7rem", color: "var(--muted)" } }, isExp ? "\u25B4" : "\u25BE")), isExp && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, padding: "12px", borderRadius: 12, background: "rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 8 } }, r.productValue > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".82rem", fontWeight: 700 } }, fBRL(r.productValue), " \xB7 ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--green)" } }, fBRL(r.commission))), r.whatsapp && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".76rem", display: "flex", alignItems: "center", gap: 5 } }, /* @__PURE__ */ React.createElement(IcWA, { s: 14, fill: "#25D366" }), maskPhone(r.whatsapp)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, phone && /* @__PURE__ */ React.createElement("a", { href: `https://wa.me/${phone}`, target: "_blank", style: { textDecoration: "none" } }, /* @__PURE__ */ React.createElement("button", { className: "btn", style: { padding: "7px 12px", fontSize: ".75rem", gap: 5, color: "#25D366" }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement(IcWA, { s: 14, fill: "#25D366" }), "WhatsApp")), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn",
        style: { padding: "7px 12px", fontSize: ".75rem", color: "var(--yellow)" },
        onClick: (e) => {
          e.stopPropagation();
          onEditRef(r);
          onClose();
        }
      },
      /* @__PURE__ */ React.createElement(IcEdit, { s: 13 }),
      "Editar"
    ), !r.paid && /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn",
        style: { padding: "7px 12px", fontSize: ".75rem", color: "var(--red)" },
        onClick: (e) => {
          e.stopPropagation();
          if (window.confirm(`Apagar "${r.clientName}"?`)) {
            isJr ? onDeleteJrRef(r.id) : onDeleteRef(r.id);
          }
        }
      },
      /* @__PURE__ */ React.createElement(IcTrash, { s: 13 }),
      "Apagar"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn",
        style: { padding: "7px 12px", fontSize: ".75rem", color: "var(--muted)" },
        onClick: (e) => {
          e.stopPropagation();
          onMarkRead(r.id, isJr);
        }
      },
      "\u2713 Lido"
    ))));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "overlay", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "sheet", onClick: (e) => e.stopPropagation(), style: { maxHeight: "88vh" } }, /* @__PURE__ */ React.createElement("div", { className: "handle" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement(IcBell, { s: 18, c: "var(--black)" }), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 900, fontSize: "1rem" } }, "Notifica\xE7\xF5es"), total > 0 && /* @__PURE__ */ React.createElement("span", { style: { background: "var(--red)", color: "#fff", fontSize: ".62rem", fontWeight: 900, borderRadius: 99, padding: "2px 8px" } }, total)), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(IcX, { s: 17, c: "var(--muted)" }))), total === 0 && /* @__PURE__ */ React.createElement(Empty, { text: "Nenhuma notifica\xE7\xE3o nova" }), forgotReqs.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "label", style: { marginBottom: 8 } }, "\u{1F510} Solicita\xE7\xF5es de Nova Senha"), forgotReqs.map((req, i) => {
    const digits = req.phone;
    const mb = members.find((m) => (m.whatsapp || "").replace(/\D/g, "") === digits);
    const jrObj = seekJrs.find((j) => (j.whatsapp || "").replace(/\D/g, "") === digits);
    const name = mb ? mb.name : jrObj ? jrObj.name : `Tel: ${maskPhone(digits)}`;
    const bg = i % 2 === 0 ? "#FFFFFF" : "#F4F4F4";
    return /* @__PURE__ */ React.createElement("div", { key: req.id, style: { background: bg, borderRadius: 12, padding: "10px 12px", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".88rem", marginBottom: 4 } }, name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)", marginBottom: 8 } }, maskPhone(digits), " \xB7 Esqueceu a senha"), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn btn-dark",
        style: { padding: "7px 14px", fontSize: ".76rem", gap: 6 },
        onClick: () => onMarkRead(req.id, "forgot")
      },
      /* @__PURE__ */ React.createElement(IcCheck, { s: 13, c: "#fff" }),
      "Resolvido"
    ));
  })), newJrs.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "label", style: { marginBottom: 8 } }, "Novos SEEK JR"), newJrs.map((jr, i) => {
    const seek = members.find((m) => sameId(m.id, jr.seekId));
    const bg = i % 2 === 0 ? "#FFFFFF" : "#F4F4F4";
    return /* @__PURE__ */ React.createElement("div", { key: jr.id, style: { background: bg, borderRadius: 12, padding: "10px 12px", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 5, marginBottom: 2 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 900, fontSize: ".95rem" } }, jr.name), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 900, fontSize: ".82rem", color: "#1565C0" } }, " JR")), seek && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", marginBottom: 2 } }, "Padrinho: ", /* @__PURE__ */ React.createElement("b", { style: { color: "var(--black)" } }, seek.name)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: 5 } }, /* @__PURE__ */ React.createElement(IcWA, { s: 13, fill: "#25D366" }), maskPhone(jr.whatsapp)), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn",
        style: { padding: "5px 10px", fontSize: ".72rem", marginTop: 8, color: "var(--muted)" },
        onClick: () => onMarkRead(jr.id, "jr")
      },
      "\u2713 Lido"
    ));
  })), allRefs.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "label", style: { marginBottom: 8 } }, "Indica\xE7\xF5es (", allRefs.length, ")"), allRefs.map((r, i) => {
    const isJr = !!r.jrId;
    return /* @__PURE__ */ React.createElement(RefCard, { key: r.id, r, isJr, idx: i });
  }))));
}
function OffersPanel({ offers, onClose, isAdm, onAddOffer, onDeleteOffer }) {
  const [showAdd, setShowAdd] = useState(false);
  const [imgUrl, setImgUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("zero-km");
  const [fileErr, setFileErr] = useState("");
  const [lightbox, setLightbox] = useState(null);
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFileErr("Selecione uma imagem.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImgUrl(ev.target.result);
      setFileErr("");
    };
    reader.readAsDataURL(file);
  }
  function saveOffer() {
    if (!imgUrl) {
      setFileErr("Selecione uma imagem.");
      return;
    }
    onAddOffer({ id: Date.now(), url: imgUrl, caption: caption.trim(), category });
    setImgUrl("");
    setCaption("");
    setCategory("zero-km");
    setShowAdd(false);
  }
  function shareOffer(offer) {
    const msg = [
      "\u{1F525} *Se liga nessa oferta!*",
      "",
      offer.caption ? `_${offer.caption}_` : "",
      "",
      "Entre em contato com o Consultor de Vendas Volkswagen Motomec\xE2nica:",
      "",
      "\u{1F464} *Junior Soares*",
      "\u{1F4F1} (51) 99650-9660",
      "https://wa.me/5551996509660"
    ].filter((l, i, a) => !(l === "" && a[i - 1] === "") && l !== void 0).join("\n");
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
  }
  return /* @__PURE__ */ React.createElement("div", { className: "overlay", onClick: lightbox ? void 0 : onClose }, lightbox && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.93)", zIndex: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 },
      onClick: () => setLightbox(null)
    },
    /* @__PURE__ */ React.createElement("img", { src: lightbox.url, style: { maxWidth: "100%", maxHeight: "74vh", borderRadius: 14, objectFit: "contain" }, alt: lightbox.caption || "Oferta" }),
    lightbox.caption && /* @__PURE__ */ React.createElement("div", { style: { color: "#fff", fontWeight: 700, fontSize: ".9rem", marginTop: 12, textAlign: "center" } }, lightbox.caption),
    /* @__PURE__ */ React.createElement("div", { style: { color: "rgba(255,255,255,0.55)", fontSize: ".7rem", fontWeight: 600, marginTop: 10, textAlign: "center" } }, "Compartilhe essa imagem pelo WhatsApp ou salve no seu celular."),
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 12 }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn btn-green",
        style: { padding: "11px 18px", fontSize: ".82rem", gap: 6 },
        onClick: () => shareOffer(lightbox)
      },
      /* @__PURE__ */ React.createElement(IcWA, { s: 16, fill: "#fff" }),
      "\u{1F4F2} WhatsApp"
    ), /* @__PURE__ */ React.createElement("a", { href: lightbox.url, download: "oferta.jpg", style: { textDecoration: "none" }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("button", { className: "btn", style: { padding: "11px 18px", fontSize: ".82rem", gap: 6, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.25)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 } }, "\u{1F4BE} Salvar Imagem")), isAdm && /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "icon-btn",
        style: { width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)" },
        onClick: () => {
          if (window.confirm("Remover esta oferta?")) {
            onDeleteOffer(lightbox.id);
            setLightbox(null);
          }
        }
      },
      /* @__PURE__ */ React.createElement(IcTrash, { s: 15, c: "#ff6b6b" })
    )),
    /* @__PURE__ */ React.createElement("button", { style: { marginTop: 16, background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: ".8rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }, onClick: () => setLightbox(null) }, "Fechar \u2715")
  ), /* @__PURE__ */ React.createElement("div", { className: "sheet", onClick: (e) => e.stopPropagation(), style: { maxHeight: "90vh" } }, /* @__PURE__ */ React.createElement("div", { className: "handle" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "1.1rem" } }, "\u{1F3F7}\uFE0F"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 900, fontSize: "1rem" } }, "Ofertas do M\xEAs")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } }, isAdm && /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark", style: { padding: "8px 14px", fontSize: ".74rem", gap: 5 }, onClick: () => setShowAdd(!showAdd) }, /* @__PURE__ */ React.createElement(IcPlus, { s: 13, c: "#fff" }), "Adicionar"), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(IcX, { s: 17, c: "var(--muted)" })))), showAdd && isAdm && /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "16px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "flex", flexDirection: "column", gap: 6, cursor: "pointer" } }, /* @__PURE__ */ React.createElement("span", { className: "label" }, "Imagem da Oferta"), /* @__PURE__ */ React.createElement("div", { style: { borderRadius: 14, background: "var(--bg)", boxShadow: "var(--nm-in)", padding: imgUrl ? 0 : "28px 20px", textAlign: "center", border: "2px dashed var(--gray)", cursor: "pointer", overflow: "hidden" } }, imgUrl ? /* @__PURE__ */ React.createElement("img", { src: imgUrl, style: { width: "100%", maxHeight: 240, objectFit: "cover", display: "block", borderRadius: 12 }, alt: "preview" }) : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "2rem", marginBottom: 8 } }, "\u{1F4F7}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".78rem", color: "var(--muted)", fontWeight: 600 } }, "Toque para selecionar imagem"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", marginTop: 4 } }, "Propor\xE7\xE3o ideal: 9:16")), /* @__PURE__ */ React.createElement("input", { type: "file", accept: "image/*", onChange: handleFile, style: { display: "none" } }))), fileErr && /* @__PURE__ */ React.createElement("div", { style: { color: "var(--red)", fontSize: ".76rem", fontWeight: 700 } }, fileErr), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, [["zero-km", "\u{1F697} Zero KM"], ["semi-novo", "\u{1F698} Semi Novo"]].map(([id, lbl]) => /* @__PURE__ */ React.createElement("button", { key: id, type: "button", onClick: () => setCategory(id), style: { flex: 1, padding: "9px 6px", borderRadius: 10, border: `2px solid ${category === id ? "var(--green)" : "var(--gray)"}`, background: category === id ? "rgba(29,122,58,.1)" : "transparent", fontWeight: 700, fontSize: ".78rem", cursor: "pointer", fontFamily: "inherit", color: category === id ? "var(--green)" : "var(--muted)" } }, lbl))), /* @__PURE__ */ React.createElement(Fld, { label: "Legenda (opcional)" }, /* @__PURE__ */ React.createElement("input", { className: "inp", value: caption, onChange: (e) => setCaption(e.target.value), placeholder: "Descri\xE7\xE3o da oferta...", style: { textTransform: "none" } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", onClick: () => {
    setShowAdd(false);
    setImgUrl("");
    setCaption("");
  } }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark btn-full", onClick: saveOffer }, "Publicar"))), offers.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: isAdm ? "Nenhuma oferta. Toque em Adicionar!" : "Nenhuma oferta dispon\xEDvel no momento." }) : /* @__PURE__ */ React.createElement("div", null, [["zero-km", "\u{1F697} Autom\xF3veis Zero KM"], ["semi-novo", "\u{1F698} Autom\xF3veis Semi Novos"]].map(([cat, label]) => {
    const catOffers = offers.filter((o) => cat === "zero-km" ? o.category === cat || !o.category : o.category === cat);
    if (catOffers.length === 0) return null;
    return /* @__PURE__ */ React.createElement("div", { key: cat, style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".78rem", color: "var(--muted)", marginBottom: 8, letterSpacing: ".04em" } }, label), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 } }, catOffers.map((offer) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: offer.id,
        style: { cursor: "pointer", borderRadius: 10, overflow: "hidden", position: "relative", aspectRatio: "9/14", boxShadow: "3px 3px 8px rgba(0,0,0,0.14),-2px -2px 6px rgba(255,255,255,0.9)" },
        onClick: () => setLightbox(offer)
      },
      /* @__PURE__ */ React.createElement("img", { src: offer.url, style: { width: "100%", height: "100%", objectFit: "cover", display: "block" }, alt: offer.caption || "Oferta" }),
      offer.caption && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,0.72))", padding: "14px 4px 4px", fontSize: ".48rem", color: "#fff", fontWeight: 700, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, offer.caption)
    ))));
  }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".64rem", color: "var(--muted)", textAlign: "center", fontWeight: 600, letterSpacing: ".04em" } }, "Toque em uma imagem para ampliar e compartilhar"))));
}
function FipeConsulta() {
  const FIPE_BASE = "https://parallelum.com.br/fipe/api/v1";
  const TIPOS = [{ id: "carros", l: "\u{1F697} Carro" }, { id: "motos", l: "\u{1F3CD}\uFE0F Moto" }, { id: "caminhoes", l: "\u{1F69B} Caminh\xE3o" }];
  const ERR = "N\xE3o foi poss\xEDvel carregar os dados FIPE. Verifique sua conex\xE3o.";
  const [tipo, setTipo] = React.useState(null);
  const [marcas, setMarcas] = React.useState([]);
  const [marca, setMarca] = React.useState("");
  const [modelos, setModelos] = React.useState([]);
  const [modelo, setModelo] = React.useState("");
  const [anos, setAnos] = React.useState([]);
  const [ano, setAno] = React.useState("");
  const [resultado, setResultado] = React.useState(null);
  const [loading, setLoading] = React.useState("");
  const [erro, setErro] = React.useState("");
  async function apiFetch(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error();
    return r.json();
  }
  async function onTipo(t) {
    setTipo(t);
    setMarcas([]);
    setMarca("");
    setModelos([]);
    setModelo("");
    setAnos([]);
    setAno("");
    setResultado(null);
    setErro("");
    setLoading("marcas");
    try {
      const d = await apiFetch(`${FIPE_BASE}/${t}/marcas`);
      setMarcas(d);
    } catch (e) {
      setErro(ERR);
    } finally {
      setLoading("");
    }
  }
  async function onMarca(v) {
    setMarca(v);
    setModelos([]);
    setModelo("");
    setAnos([]);
    setAno("");
    setResultado(null);
    setErro("");
    if (!v) return;
    setLoading("modelos");
    try {
      const d = await apiFetch(`${FIPE_BASE}/${tipo}/marcas/${v}/modelos`);
      setModelos(d.modelos || d);
    } catch (e) {
      setErro(ERR);
    } finally {
      setLoading("");
    }
  }
  async function onModelo(v) {
    setModelo(v);
    setAnos([]);
    setAno("");
    setResultado(null);
    setErro("");
    if (!v) return;
    setLoading("anos");
    try {
      const d = await apiFetch(`${FIPE_BASE}/${tipo}/marcas/${marca}/modelos/${v}/anos`);
      setAnos(d);
    } catch (e) {
      setErro(ERR);
    } finally {
      setLoading("");
    }
  }
  async function onAno(v) {
    setAno(v);
    setResultado(null);
    setErro("");
    if (!v) return;
    setLoading("resultado");
    try {
      const d = await apiFetch(`${FIPE_BASE}/${tipo}/marcas/${marca}/modelos/${modelo}/anos/${v}`);
      setResultado(d);
    } catch (e) {
      setErro(ERR);
    } finally {
      setLoading("");
    }
  }
  function reset() {
    setTipo(null);
    setMarcas([]);
    setMarca("");
    setModelos([]);
    setModelo("");
    setAnos([]);
    setAno("");
    setResultado(null);
    setErro("");
  }
  return /* @__PURE__ */ React.createElement("div", { className: "page", style: { paddingBottom: 120 } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 0 4px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".6rem", fontWeight: 900, letterSpacing: ".14em", color: "var(--muted)", textTransform: "uppercase" } }, "Tabela FIPE")), /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "16px 18px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { className: "label" }, "Tipo de Ve\xEDculo"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, TIPOS.map(({ id, l }) => /* @__PURE__ */ React.createElement("button", { key: id, className: `btn${tipo === id ? " btn-dark" : ""}`, style: { flex: 1, padding: "10px 4px", fontSize: ".73rem" }, onClick: () => onTipo(id) }, l)))), tipo && /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "16px 18px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { className: "label" }, "Marca"), loading === "marcas" ? /* @__PURE__ */ React.createElement("div", { style: { color: "var(--muted)", fontSize: ".8rem", padding: "8px 0" } }, "Carregando...") : /* @__PURE__ */ React.createElement("select", { className: "inp", value: marca, onChange: (e) => onMarca(e.target.value), disabled: marcas.length === 0 }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Selecione a marca"), marcas.map((m) => /* @__PURE__ */ React.createElement("option", { key: m.codigo, value: m.codigo }, m.nome)))), marca && /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "16px 18px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { className: "label" }, "Modelo"), loading === "modelos" ? /* @__PURE__ */ React.createElement("div", { style: { color: "var(--muted)", fontSize: ".8rem", padding: "8px 0" } }, "Carregando...") : /* @__PURE__ */ React.createElement("select", { className: "inp", value: modelo, onChange: (e) => onModelo(e.target.value), disabled: modelos.length === 0 }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Selecione o modelo"), modelos.map((m) => /* @__PURE__ */ React.createElement("option", { key: m.codigo, value: m.codigo }, m.nome)))), modelo && /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "16px 18px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { className: "label" }, "Ano"), loading === "anos" ? /* @__PURE__ */ React.createElement("div", { style: { color: "var(--muted)", fontSize: ".8rem", padding: "8px 0" } }, "Carregando...") : /* @__PURE__ */ React.createElement("select", { className: "inp", value: ano, onChange: (e) => onAno(e.target.value), disabled: anos.length === 0 }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Selecione o ano"), anos.map((a) => /* @__PURE__ */ React.createElement("option", { key: a.codigo, value: a.codigo }, a.nome)))), loading === "resultado" && /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: 24, textAlign: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "var(--muted)", fontSize: ".85rem" } }, "Buscando dados FIPE...")), resultado && loading === "" && /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "20px 18px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "2rem", fontWeight: 900, color: "var(--green)" } }, resultado.Valor), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".65rem", color: "var(--muted)", fontWeight: 700, marginTop: 2, letterSpacing: ".06em", textTransform: "uppercase" } }, "Pre\xE7o M\xE9dio FIPE")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", fontSize: ".75rem", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--muted)", fontWeight: 700, fontSize: ".63rem", display: "block", marginBottom: 2, textTransform: "uppercase", letterSpacing: ".06em" } }, "C\xF3digo FIPE"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800 } }, resultado.CodigoFipe)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--muted)", fontWeight: 700, fontSize: ".63rem", display: "block", marginBottom: 2, textTransform: "uppercase", letterSpacing: ".06em" } }, "Combust\xEDvel"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800 } }, resultado.Combustivel)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--muted)", fontWeight: 700, fontSize: ".63rem", display: "block", marginBottom: 2, textTransform: "uppercase", letterSpacing: ".06em" } }, "Marca"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800 } }, resultado.Marca)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--muted)", fontWeight: 700, fontSize: ".63rem", display: "block", marginBottom: 2, textTransform: "uppercase", letterSpacing: ".06em" } }, "Ano Modelo"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800 } }, resultado.AnoModelo)), /* @__PURE__ */ React.createElement("div", { style: { gridColumn: "1/-1" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--muted)", fontWeight: 700, fontSize: ".63rem", display: "block", marginBottom: 2, textTransform: "uppercase", letterSpacing: ".06em" } }, "Modelo"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800 } }, resultado.Modelo)), /* @__PURE__ */ React.createElement("div", { style: { gridColumn: "1/-1" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--muted)", fontWeight: 700, fontSize: ".63rem", display: "block", marginBottom: 2, textTransform: "uppercase", letterSpacing: ".06em" } }, "Refer\xEAncia"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800 } }, resultado.MesReferencia))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", style: { padding: 12 }, onClick: reset }, "\u{1F504} Nova Consulta")), erro && /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 16px", color: "var(--red)", fontSize: ".8rem", fontWeight: 700, background: "rgba(220,38,38,.08)", borderRadius: 14, marginBottom: 12 } }, "\u26A0\uFE0F ", erro));
}
function AdmTabBar({ view, setView, onOffers }) {
  const tabs = [{ id: "dashboard", l: "Painel", I: IcGrid }, { id: "members", l: "SEEK", I: IcUsers }, { id: "remuneracao", l: "Regras", I: IcBook }];
  const active = view === "memberDetail" ? "members" : ["pending", "paid"].includes(view) ? "dashboard" : view;
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 640, zIndex: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "tab-bar" }, tabs.map(({ id, l, I }) => /* @__PURE__ */ React.createElement("button", { key: id, className: `tab${active === id ? " on" : ""}`, onClick: () => setView(id) }, /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(I, { s: 20, c: active === id ? "var(--black)" : "var(--muted)" })), /* @__PURE__ */ React.createElement("span", null, l))), /* @__PURE__ */ React.createElement("button", { className: `tab${active === "fipe" ? " on" : ""}`, onClick: () => setView("fipe") }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "1.1rem", lineHeight: 1 } }, "\u{1F4CA}"), /* @__PURE__ */ React.createElement("span", null, "FIPE")), /* @__PURE__ */ React.createElement("button", { className: "tab", onClick: onOffers }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "1.1rem", lineHeight: 1 } }, "\u{1F3F7}\uFE0F"), /* @__PURE__ */ React.createElement("span", null, "Ofertas"))));
}
function AdmLedger({ title, referrals, members, seekJrs, paid, onBack, onTogglePaid, onToggleJrPaid, spinRewards, onToggleSpinPaid, readOnly = false }) {
  const fil = [...referrals].filter((r) => r.paid === paid).sort((a, b) => new Date(b.year, (b.month || 1) - 1, b.day || 1) - new Date(a.year, (a.month || 1) - 1, a.day || 1));
  const spinFil = !paid ? (spinRewards || []).filter((s) => !s.paid) : [];
  const spinTotal = spinFil.reduce((s, r) => s + r.value, 0);
  const comTotal = fil.reduce((s, r) => s + r.commission, 0);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TopBar, { title, left: /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onBack }, /* @__PURE__ */ React.createElement(IcLeft, { s: 18 })) }), /* @__PURE__ */ React.createElement("div", { className: "page" }, /* @__PURE__ */ React.createElement(StatCard, { label: paid ? "Total Pago" : "Total a Pagar", value: fBRL(comTotal + spinTotal), color: paid ? "var(--green)" : "var(--red)" }), /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "6px 16px" } }, fil.length === 0 && spinFil.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: paid ? "Nenhuma paga." : "Tudo em dia!" }) : /* @__PURE__ */ React.createElement(React.Fragment, null, fil.map((r, i) => {
    const isJrRef = !!r.jrId;
    const m = isJrRef ? (seekJrs || []).find((j) => sameId(j.id, r.jrId)) : members.find((x) => sameId(x.id, r.memberId));
    const pt = PRODUCT_TYPES.find((p) => p.id === r.productType) || PRODUCT_TYPES[0];
    return /* @__PURE__ */ React.createElement("div", { key: r.id }, /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".86rem", display: "flex", alignItems: "center", gap: 5 } }, m ? m.name : "?", isJrRef && /* @__PURE__ */ React.createElement("span", { className: "tag-jr" }, "JR")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)", fontWeight: 600, marginTop: 2 } }, r.clientName), r.productValue > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", marginTop: 2 } }, pt.icon, " ", pt.name, " \xB7 ", fBRL(r.productValue))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", fontWeight: 600, flexShrink: 0 } }, fDate(r))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, color: paid ? "var(--green)" : "var(--red)" } }, fBRL(r.commission)), paid ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".72rem", fontWeight: 800, color: "var(--green)", display: "inline-flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement(IcCheck, { s: 11 }), "Pago") : readOnly ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".72rem", fontWeight: 800, color: "var(--muted)" } }, "A Pagar") : /* @__PURE__ */ React.createElement("button", { className: "pill", style: { background: "linear-gradient(135deg,#1D7A3A,#22AA44)", color: "#fff", border: "none", boxShadow: "2px 2px 8px rgba(29,122,58,.3)" }, onClick: () => isJrRef && onToggleJrPaid ? onToggleJrPaid(r.id) : onTogglePaid(r.id) }, "PAGAR"))), (i < fil.length - 1 || spinFil.length > 0) && /* @__PURE__ */ React.createElement(Div, null));
  }), spinFil.map((s, i) => {
    const seek = s.seekId ? members.find((m) => sameId(m.id, s.seekId)) : null;
    const jr = s.jrId ? (seekJrs || []).find((j) => sameId(j.id, s.jrId)) : null;
    const nome = seek ? seek.name : jr ? jr.name + "JR" : "?";
    const dt = s.createdAt ? new Date(s.createdAt) : null;
    const dtStr = dt ? `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}` : "";
    return /* @__PURE__ */ React.createElement("div", { key: "sp_" + s.id }, /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".86rem", color: "#8833BB" } }, "\u{1F3B0} B\xF4nus Roleta"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)", fontWeight: 600, marginTop: 2 } }, nome)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", fontWeight: 600, flexShrink: 0 } }, dtStr)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, color: "var(--red)" } }, fBRL(s.value)), paid ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".72rem", fontWeight: 800, color: "var(--green)", display: "inline-flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement(IcCheck, { s: 11 }), "Pago") : readOnly ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".72rem", fontWeight: 800, color: "var(--muted)" } }, "A Pagar") : onToggleSpinPaid && /* @__PURE__ */ React.createElement("button", { className: "pill", style: { background: "linear-gradient(135deg,#1D7A3A,#22AA44)", color: "#fff", border: "none", boxShadow: "2px 2px 8px rgba(29,122,58,.3)" }, onClick: () => onToggleSpinPaid(s.id) }, "PAGAR"))), i < spinFil.length - 1 && /* @__PURE__ */ React.createElement(Div, null));
  })))));
}
function MasterDashboard({ adms, members, referrals, jrReferrals, seekJrs, sm, setSm, sy, setSy, onNav, passReqs, onSelectAdm, spinRewards }) {
  const curY = (/* @__PURE__ */ new Date()).getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => curY - 2 + i);
  const fil = referrals.filter((r) => r.month === sm && r.year === sy);
  const jrFil = jrReferrals.filter((r) => r.month === sm && r.year === sy);
  const allFil = [...fil, ...jrFil];
  const totV = allFil.reduce((s, r) => s + r.productValue, 0);
  const spinAP = (spinRewards || []).filter((s) => !s.paid).reduce((s, r) => s + r.value, 0);
  const comAP = [...referrals, ...jrReferrals].filter((r) => !r.paid).reduce((s, r) => s + r.commission, 0) + spinAP;
  const comP = allFil.filter((r) => r.paid).reduce((s, r) => s + r.commission, 0);
  const allTotV = [...referrals, ...jrReferrals].reduce((s, r) => s + r.productValue, 0);
  const pendReqs = (passReqs || []).filter((r) => !r.resolved);
  const admStats = adms.map((adm) => {
    const mids = members.filter((m) => sameId(m.admId, adm.id)).map((m) => String(m.id));
    const jids = seekJrs.filter((j) => mids.some((id) => sameId(j.seekId, id))).map((j) => String(j.id));
    const ar = fil.filter((r) => mids.some((id) => sameId(r.memberId, id)));
    const jr = jrFil.filter((r) => jids.some((id) => sameId(r.jrId, id)));
    const vol = [...ar, ...jr].reduce((s, r) => s + r.productValue, 0);
    const comm = [...ar, ...jr].reduce((s, r) => s + r.commission, 0);
    return { adm, vol, comm, seeks: mids.length };
  }).sort((a, b) => b.vol - a.vol);
  return /* @__PURE__ */ React.createElement("div", { className: "page", style: { paddingTop: 8, paddingBottom: 110 } }, pendReqs.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "12px 16px", border: "1.5px solid rgba(192,57,43,.3)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".8rem", color: "var(--red)" } }, "\u{1F510} ", pendReqs.length, " solicita\xE7\xE3o(\xF5es) de senha pendente(s)")), /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "14px 16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("select", { className: "inp", style: { flex: 1 }, value: sm, onChange: (e) => setSm(Number(e.target.value)) }, MONTHS.map((m, i) => /* @__PURE__ */ React.createElement("option", { key: m, value: i + 1 }, m))), /* @__PURE__ */ React.createElement("select", { className: "inp", style: { width: 90 }, value: sy, onChange: (e) => setSy(Number(e.target.value)) }, years.map((y) => /* @__PURE__ */ React.createElement("option", { key: y, value: y }, y))))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement(StatCard, { label: "Vendas no M\xEAs", value: fil.length + jrFil.length }), /* @__PURE__ */ React.createElement(StatCard, { label: "Volume", value: fBRL(totV) }), /* @__PURE__ */ React.createElement(StatCard, { label: "A Pagar", value: fBRL(comAP), color: "var(--red)" }), /* @__PURE__ */ React.createElement(StatCard, { label: "Pago", value: fBRL(comP), color: "var(--green)" })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, [["A Pagar", [...referrals, ...jrReferrals].filter((r) => !r.paid).length + (spinRewards || []).filter((s) => !s.paid).length, "var(--red)", "pending", IcClock], ["Pagas", [...referrals, ...jrReferrals].filter((r) => r.paid).length, "var(--green)", "paid", IcCheck]].map(([l, v, c, dest, Ico]) => /* @__PURE__ */ React.createElement("button", { key: l, className: "nm", style: { padding: "16px 14px", textAlign: "left", border: "none", cursor: "pointer", background: "var(--bg)" }, onClick: () => onNav(dest) }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 8, display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement(Ico, { s: 11, c }), l), /* @__PURE__ */ React.createElement("div", { className: "stat-n", style: { fontSize: "1.1rem", color: c } }, v)))), (spinRewards || []).filter((s) => !s.paid).length > 0 && /* @__PURE__ */ React.createElement(StatCard, { label: "\u{1F3B0} B\xF4nus Roleta Pendente", value: fBRL((spinRewards || []).filter((s) => !s.paid).reduce((s, r) => s + r.value, 0)), color: "#8833BB" }), admStats.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { paddingLeft: 4 } }, "Ranking Vendedores \u2014 ", MONTHS[sm - 1], " ", sy), /* @__PURE__ */ React.createElement("div", { className: "nm", style: { padding: "6px 16px" } }, admStats.map((item, i) => /* @__PURE__ */ React.createElement("div", { key: item.adm.id }, /* @__PURE__ */ React.createElement("button", { style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }, onClick: () => onSelectAdm(item.adm) }, /* @__PURE__ */ React.createElement("div", { style: { width: 34, height: 34, borderRadius: 12, background: "var(--bg)", boxShadow: "var(--nm-out)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: ".78rem", flexShrink: 0 } }, i + 1), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, item.adm.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", marginTop: 1 } }, item.seeks, " SEEK", item.seeks !== 1 ? "s" : "", " \xB7 ", fBRL(item.vol))), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, color: "var(--green)", flexShrink: 0, fontSize: ".84rem" } }, fBRL(item.comm))), i < admStats.length - 1 && /* @__PURE__ */ React.createElement("div", { className: "divider" }))))), admStats.length === 0 && /* @__PURE__ */ React.createElement(Empty, { text: "Nenhum vendedor cadastrado ainda" }));
}
function MasterVendedores({ adms, members, referrals, jrReferrals, seekJrs, credentials, onAdd, onDelete, onSelect, onUpdatePin }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [credAdm, setCredAdm] = useState(null);
  const [newPin, setNewPin] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);
  const filtered = [...adms].filter((a) => a.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  function AdmForm({ onCancel, onSave }) {
    const [name, setName] = useState("");
    const [wa, setWa] = useState("");
    const [pix, setPix] = useState("");
    const [pin, setPin] = useState("0000");
    const [pe, setPe] = useState("");
    function submit(e) {
      e.preventDefault();
      if (!name.trim()) return;
      if (!/^\d{4}$/.test(pin)) {
        setPe("Deve ter 4 d\xEDgitos.");
        return;
      }
      onSave({ name: name.trim().toUpperCase(), whatsapp: wa, pixKey: pix.trim().toUpperCase(), pin });
    }
    return /* @__PURE__ */ React.createElement("form", { onSubmit: submit, style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement(Fld, { label: "Nome do Vendedor" }, /* @__PURE__ */ React.createElement("input", { className: "inp", value: name, onChange: (e) => setName(e.target.value.toUpperCase()), placeholder: "Nome completo", autoFocus: true, autoCapitalize: "characters", style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement(Fld, { label: "Telefone (Login \u2014 somente n\xFAmeros)" }, /* @__PURE__ */ React.createElement(PlainPhoneInput, { value: wa, onChange: setWa })), /* @__PURE__ */ React.createElement(Fld, { label: "Chave PIX" }, /* @__PURE__ */ React.createElement("input", { className: "inp", value: pix, onChange: (e) => setPix(e.target.value.toUpperCase()), placeholder: "CPF, E-MAIL OU CHAVE", autoCapitalize: "characters", style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "14px", display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)" } }, "\u{1F511} Acesso ao App"), /* @__PURE__ */ React.createElement(Fld, { label: "Senha inicial" }, /* @__PURE__ */ React.createElement(PinInput, { value: pin, onChange: setPin }), pe && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--red)", fontSize: ".74rem", fontWeight: 700 } }, pe))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-full", onClick: onCancel }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-dark btn-full" }, "Cadastrar")));
  }
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TopBar, { title: "Vendedores", right: /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark", style: { padding: "9px 14px", fontSize: ".74rem", borderRadius: 14 }, onClick: () => setShowAdd(true) }, /* @__PURE__ */ React.createElement(IcPlus, { s: 14, c: "#fff" }), "Novo") }), /* @__PURE__ */ React.createElement("div", { className: "page", style: { paddingBottom: 110 } }, /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" } }, /* @__PURE__ */ React.createElement(IcSrch, { s: 16 })), /* @__PURE__ */ React.createElement("input", { className: "inp", style: { paddingLeft: 42, textTransform: "uppercase" }, placeholder: "Buscar vendedor", value: search, onChange: (e) => setSearch(e.target.value.toUpperCase()), autoCapitalize: "characters" })), filtered.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "Nenhum vendedor cadastrado" }) : filtered.map((adm) => {
    const admMembers = members.filter((m) => sameId(m.admId, adm.id));
    const cred = credentials[`adm_${adm.id}`] || {};
    const initials = adm.name.trim().slice(0, 2).toUpperCase();
    return /* @__PURE__ */ React.createElement("div", { key: adm.id, className: "nm", style: { padding: "13px 16px", display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { style: { display: "flex", alignItems: "center", gap: 12, flex: 1, background: "none", border: "none", cursor: "pointer", minWidth: 0, textAlign: "left" }, onClick: () => onSelect(adm) }, /* @__PURE__ */ React.createElement("div", { className: "member-avatar" }, initials), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, adm.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", fontWeight: 600, marginTop: 2 } }, admMembers.length, " SEEK", admMembers.length !== 1 ? "s" : "", cred.login ? ` \xB7 ${maskPhone(cred.login)}` : ""))), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => {
      setCredAdm(adm);
      setNewPin("");
      setPinErr("");
    } }, /* @__PURE__ */ React.createElement(IcKey, { s: 14 })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => setConfirmDel(adm) }, /* @__PURE__ */ React.createElement(IcTrash, { s: 14, c: "var(--red)" })));
  })), showAdd && /* @__PURE__ */ React.createElement(Sheet, { title: "Novo Vendedor", onClose: () => setShowAdd(false) }, /* @__PURE__ */ React.createElement(AdmForm, { onCancel: () => setShowAdd(false), onSave: (d) => {
    onAdd(d);
    setShowAdd(false);
  } })), confirmDel && /* @__PURE__ */ React.createElement(Confirm, { title: "Excluir vendedor", msg: `Excluir "${confirmDel.name}" e todos os seus dados?`, onCancel: () => setConfirmDel(null), onOk: () => {
    onDelete(confirmDel.id);
    setConfirmDel(null);
  } }), credAdm && (() => {
    const cred = credentials[`adm_${credAdm.id}`] || { login: credAdm.whatsapp || "", pin: "0000" };
    const rawL = (cred.login || "").replace(/\D/g, "");
    const waPhone = rawL.startsWith("55") && rawL.length >= 12 ? rawL : `55${rawL}`;
    function savePin() {
      if (!/^\d{4}$/.test(newPin)) {
        setPinErr("Deve ter 4 d\xEDgitos.");
        return;
      }
      onUpdatePin(`adm_${credAdm.id}`, newPin);
      setPinErr("");
      setNewPin("");
      setCredAdm(null);
    }
    function sendWA() {
      const msg = encodeURIComponent(`Ol\xE1 ${credAdm.name}! Credenciais SEEK:
Login: ${maskPhone(rawL)}
Senha: ${cred.pin}`);
      window.open(`https://wa.me/${waPhone}?text=${msg}`, "_blank");
    }
    return /* @__PURE__ */ React.createElement(Sheet, { title: "Credenciais Vendedor", onClose: () => setCredAdm(null) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "12px 14px" } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 3 } }, "Login"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700 } }, maskPhone(rawL) || "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "12px 14px" } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 3 } }, "Senha atual"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 900, fontSize: "1.8rem", letterSpacing: ".5em" } }, cred.pin)), /* @__PURE__ */ React.createElement(Fld, { label: "Nova senha" }, /* @__PURE__ */ React.createElement(PinInput, { value: newPin, onChange: setNewPin, autoFocus: true }), pinErr && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--red)", fontSize: ".74rem", fontWeight: 700, marginTop: 4 } }, pinErr)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", onClick: () => setCredAdm(null) }, "Fechar"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark btn-full", onClick: savePin }, "Salvar")), rawL && /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", onClick: sendWA, style: { gap: 8 } }, /* @__PURE__ */ React.createElement(IcWA, { s: 15, fill: "var(--green)" }), "Enviar por WhatsApp")));
  })());
}
function MasterPanel({ adms, members, referrals, jrReferrals, seekJrs, credentials, offers, passReqs, levelNotifs, onLogout, onAddAdm, onDeleteAdm, onAddMember, onUpdateMember, onDeleteMember, onUpdatePin, onAddReferral, onUpdateReferral, onTogglePaid, onDeleteReferral, onAddSeekJr, onDeleteSeekJr, onAddJrReferral, onToggleJrPaid, onDeleteJrReferral, onAddOffer, onDeleteOffer, onMarkRead, spinRewards, onMarkSold, onUpdateJrReferral, onToggleSpinPaid }) {
  const [view, setView] = useState("dashboard");
  const [selAdm, setSelAdm] = useState(null);
  const [selMember, setSelMember] = useState(null);
  const [editRefDirect, setEditRefDirect] = useState(null);
  const [showBell, setShowBell] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [showExtrato, setShowExtrato] = useState(false);
  const now = /* @__PURE__ */ new Date();
  const [sm, setSm] = useState(now.getMonth() + 1);
  const [sy, setSy] = useState(now.getFullYear());
  const pendReqs = (passReqs || []).filter((r) => !r.resolved);
  const newRefs = [...referrals, ...jrReferrals].filter((r) => r.isNew);
  const newJrs = seekJrs.filter((j) => j.isNew);
  const badge = pendReqs.length + newRefs.length + newJrs.length;
  const allRefs = [...referrals, ...jrReferrals];
  const scopeMembers = selAdm ? members.filter((m) => sameId(m.admId, selAdm.id)) : members;
  const scopeJrs = selAdm ? seekJrs.filter((j) => scopeMembers.some((m) => sameId(m.id, j.seekId))) : seekJrs;
  const scopeRefs = selAdm ? referrals.filter((r) => scopeMembers.some((m) => sameId(m.id, r.memberId))) : referrals;
  const scopeJrRefs = selAdm ? jrReferrals.filter((r) => scopeJrs.some((j) => sameId(j.id, r.jrId))) : jrReferrals;
  const curMember = selMember ? scopeMembers.find((m) => sameId(m.id, selMember.id)) ?? selMember : null;
  function nav(dest, payload) {
    if (dest === "editRef") {
      setEditRefDirect(payload);
      setView("editRef");
    } else setView(dest);
  }
  function goAdm(adm) {
    setSelAdm(adm);
    setView("vendedorDetail");
  }
  const masterTabs = [{ id: "dashboard", l: "Painel", I: IcGrid }, { id: "vendedores", l: "Vendedores", I: IcUsers }, { id: "membros", l: "SEEK", I: IcBook }, { id: "remuneracao", l: "Regras", I: IcStar }];
  const activeTab = view === "memberDetail" ? "membros" : view === "vendedorDetail" ? "vendedores" : ["pending", "paid"].includes(view) ? "dashboard" : view;
  const inSubView = ["memberDetail", "pending", "paid", "editRef", "vendedorDetail"].includes(view);
  return /* @__PURE__ */ React.createElement("div", { style: { "--bg": "var(--bg-master)", background: "var(--bg-master)", minHeight: "100vh", maxWidth: 640, margin: "0 auto", position: "relative" } }, /* @__PURE__ */ React.createElement(TopBar, { logo: "SEEK NETWORK", right: /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { style: { position: "relative" }, className: "icon-btn", onClick: () => setShowBell(true) }, badge > 0 && /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", top: -4, right: -4, background: "var(--red)", color: "#fff", fontSize: ".5rem", fontWeight: 900, borderRadius: 99, padding: "1px 4px" } }, badge), /* @__PURE__ */ React.createElement(IcBell, { s: 18, c: "var(--muted)" })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onLogout }, /* @__PURE__ */ React.createElement(IcOut, { s: 17, c: "var(--muted)" }))) }), /* @__PURE__ */ React.createElement("div", { style: { padding: "4px 16px 8px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.55rem", fontWeight: 900, color: "var(--black)", letterSpacing: ".06em" } }, "MASTER")), view === "dashboard" && /* @__PURE__ */ React.createElement(MasterDashboard, { adms, members, referrals, jrReferrals, seekJrs, sm, setSm, sy, setSy, onNav: nav, passReqs, onSelectAdm: goAdm, spinRewards }), view === "vendedores" && /* @__PURE__ */ React.createElement(MasterVendedores, { adms, members, referrals, jrReferrals, seekJrs, credentials, onAdd: onAddAdm, onDelete: onDeleteAdm, onSelect: goAdm, onUpdatePin }), view === "vendedorDetail" && selAdm && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { padding: "5px 16px 0", textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".76rem", fontWeight: 800 } }, selAdm.name)), /* @__PURE__ */ React.createElement(AdmDashboard, { members: scopeMembers, referrals: scopeRefs, jrReferrals: scopeJrRefs, seekJrs: scopeJrs, sm, setSm, sy, setSy, onNav: nav, passReqs, credentials, onDeleteRef: onDeleteReferral, onDeleteJrRef: onDeleteJrReferral, spinRewards, hideAdmCommission: true })), view === "membros" && /* @__PURE__ */ React.createElement(AdmMembers, { members: scopeMembers, referrals: scopeRefs, jrReferrals: scopeJrRefs, seekJrs: scopeJrs, credentials, onSelect: (m) => {
    setSelMember(m);
    setView("memberDetail");
  }, onAdd: selAdm ? (d) => onAddMember(d, selAdm.id) : null, onDelete: onDeleteMember, onUpdatePin, onDeleteJr: onDeleteSeekJr }), view === "memberDetail" && curMember && /* @__PURE__ */ React.createElement(AdmMemberDetail, { member: curMember, referrals: scopeRefs, jrReferrals: scopeJrRefs, seekJrs: scopeJrs, credentials, onBack: () => {
    setSelMember(null);
    setView(selAdm ? "vendedorDetail" : "membros");
  }, onAddReferral: (d) => onAddReferral(d, curMember.id), onUpdateReferral, onDeleteReferral, onDeleteMember: (id) => {
    onDeleteMember(id);
    setSelMember(null);
    setView(selAdm ? "vendedorDetail" : "membros");
  }, onUpdateMember, onUpdatePin, spinRewards }), view === "pending" && /* @__PURE__ */ React.createElement(LedgerPorSeek, { members, seekJrs, referrals, jrReferrals, spinRewards, paid: false, onBack: () => setView("dashboard"), readOnly: true }), view === "paid" && /* @__PURE__ */ React.createElement(LedgerPorSeek, { members, seekJrs, referrals, jrReferrals, spinRewards, paid: true, onBack: () => setView("dashboard"), readOnly: true }), view === "editRef" && editRefDirect && (() => {
    const _jr = editRefDirect.jrId ? seekJrs.find((j) => sameId(j.id, editRefDirect.jrId)) : null;
    const _m = (editRefDirect.memberId ? members.find((m) => sameId(m.id, editRefDirect.memberId)) : _jr ? members.find((m) => sameId(m.id, _jr.seekId)) : null) || { id: 0, name: "?" };
    return /* @__PURE__ */ React.createElement(AdmMemberDetail, { member: _m, referrals, jrReferrals, seekJrs, credentials, onBack: () => {
      setEditRefDirect(null);
      setView("dashboard");
    }, onAddReferral: (d) => onAddReferral(d, _m.id), onUpdateReferral, onDeleteReferral, onDeleteMember, onUpdateMember, onUpdatePin, spinRewards });
  })(), view === "remuneracao" && /* @__PURE__ */ React.createElement(RemuneracaoPanel, { isMaster: true }), !inSubView && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", bottom: 74, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 576, zIndex: 19, padding: 0 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark btn-full", style: { padding: 14 }, onClick: () => setShowExtrato(true) }, "\u{1F4CB} Extrato")), !inSubView && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 640, zIndex: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "tab-bar" }, masterTabs.map(({ id, l, I }) => /* @__PURE__ */ React.createElement("button", { key: id, className: `tab${activeTab === id ? " on" : ""}`, onClick: () => {
    setView(id);
    setSelAdm(null);
    setSelMember(null);
  } }, /* @__PURE__ */ React.createElement(I, { s: 20, c: activeTab === id ? "var(--black)" : "var(--muted)" }), /* @__PURE__ */ React.createElement("span", null, l))), /* @__PURE__ */ React.createElement("button", { className: "tab", onClick: () => setShowOffers(true) }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "1.1rem", lineHeight: 1 } }, "\u{1F3F7}\uFE0F"), /* @__PURE__ */ React.createElement("span", null, "Ofertas")))), view === "vendedorDetail" && selAdm && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 640, zIndex: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "tab-bar" }, /* @__PURE__ */ React.createElement("button", { className: "btn", style: { flex: 1, padding: "10px" }, onClick: () => {
    setSelAdm(null);
    setSelMember(null);
    setView("vendedores");
  } }, /* @__PURE__ */ React.createElement(IcLeft, { s: 16 }), "Voltar"), /* @__PURE__ */ React.createElement("button", { className: "btn", style: { flex: 1, padding: "10px" }, onClick: () => setView("membros") }, /* @__PURE__ */ React.createElement(IcUsers, { s: 15 }), "SEEK"))), showBell && /* @__PURE__ */ React.createElement(BellPanel, { members, referrals, jrReferrals, seekJrs, onClose: () => setShowBell(false), onEditRef: (r) => {
    setEditRefDirect(r);
    setView("editRef");
  }, onDeleteRef: onDeleteReferral, onDeleteJrRef: onDeleteJrReferral, passReqs, onMarkRead }), showOffers && /* @__PURE__ */ React.createElement(OffersPanel, { offers, onClose: () => setShowOffers(false), isAdm: true, onAddOffer, onDeleteOffer }), showExtrato && /* @__PURE__ */ React.createElement(ExtratoModal, { role: "master", data: { adms, members, referrals, jrReferrals, seekJrs, spinRewards }, onClose: () => setShowExtrato(false) }));
}
function VendedorNotifScreen({ members, referrals, jrReferrals, seekJrs, passReqs, onBack, onMarkSold, onUpdateRef, onMarkRead, spinRewards, onTogglePaid, onToggleJrPaid, initialTab }) {
  const [tab, setTab] = useState(initialTab || "aguardando");
  const [selling, setSelling] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showRelatorio, setShowRelatorio] = useState(false);
  function getStatus(r) {
    if (r.status) return r.status;
    if (r.paid) return "pago";
    if ((r.productValue || 0) > 0) return "a_pagar";
    return "aguardando";
  }
  const allCombined = [
    ...referrals.map((r) => ({ ...r, _isJr: false })),
    ...jrReferrals.map((r) => ({ ...r, _isJr: true }))
  ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const byStatus = {
    aguardando: allCombined.filter((r) => getStatus(r) === "aguardando"),
    a_pagar: allCombined.filter((r) => getStatus(r) === "a_pagar"),
    pago: allCombined.filter((r) => getStatus(r) === "pago")
  };
  const tabData = byStatus[tab] || [];
  const forgotReqs = (passReqs || []).filter((r) => r.type === "forgot" && !r.resolved);
  function buildRelatorio() {
    const d = /* @__PURE__ */ new Date();
    const ds = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    function line(r) {
      const who = r._isJr ? (seekJrs.find((j) => sameId(j.id, r.jrId)) || { name: "JR" }).name + " JR" : (members.find((m) => sameId(m.id, r.memberId)) || { name: "SEEK" }).name;
      const val = r.productValue > 0 ? ` \xB7 ${fBRL(r.productValue)} \xB7 ${fBRL(r.commission)}` : "";
      return `\u2022 ${r.clientName || "?"} (${who})${val} \u2014 ${fDate(r)}`;
    }
    return [
      `*SEEK NETWORK \u2014 NOTIFICA\xC7\xD5ES VENDEDOR*`,
      `Data: ${ds}`,
      ``,
      `\u{1F4CB} AGUARDANDO (${byStatus.aguardando.length})`,
      ...byStatus.aguardando.map(line),
      ``,
      `\u{1F4B0} A PAGAR (${byStatus.a_pagar.length})`,
      ...byStatus.a_pagar.map(line),
      ``,
      `\u2705 PAGO (${byStatus.pago.length})`,
      ...byStatus.pago.map(line),
      ``,
      `Total a pagar: ${fBRL(byStatus.a_pagar.reduce((s, r) => s + r.commission, 0))}`,
      (spinRewards || []).length > 0 ? `\u{1F3B0} B\xF4nus Roleta pago: ${fBRL((spinRewards || []).reduce((s, r) => s + r.value, 0))}` : ""
    ].filter((l) => l !== void 0).join("\n");
  }
  function SaleForm({ ref: r, onCancel, onSave }) {
    const [prodType, setProdType] = useState("auto");
    const [val, setVal] = useState(0);
    const [date, setDate] = useState(todayISO());
    function submit(e) {
      e.preventDefault();
      if (val <= 0) return;
      const pt = PRODUCT_TYPES.find((p) => p.id === prodType) || PRODUCT_TYPES[0];
      const commission2 = val * pt.rate;
      const parts = date.split("-").map(Number);
      onSave({ productType: prodType, productValue: val, commission: commission2, year: parts[0], month: parts[1], day: parts[2] });
    }
    const commission = val > 0 ? val * (PRODUCT_TYPES.find((p) => p.id === prodType) || PRODUCT_TYPES[0]).rate : 0;
    return /* @__PURE__ */ React.createElement("form", { onSubmit: submit, style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "12px 14px", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".92rem" } }, r.clientName), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".72rem", color: "var(--muted)", marginTop: 4 } }, r._isJr ? (seekJrs.find((j) => sameId(j.id, r.jrId)) || { name: "JR" }).name + " JR" : (members.find((m) => sameId(m.id, r.memberId)) || { name: "SEEK" }).name)), /* @__PURE__ */ React.createElement(Fld, { label: "Tipo de Produto" }, /* @__PURE__ */ React.createElement(ProductSelect, { value: prodType, onChange: setProdType })), /* @__PURE__ */ React.createElement(Fld, { label: "Valor do Neg\xF3cio" }, /* @__PURE__ */ React.createElement(CurrencyInput, { value: val, onChange: setVal })), /* @__PURE__ */ React.createElement(Fld, { label: "Data da Venda" }, /* @__PURE__ */ React.createElement("input", { className: "inp", type: "date", value: date, onChange: (e) => setDate(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".8rem", color: "var(--muted)", fontWeight: 600 } }, "Comiss\xE3o do SEEK"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800, fontSize: "1rem", color: "var(--green)" } }, fBRL(commission))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-full", onClick: onCancel }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { type: "submit", disabled: val <= 0, style: { flex: 1, padding: "14px 20px", borderRadius: "var(--rb)", border: "none", cursor: val > 0 ? "pointer" : "not-allowed", opacity: val > 0 ? 1 : 0.5, background: val > 0 ? "linear-gradient(145deg,#1D7A3A,#22AA44)" : "var(--bg)", color: val > 0 ? "#fff" : "var(--muted)", fontFamily: "inherit", fontWeight: 900, fontSize: ".84rem", letterSpacing: ".04em", boxShadow: val > 0 ? "4px 4px 14px rgba(29,122,58,.4),-2px -2px 8px rgba(255,255,255,.15)" : "var(--nm-out)", transition: "all .3s", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 } }, /* @__PURE__ */ React.createElement("span", null, "\u2705 INDICADO"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".6rem", fontWeight: 600, letterSpacing: "0", opacity: 0.85 } }, "Confirmar indica\xE7\xE3o como venda"))));
  }
  function EditRefForm({ ref: r, onCancel, onSave }) {
    const [cn, setCn] = useState(r.clientName || "");
    const [wa, setWa] = useState(r.whatsapp || "");
    const [prodType, setProdType] = useState(r.productType || "auto");
    const [val, setVal] = useState(r.productValue || 0);
    const [date, setDate] = useState(r.year && r.month ? `${r.year}-${String(r.month).padStart(2, "0")}-${String(r.day || 1).padStart(2, "0")}` : todayISO());
    function submit(e) {
      e.preventDefault();
      if (!cn.trim()) return;
      const pt = PRODUCT_TYPES.find((p) => p.id === prodType) || PRODUCT_TYPES[0];
      const commission = val > 0 ? val * pt.rate : 0;
      const parts = date.split("-").map(Number);
      onSave({ clientName: cn.trim().toUpperCase(), whatsapp: wa, productType: prodType, productValue: val, commission, year: parts[0], month: parts[1], day: parts[2] });
    }
    return /* @__PURE__ */ React.createElement("form", { onSubmit: submit, style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement(Fld, { label: "Nome do Cliente" }, /* @__PURE__ */ React.createElement("input", { className: "inp", value: cn, onChange: (e) => setCn(e.target.value.toUpperCase()), autoFocus: true, autoCapitalize: "characters", style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement(Fld, { label: "WhatsApp" }, /* @__PURE__ */ React.createElement(PhoneInput, { value: wa, onChange: setWa })), /* @__PURE__ */ React.createElement(Fld, { label: "Tipo de Produto" }, /* @__PURE__ */ React.createElement(ProductSelect, { value: prodType, onChange: setProdType })), /* @__PURE__ */ React.createElement(Fld, { label: "Valor do Neg\xF3cio" }, /* @__PURE__ */ React.createElement(CurrencyInput, { value: val, onChange: setVal })), /* @__PURE__ */ React.createElement(Fld, { label: "Data" }, /* @__PURE__ */ React.createElement("input", { className: "inp", type: "date", value: date, onChange: (e) => setDate(e.target.value) })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-full", onClick: onCancel }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-dark btn-full" }, "Salvar")));
  }
  const relatorioText = buildRelatorio();
  const tabColors = { aguardando: "var(--yellow)", a_pagar: "var(--red)", pago: "var(--green)" };
  const tabLabels = { aguardando: "Aguardando", a_pagar: "A Pagar", pago: "Pago" };
  return /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 640, margin: "0 auto", minHeight: "100vh" } }, /* @__PURE__ */ React.createElement(
    TopBar,
    {
      title: "Notifica\xE7\xF5es",
      left: /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onBack }, /* @__PURE__ */ React.createElement(IcLeft, { s: 18 })),
      right: /* @__PURE__ */ React.createElement("button", { className: "btn", style: { padding: "8px 12px", fontSize: ".72rem", gap: 5 }, onClick: () => setShowRelatorio(true) }, "\u{1F4CB} Relat\xF3rio")
    }
  ), forgotReqs.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { margin: "8px 16px 0", padding: "10px 14px", borderRadius: 14, background: "var(--bg)", boxShadow: "var(--nm-out)", border: "1.5px solid rgba(192,57,43,.3)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".78rem", color: "var(--red)", marginBottom: 6 } }, "\u{1F510} ", forgotReqs.length, " solicita\xE7\xE3o(\xF5es) de senha"), forgotReqs.map((req) => {
    const mb = members.find((m) => (m.whatsapp || "").replace(/\D/g, "") === req.phone);
    const jrObj = seekJrs.find((j) => (j.whatsapp || "").replace(/\D/g, "") === req.phone);
    const name = mb ? mb.name : jrObj ? jrObj.name : maskPhone(req.phone);
    return /* @__PURE__ */ React.createElement("div", { key: req.id, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".8rem", fontWeight: 700 } }, name), /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark", style: { padding: "5px 12px", fontSize: ".7rem", gap: 4 }, onClick: () => onMarkRead(req.id, "forgot") }, /* @__PURE__ */ React.createElement(IcCheck, { s: 11, c: "#fff" }), "Resolvido"));
  })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, padding: "10px 16px 2px" } }, ["aguardando", "a_pagar", "pago"].map((id) => /* @__PURE__ */ React.createElement("button", { key: id, onClick: () => setTab(id), style: {
    flex: 1,
    padding: "9px 4px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 800,
    fontSize: ".7rem",
    background: tab === id ? "var(--black)" : "var(--bg)",
    color: tab === id ? "#fff" : tabColors[id],
    boxShadow: tab === id ? "4px 4px 14px rgba(0,0,0,.3),-2px -2px 8px rgba(255,255,255,.15)" : "var(--nm-out)",
    transition: "all .2s"
  } }, tabLabels[id], byStatus[id].length > 0 && /* @__PURE__ */ React.createElement("span", { style: {
    marginLeft: 5,
    padding: "1px 6px",
    borderRadius: 99,
    fontSize: ".6rem",
    background: tab === id ? "rgba(255,255,255,0.25)" : tabColors[id],
    color: "#fff"
  } }, byStatus[id].length)))), /* @__PURE__ */ React.createElement("div", { className: "page", style: { paddingBottom: 30, paddingTop: 10 } }, tabData.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: "Nenhuma indica\xE7\xE3o nesta categoria" }) : tabData.map((r) => {
    const isJr = r._isJr;
    const seek = isJr ? seekJrs.find((j) => sameId(j.id, r.jrId)) : members.find((m) => sameId(m.id, r.memberId));
    const seekParent = isJr && seek ? members.find((m) => sameId(m.id, seek.seekId)) : null;
    const digits = (r.whatsapp || "").replace(/\D/g, "");
    const phone = digits ? digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}` : "";
    const st = getStatus(r);
    const stColor = tabColors[st] || "var(--muted)";
    const stLabel = tabLabels[st] || st;
    return /* @__PURE__ */ React.createElement("div", { key: r.id, className: "nm", style: { padding: "14px 16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".94rem", marginBottom: 3 } }, r.clientName || "\u2014"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" } }, isJr && /* @__PURE__ */ React.createElement("span", { className: "tag-jr" }, "JR"), seek && /* @__PURE__ */ React.createElement("span", null, seek.name), isJr && seekParent && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { style: { opacity: 0.4 } }, "\u2192"), /* @__PURE__ */ React.createElement("span", null, "SEEK: ", seekParent.name)))), /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".66rem", fontWeight: 800, padding: "3px 10px", borderRadius: 50, background: "var(--bg)", boxShadow: "var(--nm-out)", color: stColor, flexShrink: 0 } }, stLabel)), r.productValue > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".74rem", color: "var(--muted)", marginBottom: 6 } }, PRODUCT_TYPES.find((p) => p.id === r.productType)?.icon, " ", PRODUCT_TYPES.find((p) => p.id === r.productType)?.name, " \xB7 ", fBRL(r.productValue), " \xB7 ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--green)", fontWeight: 700 } }, fBRL(r.commission))), r.whatsapp && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 } }, /* @__PURE__ */ React.createElement(IcWA, { s: 13, fill: "#25D366" }), maskPhone(r.whatsapp)), r.observacoes && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".72rem", color: "var(--muted)", marginBottom: 6, fontStyle: "italic", paddingLeft: 2 } }, "\u{1F4AC} ", r.observacoes), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".66rem", color: "var(--muted)", marginBottom: 10 } }, fDate(r)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 7, flexWrap: "wrap" } }, phone && /* @__PURE__ */ React.createElement("a", { href: `https://wa.me/${phone}`, target: "_blank", style: { textDecoration: "none" } }, /* @__PURE__ */ React.createElement("button", { className: "btn", style: { padding: "7px 11px", fontSize: ".72rem", gap: 4, color: "#25D366" } }, /* @__PURE__ */ React.createElement(IcWA, { s: 13, fill: "#25D366" }), "WhatsApp")), /* @__PURE__ */ React.createElement("button", { className: "btn", style: { padding: "7px 11px", fontSize: ".72rem", gap: 4, color: "var(--yellow)" }, onClick: () => st === "aguardando" ? setSelling({ ref: r, isJr }) : setEditing({ ref: r, isJr }) }, /* @__PURE__ */ React.createElement(IcEdit, { s: 13 }), st === "aguardando" ? "Preencher Venda" : "Editar"), st === "a_pagar" && /* @__PURE__ */ React.createElement("button", { onClick: () => r._isJr ? onToggleJrPaid(r.id) : onTogglePaid(r.id), style: {
      padding: "7px 14px",
      borderRadius: 12,
      border: "none",
      cursor: "pointer",
      background: "linear-gradient(135deg,#1D7A3A,#22AA44)",
      color: "#fff",
      fontFamily: "inherit",
      fontWeight: 900,
      fontSize: ".74rem",
      boxShadow: "3px 3px 10px rgba(29,122,58,.4)"
    } }, "PAGAR")));
  })), selling && /* @__PURE__ */ React.createElement(Sheet, { title: "Confirmar Venda", onClose: () => setSelling(null) }, /* @__PURE__ */ React.createElement(SaleForm, { ref: selling.ref, onCancel: () => setSelling(null), onSave: (data) => {
    setSelling(null);
    onMarkSold(selling.ref.id, data, selling.isJr);
  } })), editing && /* @__PURE__ */ React.createElement(Sheet, { title: "Editar Indica\xE7\xE3o", onClose: () => setEditing(null) }, /* @__PURE__ */ React.createElement(EditRefForm, { ref: editing.ref, onCancel: () => setEditing(null), onSave: async (data) => {
    await onUpdateRef(editing.ref.id, data, editing.isJr);
    setEditing(null);
  } })), showRelatorio && /* @__PURE__ */ React.createElement(Sheet, { title: "Relat\xF3rio de Notifica\xE7\xF5es", onClose: () => setShowRelatorio(false) }, /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "14px", fontFamily: "monospace", fontSize: ".72rem", whiteSpace: "pre-wrap", lineHeight: 1.7, maxHeight: "56vh", overflowY: "auto", borderRadius: 16, marginBottom: 14 } }, relatorioText), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", style: { gap: 6, color: "#25D366" }, onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(relatorioText)}`, "_blank") }, /* @__PURE__ */ React.createElement(IcWA, { s: 15, fill: "#25D366" }), "WhatsApp"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", style: { gap: 6 }, onClick: () => {
    const div = document.createElement("div");
    div.className = "print-only";
    div.style.cssText = "font-family:monospace;white-space:pre-wrap;font-size:13px;padding:28px;color:#111;line-height:1.8;";
    div.textContent = relatorioText;
    document.body.appendChild(div);
    window.print();
    document.body.removeChild(div);
  } }, "\u{1F5A8}\uFE0F Imprimir"))));
}
function VendedorBellPanel({ members, referrals, jrReferrals, seekJrs, passReqs, onClose, onMarkRead, onMarkSold, onUpdateRef, onTogglePaid, onToggleJrPaid }) {
  const [editItem, setEditItem] = useState(null);
  const allCombined = [
    ...referrals.filter((r) => r.isNew).map((r) => ({ ...r, _isJr: false })),
    ...jrReferrals.filter((r) => r.isNew).map((r) => ({ ...r, _isJr: true }))
  ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const forgotReqs = (passReqs || []).filter((r) => r.type === "forgot" && !r.resolved);
  const newJrs = seekJrs.filter((j) => j.isNew);
  function getStatus(r) {
    if (r.status) return r.status;
    if (r.paid) return "pago";
    if ((r.productValue || 0) > 0) return "a_pagar";
    return "aguardando";
  }
  const stColors = { aguardando: "var(--yellow)", a_pagar: "var(--red)", pago: "var(--green)" };
  const stLabels = { aguardando: "Aguardando", a_pagar: "A Pagar", pago: "Pago" };
  const unread = allCombined.length + newJrs.length + forgotReqs.length;
  const total = unread;
  function SaleForm({ r, isJr, onCancel, onSave }) {
    const [prodType, setProdType] = useState("auto");
    const [val, setVal] = useState(0);
    const [date, setDate] = useState(todayISO());
    const commission = val > 0 ? val * (PRODUCT_TYPES.find((p) => p.id === prodType) || PRODUCT_TYPES[0]).rate : 0;
    function submit(e) {
      e.preventDefault();
      if (val <= 0) return;
      const pt = PRODUCT_TYPES.find((p) => p.id === prodType) || PRODUCT_TYPES[0];
      const parts = date.split("-").map(Number);
      onSave({ productType: prodType, productValue: val, commission: val * pt.rate, year: parts[0], month: parts[1], day: parts[2] });
    }
    return /* @__PURE__ */ React.createElement("form", { onSubmit: submit, style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "12px 14px", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".92rem" } }, r.clientName), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".72rem", color: "var(--muted)", marginTop: 4 } }, isJr ? (seekJrs.find((j) => sameId(j.id, r.jrId)) || { name: "JR" }).name + " JR" : (members.find((m) => sameId(m.id, r.memberId)) || { name: "SEEK" }).name), r.observacoes && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".72rem", color: "var(--muted)", fontStyle: "italic", marginTop: 4 } }, "\u{1F4AC} ", r.observacoes)), /* @__PURE__ */ React.createElement(Fld, { label: "Tipo de Produto" }, /* @__PURE__ */ React.createElement(ProductSelect, { value: prodType, onChange: setProdType })), /* @__PURE__ */ React.createElement(Fld, { label: "Valor do Neg\xF3cio" }, /* @__PURE__ */ React.createElement(CurrencyInput, { value: val, onChange: setVal })), /* @__PURE__ */ React.createElement(Fld, { label: "Data da Venda" }, /* @__PURE__ */ React.createElement("input", { className: "inp", type: "date", value: date, onChange: (e) => setDate(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".8rem", color: "var(--muted)", fontWeight: 600 } }, "Comiss\xE3o do SEEK"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800, fontSize: "1rem", color: "var(--green)" } }, fBRL(commission))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-full", onClick: onCancel }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { type: "submit", disabled: val <= 0, style: { flex: 1, padding: "14px 20px", borderRadius: "var(--rb)", border: "none", cursor: val > 0 ? "pointer" : "not-allowed", opacity: val > 0 ? 1 : 0.5, background: val > 0 ? "linear-gradient(145deg,#1D7A3A,#22AA44)" : "var(--bg)", color: val > 0 ? "#fff" : "var(--muted)", fontFamily: "inherit", fontWeight: 900, fontSize: ".84rem", letterSpacing: ".04em", boxShadow: val > 0 ? "4px 4px 14px rgba(29,122,58,.4),-2px -2px 8px rgba(255,255,255,.15)" : "var(--nm-out)", transition: "all .3s", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 } }, /* @__PURE__ */ React.createElement("span", null, "\u2705 INDICADO"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".6rem", fontWeight: 600, letterSpacing: "0", opacity: 0.85 } }, "Confirmar indica\xE7\xE3o como venda"))));
  }
  function EditRefForm({ r, isJr, onCancel, onSave }) {
    const [cn, setCn] = useState(r.clientName || "");
    const [wa, setWa] = useState(r.whatsapp || "");
    const [prodType, setProdType] = useState(r.productType || "auto");
    const [val, setVal] = useState(r.productValue || 0);
    const [date, setDate] = useState(r.year && r.month ? `${r.year}-${String(r.month).padStart(2, "0")}-${String(r.day || 1).padStart(2, "0")}` : todayISO());
    function submit(e) {
      e.preventDefault();
      if (!cn.trim()) return;
      const pt = PRODUCT_TYPES.find((p) => p.id === prodType) || PRODUCT_TYPES[0];
      const parts = date.split("-").map(Number);
      onSave({ clientName: cn.trim().toUpperCase(), whatsapp: wa, productType: prodType, productValue: val, commission: val > 0 ? val * pt.rate : 0, year: parts[0], month: parts[1], day: parts[2] });
    }
    return /* @__PURE__ */ React.createElement("form", { onSubmit: submit, style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement(Fld, { label: "Nome do Cliente" }, /* @__PURE__ */ React.createElement("input", { className: "inp", value: cn, onChange: (e) => setCn(e.target.value.toUpperCase()), autoFocus: true, autoCapitalize: "characters", style: { textTransform: "uppercase" } })), /* @__PURE__ */ React.createElement(Fld, { label: "WhatsApp" }, /* @__PURE__ */ React.createElement(PhoneInput, { value: wa, onChange: setWa })), /* @__PURE__ */ React.createElement(Fld, { label: "Tipo de Produto" }, /* @__PURE__ */ React.createElement(ProductSelect, { value: prodType, onChange: setProdType })), /* @__PURE__ */ React.createElement(Fld, { label: "Valor do Neg\xF3cio" }, /* @__PURE__ */ React.createElement(CurrencyInput, { value: val, onChange: setVal })), /* @__PURE__ */ React.createElement(Fld, { label: "Data" }, /* @__PURE__ */ React.createElement("input", { className: "inp", type: "date", value: date, onChange: (e) => setDate(e.target.value) })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-full", onClick: onCancel }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-dark btn-full" }, "Salvar")));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "overlay", onClick: editItem ? void 0 : onClose }, /* @__PURE__ */ React.createElement("div", { className: "sheet", onClick: (e) => e.stopPropagation(), style: { maxHeight: "88vh" } }, /* @__PURE__ */ React.createElement("div", { className: "handle" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement(IcBell, { s: 18, c: "var(--black)" }), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 900, fontSize: "1rem" } }, "Notifica\xE7\xF5es"), unread > 0 && /* @__PURE__ */ React.createElement("span", { style: { background: "var(--red)", color: "#fff", fontSize: ".62rem", fontWeight: 900, borderRadius: 99, padding: "2px 8px" } }, unread)), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(IcX, { s: 17, c: "var(--muted)" }))), total === 0 && /* @__PURE__ */ React.createElement(Empty, { text: "Nenhuma notifica\xE7\xE3o" }), forgotReqs.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "label", style: { marginBottom: 8 } }, "\u{1F510} Senhas esquecidas"), forgotReqs.map((req) => {
    const mb = members.find((m) => (m.whatsapp || "").replace(/\D/g, "") === req.phone);
    const jrObj = seekJrs.find((j) => (j.whatsapp || "").replace(/\D/g, "") === req.phone);
    const name = mb ? mb.name : jrObj ? jrObj.name : maskPhone(req.phone);
    return /* @__PURE__ */ React.createElement("div", { key: req.id, className: "nm", style: { padding: "10px 14px", marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".86rem" } }, name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", marginTop: 2 } }, "Esqueceu a senha")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark", style: { padding: "6px 12px", fontSize: ".72rem", gap: 4 }, onClick: () => onMarkRead(req.id, "forgot") }, /* @__PURE__ */ React.createElement(IcCheck, { s: 11, c: "#fff" }), "Resolvido"));
  })), newJrs.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "label", style: { marginBottom: 8 } }, "Novos SEEK JR"), newJrs.map((jr) => {
    const seek = members.find((m) => sameId(m.id, jr.seekId));
    return /* @__PURE__ */ React.createElement("div", { key: jr.id, className: "nm", style: { padding: "10px 14px", marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5, marginBottom: 2 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 900, fontSize: ".88rem" } }, jr.name), /* @__PURE__ */ React.createElement("span", { className: "tag-jr" }, "JR")), seek && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)" } }, "Padrinho: ", seek.name)), /* @__PURE__ */ React.createElement("button", { className: "btn", style: { padding: "6px 10px", fontSize: ".7rem", color: "var(--muted)" }, onClick: () => onMarkRead(jr.id, "jr") }, "\u2713 Lido"));
  })), allCombined.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "label", style: { marginBottom: 8 } }, "Indica\xE7\xF5es (", allCombined.length, ")"), allCombined.map((r) => {
    const isJr = r._isJr;
    const seek = isJr ? seekJrs.find((j) => sameId(j.id, r.jrId)) : members.find((m) => sameId(m.id, r.memberId));
    const st = getStatus(r);
    const digits = (r.whatsapp || "").replace(/\D/g, "");
    const phone = digits ? digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}` : "";
    return /* @__PURE__ */ React.createElement("div", { key: r.id, style: { borderRadius: 14, padding: "10px 12px", marginBottom: 6, background: r.isNew ? "var(--bg-up)" : "transparent", border: r.isNew ? "1.5px solid rgba(29,122,58,.15)" : "1.5px solid rgba(0,0,0,.04)", cursor: "pointer" }, onClick: () => {
      if (r.isNew) onMarkRead(r.id);
      setEditItem({ ref: r, isJr });
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, r.isNew && /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "var(--red)", marginRight: 6, verticalAlign: "middle" } }), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800, fontSize: ".9rem" } }, r.clientName)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".64rem", fontWeight: 800, padding: "2px 7px", borderRadius: 50, background: "var(--bg)", boxShadow: "var(--nm-out)", color: stColors[st], flexShrink: 0, marginLeft: 6 } }, stLabels[st])), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)", marginBottom: 4 } }, isJr && /* @__PURE__ */ React.createElement("span", { className: "tag-jr", style: { marginRight: 4 } }, "JR"), seek && /* @__PURE__ */ React.createElement("span", null, seek.name), /* @__PURE__ */ React.createElement("span", { style: { margin: "0 5px", opacity: 0.4 } }, "\xB7"), /* @__PURE__ */ React.createElement("span", null, fDate(r))), r.productValue > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)", marginBottom: r.observacoes ? 4 : 6 } }, PRODUCT_TYPES.find((p) => p.id === r.productType)?.icon, " ", PRODUCT_TYPES.find((p) => p.id === r.productType)?.name || "Autom\xF3vel", " \xB7 ", fBRL(r.productValue), " \xB7 ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--green)", fontWeight: 700 } }, fBRL(r.commission))), r.observacoes && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", fontStyle: "italic", marginBottom: 6 } }, "\u{1F4AC} ", r.observacoes), st === "aguardando" && /* @__PURE__ */ React.createElement("div", { onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("button", { style: { padding: "5px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#B91C1C,#EF4444)", color: "#fff", fontFamily: "inherit", fontWeight: 900, fontSize: ".72rem", boxShadow: "2px 2px 8px rgba(185,28,28,.35)" }, onClick: () => {
      const t = /* @__PURE__ */ new Date();
      onMarkSold(r.id, { productType: r.productType || "auto", productValue: r.productValue || 0, commission: r.commission || 0, year: t.getFullYear(), month: t.getMonth() + 1, day: t.getDate() }, isJr);
    } }, "\u23F3 PENDENTE")), st === "a_pagar" && /* @__PURE__ */ React.createElement("div", { onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("button", { disabled: true, style: { padding: "5px 12px", borderRadius: 10, border: "none", cursor: "not-allowed", background: "rgba(29,122,58,.12)", color: "var(--green)", fontFamily: "inherit", fontWeight: 900, fontSize: ".72rem" } }, "\u2705 Confirmado")));
  })), editItem && /* @__PURE__ */ React.createElement(Sheet, { title: getStatus(editItem.ref) === "aguardando" ? "Confirmar Venda" : "Editar Indica\xE7\xE3o", onClose: () => setEditItem(null) }, getStatus(editItem.ref) === "aguardando" ? /* @__PURE__ */ React.createElement(SaleForm, { r: editItem.ref, isJr: editItem.isJr, onCancel: () => setEditItem(null), onSave: (data) => {
    setEditItem(null);
    onMarkSold(editItem.ref.id, data, editItem.isJr);
  } }) : /* @__PURE__ */ React.createElement(EditRefForm, { r: editItem.ref, isJr: editItem.isJr, onCancel: () => setEditItem(null), onSave: (data) => {
    setEditItem(null);
    onUpdateRef(editItem.ref.id, data, editItem.isJr);
  } }))));
}
function LedgerPorSeek({ members, seekJrs, referrals, jrReferrals, spinRewards, paid, onBack, onPayAllForSeek, onPayAllForJr, readOnly = false }) {
  const allSpins = spinRewards || [];
  const filtRefs = paid ? referrals.filter((r) => r.paid) : referrals.filter((r) => !r.paid && (r.status === "a_pagar" || r.productValue > 0));
  const filtJrRefs = paid ? jrReferrals.filter((r) => r.paid) : jrReferrals.filter((r) => !r.paid && (r.status === "a_pagar" || r.productValue > 0));
  const filtSpins = paid ? allSpins.filter((s) => s.paid) : allSpins.filter((s) => !s.paid);
  const total = filtRefs.reduce((s, r) => s + r.commission, 0) + filtJrRefs.reduce((s, r) => s + r.commission, 0) + filtSpins.reduce((s, r) => s + r.value, 0);
  const comColor = paid ? "var(--green)" : "var(--red)";
  const entries = [];
  members.forEach((m) => {
    const myJrs = seekJrs.filter((j) => sameId(j.seekId, m.id));
    const refs = filtRefs.filter((r) => sameId(r.memberId, m.id));
    const spins = filtSpins.filter((s) => sameId(s.seekId, m.id));
    if (refs.length || spins.length)
      entries.push({ type: "seek", m, refs, spins, sub: refs.reduce((s, r) => s + r.commission, 0) + spins.reduce((s, r) => s + r.value, 0) });
    myJrs.forEach((jr) => {
      const jr_refs = filtJrRefs.filter((r) => sameId(r.jrId, jr.id));
      const jr_spins = filtSpins.filter((s) => sameId(s.jrId, jr.id));
      if (jr_refs.length || jr_spins.length)
        entries.push({ type: "jr", jr, seekName: m.name, seekId: m.id, refs: jr_refs, spins: jr_spins, sub: jr_refs.reduce((s, r) => s + r.commission, 0) + jr_spins.reduce((s, r) => s + r.value, 0) });
    });
  });
  function EntryCard({ e }) {
    const isSeek = e.type === "seek";
    const name = isSeek ? e.m.name : e.jr.name;
    const comTotal = e.refs.reduce((s, r) => s + r.commission, 0);
    const spinTotal = e.spins.reduce((s, r) => s + r.value, 0);
    const avulsos = e.spins.filter((s) => !e.refs.some((r) => sameId(s.referralId, r.id)));
    const showPay = !paid && !readOnly;
    return /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { background: "rgba(0,0,0,.04)", borderRadius: "12px 12px 0 0", padding: "10px 14px", display: "flex", alignItems: "center", gap: 7 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 900, fontSize: ".88rem" } }, "\u{1F464} ", name), !isSeek && /* @__PURE__ */ React.createElement("span", { className: "tag-jr" }, "JR"), !isSeek && /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".66rem", color: "var(--muted)", fontWeight: 600 } }, "\u2014 JR de ", e.seekName)), /* @__PURE__ */ React.createElement("div", { className: "nm", style: { borderRadius: showPay ? "0" : "0 0 12px 12px", padding: "0 14px" } }, e.refs.map((r, i) => {
      const pt = PRODUCT_TYPES.find((p) => p.id === r.productType) || PRODUCT_TYPES[0];
      const linked = e.spins.find((s) => sameId(s.referralId, r.id));
      return /* @__PURE__ */ React.createElement(React.Fragment, { key: r.id }, /* @__PURE__ */ React.createElement("div", { style: { padding: "11px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".8rem", marginBottom: 3 } }, "Cliente: ", r.clientName), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "var(--muted)", lineHeight: 1.6 } }, pt.icon, " ", pt.name, "\xA0\xB7\xA0Venda: ", fBRL(r.productValue), "\xA0\xB7\xA0Comiss\xE3o: ", /* @__PURE__ */ React.createElement("span", { style: { color: comColor, fontWeight: 800 } }, fBRL(r.commission))), linked && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "#8833BB", fontWeight: 700, marginTop: 3 } }, "\u{1F3B0} B\xF4nus Roleta desta indica\xE7\xE3o: ", fBRL(linked.value))), (i < e.refs.length - 1 || avulsos.length > 0) && /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "rgba(0,0,0,.06)" } }));
    }), avulsos.map((s, i) => {
      const dt = s.createdAt ? new Date(s.createdAt) : null;
      const dtStr = dt ? `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}` : "";
      return /* @__PURE__ */ React.createElement(React.Fragment, { key: "av_" + s.id }, /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "#8833BB", fontWeight: 800 } }, "\u{1F3B0} B\xF4nus Roleta Avulso"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".67rem", color: "var(--muted)", marginTop: 2 } }, fBRL(s.value), dtStr ? ` \xB7 ${dtStr}` : "")), i < avulsos.length - 1 && /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "rgba(0,0,0,.06)" } }));
    }), /* @__PURE__ */ React.createElement("div", { style: { borderTop: "2px solid rgba(0,0,0,.06)", padding: "10px 0" + (showPay ? "" : " 12px") } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".61rem", fontWeight: 900, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 5 } }, "\u{1F4CA} Subtotal ", name), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 3, paddingLeft: 4 } }, comTotal > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".69rem", fontWeight: 600 } }, "Comiss\xF5es: ", /* @__PURE__ */ React.createElement("span", { style: { color: comColor, fontWeight: 800 } }, fBRL(comTotal))), spinTotal > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".69rem", fontWeight: 600 } }, "B\xF4nus Roleta: ", /* @__PURE__ */ React.createElement("span", { style: { color: "#8833BB", fontWeight: 800 } }, fBRL(spinTotal))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".75rem", fontWeight: 900, marginTop: 2 } }, "TOTAL: ", /* @__PURE__ */ React.createElement("span", { style: { color: comColor } }, fBRL(e.sub)))))), showPay && isSeek && onPayAllForSeek && /* @__PURE__ */ React.createElement("button", { style: { width: "100%", padding: "11px 0", background: "linear-gradient(135deg,#1D7A3A,#22AA44)", color: "#fff", border: "none", borderRadius: "0 0 12px 12px", boxShadow: "2px 4px 12px rgba(29,122,58,.35)", fontFamily: "inherit", fontWeight: 900, fontSize: ".8rem", cursor: "pointer" }, onClick: () => onPayAllForSeek(e.m.id) }, "PAGAR TUDO \u2014 ", name), showPay && !isSeek && onPayAllForJr && /* @__PURE__ */ React.createElement("button", { style: { width: "100%", padding: "11px 0", background: "linear-gradient(135deg,#1D7A3A,#22AA44)", color: "#fff", border: "none", borderRadius: "0 0 12px 12px", boxShadow: "2px 4px 12px rgba(29,122,58,.35)", fontFamily: "inherit", fontWeight: 900, fontSize: ".8rem", cursor: "pointer" }, onClick: () => onPayAllForJr(e.jr.id) }, "PAGAR TUDO \u2014 ", name));
  }
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TopBar, { title: paid ? "Comiss\xF5es Pagas" : "A Pagar", left: /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onBack }, /* @__PURE__ */ React.createElement(IcLeft, { s: 18 })) }), /* @__PURE__ */ React.createElement("div", { className: "page" }, entries.length === 0 && /* @__PURE__ */ React.createElement(Empty, { text: paid ? "Nenhuma comiss\xE3o paga." : "Tudo em dia!" }), entries.map((e) => /* @__PURE__ */ React.createElement(EntryCard, { key: e.type === "seek" ? "seek_" + e.m.id : "jr_" + e.jr.id, e })), entries.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 16px", background: "var(--black)", borderRadius: 14, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: ".7rem", fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.75 } }, paid ? "Total Pago" : "\u{1F4B0} Total Geral a Pagar"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 900, fontSize: ".95rem" } }, fBRL(total)))));
}
function VendedorPanel({ adm, members, referrals, jrReferrals, seekJrs, credentials, offers, passReqs, levelNotifs, onLogout, onAddMember, onUpdateMember, onDeleteMember, onUpdatePin, onAddReferral, onUpdateReferral, onTogglePaid, onDeleteReferral, onAddSeekJr, onDeleteSeekJr, onAddJrReferral, onToggleJrPaid, onDeleteJrReferral, onAddOffer, onDeleteOffer, onMarkRead, spinRewards, onMarkSold, onUpdateJrReferral, onToggleSpinPaid, onPayAllForSeek, onPayAllForJr }) {
  const [view, setView] = useState("dashboard");
  const [selMember, setSelMember] = useState(null);
  const [editRefDirect, setEditRefDirect] = useState(null);
  const [showOffers, setShowOffers] = useState(false);
  const [showExtrato, setShowExtrato] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const now = /* @__PURE__ */ new Date();
  const [sm, setSm] = useState(now.getMonth() + 1);
  const [sy, setSy] = useState(now.getFullYear());
  const pendReqs = (passReqs || []).filter((r) => !r.resolved);
  const newRefs = [...referrals, ...jrReferrals].filter((r) => r.isNew);
  const newJrs = seekJrs.filter((j) => j.isNew);
  const badge = pendReqs.length + newRefs.length + newJrs.length;
  const allRefs = [...referrals, ...jrReferrals];
  const curMember = selMember ? members.find((m) => sameId(m.id, selMember.id)) ?? selMember : null;
  const inSubView = ["memberDetail", "pending", "paid", "editRef"].includes(view);
  function nav(dest, payload) {
    if (dest === "editRef") {
      setEditRefDirect(payload);
      setView("editRef");
    } else setView(dest);
  }
  function updateRef(rid, data, isJr) {
    return isJr ? onUpdateJrReferral(rid, data) : onUpdateReferral(rid, data);
  }
  return /* @__PURE__ */ React.createElement("div", { style: { background: "var(--bg)", minHeight: "100vh", maxWidth: 640, margin: "0 auto", position: "relative" } }, /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TopBar, { logo: "SEEK NETWORK", right: /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { style: { position: "relative" }, className: "icon-btn", onClick: () => setShowBell(true) }, badge > 0 && /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", top: -4, right: -4, background: "var(--red)", color: "#fff", fontSize: ".5rem", fontWeight: 900, borderRadius: 99, padding: "1px 4px" } }, badge), /* @__PURE__ */ React.createElement(IcBell, { s: 18, c: "var(--muted)" })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", style: { fontSize: ".9rem" }, onClick: () => setShowHelp(true) }, "\u2753"), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onLogout }, /* @__PURE__ */ React.createElement(IcOut, { s: 17, c: "var(--muted)" }))) }), /* @__PURE__ */ React.createElement("div", { style: { padding: "4px 16px 8px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.55rem", fontWeight: 900, color: "var(--black)", letterSpacing: ".02em" } }, adm.name))), view === "dashboard" && /* @__PURE__ */ React.createElement(AdmDashboard, { members, referrals, jrReferrals, seekJrs, sm, setSm, sy, setSy, onNav: nav, passReqs, credentials, onDeleteRef: onDeleteReferral, onDeleteJrRef: onDeleteJrReferral, spinRewards, showPaymentReminder: true }), view === "members" && /* @__PURE__ */ React.createElement(AdmMembers, { members, referrals, jrReferrals, seekJrs, credentials, onSelect: (m) => {
    setSelMember(m);
    setView("memberDetail");
  }, onAdd: (d) => onAddMember(d, adm.id), onDelete: onDeleteMember, onUpdatePin, onDeleteJr: onDeleteSeekJr }), view === "memberDetail" && curMember && /* @__PURE__ */ React.createElement(AdmMemberDetail, { member: curMember, referrals, jrReferrals, seekJrs, credentials, onBack: () => {
    setSelMember(null);
    setView("members");
  }, onUpdateReferral, onTogglePaid, onDeleteReferral, onDeleteMember: (id) => {
    onDeleteMember(id);
    setSelMember(null);
    setView("members");
  }, onUpdateMember, onUpdatePin, spinRewards, onToggleSpinPaid }), view === "pending" && /* @__PURE__ */ React.createElement(LedgerPorSeek, { members, seekJrs, referrals, jrReferrals, spinRewards, paid: false, onBack: () => setView("dashboard"), onPayAllForSeek, onPayAllForJr }), view === "paid" && /* @__PURE__ */ React.createElement(LedgerPorSeek, { members, seekJrs, referrals, jrReferrals, spinRewards, paid: true, onBack: () => setView("dashboard") }), view === "editRef" && editRefDirect && (() => {
    const _jr = editRefDirect.jrId ? seekJrs.find((j) => sameId(j.id, editRefDirect.jrId)) : null;
    const _m = (editRefDirect.memberId ? members.find((m) => sameId(m.id, editRefDirect.memberId)) : _jr ? members.find((m) => sameId(m.id, _jr.seekId)) : null) || { id: 0, name: "?" };
    return /* @__PURE__ */ React.createElement(AdmMemberDetail, { member: _m, referrals, jrReferrals, seekJrs, credentials, onBack: () => {
      setEditRefDirect(null);
      setView("dashboard");
    }, onUpdateReferral, onTogglePaid, onDeleteReferral, onDeleteMember, onUpdateMember, onUpdatePin, spinRewards, onToggleSpinPaid });
  })(), view === "remuneracao" && /* @__PURE__ */ React.createElement(RemuneracaoPanel, { isMaster: false, isAdm: true }), view === "fipe" && /* @__PURE__ */ React.createElement(FipeConsulta, null), !inSubView && view !== "fipe" && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", bottom: 74, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 576, zIndex: 19, padding: 0 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-dark btn-full", style: { padding: 14 }, onClick: () => setShowExtrato(true) }, "\u{1F4CB} Extrato")), !inSubView && /* @__PURE__ */ React.createElement(AdmTabBar, { view, setView: (v) => {
    setView(v);
    setSelMember(null);
  }, onOffers: () => setShowOffers(true) }), showBell && /* @__PURE__ */ React.createElement(VendedorBellPanel, { members, referrals, jrReferrals, seekJrs, passReqs, onClose: () => setShowBell(false), onMarkRead, onMarkSold, onUpdateRef: updateRef, onTogglePaid, onToggleJrPaid }), showOffers && /* @__PURE__ */ React.createElement(OffersPanel, { offers, onClose: () => setShowOffers(false), isAdm: false, onAddOffer: () => {
  }, onDeleteOffer: () => {
  } }), showExtrato && /* @__PURE__ */ React.createElement(ExtratoModal, { role: "adm", data: { adm, members, referrals, jrReferrals, seekJrs, spinRewards }, onClose: () => setShowExtrato(false) }), showHelp && /* @__PURE__ */ React.createElement(HelpModal, { role: "adm", onClose: () => setShowHelp(false) }));
}
function ExtratoModal({ role, data, onClose, isAdm, onTogglePaid }) {
  const now = /* @__PURE__ */ new Date();
  const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  function buildText() {
    if (role === "master") {
      const { adms, members, referrals, jrReferrals, seekJrs, spinRewards = [] } = data;
      const allRefs = [...referrals, ...jrReferrals];
      const totVol = allRefs.reduce((s, r) => s + r.productValue, 0);
      const totCom = allRefs.reduce((s, r) => s + r.commission, 0);
      const pago = allRefs.filter((r) => r.paid).reduce((s, r) => s + r.commission, 0);
      const apagar = allRefs.filter((r) => !r.paid).reduce((s, r) => s + r.commission, 0);
      const admRank = adms.map((adm) => {
        const mids = members.filter((m) => sameId(m.admId, adm.id)).map((m) => String(m.id));
        const jids = seekJrs.filter((j) => mids.some((id) => sameId(j.seekId, id))).map((j) => String(j.id));
        const vol = [...referrals.filter((r) => mids.some((id) => sameId(r.memberId, id))), ...jrReferrals.filter((r) => jids.some((id) => sameId(r.jrId, id)))].reduce((s, r) => s + r.productValue, 0);
        return { name: adm.name, vol, seeks: mids.length };
      }).sort((a, b) => b.vol - a.vol);
      return [
        `*SEEK NETWORK \u2014 EXTRATO MASTER*`,
        `Data: ${dateStr}`,
        ``,
        `\u{1F4CA} CONSOLIDADO GERAL`,
        `Vendedores: ${adms.length}  |  SEEKs: ${members.length}  |  JRs: ${seekJrs.length}`,
        `Total Indica\xE7\xF5es: ${allRefs.length}`,
        ``,
        `\u{1F4B0} COMISS\xD5ES`,
        `Volume Total: ${fBRL(totVol)}`,
        `Comiss\xE3o Total: ${fBRL(totCom)}`,
        `Pago: ${fBRL(pago)}  |  A Pagar: ${fBRL(apagar)}`,
        `Comiss\xE3o Master (0,5%): ${fBRL(totVol * 5e-3)}`,
        spinRewards.length > 0 ? `\u{1F3B0} B\xF4nus Roleta Total - ${fBRL(spinRewards.reduce((s, r) => s + r.value, 0))}` : "",
        ``,
        `\u{1F3C6} RANKING VENDEDORES`,
        ...admRank.map((a, i) => `${i + 1}. ${a.name} \u2014 ${fBRL(a.vol)} (${a.seeks} SEEK${a.seeks !== 1 ? "s" : ""})`)
      ].join("\n");
    }
    if (role === "adm") {
      let refLine2 = function(r) {
        const spin = spinRewards.find((s) => sameId(s.referralId, r.id));
        const spinV = spin ? spin.value : 0;
        const total = r.commission + spinV;
        const st = r.paid ? "Pago" : "A Pagar";
        let line = `  Cliente: ${r.clientName} | Comiss\xE3o: ${fBRL(r.commission)}`;
        if (spinV > 0) line += ` | Roleta: ${fBRL(spinV)}`;
        line += ` | Total: ${fBRL(total)} | ${st}`;
        return line;
      };
      var refLine = refLine2;
      const { adm, members, referrals, jrReferrals, seekJrs, spinRewards = [] } = data;
      const allRefs = [...referrals, ...jrReferrals];
      const totCom = allRefs.reduce((s, r) => s + r.commission, 0);
      const bonusRTotal = spinRewards.reduce((s, r) => s + r.value, 0);
      const totalGeral = totCom + bonusRTotal;
      const SEP = "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501";
      const seekLines = [];
      members.forEach((m) => {
        const mRefs = referrals.filter((r) => sameId(r.memberId, m.id) && (r.paid || r.status === "a_pagar" || r.productValue > 0));
        const mJrs = seekJrs.filter((j) => sameId(j.seekId, m.id));
        const mJrRefs = jrReferrals.filter((r) => mJrs.some((j) => sameId(j.id, r.jrId)) && (r.paid || r.status === "a_pagar" || r.productValue > 0));
        if (mRefs.length === 0 && mJrRefs.length === 0) return;
        seekLines.push(``, `${SEP}`, `\u{1F464} ${m.name}`, `${SEP}`);
        mRefs.forEach((r) => seekLines.push(refLine2(r)));
        const mSpin2 = spinRewards.filter((s) => sameId(s.seekId, m.id)).reduce((s, r) => s + r.value, 0);
        const mSub = mRefs.reduce((s, r) => s + r.commission, 0) + mSpin2;
        if (mRefs.length > 0) seekLines.push(`  Subtotal SEEK: ${fBRL(mSub)}`);
        mJrs.forEach((jr) => {
          const jRefs = jrReferrals.filter((r) => sameId(r.jrId, jr.id) && (r.paid || r.status === "a_pagar" || r.productValue > 0));
          if (jRefs.length === 0) return;
          seekLines.push(``, `\u{1F464} ${jr.name} \u2014 JR de ${m.name}`);
          jRefs.forEach((r) => seekLines.push(refLine2(r)));
          const jSpin = spinRewards.filter((s) => sameId(s.jrId, jr.id)).reduce((s, r) => s + r.value, 0);
          const jSub = jRefs.reduce((s, r) => s + r.commission, 0) + jSpin;
          seekLines.push(`  Subtotal SEEK JR: ${fBRL(jSub)}`);
        });
      });
      const myComm = admComm(allRefs);
      return [
        `*SEEK NETWORK \u2014 EXTRATO VENDEDOR*`,
        `${adm.name}  |  Data: ${dateStr}`,
        ``,
        `\u{1F4CA} RESUMO`,
        `SEEKs: ${members.length}  |  JRs: ${seekJrs.length}  |  Indica\xE7\xF5es: ${allRefs.length}`,
        `\u{1F4BC} Minha Comiss\xE3o (vendedor): ${fBRL(myComm)}`,
        ...seekLines,
        ``,
        SEP,
        `TOTAL GERAL SEEK: ${fBRL(totalGeral)}`
      ].join("\n");
    }
    if (role === "member") {
      const { member, referrals, jrReferrals, seekJrs, spinRewards = [] } = data;
      const totVol = referrals.reduce((s, r) => s + r.productValue, 0);
      const pts = calcPoints(totVol);
      const lv = getSeekLevel(pts);
      const bonusR = spinRewards.reduce((s, r) => s + r.value, 0);
      const bonusRUnpaid = spinRewards.filter((r) => !r.paid).reduce((s, r) => s + r.value, 0);
      const apagar = referrals.filter((r) => !r.paid).reduce((s, r) => s + r.commission, 0) + bonusRUnpaid;
      const nextLv = lv.id === "elite" ? null : SEEK_LEVELS[SEEK_LEVELS.findIndex((l) => l.id === lv.id) + 1];
      const myJrs = seekJrs.filter((j) => sameId(j.seekId, member.id));
      const SEP = "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500";
      const confRefs = referrals.filter((r) => r.paid || r.status === "a_pagar" || r.productValue > 0);
      const refLines = [];
      confRefs.forEach((r, i) => {
        const spin = spinRewards.find((s) => sameId(s.referralId, r.id));
        const spinV = spin ? spin.value : 0;
        const total = r.commission + spinV;
        const st = r.paid ? "Pago" : "A Pagar";
        refLines.push(`\u{1F464} ${r.clientName}`);
        refLines.push(`   Comiss\xE3o: ${fBRL(r.commission)}`);
        if (spinV > 0) refLines.push(`   \u{1F3B0} B\xF4nus Roleta: ${fBRL(spinV)}`);
        refLines.push(`   Total: ${fBRL(total)}`);
        refLines.push(`   Status: ${st}`);
        if (i < confRefs.length - 1) refLines.push(SEP);
      });
      const totalGeral = referrals.reduce((s, r) => s + r.commission, 0) + bonusR;
      return [
        `*SEEK NETWORK \u2014 EXTRATO SEEK*`,
        `${member.name}  |  #${String(member.id).padStart(3, "0")}`,
        `Data: ${dateStr}`,
        ``,
        `\u{1F396}\uFE0F N\xCDVEL: ${lv.name.toUpperCase()}`,
        `Pontos: ${pts} pts  |  B\xF4nus: +${(lv.bonus * 100).toFixed(0)}%`,
        nextLv ? `Pr\xF3ximo n\xEDvel: ${nextLv.name} (faltam ${nextLv.min - pts} pts)` : `\u2705 N\xEDvel M\xE1ximo!`,
        ``,
        `\u{1F4B0} A Pagar: ${fBRL(apagar)}`,
        ``,
        confRefs.length > 0 ? `\u{1F4CB} INDICA\xC7\xD5ES (${confRefs.length})` : null,
        confRefs.length > 0 ? SEP : null,
        ...refLines,
        confRefs.length > 0 ? SEP : null,
        ``,
        `TOTAL GERAL: ${fBRL(totalGeral)}`,
        myJrs.length > 0 ? `
\u{1F465} SEEK JRs (${myJrs.length})` : null,
        ...myJrs.map((jr) => {
          const jrVol = jrReferrals.filter((r) => sameId(r.jrId, jr.id)).reduce((s, r) => s + r.productValue, 0);
          return `\u2022 ${jr.name} \u2014 ${fBRL(jrVol)}`;
        })
      ].filter((l) => l != null).join("\n");
    }
    if (role === "jr") {
      const { jr, referrals, seekMember, spinRewards = [] } = data;
      const totVol = referrals.reduce((s, r) => s + r.productValue, 0);
      const bonusR = spinRewards.reduce((s, r) => s + r.value, 0);
      const bonusRUnpaid = spinRewards.filter((r) => !r.paid).reduce((s, r) => s + r.value, 0);
      const apagar = referrals.filter((r) => !r.paid).reduce((s, r) => s + r.commission, 0) + bonusRUnpaid;
      const jrLv = getJrLevel(totVol);
      const gradPct = Math.min(100, totVol / JR_GRADUATION * 100).toFixed(1);
      const SEP = "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500";
      const confRefs = referrals.filter((r) => r.paid || r.status === "a_pagar" || r.productValue > 0);
      const refLines = [];
      confRefs.forEach((r, i) => {
        const spin = spinRewards.find((s) => sameId(s.referralId, r.id));
        const spinV = spin ? spin.value : 0;
        const total = r.commission + spinV;
        const st = r.paid ? "Pago" : "A Pagar";
        refLines.push(`\u{1F464} ${r.clientName}`);
        refLines.push(`   Comiss\xE3o: ${fBRL(r.commission)}`);
        if (spinV > 0) refLines.push(`   \u{1F3B0} B\xF4nus Roleta: ${fBRL(spinV)}`);
        refLines.push(`   Total: ${fBRL(total)}`);
        refLines.push(`   Status: ${st}`);
        if (i < confRefs.length - 1) refLines.push(SEP);
      });
      const totalGeral = referrals.reduce((s, r) => s + r.commission, 0) + bonusR;
      return [
        `*SEEK NETWORK \u2014 EXTRATO SEEK JR*`,
        `${jr.name}  |  ID: ${jr.id}JR`,
        `Data: ${dateStr}`,
        ``,
        seekMember ? `\u{1F464} Padrinho SEEK: ${seekMember.name}` : null,
        ``,
        `\u{1F4CA} DESEMPENHO`,
        `N\xEDvel JR: ${jrLv.name}  |  B\xF4nus para SEEK: ${(jrLv.bonus * 100).toFixed(0)}%`,
        `Progresso para SEEK: ${gradPct}% de ${fBRL(JR_GRADUATION)}`,
        ``,
        `\u{1F4B0} A Pagar: ${fBRL(apagar)}`,
        ``,
        confRefs.length > 0 ? `\u{1F4CB} INDICA\xC7\xD5ES (${confRefs.length})` : null,
        confRefs.length > 0 ? SEP : null,
        ...refLines,
        confRefs.length > 0 ? SEP : null,
        ``,
        `TOTAL GERAL: ${fBRL(totalGeral)}`
      ].filter((l) => l != null).join("\n");
    }
    return "";
  }
  const text = buildText();
  function sendWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }
  function handlePrint() {
    const div = document.createElement("div");
    div.className = "print-only";
    div.style.cssText = "font-family:monospace;white-space:pre-wrap;font-size:13px;padding:28px;color:#111;line-height:1.8;";
    div.textContent = text;
    document.body.appendChild(div);
    window.print();
    document.body.removeChild(div);
  }
  return /* @__PURE__ */ React.createElement("div", { className: "overlay", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "sheet", onClick: (e) => e.stopPropagation(), style: { maxHeight: "92vh" } }, /* @__PURE__ */ React.createElement("div", { className: "handle" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 900, fontSize: "1rem" } }, "\u{1F4CB} Extrato"), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(IcX, { s: 17, c: "var(--muted)" }))), /* @__PURE__ */ React.createElement("div", { className: "nm-in", style: { padding: "16px", marginBottom: 16, fontFamily: "monospace", fontSize: ".74rem", whiteSpace: "pre-wrap", lineHeight: 1.75, maxHeight: "46vh", overflowY: "auto", borderRadius: 16, color: "var(--black)" } }, text), isAdm && onTogglePaid && (role === "member" || role === "jr") && (() => {
    const refs = (role === "member" ? data.referrals : data.referrals).filter((r) => !r.paid);
    if (refs.length === 0) return null;
    return /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: ".76rem", color: "var(--muted)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8 } }, "Indica\xE7\xF5es a pagar"), refs.map((r, i) => /* @__PURE__ */ React.createElement("div", { key: r.id, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: i < refs.length - 1 ? "1px solid var(--gray)" : "none" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: ".82rem" } }, r.clientName), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".7rem", color: "var(--muted)" } }, fBRL(r.commission))), /* @__PURE__ */ React.createElement("button", { className: "pill", style: { background: "linear-gradient(135deg,#1D7A3A,#22AA44)", color: "#fff", border: "none", boxShadow: "2px 2px 8px rgba(29,122,58,.3)" }, onClick: () => onTogglePaid(r.id) }, "PAGAR"))));
  })(), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", style: { gap: 6, color: "#25D366" }, onClick: sendWhatsApp }, /* @__PURE__ */ React.createElement(IcWA, { s: 15, fill: "#25D366" }), "WhatsApp"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-full", style: { gap: 6 }, onClick: handlePrint }, "\u{1F5A8}\uFE0F Imprimir"))));
}
function Confetti() {
  const pieces = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    color: ["#E63333", "#FF7700", "#DDAA00", "#22AA44", "#2277EE", "#8833BB", "#FF69B4", "#00CCCC"][i % 8],
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.4 + Math.random() * 0.8,
    size: 5 + Math.random() * 9,
    isCircle: i % 3 === 0
  }));
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 10001 } }, pieces.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.id, style: {
    position: "absolute",
    top: -20,
    left: `${p.left}%`,
    width: p.size,
    height: p.size,
    background: p.color,
    borderRadius: p.isCircle ? "50%" : 2,
    animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`
  } })));
}
function SpinModal({ seekerName, pendingCount, onClose, onResult }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState(null);
  const [pendingWin, setPendingWin] = useState(null);
  function playSpinSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const times = [];
      let t = 0;
      while (t < 4) {
        times.push(t);
        const bell = Math.sin(t / 4.2 * Math.PI);
        t += 0.5 - bell * 0.46;
      }
      times.forEach((t2) => {
        const osc = ctx.createOscillator(), g = ctx.createGain();
        osc.connect(g);
        g.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.value = 900;
        const n = ctx.currentTime;
        g.gain.setValueAtTime(0, n + t2);
        g.gain.linearRampToValueAtTime(0.28, n + t2 + 4e-3);
        g.gain.linearRampToValueAtTime(0, n + t2 + 0.028);
        osc.start(n + t2);
        osc.stop(n + t2 + 0.032);
      });
    } catch (e) {
    }
  }
  function playCelebrationSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [523, 659, 784, 1047, 1319].forEach((freq, i) => {
        const osc = ctx.createOscillator(), g = ctx.createGain();
        osc.connect(g);
        g.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const s = ctx.currentTime + i * 0.12;
        g.gain.setValueAtTime(0, s);
        g.gain.linearRampToValueAtTime(0.35, s + 0.05);
        g.gain.exponentialRampToValueAtTime(1e-3, s + 0.55);
        osc.start(s);
        osc.stop(s + 0.6);
      });
      [784, 1047, 1319, 1568, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator(), g = ctx.createGain();
        osc.connect(g);
        g.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.value = freq;
        const s = ctx.currentTime + i * 0.1 + 0.06;
        g.gain.setValueAtTime(0, s);
        g.gain.linearRampToValueAtTime(0.18, s + 0.04);
        g.gain.exponentialRampToValueAtTime(1e-3, s + 0.45);
        osc.start(s);
        osc.stop(s + 0.5);
      });
    } catch (e) {
    }
  }
  function handleSpin() {
    if (spinning || won) return;
    playSpinSound();
    const rand = Math.random();
    let cum = 0, winner = SPIN_PRIZES[0];
    for (const p of SPIN_PRIZES) {
      cum += p.prob;
      if (rand < cum) {
        winner = p;
        break;
      }
    }
    setPendingWin(winner);
    setSpinning(true);
    const mid = winner.start + winner.span / 2;
    const finalDeg = (360 - mid % 360 + 360) % 360;
    setTimeout(() => setRotation(1800 + finalDeg), 20);
  }
  function handleTransitionEnd(e) {
    if (e.propertyName !== "transform" || !spinning) return;
    setSpinning(false);
    if (pendingWin) {
      setWon(pendingWin);
      onResult(pendingWin.value);
      playCelebrationSound();
    }
  }
  const size = 270;
  const R = size / 2;
  const conicGrad = "conic-gradient(" + SPIN_PRIZES.map((p) => `${p.color} ${p.start}deg ${p.start + p.span}deg`).join(",") + ")";
  const starDeco = [{ s: "\u2605", c: "#FFD700" }, { s: "\u2726", c: "#FF6B00" }, { s: "\u2605", c: "#E63333" }, { s: "\u2726", c: "#22AA44" }, { s: "\u2605", c: "#2277EE" }, { s: "\u2726", c: "#8833BB" }, { s: "\u2605", c: "#FF69B4" }, { s: "\u2726", c: "#DDAA00" }];
  return /* @__PURE__ */ React.createElement("div", { className: "spin-overlay", style: { flexDirection: "column", gap: 0 } }, won && /* @__PURE__ */ React.createElement(Confetti, null), !won ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 16, zIndex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "1.5rem", fontWeight: 900, color: "#FFD700", letterSpacing: ".06em", textShadow: "0 2px 16px rgba(255,215,0,.7)" } }, "\u{1F3B0} ROLETA DA SORTE"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".78rem", color: "rgba(255,255,255,.88)", fontWeight: 700, marginTop: 7 } }, "Parab\xE9ns, ", seekerName, "! Voc\xEA tem uma indica\xE7\xE3o premiada!"), pendingCount > 1 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".68rem", color: "#FF7700", fontWeight: 800, marginTop: 5 } }, pendingCount, " chances pendentes \u2014 gire uma por vez")), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", width: size + 80, height: size + 80, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, starDeco.map(({ s, c }, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { position: "absolute", fontSize: i % 2 === 0 ? "1.4rem" : "1rem", color: c, top: "50%", left: "50%", transform: `rotate(${i * 45}deg) translateY(-${size / 2 + 30}px) rotate(-${i * 45}deg)`, textShadow: `0 0 10px ${c}`, pointerEvents: "none" } }, s)), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", width: size, height: size, flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", fontSize: "1.6rem", lineHeight: 1, zIndex: 3, filter: "drop-shadow(0 2px 4px rgba(0,0,0,.7))" } }, "\u25BC"), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: -6, borderRadius: "50%", background: "linear-gradient(135deg,#FFD700,#FF8C00,#E63333,#8833BB,#2277EE,#22AA44)", zIndex: 0 } }), /* @__PURE__ */ React.createElement("div", { onTransitionEnd: handleTransitionEnd, style: { position: "absolute", inset: 0, borderRadius: "50%", background: conicGrad, transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 4.2s cubic-bezier(0.17,0.67,0.12,0.99)" : "none", zIndex: 1 } }, SPIN_PRIZES.map((p) => {
    const mid = p.start + p.span / 2;
    const rad = mid * Math.PI / 180;
    const r = 0.6 * R;
    const x = R + r * Math.sin(rad);
    const y = R - r * Math.cos(rad);
    return /* @__PURE__ */ React.createElement("div", { key: p.value, style: { position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${mid}deg)`, color: "#fff", fontWeight: 900, fontSize: ".70rem", textShadow: "0 1px 3px rgba(0,0,0,.9)", whiteSpace: "nowrap", pointerEvents: "none", lineHeight: 1 } }, p.label);
  })), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 28, height: 28, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,.5)", zIndex: 4 } }))), /* @__PURE__ */ React.createElement("button", { onClick: handleSpin, disabled: spinning, style: { marginTop: 22, padding: "15px 44px", borderRadius: 50, border: "none", cursor: spinning ? "not-allowed" : "pointer", background: spinning ? "#555" : "linear-gradient(135deg,#FF6B00,#E63333)", color: "#fff", fontWeight: 900, fontSize: "1.15rem", letterSpacing: ".04em", boxShadow: spinning ? "none" : "0 4px 22px rgba(230,51,51,.65)", transition: "all .2s" } }, spinning ? "Girando..." : "\u{1F3AF}  GIRAR!")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "4.5rem", textAlign: "center", animation: "prize-pop .5s ease" } }, "\u{1F389}"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginTop: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".9rem", fontWeight: 700, color: "rgba(255,255,255,.8)", marginBottom: 10 } }, "Voc\xEA ganhou"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "3.5rem", fontWeight: 900, lineHeight: 1.1, background: "linear-gradient(135deg,#FFD700,#FF8C00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "prize-pop .5s ease" } }, "R$ ", won.value), /* @__PURE__ */ React.createElement("div", { style: { fontSize: ".85rem", color: "rgba(255,255,255,.7)", fontWeight: 600, marginTop: 10 } }, "de B\xF4nus Roleta! \u{1F3B0}")), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { marginTop: 30, padding: "14px 48px", borderRadius: 50, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#1D7A3A,#22AA44)", color: "#fff", fontWeight: 900, fontSize: "1rem", boxShadow: "0 4px 18px rgba(29,122,58,.45)" } }, "Fechar")));
}
function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [adms, setAdms] = useState([]);
  const [members, setMembers] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [seekJrs, setSeekJrs] = useState([]);
  const [jrReferrals, setJrReferrals] = useState([]);
  const [credentials, setCredentials] = useState({});
  const [passReqs, setPassReqs] = useState([]);
  const [levelNotifs, setLevelNotifs] = useState([]);
  const [offers, setOffers] = useState([]);
  const [spinRewards, setSpinRewards] = useState([]);
  const [pendingSpins, setPendingSpins] = useState([]);
  const [dbError, setDbError] = useState(null);
  useEffect(() => {
    async function boot() {
      cleanupLegacyStorageKeys();
      const [
        { data: mRows, error: e1 },
        { data: cRows },
        { data: admRows, error: eAdm },
        { data: jrRows }
      ] = await Promise.all([
        db.from("members").select("*"),
        db.from("credentials").select("*"),
        db.from("adms").select("*"),
        db.from("seek_jrs").select("*")
      ]);
      if (e1) console.error("[SEEK boot] members error:", e1);
      if (eAdm) console.error("[SEEK boot] ERRO tabela adms:", JSON.stringify(eAdm));
      setMembers((mRows || []).map(mMember));
      setAdms((admRows || []).map(mAdm));
      setCredentials(buildCreds(cRows));
      setSeekJrs((jrRows || []).map(mSeekJr));
      setLoading(false);
      const [
        { data: rRows },
        { data: reqRows },
        { data: jrRefRows },
        { data: notifRows },
        { data: offerRows },
        { data: spinRows },
        { data: spinPendingRows }
      ] = await Promise.all([
        db.from("referrals").select("*"),
        db.from("pass_requests").select("*"),
        db.from("jr_referrals").select("*"),
        db.from("level_notifs").select("*"),
        db.from("offers").select("*"),
        db.from("spin_rewards").select("*"),
        db.from("spin_pending").select("*")
      ]);
      setReferrals((rRows || []).map(mRef));
      setPassReqs((reqRows || []).map(mPassReq));
      setJrReferrals((jrRefRows || []).map(mJrRef));
      setLevelNotifs((notifRows || []).map(mNotif));
      setOffers((offerRows || []).map(mOffer));
      setSpinRewards((spinRows || []).map(mSpin));
      setPendingSpins((spinPendingRows || []).map(mSpinPending));
    }
    boot();
  }, []);
  function checkLevelUp(memberId, oldRefs, newRefs) {
    const oldPts = calcPoints(oldRefs.filter((r) => sameId(r.memberId, memberId)).reduce((s, r) => s + r.productValue, 0));
    const newPts = calcPoints(newRefs.filter((r) => sameId(r.memberId, memberId)).reduce((s, r) => s + r.productValue, 0));
    const oldLv = getSeekLevel(oldPts);
    const newLv = getSeekLevel(newPts);
    if (newLv.id !== oldLv.id && newLv.min > oldLv.min) {
      db.from("level_notifs").insert({ member_id: String(memberId), level_id: newLv.id, dismissed: false }).select().single().then(({ data }) => {
        if (data) setLevelNotifs((u) => [...u, mNotif(data)]);
      });
    }
  }
  async function addMember(data, admId) {
    const rawL = (data.whatsapp || data.login || "").replace(/\D/g, "");
    const { data: row, error } = await db.from("members").insert({ name: data.name, whatsapp: rawL, pix_key: data.pixKey, notes: data.notes, adm_id: admId || null }).select().single();
    if (error || !row) {
      console.error("[addMember]", error);
      return;
    }
    setMembers((u) => [...u, mMember(row)]);
    await db.from("credentials").insert({ key: String(row.id), login: rawL, pin: data.pin || "0000" });
    setCredentials((u) => ({ ...u, [String(row.id)]: { login: rawL, pin: data.pin || "0000" } }));
  }
  async function updateMember(mid, data) {
    const rawL = (data.whatsapp || "").replace(/\D/g, "");
    await db.from("members").update({ name: data.name, whatsapp: rawL, pix_key: data.pixKey, notes: data.notes }).eq("id", mid);
    setMembers((u) => u.map((m) => sameId(m.id, mid) ? { ...m, ...data, whatsapp: rawL } : m));
    if (data.whatsapp !== void 0) {
      await db.from("credentials").update({ login: rawL }).eq("key", String(mid));
      setCredentials((u) => {
        const k = Object.keys(u).find((k2) => sameId(k2, mid));
        if (!k) return u;
        return { ...u, [k]: { ...u[k], login: rawL } };
      });
    }
  }
  async function deleteMember(mid) {
    const midStr = String(mid);
    const jrIds = seekJrs.filter((j) => sameId(j.seekId, mid)).map((j) => String(j.id));
    await Promise.all([
      db.from("referrals").delete().eq("member_id", midStr),
      jrIds.length ? db.from("jr_referrals").delete().in("jr_id", jrIds) : Promise.resolve(),
      jrIds.length ? db.from("seek_jrs").delete().in("id", jrIds) : Promise.resolve(),
      db.from("credentials").delete().eq("key", midStr),
      ...jrIds.map((jid) => db.from("credentials").delete().eq("key", `jr_${jid}`)),
      db.from("members").delete().eq("id", mid),
      db.from("spin_rewards").delete().eq("seek_id", midStr),
      jrIds.length ? db.from("spin_rewards").delete().in("jr_id", jrIds) : Promise.resolve(),
      db.from("spin_pending").delete().eq("seek_id", midStr),
      jrIds.length ? db.from("spin_pending").delete().in("jr_id", jrIds) : Promise.resolve()
    ]);
    setMembers((u) => u.filter((m) => !sameId(m.id, mid)));
    setSeekJrs((u) => u.filter((j) => !sameId(j.seekId, mid)));
    setReferrals((u) => u.filter((r) => !sameId(r.memberId, mid)));
    setJrReferrals((u) => u.filter((r) => !jrIds.some((jid) => sameId(r.jrId, jid))));
    setCredentials((u) => {
      const nc = { ...u };
      delete nc[midStr];
      jrIds.forEach((jid) => delete nc[`jr_${jid}`]);
      return nc;
    });
    setSpinRewards((u) => u.filter((s) => !sameId(s.seekId, mid) && !jrIds.some((jid) => sameId(s.jrId, jid))));
    setPendingSpins((u) => u.filter((s) => !sameId(s.seekId, mid) && !jrIds.some((jid) => sameId(s.jrId, jid))));
  }
  async function deleteSeekJr(jid) {
    const jidStr = String(jid);
    await Promise.all([
      db.from("jr_referrals").delete().eq("jr_id", jidStr),
      db.from("credentials").delete().eq("key", `jr_${jidStr}`),
      db.from("seek_jrs").delete().eq("id", jidStr),
      db.from("spin_rewards").delete().eq("jr_id", jidStr),
      db.from("spin_pending").delete().eq("jr_id", jidStr)
    ]);
    setSeekJrs((u) => u.filter((j) => !sameId(j.id, jid)));
    setJrReferrals((u) => u.filter((r) => !sameId(r.jrId, jid)));
    setCredentials((u) => {
      const nc = { ...u };
      delete nc[`jr_${jidStr}`];
      return nc;
    });
    setSpinRewards((u) => u.filter((s) => !sameId(s.jrId, jid)));
    setPendingSpins((u) => u.filter((s) => !sameId(s.jrId, jid)));
  }
  async function addAdm(data) {
    const rawL = (data.whatsapp || "").replace(/\D/g, "");
    const payload = { name: data.name, whatsapp: rawL, pix_key: data.pixKey || null, notes: data.notes || null };
    console.log("[addAdm] INSERT payload=", JSON.stringify(payload));
    const { data: row, error } = await db.from("adms").insert(payload).select().single();
    console.log("[addAdm] resposta Supabase \u2014 row=", JSON.stringify(row), "error=", JSON.stringify(error));
    if (error || !row) {
      console.error("[addAdm] FALHOU. C\xF3digo:", error?.code, "Mensagem:", error?.message, "Detalhes:", error?.details);
      window.alert("[SEEK] Erro ao cadastrar vendedor:\n" + (error?.message || "Sem resposta do banco") + (error?.code ? "\nC\xF3digo: " + error.code : ""));
      return;
    }
    setAdms((u) => [...u, mAdm(row)]);
    const pin = data.pin || "0000";
    const { error: eC } = await db.from("credentials").insert({ key: `adm_${row.id}`, login: rawL, pin });
    if (eC) console.error("[addAdm] erro ao salvar credencial:", JSON.stringify(eC));
    setCredentials((u) => ({ ...u, [`adm_${row.id}`]: { login: rawL, pin } }));
    console.log("[addAdm] OK \u2014 vendedor id=", row.id);
  }
  async function deleteAdm(admId) {
    const admStr = String(admId);
    const admMids = members.filter((m) => sameId(m.admId, admId)).map((m) => String(m.id));
    const admJids = seekJrs.filter((j) => admMids.some((id) => sameId(j.seekId, id))).map((j) => String(j.id));
    await Promise.all([
      admMids.length ? db.from("referrals").delete().in("member_id", admMids) : Promise.resolve(),
      admJids.length ? db.from("jr_referrals").delete().in("jr_id", admJids) : Promise.resolve(),
      admJids.length ? db.from("seek_jrs").delete().in("id", admJids) : Promise.resolve(),
      admMids.length ? db.from("credentials").delete().in("key", admMids) : Promise.resolve(),
      ...admJids.map((jid) => db.from("credentials").delete().eq("key", `jr_${jid}`)),
      admMids.length ? db.from("members").delete().in("id", admMids.map(Number)) : Promise.resolve(),
      db.from("credentials").delete().eq("key", `adm_${admStr}`),
      db.from("adms").delete().eq("id", admId)
    ]);
    setAdms((u) => u.filter((a) => !sameId(a.id, admId)));
    setMembers((u) => u.filter((m) => !sameId(m.admId, admId)));
    setSeekJrs((u) => u.filter((j) => !admMids.some((id) => sameId(j.seekId, id))));
    setReferrals((u) => u.filter((r) => !admMids.some((id) => sameId(r.memberId, id))));
    setJrReferrals((u) => u.filter((r) => !admJids.some((id) => sameId(r.jrId, id))));
    setCredentials((u) => {
      const nc = { ...u };
      delete nc[`adm_${admStr}`];
      admMids.forEach((id) => delete nc[id]);
      admJids.forEach((jid) => delete nc[`jr_${jid}`]);
      return nc;
    });
  }
  async function updatePin(key, pin) {
    await db.from("credentials").update({ pin }).eq("key", String(key));
    setCredentials((u) => ({ ...u, [key]: { ...u[key] || {}, pin } }));
  }
  async function addReferral(data, memberId) {
    const old = [...referrals];
    const mid = String(memberId);
    const hasProduct = (data.productValue || 0) > 0;
    const refStatus = hasProduct ? "a_pagar" : "aguardando";
    const tmpId = `__tmp_${Date.now()}`;
    const tmpRef = { id: tmpId, memberId: mid, clientName: data.clientName, whatsapp: data.whatsapp || null, productType: data.productType || "auto", productValue: data.productValue || 0, commission: data.commission || 0, year: data.year, month: data.month, day: data.day, paid: false, isNew: data.isNew !== false, status: refStatus, observacoes: data.observacoes || null, paidAt: null, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
    const withTmp = [...referrals, tmpRef];
    setReferrals(withTmp);
    checkLevelUp(mid, old, withTmp);
    let { data: saved, error } = await db.from("referrals").insert({ member_id: mid, client_name: data.clientName, whatsapp: data.whatsapp || null, product_type: data.productType || "auto", product_value: data.productValue || 0, commission: data.commission || 0, year: data.year, month: data.month, day: data.day, paid: false, is_new: data.isNew !== false, status: refStatus, observacoes: data.observacoes || null }).select().single();
    if (error && error.code === "42703") {
      ({ data: saved, error } = await db.from("referrals").insert({ member_id: mid, client_name: data.clientName, whatsapp: data.whatsapp || null, product_type: data.productType || "auto", product_value: data.productValue || 0, commission: data.commission || 0, year: data.year, month: data.month, day: data.day, paid: false, is_new: data.isNew !== false }).select().single());
    }
    if (error) {
      console.error("[addReferral] ERRO:", error);
      setReferrals(old);
      setDbError("Erro ao salvar indica\xE7\xE3o: " + error.message);
      return;
    }
    setReferrals((u) => u.map((r) => r.id === tmpId ? mRef(saved) : r));
  }
  async function updateReferral(rid, data) {
    setReferrals((u) => u.map((r) => sameId(r.id, rid) ? { ...r, ...data } : r));
    db.from("referrals").update({ client_name: data.clientName, whatsapp: data.whatsapp || null, product_type: data.productType, product_value: data.productValue, commission: data.commission, year: data.year, month: data.month, day: data.day }).eq("id", rid);
  }
  async function togglePaid(rid) {
    const ref = referrals.find((r) => sameId(r.id, rid));
    if (!ref) return;
    const newPaid = !ref.paid;
    const newStatus = newPaid ? "pago" : "a_pagar";
    const paidAt = newPaid ? (/* @__PURE__ */ new Date()).toISOString() : null;
    setReferrals((u) => u.map((r) => sameId(r.id, rid) ? { ...r, paid: newPaid, status: newStatus, paidAt } : r));
    setSpinRewards((u) => u.map((s) => sameId(s.referralId, rid) ? { ...s, paid: newPaid } : s));
    const { error: spinErr } = await db.from("spin_rewards").update({ paid: newPaid }).eq("referral_id", String(rid));
    if (spinErr) console.error("[togglePaid] spin_rewards erro:", spinErr);
    let { error } = await db.from("referrals").update({ paid: newPaid, status: newStatus, paid_at: paidAt }).eq("id", rid);
    if (error && error.code === "42703") ({ error } = await db.from("referrals").update({ paid: newPaid }).eq("id", rid));
    if (error) {
      console.error("[togglePaid]", error);
      setReferrals((u) => u.map((r) => sameId(r.id, rid) ? { ...r, paid: ref.paid, status: ref.status, paidAt: ref.paidAt } : r));
    }
  }
  async function deleteReferral(rid) {
    await db.from("referrals").delete().eq("id", rid);
    setReferrals((u) => u.filter((r) => !sameId(r.id, rid)));
  }
  async function addSeekJr(data) {
    const existing = seekJrs.filter((j) => sameId(j.seekId, data.seekId)).length;
    const jrId = existing === 0 ? `${data.seekId}JR` : `${data.seekId}JR${existing + 1}`;
    const rawJL = (data.whatsapp || "").replace(/\D/g, "");
    const { error: je } = await db.from("seek_jrs").insert({ id: jrId, name: data.name, whatsapp: rawJL, seek_id: String(data.seekId), pin: data.pin || "0000", is_new: true, pix_key: data.pixKey || null });
    if (je) {
      console.error("[addSeekJr]", je);
      return;
    }
    await db.from("credentials").insert({ key: `jr_${jrId}`, login: rawJL || jrId, pin: data.pin || "0000" });
    setSeekJrs((u) => [...u, { id: jrId, name: data.name, whatsapp: rawJL, seekId: String(data.seekId), pin: data.pin || "0000", isNew: true, pixKey: data.pixKey || null }]);
    setCredentials((u) => ({ ...u, [`jr_${jrId}`]: { login: rawJL || jrId, pin: data.pin || "0000" } }));
  }
  async function addJrReferral(data) {
    const hasProduct = (data.productValue || 0) > 0;
    const refStatus = hasProduct ? "a_pagar" : "aguardando";
    const tmpId = `__tmp_${Date.now()}`;
    const tmpRef = { id: tmpId, jrId: String(data.jrId), clientName: data.clientName, whatsapp: data.whatsapp || null, productType: data.productType || "auto", productValue: data.productValue || 0, commission: data.commission || 0, year: data.year, month: data.month, day: data.day, paid: false, isNew: true, status: refStatus, observacoes: data.observacoes || null, paidAt: null, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
    setJrReferrals((u) => [...u, tmpRef]);
    let { data: saved, error } = await db.from("jr_referrals").insert({ jr_id: String(data.jrId), client_name: data.clientName, whatsapp: data.whatsapp || null, product_type: data.productType || "auto", product_value: data.productValue || 0, commission: data.commission || 0, year: data.year, month: data.month, day: data.day, paid: false, is_new: true, status: refStatus, observacoes: data.observacoes || null }).select().single();
    if (error && error.code === "42703") {
      ({ data: saved, error } = await db.from("jr_referrals").insert({ jr_id: String(data.jrId), client_name: data.clientName, whatsapp: data.whatsapp || null, product_type: data.productType || "auto", product_value: data.productValue || 0, commission: data.commission || 0, year: data.year, month: data.month, day: data.day, paid: false, is_new: true }).select().single());
    }
    if (error) {
      console.error("[addJrReferral] ERRO:", error);
      setJrReferrals((u) => u.filter((r) => r.id !== tmpId));
      setDbError("Erro ao salvar indica\xE7\xE3o JR: " + error.message);
      return;
    }
    setJrReferrals((u) => u.map((r) => r.id === tmpId ? mJrRef(saved) : r));
  }
  async function markReferralSold(rid, data, isJr) {
    if (isJr) {
      const ref = jrReferrals.find((r) => sameId(r.id, rid));
      if (!ref) return;
      setJrReferrals((u) => u.map((r) => sameId(r.id, rid) ? { ...r, ...data, status: "a_pagar", paid: false } : r));
      let { error } = await db.from("jr_referrals").update({ product_type: data.productType, product_value: data.productValue, commission: data.commission, year: data.year, month: data.month, day: data.day, paid: false, status: "a_pagar" }).eq("id", rid);
      if (error && error.code === "42703") ({ error } = await db.from("jr_referrals").update({ product_type: data.productType, product_value: data.productValue, commission: data.commission, year: data.year, month: data.month, day: data.day, paid: false }).eq("id", rid));
      if (error) console.error("[markReferralSold jr]", error);
      addSpinPending(null, String(ref.jrId), String(rid));
    } else {
      const ref = referrals.find((r) => sameId(r.id, rid));
      if (!ref) return;
      const oldRefs = [...referrals];
      const newRefs = referrals.map((r) => sameId(r.id, rid) ? { ...r, ...data, status: "a_pagar", paid: false } : r);
      setReferrals(newRefs);
      checkLevelUp(ref.memberId, oldRefs, newRefs);
      let { error } = await db.from("referrals").update({ product_type: data.productType, product_value: data.productValue, commission: data.commission, year: data.year, month: data.month, day: data.day, paid: false, status: "a_pagar" }).eq("id", rid);
      if (error && error.code === "42703") ({ error } = await db.from("referrals").update({ product_type: data.productType, product_value: data.productValue, commission: data.commission, year: data.year, month: data.month, day: data.day, paid: false }).eq("id", rid));
      if (error) console.error("[markReferralSold]", error);
      addSpinPending(String(ref.memberId), null, String(rid));
    }
  }
  async function updateJrReferral(rid, data) {
    setJrReferrals((u) => u.map((r) => sameId(r.id, rid) ? { ...r, ...data } : r));
    db.from("jr_referrals").update({ client_name: data.clientName, whatsapp: data.whatsapp || null, product_type: data.productType, product_value: data.productValue, commission: data.commission, year: data.year, month: data.month, day: data.day }).eq("id", rid);
  }
  async function addSpinPending(seekId, jrId, referralId) {
    const { data: saved, error } = await db.from("spin_pending").insert({ seek_id: seekId || null, jr_id: jrId || null, referral_id: referralId ? String(referralId) : null }).select().single();
    if (error) {
      console.error("[addSpinPending]", error);
      return;
    }
    setPendingSpins((u) => [...u, mSpinPending(saved)]);
  }
  async function consumeSpinPending(pendingId) {
    await db.from("spin_pending").delete().eq("id", pendingId);
    setPendingSpins((u) => u.filter((s) => s.id !== pendingId));
  }
  async function addSpinReward(seekId, jrId, referralId, value) {
    const { data: saved, error } = await db.from("spin_rewards").insert({ seek_id: seekId || null, jr_id: jrId || null, referral_id: referralId ? String(referralId) : null, value, used: true }).select().single();
    if (error) {
      console.error("[addSpinReward]", error);
      return;
    }
    setSpinRewards((u) => [...u, mSpin(saved)]);
  }
  async function toggleSpinPaid(spinId) {
    const spin = spinRewards.find((s) => sameId(s.id, spinId));
    if (!spin) return;
    const newPaid = !spin.paid;
    setSpinRewards((u) => u.map((s) => sameId(s.id, spinId) ? { ...s, paid: newPaid } : s));
    const { error } = await db.from("spin_rewards").update({ paid: newPaid }).eq("id", String(spinId));
    if (error) {
      console.error("[toggleSpinPaid]", error);
      setSpinRewards((u) => u.map((s) => sameId(s.id, spinId) ? { ...s, paid: spin.paid } : s));
    }
  }
  async function payAllForSeek(seekId) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const seekIdStr = String(seekId);
    setReferrals((u) => u.map((r) => sameId(r.memberId, seekId) && !r.paid ? { ...r, paid: true, status: "pago", paidAt: now } : r));
    setSpinRewards((u) => u.map((s) => sameId(s.seekId, seekId) && !s.paid ? { ...s, paid: true } : s));
    let { error: er } = await db.from("referrals").update({ paid: true, status: "pago", paid_at: now }).eq("member_id", seekIdStr);
    if (er && er.code === "42703") await db.from("referrals").update({ paid: true }).eq("member_id", seekIdStr);
    else if (er) console.error("[payAllForSeek]:", er);
    await db.from("spin_rewards").update({ paid: true }).eq("seek_id", seekIdStr);
  }
  async function payAllForJr(jrId) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const jrIdStr = String(jrId);
    setJrReferrals((u) => u.map((r) => sameId(r.jrId, jrId) && !r.paid ? { ...r, paid: true, status: "pago", paidAt: now } : r));
    setSpinRewards((u) => u.map((s) => sameId(s.jrId, jrId) && !s.paid ? { ...s, paid: true } : s));
    let { error: ej } = await db.from("jr_referrals").update({ paid: true, status: "pago", paid_at: now }).eq("jr_id", jrIdStr);
    if (ej && ej.code === "42703") await db.from("jr_referrals").update({ paid: true }).eq("jr_id", jrIdStr);
    else if (ej) console.error("[payAllForJr]:", ej);
    await db.from("spin_rewards").update({ paid: true }).eq("jr_id", jrIdStr);
  }
  async function toggleJrPaid(rid) {
    const ref = jrReferrals.find((r) => sameId(r.id, rid));
    if (!ref) return;
    const newPaid = !ref.paid;
    const newStatus = newPaid ? "pago" : "a_pagar";
    const paidAt = newPaid ? (/* @__PURE__ */ new Date()).toISOString() : null;
    setJrReferrals((u) => u.map((r) => sameId(r.id, rid) ? { ...r, paid: newPaid, status: newStatus, paidAt } : r));
    setSpinRewards((u) => u.map((s) => sameId(s.referralId, rid) ? { ...s, paid: newPaid } : s));
    const { error: spinErr } = await db.from("spin_rewards").update({ paid: newPaid }).eq("referral_id", String(rid));
    if (spinErr) console.error("[toggleJrPaid] spin_rewards erro:", spinErr);
    let { error } = await db.from("jr_referrals").update({ paid: newPaid, status: newStatus, paid_at: paidAt }).eq("id", rid);
    if (error && error.code === "42703") ({ error } = await db.from("jr_referrals").update({ paid: newPaid }).eq("id", rid));
    if (error) {
      console.error("[toggleJrPaid]", error);
      setJrReferrals((u) => u.map((r) => sameId(r.id, rid) ? { ...r, paid: ref.paid, status: ref.status, paidAt: ref.paidAt } : r));
    }
  }
  async function deleteJrReferral(rid) {
    await db.from("jr_referrals").delete().eq("id", rid);
    setJrReferrals((u) => u.filter((r) => r.id !== rid));
  }
  async function dismissLevelNotif(notifId) {
    await db.from("level_notifs").update({ dismissed: true }).eq("id", notifId);
    setLevelNotifs((u) => u.map((n) => sameId(n.id, notifId) ? { ...n, dismissed: true } : n));
  }
  async function addOffer(data) {
    const { data: saved, error } = await db.from("offers").insert({ url: data.url, caption: data.caption || "", category: data.category || "zero-km" }).select().single();
    if (error) {
      console.error("[addOffer]", error);
      setDbError("Erro ao salvar oferta: " + error.message);
      return;
    }
    setOffers((u) => [...u, mOffer(saved)]);
  }
  async function deleteOffer(id) {
    await db.from("offers").delete().eq("id", id);
    setOffers((u) => u.filter((o) => o.id !== id));
  }
  async function markRead(id, type) {
    console.log("[markRead] chamado id=" + id + " type=" + type);
    if (type === "forgot") {
      setPassReqs((u) => u.map((r) => sameId(r.id, id) ? { ...r, resolved: true } : r));
      const { error } = await db.from("pass_requests").update({ resolved: true }).eq("id", id);
      if (error) console.error("[markRead] pass_requests erro:", error);
      else console.log("[markRead] pass_requests ok");
    } else if (type === "jr") {
      setSeekJrs((u) => u.map((j) => sameId(j.id, id) ? { ...j, isNew: false } : j));
      const { error } = await db.from("seek_jrs").update({ is_new: false }).eq("id", id);
      if (error) console.error("[markRead] seek_jrs erro:", error);
      else console.log("[markRead] seek_jrs ok");
    } else {
      const inRefs = referrals.some((r) => sameId(r.id, id));
      console.log("[markRead] ref \u2014 inRefs:" + inRefs + " id:" + id);
      setReferrals((u) => u.map((r) => sameId(r.id, id) ? { ...r, isNew: false } : r));
      setJrReferrals((u) => u.map((r) => sameId(r.id, id) ? { ...r, isNew: false } : r));
      const table = inRefs ? "referrals" : "jr_referrals";
      const { error } = await db.from(table).update({ is_new: false }).eq("id", id);
      if (error) console.error("[markRead] " + table + " erro:", error);
      else console.log("[markRead] " + table + " ok id:" + id);
    }
  }
  function getPanel() {
    if (loading) return /* @__PURE__ */ React.createElement(Spinner, null);
    if (!session) {
      return /* @__PURE__ */ React.createElement(LoginScreen, { onLogin: (s) => {
        console.log("[SEEK route] onLogin received session:", s);
        setSession(s);
      }, credentials, members, seekJrs });
    }
    console.log("[SEEK route] rendering for session:", session);
    if (session.role !== "master") {
      let firstKey = null;
      let firstName = null;
      if (session.role === "adm") {
        firstKey = `adm_${session.admId}`;
        const adm = adms.find((a) => sameId(a.id, session.admId));
        firstName = adm ? adm.name : null;
      } else if (session.role === "member") {
        firstKey = String(session.memberId);
        const mb = members.find((m) => sameId(m.id, session.memberId));
        firstName = mb ? mb.name : null;
      } else if (session.role === "jr") {
        firstKey = `jr_${session.jrId}`;
        const jr = seekJrs.find((j) => sameId(j.id, session.jrId));
        firstName = jr ? jr.name : null;
      }
      const currentPin = (credentials[firstKey] || {}).pin || "0000";
      if (currentPin === "0000") {
        return /* @__PURE__ */ React.createElement(FirstLoginScreen, { userName: firstName, onSave: (newPin) => updatePin(firstKey, newPin), onLogout: () => setSession(null) });
      }
    }
    if (session.role === "jr") {
      const jr = seekJrs.find((j) => sameId(j.id, session.jrId));
      if (!jr) {
        console.error("[SEEK route] JR routing FAILED \u2014 no seekJrs entry matches session.jrId.", { sessionJrId: session.jrId, availableJrIds: seekJrs.map((j) => j.id) });
        return /* @__PURE__ */ React.createElement("div", { style: { padding: 40, textAlign: "center" } }, "JR n\xE3o encontrado. ", /* @__PURE__ */ React.createElement("button", { className: "btn", onClick: () => setSession(null) }, "Sair"));
      }
      const seekMember = members.find((m) => sameId(m.id, jr.seekId));
      if (!seekMember) {
        console.warn("[SEEK route] JR found, but its parent SEEK member was not found \u2014 JR panel will render with seekMember=undefined.", { jrSeekId: jr.seekId, availableMemberIds: members.map((m) => m.id) });
      } else {
        console.log(`[SEEK route] JR PANEL \u2014 jr="${jr.name}" (id=${jr.id}) seekMember="${seekMember.name}" (id=${seekMember.id})`);
      }
      const jrPending = pendingSpins.filter((s) => sameId(s.jrId, jr.id));
      if (jrPending.length > 0) {
        const first = jrPending[0];
        return /* @__PURE__ */ React.createElement(SpinModal, { seekerName: jr.name, pendingCount: jrPending.length, onResult: (v) => addSpinReward(null, String(jr.id), first.referralId, v), onClose: () => consumeSpinPending(first.id) });
      }
      return /* @__PURE__ */ React.createElement(SeekJrPanel, { jr, referrals: jrReferrals, seekMember, credentials, onLogout: () => setSession(null), onAddReferral: addJrReferral, onChangePin: updatePin, offers, spinRewards });
    }
    if (session.role === "member") {
      const member = members.find((m) => sameId(m.id, session.memberId));
      if (!member) {
        console.error("[SEEK route] SEEK routing FAILED \u2014 no members entry matches session.memberId.", { sessionMemberId: session.memberId, availableMemberIds: members.map((m) => m.id) });
        return /* @__PURE__ */ React.createElement("div", { style: { padding: 40, textAlign: "center" } }, "Membro n\xE3o encontrado. ", /* @__PURE__ */ React.createElement("button", { className: "btn", onClick: () => setSession(null) }, "Sair"));
      }
      console.log(`[SEEK route] SEEK PANEL \u2014 member="${member.name}" (id=${member.id})`);
      const memberPending = pendingSpins.filter((s) => sameId(s.seekId, member.id));
      if (memberPending.length > 0) {
        const first = memberPending[0];
        return /* @__PURE__ */ React.createElement(SpinModal, { seekerName: member.name, pendingCount: memberPending.length, onResult: (v) => addSpinReward(String(member.id), null, first.referralId, v), onClose: () => consumeSpinPending(first.id) });
      }
      return /* @__PURE__ */ React.createElement(MemberPanel, { member, referrals, jrReferrals, seekJrs, credentials, onLogout: () => setSession(null), onAddReferral: (data) => addReferral(data, member.id), onAddJr: addSeekJr, onChangePin: updatePin, levelNotifs, onDismissNotif: dismissLevelNotif, offers, spinRewards });
    }
    if (session.role === "master") {
      return /* @__PURE__ */ React.createElement(MasterPanel, { adms, members, referrals, jrReferrals, seekJrs, credentials, offers, passReqs, levelNotifs, onLogout: () => setSession(null), onAddAdm: addAdm, onDeleteAdm: deleteAdm, onAddMember: addMember, onUpdateMember: updateMember, onDeleteMember: deleteMember, onUpdatePin: updatePin, onAddReferral: addReferral, onUpdateReferral: updateReferral, onTogglePaid: togglePaid, onDeleteReferral: deleteReferral, onAddSeekJr: addSeekJr, onDeleteSeekJr: deleteSeekJr, onAddJrReferral: addJrReferral, onToggleJrPaid: toggleJrPaid, onDeleteJrReferral: deleteJrReferral, onAddOffer: addOffer, onDeleteOffer: deleteOffer, onMarkRead: markRead, spinRewards, onMarkSold: markReferralSold, onUpdateJrReferral: updateJrReferral, onToggleSpinPaid: toggleSpinPaid });
    }
    if (session.role === "adm") {
      const adm = adms.find((a) => sameId(a.id, session.admId));
      if (!adm) return /* @__PURE__ */ React.createElement("div", { style: { padding: 40, textAlign: "center" } }, "Vendedor n\xE3o encontrado. ", /* @__PURE__ */ React.createElement("button", { className: "btn", onClick: () => setSession(null) }, "Sair"));
      const myMembers = members.filter((m) => sameId(m.admId, adm.id));
      const mySeekJrs = seekJrs.filter((j) => myMembers.some((m) => sameId(m.id, j.seekId)));
      const myReferrals = referrals.filter((r) => myMembers.some((m) => sameId(m.id, r.memberId)));
      const myJrReferrals = jrReferrals.filter((r) => mySeekJrs.some((j) => sameId(j.id, r.jrId)));
      return /* @__PURE__ */ React.createElement(VendedorPanel, { adm, members: myMembers, referrals: myReferrals, jrReferrals: myJrReferrals, seekJrs: mySeekJrs, credentials, offers, passReqs, levelNotifs, onLogout: () => setSession(null), onAddMember: addMember, onUpdateMember: updateMember, onDeleteMember: deleteMember, onUpdatePin: updatePin, onAddReferral: addReferral, onUpdateReferral: updateReferral, onTogglePaid: togglePaid, onDeleteReferral: deleteReferral, onAddSeekJr: addSeekJr, onDeleteSeekJr: deleteSeekJr, onAddJrReferral: addJrReferral, onToggleJrPaid: toggleJrPaid, onDeleteJrReferral: deleteJrReferral, onAddOffer: addOffer, onDeleteOffer: deleteOffer, onMarkRead: markRead, spinRewards, onMarkSold: markReferralSold, onUpdateJrReferral: updateJrReferral, onToggleSpinPaid: toggleSpinPaid, onPayAllForSeek: payAllForSeek, onPayAllForJr: payAllForJr });
    }
    return null;
  }
  return /* @__PURE__ */ React.createElement(React.Fragment, null, getPanel(), dbError && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: "#C0392B", color: "#fff", padding: "12px 20px", borderRadius: 12, zIndex: 9999, fontSize: ".82rem", fontWeight: 700, maxWidth: "92vw", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,.4)", display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("span", null, "\u26A0\uFE0F ", dbError), /* @__PURE__ */ React.createElement("button", { onClick: () => setDbError(null), style: { background: "none", border: "1px solid rgba(255,255,255,.5)", color: "#fff", padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, flexShrink: 0 } }, "\u2715")));
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
