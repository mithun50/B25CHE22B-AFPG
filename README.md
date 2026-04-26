# Chemistry Assignment Front Page Generator 🧪

A beautiful, responsive, and fully client-side web application designed to generate pristine, academically-formatted A4 assignment front pages for the Chemistry Department at Don Bosco Institute of Technology (VTU).

## 🌟 Features

- **Exact Academic Formatting**: Meticulously recreates the official DBIT/VTU front page layout, complete with double borders and Times New Roman typography.
- **100% Client-Side Rendering**: Uses zero backend servers. The generation happens entirely in the browser using high-resolution HTML-to-canvas rendering.
- **Live Exact Preview**: See exactly what your printed PDF will look like in real-time as you type, complete with zoom controls.
- **Export Options**: Download the crisp output directly as a `.pdf` or export it as a high-resolution `.png` image.
- **Sleek UI**: Built with a modern, glassmorphism-inspired sidebar that looks great on both desktop and mobile.

## 🛠️ Tech Stack

- **HTML5 & CSS3**: For the application UI and the exact A4 layout template.
- **Vanilla JavaScript**: For real-time DOM data-binding.
- **[html2canvas](https://html2canvas.hertzen.com/)**: For taking a high-fidelity snapshot of the HTML template.
- **[jsPDF](https://github.com/parallax/jsPDF)**: For assembling the snapshot into a downloadable A4 PDF document.

## 🚀 Quick Start (Local Development)

Because the application uses external images (`VTU.png` and `dblogo.png`) and leverages HTML canvas, it must be run via a local server to avoid browser Cross-Origin Resource Sharing (CORS) restrictions.

1. Clone the repository:
   ```bash
   git clone https://github.com/mithun50/B25CHE22B-AFPG.git
   ```
2. Navigate to the directory:
   ```bash
   cd B25CHE22B-AFPG
   ```
3. Start a local server:
   ```bash
   npx serve
   ```
4. Open the provided localhost URL in your browser.

## 🌍 Deployment

This application is configured for instant, zero-config deployment on **Vercel**. 

A `vercel.json` file is included to ensure aggressive caching of static assets (like logos and stylesheets) and clean URLs, making the application lightning fast.

## 📝 Credits
Created by **Mithun Gowda B**  
*Don Bosco Institute of Technology, Bengaluru*
