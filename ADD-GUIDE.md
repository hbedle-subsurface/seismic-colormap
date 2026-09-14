# Adding the guided task list and the module pager

Two shared files, identical in every repository that uses them, the same way
`count.js`, `popout.js` and `panelout.js` are.

## assets/guide.js

Renders a short numbered list of things to do, sitting directly under the tab
strip and swapping content when a step is selected. It exists so a student has
something specific to try at each step rather than moving sliders at random.

Define the tasks in the page, before loading the file:

```html
<script>
const GUIDE = {
  p1: { items: [
    { do: 'Set the colormap to the rainbow and the attribute to envelope.',
      see: 'A rim appears partway down the flank of the channel.' },
    { do: 'Now change the display range.' }
  ]},
  p2: { items: [ ... ] }
};
</script>
<script src="../assets/guide.js"></script>
```

- Keys match the `data-tab` values on the tab buttons (`p1`, `p2`, …).
- A step with no entry hides the block, which is what the exercises, key points
  and method tabs want.
- `do` is the instruction. `see` is optional and is hidden behind a
  "what to look for" toggle, so the student tries it before reading the answer.
- Clicking an item ticks it off. Nothing is stored; it is a place-keeper, not a
  progress record.
- A good list is two or three items. It is not a second set of exercises.

## assets/nextmod.js

Writes previous / next module links in above the footer, working out which
module it is on from the file name. Add it after `guide.js`:

```html
<script src="../assets/nextmod.js"></script>
```

Adding a module means adding one line to the `ORDER` array inside the file and
nothing else. The file names in `ORDER` have to match the ones on disk.

## assets/panelview.js

Adds a **Map / Section** switch and a **Hide panel** button to the lab panel,
supplies the vertical section, and puts a ceiling on how tall the sticky panel
can get. The panel is sticky so that a slider and its result are on screen at
once; without a ceiling a tall one fills a laptop screen and the steps
underneath are never visible.

Load it after `cmplot.js` and hook it up at the end of the module's own script:

```javascript
PANELVIEW.init({
  model: model,
  state: function () {
    return { attr: S.attr, cmap: S.cmap, min: lo, max: hi,
             cyclic: false, nLevels: 0, cvd: 'off', cvdSeverity: 1 };
  }
});
```

- `state` is called whenever the section needs redrawing, so it should read the
  module's current settings rather than a snapshot.
- Omit `state` and only the Hide button appears. That is the right call for a
  display built from two or three attributes at once, where a section would
  need all of them.
- Map surfaces with no section equivalent — sand thickness, curvature, two-way
  time — fall back to amplitude and say so in the caption.
- The section carries its own direction and position controls. An inline
  crosses all three faults and several bends of the channel; a crossline
  crosses the channel and shows the sand thinning to its margins.

## Checking

```
grep -rL "guide.js" --include="*.html" modules/
grep -rL "nextmod.js" --include="*.html" modules/
grep -rL "panelview.js" --include="*.html" modules/
```

Anything listed is missing one of them.
