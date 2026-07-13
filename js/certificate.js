// certificate.js — downloadable "Certificate of Completion" PNG, unlocked once a
// player finishes all 5 core levels. Renders on an off-screen canvas (no server
// round-trip) and is shown inside a small in-page modal so the player can type
// their name, preview it live, and download it — with a short tip on attaching
// it to a LinkedIn "Licenses & Certifications" entry.
import * as progress from './progress.js';

const W = 1400;
const H = 990;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCorner(ctx, x, y, dx, dy, len = 34) {
  ctx.strokeStyle = '#2ee6c8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + dy * len);
  ctx.lineTo(x, y);
  ctx.lineTo(x + dx * len, y);
  ctx.stroke();
}

/** Shrinks the font size until `name` fits within maxWidth; returns the fitted size. */
function fitNameFont(ctx, name, maxWidth) {
  let size = 54;
  ctx.font = `700 ${size}px "IBM Plex Sans", sans-serif`;
  while (ctx.measureText(name).width > maxWidth && size > 24) {
    size -= 4;
    ctx.font = `700 ${size}px "IBM Plex Sans", sans-serif`;
  }
  return size;
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}

const CORE_LEVELS = [
  { n: 1, label: 'History' },
  { n: 2, label: 'Concepts' },
  { n: 3, label: 'Tools' },
  { n: 4, label: 'Reasoning' },
  { n: 5, label: 'Build' }
];

export function coreLevelsComplete() {
  return CORE_LEVELS.every(lv => progress.isCompleted(lv.n));
}

