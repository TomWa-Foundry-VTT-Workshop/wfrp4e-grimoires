# Art bible: "The Illuminated Grimoire" UI assets

Brief for every asset maker. Read all of section 1 and 2, then only your group in section 3.

## 1. Style

**Look:** early-modern printed grimoires, herbals and almanacs (16th–17th century): woodcut and copper-engraving silhouettes, bold black shapes with carved negative-space cuts, slightly irregular hand-cut edges. Occult but practical, grim, never cute, never cartoonish, no glossy vector look.

**Originality (hard rule):** every asset is original work. Do not reproduce or imitate any Games Workshop / Warhammer / Cubicle 7 logo, emblem or insignia: no Colleges of Magic symbols from the books, no eight-pointed Chaos star, no symbols of named gods (no Nurgle fly-and-three-circles, no Slaanesh or Tzeentch marks), no twin-tailed comet, no Imperial eagles or griffons, no skull-with-wings logos, no text or lettering, no real-world religious symbols (crosses, pentagrams, hexagrams, crescents used as religious marks). Use generic historical and natural motifs: tools, plants, animals, celestial bodies, alchemical vessels, everyday objects.

### Technical rules for icons (sections 3.1–3.2)

- File: `<id>.svg`, exactly the ids listed in your group.
- Root: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">`. No `width`/`height`, no `<style>`, no `class`, no `id`, no `<defs>` unless needed for a single clipPath/mask, no external references, no `<text>`, no raster images, no comments.
- Colour: only `fill="currentColor"` (on the root or the paths). No other colours, no gradients, no opacity except `fill-opacity="0.35"` for at most one secondary shape.
- Shape: filled silhouettes; use `fill-rule="evenodd"` to carve interior detail (2–4 cuts). Avoid hairlines: no visible feature thinner than 2.5 units. Strokes only if needed, then `stroke="currentColor"`, `stroke-width` 3–5, `stroke-linecap="round"`, `fill="none"` on that element.
- Composition: subject centred, about 4 units padding, optical weight similar across the set. Readable at 20 px and at 64 px.
- Size: under 3 KB per file. Round coordinates to 1 decimal.
- Prefer a clear simple silhouette over a detailed but muddy one. Hands are hard to read small: avoid them unless the subject asks for one.

### Technical rules for ornaments and marginalia (sections 3.3–3.4)

- Same root rules, but `viewBox` exactly as given per asset. `fill="currentColor"`; you may use `fill-opacity` 0.25–0.6 for depth (at most two levels). No `<text>`, no external references.
- Ornaments must tile or scale cleanly as described per asset (tiles: the left and right edges must meet seamlessly).
- Under 8 KB per file (`ritual_circle` and `runes_tile` under 12 KB).

## 2. Delivery and checking

- Write only into your output folder: `wfrp4e-grimoires/assets/ui/<group>/`.
- Also write `assets/ui/<group>/manifest.json`: an array of `{ "id", "file", "subject" }` in the listed order.
- Do not edit any other file in the repository. Do not download anything, do not use the network.
- **Look at your work.** You cannot see an SVG by reading it. Render a contact sheet and view the PNG with your Read tool:
  `python -c "import cairosvg,sys; cairosvg.svg2png(url=sys.argv[1], write_to=sys.argv[2], output_width=512)" in.svg out.png`
  (run `python` without `-I`; cairosvg is installed). For a whole group, build one SVG that places every icon in a grid at 64 px and at 20 px, render it, and check each one. Write temporary files only into your scratch folder given in the task, never into the repository. Fix anything muddy, broken or unreadable at 20 px.
- Validate with `node tools/build-ui-assets.mjs` from the `wfrp4e-grimoires` folder (it checks the rules above). 0 errors before you report.
- When finished, report: the list of files, any ids you found hard and how you resolved them.

## 3. Asset lists

### 3.1 Lores and entry kinds — `assets/ui/lores/` (20 icons)

