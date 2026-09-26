# How Colormaps Actually Work

Eleven interactive modules on color, color bars and the display of seismic
attributes, written for students meeting these ideas for the first time.
Everything runs in a browser, with nothing to install and no data to find.

**Start here: <https://hbedle-subsurface.github.io/seismic-colormap>**

Heather Bedle and April Moreno-Ward, School of Geosciences, University of
Oklahoma, with the [AASPI](https://www.ou.edu/mcee/labs/aaspi) consortium.

## Why this exists

An attribute volume is a set of numbers, and every decision made about it comes
from a picture of those numbers. Between the two sit a colormap and a value
range, and both are usually left at whatever the software offered. A display
made that way can hide a feature that is in the data, and it can introduce a
boundary that is not, and neither outcome leaves any mark on the picture.

That is hard to teach on real data, because showing that a display hid
something means knowing it was there in the first place. These modules use a
synthetic survey instead. The geology is known exactly, so a student can
establish what is present, change the display, and watch what happens to it.

## Who it is for

Undergraduate geology and geophysics students. A reader should know what a
seismic trace and a reflector are. No color science is assumed; module 01 starts
from how a screen makes a color.

Each seismic attribute used as an example is explained where it appears — what
it measures, what controls it, and what can make it misleading — with links out
to the module sets that cover it in its own right.

## What a student should be able to do afterward

- Say which class of colormap an attribute needs, and why.
- Set a display range from the distribution of the data rather than from its
  extreme values.
- Tell a boundary that is in the data from one the display invented, in a few
  seconds, on any figure.
- Check whether a figure still works for a reader with a color vision
  deficiency.
- Record a display so that somebody else can reproduce it.

## The modules

Worked through in order. Each takes twenty minutes to an hour.

| | Module | What it covers |
|---|---|---|
| 00 | Why the colormap matters | The model, the seismic made from it, one attribute through two colormaps at one range |
| 01 | How a color is made | Adding light on a screen, removing it with ink, a colormap as three functions |
| 02 | Hue, lightness and saturation | Which dimension carries detail, which carries order, which carries category |
| 03 | Perceptual uniformity | Equal steps that do not look equal, and the boundaries that produces |
| 04 | Sequential, diverging, cyclic | Matching the class of colormap to the mathematics of the attribute |
| 05 | Color vision deficiency | Simulation of the common forms, applied to displays and to annotation |
| 06 | Dynamic range and clipping | Histograms, percentile clips, outliers, stretch, and gain on a section |
| 07 | Continuous and discrete color | Quantizing a colormap, and output that has no order to display |
| 08 | Corendering two attributes | Hue from one, lightness from another, and transparency masking |
| 09 | RGB and CMY blending | Three attributes into three channels, and the spectral decomposition case |
| 10 | Building a display | Every control in one place, four checks, and the record of what was done |

## How a module is built

A panel sits at the top of every module and stays on screen while the text
scrolls, so a slider and the display it changes are visible together. The panel
can be switched between a map view and a vertical section, moved through the
section to cut the map at a different level, popped out into its own window, or
hidden while reading.

Below the panel, each module has four or five steps, and then:

- **Try this** — two or three specific things to do at each step, each with the
  observation to look for hidden until it is asked for. 109 of them across the
  set.
- **Exercises** — 75 in all, with answers revealed on request. Several ask for
  two explanations of one observation and the test that separates them, since
  an attribute map rarely has a single reading.
- **Why it matters** — what the step means for an interpretation.
- **Key points** — the short version.
- **Method** — how everything shown was computed, with references.

Technical terms are marked throughout and open a definition when clicked, and a
**What is this?** button explains whichever attribute is on screen.

## Using it in a course

The set is written for independent work, and a student can be pointed at it
without preparation. It also breaks up:

- **Module 00 alone** works as a single laboratory session on why the display
  is part of the interpretation.
- **Modules 03, 05 and 06** each stand on their own beside an existing
  attribute or interpretation course.
- **A single module** answers a question that came up somewhere else, such as
  why a coherence display looked different on a projector than on a monitor.
- **Module 10** closes the set by generating the record of a display, and its
  exercise asks a student to hand that record to somebody else and have them
  reproduce the figure from it.

## The data

Every module displays the same synthetic survey, so a feature learned in one
module is the same feature in the next. Its layered section holds a sinuous
channel sand thinning to nothing at both margins, a narrower second channel
below it, and a broad sheet sand too thin to resolve at any frequency. A wedge
above the marker thins to a pinchout. Three normal faults cut the section with
growth, a swarm of small polygonal faults occupies one corner, and a field of
pockmarks dimples the marker.

Sand thickness, acoustic impedance, wavelet frequency and noise are all under
slider control, so a student can change the geology and the acquisition as well
as the display.

Two of the maps in the attribute menu, sand thickness and two-way time to the
marker, are properties of the model rather than measurements of it. Neither
could be obtained from real seismic data. They are there so that an attribute
can be checked against the thing it is trying to image.

## The colormaps

The tables are the published definitions sampled at 256 levels, not
approximations built from a handful of anchor colors:

- Crameri, F., 2018, *Scientific colour maps*,
  doi:[10.5281/zenodo.1243862](https://doi.org/10.5281/zenodo.1243862), for
  Oslo, Roma, RomaO, Lajolla, Batlow and Vik
- Thyng, K. M., C. A. Greene, R. D. Hetland, H. M. Zimmerle, and S. F. DiMarco,
  2016, True colors of oceanography: *Oceanography*, 29, 9–13,
  doi:[10.5670/oceanog.2016.66](https://doi.org/10.5670/oceanog.2016.66), for
  balance
- Smith, N., and S. van der Walt, 2015, MPL color maps,
  <https://bids.github.io/colormap>, for Viridis

Sixteen arrangements in long-standing interpretation use are included alongside
them, grouped in the menus under "in common use", so that a scientific colormap
and the one it is being compared against sit in the same list. They are there to
be examined rather than recommended, and no software is named anywhere in the
modules.

Color vision deficiency is simulated with the matrices of Machado, G. M.,
M. M. Oliveira, and L. A. F. Fernandes, 2009, A physiologically-based model for
simulation of color vision deficiency: *IEEE Transactions on Visualization and
Computer Graphics*, 15, 1291–1298.

## Companion reading

Bedle, H., and A. Moreno-Ward, 2025, Techniques for improved visualization and
interpretation of seismic attributes using scientific colormaps:
*Interpretation*, 13, no. 3, B25–B37,
doi:[10.1190/INT-2025-0003.1](https://doi.org/10.1190/INT-2025-0003.1).

The same material on three-dimensional seismic data from the Great South Basin,
New Zealand. An SSRN working paper describing this module set accompanies it.

Other module sets in the same series cover seismic resolution, single-trace
attributes, geometric attributes, spectral attributes, and amplitude variation
with offset.

## Using and adapting it

Licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Free
to use, adapt and share in teaching, including inside a company, provided the
source is credited and any adaptation carries the same license. See `LICENSE`,
which also lists the licenses of the included colormap tables.

To cite: H. Bedle and A. Moreno-Ward, *How Colormaps Actually Work*, University
of Oklahoma, `hbedle-subsurface.github.io/seismic-colormap`.

Nothing a student does inside a module leaves their browser. The one request a
page makes is an anonymous page-view count, with no cookie and no identifier.

## Notes for anyone adapting the code

The modules are plain HTML and JavaScript with no build step, so opening
`index.html` locally is enough. Shared code sits in `assets/`, and each module's
own code is inline at the foot of its page. [`MODEL.md`](MODEL.md) describes the
synthetic model and the colormap library. The `ADD-*.md` files describe the
shared pieces — page-view counting, the pop-out windows, the panel controls and
the guided task lists — and how to add each one to another module set.
