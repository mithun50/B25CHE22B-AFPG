// ── Analytics Config ─────────────────────────────────────────────────────────
// Paste your Google Apps Script Web App URL here (the one that logs to Sheets)
const SHEET_LOG_URL = 'https://script.google.com/macros/s/AKfycbyZCecryoDcGKXVP1V5u5bu8qlRSVjD_998i-P79WxsBpzJHo490Z5zliS67zqREivkNg/exec';

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
        subject:     formEls.subjectName?.value || '',
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
  degree: document.getElementById('f-degree'),
  branch: document.getElementById('f-branch'),
  studentName: document.getElementById('f-student-name'),
  semester: document.getElementById('f-semester'),
  section: document.getElementById('f-section'),
  guideName: document.getElementById('f-guide-name'),
  guideTitle: document.getElementById('f-guide-title'),
  guideDept: document.getElementById('f-guide-dept')
};

const templateEls = {
  reportTopic: document.getElementById('t-report-topic'),
  subjectName: document.getElementById('t-subject-name'),
  degree: document.getElementById('t-degree'),
  branch: document.getElementById('t-branch'),
  studentName: document.getElementById('t-student-name'),
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
let zoomLevel = 0.8;
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
    // Reset zoom temporarily to ensure crisp 1:1 render
    const oldZoom = zoomLevel;
    zoomLevel = 1.0;
    updateZoom();

    // Small delay to allow DOM to visually update
    await new Promise(resolve => setTimeout(resolve, 100));

    const pageElement = document.querySelector('#template-root .page');

    // Take snapshot
    const canvas = await html2canvas(pageElement, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

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

    // Restore zoom
    zoomLevel = oldZoom;
    updateZoom();

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
    const oldZoom = zoomLevel;
    zoomLevel = 1.0;
    updateZoom();

    await new Promise(resolve => setTimeout(resolve, 100));

    const pageElement = document.querySelector('#template-root .page');

    const canvas = await html2canvas(pageElement, {
      scale: 3, // Very high resolution for image export
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Create download link
    const a = document.createElement('a');
    a.href = imgData;
    a.download = `Chemistry_Front_Page_${formEls.studentName.value.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    logGeneration('PNG');

    zoomLevel = oldZoom;
    updateZoom();

  } catch (error) {
    console.error("Error exporting PNG:", error);
    alert("Failed to export PNG. Make sure images are on the same domain or properly configured for CORS.");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});
