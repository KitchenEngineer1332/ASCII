let imgEl = null;
let inverted = false;
let useDither = true;
let flipH = false;
let flipV = false;
let rotation = 0;
let filterMode = 'normal';
let colorMode = false;
let frameMode = false;
let animMode = 'scan';
let theme = 'out-dark';
let fs = 7;
let currentZoom = 1;
let lastAscii = '';
let lastLines = [];
let lastPixels = null;
let splitActive = false;
let genTimer = null;

let stencilMode = false;
let gradientMode = false;
let is3D = false;
let maskActive = false;
let maskCtx = null;
let maskData = null;
let isDrawingMask = false;
let abMode = 'A';
let stateA = {};
let stateB = {};

const HISTORY = [];
const HIST_MAX = 5;
const THEMES = ['out-dark', 'out-green', 'out-light', 'out-white', 'out-blue', 'out-pink'];
const THEME_BTNS = ['th-dark', 'th-green', 'th-light', 'th-white', 'th-blue', 'th-pink'];

function initAccentColor() {
  const numColors = 64;
  const h = Math.floor(Math.random() * numColors) * (360 / numColors);

  const primary = `hsl(${h}, 90%, 60%)`;
  const dim = `hsl(${h}, 90%, 40%)`;
  const glow = `hsla(${h}, 90%, 60%, 0.12)`;
  const glow2 = `hsla(${h}, 90%, 60%, 0.22)`;
  const glow3 = `hsla(${h}, 90%, 60%, 0.04)`;
  const text = `hsl(${h}, 50%, 90%)`;
  const grad1 = `hsl(${(h + 60) % 360}, 90%, 65%)`;
  const grad2 = `hsl(${(h + 120) % 360}, 90%, 65%)`;

  const r = document.documentElement;
  r.style.setProperty('--amber', primary);
  r.style.setProperty('--amber-dim', dim);
  r.style.setProperty('--amber-glow', glow);
  r.style.setProperty('--amber-glow2', glow2);
  r.style.setProperty('--amber-glow3', glow3);
  r.style.setProperty('--text', text);
  r.style.setProperty('--grad1', grad1);
  r.style.setProperty('--grad2', grad2);
}

const CHARSETS = {
  standard: '@%#*+=-:. ',
  dense: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,"^`. ',
  blocks: '\u2588\u2593\u2592\u2591 ',
  minimal: '#=:. ',
  slant: '/\\|!;:,\'. ',
  braille: '\u28FF\u28F7\u28EF\u287F\u29FF\u28BF\u28DF\u28FE\u283F\u281F\u280F\u2807\u2803\u2801\u2800',
  dots: '\u25CF\u25C9\u25CE\u25CB\u00B7 ',
  emoji: '\uD83C\uDF11\uD83C\uDF12\uD83C\uDF13\uD83C\uDF14\uD83C\uDF15'
};

const PRESETS = {
  photo: { w: 120, b: 0, c: 100, gam: 100, sh: 25, sat: 100, d: true, inv: false, cs: 'standard', fm: 'normal' },
  dense: { w: 180, b: -10, c: 140, gam: 90, sh: 40, sat: 110, d: true, inv: false, cs: 'dense', fm: 'normal' },
  sketch: { w: 100, b: 10, c: 160, gam: 110, sh: 60, sat: 80, d: false, inv: false, cs: 'minimal', fm: 'normal' },
  bold: { w: 80, b: -20, c: 200, gam: 80, sh: 0, sat: 100, d: false, inv: false, cs: 'blocks', fm: 'normal' },
  wide: { w: 240, b: 0, c: 110, gam: 100, sh: 15, sat: 100, d: true, inv: false, cs: 'standard', fm: 'normal' },
  micro: { w: 50, b: 0, c: 120, gam: 100, sh: 50, sat: 100, d: true, inv: false, cs: 'dense', fm: 'normal' },
  edge: { w: 100, b: 0, c: 200, gam: 100, sh: 0, sat: 0, d: false, inv: false, cs: 'minimal', fm: 'edge' },
  retro: { w: 80, b: -15, c: 180, gam: 120, sh: 30, sat: 90, d: true, inv: false, cs: 'slant', fm: 'normal' }
};

function rui(el, lid, fmt) {
  document.getElementById(lid).textContent = fmt(el.value);
  const pct = ((+el.value - +el.min) / (+el.max - +el.min) * 100).toFixed(1) + '%';
  el.style.setProperty('--pct', pct);
}

function onCsetChange() {
  const v = document.getElementById('cset').value;
  document.getElementById('cust-chars').style.display = v === 'custom' ? 'block' : 'none';
  const wf = document.getElementById('wordfill-text');
  if (wf) wf.style.display = v === 'wordfill' ? 'block' : 'none';
  liveConvert();
}
function getCharset() {
  const v = document.getElementById('cset').value;
  if (v === 'custom') return document.getElementById('cust-chars').value || '@%#*+=-:. ';
  return CHARSETS[v] || CHARSETS.standard;
}
function setInvert(v) {
  inverted = v;
  document.getElementById('inv-n').classList.toggle('active', !v);
  document.getElementById('inv-y').classList.toggle('active', v);
  liveConvert();
}
function setDither(v) {
  useDither = v;
  document.getElementById('dith-n').classList.toggle('active', !v);
  document.getElementById('dith-y').classList.toggle('active', v);
  liveConvert();
}
function toggleFlip(axis) {
  if (axis === 'h') { flipH = !flipH; document.getElementById('flip-h').classList.toggle('active', flipH); }
  else { flipV = !flipV; document.getElementById('flip-v').classList.toggle('active', flipV); }
  liveConvert();
}
function setRotation(deg) {
  rotation = deg;
  [0, 90, 180, 270].forEach(d => {
    const el = document.getElementById('rot-' + d);
    if (el) el.classList.toggle('active', d === deg);
  });
  liveConvert();
}
function setFilter(fm) {
  filterMode = fm;
  ['normal', 'edge', 'emboss'].forEach(m => document.getElementById('fm-' + m).classList.toggle('active', m === fm));
  liveConvert();
}
function setColorMode(v) {
  colorMode = v;
  document.getElementById('col-off').classList.toggle('active', !v);
  document.getElementById('col-on').classList.toggle('active', v);
  if (lastLines.length) renderOutput();
}
function setFrame(v) {
  frameMode = v;
  liveConvert();
}
function setAnimMode(m) {
  animMode = m;
  ['scan', 'type', 'wave', 'instant'].forEach(a => {
    const el = document.getElementById('an-' + a);
    if (el) el.classList.toggle('active', a === m);
  });
  document.getElementById('speed-group').style.display = m === 'instant' ? 'none' : 'block';
}
function setTheme(t) {
  theme = t;
  const out = document.getElementById('ascii-output');
  THEMES.forEach(c => out.classList.remove(c));
  out.classList.add(t);
  THEME_BTNS.forEach((id, i) => document.getElementById(id)?.classList.toggle('active', THEMES[i] === t));
}
function setFs(sz) {
  fs = sz;
  document.getElementById('ascii-output').style.fontSize = sz + 'px';
}
function setLetterSpacing(v) {
  document.getElementById('ascii-output').style.letterSpacing = (v / 100).toFixed(2) + 'em';
}

