const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });

  const filePath = path.resolve(__dirname, 'carousel-mockups.html');
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait for fonts to load
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 2000));

  // Hide controls and slide numbers for clean export
  await page.evaluate(() => {
    document.querySelector('.controls')?.remove();
    document.querySelectorAll('.slide-number').forEach(el => el.remove());
  });

  const outDir = path.resolve(__dirname, 'export');
  const fs = require('fs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  for (let i = 1; i <= 10; i++) {
    const el = await page.$(`#slide-${i}`);
    if (el) {
      await el.screenshot({
        path: path.join(outDir, `slide-${String(i).padStart(2, '0')}.png`),
        type: 'png',
      });
      console.log(`Exported slide ${i}`);
    } else {
      console.log(`Slide ${i} not found`);
    }
  }

  await browser.close();
  console.log(`\nDone — ${outDir}`);
})();
