---
name: Breach
description: Polymarket's whale bets plotted as a night-palette sounding chart.
colors:
  sea: "#03203d"
  shoal: "#062a4e"
  reef: "#0c3760"
  hair: "#17436d"
  hair-2: "#255582"
  fg: "#eef3f8"
  mist: "#a3bdd4"
  faint: "#7896b3"
  stone: "#639cc5"
  stone-hi: "#8dbbe0"
  scarlet: "#eb2f33"
  scarlet-fg: "#ff6b6e"
  scarlet-deep: "#cc2629"
  logo-royal: "#105bff"
typography:
  title:
    fontFamily: "Archivo Variable, Helvetica Neue, sans-serif"
    fontSize: "clamp(30px, 3.6vw, 46px)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 112"
  stat:
    fontFamily: "Hanken Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "'tnum'"
  sounding:
    fontFamily: "Hanken Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px to 21px, scaled by the square root of bet size"
    fontWeight: 600
    fontFeature: "'tnum'"
  panel-title:
    fontFamily: "Hanken Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Hanken Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
    fontFeature: "'ss01', 'cv11'"
  row:
    fontFamily: "Hanken Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Hanken Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  chip: "5px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  gutter: "20px"
  gutter-md: "32px"
  grid-gap: "16px"
  row-y: "12px"
  row-x: "16px"
  section: "56px"
  container: "1360px"
components:
  panel-framed:
    backgroundColor: "{colors.shoal}"
    rounded: "{rounded.lg}"
  panel-header:
    textColor: "{colors.fg}"
    typography: "{typography.panel-title}"
    height: "44px"
    padding: "0 16px"
  button-ghost:
    textColor: "{colors.mist}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 12px"
  button-ghost-hover:
    textColor: "{colors.fg}"
  segmented-on:
    backgroundColor: "{colors.stone-hi}"
    textColor: "{colors.sea}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  segmented-off:
    textColor: "{colors.mist}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  input-field:
    backgroundColor: "{colors.sea}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 10px"
  search-trigger:
    backgroundColor: "{colors.shoal}"
    textColor: "{colors.faint}"
    rounded: "{rounded.lg}"
    height: "36px"
    width: "240px"
  rank-chip:
    textColor: "{colors.stone-hi}"
    rounded: "{rounded.chip}"
    height: "20px"
    padding: "0 6px"
  rank-chip-elite:
    backgroundColor: "{colors.scarlet-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.chip}"
    height: "20px"
    padding: "0 6px"
  nav-link:
    textColor: "{colors.mist}"
    padding: "0 12px"
  nav-link-active:
    textColor: "{colors.fg}"
  tooltip-bet:
    backgroundColor: "{colors.sea}"
    rounded: "{rounded.lg}"
    padding: "12px 14px"
    width: "300px"
---

# Design System: Breach

## Overview

**Creative North Star: "The Night Sounding Chart"**

Breach reads Polymarket the way a navigator reads a nautical chart at night. The ground is deep water, everything structural is a thin stone-blue line, and the information is printed into the chart rather than boxed on top of it: every whale bet is a sounding, its size set as an italic depth figure at the price it filled and the moment it landed. Contours trace where money pools. Scarlet is the chart's hazard mark and appears only where something proven or live demands attention.

The desk is dense and quiet. Work areas sit on hairline rules, not in cards; only the chart itself earns a frame, drawn as a neatline with alternating graduation bands like a printed chart border. Type is one grotesque (Hanken Grotesk) carrying everything, with Archivo semi-expanded reserved for page titles. Numbers are always tabular so columns of money line up. Motion is short ease-out (140 to 240ms), tied to arriving data, and there is exactly one ambient loop: the live dot.

The owner rejected an amber trading-terminal palette as unprofessional; the desk does not wear the terminal costume (mono type, uppercase tracked labels, glowing green and red). It also refuses the dark crypto dashboard of identical cards.

