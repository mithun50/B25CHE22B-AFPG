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

// ─── Desktop-mode capture ────────────────────────────────────────────────────
// Mimics what the browser's "Request Desktop Site" does:
//   1. Temporarily change the viewport meta to force desktop width
//   2. Reset the #template-root transform to scale(1) so there's no skew
//   3. Wait for the browser to reflow at desktop layout
//   4. Capture the live .page element with html2canvas
//   5. Restore the viewport meta and transform exactly as they were
// This works because the user confirmed "Desktop Site" mode exports correctly.
async function capturePageDesktopMode(renderScale) {
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  const originalViewport = viewportMeta ? viewportMeta.content : null;
  const originalTransform = templateRoot.style.transform;

  try {
    // Step 1: Force desktop viewport (disables all @media max-width rules)
    if (viewportMeta) viewportMeta.content = 'width=1200, initial-scale=1';

    // Step 2: Reset template transform to 1:1
    templateRoot.style.transform = 'scale(1)';
    templateRoot.style.transformOrigin = 'top center';

    // Step 3: Wait for full browser reflow
    await new Promise(r => setTimeout(r, 400));

    // Step 4: Capture the live element — it's now in "desktop" layout
    const pageEl = document.querySelector('#template-root .page');
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
      windowWidth: 1200,
      windowHeight: 900,
    });

    return canvas;

  } finally {
    // Step 5: Always restore — even if capture fails
    if (viewportMeta && originalViewport) viewportMeta.content = originalViewport;
    templateRoot.style.transform = originalTransform;
    // Re-apply the correct zoom level for the current device
    updateZoom();
  }
}
// ─────────────────────────────────────────────────────────────────────────────


// PDF Generation
document.getElementById('btn-download').addEventListener('click', async () => {
  const btn = document.getElementById('btn-download');
  const originalText = btn.innerHTML;
  btn.innerText = "Generating PDF...";
  btn.disabled = true;

  try {
    const canvas = await capturePageDesktopMode(2);
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
    const canvas = await capturePageDesktopMode(3);
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