Each is the sigil of a school of magic, shown in the table of contents, on ribbons, chat cards and as the centre of page headers. They must read as a family: same weight, each a single strong silhouette.

| id | subject |
|---|---|
| petty | small spark or star-burst above a short candle |
| arcane | ornate old key, bit down (magic without a named lore) |
| beasts | pair of stag antlers rising from a small skull-less brow plate |
| death | hourglass with sand mostly run down |
| fire | three-tongued flame rising from a small brazier bowl |
| heavens | crescent moon cradling three small stars (stars as simple 4–5 point sparks) |
| metal | smith's hammer resting on an anvil |
| life | sprouting seedling with two leaves and roots |
| light | sun disc with alternating straight and wavy rays |
| shadow | half mask with a veil falling from it |
| hedgecraft | crescent sickle with a mistletoe sprig inside the curve of the blade |
| witchcraft | three-legged cauldron with rising steam |
| daemonology | summoning ring with a gap at the bottom, inward tines and an open shackle hanging inside |
| necromancy | skull above two crossed long bones |
| nurgle | cracked bloated clay jar with a tied lid, dripping (decay; no flies, no three circles) |
| slaanesh | ornate hand mirror with a cracked glass (excess, vanity) |
| tzeentch | spiral that splits into two forks (change; no eyes, no feathers) |
| undivided | sphere split into two halves drifting apart, jagged broken edges and small fragments in the gap |
| ritual | ritual circle: two concentric rings with small marks on the outer ring and a dot in the centre |
| recipe | alchemist's flask with a curved spout and bubbles (entries from the alchemy module) |

### 3.2 Interface — `assets/ui/interface/` (36 icons)

| id | subject |
|---|---|
| status_known | wax seal with a check-like notch cut into it (memorised) |
| status_unmemorized | bookmark ribbon hanging from the top of a closed book (cast from the book) |
| status_read_only | open eye |
| status_unreadable | eye crossed by a smear / blot |
| status_learnable | quill crossing a small open book |
| status_flawed | ink blot with splashes (a flawed copy) |
| req_read_write | quill pen standing in an inkpot |
| req_language | open book with two curved speech lines coming from it |
| req_carried | leather strap with a buckle looped around a book |
| req_lore | small closed book with a bookmark star on its cover |
| req_pages | stack of three loose sheets, slightly fanned |
| req_cipher | padlock with a keyhole |
| req_forbidden | closed book bound by a crossed chain |
| stat_cn | round medallion with a small flame inside (Casting Number) |
| stat_range | arrow flying over a dashed arc |
| stat_target | concentric rings with a dot (target) |
| stat_duration | small hourglass on its side next to a tick mark |
| stat_ingredient | mortar and pestle |
| act_cast | wizard's staff, top crowned by a burst |
| act_channel | spiral vortex drawn inward |
| act_memorise | lit candle in front of a head silhouette in profile |
| act_chat | unrolled scroll with a curling end |
| act_sheet | open book with an arrow pointing out of the top right corner |
| act_copy | quill pen above two overlapping pages |
| act_decipher | key turning in a keyhole plate |
| act_unseal | broken chain with one link open |
| act_edit | quill pen nib, angled |
| act_move_up | pointed bookmark tab pointing up |
| act_move_down | pointed bookmark tab pointing down |
| act_remove | page torn in two |
| act_search | magnifying glass with a wooden handle |
| nav_prev | page corner curling to the left |
| nav_next | page corner curling to the right |
| nav_contents | ribbon bookmark with a forked tail |
| new_tome | closed book with a small star-burst on the corner |
| new_scroll | unrolled scroll with a small star-burst meaning new |

### 3.3 Ornaments — `assets/ui/ornaments/` (20 pieces)

