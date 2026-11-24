# Changelog

## 0.9.2
- Names: the tome type, window title and inventory section are now **Magic Grimoire** (Polish: **Magiczny Grymuar**).
- New in the public API: `isEquippableGrimoire(item)` says whether a book can be equipped (taken in hand). The TomWa Warhammer HUD uses it to show grimoires among the equipment and in the hands widget.

## 0.9.1
- The Create Item type is now called **Magic Grimoire** (Polish: **Księga Zaklęć**).
- New English screenshots in the README with placeholder spell text, plus views of the character sheet and The Old World.

## 0.9.0
- **Warhammer: The Old World**: the module now works in the `whtow` system too. Tomes and scrolls get their own sections under Trappings, the tome window shows the spell's Casting Value, the system's range, target and duration and the Lore in a matching school look. As in the rules (Formalise Spell, Memorise Spell), a wizard casts from their grimoire: an equipped tome puts copies of its spells from Lores the character knows onto the sheet, cast through the system's Lore test without doubling the Casting Value, and **Memorise** (with GM approval) makes a copy the character's own spell. Requirements the system has no rules for (literacy, language, hands, Corruption on reading) are off, ciphers count successes on a skill test (Recall by default), and scrolls keep a spell's text without casting.
- The repository moved to the TomWa-Foundry-VTT-Workshop organisation on GitHub. Old links redirect, so installed copies keep updating.
- Under the hood: system adapters in `scripts/systems/` describe what differs between Warhammer systems (book item, spell fields, casting, learning, tests). WFRP4e works as before.

## 0.8.0
- Polish letters in the decorative fonts: Nodesto Caps and Caslon Antique have no ą, ę, ł, ś, ż…, so the browser filled them in from another typeface. When Foundry runs in Polish, headings now use Grenze Gotisch and titles Almendra, both with the full Polish alphabet (SIL Open Font License, files and licences in `assets/fonts`). English keeps the original fonts.
- **Book kinds** for other modules (`registerBookKind`): a kind uses the same tome window but gets its own inventory section, entry in the Create Item dialog, default settings (cover, capacity, requirements), a list of entry types it accepts and its own look (`data-kind` on the window). A kind can be marked as not held: such a book works straight from the inventory, takes no hands, can't be equipped and has no "Carried" requirement. Old World Alchemy uses this for alchemical books.
- Entry types can set their page theme (`theme(entry)`), so pages of other modules get a school's ink, sigil and marginalia.
- New in the public API: `bookRoom(item, entry)` says whether an entry fits; `addEntryToBook` now respects the book's kind and capacity; `createBook(actor, kindId)`.

## 0.7.0
- **Hands**: a carried tome is held in both hands by default; the GM can set one hand or none per book (Scriptorium, "Held in"). The book counts towards the character's equip points like a weapon: with the system setting "limit equipped weapons", a character can't take up the book with their hands full or draw a weapon while the book takes them, and a message says what holds their hands. The header shows "Carried · 2 hands". Tomes made earlier are also held in both hands.
- **Forbidden pages stay secret from players**: a player sees a forbidden page as simply unread (a plain seal, "Read the page", a neutral confirmation) and learns about the Corruption only from the test when they start reading. The GM still sees the forbidden mark, the warning and the chains.
- The edit field for the number of spells a tome holds is now labelled "Spells it holds" and explains that any number can be typed.
- **Entries**: a new tome holds 4 entries, as an ordinary spellbook holds about four spells, and a ritual takes the whole book (it goes only into an empty tome, and nothing fits after it). The header shows the entries in use; the GM changes the number per book in edit mode or clears it for no limit. Tomes made earlier, scrolls and alchemy recipe books keep no entry limit. The page limit still works alongside it. Entry types can mark an entry as taking the whole book (`wholeBook`).
- **Illuminated look** (new client setting "Tome look", on by default; the classic look stays available): the tome window gets a leather cover in the book's colour with blind tooling, brass corner fittings and a clasp, a parchment spread with deckled edges, gilt titles in the WFRP4e fonts, and colours, sigils and corner marginalia for each school of magic (the eight Colleges, Petty, Hedgecraft, Witchcraft, Daemonology, Necromancy and the Chaos lores). Status and requirement marks and the action buttons use the module's own icons. The scroll window gets the same style and turned knobs on its rods. A character who can't read a book or a ciphered page sees a neutral style, so the colours don't give away the school.
- **Turning pages** (illuminated look): a tome opens on a title page and a table of contents with dotted leaders, school sigils, CN and page numbers; free entries show as blank pages. Each entry has its own spread: a title page with the sigil, the CN in a medallion and range, target and duration, and a text page with the description and the actions. A long description continues on further sheets instead of scrolling. Turn the pages with the page corners, the arrow keys (Home returns to the contents) or the silk ribbons in each school's colour that hang below the pages. The window remembers the last spread of each tome for the session.
- **School pages**: each school marks its pages in its own way: an illuminated initial and a faint sigil on every text page, plus ink blots for Petty magic, claw marks for Beasts, a black mourning border for Death, scorched edges for Fire, a star chart for the Heavens, gilt rules for Metal, a pressed leaf for Life, a gilt initial for Light, smoke for Shadow, a pinned sprig for Hedgecraft, a stitched margin for Witchcraft, black rubrics for Daemonology, stains for Necromancy and wavy rubrics for the Chaos lores.
- **Rituals** get their own spread: a ritual circle with the school's sigil and the CN, numbered rubrics (I, II, III…) and a double frame on both pages.
- **Locked pages** (illuminated look): a ciphered page is covered in invented runes with a lock plate, and the decoding progress shows as wax seals; a forbidden page is bound by two crossed chains with a skull seal; a book the character can't read shows only runes.
- **Scriptorium**: edit mode turns the edit bar into a writing desk with an inkpot and parchment fields, and while you drag a spell over the tome its blank pages light up as the place to write it (a book without an entry limit shows one blank page in edit mode).
- **Scroll and chat**: the scroll window gets a wax seal in the school's colour with its sigil and the number of scrolls; a spell sent to chat looks like a page torn from the tome, with the school's sigil, colour and marginalia, the CN in a medallion and icons for range, target and duration (each player sees it in the look they chose).
- **Accessibility**: every clickable row and edit control works with Enter and Space, icon-only buttons and status marks have labels for screen readers, the current ribbon is marked, and text contrast was checked on every school's pages (at least 4.5:1). Screenshots of the illuminated look are in the README.
- UI assets for the Illuminated Grimoire look: 92 original SVG sigils, icons, ornaments and school marginalia in `assets/ui/` (sprite and gallery built by `tools/build-ui-assets.mjs`); concept and art bible in `docs/ui/`.

