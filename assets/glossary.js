/* ===========================================================================
   glossary.js — click a marked term, get its definition
   "How Colormaps Actually Work"
   Heather Bedle and April Moreno-Ward / AASPI / University of Oklahoma

   Mark a term anywhere in a module:

       <span class="term" data-term="perceptual-uniformity">perceptually
       uniform</span>

   The key is the entry below; the visible words can be whatever the sentence
   needs. An unknown key says so rather than failing silently, which is how a
   typo gets noticed.

   The file carries its own styling so it can be dropped into any repository
   without a stylesheet edit, the way count.js and popout.js are.
   =========================================================================== */

const GLOSSARY = {

  colormap: { term: "Colormap",
    def: "The rule that turns a data value into a color. A colormap is a list of colors together with the mapping from the data range onto that list. Also called a color table or, in some interpretation packages, a color bar." },

  colorbar: { term: "Color bar",
    def: "The annotated strip drawn beside a display showing which color corresponds to which data value. It carries both the colormap and the numerical range in use." },

  "perceptual-uniformity": { term: "Perceptual uniformity",
    def: "A property of a colormap in which equal steps in data value produce color changes of equal perceived size. Where it fails, some parts of the data range appear to change faster than others, and boundaries appear in the image at positions set by the colormap rather than by the data." },

  luminance: { term: "Luminance",
    def: "The physical measure of light emitted by a display, weighted by the eye's sensitivity to each wavelength. The human visual system resolves spatial detail mainly through luminance variation, which is why edges are carried more strongly by changes in brightness than by changes in hue." },

  lightness: { term: "Lightness (L*)",
    def: "The perceived brightness of a color, on the scale used in the CIE L*a*b* system, running from 0 for black to 100 for white. Plotting L* along a colormap shows how its brightness progresses across the data range." },

  hue: { term: "Hue",
    def: "The attribute of a color described by names such as red, green or blue; it corresponds to the dominant wavelength. Hue carries category information well and fine spatial detail poorly." },

  saturation: { term: "Saturation",
    def: "The purity of a color, from gray at zero to a fully vivid color at maximum. In multiattribute displays saturation is sometimes used to carry a second attribute alongside hue." },

  cielab: { term: "CIE L*a*b*",
    def: "A color space defined by the Commission Internationale de l'Éclairage in which the Euclidean distance between two colors approximates their perceived difference. It is the space in which perceptual uniformity is usually measured." },

  rgb: { term: "RGB",
    def: "An additive color model in which red, green and blue light are combined. It describes how monitors and projectors produce color: all three channels at full gives white, all three at zero gives black." },

  cmy: { term: "CMY",
    def: "A subtractive color model in which cyan, magenta and yellow inks each remove a band of light from white paper. It describes printing, and it is the reason a figure that looks correct on screen can print differently." },

  hsl: { term: "HSL",
    def: "A color model that describes a color by hue, saturation and lightness rather than by amounts of red, green and blue. It maps more closely onto the way color differences are described in perception." },

  cvd: { term: "Color vision deficiency",
    def: "A reduced ability to distinguish certain colors, arising from altered or absent cone photopigments. Red-green forms affect roughly 4%–8% of men and up to about 2% of women worldwide (Birch, 2012)." },

  protanopia: { term: "Protanopia and protanomaly",
    def: "Absent or altered long-wavelength (red) cones. Reds appear darker and are confused with greens and grays." },

  deuteranopia: { term: "Deuteranopia and deuteranomaly",
    def: "Absent or altered medium-wavelength (green) cones. This is the most common form of color vision deficiency; greens and reds are confused at similar lightness." },

  tritanopia: { term: "Tritanopia and tritanomaly",
    def: "Absent or altered short-wavelength (blue) cones. Blues are confused with greens, and yellows with pinks. Much rarer than the red-green forms." },

  sequential: { term: "Sequential colormap",
    def: "A colormap whose lightness increases monotonically from one end to the other, used for attributes that run from low to high with no natural center, such as coherence, envelope or energy." },

  diverging: { term: "Diverging colormap",
    def: "A colormap with two arms of increasing color intensity either side of a neutral center, used for attributes with a meaningful zero such as amplitude or curvature, where the sign carries information." },

  cyclic: { term: "Cyclic colormap",
    def: "A colormap whose two ends are the same color, used for attributes that wrap around, such as instantaneous phase, dip azimuth and aberrancy azimuth. A non-cyclic colormap applied to a wrapping attribute produces a boundary in the image at the wrap point." },

  clipping: { term: "Clipping",
    def: "Assigning every value above the chosen maximum to the top color of the colormap, and every value below the chosen minimum to the bottom color. Clipping spends more of the color range on the values in between, at the price of showing no variation within the clipped tails." },

  "percentile-clip": { term: "Percentile clip",
    def: "Setting the display minimum and maximum at chosen percentiles of the data distribution, for example the 2nd and 98th, rather than at the extreme values. A few outlying samples then no longer control the appearance of the whole display." },

  gamma: { term: "Gamma",
    def: "A power-law rescaling applied to the normalized data before the colormap is looked up. Values below one spread the color range over the low end of the data, values above one spread it over the high end." },

  corendering: { term: "Corendering",
    def: "Displaying two or more attributes in one image, for example by taking hue from one attribute and lightness from another, or by using one attribute as a transparency mask over a second." },

  transparency: { term: "Transparency mask",
    def: "Using one attribute to set the opacity of another, so that the display shows the second attribute only where the first exceeds a chosen level." },

  "reflection-coefficient": { term: "Reflection coefficient",
    def: "The ratio of reflected to incident amplitude at an interface. At normal incidence it is (Z2 − Z1) / (Z2 + Z1), where Z is acoustic impedance." },

  impedance: { term: "Acoustic impedance",
    def: "The product of bulk density and P-wave velocity. Contrasts in impedance across an interface produce seismic reflections." },

  wavelet: { term: "Wavelet",
    def: "The short oscillatory waveform that the seismic source and the recording and processing sequence impose on every reflection. The recorded trace is the reflectivity series convolved with the wavelet." },

  ricker: { term: "Ricker wavelet",
    def: "A zero-phase wavelet defined by a single peak frequency, with a central peak and two side lobes. It is used throughout these modules to make the synthetic seismic." },

  envelope: { term: "Envelope",
    def: "The magnitude of the analytic trace, sqrt(a² + h²), where a is the seismic trace and h is its Hilbert transform. It measures the strength of the reflection independent of the phase, so it is always positive and calls for a sequential colormap." },

  "instantaneous-phase": { term: "Instantaneous phase",
    def: "The angle of the analytic trace, atan2(h, a), reported between −180° and +180°. It follows the continuity of an event independent of its strength, and it wraps at ±180°, which makes it a cyclic attribute." },

  sweetness: { term: "Sweetness",
    def: "The envelope divided by the square root of the instantaneous frequency (Radovich and Oliveros, 1998; Hart, 2008). High values are often associated with sand-rich intervals, which combine high amplitude with lower frequency." },

  coherence: { term: "Coherence",
    def: "A family of attributes measuring the similarity of neighboring traces over a short analysis window. Low values occur where waveforms differ from trace to trace, as across faults and at stratigraphic edges. It runs from low to high with no natural center, so it takes a sequential colormap." },

  curvature: { term: "Curvature",
    def: "The rate of change of dip along a reflector. Most-positive and most-negative curvature separate anticlinal from synclinal bending, so the sign is meaningful and the attribute takes a diverging colormap with a neutral center." },

  aberrancy: { term: "Aberrancy",
    def: "A third-order measure of reflector geometry that locates where the shape of a surface changes most rapidly (Qi and Marfurt, 2018). Its azimuth wraps through 360°, so it is displayed with a cyclic colormap, often masked by aberrancy magnitude." },

  tuning: { term: "Tuning thickness",
    def: "The bed thickness at which the reflections from the top and base interfere constructively and the composite amplitude reaches a maximum, at about a quarter of the dominant wavelength." },

  "horizon-slice": { term: "Horizon slice",
    def: "An attribute extracted along a picked or phantom horizon, following the structure, rather than at a constant two-way time. It keeps a stratigraphic unit together across structural relief." },

  "time-slice": { term: "Time slice",
    def: "An attribute extracted at one constant two-way time across the survey. Where the section is dipping, a time slice cuts across stratigraphy." },

  semblance: { term: "Semblance",
    def: "The ratio of the energy of the summed traces to the summed energy of the individual traces within an analysis window. It is one of the standard measures underlying coherence attributes." },

  glcm: { term: "GLCM",
    def: "Gray level co-occurrence matrix, a texture measure built from how often pairs of gray levels occur at a given separation. GLCM energy, entropy and homogeneity are used to characterize seismic texture." },

  "ers": { term: "Energy-ratio similarity",
    def: "A coherence attribute computed from the ratio of the energy of the coherent part of the data to the total energy within an analysis window." },

  histogram: { term: "Histogram",
    def: "A count of how many samples fall in each interval of the data range. The shape of the histogram determines how much of a display a given color range will actually cover." }
};