function setStencil(v) {
  stencilMode = v;
  const off = document.getElementById('fm-stencil-off');
  const on = document.getElementById('fm-stencil-on');
  if (off) off.classList.toggle('active', !v);
  if (on) on.classList.toggle('active', v);
  liveConvert();
}

function setGradient(v) {
  gradientMode = v;
  const off = document.getElementById('fx-grad-off');
  const on = document.getElementById('fx-grad-on');
  if (off) off.classList.toggle('active', !v);
  if (on) on.classList.toggle('active', v);
  const out = document.getElementById('ascii-output');
  if (v) out.classList.add('gradient-text'); else out.classList.remove('gradient-text');
}

function set3D(v) {
  is3D = v;
  const off = document.getElementById('fx-3d-off');
  const on = document.getElementById('fx-3d-on');
  if (off) off.classList.toggle('active', !v);
  if (on) on.classList.toggle('active', v);
  const wrap = document.getElementById('ascii-wrap');
  const out = document.getElementById('ascii-output');
  if (v) { wrap.classList.add('ascii-3d-wrap'); out.classList.add('ascii-3d'); }
  else { wrap.classList.remove('ascii-3d-wrap'); out.classList.remove('ascii-3d'); }
  applyZoom();
}

function toggleThemeUI() {
  document.body.classList.toggle('ui-light');
}

function toggleAB() {
  const btn = document.getElementById('ab-btn');
  const currentState = getConfigState();
  if (abMode === 'A') {
    stateA = currentState;
    if (Object.keys(stateB).length > 0) applyConfigState(stateB);
    abMode = 'B';
    btn.textContent = 'A / B Mode: B';
    btn.style.borderColor = '#4ade80';
    btn.style.color = '#4ade80';
  } else {
    stateB = currentState;
    if (Object.keys(stateA).length > 0) applyConfigState(stateA);
    abMode = 'A';
    btn.textContent = 'A / B Mode: A';
    btn.style.borderColor = 'var(--amber)';
    btn.style.color = 'var(--amber)';
  }
}

function getConfigState() {
  return {
    w: document.getElementById('r-w').value,
    fs: document.getElementById('r-fs').value,
    ls: document.getElementById('r-ls').value,
    b: document.getElementById('r-b').value,
    c: document.getElementById('r-c').value,
    gam: document.getElementById('r-gam').value,
    sat: document.getElementById('r-sat').value,
    sh: document.getElementById('r-sh').value,
    blur: document.getElementById('r-blur').value,
    noise: document.getElementById('r-noise').value,
    tile: document.getElementById('r-tile').value,
    cset: document.getElementById('cset').value,
    custChars: document.getElementById('cust-chars').value,
    wordfill: document.getElementById('wordfill-text').value,
    theme: theme, animMode: animMode, filterMode: filterMode,
    colorMode: colorMode, frameMode: frameMode, frameStyle: document.getElementById('frame-style').value,
    stencilMode: stencilMode, gradientMode: gradientMode, is3D: is3D,
    inverted: inverted, useDither: useDither, flipH: flipH, flipV: flipV, rotation: rotation
  };
}

function applyConfigState(s) {
  const setVal = (id, val) => { const e = document.getElementById(id); if (e) { e.value = val; e.dispatchEvent(new Event('input')); } };
  setVal('r-w', s.w); setVal('r-fs', s.fs); setVal('r-ls', s.ls);
  setVal('r-b', s.b); setVal('r-c', s.c); setVal('r-gam', s.gam);
  setVal('r-sat', s.sat); setVal('r-sh', s.sh); setVal('r-blur', s.blur || 0);
  setVal('r-noise', s.noise || 0); setVal('r-tile', s.tile || 1);

  const cs = document.getElementById('cset'); cs.value = s.cset; cs.dispatchEvent(new Event('change'));
  document.getElementById('cust-chars').value = s.custChars || '';
  document.getElementById('wordfill-text').value = s.wordfill || 'ASCII ';
  document.getElementById('frame-style').value = s.frameStyle || 'none';

  setTheme(s.theme); setAnimMode(s.animMode); setFilter(s.filterMode);
  setColorMode(s.colorMode); setFrame(s.frameMode); setStencil(s.stencilMode || false);
  setGradient(s.gradientMode || false); set3D(s.is3D || false); setInvert(s.inverted);
  setDither(s.useDither);

  flipH = s.flipH; document.getElementById('flip-h').classList.toggle('active', flipH);
  flipV = s.flipV; document.getElementById('flip-v').classList.toggle('active', flipV);
  setRotation(s.rotation);
}

function exportConfig() {
  const json = JSON.stringify(getConfigState(), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'ascii_config.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function importConfig(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const state = JSON.parse(ev.target.result);
      applyConfigState(state);
      toast('Config imported!');
    } catch (err) { toast('Invalid config file'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function doAutoLevels() {
  if (!imgEl) return;
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d');
  cv.width = imgEl.width; cv.height = imgEl.height;
  ctx.drawImage(imgEl, 0, 0);
  const id = ctx.getImageData(0, 0, cv.width, cv.height);
  const d = id.data;
  let min = 255, max = 0;
  for (let i = 0; i < d.length; i += 4) {
    const luma = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    if (luma < min) min = luma;
    if (luma > max) max = luma;
  }
  if (max > min) {
    const contrast = 255 / (max - min);
    const cVal = Math.min(300, Math.max(50, contrast * 100));
    const bVal = Math.min(100, Math.max(-100, 128 - (128 / contrast) - min));
    const rc = document.getElementById('r-c'); rc.value = cVal; rc.dispatchEvent(new Event('input'));
    const rb = document.getElementById('r-b'); rb.value = bVal; rb.dispatchEvent(new Event('input'));
    toast('Auto-levels applied');
  }
}

function changeZoom(delta) {
  currentZoom = Math.max(0.25, Math.min(4, currentZoom + delta));
  applyZoom();
}
function resetZoom() { currentZoom = 1; applyZoom(); }
function applyZoom() {
  document.getElementById('ascii-output').style.setProperty('--zoom', currentZoom);
  document.getElementById('zoom-lbl').textContent = Math.round(currentZoom * 100) + '%';
}

let initialPinchDist = null;
let initialZoom = 1;
document.getElementById('ascii-wrap')?.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    e.preventDefault();
    initialPinchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    initialZoom = currentZoom;
  }
}, { passive: false });
document.getElementById('ascii-wrap')?.addEventListener('touchmove', e => {
  if (e.touches.length === 2 && initialPinchDist) {
    e.preventDefault();
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const scale = dist / initialPinchDist;
    currentZoom = Math.max(0.25, Math.min(4, initialZoom * scale));
    applyZoom();
  }
}, { passive: false });
document.getElementById('ascii-wrap')?.addEventListener('touchend', e => {
  if (e.touches.length < 2) initialPinchDist = null;
});

