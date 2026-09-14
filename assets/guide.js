/* ===========================================================================
   guide.js — the "try this" list that sits under the tab strip
   "How Colormaps Actually Work"
   Heather Bedle and April Moreno-Ward / AASPI / University of Oklahoma

   A module defines its tasks before loading this file:

       <script>const GUIDE = {
         p1: { title: 'Try this', items: [
           { do: 'Set the colormap to the rainbow and the attribute to envelope.',
             see: 'A rim appears partway down the flank of the channel.' },
           { do: 'Now change the display range.' }
         ]}
       };</script>
       <script src="../assets/guide.js"></script>

   The block is inserted after the tab strip and swaps content when a tab is
   clicked, so each step carries its own short list of things to do rather than
   leaving the student to move sliders at random. Every item can carry a `see`,
   which is hidden until asked for: the point is to try it first and then check.

   Ticking items is not stored anywhere and is gone on reload. It is there to
   keep a place in the list, not to record progress.

   Identical in every repository that uses it. See ADD-GUIDE.md.
   =========================================================================== */

(function () {
  'use strict';

  var CSS = [
    '.guide{border:1px solid #C9CDD2;border-left:3px solid #841617;background:#fff;',
    'padding:12px 16px 14px;margin:0 0 18px;border-radius:2px}',
    '.guide h4{margin:0 0 8px;font:600 12.5px/1.3 "IBM Plex Sans",sans-serif;',
    'letter-spacing:.12em;text-transform:uppercase;color:#841617}',
    '.guide ol{margin:0;padding-left:0;list-style:none;counter-reset:g}',
    '.guide li{counter-increment:g;position:relative;padding-left:30px;margin:0 0 9px;',
    'font:15px/1.55 "IBM Plex Sans",sans-serif;color:#16191C}',
    '.guide li:last-child{margin-bottom:0}',
    '.guide li::before{content:counter(g);position:absolute;left:0;top:1px;width:19px;',
    'height:19px;border:1px solid #C9CDD2;border-radius:50%;text-align:center;',
    'font:11px/18px "IBM Plex Mono",monospace;color:#5C6670}',
    '.guide li.done{color:#5C6670}',
    '.guide li.done::before{background:#841617;border-color:#841617;color:#fff;content:"\\\\2713"}',
    '.guide .tick{cursor:pointer}',
    '.guide details{margin-top:3px}',
    '.guide summary{cursor:pointer;font:13px "IBM Plex Sans",sans-serif;color:#5C6670;',
    'list-style:none}',
    '.guide summary::-webkit-details-marker{display:none}',
    '.guide summary::before{content:"\\\\203A  ";color:#841617}',
    '.guide details[open] summary::before{content:"\\\\2039  "}',
    '.guide .ans{display:block;margin-top:3px;font:14px/1.5 "IBM Plex Sans",sans-serif;',
    'color:#5C6670}',
    '@media (max-width:700px){.guide li{font-size:14.5px}}'
  ].join('');

  function build(step) {
    var g = (typeof GUIDE !== 'undefined') ? GUIDE[step] : null;
    var box = document.getElementById('guidebox');
    if (!box) return;
    if (!g || !g.items || !g.items.length) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = '';

    var h = document.createElement('h4');
    h.textContent = g.title || 'Try this';
    box.appendChild(h);

    var ol = document.createElement('ol');
    g.items.forEach(function (item) {
      var li = document.createElement('li');
      var span = document.createElement('span');
      span.className = 'tick';
      span.textContent = item.do;
      span.addEventListener('click', function () { li.classList.toggle('done'); });
      li.appendChild(span);
      if (item.see) {
        var d = document.createElement('details');
        var s = document.createElement('summary');
        s.textContent = 'what to look for';
        var a = document.createElement('span');
        a.className = 'ans';
        a.textContent = item.see;
        d.appendChild(s); d.appendChild(a);
        li.appendChild(d);
      }
      ol.appendChild(li);
    });
    box.appendChild(ol);
  }

  function start() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var tabs = document.getElementById('tabs');
    if (!tabs) return;
    var box = document.createElement('div');
    box.className = 'guide';
    box.id = 'guidebox';
    box.hidden = true;
    tabs.parentNode.insertBefore(box, tabs.nextSibling);

    tabs.querySelectorAll('button[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () { build(b.dataset.tab); });
    });
    document.querySelectorAll('.masthead a[data-tab]').forEach(function (a) {
      a.addEventListener('click', function () { build(a.dataset.tab); });
    });

    var open = tabs.querySelector('button[aria-selected="true"]');
    build(open ? open.dataset.tab : 'p1');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else { start(); }
})();