| id | viewBox | subject and use |
|---|---|---|
| cover_corner | 0 0 96 96 | metal corner fitting of a book cover: triangular plate in the top-left corner with rivets and an engraved fleur-like (not lily of France) leaf; used rotated in all four corners |
| cover_clasp | 0 0 64 128 | book clasp: a strap ending in a metal hook plate, vertical, hinge at the top |
| cover_tooling | 0 0 64 64 | tileable blind-tooled leather pattern (interlacing lines, small lozenges), low contrast, fill-opacity 0.25–0.4; tiles seamlessly in both directions |
| spine_band | 0 0 48 24 | raised spine band (horizontal cord bulge) to repeat vertically along the gutter |
| page_frame_corner | 0 0 96 96 | thin double-rule page frame corner with a small flourish, top-left |
| deckle_edge | 0 0 400 12 | rough deckled paper edge, tileable horizontally, solid at the bottom, ragged at the top |
| ribbon | 0 0 40 160 | hanging silk bookmark ribbon with a forked (swallow-tail) end at the bottom, slight fold shading via fill-opacity |
| dropcap_frame | 0 0 96 96 | square frame for an illuminated initial: border with vine flourishes, empty centre (the letter is set in CSS) |
| rubric_divider | 0 0 480 24 | horizontal divider: thin rule with a small central knot and leaf ends |
| tailpiece | 0 0 240 60 | end-of-chapter vignette: symmetrical scroll of leaves around a small urn |
| cn_medallion | 0 0 80 80 | round medallion with a beaded rim and a plain centre (the CN number sits on it) |
| wax_seal | 0 0 96 96 | blank wax seal with an irregular edge and an inner ring (a sigil sits on it) |
| lock_plate | 0 0 96 120 | ornate lock plate with a large keyhole (for ciphered pages) |
| chain | 0 0 120 24 | horizontal chain of interlocking links, tileable (for forbidden pages) |
| runes_tile | 0 0 240 40 | one line of illegible invented runic script (abstract strokes, no real alphabet, no readable letters), tileable horizontally |
| page_curl | 0 0 96 96 | bottom-right page corner curling up (turn page) |
| scroll_finial | 0 0 64 64 | turned wooden knob end of a scroll rod, seen from the side, rod stub on the left |
| scroll_edge | 0 0 400 16 | torn parchment edge, tileable horizontally |
| quill_inkpot | 0 0 160 120 | vignette for an empty page: inkpot with a quill and a few drops |
| ritual_circle | 0 0 240 240 | full ritual diagram for the ritual spread: three concentric rings, invented rune marks between the outer rings, eight small candle or stone markers on the outer ring, an empty round space in the centre for the school's sigil |

### 3.4 Marginalia — `assets/ui/marginalia/` (16 pieces)

One corner piece per school, `viewBox="0 0 160 160"`. It sits in the top-left corner of a page (mirrored in CSS for other corners) and also serves, scaled down, as the header vignette. The motif grows from the corner along both edges and leaves the page centre free (keep the area below the diagonal from (160,40) to (40,160) empty). Each must match the school's sigil theme in section 3.1 and feel like the work of a different hand, while staying in the same woodcut style.

| id | motif |
|---|---|
| petty | doodled marginal sketches: little stars, a candle, ink loops |
| arcane | plain double-rule corner with a small key at the joint |
| beasts | antler tines and claw scratches along the edges |
| death | mourning ribbon, hourglass at the joint, a raven feather |
| fire | rising flame tongues and sparks, the edge looks scorched (ragged) |
| heavens | dotted constellation lines with small stars and a crescent |
| metal | riveted metal strip with small alchemical marks (circles, triangles, crosses as plain geometric marks) |
| life | oak leaves, acorns and a twining vine |
| light | rays fanning from the corner with a small sun |
| shadow | wisps of smoke and a falling veil |
| hedgecraft | herbs, mistletoe, a knotted twine |
| witchcraft | crude stitching, knotted cords and a small cauldron |
| daemonology | chain links and fragments of a broken circle |
| necromancy | bones, a small skull, grave-soil crumbs |
| chaos | warped, writhing tendrils with eye-less blisters (shared by all chaos lores; no god symbols) |
| ritual | arc of a ritual circle with invented rune marks along it |