function toggleSplit() {
  if (!imgEl) { toast('Load an image first'); return; }
  splitActive = !splitActive;
  const wrap = document.getElementById('ascii-wrap');
  wrap.classList.toggle('split-active', splitActive);
  document.getElementById('split-btn').classList.toggle('active', splitActive);
  if (splitActive) {
    document.getElementById('split-img').src = document.getElementById('preview-img').src;
    initSplitDrag();
    document.getElementById('split-divider').style.left = '50%';
    document.getElementById('image-overlay').style.width = '50%';
  }
}
function initSplitDrag() {
  const div = document.getElementById('split-divider');
  const ov = document.getElementById('image-overlay');
  const wrap = document.getElementById('ascii-wrap');
  const move = ev => {
    const rect = wrap.getBoundingClientRect();
    const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
    const pct = Math.max(10, Math.min(90, (clientX - rect.left) / rect.width * 100));
    div.style.left = pct + '%';
    ov.style.width = pct + '%';
  };
  div.onmousedown = e => {
    e.preventDefault();
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', () => document.removeEventListener('mousemove', move), { once: true });
  };
  div.ontouchstart = e => {
    document.addEventListener('touchmove', move, { passive: true });
    document.addEventListener('touchend', () => document.removeEventListener('touchmove', move), { once: true });
  };
}

function openMobileSidebar() {
  document.getElementById('sidebar').classList.add('mobile-open');
  document.getElementById('sidebar-overlay').classList.add('visible');
  document.getElementById('mobile-menu-btn').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
  document.getElementById('mobile-menu-btn').classList.remove('open');
  document.body.style.overflow = '';
}

const COMMANDS = [
  { name: 'Toggle Dark/Light UI', action: toggleThemeUI },
  { name: 'Export Config', action: exportConfig },
  { name: 'Import Config', action: () => document.getElementById('import-input').click() },
  { name: 'Auto Levels', action: doAutoLevels },
  { name: 'Toggle 3D View', action: () => set3D(!is3D) },
  { name: 'Toggle Gradient', action: () => setGradient(!gradientMode) },
  { name: 'Toggle Stencil', action: () => setStencil(!stencilMode) },
  { name: 'Theme: Amber', action: () => setTheme('out-dark') },
  { name: 'Theme: Green', action: () => setTheme('out-green') },
  { name: 'Theme: Light', action: () => setTheme('out-light') },
  { name: 'Theme: Blue', action: () => setTheme('out-blue') },
  { name: 'Theme: Pink', action: () => setTheme('out-pink') },
  { name: 'Generate ASCII', action: doConvert },
  { name: 'Copy ASCII', action: doCopy },
  { name: 'Export PNG', action: doPng }
];
let cmdIndex = 0;

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openCmdPalette();
  }
});

function openCmdPalette() {
  document.getElementById('cmd-palette-modal').classList.add('open');
  const input = document.getElementById('cmd-input');
  if (input) {
    input.value = '';
    input.focus();
  }
  renderCmdList('');
}
function closeCmdPalette() {
  document.getElementById('cmd-palette-modal').classList.remove('open');
}

document.getElementById('cmd-input')?.addEventListener('input', e => {
  renderCmdList(e.target.value);
});
document.getElementById('cmd-input')?.addEventListener('keydown', e => {
  const items = document.querySelectorAll('.cmd-item');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    cmdIndex = (cmdIndex + 1) % items.length;
    updateCmdSelection();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    cmdIndex = (cmdIndex - 1 + items.length) % items.length;
    updateCmdSelection();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (items[cmdIndex]) items[cmdIndex].click();
  } else if (e.key === 'Escape') {
    closeCmdPalette();
  }
});

function renderCmdList(query) {
  const list = document.getElementById('cmd-list');
  if (!list) return;
  list.innerHTML = '';
  cmdIndex = 0;
  const q = query.toLowerCase();
  const filtered = COMMANDS.filter(c => c.name.toLowerCase().includes(q));
  filtered.forEach((cmd, i) => {
    const div = document.createElement('div');
    div.className = 'cmd-item' + (i === 0 ? ' selected' : '');
    div.innerHTML = `<span>${cmd.name}</span><span class="cmd-item-cat">Action</span>`;
    div.onclick = () => { cmd.action(); closeCmdPalette(); };
    div.onmouseenter = () => { cmdIndex = i; updateCmdSelection(); };
    list.appendChild(div);
  });
}
function updateCmdSelection() {
  const items = document.querySelectorAll('.cmd-item');
  items.forEach((item, i) => item.classList.toggle('selected', i === cmdIndex));
  if (items[cmdIndex]) items[cmdIndex].scrollIntoView({ block: 'nearest' });
}