**Key Characteristics:**
- Night-water ground (sea) with tonal steps shoal and reef, never pure black.
- Structure drawn in two hairline weights (hair, hair-2), not fills or shadows.
- One frame on a page: the chart's neatline. Everything else is a rule.
- Scarlet is rationed to top-10 ranked traders and live state.
- Buy and sell are told apart by stone versus underline, not by green and red.
- Tabular figures everywhere; soundings in italic tabular figures.

## Colors

A single-hue night palette of blues from deep water to pale stone, with one hazard red.

### Primary
- **Stone Blue** (stone): the chart's contour and shallows colour. Contour strokes and fills, distribution bars, the ranked-trader ring, the selection highlight, the active notify state at 15% tint.
- **Pale Stone** (stone-hi): the readable, interactive stone. Active tab and nav underlines, the active segment fill (with sea text, 8.1:1), "Bought", positive P&L, focus outline, graduation bands on the neatline.

### Secondary
- **Scarlet** (scarlet): the hazard mark. Top-10 rank chip fill, the dotted danger ring around a top-10 sounding, the expanding arrival ring when a top-10 bet lands, the live dot. Nothing else.
- **Scarlet Figure** (scarlet-fg): the lifted scarlet used only for a top-10 sounding's printed figure on the sea ground (5.9:1). Raw scarlet on sea is 3.9:1 and is never used for text.

### Neutral
- **Night Sea** (sea): page ground, chart water, inputs, the bet tooltip, the text on active stone fills.
- **Shoal** (shoal): the framed chart's surface, the search trigger, segmented-control trays, the command palette.
- **Reef** (reef): row hover (at 70%), placeholder tiles for avatars and market icons, track behind bars, the active board switch.
- **Hairline** (hair): row dividers, panel header rules, control borders, image rings.
- **Bold Hairline** (hair-2): the rule a panel sits on, the chart neatline, hover borders on controls, the scrollbar thumb.
- **Bone** (fg): primary text, ranked traders' names, money figures, "Sold" (underlined).
- **Mist** (mist): secondary text, unranked names and sizes, negative P&L, inactive tabs and links.
- **Faint** (faint): meta lines, table headers, axis labels, timestamps, placeholders. Holds 5.3:1 on sea and 4.7:1 on shoal; do not set it on reef.

### Brand
- **Royal Blue** (logo-royal): the logo tile only, with a bone whale tail. Pinned by the owner; it is never used as an interface colour.

### Named Rules
**The Hazard Mark Rule.** Scarlet means a top-10 ranked trader or live state. If it is on screen for any other reason, it is wrong.

**The No Traffic Light Rule.** There is no green and no red for direction. Bought is pale stone, Sold is bone with an underline, positive P&L is pale stone and negative is mist. The same code is used in lists, tables, the tooltip and the chart.

**The Shade Ladder Rule.** Categorical splits (money by market type, category mix) are drawn as a single stone ladder from pale stone down to hairline, not a rainbow.

## Typography

**Display Font:** Archivo Variable at width 112% (with Helvetica Neue)
**Body Font:** Hanken Grotesk Variable (with ui-sans-serif, system-ui), stylistic sets ss01 and cv11 on
**Label/Mono Font:** none; there is no monospace on the desk

**Character:** A plain, slightly warm grotesque does all the work; the semi-expanded Archivo title gives each page one confident, chart-legend headline in sentence case.

### Hierarchy
- **Title** (600, clamp(30px, 3.6vw, 46px), 1.02): one per page, sentence case ("Whale desk", "Leaderboards"). Also the nav wordmark at 18px.
- **Stat** (600, 26px, 1, tabular): the live figures beside the home title.
- **Sounding** (italic 600, rising to 750 for ranked traders, 11 to 21px by the square root of bet size, tabular): printed figures in the chart, with a 3px sea halo stroke so they read over contours.
- **Panel Title** (600, 14.5px): the name of each work area.
- **Body** (400, 15px, 1.625, max 56 to 62ch, mist): the one sentence under a page title.
- **Row** (400, 14 to 14.5px): names, markets and money in lists and tables; ranked names go bold bone, unranked stay regular mist.
- **Label** (400, 12.5 to 13px, faint): meta, table headers, timestamps, control labels, chart captions. Sentence case, no tracking.

