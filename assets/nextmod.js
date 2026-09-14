/* ===========================================================================
   nextmod.js — previous and next module navigation
   "How Colormaps Actually Work"
   Heather Bedle and April Moreno-Ward / AASPI / University of Oklahoma

   Drop this into any module page. It works out which module it is on from the
   file name and writes a pager in just before the footer, so a student can
   move through the set in order without going back to the index every time.

   Adding a module means adding one line to ORDER below and nothing else.
   =========================================================================== */

(function () {
  'use strict';

  var ORDER = [
    ['00-why-the-colormap-matters.html',  '00', 'Why the colormap matters'],
    ['01-how-a-color-is-made.html',       '01', 'How a color is made'],
    ['02-hue-lightness-saturation.html',  '02', 'Hue, lightness and saturation'],
    ['03-perceptual-uniformity.html',     '03', 'Perceptual uniformity'],
    ['04-sequential-diverging-cyclic.html', '04', 'Sequential, diverging, cyclic'],
    ['05-color-vision-deficiency.html',   '05', 'Color vision deficiency'],
    ['06-dynamic-range-and-clipping.html', '06', 'Dynamic range and clipping'],
    ['07-continuous-and-discrete.html',   '07', 'Continuous and discrete color'],
    ['08-corendering.html',               '08', 'Corendering two attributes'],
    ['09-rgb-and-cmy-blending.html',      '09', 'RGB and CMY blending'],
    ['10-building-a-display.html',        '10', 'Building a display']
  ];

  var CSS = [
    '.modnav{display:flex;gap:12px;justify-content:space-between;align-items:stretch;',
    'margin:34px 0 8px;flex-wrap:wrap}',
    '.modnav a{flex:1 1 240px;display:block;text-decoration:none;border:1px solid #C9CDD2;',
    'border-radius:2px;padding:11px 14px;background:#fff;color:#16191C}',
    '.modnav a:hover{border-color:#841617}',
    '.modnav a.next{border-left-width:3px;border-left-color:#841617}',
    '.modnav a.prev{text-align:left}',
    '.modnav a.next{text-align:right}',
    '.modnav .k{display:block;font:11.5px/1.4 "IBM Plex Mono",monospace;color:#5C6670;',
    'letter-spacing:.1em;text-transform:uppercase;margin-bottom:2px}',
    '.modnav .t{font:600 16px/1.35 "IBM Plex Sans",sans-serif}',
    '.modnav a:hover .t{color:#841617}',
    '.modnav .all{flex:0 0 auto;align-self:center;font:14px "IBM Plex Sans",sans-serif;',
    'padding:11px 6px;color:#5C6670}',
    '@media (max-width:700px){.modnav a{text-align:left!important}}'
  ].join('');

  function card(entry, dir) {
    var a = document.createElement('a');
    a.className = dir;
    a.href = entry[0];
    var k = document.createElement('span');
    k.className = 'k';
    k.textContent = (dir === 'prev' ? '\u2190 previous \u00b7 module ' : 'next \u00b7 module ') + entry[1] +
                    (dir === 'next' ? ' \u2192' : '');
    var t = document.createElement('span');
    t.className = 't';
    t.textContent = entry[2];
    a.appendChild(k); a.appendChild(t);
    return a;
  }

  function start() {
    var file = location.pathname.split('/').pop();
    var i = -1;
    for (var j = 0; j < ORDER.length; j++) if (ORDER[j][0] === file) i = j;
    if (i < 0) return;

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var nav = document.createElement('div');
    nav.className = 'modnav';
    if (i > 0) nav.appendChild(card(ORDER[i - 1], 'prev'));
    var all = document.createElement('a');
    all.className = 'all';
    all.href = '../index.html';
    all.textContent = 'All modules';
    nav.appendChild(all);
    if (i < ORDER.length - 1) nav.appendChild(card(ORDER[i + 1], 'next'));

    var foot = document.querySelector('footer');
    if (foot && foot.parentNode) foot.parentNode.insertBefore(nav, foot);
    else document.querySelector('.wrap').appendChild(nav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else { start(); }
})();