function toggleMaskMode() {
  if (!imgEl) return;
  maskActive = !maskActive;
  const mc = document.getElementById('mask-canvas');
  const btn = document.getElementById('mask-btn');
  if (btn) btn.classList.toggle('active', maskActive);

  if (maskActive) {
    mc.style.display = 'block';
    const cols = +document.getElementById('r-w').value;
    const rows = document.getElementById('canvas').height;
    if (!rows) return;
    const aspect = cols / rows;

    const wrap = document.getElementById('ascii-wrap');
    const wrapRect = wrap.getBoundingClientRect();
    const padding = 32;
    let w = wrapRect.width - padding * 2;
    let h = w / aspect;
    if (h > wrapRect.height - padding * 2) {
      h = wrapRect.height - padding * 2;
      w = h * aspect;
    }

    if (mc.width !== cols || mc.height !== rows) {
      mc.width = cols; mc.height = rows;
      maskCtx = mc.getContext('2d');
      maskCtx.clearRect(0, 0, cols, rows);
      maskCtx.fillStyle = 'rgba(255, 0, 0, 0.4)';
    }

    mc.style.width = w + 'px';
    mc.style.height = h + 'px';

    mc.onmousedown = startDrawingMask;
    mc.onmousemove = drawMask;
    mc.onmouseup = stopDrawingMask;
    mc.onmouseout = stopDrawingMask;

    mc.ontouchstart = startDrawingMask;
    mc.ontouchmove = drawMask;
    mc.ontouchend = stopDrawingMask;
  } else {
    mc.style.display = 'none';
    if (maskCtx) {
      maskData = maskCtx.getImageData(0, 0, mc.width, mc.height).data;
      liveConvert();
    }
  }
}

function startDrawingMask(e) {
  isDrawingMask = true;
  drawMask(e);
}
function stopDrawingMask() {
  isDrawingMask = false;
}
function drawMask(e) {
  if (!isDrawingMask || !maskCtx) return;
  e.preventDefault();
  const mc = document.getElementById('mask-canvas');
  const rect = mc.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const x = (clientX - rect.left) / rect.width * mc.width;
  const y = (clientY - rect.top) / rect.height * mc.height;

  if (e.shiftKey) {
    maskCtx.globalCompositeOperation = 'destination-out';
    maskCtx.beginPath();
    maskCtx.arc(x, y, 15, 0, Math.PI * 2);
    maskCtx.fill();
    maskCtx.globalCompositeOperation = 'source-over';
  } else {
    maskCtx.beginPath();
    maskCtx.arc(x, y, 15, 0, Math.PI * 2);
    maskCtx.fill();
  }
}

function openShortcuts() {
  document.getElementById('shortcuts-modal').classList.add('open');
}
function closeShortcuts() {
  document.getElementById('shortcuts-modal').classList.remove('open');
}

function preset(name) {
  const p = PRESETS[name]; if (!p) return;
  const rw = document.getElementById('r-w');
  const rb = document.getElementById('r-b');
  const rc = document.getElementById('r-c');
  const rsh = document.getElementById('r-sh');
  const rg = document.getElementById('r-gam');
  const rs = document.getElementById('r-sat');
  rw.value = p.w; rui(rw, 'lw', v => v + ' cols');
  rb.value = p.b; rui(rb, 'lb', v => (v > 0 ? '+' : '') + v);
  rc.value = p.c; rui(rc, 'lc', v => (v / 100).toFixed(1) + '×');
  rsh.value = p.sh; rui(rsh, 'lsh', v => v + '%');
  rg.value = p.gam; rui(rg, 'lgam', v => (v / 100).toFixed(1));
  if (rs) { rs.value = p.sat || 100; rui(rs, 'lsat', v => (v / 100).toFixed(1) + '×'); }
  document.getElementById('cset').value = p.cs;
  document.getElementById('cust-chars').style.display = 'none';
  setFilter(p.fm);
  setInvert(p.inv);
  setDither(p.d);
  liveConvert();
}

document.getElementById('file-input').addEventListener('change', e => {
  if (e.target.files[0]) loadFile(e.target.files[0]);
});
function onDragOver(e) {
  e.preventDefault();
  const t = document.getElementById('preview-wrap').style.display === 'block' ? 'preview-wrap' : 'drop-zone';
  document.getElementById(t).classList.add('drag-over');
}
function onDragLeave() {
  document.getElementById('drop-zone').classList.remove('drag-over');
  document.getElementById('preview-wrap').classList.remove('drag-over');
}
function onDrop(e) {
  e.preventDefault(); onDragLeave();
  const f = e.dataTransfer.files[0];
  if (f && f.type.startsWith('image/')) loadFile(f);
  else toast('Please drop an image file');
}
function loadFile(file) {
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      imgEl = img;
      document.getElementById('preview-img').src = ev.target.result;
      const n = file.name;
      document.getElementById('fname').textContent = n.length > 26 ? n.slice(0, 24) + '\u2026' : n;
      document.getElementById('fdims').textContent = img.width + '\u00d7' + img.height + 'px';
      document.getElementById('drop-zone').style.display = 'none';
      document.getElementById('preview-wrap').style.display = 'block';
      setLed('amber');
      closeMobileSidebar();
      doConvert();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function setLed(state) { document.getElementById('out-led').className = 'out-led ' + state; }
function setStatus(s) {
  const el = document.getElementById('status');
  el.className = 's-pill';
  if (s === 'ok') { el.classList.add('s-ok'); el.textContent = 'READY'; }
  else if (s === 'busy') { el.classList.add('s-busy'); el.textContent = 'GENERATING'; }
  else { el.classList.add('s-idle'); el.textContent = 'IDLE'; }
}

function setLiveIndicator(state) {
  const el = document.getElementById('live-indicator');
  const lbl = document.getElementById('live-label');
  if (!el) return;
  el.className = 'live-' + state;
  if (state === 'pending') lbl.textContent = 'Recalculating…';
  else if (state === 'ok') lbl.textContent = 'Ready';
  else lbl.textContent = 'Ready';
}

function pushHistory(ascii) {
  HISTORY.push(ascii);
  if (HISTORY.length > HIST_MAX) HISTORY.shift();
  updateHistoryUI();
  const btn = document.getElementById('undo-btn');
  btn.style.opacity = '1'; btn.style.pointerEvents = 'auto';
}
function doUndo() {
  if (HISTORY.length < 2) return;
  HISTORY.pop();
  const prev = HISTORY[HISTORY.length - 1];
  lastAscii = prev; lastLines = prev.split('\n');
  renderOutput();
  updateHistoryUI();
  if (HISTORY.length < 2) {
    const btn = document.getElementById('undo-btn');
    btn.style.opacity = '0.35'; btn.style.pointerEvents = 'none';
  }
}
function updateHistoryUI() {
  const dots = document.getElementById('hist-dots').children;
  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.toggle('filled', i < HISTORY.length);
    dots[i].classList.toggle('current', i === HISTORY.length - 1);
  }
}

