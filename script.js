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

// Exact HTML to PDF Generation
document.getElementById('btn-download').addEventListener('click', async () => {
  const btn = document.getElementById('btn-download');
  const originalText = btn.innerHTML;
  btn.innerText = "Generating PDF...";
  btn.disabled = true;

  try {
    // --- Isolated Clone Capture (Mobile-safe) ---
    // We never touch the live DOM's transform. Instead, we clone the A4 page,
    // place it off-screen at 1:1 scale with no parent transforms, capture it,
    // then destroy the clone. This is the only reliable cross-device approach.
    const pageElement = document.querySelector('#template-root .page');
    const clone = pageElement.cloneNode(true);
    clone.style.cssText = [
      'position: fixed',
      'top: -9999px',
      'left: -9999px',
      'width: 794px',
      'min-height: 1123px',
      'transform: none',
      'z-index: -1',
      'background: #fff',
      'font-family: "Times New Roman", Times, serif',
    ].join(';');
    document.body.appendChild(clone);

    await new Promise(resolve => setTimeout(resolve, 150));

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: clone.scrollHeight || 1123,
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0
    });

    document.body.removeChild(clone);
    // --- End Clone Capture ---

    const imgData = canvas.toDataURL('image/png');

    // Create jsPDF instance for A4
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Download
    const fileName = `Chemistry_Front_Page_${formEls.studentName.value.replace(/\s+/g, '_')}.pdf`;
    pdf.save(fileName);
    logGeneration('PDF');

  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Make sure images are on the same domain or properly configured for CORS.");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// Export as PNG Logic
document.getElementById('btn-export-png').addEventListener('click', async () => {
  const btn = document.getElementById('btn-export-png');
  const originalText = btn.innerHTML;
  btn.innerText = "Exporting PNG...";
  btn.disabled = true;

  try {
    // --- Isolated Clone Capture (Mobile-safe) ---
    const pageElement = document.querySelector('#template-root .page');
    const clone = pageElement.cloneNode(true);
    clone.style.cssText = [
      'position: fixed',
      'top: -9999px',
      'left: -9999px',
      'width: 794px',
      'min-height: 1123px',
      'transform: none',
      'z-index: -1',
      'background: #fff',
      'font-family: "Times New Roman", Times, serif',
    ].join(';');
    document.body.appendChild(clone);

    await new Promise(resolve => setTimeout(resolve, 150));

    const canvas = await html2canvas(clone, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: clone.scrollHeight || 1123,
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0
    });

    document.body.removeChild(clone);
    // --- End Clone Capture ---

    const imgData = canvas.toDataURL('image/png');
    
    // Create download link
    const a = document.createElement('a');
    a.href = imgData;
    a.download = `Chemistry_Front_Page_${formEls.studentName.value.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    logGeneration('PNG');

  } catch (error) {
    console.error("Error exporting PNG:", error);
    alert("Failed to export PNG. Make sure images are on the same domain or properly configured for CORS.");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});