/* --------------------------------------------------------------------------
   The popup itself. One element, moved to whichever term was clicked.
   -------------------------------------------------------------------------- */

(function () {
  'use strict';

  var CSS = [
    '.term{border-bottom:1px dotted #841617;cursor:help;text-decoration:none}',
    '.term:hover{color:#841617}',
    '#gloss-pop{position:absolute;z-index:120;max-width:340px;background:#fff;',
    'border:1px solid #C9CDD2;border-top:3px solid #841617;',
    'box-shadow:0 6px 20px rgba(22,25,28,.18);padding:10px 12px;',
    'font:14px/1.5 "IBM Plex Sans",system-ui,sans-serif;color:#16191C;display:none}',
    '#gloss-pop b{display:block;margin-bottom:3px}',
    '#gloss-pop .x{float:right;cursor:pointer;color:#5C6670;font-size:12px;',
    'text-decoration:underline}'
  ].join('');

  function start() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var pop = document.createElement('div');
    pop.id = 'gloss-pop';
    document.body.appendChild(pop);

    function hide() { pop.style.display = 'none'; }

    document.addEventListener('click', function (ev) {
      var t = ev.target.closest ? ev.target.closest('.term') : null;
      if (!t) {
        if (!(ev.target.closest && ev.target.closest('#gloss-pop'))) hide();
        return;
      }
      ev.preventDefault();
      var key = t.dataset.term || t.textContent.trim().toLowerCase();
      var e = GLOSSARY[key];
      pop.innerHTML = '';
      var x = document.createElement('span');
      x.className = 'x'; x.textContent = 'close';
      x.addEventListener('click', hide);
      var name = document.createElement('b');
      name.textContent = e ? e.term : key;
      var def = document.createElement('span');
      def.textContent = e ? e.def
        : 'No glossary entry for "' + key + '" yet.';
      pop.appendChild(x); pop.appendChild(name); pop.appendChild(def);

      pop.style.display = 'block';
      var r = t.getBoundingClientRect();
      var left = r.left + window.scrollX;
      var maxLeft = window.scrollX + document.documentElement.clientWidth
                    - pop.offsetWidth - 14;
      if (left > maxLeft) left = Math.max(8, maxLeft);
      pop.style.left = left + 'px';
      pop.style.top = (r.bottom + window.scrollY + 6) + 'px';
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') hide();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else { start(); }
})();