function applySharpen(ctx, w, h, amount) {
  if (amount <= 0) return;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const mix = amount / 100;
  const weights = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  const src = new Uint8ClampedArray(data);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dstOff = (y * w + x) * 4;
      let r = 0, g = 0, b = 0;
      for (let cy = 0; cy < 3; cy++) for (let cx = 0; cx < 3; cx++) {
        const sy = y + cy - 1, sx = x + cx - 1;
        if (sy >= 0 && sy < h && sx >= 0 && sx < w) {
          const sOff = (sy * w + sx) * 4, wt = weights[cy * 3 + cx];
          r += src[sOff] * wt; g += src[sOff + 1] * wt; b += src[sOff + 2] * wt;
        }
      }
      data[dstOff] = src[dstOff] + (r - src[dstOff]) * mix;
      data[dstOff + 1] = src[dstOff + 1] + (g - src[dstOff + 1]) * mix;
      data[dstOff + 2] = src[dstOff + 2] + (b - src[dstOff + 2]) * mix;
    }
  }
  ctx.putImageData(imgData, 0, 0);
}
function applyEdge(grays, w, h) {
  const out = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx =
        -grays[(y - 1) * w + (x - 1)] + grays[(y - 1) * w + (x + 1)]
        - 2 * grays[y * w + (x - 1)] + 2 * grays[y * w + (x + 1)]
        - grays[(y + 1) * w + (x - 1)] + grays[(y + 1) * w + (x + 1)];
      const gy =
        -grays[(y - 1) * w + (x - 1)] - 2 * grays[(y - 1) * w + x] - grays[(y - 1) * w + (x + 1)]
        + grays[(y + 1) * w + (x - 1)] + 2 * grays[(y + 1) * w + x] + grays[(y + 1) * w + (x + 1)];
      out[y * w + x] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
    }
  }
  return out;
}
function applyEmboss(grays, w, h) {
  const out = new Float32Array(w * h);
  const kernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let sum = 128, k = 0;
      for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++) {
        sum += grays[(y + ky) * w + (x + kx)] * kernel[k++];
      }
      out[y * w + x] = Math.max(0, Math.min(255, sum));
    }
  }
  return out;
}

function buildAscii() {
  const cv = document.getElementById('canvas');
  const ctx = cv.getContext('2d');
  const cols = +document.getElementById('r-w').value;

  const radians = rotation * Math.PI / 180;
  const sinA = Math.abs(Math.sin(radians));
  const cosA = Math.abs(Math.cos(radians));
  const srcW = imgEl.width, srcH = imgEl.height;
  const rotW = Math.round(srcW * cosA + srcH * sinA);
  const rotH = Math.round(srcW * sinA + srcH * cosA);
  const aspectH = (rotH / rotW);
  const rows = Math.round(aspectH * cols * 0.48);
  cv.width = cols; cv.height = rows;

  const blurAmt = +document.getElementById('r-blur').value;
  if (blurAmt > 0) ctx.filter = `blur(${blurAmt}px)`;

  const tile = +document.getElementById('r-tile').value;
  ctx.save();
  ctx.translate(cols / 2, rows / 2);
  ctx.rotate(radians);
  if (flipH || flipV) ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  const tw = cols / tile;
  const th = rows / tile;
  for (let ty = 0; ty < tile; ty++) {
    for (let tx = 0; tx < tile; tx++) {
      ctx.drawImage(imgEl, -cols / 2 + tx * tw, -rows / 2 + ty * th, tw, th);
    }
  }
  ctx.restore();
  ctx.filter = 'none';

  const sharpenAmt = +document.getElementById('r-sh').value;
  if (sharpenAmt > 0) applySharpen(ctx, cols, rows, sharpenAmt);

  const satVal = document.getElementById('r-sat') ? +document.getElementById('r-sat').value / 100 : 1;
  if (Math.abs(satVal - 1) > 0.01) {
    const id = ctx.getImageData(0, 0, cols, rows);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      d[i] = Math.max(0, Math.min(255, gray + (r - gray) * satVal));
      d[i + 1] = Math.max(0, Math.min(255, gray + (g - gray) * satVal));
      d[i + 2] = Math.max(0, Math.min(255, gray + (b - gray) * satVal));
    }
    ctx.putImageData(id, 0, 0);
  }

  const imgData = ctx.getImageData(0, 0, cols, rows);
  const data = imgData.data;
  const bright = +document.getElementById('r-b').value;
  const contrast = +document.getElementById('r-c').value / 100;
  const gamma = +document.getElementById('r-gam').value / 100;
  const noiseAmt = +document.getElementById('r-noise').value;

  let chars = getCharset();
  const isWordFill = document.getElementById('cset').value === 'wordfill';
  if (isWordFill) chars = document.getElementById('wordfill-text').value || 'ASCII ';
  const maxIdx = chars.length - 1;

  const grays = new Float32Array(cols * rows);
  const colors = new Uint8Array(cols * rows * 3);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      const i = idx * 4;

      let r = data[i], g_ = data[i + 1], b = data[i + 2];

      if (noiseAmt > 0) {
        const n = (Math.random() - 0.5) * 2 * 255 * (noiseAmt / 100);
        r = Math.max(0, Math.min(255, r + n));
        g_ = Math.max(0, Math.min(255, g_ + n));
        b = Math.max(0, Math.min(255, b + n));
      }

      let g = 0.2126 * r + 0.7152 * g_ + 0.0722 * b;
      g = (g + bright - 128) * contrast + 128;
      g = Math.max(0, Math.min(255, g));
      g = Math.pow(g / 255, 1 / gamma) * 255;
      if (stencilMode) g = g > 127 ? 255 : 0;
      if (inverted) g = 255 - g;

      let maskAlpha = 0;
      if (maskData) maskAlpha = maskData[i + 3] / 255;
      if (maskAlpha > 0) {
        grays[idx] = 255;
        r = data[i]; g_ = data[i + 1]; b = data[i + 2];
      } else {
        grays[idx] = g;
      }

      const ci = idx * 3;
      colors[ci] = r;
      colors[ci + 1] = g_;
      colors[ci + 2] = b;
    }
  }

  let finalGrays = grays;
  if (filterMode === 'edge') finalGrays = applyEdge(grays, cols, rows);
  else if (filterMode === 'emboss') finalGrays = applyEmboss(grays, cols, rows);

  lastPixels = { colors, cols, rows };

  const lines = [];
  let wordFillIdx = 0;
  if (useDither && filterMode === 'normal' && !isWordFill) {
    const dg = new Float32Array(finalGrays);
    for (let y = 0; y < rows; y++) {
      let row = '';
      for (let x = 0; x < cols; x++) {
        const idx = y * cols + x;
        if (maskData && maskData[idx * 4 + 3] > 127) {
          row += '\u2588';
        } else {
          const oldVal = dg[idx];
          const charIdx = Math.max(0, Math.min(maxIdx, Math.round((oldVal / 255) * maxIdx)));
          const newVal = (charIdx / maxIdx) * 255;
          dg[idx] = newVal;
          row += chars[charIdx];
          const err = oldVal - newVal;
          if (x + 1 < cols) dg[idx + 1] += err * 7 / 16;
          if (y + 1 < rows) {
            if (x - 1 >= 0) dg[(y + 1) * cols + x - 1] += err * 3 / 16;
            dg[(y + 1) * cols + x] += err * 5 / 16;
            if (x + 1 < cols) dg[(y + 1) * cols + x + 1] += err * 1 / 16;
          }
        }
      }
      lines.push(row);
    }
  } else {
    for (let y = 0; y < rows; y++) {
      let row = '';
      for (let x = 0; x < cols; x++) {
        const idx = y * cols + x;
        if (maskData && maskData[idx * 4 + 3] > 127) {
          row += '\u2588';
        } else {
          const val = finalGrays[idx];
          if (isWordFill) {
            if (val > 128) { row += ' '; }
            else { row += chars[wordFillIdx % chars.length]; wordFillIdx++; }
          } else {
            row += chars[Math.max(0, Math.min(maxIdx, Math.round((val / 255) * maxIdx)))];
          }
        }
      }
      lines.push(row);
    }
  }

  if (frameMode && lines.length > 0) {
    const w = lines[0].length;
    const style = document.getElementById('frame-style') ? document.getElementById('frame-style').value : 'box';
    let framed = [];
    if (style === 'double') {
      const top = '╔' + '═'.repeat(w) + '╗';
      const bottom = '╚' + '═'.repeat(w) + '╝';
      framed = [top, ...lines.map(l => '║' + l + '║'), bottom];
    } else if (style === 'rounded') {
      const top = '╭' + '─'.repeat(w) + '╮';
      const bottom = '╰' + '─'.repeat(w) + '╯';
      framed = [top, ...lines.map(l => '│' + l + '│'), bottom];
    } else if (style === 'star') {
      const top = '*' + '*'.repeat(w) + '*';
      const bottom = '*' + '*'.repeat(w) + '*';
      framed = [top, ...lines.map(l => '*' + l + '*'), bottom];
    } else {
      const top = '+' + '-'.repeat(w) + '+';
      const bottom = '+' + '-'.repeat(w) + '+';
      framed = [top, ...lines.map(l => '|' + l + '|'), bottom];
    }
    return framed;
  }
  return lines;
}

