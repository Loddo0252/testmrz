public/mrz/script.js
/**
 * MRZ Generator — ICAO 9303 compliant
 * Pure vanilla JavaScript. No dependencies.
 */
/* ====================  ICAO COUNTRY CODES ==================== */
const ICAO_CODES = [
  "AFG","ALB","DZA","AND","AGO","ATG","ARG","ARM","AUS","AUT","AZE",
  "BHS","BHR","BGD","BRB","BLR","BEL","BLZ","BEN","BTN","BOL","BIH",
  "BWA","BRA","BRN","BGR","BFA","BDI","CPV","KHM","CMR","CAN","CAF",
  "TCD","CHL","CHN","COL","COM","COG","COD","CRI","CIV","HRV","CUB",
  "CYP","CZE","DNK","DJI","DMA","DOM","ECU","EGY","SLV","GNQ","ERI",
  "EST","SWZ","ETH","FJI","FIN","FRA","GAB","GMB","GEO","DEU","GHA",
  "GRC","GRD","GTM","GIN","GNB","GUY","HTI","HND","HUN","ISL","IND",
  "IDN","IRN","IRQ","IRL","ISR","ITA","JAM","JPN","JOR","KAZ","KEN",
  "KIR","PRK","KOR","KWT","KGZ","LAO","LVA","LBN","LSO","LBR","LBY",
  "LIE","LTU","LUX","MDG","MWI","MYS","MDV","MLI","MLT","MHL","MRT",
  "MUS","MEX","FSM","MDA","MCO","MNG","MNE","MAR","MOZ","MMR","NAM",
  "NRU","NPL","NLD","NZL","NIC","NER","NGA","MKD","NOR","OMN","PAK",
  "PLW","PAN","PNG","PRY","PER","PHL","POL","PRT","QAT","ROU","RUS",
  "RWA","KNA","LCA","VCT","WSM","SMR","STP","SAU","SEN","SRB","SYC",
  "SLE","SGP","SVK","SVN","SLB","SOM","ZAF","SSD","ESP","LKA","SDN",
  "SUR","SWE","CHE","SYR","TWN","TJK","TZA","THA","TLS","TGO","TON",
  "TTO","TUN","TUR","TKM","TUV","UGA","UKR","ARE","GBR","USA","URY",
  "UZB","VUT","VEN","VNM","YEM","ZMB","ZWE","D<<","UTO","EUE","UNO","UNA","UNK","XXA","XXB","XXC","XXX"
];
/* ====================  HELPERS ==================== */
/**
 * Remove diacritics & transliterate to ICAO safe chars (A-Z 0-9 <).
 */
function sanitize(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, "<")
    .replace(/[^A-Z0-9<]/g, "");
}
/**
 * ICAO character value: 0-9 → 0-9; A-Z → 10-35; < → 0.
 */
function charVal(ch) {
  if (ch === "<") return 0;
  const c = ch.charCodeAt(0);
  return c >= 48 && c <= 57 ? c - 48 : c - 55; // A=10 … Z=35
}
/**
 * ICAO 7-3-1 weighted check digit.
 */
function checkDigit(str) {
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += charVal(str[i]) * weights[i % 3];
  }
  return (sum % 10).toString();
}
/**
 * Pad / truncate a string with '<' to a fixed length.
 */
function pad(str, len) {
  str = sanitize(str);
  return str.length >= len ? str.substring(0, len) : str + "<".repeat(len - str.length);
}
/**
 * Format a Date to YYMMDD.
 */
function dateToYYMMDD(dateStr) {
  if (!dateStr) return "<<<<<<";
  const d = new Date(dateStr);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return yy + mm + dd;
}
/* ====================  MRZ BUILDERS ==================== */
/**
 * Build TD3 Passport MRZ (2 lines × 44 chars).
 */
