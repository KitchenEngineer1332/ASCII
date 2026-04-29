   // ── State ──────────────────────────────────────────────────────────────────
    let imgEl      = null;
    let inverted   = false;
    let useDither  = true;
    let flipH      = false;
    let flipV      = false;
    let filterMode = 'normal';  // 'normal' | 'edge' | 'emboss'
    let colorMode  = false;
    let animMode   = 'scan';    // 'scan' | 'type' | 'instant'
    let theme      = 'out-dark';
    let fs         = 7;
    let currentZoom = 1;
    let lastAscii  = '';
    let lastLines  = [];        // array of rows for typewriter
    let lastPixels = null;      // for colored mode
    let splitActive = false;
    let genTimer   = null;      // typewriter interval handle

    // History (up to 5)
    const HISTORY   = [];
    const HIST_MAX  = 5;

    const THEMES     = ['out-dark','out-green','out-light','out-white','out-blue','out-pink'];
    const THEME_BTNS = ['th-dark','th-green','th-light','th-white','th-blue','th-pink'];

    // ── Accent Colors ──────────────────────────────────────────────────────────
    const ACCENT_COLORS = [
      { primary:'#f5a623', dim:'#c47d0e', glow:'rgba(245,166,35,0.12)', glow2:'rgba(245,166,35,0.22)', glow3:'rgba(245,166,35,0.04)', text:'#e8d5a3' },
      { primary:'#ff6b6b', dim:'#cc3333', glow:'rgba(255,107,107,0.12)',glow2:'rgba(255,107,107,0.22)',glow3:'rgba(255,107,107,0.04)',text:'#ffe0e0' },
      { primary:'#4ecdc4', dim:'#2a9e8c', glow:'rgba(78,205,196,0.12)', glow2:'rgba(78,205,196,0.22)', glow3:'rgba(78,205,196,0.04)', text:'#d0f5f3' },
      { primary:'#aa96da', dim:'#8872b0', glow:'rgba(170,150,218,0.12)',glow2:'rgba(170,150,218,0.22)',glow3:'rgba(170,150,218,0.04)',text:'#f0ebff' },
      { primary:'#a7c957', dim:'#85a046', glow:'rgba(167,201,87,0.12)', glow2:'rgba(167,201,87,0.22)', glow3:'rgba(167,201,87,0.04)', text:'#e8f4d8' },
      { primary:'#4d96ff', dim:'#3d75cc', glow:'rgba(77,150,255,0.12)', glow2:'rgba(77,150,255,0.22)', glow3:'rgba(77,150,255,0.04)', text:'#dce8ff' },
      { primary:'#ff006e', dim:'#cc0558', glow:'rgba(255,0,110,0.12)',  glow2:'rgba(255,0,110,0.22)',  glow3:'rgba(255,0,110,0.04)',  text:'#ffe0e8' },
      { primary:'#ffbe0b', dim:'#cc9609', glow:'rgba(255,190,11,0.12)', glow2:'rgba(255,190,11,0.22)', glow3:'rgba(255,190,11,0.04)', text:'#fffae0' }
    ];

    function initAccentColor() {
      const c = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
      const r = document.documentElement;
      r.style.setProperty('--amber',      c.primary);
      r.style.setProperty('--amber-dim',  c.dim);
      r.style.setProperty('--amber-glow', c.glow);
      r.style.setProperty('--amber-glow2',c.glow2);
      r.style.setProperty('--amber-glow3',c.glow3);
      r.style.setProperty('--text',       c.text);
    }

    const CHARSETS = {
      standard: '@%#*+=-:. ',
      dense:    '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,"^`. ',
      blocks:   '\u2588\u2593\u2592\u2591 ',
      minimal:  '#=:. ',
      slant:    '/\\|!;:,\'. ',
      braille:  '\u28FF\u28F7\u28EF\u287F\u29FF\u28BF\u28DF\u28FE\u283F\u281F\u280F\u2807\u2803\u2801\u2800',
      dots:     '\u25CF\u25C9\u25CE\u25CB\u00B7 '
    };

    const PRESETS = {
      photo:  { w:120, b:0,   c:100, gam:100, sh:25,  d:true,  inv:false, cs:'standard', fm:'normal' },
      dense:  { w:180, b:-10, c:140, gam:90,  sh:40,  d:true,  inv:false, cs:'dense',    fm:'normal' },
      sketch: { w:100, b:10,  c:160, gam:110, sh:60,  d:false, inv:false, cs:'minimal',  fm:'normal' },
      bold:   { w:80,  b:-20, c:200, gam:80,  sh:0,   d:false, inv:false, cs:'blocks',   fm:'normal' },
      wide:   { w:240, b:0,   c:110, gam:100, sh:15,  d:true,  inv:false, cs:'standard', fm:'normal' },
      micro:  { w:50,  b:0,   c:120, gam:100, sh:50,  d:true,  inv:false, cs:'dense',    fm:'normal' },
      edge:   { w:100, b:0,   c:200, gam:100, sh:0,   d:false, inv:false, cs:'minimal',  fm:'edge'   },
      retro:  { w:80,  b:-15, c:180, gam:120, sh:30,  d:true,  inv:false, cs:'slant',    fm:'normal' }
    };

    // ── Range UI ───────────────────────────────────────────────────────────────
    function rui(el, lid, fmt) {
      document.getElementById(lid).textContent = fmt(el.value);
      const pct = ((+el.value - +el.min) / (+el.max - +el.min) * 100).toFixed(1) + '%';
      el.style.setProperty('--pct', pct);
    }

    // ── Controls ───────────────────────────────────────────────────────────────
    function onCsetChange() {
      document.getElementById('cust-chars').style.display =
        document.getElementById('cset').value === 'custom' ? 'block' : 'none';
    }
    function getCharset() {
      const v = document.getElementById('cset').value;
      if (v === 'custom') return document.getElementById('cust-chars').value || '@%#*+=-:. ';
      return CHARSETS[v] || CHARSETS.standard;
    }
    function setInvert(v)    { inverted = v;    document.getElementById('inv-n').classList.toggle('active',!v); document.getElementById('inv-y').classList.toggle('active',v);    liveConvert(); }
    function setDither(v)    { useDither = v;   document.getElementById('dith-n').classList.toggle('active',!v);document.getElementById('dith-y').classList.toggle('active',v);   liveConvert(); }
    function toggleFlip(axis) {
      if (axis === 'h') { flipH = !flipH; document.getElementById('flip-h').classList.toggle('active', flipH); }
      else              { flipV = !flipV; document.getElementById('flip-v').classList.toggle('active', flipV); }
      liveConvert();
    }
    function setFilter(fm) {
      filterMode = fm;
      ['normal','edge','emboss'].forEach(m => document.getElementById('fm-'+m).classList.toggle('active', m===fm));
      liveConvert();
    }
    function setColorMode(v) {
      colorMode = v;
      document.getElementById('col-off').classList.toggle('active',!v);
      document.getElementById('col-on').classList.toggle('active', v);
      if (lastLines.length) renderOutput();
    }
    function setAnimMode(m) {
      animMode = m;
      ['scan','type','instant'].forEach(a => document.getElementById('an-'+a).classList.toggle('active', a===m));
      document.getElementById('speed-group').style.display = m === 'instant' ? 'none' : 'block';
    }
    function setTheme(t) {
      theme = t;
      const out = document.getElementById('ascii-output');
      THEMES.forEach(c => out.classList.remove(c));
      out.classList.add(t);
      THEME_BTNS.forEach((id,i) => document.getElementById(id)?.classList.toggle('active', THEMES[i]===t));
    }
    function setFs(sz) {
      fs = sz;
      document.getElementById('ascii-output').style.fontSize = sz + 'px';
    }
    function setLetterSpacing(v) {
      document.getElementById('ascii-output').style.letterSpacing = (v/100).toFixed(2) + 'em';
    }

    // ── Zoom ───────────────────────────────────────────────────────────────────
    function changeZoom(delta) {
      currentZoom = Math.max(0.25, Math.min(4, currentZoom + delta));
      applyZoom();
    }
    function resetZoom() { currentZoom = 1; applyZoom(); }
    function applyZoom() {
      document.getElementById('ascii-output').style.transform = `scale(${currentZoom})`;
      document.getElementById('zoom-lbl').textContent = Math.round(currentZoom*100) + '%';
    }

    // ── Split view ─────────────────────────────────────────────────────────────
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
      const ov  = document.getElementById('image-overlay');
      const wrap = document.getElementById('ascii-wrap');
      div.onmousedown = e => {
        e.preventDefault();
        const move = ev => {
          const rect = wrap.getBoundingClientRect();
          const pct = Math.max(10, Math.min(90, (ev.clientX - rect.left) / rect.width * 100));
          div.style.left = pct + '%';
          ov.style.width = pct + '%';
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', () => document.removeEventListener('mousemove', move), {once:true});
      };
    }

    // ── Presets ────────────────────────────────────────────────────────────────
    function preset(name) {
      const p = PRESETS[name]; if (!p) return;
      const rw  = document.getElementById('r-w');
      const rb  = document.getElementById('r-b');
      const rc  = document.getElementById('r-c');
      const rsh = document.getElementById('r-sh');
      const rg  = document.getElementById('r-gam');
      rw.value=p.w;   rui(rw,'lw',  v=>v+' cols');
      rb.value=p.b;   rui(rb,'lb',  v=>(v>0?'+':'')+v);
      rc.value=p.c;   rui(rc,'lc',  v=>(v/100).toFixed(1)+'×');
      rsh.value=p.sh; rui(rsh,'lsh',v=>v+'%');
      rg.value=p.gam; rui(rg,'lgam',v=>(v/100).toFixed(1));
      document.getElementById('cset').value = p.cs;
      document.getElementById('cust-chars').style.display = 'none';
      setFilter(p.fm);
      setInvert(p.inv);
      setDither(p.d);
    }

    // ── File load ──────────────────────────────────────────────────────────────
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
          document.getElementById('fname').textContent = n.length > 26 ? n.slice(0,24)+'\u2026' : n;
          document.getElementById('fdims').textContent = img.width + '\u00d7' + img.height + 'px';
          document.getElementById('drop-zone').style.display = 'none';
          document.getElementById('preview-wrap').style.display = 'block';
          document.getElementById('convert-btn').disabled = false;
          setLed('amber');
          doConvert();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }

    // ── LED / Status ───────────────────────────────────────────────────────────
    function setLed(state) { document.getElementById('out-led').className = 'out-led ' + state }
    function setStatus(s) {
      const el = document.getElementById('status');
      el.className = 's-pill';
      if (s==='ok')   { el.classList.add('s-ok');   el.textContent = 'READY';      }
      else if(s==='busy'){ el.classList.add('s-busy'); el.textContent = 'GENERATING'; }
      else            { el.classList.add('s-idle'); el.textContent = 'IDLE';       }
    }

    // ── History ────────────────────────────────────────────────────────────────
    function pushHistory(ascii) {
      HISTORY.push(ascii);
      if (HISTORY.length > HIST_MAX) HISTORY.shift();
      updateHistoryUI();
      const btn = document.getElementById('undo-btn');
      btn.style.opacity = '1'; btn.style.pointerEvents = 'auto';
    }
    function doUndo() {
      if (HISTORY.length < 2) return;
      HISTORY.pop(); // discard current
      const prev = HISTORY[HISTORY.length - 1];
      lastAscii = prev;
      lastLines = prev.split('\n');
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
        dots[i].classList.toggle('filled',  i < HISTORY.length);
        dots[i].classList.toggle('current', i === HISTORY.length - 1);
      }
    }

    // ── Image Processing ───────────────────────────────────────────────────────
    function applySharpen(ctx, w, h, amount) {
      if (amount <= 0) return;
      const imgData = ctx.getImageData(0,0,w,h);
      const data = imgData.data;
      const mix = amount / 100;
      const weights = [0,-1,0,-1,5,-1,0,-1,0];
      const src = new Uint8ClampedArray(data);
      for (let y=0; y<h; y++) {
        for (let x=0; x<w; x++) {
          const dstOff = (y*w+x)*4;
          let r=0, g=0, b=0;
          for (let cy=0; cy<3; cy++) for (let cx=0; cx<3; cx++) {
            const sy=y+cy-1, sx=x+cx-1;
            if (sy>=0&&sy<h&&sx>=0&&sx<w) {
              const sOff=(sy*w+sx)*4, wt=weights[cy*3+cx];
              r+=src[sOff]*wt; g+=src[sOff+1]*wt; b+=src[sOff+2]*wt;
            }
          }
          data[dstOff]   = src[dstOff]   + (r - src[dstOff])   * mix;
          data[dstOff+1] = src[dstOff+1] + (g - src[dstOff+1]) * mix;
          data[dstOff+2] = src[dstOff+2] + (b - src[dstOff+2]) * mix;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    function applyEdge(grays, w, h) {
      const out = new Float32Array(w * h);
      for (let y=1; y<h-1; y++) {
        for (let x=1; x<w-1; x++) {
          const gx =
            -grays[(y-1)*w+(x-1)] + grays[(y-1)*w+(x+1)]
            -2*grays[y*w+(x-1)]   + 2*grays[y*w+(x+1)]
            -grays[(y+1)*w+(x-1)] + grays[(y+1)*w+(x+1)];
          const gy =
            -grays[(y-1)*w+(x-1)] - 2*grays[(y-1)*w+x] - grays[(y-1)*w+(x+1)]
            +grays[(y+1)*w+(x-1)] + 2*grays[(y+1)*w+x] + grays[(y+1)*w+(x+1)];
          out[y*w+x] = Math.min(255, Math.sqrt(gx*gx + gy*gy));
        }
      }
      return out;
    }

    function applyEmboss(grays, w, h) {
      const out = new Float32Array(w * h);
      const kernel = [-2,-1,0,-1,1,1,0,1,2];
      for (let y=1; y<h-1; y++) {
        for (let x=1; x<w-1; x++) {
          let sum = 128;
          let k = 0;
          for (let ky=-1; ky<=1; ky++) for (let kx=-1; kx<=1; kx++) {
            sum += grays[(y+ky)*w+(x+kx)] * kernel[k++];
          }
          out[y*w+x] = Math.max(0, Math.min(255, sum));
        }
      }
      return out;
    }

    // ── Build ASCII ────────────────────────────────────────────────────────────
    function buildAscii() {
      const cv  = document.getElementById('canvas');
      const ctx = cv.getContext('2d');
      const cols = +document.getElementById('r-w').value;
      const rows = Math.round((imgEl.height / imgEl.width) * cols * 0.48);
      cv.width = cols; cv.height = rows;

      ctx.save();
      if (flipH || flipV) {
        ctx.translate(flipH ? cols : 0, flipV ? rows : 0);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      }
      ctx.drawImage(imgEl, 0, 0, cols, rows);
      ctx.restore();

      const sharpenAmt = +document.getElementById('r-sh').value;
      if (sharpenAmt > 0) applySharpen(ctx, cols, rows, sharpenAmt);

      const imgData  = ctx.getImageData(0, 0, cols, rows);
      const data     = imgData.data;
      const bright   = +document.getElementById('r-b').value;
      const contrast = +document.getElementById('r-c').value / 100;
      const gamma    = +document.getElementById('r-gam').value / 100;
      const chars    = getCharset();
      const maxIdx   = chars.length - 1;

      // Extract luminance + color
      const grays  = new Float32Array(cols * rows);
      const colors = new Uint8Array(cols * rows * 3);

      for (let y=0; y<rows; y++) {
        for (let x=0; x<cols; x++) {
          const i = (y*cols+x)*4;
          let g = 0.2126*data[i] + 0.7152*data[i+1] + 0.0722*data[i+2];
          g = (g + bright - 128) * contrast + 128;
          g = Math.max(0, Math.min(255, g));
          // Gamma correction
          g = Math.pow(g / 255, 1/gamma) * 255;
          if (inverted) g = 255 - g;
          grays[y*cols+x] = g;
          const ci = (y*cols+x)*3;
          colors[ci]   = data[i];
          colors[ci+1] = data[i+1];
          colors[ci+2] = data[i+2];
        }
      }

      // Apply filter
      let finalGrays = grays;
      if      (filterMode === 'edge')   finalGrays = applyEdge(grays, cols, rows);
      else if (filterMode === 'emboss') finalGrays = applyEmboss(grays, cols, rows);

      // Store pixels for color mode
      lastPixels = { colors, cols, rows };

      // Render chars
      const lines = [];
      if (useDither && filterMode === 'normal') {
        const dg = new Float32Array(finalGrays);
        for (let y=0; y<rows; y++) {
          let row = '';
          for (let x=0; x<cols; x++) {
            const idx = y*cols+x;
            const oldVal = dg[idx];
            const charIdx = Math.max(0, Math.min(maxIdx, Math.round((oldVal/255)*maxIdx)));
            const newVal  = (charIdx/maxIdx)*255;
            dg[idx] = newVal;
            row += chars[charIdx];
            const err = oldVal - newVal;
            if (x+1<cols)  dg[idx+1] += err*7/16;
            if (y+1<rows) {
              if (x-1>=0)  dg[(y+1)*cols+x-1] += err*3/16;
                           dg[(y+1)*cols+x]   += err*5/16;
              if (x+1<cols)dg[(y+1)*cols+x+1] += err*1/16;
            }
          }
          lines.push(row);
        }
      } else {
        for (let y=0; y<rows; y++) {
          let row = '';
          for (let x=0; x<cols; x++) {
            const val = finalGrays[y*cols+x];
            row += chars[Math.max(0, Math.min(maxIdx, Math.round((val/255)*maxIdx)))];
          }
          lines.push(row);
        }
      }
      return lines;
    }

    // ── Render output (static or colored) ─────────────────────────────────────
    function renderOutput() {
      const out = document.getElementById('ascii-output');
      out.style.display = 'block';
      out.style.fontSize = fs + 'px';
      THEMES.forEach(c => out.classList.remove(c));

      if (colorMode && lastPixels) {
        out.classList.add('colored-mode');
        const { colors, cols } = lastPixels;
        let html = '';
        for (let y=0; y<lastLines.length; y++) {
          const row = lastLines[y];
          for (let x=0; x<row.length; x++) {
            const ci = (y*cols+x)*3;
            const r=colors[ci], g=colors[ci+1], b=colors[ci+2];
            const bright = 0.2126*r + 0.7152*g + 0.0722*b;
            // Boost saturation slightly
            const bStr = bright > 20 ? `color:rgb(${r},${g},${b})` : `color:var(--text-muted)`;
            html += `<span style="${bStr}">${row[x]}</span>`;
          }
          if (y < lastLines.length-1) html += '\n';
        }
        out.innerHTML = html;
        // In color mode use dark bg always
        out.style.background = '#000';
        out.style.textShadow = 'none';
      } else {
        out.classList.remove('colored-mode');
        out.classList.add(theme);
        out.textContent = lastLines.join('\n');
      }
    }

    // ── Generation animation ───────────────────────────────────────────────────
    function animateGeneration(lines) {
      const out    = document.getElementById('ascii-output');
      const cursor = document.getElementById('gen-cursor');
      const sweep  = document.getElementById('scan-sweep');
      const wrap   = document.getElementById('ascii-wrap');
      const fill   = document.getElementById('ld-fill');
      const rowLbl = document.getElementById('ld-rows');
      const total  = lines.length;
      const speed  = +document.getElementById('r-speed').value;
      // rows per tick: 1 = slowest (1 row), 5 = turbo (all at once essentially)
      const batchMap = [1, 3, 6, 12, 30];
      const batch = batchMap[speed - 1];

      if (animMode === 'instant') {
        lastLines = lines;
        lastAscii = lines.join('\n');
        renderOutput();
        out.classList.remove('reveal');
        out.getBoundingClientRect();
        out.classList.add('reveal');
        finishGeneration(lines);
        return;
      }

      // Scan or Type mode
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

        // Update display
        lastLines = [...rendered];
        if (colorMode && lastPixels) {
          // simplified: just do full render each tick in color mode
          const { colors, cols } = lastPixels;
          let html = '';
          for (let y=0; y<rendered.length; y++) {
            const rowStr = rendered[y];
            for (let x=0; x<rowStr.length; x++) {
              const ci=(y*cols+x)*3;
              const rr=colors[ci],gg=colors[ci+1],bb=colors[ci+2];
              html+=`<span style="color:rgb(${rr},${gg},${bb})">${rowStr[x]}</span>`;
            }
            if (y<rendered.length-1) html+='\n';
          }
          out.innerHTML = html;
          out.style.background='#000'; out.style.textShadow='none';
          out.classList.add('colored-mode');
        } else {
          out.classList.remove('colored-mode');
          out.classList.add(theme);
          out.textContent = rendered.join('\n');
        }

        // Progress
        const pct = (row / total) * 100;
        fill.style.width = pct + '%';
        rowLbl.textContent = `Row ${row} / ${total}`;

        // Move cursor
        if (animMode === 'scan' || animMode === 'type') {
          const lineH = fs * 1.18;
          const cursorTop = row * lineH + 16;
          cursor.style.top = Math.max(0, cursorTop - 1) + 'px';
          if (animMode === 'scan') {
            sweep.style.top = Math.max(0, cursorTop - 2) + 'px';
            sweep.style.opacity = '0.9';
          }
          // Auto-scroll to cursor
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

    function finishGeneration(lines) {
      lastAscii = lines.join('\n');
      lastLines = lines;
      pushHistory(lastAscii);
      const cols = +document.getElementById('r-w').value;
      document.getElementById('out-meta').textContent = cols + '\u00d7' + lines.length + ' chars';
      document.getElementById('st-chars').textContent = (lastAscii.replace(/\n/g,'').length).toLocaleString();
      setStatus('ok'); setLed('green');
      document.getElementById('loading').classList.remove('show');
      document.getElementById('convert-btn').classList.remove('running');
      const out = document.getElementById('ascii-output');
      out.classList.remove('impact');
      out.getBoundingClientRect();
      out.classList.add('impact');
      triggerSweep();
      spawnParticles();
      const logo = document.querySelector('.logo');
      if (logo) setTimeout(() => logo.classList.remove('generating'), 600);
    }

    // ── doConvert ──────────────────────────────────────────────────────────────
    function doConvert() {
      if (!imgEl) return;
      clearInterval(genTimer);
      setStatus('busy'); setLed('amber');

      const loading = document.getElementById('loading');
      const fill    = document.getElementById('ld-fill');
      const logo    = document.querySelector('.logo');
      const btn     = document.getElementById('convert-btn');

      loading.classList.add('show');
      document.getElementById('placeholder').style.display = 'none';
      btn.classList.add('running');

      fill.style.width = '0%';
      document.getElementById('ld-rows').textContent = 'Initialising…';

      if (logo) { logo.classList.remove('generating'); logo.getBoundingClientRect(); logo.classList.add('generating') }

      const t0 = performance.now();

      setTimeout(() => {
        try {
          const lines = buildAscii();
          const elapsed = ((performance.now() - t0) / 1000).toFixed(2) + 's';
          document.getElementById('st-time').textContent = elapsed;
          animateGeneration(lines);
        } catch(e) {
          setStatus('idle'); setLed('idle');
          loading.classList.remove('show');
          btn.classList.remove('running');
          if (logo) logo.classList.remove('generating');
          console.error(e);
        }
      }, 30);
    }

    function triggerSweep() {
      const s = document.getElementById('scan-sweep');
      s.classList.remove('sweeping');
      s.getBoundingClientRect();
      s.classList.add('sweeping');
      s.addEventListener('animationend', () => s.classList.remove('sweeping'), {once:true});
    }

    // ── Particle burst ─────────────────────────────────────────────────────────
    function spawnParticles() {
      const pc  = document.getElementById('particle-canvas');
      const wrap = document.getElementById('ascii-wrap');
      pc.width  = wrap.clientWidth;
      pc.height = wrap.clientHeight;
      const ctx = pc.getContext('2d');
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--amber').trim();
      pc.classList.add('show');

      const particles = Array.from({length:110}, () => ({
        x:  Math.random() * pc.width,
        y:  Math.random() * pc.height,
        vx: (Math.random()-0.5) * 3,
        vy: (Math.random()-0.5) * 3 - 1,
        r:  Math.random() * 3 + 1,
        life: 1
      }));

      let frame;
      (function tick() {
        ctx.clearRect(0, 0, pc.width, pc.height);
        let alive = false;
        particles.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.vy += 0.08;
          p.life -= 0.025;
          if (p.life <= 0) return;
          alive = true;
          ctx.globalAlpha = p.life;
          ctx.fillStyle   = accent;
          ctx.shadowBlur  = 6;
          ctx.shadowColor = accent;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
          ctx.fill();
        });
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        if (alive) frame = requestAnimationFrame(tick);
        else { pc.classList.remove('show'); ctx.clearRect(0,0,pc.width,pc.height) }
      })();
    }

    // ── Live update ────────────────────────────────────────────────────────────
    let dbTimer;
    function liveConvert() { if (!imgEl) return; clearTimeout(dbTimer); dbTimer = setTimeout(doConvert, 280) }
    ['r-w','r-b','r-c','r-sh','r-gam'].forEach(id => {
      document.getElementById(id).addEventListener('input', liveConvert);
    });

    // ── Export ─────────────────────────────────────────────────────────────────
    function doCopy() {
      if (!lastAscii) { toast('Generate ASCII first'); return; }
      navigator.clipboard.writeText(lastAscii)
        .then(() => toast('Copied to clipboard!'))
        .catch(() => { const ta=document.createElement('textarea'); ta.value=lastAscii; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); toast('Copied!') });
    }
    function doTxt() {
      if (!lastAscii) { toast('Generate ASCII first'); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([lastAscii],{type:'text/plain'}));
      a.download = 'ascii-art.txt'; a.click(); toast('Downloading .txt…');
    }
    function doPng() {
      if (!lastAscii) { toast('Generate ASCII first'); return; }
      const lines = lastAscii.split('\n');
      const fsPx  = fs+2, lh=Math.ceil(fsPx*1.18), cw=fsPx*0.6;
      const pw = Math.ceil(lines[0].length*cw)+32, ph = lines.length*lh+32;
      const c  = document.createElement('canvas'); c.width=pw; c.height=ph;
      const cx = c.getContext('2d');
      const bgs={'out-dark':'#000','out-green':'#001500','out-light':'#f5f0e4','out-white':'#0d0d0d','out-blue':'#000d1a','out-pink':'#1a0010'};
      const fgs={'out-dark':'#f5a623','out-green':'#33ff66','out-light':'#1a1a0f','out-white':'#fff','out-blue':'#60cfff','out-pink':'#ff6eb4'};
      cx.fillStyle = bgs[theme]||'#000'; cx.fillRect(0,0,pw,ph);
      if (colorMode && lastPixels) {
        const { colors, cols } = lastPixels;
        cx.font = fsPx+'px "IBM Plex Mono",monospace'; cx.textBaseline='top';
        lines.forEach((row,y) => {
          for (let x=0; x<row.length; x++) {
            const ci=(y*cols+x)*3;
            cx.fillStyle=`rgb(${colors[ci]},${colors[ci+1]},${colors[ci+2]})`;
            cx.fillText(row[x], 16+x*cw, 16+y*lh);
          }
        });
      } else {
        cx.fillStyle = fgs[theme]||'#f5a623';
        cx.font = fsPx+'px "IBM Plex Mono",monospace'; cx.textBaseline='top';
        lines.forEach((l,i) => cx.fillText(l, 16, 16+i*lh));
      }
      const a=document.createElement('a'); a.href=c.toDataURL('image/png'); a.download='ascii-art.png'; a.click();
      toast('Downloading PNG…');
    }
    function doHtml() {
      if (!lastAscii) { toast('Generate ASCII first'); return; }
      const bgs={'out-dark':'#000','out-green':'#001500','out-light':'#f5f0e4','out-white':'#0d0d0d','out-blue':'#000d1a','out-pink':'#1a0010'};
      const fgs={'out-dark':'#f5a623','out-green':'#33ff66','out-light':'#1a1a0f','out-white':'#fff','out-blue':'#60cfff','out-pink':'#ff6eb4'};
      let body = '';
      if (colorMode && lastPixels) {
        const { colors, cols } = lastPixels;
        lastLines.forEach((row, y) => {
          for (let x=0; x<row.length; x++) {
            const ci=(y*cols+x)*3;
            body += `<span style="color:rgb(${colors[ci]},${colors[ci+1]},${colors[ci+2]})">${row[x]==='<'?'&lt;':row[x]}</span>`;
          }
          body += '\n';
        });
      } else {
        body = lastAscii.replace(/&/g,'&amp;').replace(/</g,'&lt;');
      }
      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>ASCII Art</title>
<style>body{margin:0;background:${bgs[theme]||'#000'};padding:1rem}pre{font-family:"IBM Plex Mono",monospace;font-size:${fs}px;line-height:1.18;color:${fgs[theme]||'#f5a623'}}</style>
</head><body><pre>${body}</pre></body></html>`;
      const a=document.createElement('a');
      a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));
      a.download='ascii-art.html'; a.click(); toast('Downloading HTML…');
    }

    // ── Toast ──────────────────────────────────────────────────────────────────
    let toastT;
    function toast(msg) {
      const el = document.getElementById('toast');
      el.textContent = msg; el.classList.add('show');
      clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
    }

    // ── Matrix rain ────────────────────────────────────────────────────────────
    (function initMatrix() {
      const c    = document.getElementById('matrix-bg');
      const wrap = document.getElementById('ascii-wrap');
      function resize() { c.width=wrap.clientWidth; c.height=wrap.clientHeight }
      resize(); new ResizeObserver(resize).observe(wrap);
      const ctx   = c.getContext('2d');
      const chars = '01アイウエオカキクケコ@#%&+=-';
      let cols, drops;
      function init() {
        cols  = Math.floor(c.width/14);
        drops = Array(cols).fill(0).map(()=>Math.random()*c.height/14|0);
      }
      init(); new ResizeObserver(init).observe(wrap);
      setInterval(() => {
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--amber').trim()||'#f5a623';
        ctx.fillStyle='rgba(0,0,0,0.06)'; ctx.fillRect(0,0,c.width,c.height);
        ctx.fillStyle=accent; ctx.globalAlpha=0.7; ctx.font='12px "IBM Plex Mono",monospace';
        drops.forEach((y,i)=>{
          ctx.fillText(chars[Math.random()*chars.length|0], i*14, y*14);
          if (y*14>c.height && Math.random()>0.975) drops[i]=0;
          drops[i]++;
        });
        ctx.globalAlpha=1;
      }, 80);
    })();

    // ── Init ───────────────────────────────────────────────────────────────────
    window.addEventListener('DOMContentLoaded', () => {
      initAccentColor();
      rui(document.getElementById('r-w'),    'lw',     v=>v+' cols');
      rui(document.getElementById('r-b'),    'lb',     v=>(v>0?'+':'')+v);
      rui(document.getElementById('r-c'),    'lc',     v=>(v/100).toFixed(1)+'×');
      rui(document.getElementById('r-sh'),   'lsh',    v=>v+'%');
      rui(document.getElementById('r-gam'),  'lgam',   v=>(v/100).toFixed(1));
      rui(document.getElementById('r-fs'),   'lfs',    v=>v+'px');
      rui(document.getElementById('r-ls'),   'lls',    v=>(v/100).toFixed(2)+'em');
      rui(document.getElementById('r-speed'),'l-speed',v=>['Slowest','Slow','Medium','Fast','Turbo'][v-1]);
    });