function renderOutput() {
  const out = document.getElementById('ascii-output');
  out.style.display = 'block';
  out.style.fontSize = fs + 'px';
  out.style.background = '';
  out.style.textShadow = '';
  THEMES.forEach(c => out.classList.remove(c));

  if (colorMode && lastPixels) {
    out.classList.add('colored-mode');
    const { colors, cols } = lastPixels;
    let html = '';
    for (let y = 0; y < lastLines.length; y++) {
      const row = lastLines[y];
      for (let x = 0; x < row.length; x++) {
        const ci = (y * cols + x) * 3;
        const r = colors[ci], g = colors[ci + 1], b = colors[ci + 2];
        const bStr = (0.2126 * r + 0.7152 * g + 0.0722 * b) > 20
          ? `color:rgb(${r},${g},${b})`
          : `color:var(--text-muted)`;
        const ch = row[x] === '<' ? '&lt;' : row[x];
        html += `<span style="${bStr}">${ch}</span>`;
      }
      if (y < lastLines.length - 1) html += '\n';
    }
    out.innerHTML = html;
  } else {
    out.classList.remove('colored-mode');
    out.classList.add(theme);
    out.textContent = lastLines.join('\n');
  }
}

function animateGeneration(lines) {
  const out = document.getElementById('ascii-output');
  const cursor = document.getElementById('gen-cursor');
  const sweep = document.getElementById('scan-sweep');
  const wrap = document.getElementById('ascii-wrap');
  const total = lines.length;
  const speed = +document.getElementById('r-speed').value;
  const batchMap = [1, 3, 6, 12, 30];
  const batch = batchMap[speed - 1];

  if (animMode === 'instant') {
    lastLines = lines;
    lastAscii = lines.join('\n');
    renderOutput();
    out.classList.remove('reveal');
    void out.getBoundingClientRect();
    out.classList.add('reveal');
    finishGeneration(lines);
    return;
  }

  if (animMode === 'wave') {
    lastLines = lines;
    lastAscii = lines.join('\n');
    renderOutput();
    animateWave(out, lines);
    finishGeneration(lines);
    return;
  }

  let rendered = [];
  out.style.display = 'block';
  out.style.fontSize = fs + 'px';
  THEMES.forEach(c => out.classList.remove(c));
  if (!colorMode) out.classList.add(theme);
  wrap.classList.add('generating');
  cursor.classList.add('active');
  if (animMode === 'type') out.classList.add('typewriter-mode');

  let row = 0;
  clearInterval(genTimer);
  const tickMs = Math.max(6, Math.round(48 / (batch * 1.8)));

  genTimer = setInterval(() => {
    const end = Math.min(row + batch, total);
    for (let r = row; r < end; r++) rendered.push(lines[r]);
    row = end;

    lastLines = [...rendered];
    if (colorMode && lastPixels) {
      const { colors, cols } = lastPixels;
      let html = '';
      for (let y = 0; y < rendered.length; y++) {
        const rowStr = rendered[y];
        for (let x = 0; x < rowStr.length; x++) {
          const ci = (y * cols + x) * 3;
          const rr = colors[ci], gg = colors[ci + 1], bb = colors[ci + 2];
          html += `<span style="color:rgb(${rr},${gg},${bb})">${rowStr[x]}</span>`;
        }
        if (y < rendered.length - 1) html += '\n';
      }
      out.innerHTML = html;
      out.style.background = ''; out.style.textShadow = '';
      out.classList.add('colored-mode');
    } else {
      out.style.background = ''; out.style.textShadow = '';
      out.classList.remove('colored-mode');
      out.classList.add(theme);
      out.textContent = rendered.join('\n');
    }


    if (animMode === 'scan' || animMode === 'type') {
      const lineH = fs * 1.18;
      const cursorTop = row * lineH + 16;
      cursor.style.top = Math.max(0, cursorTop - 1) + 'px';
      if (animMode === 'scan') {
        sweep.style.top = Math.max(0, cursorTop - 2) + 'px';
        sweep.style.opacity = '0.9';
      }
      if (cursorTop > wrap.scrollTop + wrap.clientHeight - 40) {
        wrap.scrollTop = cursorTop - wrap.clientHeight + 60;
      }
    }

    if (row >= total) {
      clearInterval(genTimer);
      cursor.classList.remove('active');
      sweep.style.opacity = '0';
      wrap.classList.remove('generating');
      out.classList.remove('typewriter-mode');
      wrap.scrollTop = 0;
      finishGeneration(lines);
    }
  }, tickMs);
}

