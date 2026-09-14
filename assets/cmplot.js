/* ===========================================================================
   cmplot.js — drawing for the colormap modules
   "How Colormaps Actually Work"
   Heather Bedle and April Moreno-Ward / AASPI / University of Oklahoma

   Companion to seismic.js, which supplies fitCanvas, the frame, the axes and
   niceTicks. This file adds the four displays the colormap modules need: a map
   view of an attribute, a vertical section, an annotated color bar, and a line
   plot. Everything here takes its value range from the caller and never scales
   to the data, because a display whose axis moves under the data teaches the
   wrong lesson.

   Requires colormaps.js (which requires cmapdata.js) and seismic.js.
   =========================================================================== */

const CMPLOT = (function () {
  'use strict';

  const PAD = { l: 54, r: 14, t: 22, b: 42 };
  const INK = '#16191C', SLATE = '#5C6670', RED = '#841617';

  /* The stylesheet gives every canvas width:100% and height:auto, so the size
     is set here in CSS pixels and fitCanvas handles the device ratio. */
  function setup(canvas, height) {
    if (!canvas) return null;
    const holder = canvas.parentNode;
    const w = Math.max(240, (holder && holder.clientWidth) || canvas.clientWidth || 0);
    if (!w || w < 200) return null;               // hidden pane, nothing to draw
    const h = height || 300;
    const ctx = SEIS.fitCanvas(canvas, w, h);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h,
             rect: { x: PAD.l, y: PAD.t, w: w - PAD.l - PAD.r, h: h - PAD.t - PAD.b } };
  }

  function title(ctx, rect, text) {
    if (!text) return;
    ctx.save();
    ctx.font = '600 12.5px "IBM Plex Sans", sans-serif';
    ctx.fillStyle = INK;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, rect.x, rect.y - 7);
    ctx.restore();
  }

  function fmt(v) {
    const a = Math.abs(v);
    if (a >= 100) return v.toFixed(0);
    if (a >= 10) return v.toFixed(0);
    if (a >= 1) return v.toFixed(1);
    if (a === 0) return '0';
    if (a >= 0.01) return v.toFixed(2);
    return v.toExponential(1);
  }

  /* ---------------------------------------------------------------------
     MAP VIEW
     values: Float32Array of nx*ny, x fastest. Row 0 is drawn at the bottom,
     so CDP number increases upward as it does on a printed map.
     --------------------------------------------------------------------- */

  function map(canvas, values, o) {
    const p = setup(canvas, o.height || 300);
    if (!p) return null;
    const ctx = p.ctx, rect = p.rect;

    const off = document.createElement('canvas');
    off.width = o.nx; off.height = o.ny;
    const octx = off.getContext('2d');
    const img = octx.createImageData(o.nx, o.ny);
    Colormaps.apply(values, img, {
      name: o.cmap, min: o.min, max: o.max, cyclic: o.cyclic,
      nLevels: o.nLevels, invert: o.invert,
      cvd: o.cvd, cvdSeverity: o.cvdSeverity, alpha: o.alpha
    });
    octx.putImageData(img, 0, 0);

    ctx.save();
    ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(rect.x, rect.y + rect.h);
    ctx.scale(1, -1);
    ctx.drawImage(off, 0, 0, rect.w, rect.h);
    ctx.restore();

    SEIS.frame(ctx, rect);
    const lineLo = o.lineMin === undefined ? 1000 : o.lineMin;
    const lineHi = lineLo + 10 * (o.nx - 1);
    const cdpLo = o.cdpMin === undefined ? 3600 : o.cdpMin;
    const cdpHi = cdpLo + 10 * (o.ny - 1);
    SEIS.axisBottom(ctx, rect, lineLo, lineHi, o.xLabel || 'Line no.',
                    function (v) { return v.toFixed(0); }, { ticks: 5 });
    SEIS.axisLeft(ctx, rect, cdpLo, cdpHi, o.yLabel || 'CDP no.',
                  function (v) { return v.toFixed(0); }, { ticks: 5, flip: true });
    title(ctx, rect, o.title);

    const toPix = function (x, y) {
      return [rect.x + rect.w * x / (o.nx - 1),
              rect.y + rect.h - rect.h * y / (o.ny - 1)];
    };
    if (o.overlay) {
      ctx.save();
      ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
      o.overlay(ctx, rect, toPix);
      ctx.restore();
    }
    return { ctx: ctx, rect: rect, toPix: toPix };
  }

  /* ---------------------------------------------------------------------
     PRECOMPUTED IMAGE
     For displays whose colors are worked out by the caller rather than by a
     colormap lookup: corendered pairs, three-channel blends, anything where
     two attributes have already been combined into one RGB value per cell.
     rgb is a Uint8ClampedArray of 4*nx*ny in RGBA order, row 0 at the bottom.
     --------------------------------------------------------------------- */

  function image(canvas, rgba, o) {
    const p = setup(canvas, o.height || 300);
    if (!p) return null;
    const ctx = p.ctx, rect = p.rect;

    const off = document.createElement('canvas');
    off.width = o.nx; off.height = o.ny;
    const octx = off.getContext('2d');
    const img = octx.createImageData(o.nx, o.ny);
    img.data.set(rgba);
    octx.putImageData(img, 0, 0);

    ctx.save();
    ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(rect.x, rect.y + rect.h);
    ctx.scale(1, -1);
    ctx.drawImage(off, 0, 0, rect.w, rect.h);
    ctx.restore();

    SEIS.frame(ctx, rect);
    const lineLo = o.lineMin === undefined ? 1000 : o.lineMin;
    const cdpLo = o.cdpMin === undefined ? 3600 : o.cdpMin;
    SEIS.axisBottom(ctx, rect, lineLo, lineLo + 10 * (o.nx - 1),
                    o.xLabel || 'Line no.', function (v) { return v.toFixed(0); },
                    { ticks: 5 });
    SEIS.axisLeft(ctx, rect, cdpLo, cdpLo + 10 * (o.ny - 1),
                  o.yLabel || 'CDP no.', function (v) { return v.toFixed(0); },
                  { ticks: 5, flip: true });
    title(ctx, rect, o.title);

    const toPix = function (x, y) {
      return [rect.x + rect.w * x / (o.nx - 1),
              rect.y + rect.h - rect.h * y / (o.ny - 1)];
    };
    if (o.overlay) {
      ctx.save();
      ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
      o.overlay(ctx, rect, toPix);
      ctx.restore();
    }
    return { ctx: ctx, rect: rect, toPix: toPix };
  }

  /* ---------------------------------------------------------------------
     VERTICAL SECTION
     sec: {nTrace, nt, t0, dt, data} with data[it*nTrace + itr].
     Time increases downward.
     --------------------------------------------------------------------- */

  /* opts.rgba, when present, is a finished RGBA buffer for the section: used
     where the colors are composited from more than one attribute and there is
     no single colormap to look them up in. */
  function section(canvas, sec, o) {
    const p = setup(canvas, o.height || 260);
    if (!p) return null;
    const ctx = p.ctx, rect = p.rect;

    const off = document.createElement('canvas');
    off.width = sec.nTrace; off.height = sec.nt;
    const octx = off.getContext('2d');
    const img = octx.createImageData(sec.nTrace, sec.nt);
    if (o.rgba) {
      img.data.set(o.rgba);
    } else {
      Colormaps.apply(sec.data, img, {
        name: o.cmap || 'seismic', min: o.min, max: o.max,
        nLevels: o.nLevels, invert: o.invert,
        cvd: o.cvd, cvdSeverity: o.cvdSeverity
      });
    }
    octx.putImageData(img, 0, 0);

    ctx.save();
    ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, rect.x, rect.y, rect.w, rect.h);
    ctx.restore();

    const t1 = sec.t0 + (sec.nt - 1) * sec.dt;
    SEIS.frame(ctx, rect);
    const cdpLo = o.cdpMin === undefined ? 3600 : o.cdpMin;
    SEIS.axisBottom(ctx, rect, cdpLo, cdpLo + 10 * (sec.nTrace - 1),
                    o.xLabel || 'CDP no.', function (v) { return v.toFixed(0); },
                    { ticks: 5 });
    SEIS.axisLeft(ctx, rect, sec.t0, t1, o.yLabel || 'Two-way time (ms)',
                  function (v) { return v.toFixed(0); }, { ticks: 5 });
    title(ctx, rect, o.title);

    const toPix = function (itr, tms) {
      return [rect.x + rect.w * itr / (sec.nTrace - 1),
              rect.y + rect.h * (tms - sec.t0) / (t1 - sec.t0)];
    };
    if (o.overlay) {
      ctx.save();
      ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
      o.overlay(ctx, rect, toPix);
      ctx.restore();
    }
    return { ctx: ctx, rect: rect, toPix: toPix };
  }

  /* ---------------------------------------------------------------------
     COLOR BAR
     Horizontal, with the data values ticked underneath. This is the object
     the whole module set is about, so it is drawn full width and labelled
     rather than tucked beside the panel.
     --------------------------------------------------------------------- */

  function colorbar(canvas, o) {
    const p = setup(canvas, o.height || 56);
    if (!p) return null;
    const ctx = p.ctx;
    const barH = o.barHeight || 16;
    const x0 = PAD.l, w = p.w - PAD.l - PAD.r;
    /* leave headroom above the bar when pointers are being drawn onto it */
    const rect = { x: x0, y: o.marks ? 22 : 6, w: w, h: barH };

    const n = Math.max(2, Math.round(w));
    const vals = new Float32Array(n);
    for (let i = 0; i < n; i++) vals[i] = i / (n - 1);
    const strip = document.createElement('canvas');
    strip.width = n; strip.height = 1;
    const sctx = strip.getContext('2d');
    const img = sctx.createImageData(n, 1);
    Colormaps.apply(vals, img, {
      name: o.cmap, min: 0, max: 1, nLevels: o.nLevels, invert: o.invert,
      cvd: o.cvd, cvdSeverity: o.cvdSeverity
    });
    sctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(strip, rect.x, rect.y, rect.w, rect.h);
    SEIS.frame(ctx, rect);

    ctx.save();
    ctx.font = '10.5px "IBM Plex Mono", monospace';
    ctx.fillStyle = SLATE;
    ctx.strokeStyle = SLATE; ctx.lineWidth = 1;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    SEIS.niceTicks(o.min, o.max, 5).forEach(function (v) {
      const x = rect.x + rect.w * (v - o.min) / (o.max - o.min);
      ctx.beginPath();
      ctx.moveTo(x, rect.y + rect.h); ctx.lineTo(x, rect.y + rect.h + 4);
      ctx.stroke();
      ctx.fillText(fmt(v), x, rect.y + rect.h + 5);
    });
    if (o.label) {
      ctx.font = '11px "IBM Plex Sans", sans-serif';
      ctx.fillStyle = INK;
      ctx.textAlign = 'left';
      ctx.fillText(o.label, rect.x, rect.y + rect.h + 20);
    }
    ctx.restore();

    /* Optional pointers onto the bar: [{value, label, color}]. Used to show
       where the data's zero falls against the colormap's own center. */
    if (o.marks) {
      ctx.save();
      ctx.font = '10px "IBM Plex Mono", monospace';
      o.marks.forEach(function (mk) {
        if (mk.value < o.min || mk.value > o.max) return;
        const x = rect.x + rect.w * (mk.value - o.min) / (o.max - o.min);
        const col = mk.color || RED;
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, rect.y - 5); ctx.lineTo(x, rect.y + rect.h + 3);
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(x, rect.y - 5); ctx.lineTo(x - 4, rect.y - 11);
        ctx.lineTo(x + 4, rect.y - 11); ctx.closePath(); ctx.fill();
        if (mk.label) {
          ctx.textAlign = mk.align || 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(mk.label, x + (mk.align === 'left' ? 5 : mk.align === 'right' ? -5 : 0),
                       rect.y - 12);
        }
      });
      ctx.restore();
    }
    return rect;
  }

  /* ---------------------------------------------------------------------
     LINE PLOT
     Fixed axis limits, supplied by the caller.
     --------------------------------------------------------------------- */

  function lines(canvas, series, o) {
    const p = setup(canvas, o.height || 210);
    if (!p) return null;
    const ctx = p.ctx, rect = p.rect;
    const X = function (v) { return rect.x + rect.w * (v - o.xMin) / (o.xMax - o.xMin); };
    const Y = function (v) { return rect.y + rect.h - rect.h * (v - o.yMin) / (o.yMax - o.yMin); };

    if (o.bands) o.bands.forEach(function (b) {
      ctx.save(); ctx.fillStyle = b.color;
      ctx.fillRect(X(b.x0), rect.y, X(b.x1) - X(b.x0), rect.h);
      ctx.restore();
    });

    ctx.save();
    ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
    (series || []).forEach(function (s) {
      ctx.beginPath();
      ctx.strokeStyle = s.color || RED;
      ctx.lineWidth = s.width || 1.6;
      ctx.setLineDash(s.dash || []);
      for (let i = 0; i < s.x.length; i++) {
        const px = X(s.x[i]), py = Y(s.y[i]);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });
    ctx.restore();

    SEIS.frame(ctx, rect);
    SEIS.axisBottom(ctx, rect, o.xMin, o.xMax, o.xLabel, o.xFmt || fmt, { ticks: 5 });
    SEIS.axisLeft(ctx, rect, o.yMin, o.yMax, o.yLabel, o.yFmt || fmt,
                  { ticks: 4, flip: true, grid: o.grid !== false });
    title(ctx, rect, o.title);
    return { ctx: ctx, rect: rect, X: X, Y: Y };
  }

  /* Histogram of a data array, drawn with fixed limits. */
  function histogram(canvas, values, o) {
    const nb = o.bins || 80;
    const counts = new Float64Array(nb);
    for (let i = 0; i < values.length; i++) {
      let b = Math.floor((values[i] - o.xMin) / (o.xMax - o.xMin) * nb);
      if (b < 0) b = 0; if (b >= nb) b = nb - 1;
      counts[b]++;
    }
    let mx = 0;
    for (let i = 0; i < nb; i++) mx = Math.max(mx, counts[i]);
    const x = [], y = [];
    for (let i = 0; i < nb; i++) {
      x.push(o.xMin + (o.xMax - o.xMin) * (i + 0.5) / nb);
      y.push(counts[i] / (mx || 1));
    }
    const opts = Object.assign({}, o, { yMin: 0, yMax: 1.05 });
    return lines(canvas, [{ x: x, y: y, color: o.color || SLATE, width: 1.4 }], opts);
  }

  return { map: map, image: image, section: section, colorbar: colorbar, lines: lines,
           histogram: histogram, colors: { ink: INK, slate: SLATE, red: RED } };
})();
