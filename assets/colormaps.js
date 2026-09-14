/* colormaps.js — colormap lookup, application to attribute arrays, lightness
   profiles and color vision deficiency simulation.
   Requires cmapdata.js to be loaded first.
   Part of the seismic-colormap teaching modules. CC BY-SA 4.0. */

const Colormaps = (function () {

  const cache = {};

  /* Return a Uint8Array of length 3*n holding the colormap as RGB bytes. */
  function lut(name) {
    if (cache[name]) return cache[name];
    const hex = CMAP_DATA[name];
    if (!hex) throw new Error("unknown colormap: " + name);
    const n = hex.length / 6;
    const a = new Uint8Array(n * 3);
    for (let i = 0; i < n; i++) {
      a[3 * i]     = parseInt(hex.substr(6 * i, 2), 16);
      a[3 * i + 1] = parseInt(hex.substr(6 * i + 2, 2), 16);
      a[3 * i + 2] = parseInt(hex.substr(6 * i + 4, 2), 16);
    }
    cache[name] = a;
    return a;
  }

  function levels(name) { return CMAP_DATA[name].length / 6; }

  /* Color at position t in 0..1, returned as [r,g,b] bytes. */
  function sample(name, t) {
    const a = lut(name), n = a.length / 3;
    let i = Math.round(t * (n - 1));
    if (i < 0) i = 0; if (i > n - 1) i = n - 1;
    return [a[3 * i], a[3 * i + 1], a[3 * i + 2]];
  }

  function cssColor(name, t) {
    const c = sample(name, t);
    return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
  }

  /* cls: 'sequential' | 'diverging' | 'cyclic' | 'categorical'
     era: 'scientific' | 'traditional'
     Either may be omitted. Tables registered with define() are left out. */
  function list(cls, era) {
    return Object.keys(CMAP_META).filter(function (k) {
      const m = CMAP_META[k];
      return !m.hidden && (!cls || m.cls === cls) && (!era || m.era === era);
    });
  }

  /* Install a table built at run time — a ramp the student made, a print
     simulation, a clipped copy — so that everything which takes a colormap
     name can take it too. meta.hidden keeps it out of the menus. */
  function define(key, rgb, meta) {
    let hex = '';
    for (let i = 0; i < rgb.length; i++) {
      const c = rgb[i];
      hex += ('00' + Math.round(Math.max(0, Math.min(255, c[0]))).toString(16)).slice(-2)
           + ('00' + Math.round(Math.max(0, Math.min(255, c[1]))).toString(16)).slice(-2)
           + ('00' + Math.round(Math.max(0, Math.min(255, c[2]))).toString(16)).slice(-2);
    }
    CMAP_DATA[key] = hex;
    CMAP_META[key] = Object.assign({ name: key, cls: 'sequential',
                                     era: 'scientific', hidden: true }, meta || {});
    delete cache[key];
    return key;
  }

  /* ---- data to pixels -------------------------------------------------- */

  /* Map a Float32Array of values onto an ImageData buffer.
     opts: {name, min, max, cyclic, nLevels, invert, cvd, cvdSeverity,
            alpha (Float32Array of 0..1, optional)} */
  function apply(values, imageData, opts) {
    const o = opts || {};
    const name = o.name || "gray";
    const a = lut(name), n = a.length / 3;
    const lo = (o.min !== undefined) ? o.min : 0;
    const hi = (o.max !== undefined) ? o.max : 1;
    const span = (hi - lo) || 1e-9;
    const nl = o.nLevels && o.nLevels > 1 ? o.nLevels : 0;
    const px = imageData.data;
    const cvdM = o.cvd && o.cvd !== "none"
      ? cvdMatrix(o.cvd, o.cvdSeverity === undefined ? 1 : o.cvdSeverity) : null;

    for (let k = 0; k < values.length; k++) {
      let t = (values[k] - lo) / span;
      if (o.cyclic) { t = t - Math.floor(t); }          // wrap instead of clip
      else { if (t < 0) t = 0; if (t > 1) t = 1; }
      if (nl) t = Math.round(t * (nl - 1)) / (nl - 1);
      if (o.invert) t = 1 - t;
      let i = Math.round(t * (n - 1));
      if (i > n - 1) i = n - 1;
      let r = a[3 * i], g = a[3 * i + 1], b = a[3 * i + 2];
      if (cvdM) { const c = applyMatrix(cvdM, r, g, b); r = c[0]; g = c[1]; b = c[2]; }
      const j = 4 * k;
      px[j] = r; px[j + 1] = g; px[j + 2] = b;
      px[j + 3] = o.alpha ? Math.round(255 * o.alpha[k]) : 255;
    }
    return imageData;
  }

  /* Draw a colorbar into a canvas. Horizontal if wider than tall. */
  function drawBar(canvas, name, opts) {
    const o = opts || {};
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    const horiz = w >= h;
    const nn = horiz ? w : h;
    const vals = new Float32Array(nn);
    for (let i = 0; i < nn; i++) vals[i] = horiz ? i / (nn - 1) : 1 - i / (nn - 1);
    const strip = ctx.createImageData(horiz ? w : 1, horiz ? 1 : h);
    apply(vals, strip, { name: name, min: 0, max: 1, nLevels: o.nLevels,
                         cvd: o.cvd, cvdSeverity: o.cvdSeverity, invert: o.invert });
    ctx.imageSmoothingEnabled = false;
    const tmp = document.createElement("canvas");
    tmp.width = horiz ? w : 1; tmp.height = horiz ? 1 : h;
    tmp.getContext("2d").putImageData(strip, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(tmp, 0, 0, w, h);
  }

  /* ---- perceptual measures --------------------------------------------- */

  function srgbToLinear(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  /* CIE L*a*b* under D65. */
  function rgbToLab(r, g, b) {
    const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
    let X = 0.4124564 * R + 0.3575761 * G + 0.1804375 * B;
    let Y = 0.2126729 * R + 0.7151522 * G + 0.0721750 * B;
    let Z = 0.0193339 * R + 0.1191920 * G + 0.9503041 * B;
    X /= 0.95047; Y /= 1.0; Z /= 1.08883;
    const f = function (t) {
      return t > 0.008856 ? Math.pow(t, 1 / 3) : (7.787 * t + 16 / 116);
    };
    const fx = f(X), fy = f(Y), fz = f(Z);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }

  /* CIE L*a*b* back to sRGB. The result can fall outside the displayable
     range, which is what lchToRgb uses to find the gamut boundary. */
  function labToRgb(L, a, b) {
    const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
    const finv = function (t) {
      const t3 = t * t * t;
      return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787;
    };
    const X = finv(fx) * 0.95047, Y = finv(fy), Z = finv(fz) * 1.08883;
    const lr =  3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
    const lg = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z;
    const lb =  0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;
    const inGamut = [lr, lg, lb].every(function (v) { return v >= -0.0005 && v <= 1.0005; });
    return { rgb: [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)],
             inGamut: inGamut };
  }

  function rgbToLch(r, g, b) {
    const lab = rgbToLab(r, g, b);
    const C = Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]);
    let h = Math.atan2(lab[2], lab[1]) * 180 / Math.PI;
    if (h < 0) h += 360;
    return [lab[0], C, h];
  }

  /* Lightness, chroma and hue angle to a displayable color. A color outside
     the display's range is brought back by reducing its chroma and nothing
     else, so the lightness asked for is the lightness returned. */
  function lchToRgb(L, C, h) {
    const rad = h * Math.PI / 180;
    let lo = 0, hi = C;
    const at = function (c) { return labToRgb(L, c * Math.cos(rad), c * Math.sin(rad)); };
    const full = at(C);
    if (full.inGamut) return { rgb: full.rgb, chroma: C, clipped: false };
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (at(mid).inGamut) lo = mid; else hi = mid;
    }
    return { rgb: at(lo).rgb, chroma: lo, clipped: true };
  }

  /* Largest chroma available at this lightness and hue. */
  function maxChroma(L, h) { return lchToRgb(L, 200, h).chroma; }

  /* L* along the colormap, one value per level. */
  function lightness(name) {
    const a = lut(name), n = a.length / 3, out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = rgbToLab(a[3 * i], a[3 * i + 1], a[3 * i + 2])[0];
    return out;
  }

  /* Local perceptual gradient: CIE76 color difference between neighboring
     levels, normalized so a perfectly uniform map plots flat at 1. */
  function perceptualGradient(name, stride) {
    const a = lut(name), n = a.length / 3;
    const st = stride || 8;                 // wide enough to step over the
    const m = n - st;                       // 8-bit quantization of the table
    const d = new Float32Array(m);
    let sum = 0;
    for (let i = 0; i < m; i++) {
      const p = rgbToLab(a[3 * i], a[3 * i + 1], a[3 * i + 2]);
      const q = rgbToLab(a[3 * (i + st)], a[3 * (i + st) + 1], a[3 * (i + st) + 2]);
      const dd = Math.sqrt((q[0] - p[0]) * (q[0] - p[0]) +
                           (q[1] - p[1]) * (q[1] - p[1]) +
                           (q[2] - p[2]) * (q[2] - p[2]));
      d[i] = dd; sum += dd;
    }
    const mean = sum / m;
    for (let i = 0; i < m; i++) d[i] /= (mean || 1);
    return d;
  }

  /* ---- color vision deficiency ----------------------------------------- */

  /* Machado, Oliveira & Fernandes (2009), IEEE TVCG 15(6), severity 1.0.
     Intermediate severities are interpolated toward the identity matrix. */
  const CVD_FULL = {
    protan: [0.152286, 1.052583, -0.204868,
             0.114503, 0.786281,  0.099216,
            -0.003882, -0.048116, 1.051998],
    deutan: [0.367322, 0.860646, -0.227968,
             0.280085, 0.672501,  0.047413,
            -0.011820, 0.042940,  0.968881],
    tritan: [1.255528, -0.076749, -0.178779,
            -0.078411, 0.930809,  0.147602,
             0.004733, 0.691367,  0.303900],
    achroma: [0.212656, 0.715158, 0.072186,
              0.212656, 0.715158, 0.072186,
              0.212656, 0.715158, 0.072186]
  };
  const IDENT = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  function cvdMatrix(type, severity) {
    const f = CVD_FULL[type];
    if (!f) return null;
    const s = Math.max(0, Math.min(1, severity));
    const m = new Array(9);
    for (let i = 0; i < 9; i++) m[i] = IDENT[i] * (1 - s) + f[i] * s;
    return m;
  }

  function applyMatrix(m, r, g, b) {
    const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
    const out = [m[0] * R + m[1] * G + m[2] * B,
                 m[3] * R + m[4] * G + m[5] * B,
                 m[6] * R + m[7] * G + m[8] * B];
    for (let i = 0; i < 3; i++) {
      let c = out[i];
      c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055;
      out[i] = Math.round(Math.max(0, Math.min(1, c)) * 255);
    }
    return out;
  }

  function simulate(rgb, type, severity) {
    const m = cvdMatrix(type, severity === undefined ? 1 : severity);
    return m ? applyMatrix(m, rgb[0], rgb[1], rgb[2]) : rgb.slice();
  }

  /* sRGB <-> linear light, exported because building a ramp at a fixed
     lightness needs to scale in linear light rather than in sRGB. */
  function linearToSrgb(c) {
    c = Math.max(0, Math.min(1, c));
    return 255 * (c <= 0.0031308 ? 12.92 * c
                                 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  }

  return { lut: lut, levels: levels, sample: sample, cssColor: cssColor,
           list: list, define: define, apply: apply, drawBar: drawBar,
           meta: CMAP_META, srgbToLinear: srgbToLinear, linearToSrgb: linearToSrgb,
           labToRgb: labToRgb, rgbToLch: rgbToLch, lchToRgb: lchToRgb,
           maxChroma: maxChroma,
           rgbToLab: rgbToLab, lightness: lightness,
           perceptualGradient: perceptualGradient,
           simulate: simulate, cvdMatrix: cvdMatrix, applyMatrix: applyMatrix };
})();