function animateWave(out, lines) {
  const speed = +document.getElementById('r-speed').value;
  const delay = [80, 55, 35, 18, 6][speed - 1];
  out.classList.add('wave-mode');
  let html = '';
  let charIdx = 0;
  for (let y = 0; y < lines.length; y++) {
    for (let x = 0; x < lines[y].length; x++) {
      const ch = lines[y][x] === '<' ? '&lt;' : lines[y][x];
      const d = (charIdx * delay / lines[y].length).toFixed(0);
      html += `<span class="wave-char" style="animation-delay:${d}ms">${ch}</span>`;
      charIdx++;
    }
    if (y < lines.length - 1) html += '\n';
  }
  out.innerHTML = html;
}

function finishGeneration(lines) {
  lastAscii = lines.join('\n');
  lastLines = lines;
  pushHistory(lastAscii);
  const cols = +document.getElementById('r-w').value;
  document.getElementById('out-meta').textContent = cols + '\u00d7' + lines.length + ' chars';
  document.getElementById('st-chars').textContent = (lastAscii.replace(/\n/g, '').length).toLocaleString();
  setStatus('ok'); setLed('green');
  setLiveIndicator('ok');
  const out = document.getElementById('ascii-output');
  out.classList.remove('impact');
  void out.getBoundingClientRect();
  out.classList.add('impact');
  triggerSweep();
  spawnParticles();
  const logo = document.querySelector('.logo');
  if (logo) setTimeout(() => logo.classList.remove('generating'), 600);
}

function doConvert() {
  if (!imgEl) return;
  clearInterval(genTimer);
  setStatus('busy'); setLed('amber');
  setLiveIndicator('idle');

  const logo = document.querySelector('.logo');

  document.getElementById('placeholder').style.display = 'none';

  if (logo) { logo.classList.remove('generating'); void logo.getBoundingClientRect(); logo.classList.add('generating'); }

  const t0 = performance.now();
  setTimeout(() => {
    try {
      const lines = buildAscii();
      const elapsed = ((performance.now() - t0) / 1000).toFixed(2) + 's';
      document.getElementById('st-time').textContent = elapsed;
      animateGeneration(lines);
    } catch (e) {
      setStatus('idle'); setLed('idle');
      if (logo) logo.classList.remove('generating');
      console.error(e);
    }
  }, 30);
}

function triggerSweep() {
  const s = document.getElementById('scan-sweep');
  s.classList.remove('sweeping');
  void s.getBoundingClientRect();
  s.classList.add('sweeping');
  s.addEventListener('animationend', () => s.classList.remove('sweeping'), { once: true });
}

function spawnParticles() {
  const pc = document.getElementById('particle-canvas');
  const wrap = document.getElementById('ascii-wrap');
  pc.width = wrap.clientWidth;
  pc.height = wrap.clientHeight;
  const ctx = pc.getContext('2d');
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--amber').trim();
  pc.classList.add('show');

  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * pc.width,
    y: Math.random() * pc.height * 0.5,
    vx: (Math.random() - 0.5) * 2.8,
    vy: (Math.random() - 0.5) * 2.8 - 0.8,
    r: Math.random() * 2.5 + 0.5,
    life: 1
  }));

  (function tick() {
    ctx.clearRect(0, 0, pc.width, pc.height);
    let alive = false;
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.07;
      p.life -= 0.022;
      if (p.life <= 0) return;
      alive = true;
      ctx.globalAlpha = p.life * p.life;
      ctx.fillStyle = accent;
      ctx.shadowBlur = 5;
      ctx.shadowColor = accent;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    if (alive) requestAnimationFrame(tick);
    else { pc.classList.remove('show'); ctx.clearRect(0, 0, pc.width, pc.height); }
  })();
}

let dbTimer;
function liveConvert() {
  if (!imgEl) return;
  setLiveIndicator('pending');
  clearTimeout(dbTimer);
  dbTimer = setTimeout(doConvert, 300);
}
['r-w', 'r-b', 'r-c', 'r-sh', 'r-gam', 'r-sat', 'r-blur', 'r-noise', 'r-tile'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', liveConvert);
});

