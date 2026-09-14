/* synthetic.js — the synthetic seismic model used by every module in this set.
   A small layered earth model with a sinuous channel, three normal faults, a
   polygonal fault swarm and a pockmark field. Seismic traces are made by
   convolving the reflectivity with a Ricker wavelet. Attributes are extracted
   from the analytic (complex) trace, so amplitude, envelope, phase and
   instantaneous frequency all come from the same model.

   Part of the seismic-colormap teaching modules. CC BY-SA 4.0. */

const Synthetic = (function () {

  /* ---- grid and fixed model geometry ----------------------------------- */

  const NX = 200;        // line number direction
  const NY = 160;        // CDP number direction
  const DT = 2;          // ms, trace sample interval for section displays
  const T0 = 1000;       // ms, two-way time to the top marker at the origin
  const V_SAND = 2600;   // m/s, used to convert bed thickness to time

  /* Default display ranges. These are held fixed so that moving a slider
     changes the picture and not the scale. Module 06 unlocks them. */
  const RANGES = {
    amplitude:  [-0.15, 0.15],
    envelope:   [0, 0.16],
    phase:      [-180, 180],
    frequency:  [0, 70],
    sweetness:  [0, 0.03],
    coherence:  [0.3, 1.0],
    curvature:  [-1.5, 1.5],
    meanCurvature: [-1, 1],
    thickness:  [0, 40],
    twoWayTime: [995, 1095]
  };

  const CYCLIC = { phase: true };

  const CLASS = {            // which colormap class each attribute calls for
    amplitude: "diverging", envelope: "sequential", phase: "cyclic",
    frequency: "sequential", sweetness: "sequential", coherence: "sequential",
    curvature: "diverging", meanCurvature: "diverging",
    thickness: "sequential", twoWayTime: "sequential"
  };

  const LABEL = {
    amplitude: "Amplitude", envelope: "Envelope", phase: "Instantaneous phase (\u00b0)",
    frequency: "Instantaneous frequency (Hz)", sweetness: "Sweetness",
    coherence: "Coherence (energy-ratio style)",
    curvature: "Most-positive curvature (deeper marker)",
    meanCurvature: "Mean curvature (deeper marker)",
    thickness: "Channel sand thickness (m)", twoWayTime: "Two-way time to marker (ms)"
  };

  const defaults = {
    thickness: 22,      // m, maximum sand thickness in the channel axis
    sandImpedance: 5.6, // 10^6 kg m^-2 s^-1
    frequency: 30,      // Hz, Ricker peak frequency
    noise: 0.06,        // fraction of a strong reflection
    pockDim: 0.45,      // strength of the amplitude dimming over a pockmark
    seed: 7,
    sliceOffset: 0      // ms below the top marker where attributes are taken
  };

  const Z_OVERBURDEN = 6.5;   // shale above the marker
  const Z_MARKER     = 7.1;   // continuous levee and overbank unit
  const Z_DEEP       = 8.4;   // unit below, giving the deeper marker

  /* ---- small numerical helpers ----------------------------------------- */

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* In-place radix-2 FFT, used once per frequency change to build the
     quadrature (Hilbert) wavelet. */
  function fft(re, im, inverse) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        let t = re[i]; re[i] = re[j]; re[j] = t;
        t = im[i]; im[i] = im[j]; im[j] = t;
      }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (inverse ? 2 : -2) * Math.PI / len;
      const wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const ur = re[i + k], ui = im[i + k];
          const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
          const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
          re[i + k] = ur + vr; im[i + k] = ui + vi;
          re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
          const ncr = cr * wr - ci * wi;
          ci = cr * wi + ci * wr; cr = ncr;
        }
      }
    }
    if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }

  /* Ricker wavelet and its quadrature, tabulated on a fine time axis so a
     reflection can be evaluated at any time without resampling. */
  const FINE_DT = 0.25;          // ms
  const FINE_HALF = 160;         // ms either side of the wavelet center
  function buildWavelet(fHz) {
    const nHalf = Math.round(FINE_HALF / FINE_DT);
    const n = 4096;              // power of two, comfortably longer than 2*nHalf
    const re = new Float64Array(n), im = new Float64Array(n);
    const f = fHz;
    for (let i = -nHalf; i <= nHalf; i++) {
      const t = i * FINE_DT / 1000;
      const a = Math.PI * f * t;
      const v = (1 - 2 * a * a) * Math.exp(-a * a);
      re[(i + n) % n] = v;
    }
    // analytic signal: zero the negative frequencies, double the positive ones
    const R = Float64Array.from(re), I = new Float64Array(n);
    fft(R, I, false);
    for (let k = 1; k < n / 2; k++) { R[k] *= 2; I[k] *= 2; }
    for (let k = n / 2 + 1; k < n; k++) { R[k] = 0; I[k] = 0; }
    fft(R, I, true);
    const w = new Float32Array(2 * nHalf + 1), q = new Float32Array(2 * nHalf + 1);
    for (let i = -nHalf; i <= nHalf; i++) {
      w[i + nHalf] = R[(i + n) % n];
      q[i + nHalf] = I[(i + n) % n];
    }
    return { w: w, q: q, nHalf: nHalf, dt: FINE_DT, f: fHz };
  }

  /* Wavelet value and its quadrature at a time lag in ms (linear interpolation). */
  function wav(wl, lagMs, out) {
    const x = lagMs / wl.dt + wl.nHalf;
    if (x <= 0 || x >= wl.w.length - 1) { out[0] = 0; out[1] = 0; return out; }
    const i = x | 0, f = x - i;
    out[0] = wl.w[i] * (1 - f) + wl.w[i + 1] * f;
    out[1] = wl.q[i] * (1 - f) + wl.q[i + 1] * f;
    return out;
  }

  /* ---- the earth model -------------------------------------------------- */

  function channelCenter(x) {
    return 78 + 34 * Math.sin(2 * Math.PI * x / 150) + 12 * Math.sin(2 * Math.PI * x / 47 + 1.1);
  }
  function channelHalfWidth(x) {
    return 15 + 5 * Math.sin(2 * Math.PI * x / 90 + 0.4);
  }

  /* Fault throw in ms added to a surface at map position (x,y). */
  function faultThrow(x, y, poly) {
    let t = 0;
    // three through-going normal faults, striking roughly north-south
    const faults = [[46, 0.22, 14], [104, -0.15, 20], [152, 0.30, 11]];
    for (let i = 0; i < faults.length; i++) {
      const xf = faults[i][0] + faults[i][1] * y;
      if (x > xf) t += faults[i][2];
    }
    // polygonal fault swarm in the lower right of the survey
    if (poly) {
      for (let i = 0; i < poly.length; i++) {
        const p = poly[i];
        const dx = x - p[0], dy = y - p[1];
        if (dx < -16 || dx > 16 || dy < -16 || dy > 16) continue;
        const d = dx * p[3] + dy * p[4];          // distance along the fault normal
        const s = -dx * p[4] + dy * p[3];         // distance along strike
        if (Math.abs(s) < p[5] && d > 0 && d < p[6]) t += p[2] * (1 - Math.abs(s) / p[5]);
      }
    }
    return t;
  }

  function build(userParams) {
    const p = Object.assign({}, defaults, userParams || {});
    const rnd = mulberry32(p.seed * 2654435761 % 2147483647);

    /* polygonal faults: small offsets in a patch of the survey */
    const poly = [];
    for (let i = 0; i < 55; i++) {
      const cx = 118 + rnd() * 78, cy = 8 + rnd() * 66;
      const ang = rnd() * Math.PI;
      poly.push([cx, cy, 1.2 + rnd() * 2.6,
                 Math.cos(ang), Math.sin(ang),
                 5 + rnd() * 9, 1.4 + rnd() * 1.2]);
    }
    /* pockmarks: shallow circular depressions with a dimmed reflection */
    const pock = [];
    for (let i = 0; i < 60; i++) {
      pock.push([20 + rnd() * 70, 78 + rnd() * 74, 2.0 + rnd() * 2.5, 1.5 + rnd() * 3.0]);
    }

    const n = NX * NY;
    const tTop = new Float32Array(n);
    const tBase = new Float32Array(n);
    const tDeep = new Float32Array(n);
    const rc1 = new Float32Array(n);
    const rc2 = new Float32Array(n);
    const rc3 = new Float32Array(n);
    const thick = new Float32Array(n);

    /* Outside the channel the marker is a single interface, shale over the
       levee unit. Inside the channel the upper part of that unit is sand, so
       the marker becomes a pair of reflections whose separation is set by the
       sand thickness. */
    const Zs = p.sandImpedance;
    const rcSandTop  = (Zs - Z_OVERBURDEN) / (Zs + Z_OVERBURDEN);
    const rcSandBase = (Z_MARKER - Zs) / (Z_MARKER + Zs);
    const rcMarker   = (Z_MARKER - Z_OVERBURDEN) / (Z_MARKER + Z_OVERBURDEN);
    const rcDeep     = (Z_DEEP - Z_MARKER) / (Z_DEEP + Z_MARKER);

    for (let y = 0; y < NY; y++) {
      for (let x = 0; x < NX; x++) {
        const k = y * NX + x;

        /* structure: regional dip, a broad fold, faults. The pockmarks are
           added to the marker only, so the deeper reflector carries the
           structure without them. */
        const tStruct = T0 + 0.16 * x + 0.07 * y
              + 6 * Math.sin(2 * Math.PI * x / 180) * Math.cos(2 * Math.PI * y / 210)
              + faultThrow(x, y, poly);
        let t = tStruct;

        /* pockmarks */
        let dim = 1;
        for (let i = 0; i < pock.length; i++) {
          const dx = x - pock[i][0], dy = y - pock[i][1], r = pock[i][3];
          if (dx < -2.1 * r || dx > 2.1 * r || dy < -2.1 * r || dy > 2.1 * r) continue;
          const d2 = (dx * dx + dy * dy) / (r * r);
          if (d2 < 4) {
            const g = Math.exp(-d2);
            t += pock[i][2] * g;
            dim -= p.pockDim * g;
          }
        }

        /* channel lens */
        const dyc = y - channelCenter(x);
        const hw = channelHalfWidth(x);
        let h = 0;
        if (Math.abs(dyc) < hw) {
          const u = dyc / hw;
          h = p.thickness * Math.pow(1 - u * u, 0.65);
        }
        thick[k] = h;

        const inChannel = h > 0.5;
        tTop[k] = t;
        tBase[k] = t + 2000 * h / V_SAND;
        tDeep[k] = tStruct + 118;
        rc1[k] = (inChannel ? rcSandTop : rcMarker) * dim;
        rc2[k] = inChannel ? rcSandBase * dim : 0;
        rc3[k] = rcDeep;
      }
    }

    const wl = buildWavelet(p.frequency);

    /* spatially correlated noise field, one value per map point per component */
    function noiseField(seed) {
      const r = mulberry32(seed);
      let a = new Float32Array(n);
      for (let i = 0; i < n; i++) a[i] = r() * 2 - 1;
      for (let pass = 0; pass < 2; pass++) {
        const b = new Float32Array(n);
        for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
          let s = 0, c = 0;
          for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
            const xx = x + i, yy = y + j;
            if (xx < 0 || yy < 0 || xx >= NX || yy >= NY) continue;
            s += a[yy * NX + xx]; c++;
          }
          b[y * NX + x] = s / c;
        }
        a = b;
      }
      let rms = 0;
      for (let i = 0; i < n; i++) rms += a[i] * a[i];
      rms = Math.sqrt(rms / n) || 1;
      for (let i = 0; i < n; i++) a[i] /= rms;
      return a;
    }
    /* Noise is built from three band-limited components with independent,
       spatially correlated phases, so its envelope varies through the window
       rather than sitting at a constant level. */
    const NW = [0.19, 0.31, 0.45];        // rad/ms, about 30, 49 and 72 Hz
    const NA = [0.6, 1.0, 0.6];
    const phase = [noiseField(p.seed * 97 + 13),
                   noiseField(p.seed * 97 + 991),
                   noiseField(p.seed * 97 + 4409)];
    const level = noiseField(p.seed * 97 + 77);
    const cph = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
    const sph = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
    const gain = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      for (let i = 0; i < 3; i++) {
        const a = phase[i][k] * Math.PI;
        cph[i][k] = Math.cos(a); sph[i][k] = Math.sin(a);
      }
      gain[k] = Math.max(0.15, 1 + 0.6 * level[k]);
    }
    /* tabulated carriers, so no trigonometry is needed per sample */
    const TAB_T0 = 900, TAB_DT = 0.25, TAB_N = 2000;
    const cTab = [], sTab = [];
    for (let i = 0; i < 3; i++) {
      const ct = new Float32Array(TAB_N), st = new Float32Array(TAB_N);
      for (let j = 0; j < TAB_N; j++) {
        const a = NW[i] * (TAB_T0 + j * TAB_DT);
        ct[j] = Math.cos(a); st[j] = Math.sin(a);
      }
      cTab.push(ct); sTab.push(st);
    }
    const noiseAmp = p.noise * 0.07;   // fraction of a strong reflection

    const tmp = [0, 0];

    /* Analytic trace value at map index k and time t (ms). */
    function analytic(k, t, out) {
      let re = 0, im = 0;
      wav(wl, t - tTop[k], tmp); re += rc1[k] * tmp[0]; im += rc1[k] * tmp[1];
      wav(wl, t - tBase[k], tmp); re += rc2[k] * tmp[0]; im += rc2[k] * tmp[1];
      wav(wl, t - tDeep[k], tmp); re += rc3[k] * tmp[0]; im += rc3[k] * tmp[1];
      out[0] = re; out[1] = im;
      return out;
    }

    function analyticNoisy(k, t, out) {
      analytic(k, t, out);
      if (noiseAmp <= 0) return out;
      let j = Math.round((t - TAB_T0) / TAB_DT);
      if (j < 0) j = 0; else if (j >= TAB_N) j = TAB_N - 1;
      const g = noiseAmp * gain[k];
      let re = 0, im = 0;
      for (let i = 0; i < 3; i++) {
        const c = cTab[i][j], sn = sTab[i][j];
        re += NA[i] * (c * cph[i][k] - sn * sph[i][k]);
        im += NA[i] * (sn * cph[i][k] + c * sph[i][k]);
      }
      out[0] += g * re; out[1] += g * im;
      return out;
    }

    /* ---- attribute extraction on a horizon slice ----------------------- */

    const cacheSlices = {};

    function sliceTime(k, offset) { return tTop[k] + offset; }

    /* Time of the strongest envelope within a window around the deeper
       reflector, one value per trace. That event is isolated, so this is the
       surface a picker would follow; noise and bandwidth move it. */
    let pickedCache = null;
    function pickedHorizon() {
      if (pickedCache) return pickedCache;
      const out = new Float32Array(n), c = [0, 0];
      const step = 0.5;
      for (let k = 0; k < n; k++) {
        let best = -1, bd = 0;
        for (let d = -10; d <= 10; d += step) {
          analyticNoisy(k, tDeep[k] + d, c);
          const e = c[0] * c[0] + c[1] * c[1];
          if (e > best) { best = e; bd = d; }
        }
        /* parabolic refinement, so the pick is not quantized to the scan step */
        analyticNoisy(k, tDeep[k] + bd - step, c);
        const em = c[0] * c[0] + c[1] * c[1];
        analyticNoisy(k, tDeep[k] + bd + step, c);
        const ep = c[0] * c[0] + c[1] * c[1];
        const den = em - 2 * best + ep;
        const shift = Math.abs(den) > 1e-12 ? 0.5 * (em - ep) / den : 0;
        out[k] = tDeep[k] + bd + Math.max(-1, Math.min(1, shift)) * step;
      }
      pickedCache = out;
      return out;
    }

    function slice(attr, opts) {
      const o = opts || {};
      const off = o.offset === undefined ? p.sliceOffset : o.offset;
      const key = attr + "@" + off;
      if (cacheSlices[key]) return cacheSlices[key];

      const out = new Float32Array(n);
      const c = [0, 0], cp = [0, 0], cm = [0, 0];

      if (attr === "thickness") { out.set(thick); }
      else if (attr === "twoWayTime") { out.set(tTop); }
      else if (attr === "curvature" || attr === "meanCurvature") {
        /* Curvature of the horizon as it would be picked from this seismic:
           on each trace the strongest envelope within a window around the
           marker is located, so noise and bandwidth move the pick. */
        const picked = pickedHorizon();
        let s = picked;
        for (let pass = 0; pass < 3; pass++) {      // smooth before differencing
          const b = new Float32Array(n);
          for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
            let a = 0, cnt = 0;
            for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
              const xx = Math.min(NX - 1, Math.max(0, x + i));
              const yy = Math.min(NY - 1, Math.max(0, y + j));
              a += s[yy * NX + xx]; cnt++;
            }
            b[y * NX + x] = a / cnt;
          }
          s = b;
        }
        for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
          const xm = Math.max(0, x - 1), xp = Math.min(NX - 1, x + 1);
          const ym = Math.max(0, y - 1), yp = Math.min(NY - 1, y + 1);
          const zxx = s[y * NX + xp] - 2 * s[y * NX + x] + s[y * NX + xm];
          const zyy = s[yp * NX + x] - 2 * s[y * NX + x] + s[ym * NX + x];
          const zxy = (s[yp * NX + xp] - s[yp * NX + xm] - s[ym * NX + xp] + s[ym * NX + xm]) / 4;
          /* depth increases as time increases, so the sign is flipped to give
             most-positive curvature on the structural surface */
          const mean = -(zxx + zyy) / 2;
          const disc = Math.sqrt(Math.max(0, (zxx - zyy) * (zxx - zyy) / 4 + zxy * zxy));
          out[y * NX + x] = attr === "curvature" ? mean + disc : mean;
        }
      }
      else if (attr === "coherence") {
        /* energy-ratio style semblance over a 3 x 3 trace window and a short
           vertical window, computed along the marker */
        const nw = 7, dtw = 3;
        const buf = new Float64Array(9 * nw);
        for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
          const k = y * NX + x;
          const t0 = sliceTime(k, off);
          let m = 0;
          for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
            const xx = Math.min(NX - 1, Math.max(0, x + i));
            const yy = Math.min(NY - 1, Math.max(0, y + j));
            const kk = yy * NX + xx;
            for (let w = 0; w < nw; w++) {
              analyticNoisy(kk, t0 + (w - (nw - 1) / 2) * dtw, c);
              buf[m * nw + w] = c[0];
            }
            m++;
          }
          let num = 0, den = 0;
          for (let w = 0; w < nw; w++) {
            let s = 0, ss = 0;
            for (let q = 0; q < 9; q++) { const v = buf[q * nw + w]; s += v; ss += v * v; }
            num += s * s; den += 9 * ss;
          }
          out[k] = den > 1e-12 ? num / den : 1;
        }
      }
      else {
        for (let k = 0; k < n; k++) {
          const t0 = sliceTime(k, off);
          analyticNoisy(k, t0, c);
          if (attr === "amplitude") out[k] = c[0];
          else if (attr === "envelope") out[k] = Math.sqrt(c[0] * c[0] + c[1] * c[1]);
          else if (attr === "phase") out[k] = Math.atan2(c[1], c[0]) * 180 / Math.PI;
          else if (attr === "frequency" || attr === "sweetness") {
            const dtm = 1.0;
            analyticNoisy(k, t0 + dtm, cp);
            analyticNoisy(k, t0 - dtm, cm);
            let dp = Math.atan2(cp[1], cp[0]) - Math.atan2(cm[1], cm[0]);
            while (dp > Math.PI) dp -= 2 * Math.PI;
            while (dp < -Math.PI) dp += 2 * Math.PI;
            const f = Math.abs(dp / (2 * Math.PI) / (2 * dtm / 1000));
            if (attr === "frequency") out[k] = Math.min(f, 120);
            else {
              const env = Math.sqrt(c[0] * c[0] + c[1] * c[1]);
              out[k] = env / Math.sqrt(Math.max(f, 4));
            }
          }
        }
      }
      cacheSlices[key] = out;
      return out;
    }

    /* ---- vertical section ---------------------------------------------- */

    /* A crossline section at a fixed line number: traces run across the
       channel, so the sand body appears as a lens. */
    function section(lineIndex, tMin, tMax) {
      const x = Math.max(0, Math.min(NX - 1, Math.round(lineIndex)));
      const t0 = tMin === undefined ? 980 : tMin;
      const t1 = tMax === undefined ? 1230 : tMax;
      const nt = Math.round((t1 - t0) / DT) + 1;
      const data = new Float32Array(NY * nt);
      const c = [0, 0];
      for (let y = 0; y < NY; y++) {
        const k = y * NX + x;
        for (let it = 0; it < nt; it++) {
          analyticNoisy(k, t0 + it * DT, c);
          data[it * NY + y] = c[0];
        }
      }
      return { nTrace: NY, nt: nt, t0: t0, dt: DT, data: data, line: x };
    }

    /* ---- attribute panels on a vertical section ------------------------ */

    /* A section in either direction, carrying any of the trace attributes
       rather than amplitude alone. An inline (varying line number at a fixed
       CDP) crosses all three faults and several channel bends; a crossline
       (varying CDP at a fixed line) runs across the channel and shows the sand
       thinning to its margins. */
    function panel(dir, index, attr, tMin, tMax) {
      const inline = dir !== 'crossline';
      const nTrace = inline ? NX : NY;
      const idx = Math.max(0, Math.min((inline ? NY : NX) - 1, Math.round(index)));
      const at = function (i) { return inline ? (idx * NX + i) : (i * NX + idx); };
      const t0 = tMin === undefined ? 980 : tMin;
      const t1 = tMax === undefined ? 1260 : tMax;
      const nt = Math.round((t1 - t0) / DT) + 1;
      const out = new Float32Array(nTrace * nt);
      const c = [0, 0], cp = [0, 0], cm = [0, 0];

      if (attr === 'coherence') {
        const nw = 5, dtw = 3;
        const buf = new Float64Array(3 * nw);
        for (let i = 0; i < nTrace; i++) {
          for (let it = 0; it < nt; it++) {
            const t = t0 + it * DT;
            let m = 0;
            for (let d = -1; d <= 1; d++) {
              const j = Math.min(nTrace - 1, Math.max(0, i + d));
              for (let w = 0; w < nw; w++) {
                analyticNoisy(at(j), t + (w - (nw - 1) / 2) * dtw, c);
                buf[m * nw + w] = c[0];
              }
              m++;
            }
            let num = 0, den = 0;
            for (let w = 0; w < nw; w++) {
              let s2 = 0, ss = 0;
              for (let q = 0; q < 3; q++) { const v = buf[q * nw + w]; s2 += v; ss += v * v; }
              num += s2 * s2; den += 3 * ss;
            }
            out[it * nTrace + i] = den > 1e-12 ? num / den : 1;
          }
        }
      } else {
        for (let i = 0; i < nTrace; i++) {
          const k = at(i);
          for (let it = 0; it < nt; it++) {
            const t = t0 + it * DT;
            analyticNoisy(k, t, c);
            let v;
            if (attr === 'envelope') v = Math.sqrt(c[0] * c[0] + c[1] * c[1]);
            else if (attr === 'phase') v = Math.atan2(c[1], c[0]) * 180 / Math.PI;
            else if (attr === 'frequency' || attr === 'sweetness') {
              analyticNoisy(k, t + 1, cp);
              analyticNoisy(k, t - 1, cm);
              let dp = Math.atan2(cp[1], cp[0]) - Math.atan2(cm[1], cm[0]);
              while (dp > Math.PI) dp -= 2 * Math.PI;
              while (dp < -Math.PI) dp += 2 * Math.PI;
              const f = Math.abs(dp / (2 * Math.PI) / 0.002);
              v = attr === 'frequency' ? Math.min(f, 120)
                : Math.sqrt(c[0] * c[0] + c[1] * c[1]) / Math.sqrt(Math.max(f, 4));
            } else v = c[0];                       // amplitude
            out[it * nTrace + i] = v;
          }
        }
      }

      /* the two sand horizons along the same panel, for guide lines */
      const top = new Float32Array(nTrace), base = new Float32Array(nTrace);
      const thk = new Float32Array(nTrace);
      for (let i = 0; i < nTrace; i++) {
        const k = at(i);
        top[i] = tTop[k]; base[i] = tBase[k]; thk[i] = thick[k];
      }
      return { nTrace: nTrace, nt: nt, t0: t0, dt: DT, data: out,
               dir: inline ? 'inline' : 'crossline', index: idx,
               top: top, base: base, thickness: thk, attr: attr };
    }

    /* Times of the top and base of the sand along that same section, so the
       panels can be tied together with guide lines. */
    function sectionHorizons(lineIndex) {
      const x = Math.max(0, Math.min(NX - 1, Math.round(lineIndex)));
      const top = new Float32Array(NY), base = new Float32Array(NY), th = new Float32Array(NY);
      for (let y = 0; y < NY; y++) {
        const k = y * NX + x;
        top[y] = tTop[k]; base[y] = tBase[k]; th[y] = thick[k];
      }
      return { top: top, base: base, thickness: th, line: x };
    }

    return {
      nx: NX, ny: NY, params: p, wavelet: wl,
      tTop: tTop, tBase: tBase, thickness: thick,
      rc1: rc1, rc2: rc2,
      slice: slice, section: section, sectionHorizons: sectionHorizons,
      pickedHorizon: pickedHorizon, panel: panel,
      analytic: analyticNoisy,
      channelCenter: channelCenter
    };
  }

  return {
    build: build, defaults: defaults, NX: NX, NY: NY,
    RANGES: RANGES, CYCLIC: CYCLIC, CLASS: CLASS, LABEL: LABEL
  };
})();
