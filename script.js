// ── Analytics Config ─────────────────────────────────────────────────────────
// Paste your Google Apps Script Web App URL here (the one that logs to Sheets)
const SHEET_LOG_URL = 'https://script.google.com/macros/s/AKfycbxMW5p8THMgpLFtzMTxDof4ftil55Ac9UDSAJfIb_YrbTyuEFGhN6NJNsVkC8JmVgSTUA/exec';

async function logGeneration(type) {
  if (!SHEET_LOG_URL || SHEET_LOG_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') return;
  try {
    await fetch(SHEET_LOG_URL, {
      method: 'POST',
      mode: 'no-cors', // Apps Script doesn't need CORS preflight for POST
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        studentName: formEls.studentName?.value || '',
        usn:         formEls.usn?.value         || '',
        subject:     formEls.subjectName?.value || '',
        subjectCode: formEls.subjectCode?.value || '',
        topic:       formEls.reportTopic?.value || '',
        semester:    formEls.semester?.value    || '',
        section:     formEls.section?.value     || '',
      })
    });
  } catch (_) { /* silent fail — never block the user */ }
}
// ─────────────────────────────────────────────────────────────────────────────

// Elements
const formEls = {
  reportTopic: document.getElementById('f-report-topic'),
  subjectName: document.getElementById('f-subject-name'),
  subjectCode: document.getElementById('f-subject-code'),
  degree: document.getElementById('f-degree'),
  branch: document.getElementById('f-branch'),
  studentName: document.getElementById('f-student-name'),
  usn:         document.getElementById('f-usn'),
  semester: document.getElementById('f-semester'),
  section: document.getElementById('f-section'),
  guideName: document.getElementById('f-guide-name'),
  guideTitle: document.getElementById('f-guide-title'),
  guideDept: document.getElementById('f-guide-dept')
};

const templateEls = {
  reportTopic: document.getElementById('t-report-topic'),
  subjectName: document.getElementById('t-subject-name'),
  subjectCode: document.getElementById('t-subject-code'),
  degree: document.getElementById('t-degree'),
  branch: document.getElementById('t-branch'),
  studentName: document.getElementById('t-student-name'),
  usn:         document.getElementById('t-usn'),
  semester: document.getElementById('t-semester'),
  section: document.getElementById('t-section'),
  guideName: document.getElementById('t-guide-name'),
  guideTitle: document.getElementById('t-guide-title'),
  guideDept: document.getElementById('t-guide-dept')
};

// Real-time data binding
Object.keys(formEls).forEach(key => {
  formEls[key].addEventListener('input', (e) => {
    templateEls[key].textContent = e.target.value;
  });
});

// Zoom Controls
let zoomLevel = window.innerWidth <= 768 ? 0.4 : 0.8;
const templateRoot = document.getElementById('template-root');
const zoomInBtn = document.getElementById('btn-zoom-in');
const zoomOutBtn = document.getElementById('btn-zoom-out');
const zoomLevelText = document.getElementById('zoom-level');

function updateZoom() {
  templateRoot.style.transform = `scale(${zoomLevel})`;
  zoomLevelText.textContent = `${Math.round(zoomLevel * 100)}%`;
}

zoomInBtn.addEventListener('click', () => {
  if (zoomLevel < 1.5) {
    zoomLevel += 0.1;
    updateZoom();
  }
});

zoomOutBtn.addEventListener('click', () => {
  if (zoomLevel > 0.4) {
    zoomLevel -= 0.1;
    updateZoom();
  }
});

// Initialize zoom
updateZoom();