function buildTD3(data) {
  // Line 1: P<ISSUING_COUNTRY SURNAME<<GIVEN<NAMES
  const typeField = "P<";
  const issuing = pad(data.issuingCountry, 3);
  const nameField = pad(data.surname + "<<" + data.givenNames.replace(/\s+/g, "<"), 39);
  const line1 = typeField + issuing + nameField;
  // Line 2
  const docNum = pad(data.docNumber, 9);
  const docNumCD = checkDigit(docNum);
  const nat = pad(data.nationality, 3);
  const dob = dateToYYMMDD(data.dob);
  const dobCD = checkDigit(dob);
  const sex = data.sex || "<";
  const exp = dateToYYMMDD(data.expiry);
  const expCD = checkDigit(exp);
  const pn = pad(data.personalNumber || "", 14);
  const pnCD = checkDigit(pn);
  const compositeSource = docNum + docNumCD + dob + dobCD + exp + expCD + pn + pnCD;
  const compositeCD = checkDigit(compositeSource);
  const line2 = docNum + docNumCD + nat + dob + dobCD + sex + exp + expCD + pn + pnCD + compositeCD;
  return {
    lines: [line1, line2],
    checks: {
      "Doc #": docNumCD,
      "DOB": dobCD,
      "Expiry": expCD,
      "Personal #": pnCD,
      "Composite": compositeCD,
    },
  };
}
/**
 * Build TD1 ID Card MRZ (3 lines × 30 chars).
 */
function buildTD1(data) {
  const type = pad("I", 1) + "<"; // or AC etc.
  const issuing = pad(data.issuingCountry, 3);
  const docNum = pad(data.docNumber, 9);
  const docNumCD = checkDigit(docNum);
  const opt1 = pad(data.personalNumber || "", 15);
  const line1 = type + issuing + docNum + docNumCD + opt1;
  const dob = dateToYYMMDD(data.dob);
  const dobCD = checkDigit(dob);
  const sex = data.sex || "<";
  const exp = dateToYYMMDD(data.expiry);
  const expCD = checkDigit(exp);
  const nat = pad(data.nationality, 3);
  const opt2 = pad("", 11);
  const compositeSource = docNum + docNumCD + opt1 + dob + dobCD + exp + expCD + opt2;
  const compositeCD = checkDigit(compositeSource);
  const line2 = dob + dobCD + sex + exp + expCD + nat + opt2 + compositeCD;
  const nameField = pad(data.surname + "<<" + data.givenNames.replace(/\s+/g, "<"), 30);
  const line3 = nameField;
  return {
    lines: [line1, line2, line3],
    checks: { "Doc #": docNumCD, "DOB": dobCD, "Expiry": expCD, "Composite": compositeCD },
  };
}
/**
 * Build MRV-A Visa MRZ (2 lines × 44 chars).
 */
function buildMRVA(data) {
  const typeField = "V<";
  const issuing = pad(data.issuingCountry, 3);
  const nameField = pad(data.surname + "<<" + data.givenNames.replace(/\s+/g, "<"), 39);
  const line1 = typeField + issuing + nameField;
  const docNum = pad(data.docNumber, 9);
  const docNumCD = checkDigit(docNum);
  const nat = pad(data.nationality, 3);
  const dob = dateToYYMMDD(data.dob);
  const dobCD = checkDigit(dob);
  const sex = data.sex || "<";
  const exp = dateToYYMMDD(data.expiry);
  const expCD = checkDigit(exp);
  const opt = pad(data.personalNumber || "", 16);
  const line2 = docNum + docNumCD + nat + dob + dobCD + sex + exp + expCD + opt;
  return {
    lines: [line1, line2],
    checks: { "Doc #": docNumCD, "DOB": dobCD, "Expiry": expCD },
  };
}
/**
 * Build MRV-B Visa MRZ (2 lines × 36 chars).
 */
function buildMRVB(data) {
  const typeField = "V<";
  const issuing = pad(data.issuingCountry, 3);
  const nameField = pad(data.surname + "<<" + data.givenNames.replace(/\s+/g, "<"), 31);
  const line1 = typeField + issuing + nameField;
  const docNum = pad(data.docNumber, 9);
  const docNumCD = checkDigit(docNum);
  const nat = pad(data.nationality, 3);
  const dob = dateToYYMMDD(data.dob);
  const dobCD = checkDigit(dob);
  const sex = data.sex || "<";
  const exp = dateToYYMMDD(data.expiry);
  const expCD = checkDigit(exp);
  const opt = pad(data.personalNumber || "", 8);
  const line2 = docNum + docNumCD + nat + dob + dobCD + sex + exp + expCD + opt;
  return {
    lines: [line1, line2],
    checks: { "Doc #": docNumCD, "DOB": dobCD, "Expiry": expCD },
  };
}
/**
 * Dispatch to the correct builder.
 */