function generateCanvas(name) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(46,230,200,0.045)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke(); }

  // Double border frame, like a formal certificate.
  ctx.strokeStyle = '#2ee6c8';
  ctx.lineWidth = 2;
  roundRect(ctx, 34, 34, W - 68, H - 68, 6);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(46,230,200,0.35)';
  ctx.lineWidth = 1;
  roundRect(ctx, 50, 50, W - 100, H - 100, 4);
  ctx.stroke();

  drawCorner(ctx, 70, 70, 1, 1);
  drawCorner(ctx, W - 70, 70, -1, 1);
  drawCorner(ctx, 70, H - 70, 1, -1);
  drawCorner(ctx, W - 70, H - 70, -1, -1);

  const cx = W / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#2ee6c8';
  ctx.font = '600 22px "IBM Plex Mono", monospace';
  ctx.fillText('// CERTIFICATE OF COMPLETION', cx, 140);

  ctx.fillStyle = '#e9f1f3';
  ctx.font = '700 58px "IBM Plex Sans", sans-serif';
  ctx.fillText('ONTOLOGY QUEST', cx, 210);

  ctx.fillStyle = '#93a7b0';
  ctx.font = '400 22px "IBM Plex Sans", sans-serif';
  ctx.fillText('Knowledge Graphs, Ontologies & the Semantic Web', cx, 246);

  ctx.strokeStyle = 'rgba(61,80,88,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 220, 280); ctx.lineTo(cx + 220, 280); ctx.stroke();

  ctx.fillStyle = '#5b6c74';
  ctx.font = '500 20px "IBM Plex Mono", monospace';
  ctx.fillText('THIS CERTIFIES THAT', cx, 330);

  const safeName = (name || 'Anonymous Explorer').slice(0, 60);
  const nameSize = fitNameFont(ctx, safeName, W - 260); // sets ctx.font as a side effect
  ctx.fillStyle = '#e9f1f3';
  ctx.font = `700 ${nameSize}px "IBM Plex Sans", sans-serif`;
  ctx.fillText(safeName, cx, 400);
  const nameWidth = ctx.measureText(safeName).width;
  ctx.strokeStyle = '#2ee6c8';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - nameWidth / 2 - 10, 418); ctx.lineTo(cx + nameWidth / 2 + 10, 418); ctx.stroke();

  ctx.fillStyle = '#93a7b0';
  ctx.font = '400 22px "IBM Plex Sans", sans-serif';
  ctx.fillText('has successfully completed all five core levels of Ontology Quest, demonstrating', cx, 462);
  ctx.fillText('a working understanding of ontologies, RDF/OWL, knowledge graphs & multi-hop reasoning.', cx, 494);

  const totalScore = progress.totalScore();
  ctx.fillStyle = '#5b6c74';
  ctx.font = '600 20px "IBM Plex Mono", monospace';
  ctx.fillText(`FINAL SCORE: ${totalScore} / 500     BADGES EARNED: ${progress.getBadges().length}`, cx, 548);

  ctx.strokeStyle = 'rgba(61,80,88,0.5)';
  ctx.beginPath(); ctx.moveTo(cx - 300, 578); ctx.lineTo(cx + 300, 578); ctx.stroke();

  // Level pill row.
  ctx.font = '600 15px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#5b6c74';
  ctx.fillText('LEVELS COMPLETED', cx, 622);

  const pillGap = 18;
  const pillW = 190;
  const totalPillsWidth = CORE_LEVELS.length * pillW + (CORE_LEVELS.length - 1) * pillGap;
  const pillStartX = cx - totalPillsWidth / 2;
  const pillY = 642, pillH = 78;
  ctx.textAlign = 'left';
  CORE_LEVELS.forEach((lv, i) => {
    const x = pillStartX + i * (pillW + pillGap);
    const score = progress.getScore(lv.n);
    ctx.fillStyle = 'rgba(46,230,200,0.07)';
    ctx.strokeStyle = '#2ee6c8';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, pillY, pillW, pillH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5b6c74';
    ctx.font = '600 12px "IBM Plex Mono", monospace';
    ctx.fillText(`LV ${lv.n} · ${lv.label.toUpperCase()}`, x + 14, pillY + 24);
    ctx.fillStyle = '#35d488';
    ctx.font = '700 26px "IBM Plex Mono", monospace';
    ctx.fillText(`${score}%`, x + 14, pillY + 58);
  });
  ctx.textAlign = 'center';

  // Badge chips (if any), centered row.
  const badges = progress.getBadges();
  if (badges.length) {
    ctx.font = '18px "IBM Plex Sans", sans-serif';
    const labels = badges.slice(0, 8).map(b => b.name);
    const widths = labels.map(l => ctx.measureText(l).width + 28);
    const totalW = widths.reduce((a, b) => a + b, 0) + (labels.length - 1) * 10;
    let bx = cx - totalW / 2;
    const by = 750;
    labels.forEach((label, i) => {
      const w = widths[i];
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(46,230,200,0.08)';
      ctx.strokeStyle = '#2ee6c8';
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, w, 38, 19);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e9f1f3';
      ctx.fillText(label, bx + 14, by + 25);
      bx += w + 10;
    });
    ctx.textAlign = 'center';
  }

  // Footer: credential ID, issue date, link.
  const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const credId = `OQ-${Math.abs(hashCode(safeName + dateStr)).toString(36).toUpperCase().slice(0, 8)}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#5b6c74';
  ctx.font = '500 16px "IBM Plex Mono", monospace';
  ctx.fillText(`Credential ID: ${credId}`, 90, H - 90);
  ctx.fillText(`Issued: ${dateStr}`, 90, H - 64);
  ctx.textAlign = 'right';
  ctx.fillText('ontology-quest \u2014 tmdaidevs.github.io/ontology-quest', W - 90, H - 64);
  ctx.textAlign = 'left';

  return canvas;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Opens the certificate modal: name input, live preview, download & LinkedIn tip. */
export function openCertificateModal() {
  document.getElementById('cert-modal-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'cert-modal-overlay';
  overlay.id = 'cert-modal-overlay';
  const savedName = progress.getCertificateName() || '';
  overlay.innerHTML = `
    <div class="cert-modal">
      <button class="cert-modal-close" id="cert-modal-close" aria-label="Close">✕</button>
      <h3>Your Certificate of Completion</h3>
      <p class="cert-modal-sub">Type the name to print on your certificate, preview it live, then download it as a PNG.</p>
      <div class="cert-name-row">
        <input type="text" id="cert-name-input" maxlength="60" placeholder="Your name" value="${escapeHtml(savedName)}" />
      </div>
      <div class="cert-preview-wrap">
        <canvas id="cert-preview-canvas" class="cert-preview-canvas"></canvas>
      </div>
      <p class="cert-linkedin-tip"><strong>Add it to LinkedIn:</strong> go to Profile → <em>Add profile section</em> → <em>Licenses &amp; certifications</em>, name it "Ontology Quest — Certificate of Completion", and upload this PNG as the media attachment.</p>
      <div class="cert-modal-actions">
        <button class="btn btn-primary" id="cert-download-btn">Download PNG</button>
        <button class="btn btn-ghost" id="cert-modal-close-2">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('#cert-name-input');
  const previewCanvas = overlay.querySelector('#cert-preview-canvas');

  async function refreshPreview() {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (e) { /* best effort */ }
    }
    const name = input.value.trim() || 'Anonymous Explorer';
    const full = generateCanvas(name);
    previewCanvas.width = full.width;
    previewCanvas.height = full.height;
    previewCanvas.getContext('2d').drawImage(full, 0, 0);
  }
  refreshPreview();

  let debounceTimer = null;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(refreshPreview, 220);
  });

  function close() { overlay.remove(); }
  overlay.querySelector('#cert-modal-close').addEventListener('click', close);
  overlay.querySelector('#cert-modal-close-2').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelector('#cert-download-btn').addEventListener('click', async () => {
    const name = input.value.trim() || 'Anonymous Explorer';
    progress.setCertificateName(name);
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (e) { /* best effort */ }
    }
    const canvas = generateCanvas(name);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ontology-quest-certificate.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  });
}