// ─── Fetch image as base64 ───────────────────────────────────────────────────
async function fetchAsBase64(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

// ─── All CSS needed to render the A4 page (no #template-root prefix needed) ──
const PAGE_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.page {
  width: 794px; min-height: 1123px; background: #fff;
  display: flex; flex-direction: column; position: relative;
  font-family: "Times New Roman", Times, serif; color: #000; padding: 18px;
}
.page-border-outer {
  flex: 1; border: 4px solid #000; padding: 4px;
  display: flex; flex-direction: column;
}
.page-border-inner {
  flex: 1; border: 2px solid #000; padding: 50px 40px;
  display: flex; flex-direction: column; align-items: center;
}
.header { text-align: center; margin-bottom: 25px; width: 100%; line-height: 1.5; }
.college-name { font-size: 24px; font-weight: bold; margin-bottom: 4px; letter-spacing: 0.5px; }
.university-name { font-size: 16px; margin-bottom: 4px; }
.autonomous-badge { font-size: 15px; margin-bottom: 10px; }
.logo-container { display: flex; justify-content: center; width: 100%; }
.vtu-container { margin-bottom: 30px; }
.vtu-logo { height: 125px; width: auto; object-fit: contain; }
.dbit-container { margin: 40px 0 20px 0; }
.dbit-logo { height: 130px; width: auto; object-fit: contain; }
.topic-section { text-align: center; margin-bottom: 25px; width: 100%; line-height: 1.6; }
.report-topic { font-size: 18px; margin-bottom: 8px; }
.subject-name { font-size: 18px; font-weight: bold; }
.degree-info { text-align: center; margin-bottom: 20px; font-size: 18px; line-height: 1.8; }
.submitted-by-header { font-size: 18px; margin-bottom: 8px; text-align: left; }
.footer-columns {
  display: flex; justify-content: space-between; width: 100%;
  padding: 0 10px; font-size: 18px; line-height: 1.8; margin-top: auto;
}
.student-column, .guide-column { text-align: left; }
.info-row { margin-bottom: 8px; }
.info-label { display: inline-block; min-width: 50px; }
.guide-column .info-label { min-width: 85px; }
`;

// ─── Self-contained capture (works on all devices) ───────────────────────────
// Strategy:
//   1. Pre-fetch both logos as base64  → no CORS, no network issues
//   2. Inline ALL required CSS         → no external stylesheet dependency
//   3. Render as direct <body> child   → zero parent transforms
//   4. Capture, then destroy           → clean, no side effects
async function capturePageClean(renderScale) {
  // 1. Pre-fetch logos as base64 data URIs
  const [vtuB64, dbitB64] = await Promise.all([
    fetchAsBase64('VTU.png'),
    fetchAsBase64('dblogo.png'),
  ]);

  // 2. Get current live page HTML, swap image src with base64
  let pageHTML = document.querySelector('#template-root .page').outerHTML;
  if (vtuB64)  pageHTML = pageHTML.replace(/src="VTU\.png[^"]*"/,    `src="${vtuB64}"`);
  if (dbitB64) pageHTML = pageHTML.replace(/src="dblogo\.png[^"]*"/, `src="${dbitB64}"`);

  // 3. Build fully isolated wrapper directly on body
  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    'position:fixed',
    'top:-9999px',
    'left:-9999px',
    'width:794px',
    'overflow:visible',
    'transform:none',
    'z-index:99999',
    'background:#fff',
  ].join(';');

  // Inject inlined CSS + page HTML into wrapper
  wrapper.innerHTML = `<style>${PAGE_CSS}</style>${pageHTML}`;
  document.body.appendChild(wrapper);

  // Allow browser to paint
  await new Promise(r => setTimeout(r, 200));

  const pageEl = wrapper.querySelector('.page');
  const canvas = await html2canvas(pageEl, {
    scale: renderScale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: '#ffffff',
    width: 794,
    height: 1123,
    scrollX: 0,
    scrollY: 0,
    windowWidth: 794,
    windowHeight: 1123,
  });

  document.body.removeChild(wrapper);
  return canvas;
}
// ─────────────────────────────────────────────────────────────────────────────

// PDF Generation
document.getElementById('btn-download').addEventListener('click', async () => {
  const btn = document.getElementById('btn-download');
  const originalText = btn.innerHTML;
  btn.innerText = "Generating PDF...";
  btn.disabled = true;

  try {
    const canvas = await capturePageClean(2);
    const imgData = canvas.toDataURL('image/png');

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const fileName = `Chemistry_Front_Page_${formEls.studentName.value.replace(/\s+/g, '_')}.pdf`;
    pdf.save(fileName);
    logGeneration('PDF');

  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// PNG Export
document.getElementById('btn-export-png').addEventListener('click', async () => {
  const btn = document.getElementById('btn-export-png');
  const originalText = btn.innerHTML;
  btn.innerText = "Exporting PNG...";
  btn.disabled = true;

  try {
    const canvas = await capturePageClean(3);
    const imgData = canvas.toDataURL('image/png');

    const a = document.createElement('a');
    a.href = imgData;
    a.download = `Chemistry_Front_Page_${formEls.studentName.value.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    logGeneration('PNG');

  } catch (error) {
    console.error("Error exporting PNG:", error);
    alert("Failed to export PNG. Please try again.");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});