### Named Rules
**The Tabular Rule.** Every number on the desk is set with tabular figures so columns of money and price line up.

**The Bold Means Proven Rule.** Bold weight on a trader's name means the trader is ranked. Unranked names never go bold.

## Layout

A centred container (max 1360px) with 20px side gutters, 32px from md up. Desk pages open with a page header (title, one sentence, the page's controls) under the fixed 60px top bar, then a 12-column grid with 16px gaps on large screens: the home desk sets the chart across 8 columns and the latest-whales list across 4; /live puts the table left and a sticky framed chart right (top 76px). Lower home sections step down with 56px between rows of work areas.

Rows are dense: 12px vertical, 16px horizontal (12px under sm). Panel headers hold a 44px minimum. Under sm, the nav's three destinations drop to a second row beneath the bar, tabs scroll sideways, and the chart caps its height at 340px; on /live the chart moves above the table.

Breakpoints follow Tailwind's defaults (sm 640, md 768, lg 1024, xl 1280); secondary table columns hide progressively at md, xl and sm.

## Elevation & Depth

The desk is flat. Depth comes from tonal water (sea under shoal under reef) and from hairline rules, never from resting shadows. The only shadows belong to things that float above the desk on demand.

### Shadow Vocabulary
- **Bet tooltip** (`box-shadow: 0 10px 30px rgba(0,8,20,.5)` with 4px backdrop blur on sea at 95%): the card a hovered sounding raises.
- **Command palette** (`box-shadow: 0 24px 60px rgba(0,8,20,.55)`): the ⌘K trader search.
- **Top bar** (sea at 90% with 12px backdrop blur, hairline bottom rule): fixed, no shadow.

### Named Rules
**The One Frame Rule.** Work areas sit on a bold hairline rule. Only the chart gets a framed panel (shoal fill, 8px radius, bold hairline border), because the chart is the one thing on the page that is a picture.

**The Float On Demand Rule.** A shadow appears only on something summoned (tooltip, palette). Nothing at rest casts one.

## Shapes

Gently rounded and small: 5px on rank chips, 6px on buttons, inputs and segments, 8px on the framed chart, search trigger and tooltip, 12px on the command palette. Avatars are circles; market icons are 6px squares with a hairline ring. Bars and switches are fully rounded.

The signature geometry is the chart's neatline: a double rule with a 5px band between, filled with alternating pale-stone graduation blocks (20 on the price axis, two per time tick on the time axis). Price guides inside the water are dotted (2 on, 5 off). The top-10 danger mark is a dotted scarlet ellipse (1.4px stroke, 1.2 on, 2.6 off, round caps) drawn around the figure; the ranked mark is a small 3px stone ring set to the figure's left.

## Components

### Buttons
Quiet, outlined, compact.
- **Shape:** 6px radius, 32px tall.
- **Ghost (default):** hairline border, mist label at 13px, optional 14 to 15px line icon. Hover lifts the border to bold hairline and the label to bone.
- **Toggled on (notify):** stone border, stone at 15% fill, bone label.
- **Press:** every control scales to 0.97 on press (140ms ease-out); colour transitions run 160ms. Reduced motion removes the scale.
- **Link out:** mist text with a 14px arrow that nudges 2px right on hover ("All alerts", "Full board").

### Segmented control
- **Tray:** sea or shoal fill, hairline border, 8px radius, 2px inset.
- **Active:** pale-stone pill with sea text, 600; on page-level segments the pill slides between options (spring 600/45).
- **Inactive:** mist text, bone on hover.

### Tabs
Underline tabs for the main switch on a page: 14px labels, active in 600 bone with a 2px pale-stone underline that slides between tabs (spring 600/45). The same underline marks the active nav link.

### Inputs / Fields
- **Style:** sea fill, hairline border, 6px radius, 32px tall, 13px bone text, faint placeholder.
- **Hover:** border to bold hairline.
- **Focus:** the global focus ring, 2px pale stone, 2px offset.

### Switch
32 by 18px track: reef with a bold hairline ring when off, pale stone when on; a 14px bone knob slides 16px (200ms ease-out).

### Rank chip
The single most important mark in the product.
- **Ranked:** 20px tall (24px at medium size), 5px radius, bold hairline border, pale-stone "#123" in 700 tabular.
- **Top 10:** deep scarlet fill (#cc2629) with a white label, 5.4:1. Plain scarlet (#eb2f33) fails at chip size (4.2:1), so the chip uses the deep step.
- The accessible name always includes the word "Rank".

### Navigation
Fixed top bar, 60px, sea at 90% with blur and a hairline bottom rule. Logo tile and Archivo wordmark left, three text links (14px mist, active 600 bone with sliding underline), and a 240px search trigger right (shoal, hairline, magnifier, "Search traders", ⌘K key cap). On the homepage the bar stays hidden until the intro has played out, then slides down (300ms ease-out).

### Lists and tables
Rows divided by hairlines; hover washes the row with reef at 70% (160ms). A new bet opens into a list (6px drop and fade, 240ms) and carries a stone wash that fades over 1.6s. Table headers are 12.5px faint, regular weight. Money sits right-aligned in 15 to 16px 600 tabular. Leaderboard podium ranks (1 to 3) step up to 20px 600 bone.

### Soundings chart (signature)
The night chart: sea water inside the neatline, eight density contours in stone (fill 2 to 9%, stroke 22 to 62%), dotted quarter-price guides, faint 11.5px axis labels ("now", "5m ago", "50¢"). Each bet prints as its size in $K. Where figures would collide, the smaller bet is thinned to a dot, as a chart does. Hovering or focusing a sounding dims the rest to 22% and raises the bet tooltip; clicking opens the trader. A new bet arrives with one expanding ring (scarlet for top 10, pale stone otherwise, 1.2s). On first view one pale-stone sweep crosses the water left to right while contours fade in, once. A caption under the chart is the legend.

### Distribution bars
3 to 6px reef tracks with stone fills that grow from zero once on first paint (450ms, staggered 40 to 60ms). Split bars use the stone shade ladder.

## Do's and Don'ts

### Do:
- **Do** sit every work area on a bold hairline rule (hair-2) with a 44px header row, and frame only the chart.
- **Do** keep scarlet to top-10 rank chips, the dotted danger ring, the top-10 arrival ring and the live dot.
- **Do** mark Bought in pale stone and Sold in bone with an underline, everywhere a side appears.
- **Do** set every figure with tabular numerals and print soundings in italic.
- **Do** use ease-out cubic-bezier(0.23, 1, 0.32, 1) at 140 to 240ms for state changes, and remove every animation under reduced motion.
- **Do** give each page one Archivo title in sentence case followed by a single plain sentence.

### Don't:
- **Don't** use green and red for up and down, buy and sell, or profit and loss.
- **Don't** use monospace, uppercase tracked labels, eyebrows above titles, or numbered sections.
- **Don't** wrap work areas in cards or give resting elements shadows.
- **Don't** add ambient loops; the live dot is the only one.
- **Don't** use Royal Blue anywhere but the logo tile.
- **Don't** bring the intro film's ink, bone, aqua, IBM Plex or uppercase display type onto the desk.

## Fenced exception: the intro film

The homepage intro (ScrollIntro) is a separate, pinned world and is not part of this system. It uses its own tokens (ink #0a0f26, bone #eaf6f5, aqua #74ffed), IBM Plex Sans scoped to the intro, an uppercase Archivo display face at width 125%, a dive animation and film grain at 7%. A 96px gradient from ink to sea bridges the film into the desk. None of it is reused after the intro; none of the desk's rules apply inside it. Do not edit it.
