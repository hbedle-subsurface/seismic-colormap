/* ===========================================================================
   panelview.js — map or section, and a way to get the panel out of the way
   "How Colormaps Actually Work"
   Heather Bedle and April Moreno-Ward / AASPI / University of Oklahoma

   The lab panel is sticky, which is what makes it possible to move a slider
   and watch the answer change further down the page. The cost is that a tall
   panel fills a laptop screen and the steps underneath it are never visible.
   This file addresses that three ways:

     · a Map / Section switch, so only one display is on screen at a time
     · a Hide button that collapses the panel to a single line
     · a ceiling on the panel height, with the panel scrolling inside it

   It also supplies the vertical section itself. An inline runs across all
   three faults and several bends of the channel; a crossline runs across the
   channel and shows the sand thinning to its margins.

   A module hooks it up at the end of its own script:

       PANELVIEW.init({
         model: model,
         state: function () {
           return { attr: S.attr, cmap: S.cmap, min: r[0], max: r[1],
                    cyclic: false, nLevels: 0, cvd: 'off', cvdSeverity: 1 };
         }
       });

   Omitting `state` gives the Hide button and nothing else, which is what the
   modules whose displays are built from several attributes at once want.

   See ADD-GUIDE.md.
   =========================================================================== */

const PANELVIEW = (function () {
  'use strict';

  var CSS = [
    '.labhead{max-height:78vh;overflow:auto}',
    '.labhead.pv-collapsed{max-height:none;overflow:visible}',
    '.labhead.pv-collapsed .labgrid{display:none}',
    '.pv-bar{display:flex;gap:6px;align-items:center;margin-left:auto}',
    '.labhead .cap{display:flex;align-items:baseline;gap:8px}',
    '.pv-bar button{font:11px "IBM Plex Mono",monospace;letter-spacing:.06em;',
    'text-transform:uppercase;padding:3px 9px;border:1px solid #C9CDD2;background:#fff;',
    'color:#5C6670;cursor:pointer;border-radius:2px}',
    '.pv-bar button:hover{border-color:#841617;color:#841617}',
    '.pv-bar button[aria-pressed="true"]{background:#841617;border-color:#841617;color:#fff}',
    '.pv-hidden{display:none!important}',
    '.pv-sect .ctl{margin:8px 0 4px}',
    '@media (max-width:700px){.labhead{max-height:none;overflow:visible}}'
  ].join('');

  var cfg = null, view = 'map', collapsed = false;
  var col = null, box = null, cv = null, cap = null;
  var dirBtns = null, idxEl = null, idxOut = null;
  var dir = 'inline', index = 60;

  /* attributes that exist on a vertical section; the others are map surfaces */
  var SECTION_OK = { amplitude: 1, envelope: 1, phase: 1, frequency: 1,
                     sweetness: 1, coherence: 1 };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function setView(v) {
    view = v;
    Array.prototype.forEach.call(col.children, function (c) {
      if (c === box) c.classList.toggle('pv-hidden', v !== 'section');
      else c.classList.toggle('pv-hidden', v === 'section');
    });
    dirBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.v === v));
    });
    if (v === 'section') draw();
  }

  function setCollapsed(on) {
    collapsed = on;
    document.querySelector('.labhead').classList.toggle('pv-collapsed', on);
    var b = document.getElementById('pvHide');
    if (b) {
      b.textContent = on ? 'Show panel' : 'Hide panel';
      b.setAttribute('aria-pressed', String(on));
    }
  }

  function draw() {
    if (!cfg || !cfg.state || view !== 'section' || collapsed) return;
    var s = cfg.state();
    if (!s) return;
    var attr = SECTION_OK[s.attr] ? s.attr : 'amplitude';
    var p = cfg.model.panel(dir, index, attr);
    var lo = s.min, hi = s.max;
    if (attr !== s.attr) {
      var r = Synthetic.RANGES.amplitude;
      lo = r[0]; hi = r[1];
    }
    CMPLOT.section(cv, p, {
      cmap: s.cmap, min: lo, max: hi, nLevels: s.nLevels || 0,
      cvd: (s.cvd && s.cvd !== 'off') ? s.cvd : undefined,
      cvdSeverity: s.cvdSeverity === undefined ? 1 : s.cvdSeverity,
      height: 300,
      xLabel: dir === 'inline' ? 'Line no.' : 'CDP no.',
      cdpMin: dir === 'inline' ? 1000 : 3600,
      title: Synthetic.LABEL[attr] + ' \u2014 ' +
             (dir === 'inline' ? 'inline at CDP ' + (3600 + 10 * index)
                               : 'crossline at line ' + (1000 + 10 * index)),
      overlay: function (ctx, rect, toPix) {
        ctx.save();
        ctx.lineWidth = 1.3; ctx.strokeStyle = '#841617';
        [['top', []], ['base', [4, 3]]].forEach(function (h) {
          ctx.setLineDash(h[1]);
          ctx.beginPath();
          for (var i = 0; i < p.nTrace; i++) {
            var q = toPix(i, p[h[0]][i]);
            if (i === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
          }
          ctx.stroke();
        });
        ctx.restore();
      }
    });
    cap.textContent = (attr !== s.attr
      ? Synthetic.LABEL[s.attr] + ' is a map surface with no section equivalent, so amplitude is shown. '
      : '') +
      (dir === 'inline'
        ? 'This line crosses all three faults and several bends of the channel.'
        : 'This line crosses the channel, where the sand thins to nothing at both margins.') +
      ' Solid line: top of the sand. Dashed: base.';
  }

  function build() {
    var head = document.querySelector('.labhead');
    if (!head) return false;
    col = head.querySelector('.labgrid > div');
    if (!col) return false;

    var style = el('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var bar = el('div', 'pv-bar');
    dirBtns = [];
    if (cfg.state) {
      [['map', 'Map'], ['section', 'Section']].forEach(function (v) {
        var b = el('button', null, v[1]);
        b.type = 'button';
        b.dataset.v = v[0];
        b.setAttribute('aria-pressed', String(v[0] === 'map'));
        b.addEventListener('click', function () { setView(v[0]); });
        bar.appendChild(b);
        dirBtns.push(b);
      });
    }
    var hide = el('button', null, 'Hide panel');
    hide.type = 'button';
    hide.id = 'pvHide';
    hide.addEventListener('click', function () { setCollapsed(!collapsed); });
    bar.appendChild(hide);

    var cap0 = head.querySelector('.cap');
    if (cap0) cap0.appendChild(bar); else head.insertBefore(bar, head.firstChild);

    if (!cfg.state) return true;

    /* the section block, which lives in the same column as the map */
    box = el('div', 'pv-sect pv-hidden');
    cv = el('canvas');
    cv.setAttribute('aria-label', 'Vertical section through the model');
    box.appendChild(cv);
    cap = el('p', 'hint-line');
    cap.innerHTML = '&nbsp;';
    box.appendChild(cap);

    var ctl = el('div', 'ctl');
    var lab = el('label');
    lab.appendChild(el('span', null, 'Direction'));
    ctl.appendChild(lab);
    var seg = el('div', 'seg');
    seg.setAttribute('role', 'group');
    [['inline', 'Inline \u2014 across the faults'],
     ['crossline', 'Crossline \u2014 across the channel']].forEach(function (d) {
      var b = el('button', null, d[1]);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(d[0] === dir));
      b.addEventListener('click', function () {
        dir = d[0];
        index = (dir === 'inline') ? 60 : 100;
        Array.prototype.forEach.call(seg.children, function (o) {
          o.setAttribute('aria-pressed', String(o === b));
        });
        idxEl.max = (dir === 'inline' ? cfg.model.ny : cfg.model.nx) - 1;
        idxEl.value = index;
        showIdx();
        draw();
      });
      seg.appendChild(b);
    });
    ctl.appendChild(seg);
    box.appendChild(ctl);

    var ctl2 = el('div', 'ctl');
    var l2 = el('label');
    l2.appendChild(el('span', null, 'Position'));
    idxOut = el('span', 'val');
    l2.appendChild(idxOut);
    ctl2.appendChild(l2);
    idxEl = el('input');
    idxEl.type = 'range';
    idxEl.min = 0;
    idxEl.max = cfg.model.ny - 1;
    idxEl.step = 1;
    idxEl.value = index;
    idxEl.addEventListener('input', function () {
      index = +idxEl.value; showIdx(); draw();
    });
    ctl2.appendChild(idxEl);
    box.appendChild(ctl2);
    col.appendChild(box);
    showIdx();
    return true;
  }

  function showIdx() {
    if (!idxOut) return;
    idxOut.textContent = dir === 'inline'
      ? 'CDP ' + (3600 + 10 * index) : 'line ' + (1000 + 10 * index);
  }

  var pending = false;
  function queue() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; draw(); });
  }

  function init(options) {
    cfg = options || {};
    if (!build()) return;
    var controls = document.getElementById('mainControls');
    if (controls) {
      controls.addEventListener('input', queue);
      controls.addEventListener('change', queue);
      controls.addEventListener('click', queue);
    }
    var tabs = document.getElementById('tabs');
    if (tabs) tabs.addEventListener('click', function () { setTimeout(draw, 0); });
    window.addEventListener('resize', function () { setTimeout(draw, 160); });
  }

  return { init: init, draw: draw, setView: setView };
})();
