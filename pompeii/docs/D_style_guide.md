# D. Environment and visual style guide

## The look
Semi-realistic, hand-painted 2D documentary illustration. The surfaces are flat-painted planes with gouache texture (plaster, stone and ground patterns), paper weave, film grain, a soft bloom and a warm vignette. Depth comes from layered parallax and true-perspective camera moves, never from static slides. Every shot has motion: a camera move, people, smoke, ash or light.

## How the reference images were used
The supplied references were studied for composition, palette and mood. **None of them is copied into the film**, except the two public-domain 19th-century illustrations, which appear as credited archival images.

| Reference | What we took |
|---|---|
| Busy street with temple portico (warm illustrated) | One-point street perspective, crowds in coloured tunics, warm plaster facades |
| Domus interior with mother, father and child | Atrium palette (pale walls, red-and-gold frames, garlands), the child with a wooden horse (became Julia's toy) |
| Bayard engraving, 1860s (Fiorelli) | **Used as archival footage** (10C), credited |
| AI eruption chase images (people fleeing, lava streams) | Mood only. We **avoid** lava streams at Pompeii and graphic panic as inaccurate. Dark ash palette, orange underglow |
| Street of tombs reconstruction (blue sky, cypresses) | Cypress silhouettes, honorific arch closing the street, clean stone kerbs |
| Capaldo watercolour of an excavation | **Used as archival footage** (10B), credited |
| Lararium / kitchen reconstruction | Lararium in the atrium, terracotta wares |
| "Pompeian Streets" explainer frame | Stepping stones, cart ruts, fountain and thermopolium as teaching points (11B) |
| Globexplained channel grid | Typography system: small-caps kicker + big gold italic serif; parchment maps with a compass rose; red arrows for movement |

## Palette (light states, `lib/util.js` LOOKS)
| State | Sky (top / mid / horizon) | Use |
|---|---|---|
| dawn | #7f9cc0 / #e9c79a / #f6d9a8 | Opening |
| golden | #5f8fc4 / #a9c6df / #f1dcb4 | Daily life |
| noon | #4f86c6 / #93bde0 / #e3e6df | Market, atrium |
| storm | #4b4f57 / #7d7a74 / #a99a84 | Column rising |
| ash | #2c2723 / #4a3f36 / #6e5a46 | Pumice fall |
| dark | #120f0e / #211a16 / #3a2a1f | Night; firelight #ff8a3a |
| grey | #6d6a66 / #9a958d / #bab3a6 | Aftermath |
| sunset | #3e4f7a / #c97b5a / #f3b46a | Finale |
| modern | #5d8fca / #a7c7e3 / #e8e2d2 | Present-day ruins |

The arc is warm gold, then storm, ash, dark, grey, gold (time healing), modern, and finally sunset. Adjacent shots never jump more than one step.

**Materials:** plaster #e8d6b0 to #d8a77a, red dado #8e3426, Pompeian red panel #a3352a, gold frame #e2b74a, terracotta roof #c0643f, basalt #5f5a55, travertine #cdbf9f, pumice #d8cdb8 / #8c8274, vine green #4f6a32.

## Typography (two faces)
- **Display:** Playfair Display Italic 800, gold gradient (#fbe7a6 > #e8bd55 > #9a6a1e) with a dark bevel stroke. Used for titles, chapter names and stamps.
- **Caps:** Cinzel 700/900, tracked +12-40%. Used for kickers, labels, map names, lower thirds and honesty tags.
- **Accent:** antique gold #e8bd55. Signal red #9b2a1a is reserved for danger, data and routes.
- Both fonts are SIL OFL (licences in `fonts/`).

## Environments (all reconstructions)
- **Street:** basalt polygon paving with ruts, kerbs, stepping stones, two-storey frontages, tabernae, a thermopolium, a fountain, painted notices, balconies (maeniana), tiled eaves, an arch with Vesuvius beyond. Variants: morning, ash rising, night with torches, quake cracks, collapse, 1748 dig, uncovering, present-day ruin.
- **Forum:** Temple of Jupiter on a podium with arches, two-storey colonnades, statue bases. Variants: crowd, quake, scaffolding, buried.
- **Atrium:** compluvium and impluvium, Fourth-Style walls, lararium, peristyle garden. Variants: noon, lamp-lit night, ruin.
- **Aerial:** walled town, insulae, forum, amphitheatre, vineyards, the Sarno, the sea, Vesuvius (single cone; modern twin profile in late shots). Variants: column, PDC, burial, regrowth, excavated site.
- **Maps:** parchment Mediterranean (Natural Earth 10 m), hand-plotted Bay of Naples, compass, scale bar.
- **Diagrams:** geological cutaway, column-collapse side section, lava vs PDC, stratigraphy, house plan, timeline.

## Rules
- No modern objects in AD 79 shots. Present-day shots are labelled.
- No graphic suffering, no bodies, no plaster casts.
- Something new on screen every 2-4 seconds. Shake only on seismic or impact moments.