function generateMRZ(data) {
  switch (data.docType) {
    case "TD1":  return buildTD1(data);
    case "MRVA": return buildMRVA(data);
    case "MRVB": return buildMRVB(data);
    default:     return buildTD3(data);
  }
}
/* ====================  RANDOM DATA ==================== */
const FIRST_NAMES = ["JOHN","JANE","CARLOS","ANNA","FATIMA","YUKI","LIAM","OLIVIA","NOAH","EMMA","SOFIA","ALI","CHEN","AMIR","INGRID"];
const LAST_NAMES  = ["SMITH","GARCIA","MULLER","TANAKA","NGUYEN","PATEL","KIM","ROSSI","SILVA","ANDERSSON","IVANOV","OKAFOR"];
function randomDate(yearMin, yearMax) {
  const y = yearMin + Math.floor(Math.random() * (yearMax - yearMin));
  const m = 1 + Math.floor(Math.random() * 12);
  const d = 1 + Math.floor(Math.random() * 28);
  return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
function randomAlphaNum(len) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let r = "";
  for (let i = 0; i < len; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
}
function fillRandom() {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  $("docType").value = pick(["TD3","TD1","MRVA","MRVB"]);
  $("issuingCountry").value = pick(ICAO_CODES);
  $("nationality").value = pick(ICAO_CODES);
  $("surname").value = pick(LAST_NAMES);
  $("givenNames").value = pick(FIRST_NAMES) + " " + pick(FIRST_NAMES);
  $("docNumber").value = randomAlphaNum(9);
  $("dob").value = randomDate(1960, 2005);
  $("expiry").value = randomDate(2025, 2035);
  $("sex").value = pick(["M","F","X"]);
  $("personalNumber").value = Math.random() > 0.5 ? randomAlphaNum(8) : "";
  updateDocTypeChip();
  livePreview();
}
/* ====================  DOM HELPERS ==================== */
const $ = (id) => document.getElementById(id);
function populateCountrySelects() {
  const opts = ICAO_CODES.map((c) => `<option value="${c}">${c}</option>`).join("");
  $("issuingCountry").innerHTML = opts;
  $("nationality").innerHTML = opts;
  $("issuingCountry").value = "USA";
  $("nationality").value = "USA";
}
function updateDocTypeChip() {
  const labels = { TD3: "TD3 · Passport", TD1: "TD1 · ID Card", MRVA: "MRV-A · Visa", MRVB: "MRV-B · Visa" };
  $("docTypeChip").textContent = labels[$("docType").value] || "";
}
function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}
/* ====================  VALIDATION ==================== */
function validate() {
  let ok = true;
  const required = ["surname","givenNames","docNumber","dob","expiry"];
  required.forEach((id) => {
    const el = $(id);
    const field = el.closest(".field");
    if (!el.value.trim()) {
      field.classList.add("invalid");
      ok = false;
    } else {
      field.classList.remove("invalid");
    }
  });
  return ok;
}
/* ====================  RENDER ==================== */
function readForm() {
  return {
    docType: $("docType").value,
    issuingCountry: $("issuingCountry").value,
    surname: $("surname").value,
    givenNames: $("givenNames").value,
    docNumber: $("docNumber").value,
    nationality: $("nationality").value,
    dob: $("dob").value,
    sex: $("sex").value,
    expiry: $("expiry").value,
    personalNumber: $("personalNumber").value,
  };
}
function renderMRZ(result) {
  $("mrzOutput").textContent = result.lines.join("\n");
  const cdEl = $("checkDigits");
  cdEl.innerHTML = Object.entries(result.checks)
    .map(([k, v]) => `<span class="cd-pill">${k}<b>${v}</b></span>`)
    .join("");
}
function livePreview() {
  const data = readForm();
  if (!data.surname && !data.docNumber) {
    $("mrzOutput").textContent = "Fill the form to preview…";
    $("checkDigits").innerHTML = "";
    return;
  }
  const result = generateMRZ(data);
  renderMRZ(result);
}
/* ====================  ACTIONS ==================== */
function handleGenerate(e) {
  e.preventDefault();
  if (!validate()) { showToast("⚠ Please fill all required fields"); return; }
  const btn = $("generateBtn");
  btn.classList.add("loading");
  setTimeout(() => {
    const data = readForm();
    const result = generateMRZ(data);
    renderMRZ(result);
    btn.classList.remove("loading");
    $("statusChip").textContent = "✔ Generated";
    showToast("✅ MRZ generated!");
  }, 350);
}
function handleCopy() {
  const text = $("mrzOutput").textContent;
  if (!text || text.startsWith("Fill")) return;
  navigator.clipboard.writeText(text).then(() => showToast("📋 Copied to clipboard!"));
}
function handleDownloadTxt() {
  const text = $("mrzOutput").textContent;
  if (!text || text.startsWith("Fill")) return;
  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "mrz.txt";
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("⬇ Downloaded TXT");
}
function handleDownloadPng() {
  const text = $("mrzOutput").textContent;
  if (!text || text.startsWith("Fill")) return;
  const lines = text.split("\n");
  const canvas = $("renderCanvas");
  const ctx = canvas.getContext("2d");
  const fontSize = 22;
  const lineH = fontSize * 1.8;
  canvas.width = Math.max(...lines.map((l) => l.length)) * fontSize * 0.65 + 60;
  canvas.height = lines.length * lineH + 50;
  ctx.fillStyle = "#0f1226";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize}px "Courier New", monospace`;
  ctx.fillStyle = "#e6f0ff";
  ctx.textBaseline = "top";
  lines.forEach((line, i) => ctx.fillText(line, 30, 20 + i * lineH));
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "mrz.png";
  a.click();
  showToast("🖼 Downloaded PNG");
}
function handlePrint() {
  const text = $("mrzOutput").textContent;
  if (!text || text.startsWith("Fill")) return;
  document.body.setAttribute("data-mrz", text);
  window.print();
}
function handleClear() {
  $("mrzForm").reset();
  $("issuingCountry").value = "USA";
  $("nationality").value = "USA";
  $("mrzOutput").textContent = "Fill the form to preview…";
  $("checkDigits").innerHTML = "";
  $("statusChip").textContent = "Live preview";
  document.querySelectorAll(".field").forEach((f) => f.classList.remove("invalid"));
}
function toggleTheme() {
  const isDark = document.body.classList.contains("theme-dark");
  document.body.classList.toggle("theme-dark", !isDark);
  document.body.classList.toggle("theme-light", isDark);
  $("themeToggle").textContent = isDark ? "☀️" : "🌙";
}
/* ====================  INIT ==================== */
document.addEventListener("DOMContentLoaded", () => {
  populateCountrySelects();
  updateDocTypeChip();
  // Live preview on any input change
  $("mrzForm").addEventListener("input", () => { livePreview(); updateDocTypeChip(); });
  $("mrzForm").addEventListener("change", () => { livePreview(); updateDocTypeChip(); });
  // Buttons
  $("mrzForm").addEventListener("submit", handleGenerate);
  $("randomBtn").addEventListener("click", fillRandom);
  $("clearBtn").addEventListener("click", handleClear);
  $("copyBtn").addEventListener("click", handleCopy);
  $("txtBtn").addEventListener("click", handleDownloadTxt);
  $("pngBtn").addEventListener("click", handleDownloadPng);
  $("printBtn").addEventListener("click", handlePrint);
  $("themeToggle").addEventListener("click", toggleTheme);
  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); $("generateBtn").click(); }
    if (e.ctrlKey && e.key === "k")     { e.preventDefault(); toggleTheme(); }
    if (e.ctrlKey && e.key === "r" && !e.shiftKey) { e.preventDefault(); fillRandom(); }
  });
  // Accessibility: auto-uppercase inputs
  document.querySelectorAll("input[type=text]").forEach((inp) => {
    inp.style.textTransform = "uppercase";
    inp.addEventListener("blur", () => { inp.value = inp.value.toUpperCase(); });
  });
});
