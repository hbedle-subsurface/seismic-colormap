# How Colormaps Actually Work

Interactive teaching modules on color, color bars and the display of seismic
attributes. Served at
<https://hbedle-subsurface.github.io/seismic-colormap>.

Heather Bedle and April Moreno-Ward, School of Geosciences, University of
Oklahoma, with the [AASPI](https://www.ou.edu/mcee/labs/aaspi) consortium.

Built to the same house template as the other teaching repositories, so
`assets/style.css`, `assets/count.js`, `assets/popout.js`, `assets/panelout.js`
and `assets/seismic.js` are the shared files and go in unchanged. See
`ADD-COUNTING.md`, `ADD-POPOUT.md`, `ADD-PANELOUT.md` and `ADD-GUIDE.md`.

## Modules

| | Module | Status |
|---|---|---|
| 00 | Why the colormap matters | built |
| 01 | How a color is made | built |
| 02 | Hue, lightness and saturation | built |
| 03 | Perceptual uniformity | built |
| 04 | Sequential, diverging, cyclic | built |
| 05 | Color vision deficiency | built |
| 06 | Dynamic range and clipping | built |
| 07 | Continuous and discrete color | built |
| 08 | Corendering two attributes | built |
| 09 | RGB and CMY blending | built |
| 10 | Building a display | built |

## Running it

Static HTML, CSS and JavaScript. No build step and no dependencies. Open
`index.html`, or serve the folder:

```
python3 -m http.server 8000
```

GitHub Pages serves it from the repository root.

## Files

```
index.html
modules/00-why-the-colormap-matters.html
modules/01-how-a-color-is-made.html
modules/02-hue-lightness-saturation.html
modules/03-perceptual-uniformity.html
modules/04-sequential-diverging-cyclic.html
modules/05-color-vision-deficiency.html
modules/06-dynamic-range-and-clipping.html
modules/07-continuous-and-discrete.html
modules/08-corendering.html
modules/09-rgb-and-cmy-blending.html
modules/10-building-a-display.html
assets/style.css        shared house stylesheet
assets/count.js         shared page-view counting
assets/popout.js        shared exercise pop-out
assets/panelout.js      shared control-panel pop-out
assets/seismic.js       shared math and canvas core
assets/cmapdata.js      colormap tables, 256 levels each
assets/colormaps.js     lookup, application to data, L* profiles, CVD simulation
assets/colormodel.js    the synthetic model these modules run on
assets/cmplot.js        map, precomputed image, section, color bar and line plotting
assets/glossary.js      click a marked term, get its definition
assets/guide.js         the per-step "try this" task list
assets/nextmod.js       previous and next module navigation
assets/panelview.js     map / section switch, the vertical section, the map cut
                        level, panel collapse
```

Module code is inline at the foot of each module page, as in the other
repositories.

## The synthetic model

`assets/colormodel.js` builds a 200 × 160 survey over a twelve-interface layered
model, spanning about 500 ms of two-way time:

| | Interval | Behaviour |
|---|---|---|
| Shallow marker | −152 ms | continuous, faults dying upward |
| Pinchout wedge | −115 ms | opens to two loops at its thick end, pinches out to the west |
| Marker + channel sand | 0 | a lens up to 40 m thick, thinning to both margins |
| Second channel | +62 ms | narrower, about half the thickness, tunes at a different frequency |
| Sheet sand | +105 ms | broad and only metres thick: below tuning at every frequency |
| Deeper reflector | +150 ms | isolated; the surface curvature is picked from |
| Thin pair | +196 / +204 ms | 8 ms apart, never resolved |

Three normal faults offset the whole section with growth, a swarm of small
polygonal faults sits in one part of the survey, and a field of pockmarks
dimples the marker and dims the reflection beneath each one.

Interfaces further than 70 ms from the sample being evaluated are skipped in the
summation, so twelve interfaces cost about the same to evaluate as the three the
model started with.

Reflectivity is convolved with a Ricker wavelet. Rather than building a volume
and transforming it, the analytic trace is evaluated directly at whatever time
is asked for, from a tabulated wavelet and its quadrature, so amplitude,
envelope, instantaneous phase and instantaneous frequency all come from the same
synthetic seismic the section displays.

Under slider control: maximum sand thickness, sand acoustic impedance, peak
frequency, noise level, and pockmark dimming.

`model.slice(name)` returns a `Float32Array` of `nx * ny`:

| Name | Class | Notes |
|---|---|---|
| `amplitude` | diverging | along the marker |
| `envelope` | sequential | |
| `phase` | cyclic | wraps at ±180° |
| `frequency` | sequential | |
| `sweetness` | sequential | envelope / sqrt(frequency) |
| `coherence` | sequential | 3 × 3 semblance, no dip steering, so faults show |
| `curvature` | diverging | most-positive, from a picked horizon |
| `meanCurvature` | diverging | symmetric about zero |
| `thickness`, `twoWayTime` | sequential | model properties, not measurements |

`model.panel(dir, index, attr)` returns a vertical section carrying any of the
trace attributes, in either direction. An inline — varying line number at a
fixed CDP — crosses all three faults and several bends of the channel; a
crossline runs across the channel and shows the sand thinning to its margins.
It returns the top and base of the sand along the same panel so the displays
can be tied together with guide lines. `model.section(line)` is the older
amplitude-only form and is still used by module 00.

`model.setLevel({mode, offset, t})` moves the map view through the section:
`horizon` follows the marker at an offset in ms, `time` cuts at a constant
two-way time. It clears the slice cache, so call `redraw` after it.

Display ranges are fixed constants in `Synthetic.RANGES`. Moving a slider
changes the picture, not the scale. Module 06 is where the ranges come under the
student's control, and it works from the data's own extent and percentiles
rather than from those constants.

## Colormaps

The tables in `assets/cmapdata.js` are the published definitions, sampled at 256
levels, not approximations built from a handful of anchor colors.

- Crameri, F., 2018, *Scientific colour maps*,
  doi:[10.5281/zenodo.1243862](https://doi.org/10.5281/zenodo.1243862) —
  Oslo, Roma, RomaO, Lajolla, Batlow, Vik
- Thyng, K. M., C. A. Greene, R. D. Hetland, H. M. Zimmerle, and S. F. DiMarco,
  2016, True colors of oceanography: *Oceanography*, 29, 9–13,
  doi:[10.5670/oceanog.2016.66](https://doi.org/10.5670/oceanog.2016.66) —
  balance
- Smith, N., and S. van der Walt, 2015, MPL color maps,
  <https://bids.github.io/colormap> — Viridis

The library also carries the colormaps that have been in long-standing use in
interpretation, so that a scientific map and the map it is being compared
against sit in the same menu: rainbow, spectrum, full spectrum, extended
spectrum, heat, cyan-magenta, turbo, repeating spectrum, blue-green-yellow-
orange-red, rainbow with a white centre, a sixteen-step rainbow, red-white-blue,
blue-white-red, red-yellow-blue, red-yellow-green, cool-warm and a cyclic hue
wheel. They are grouped in the menus under "in common use" and are there to be
examined rather than recommended. `bgyor`, `rainbowwc` and `legacy16` are
reconstructions of arrangements in general use, not copies of any particular
implementation, and no software is named anywhere in the modules.

Four further legacy diverging arrangements are included because module 05 needs
them: red-white-green, magenta-white-cyan, red-green with no neutral, and
red-black-blue. The first three collapse under red-green colour vision
deficiency where red-white-blue does not, which is the point they are there to
make.

Every colormap record carries two claims about provenance — whether the map was
designed for perceptual uniformity, and whether it was designed for color vision
accessibility — and six measured fields computed from the table itself: the L*
range, whether lightness runs one way from end to end, the spread of local color
difference, and the worst of that spread under simulated color vision
deficiency. Module 03 plots them.

`assets/seismic.js` carries its own small `COLORMAPS` and `SEQMAPS` for the
displays in the other repositories. They are left alone; the modules here use
`Colormaps` from `assets/colormaps.js`, which is the one with the full tables.

`assets/colormaps.js` also carries CIE L*a*b* in both directions and the
cylindrical L*C*h form, with gamut mapping that reduces chroma and leaves
lightness alone. That is what lets module 02 build a hue ramp that is genuinely
at constant lightness along its whole length.

Color vision deficiency simulation uses the matrices of Machado, G. M.,
M. M. Oliveira, and L. A. F. Fernandes, 2009, A physiologically-based model for
simulation of color vision deficiency: *IEEE Transactions on Visualization and
Computer Graphics*, 15, 1291–1298. Intermediate severities are interpolated
toward the identity matrix.

## Companion paper

Bedle, H., and A. Moreno-Ward, 2025, Techniques for improved visualization and
interpretation of seismic attributes using scientific colormaps:
*Interpretation*, 13, B25–B37,
doi:[10.1190/INT-2025-0003.1](https://doi.org/10.1190/INT-2025-0003.1).

An SSRN working paper describing this module set will accompany it.

## License

[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). See `LICENSE`,
which also lists the licenses of the included colormap tables.
