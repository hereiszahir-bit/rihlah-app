#!/usr/bin/env node

/**
 * Rihlah Slide Renderer
 *
 * Takes a content pipeline JSON output and generates an HTML page
 * with brand-styled Instagram slides, ready to download as PNGs.
 *
 * Usage:
 *   node marketing/slides.js marketing/output/sarajevo.json
 *   node marketing/slides.js marketing/output/sarajevo.json --open
 *
 * Or pipe from generate.js:
 *   node marketing/generate.js "Sarajevo" "The City" "cevapi" | node marketing/slides.js --stdin --open
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Brand tokens ---
const BRAND = {
  bg: '#0a0a0a',
  surface: '#141414',
  text: '#f5f1ea',
  textMuted: '#a8a29e',
  textDim: '#6b6560',
  accent: '#c4956a',
  border: '#1e1c1a',
  sans: "'DM Sans', sans-serif",
  serif: "'EB Garamond', serif",
};

function buildPhotoLinks(carousel) {
  const needsPhotos = carousel.filter(s => s.photo && !s.photo_local && s.photo_search?.length);
  if (!needsPhotos.length) return '';

  const links = needsPhotos.map((s, i) => {
    const slideNum = carousel.indexOf(s) + 1;
    const searches = s.photo_search.map(term =>
      `<a href="https://www.pexels.com/search/${encodeURIComponent(term)}/" target="_blank" style="color:${BRAND.accent};text-decoration:none;border-bottom:1px solid ${BRAND.accent}33;">${escapeHTML(term)}</a>`
    ).join(' &nbsp;|&nbsp; ');
    return `<div style="margin-bottom:8px;"><span style="color:${BRAND.textDim};font-size:12px;font-weight:700;margin-right:12px;">SLIDE ${slideNum}</span>${searches}</div>`;
  }).join('');

  return `
  <div style="max-width:1200px;margin:0 auto 24px;padding:16px 20px;background:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:10px;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND.textDim};font-weight:700;margin-bottom:12px;">Photos needed — click to search Pexels</div>
    ${links}
    <div style="font-size:12px;color:${BRAND.textDim};margin-top:12px;">Add a PEXELS_API_KEY to marketing/.env to auto-download photos.</div>
  </div>`;
}

function buildSlideHTML(carousel, caption, slug) {
  const slides = carousel.map((slide, i) => {
    const num = String(i + 1);

    if (slide.type === 'hook') {
      return hookSlide(slide, num);
    } else if (slide.type === 'cta') {
      return ctaSlide(slide, num);
    } else {
      return bodySlide(slide, num, i);
    }
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rihlah Slides — ${slug}</title>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #111; font-family: ${BRAND.sans}; color: ${BRAND.text}; padding: 40px 20px; }
  .controls { max-width: 1200px; margin: 0 auto 20px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .controls button { padding: 12px 24px; border-radius: 10px; border: 1.5px solid #333; background: #1a1a1a; color: ${BRAND.text}; font-family: ${BRAND.sans}; font-size: 14px; font-weight: 600; cursor: pointer; }
  .controls button:hover { border-color: ${BRAND.accent}; color: ${BRAND.accent}; }
  .controls button.primary { background: ${BRAND.accent}; color: ${BRAND.bg}; border-color: ${BRAND.accent}; }
  .status { font-size: 13px; color: ${BRAND.accent}; margin-left: 12px; }
  .title { max-width: 1200px; margin: 0 auto 8px; font-size: 20px; font-weight: 700; }
  .caption-block { max-width: 1200px; margin: 0 auto 24px; padding: 16px 20px; background: ${BRAND.surface}; border: 1px solid ${BRAND.border}; border-radius: 10px; }
  .caption-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: ${BRAND.textDim}; font-weight: 700; margin-bottom: 8px; }
  .caption-text { font-size: 14px; color: ${BRAND.textMuted}; line-height: 1.6; user-select: all; }
  .carousel-row { max-width: 1200px; margin: 0 auto; display: flex; gap: 16px; overflow-x: auto; padding-bottom: 16px; scroll-snap-type: x mandatory; }
  .carousel-row::-webkit-scrollbar { height: 4px; }
  .carousel-row::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
  .slide { width: 1080px; height: 1080px; flex-shrink: 0; position: relative; overflow: hidden; }
  .slide-wrapper { transform: scale(0.33); transform-origin: top left; width: 1080px; height: 1080px; }
  .slide-container { width: 356px; height: 356px; overflow: hidden; flex-shrink: 0; border-radius: 10px; border: 1px solid #222; position: relative; scroll-snap-align: start; }
  .slide-container .sn { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.8); color: #888; font-size: 10px; padding: 3px 7px; border-radius: 4px; z-index: 10; font-weight: 700; }
</style>
</head>
<body>

<div class="title">${slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>

<div class="caption-block">
  <div class="caption-label">Caption (click to select)</div>
  <div class="caption-text">${escapeHTML(caption)}</div>
</div>

<div class="controls">
  <button class="primary" onclick="downloadAll()">Download All Slides</button>
  <span class="status" id="status"></span>
</div>

${buildPhotoLinks(carousel)}

<div class="carousel-row">
${slides.join('\n')}
</div>

<script>
async function renderSlide(el) {
  const wrapper = el.parentElement;
  const container = wrapper.parentElement;
  const origT = wrapper.style.transform;
  const origW = container.style.width;
  const origH = container.style.height;
  const origO = container.style.overflow;
  wrapper.style.transform = 'none';
  container.style.width = '1080px';
  container.style.height = '1080px';
  container.style.overflow = 'visible';
  await new Promise(r => setTimeout(r, 100));
  const canvas = await html2canvas(el, { width: 1080, height: 1080, scale: 1, backgroundColor: '${BRAND.bg}' });
  wrapper.style.transform = origT;
  container.style.width = origW;
  container.style.height = origH;
  container.style.overflow = origO;
  return canvas;
}
function dl(canvas, name) { const a = document.createElement('a'); a.download = name; a.href = canvas.toDataURL('image/png'); a.click(); }
async function downloadAll() {
  const s = document.getElementById('status');
  const slides = document.querySelectorAll('[data-set="slide"]');
  s.textContent = 'Rendering...';
  for (let i = 0; i < slides.length; i++) {
    s.textContent = (i+1) + '/' + slides.length + '...';
    dl(await renderSlide(slides[i]), 'rihlah-${slug}-' + (i+1) + '.png');
    await new Promise(r => setTimeout(r, 400));
  }
  s.textContent = 'Done.';
  setTimeout(() => s.textContent = '', 2000);
}
</script>
</body>
</html>`;
}

// --- Slide templates ---

function hookSlide(slide, num) {
  // Gradient mesh + large typography
  return `
  <div class="slide-container"><div class="sn">${num}</div><div class="slide-wrapper">
    <div class="slide" data-set="slide" style="background:radial-gradient(ellipse at 20% 80%,rgba(196,149,106,0.25) 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,rgba(122,80,40,0.12) 0%,transparent 50%),${BRAND.bg};display:flex;flex-direction:column;justify-content:flex-end;padding:80px 90px;">
      <div style="position:absolute;top:-80px;right:-80px;width:500px;height:500px;border-radius:50%;border:1px solid rgba(196,149,106,0.08);"></div>
      <div style="position:absolute;top:60px;left:90px;width:6px;height:6px;border-radius:50%;background:${BRAND.accent};opacity:0.4;"></div>
      <div style="position:absolute;top:200px;right:120px;width:4px;height:4px;border-radius:50%;background:${BRAND.accent};opacity:0.25;"></div>
      <div style="font-family:${BRAND.sans};font-size:60px;font-weight:800;color:${BRAND.text};letter-spacing:-2px;line-height:1.08;margin-bottom:28px;">${escapeHTML(slide.headline)}</div>
      ${slide.body ? `<div style="font-size:30px;color:${BRAND.textMuted};line-height:1.5;max-width:850px;">${escapeHTML(slide.body)}</div>` : ''}
      <div style="display:flex;align-items:center;gap:12px;margin-top:36px;">
        <div style="font-family:${BRAND.serif};font-size:20px;letter-spacing:4px;color:${BRAND.textDim};"><span style="color:${BRAND.accent};">r</span>ihlah</div>
      </div>
    </div>
  </div></div>`;
}

function bodySlide(slide, num, index) {
  const initial = slide.headline.charAt(0).toUpperCase();

  // If slide has a local photo, use it as background with overlay
  if (slide.photo_local) {
    return `
  <div class="slide-container"><div class="sn">${num}</div><div class="slide-wrapper">
    <div class="slide" data-set="slide" style="background:${BRAND.bg};display:flex;flex-direction:column;justify-content:flex-end;padding:70px 80px;">
      <div style="position:absolute;inset:0;overflow:hidden;">
        <img src="${slide.photo_local}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);min-width:100%;min-height:100%;width:auto;height:auto;">
      </div>
      <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(10,10,10,0.82) 0%,rgba(10,10,10,0.3) 35%,transparent 55%);"></div>
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;position:relative;z-index:1;">
        <div style="font-size:14px;font-weight:800;color:${BRAND.accent};letter-spacing:3px;">${String(index + 1).padStart(2, '0')}</div>
        <div style="flex:1;height:1px;background:rgba(196,149,106,0.3);"></div>
      </div>
      <div style="font-family:${BRAND.sans};font-size:44px;font-weight:800;color:${BRAND.text};letter-spacing:-1.5px;line-height:1.12;margin-bottom:20px;position:relative;z-index:1;">${escapeHTML(slide.headline)}</div>
      ${slide.body ? `<div style="font-size:26px;color:${BRAND.textMuted};line-height:1.5;max-width:850px;position:relative;z-index:1;">${escapeHTML(slide.body)}</div>` : ''}
      ${slide.photo_credit ? `<div style="position:absolute;bottom:20px;right:24px;font-size:10px;color:rgba(245,241,234,0.2);z-index:1;">${escapeHTML(slide.photo_credit)}</div>` : ''}
    </div>
  </div></div>`;
  }

  // Pure graphic slide
  const gradients = [
    `radial-gradient(ellipse at 70% 80%,rgba(196,149,106,0.12) 0%,transparent 50%),${BRAND.bg}`,
    `radial-gradient(ellipse at 30% 70%,rgba(122,154,106,0.1) 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,rgba(196,149,106,0.08) 0%,transparent 50%),${BRAND.bg}`,
    `radial-gradient(ellipse at 80% 80%,rgba(100,90,80,0.15) 0%,transparent 50%),${BRAND.bg}`,
    `radial-gradient(ellipse at 20% 20%,rgba(196,149,106,0.15) 0%,transparent 50%),${BRAND.bg}`,
  ];
  const bg = gradients[index % gradients.length];

  return `
  <div class="slide-container"><div class="sn">${num}</div><div class="slide-wrapper">
    <div class="slide" data-set="slide" style="background:${bg};display:flex;flex-direction:column;justify-content:flex-end;padding:70px 80px;">
      <div style="position:absolute;top:40px;right:60px;font-family:${BRAND.serif};font-size:400px;font-weight:600;color:rgba(196,149,106,0.04);line-height:0.8;">${initial}</div>
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;position:relative;z-index:1;">
        <div style="font-size:14px;font-weight:800;color:${BRAND.accent};letter-spacing:3px;">${String(index + 1).padStart(2, '0')}</div>
        <div style="flex:1;height:1px;background:rgba(196,149,106,0.15);"></div>
      </div>
      <div style="font-family:${BRAND.sans};font-size:44px;font-weight:800;color:${BRAND.text};letter-spacing:-1.5px;line-height:1.12;margin-bottom:20px;position:relative;z-index:1;">${escapeHTML(slide.headline)}</div>
      ${slide.body ? `<div style="font-size:26px;color:${BRAND.textMuted};line-height:1.5;max-width:850px;position:relative;z-index:1;">${escapeHTML(slide.body)}</div>` : ''}
    </div>
  </div></div>`;
}

function ctaSlide(slide, num) {
  return `
  <div class="slide-container"><div class="sn">${num}</div><div class="slide-wrapper">
    <div class="slide" data-set="slide" style="background:radial-gradient(ellipse at 20% 80%,rgba(196,149,106,0.2) 0%,transparent 50%),${BRAND.bg};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:100px;">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:500px;height:500px;border-radius:50%;border:1px solid rgba(196,149,106,0.06);"></div>
      <div style="font-family:${BRAND.serif};font-size:120px;font-weight:600;color:${BRAND.text};line-height:1;position:relative;z-index:1;">R<span style="color:${BRAND.accent};">.</span></div>
      <div style="font-family:${BRAND.serif};font-size:28px;letter-spacing:10px;color:${BRAND.textDim};margin-top:12px;margin-bottom:48px;position:relative;z-index:1;">rihlah</div>
      <div style="font-family:${BRAND.sans};font-size:38px;font-weight:800;color:${BRAND.text};letter-spacing:-0.5px;max-width:700px;line-height:1.2;position:relative;z-index:1;">${escapeHTML(slide.headline)}</div>
      ${slide.body ? `<div style="font-size:24px;color:${BRAND.textMuted};line-height:1.5;max-width:600px;margin-top:20px;position:relative;z-index:1;">${escapeHTML(slide.body.replace('rihlah.io', ''))}</div>` : ''}
      <div style="padding:18px 52px;border:2px solid ${BRAND.accent};border-radius:999px;font-size:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${BRAND.accent};margin-top:40px;position:relative;z-index:1;">rihlah.io</div>
    </div>
  </div></div>`;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const shouldOpen = args.includes('--open');
  const fromStdin = args.includes('--stdin');

  let data;

  if (fromStdin) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    data = JSON.parse(Buffer.concat(chunks).toString());
  } else {
    const filePath = args.find(a => !a.startsWith('--'));
    if (!filePath || !existsSync(filePath)) {
      console.error('Usage: node marketing/slides.js marketing/output/sarajevo.json [--open]');
      console.error('   or: node marketing/generate.js "topic" | node marketing/slides.js --stdin --open');
      process.exit(1);
    }
    data = JSON.parse(readFileSync(filePath, 'utf-8'));
  }

  if (!data.carousel || !data.carousel.length) {
    console.error('No carousel data found in input.');
    process.exit(1);
  }

  const slug = args.find(a => !a.startsWith('--'))
    ? basename(args.find(a => !a.startsWith('--')), '.json')
    : 'slides';

  const html = buildSlideHTML(data.carousel, data.caption || '', slug);
  const outPath = join(__dirname, 'output', `${slug}-slides.html`);
  writeFileSync(outPath, html);
  console.error(`Slides saved to: ${outPath}`);

  if (shouldOpen) {
    // Kill any existing server on 8889, start new one, open
    try { execSync('kill $(lsof -ti:8889) 2>/dev/null', { stdio: 'ignore' }); } catch {}
    execSync(`cd "${join(__dirname, 'output')}" && python3 -m http.server 8889 &>/dev/null &`, { stdio: 'ignore' });
    setTimeout(() => {
      execSync(`open http://localhost:8889/${slug}-slides.html`);
    }, 500);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