## 0.6.0
- **Pages**: a tome can have a page limit. Entries take up room (longer spells take more) and the header shows what is used.
- **Ciphers**: pages can be written in cipher and are worked out with tests. Progress belongs to each character, a bad failure loses it, and the page stays hidden until it is done.
- **Forbidden tomes**: reading a page for the first time is an exposure to Corruption of the strength set on the book.
- **Copying**: an entry can be copied into another of the character's books with a test. A failure leaves a flawed copy, and a bad failure ruins it. Other modules can add a cost with `registerCopyCost`.
- All of this is off by default and set per book in edit mode. Only the GM sees these rules and the reading requirements.

## 0.5.0
- **Book engine**: a tome now holds typed entries. Spells are one type; other modules add their own with `registerEntryType` (Old World Alchemy adds recipes). One tome can hold several types, and entries of a disabled module stay in the book.
- A scroll is a one-entry tome, stored in the same format.
- **Requirements belong to each book**: literacy, language, being carried and knowing the Lore are set in edit mode. The four world settings are gone from the settings window; a world's earlier choices stay as the defaults for books without their own.
- Books and scrolls from earlier versions keep working and are saved in the new format the first time they change.
- Removed: the **Write description** button and `api.scrolls.random`.
- Renamed in the interface: Grimoires are now Tomes, Magic Scrolls are now Scrolls.
- Fixed: reopening a book window no longer stacks drop handlers on its window.

## 0.4.1
- A grimoire marked as Carried keeps its full encumbrance. The system treated it as worn gear and reduced it by 1.

## 0.4.0
- **Spellbook** in the Create Item window: the new book opens right away.

## 0.3.0
- Removed the optional casting fatigue (Magical Endurance) house rule: its settings, badge, chat messages and the `endurance` API. Leftover `flags.wfrp4e-grimoires.endurance` on actors are ignored.

## 0.2.0
- **Magic scrolls**: a *Books and Documents* trapping marked by the module, holding one spell and a language; quantity = number of scrolls. Own **Magic Scrolls** inventory section, *Make into magic scroll* in the item sheet header.
- Scroll window (unrolled parchment): spell details, requirement badges, scroll count, **Read and cast** (a normal system casting test with base CN for a spell the character doesn't know; chat cards work as usual) and **To chat**. Edit mode: drop a spell, language.
- A scroll is used up after the test (setting: only after a successful test). The last scroll crumbles.
- Random scroll API: `api.scrolls.random({ lore, maxCN, actor })`.
- **Casting fatigue** (optional house rule, off by default): Magical Endurance pool (formula setting), spent by casting (base or effective CN), channelling and scrolls; below zero an Endurance test of rising difficulty, Fatigued on failure; regeneration with game time; badge in the grimoire and scroll windows; API `endurance.get/set/rest`.
- Tested with Foundry v14 (build 370) and WFRP4e 10.1.2: scroll casting and consumption, casting fatigue costs and the Endurance test.

## 0.1.0
- First version: spellbooks for WFRP4e 10.x.
- A grimoire is a *Books and Documents* trapping marked by the module, with its own **Grimoires** inventory section, a Carried toggle, an open icon and a **+** that creates a new grimoire. *Make into grimoire* in the item sheet header.
- Open-book window: spells grouped by Lore with search and status markers, spell details with enriched description, page-turn animation, requirement badges, illegible runes for characters who can't read the book.
- While a grimoire is carried, its castable spells appear in the Magic tab as non-memorised spells (book icon), cast from the grimoire as in the 4e rules (Grimoire Miscast table). They are removed when the grimoire leaves the character or is no longer carried, and restored if a memorised copy is deleted.
- Spell status follows the sheet: memorised, on the sheet but not memorised, castable, petty spell to learn, read only, unreadable.
- CN shown as the system computes it: doubled when cast from the grimoire (rituals ×4), with the memorised CN alongside.
- Petty spells are never cast from a grimoire: no sheet copies, only "Memorise" (one system XP dialog).
- Memorise with GM approval; the XP cost comes from the system's own Memorize Spell dialog. Ticking M on a grimoire copy keeps the spell for good.
- Edit mode: drag and drop spells, reorder, remove, language, cover colour, write description.
- Talents and skills recognised in English and Polish.
- English and Polish interface.
- Tested with Foundry v14 (build 370) and WFRP4e 10.1.2.