function doCopy() {
  if (!lastAscii) { toast('Generate ASCII first'); return; }
  navigator.clipboard.writeText(lastAscii)
    .then(() => toast('Copied to clipboard!'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = lastAscii; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta); toast('Copied!');
    });
}
function doTxt() {
  if (!lastAscii) { toast('Generate ASCII first'); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([lastAscii], { type: 'text/plain' }));
  a.download = 'ascii-art.txt'; a.click(); toast('Downloading .txt…');
}
function doPng() {
  if (!lastAscii) { toast('Generate ASCII first'); return; }
  const lines = lastAscii.split('\n');
  const fsPx = fs + 2, lh = Math.ceil(fsPx * 1.18), cw = fsPx * 0.6;
  const pw = Math.ceil(lines[0].length * cw) + 32;
  const ph = lines.length * lh + 32;
  const c = document.createElement('canvas'); c.width = pw; c.height = ph;
  const cx = c.getContext('2d');
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--amber').trim() || '#f5a623';
  const bgs = { 'out-dark': '#000', 'out-green': '#001500', 'out-light': '#f5f0e4', 'out-white': '#0d0d0d', 'out-blue': '#000d1a', 'out-pink': '#1a0010' };
  const fgs = { 'out-dark': accent, 'out-green': '#33ff66', 'out-light': '#1a1a0f', 'out-white': '#fff', 'out-blue': '#60cfff', 'out-pink': '#ff6eb4' };
  cx.fillStyle = bgs[theme] || '#000'; cx.fillRect(0, 0, pw, ph);
  if (colorMode && lastPixels) {
    const { colors, cols } = lastPixels;
    cx.font = fsPx + 'px "IBM Plex Mono",monospace'; cx.textBaseline = 'top';
    lines.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ci = (y * cols + x) * 3;
        cx.fillStyle = `rgb(${colors[ci]},${colors[ci + 1]},${colors[ci + 2]})`;
        cx.fillText(row[x], 16 + x * cw, 16 + y * lh);
      }
    });
  } else {
    cx.fillStyle = fgs[theme] || '#f5a623';
    cx.font = fsPx + 'px "IBM Plex Mono",monospace'; cx.textBaseline = 'top';
    lines.forEach((l, i) => cx.fillText(l, 16, 16 + i * lh));
  }
  const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'ascii-art.png'; a.click();
  toast('Downloading PNG…');
}
function doSvg() {
  if (!lastAscii) { toast('Generate ASCII first'); return; }
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--amber').trim() || '#f5a623';
  const bgs = { 'out-dark': '#000', 'out-green': '#001500', 'out-light': '#f5f0e4', 'out-white': '#0d0d0d', 'out-blue': '#000d1a', 'out-pink': '#1a0010' };
  const fgs = { 'out-dark': accent, 'out-green': '#33ff66', 'out-light': '#1a1a0f', 'out-white': '#fff', 'out-blue': '#60cfff', 'out-pink': '#ff6eb4' };
  const lines = lastAscii.split('\n');
  const fsPx = fs + 2, lh = fsPx * 1.18;
  const pw = lines[0].length * fsPx * 0.6 + 32;
  const ph = lines.length * lh + 32;
  const fg = fgs[theme] || '#f5a623';
  const bg = bgs[theme] || '#000';

  const escapedLines = lines.map(l =>
    l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  );

  const textRows = escapedLines.map((l, i) =>
    `<text y="${16 + i * lh + fsPx}">${l}</text>`
  ).join('\n  ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <g font-family="IBM Plex Mono,monospace" font-size="${fsPx}" fill="${fg}" xml:space="preserve" x="16">
  ${textRows}
  </g>
</svg>`;

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  a.download = 'ascii-art.svg'; a.click();
  toast('Downloading SVG…');
}
function doHtml() {
  if (!lastAscii) { toast('Generate ASCII first'); return; }
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--amber').trim() || '#f5a623';
  const bgs = { 'out-dark': '#000', 'out-green': '#001500', 'out-light': '#f5f0e4', 'out-white': '#0d0d0d', 'out-blue': '#000d1a', 'out-pink': '#1a0010' };
  const fgs = { 'out-dark': accent, 'out-green': '#33ff66', 'out-light': '#1a1a0f', 'out-white': '#fff', 'out-blue': '#60cfff', 'out-pink': '#ff6eb4' };
  let body = '';
  if (colorMode && lastPixels) {
    const { colors, cols } = lastPixels;
    lastLines.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ci = (y * cols + x) * 3;
        body += `<span style="color:rgb(${colors[ci]},${colors[ci + 1]},${colors[ci + 2]})">${row[x] === '<' ? '&lt;' : row[x]}</span>`;
      }
      body += '\n';
    });
  } else {
    body = lastAscii.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  }
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>ASCII Art</title>
<style>body{margin:0;background:${bgs[theme] || '#000'};padding:1rem}pre{font-family:"IBM Plex Mono",monospace;font-size:${fs}px;line-height:1.18;color:${fgs[theme] || '#f5a623'}}</style>
</head><body><pre>${body}</pre></body></html>`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  a.download = 'ascii-art.html'; a.click(); toast('Downloading HTML…');
}

let toastT;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
}

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  const key = e.key.toLowerCase();
  if (document.getElementById('shortcuts-modal').classList.contains('open')) {
    if (key === 'escape') closeShortcuts();
    return;
  }
  switch (key) {
    case 'g': doConvert(); break;
    case 'c': doCopy(); break;
    case 'p': doPng(); break;
    case 't': doTxt(); break;
    case 'v': doSvg(); break;
    case 'h': doHtml(); break;
    case 's': toggleSplit(); break;
    case 'u': doUndo(); break;
    case 'i': setInvert(!inverted); break;
    case 'd': setDither(!useDither); break;
    case '+': case '=': changeZoom(+0.25); break;
    case '-': changeZoom(-0.25); break;
    case '0': resetZoom(); break;
    case '?': openShortcuts(); break;
    case 'escape': closeMobileSidebar(); break;
  }
});

(function initMatrix() {
  const c = document.getElementById('matrix-bg');
  const wrap = document.getElementById('ascii-wrap');
  function resize() { c.width = wrap.clientWidth; c.height = wrap.clientHeight; }
  resize();
  new ResizeObserver(resize).observe(wrap);
  const ctx = c.getContext('2d');
  const chars = '01アイウエオカキクケコ@#%&+=-';
  let cols, drops;
  function init() {
    cols = Math.floor(c.width / 14);
    drops = Array(cols).fill(0).map(() => Math.random() * c.height / 14 | 0);
  }
  init();
  new ResizeObserver(init).observe(wrap);
  setInterval(() => {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--amber').trim() || '#f5a623';
    ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = accent; ctx.globalAlpha = 0.65; ctx.font = '12px "IBM Plex Mono",monospace';
    drops.forEach((y, i) => {
      ctx.fillText(chars[Math.random() * chars.length | 0], i * 14, y * 14);
      if (y * 14 > c.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    });
    ctx.globalAlpha = 1;
  }, 80);
})();

window.addEventListener('DOMContentLoaded', () => {
  initAccentColor();
  rui(document.getElementById('r-w'), 'lw', v => v + ' cols');
  rui(document.getElementById('r-b'), 'lb', v => (v > 0 ? '+' : '') + v);
  rui(document.getElementById('r-c'), 'lc', v => (v / 100).toFixed(1) + '×');
  rui(document.getElementById('r-blur'), 'lblur', v => v + 'px');
  rui(document.getElementById('r-noise'), 'lnoise', v => v + '%');
  rui(document.getElementById('r-tile'), 'ltile', v => v + '×');
  rui(document.getElementById('r-sh'), 'lsh', v => v + '%');
  rui(document.getElementById('r-gam'), 'lgam', v => (v / 100).toFixed(1));
  rui(document.getElementById('r-fs'), 'lfs', v => v + 'px');
  rui(document.getElementById('r-ls'), 'lls', v => (v / 100).toFixed(2) + 'em');
  rui(document.getElementById('r-speed'), 'l-speed', v => ['Slowest', 'Slow', 'Medium', 'Fast', 'Turbo'][v - 1]);
  const rsat = document.getElementById('r-sat');
  if (rsat) rui(rsat, 'lsat', v => (v / 100).toFixed(1) + '×');

  document.querySelectorAll('input[type=range]').forEach(el => {
    const pct = ((+el.value - +el.min) / (+el.max - +el.min) * 100).toFixed(1) + '%';
    el.style.setProperty('--pct', pct);
  });
});
