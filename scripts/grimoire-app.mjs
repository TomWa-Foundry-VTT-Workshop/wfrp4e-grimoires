/**
 * Okno księgi – rozkładówka: spis treści po lewej, wybrany wpis po prawej.
 * O treści i akcjach wpisu decyduje jego typ (entry-types.mjs).
 */
import { MODULE_ID, I18N, t } from "./constants.mjs";
import { addEntry, groupEntries, illegible, moveEntry, readBook, removeEntry, writeBook } from "./grimoire-data.mjs";
import { SPELL_TYPE } from "./spell-data.mjs";
import { acceptsType, getBookKind, isHeldKind } from "./book-kinds.mjs";
import { entryFromDrop, entryPages, entryWholeBook, typeOf } from "./entry-types.mjs";
import { LANGUAGES, normalize } from "./names.mjs";
import { requirementBadges } from "./requirements.mjs";
import { bookContext, syncCopies } from "./actors.mjs";
import { CIPHERED, OPEN, WARDED, decodeNeeded, entryProgress, freePages, freeSlots, noRoomReason, pageState, pagesUsed, slotsUsed } from "./book-rules.mjs";
import { copyAction, corruptionLabel, lockedActions, runEntryAction } from "./book-actions.mjs";
import { actionGlyph, applyAccessibility, badgeGlyph, isLightCover, loreGlyph, loreMarginalia, loreTheme, statGlyph, statusGlyph, useIlluminated } from "./ui.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const TextEditorImpl = () => foundry.applications.ux.TextEditor.implementation;

export const languageLabel = (key) => (game.i18n.has(`${I18N}.Languages.${key}`) ? t(`Languages.${key}`) : key);

const LOCKED_ICONS = { [CIPHERED]: "fa-lock", [WARDED]: "fa-skull", unread: "fa-book" };

/**
 * Stan strony pokazywany użytkownikowi. Gracz nie wie, że strona jest zakazana, dopóki nie zacznie lektury:
 * widzi ją jako nieprzeczytaną, bez ostrzeżeń o Zepsuciu. MG widzi prawdziwy stan.
 */
const shownState = (state, isGM) => (state === WARDED && !isGM ? "unread" : state);

/** Opis wady przepisanego wpisu. */
const flawText = (type) => `${t("Page.Flawed")}: ${type.flawNote?.() ?? ""}`;

/** Rozkładówka spisu treści w wyglądzie iluminowanym (pozostałe rozkładówki to identyfikatory wpisów). */
const CONTENTS = "contents";

/**
 * Motyw wpisu (`data-lore`): zaklęcie bierze szkołę z grupy, inne typy mogą podać własny przez `theme(entry)`
 * (np. receptura – wiatr magii); reszta to magia bez szkoły.
 */
const entryTheme = (type, entry, groupKey) => {
  if (type.id === SPELL_TYPE) return loreTheme(groupKey);
  return type.theme ? loreTheme(type.theme(entry) ?? "arcane") : "arcane";
};

/** Sigil wpisu: motyw typu (np. wiatr receptury), inaczej sigil szkoły albo typu. */
const entryGlyph = (type, entry, groupKey) => (type.theme ? loreGlyph(type.theme(entry) ?? "arcane") : loreGlyph(groupKey, type.id));

/** Pole wyboru warunku w trybie edycji. */
const REQUIREMENT_TOGGLES = ["readWrite", "language", "carried", "lore"];

export class GrimoireApp extends HandlebarsApplicationMixin(ApplicationV2) {
  /** Otwarte okna według UUID księgi (jedno okno na księgę). */
  static #open = new Map();

  /** Ostatnio otwarta rozkładówka każdej księgi (na czas sesji). */
  static #views = new Map();

  static open(book) {
    const existing = GrimoireApp.#open.get(book.uuid);
    if (book.actor) syncCopies(book);
    if (existing) return existing.render({ force: true });
    const app = new GrimoireApp({ book });
    GrimoireApp.#open.set(book.uuid, app);
    return app.render({ force: true });
  }

  /** Odświeża okna księgi po zmianie przedmiotu lub aktora. */
  static refresh(book) {
    GrimoireApp.#open.get(book?.uuid)?.render();
  }

  static refreshForActor(actor) {
    for (const app of GrimoireApp.#open.values()) if (app.book.actor === actor) app.render();
  }

  static DEFAULT_OPTIONS = {
    classes: [MODULE_ID, "grimoire-window"],
    window: { icon: "fa-solid fa-book-journal-whills", resizable: true },
    position: { width: 920, height: 660 },
    actions: {
      selectEntry: GrimoireApp.#onSelect,
      entryAction: GrimoireApp.#onEntryAction,
      toggleEdit: GrimoireApp.#onToggleEdit,
      removeEntry: GrimoireApp.#onRemove,
      moveUp: GrimoireApp.#onMove,
      moveDown: GrimoireApp.#onMove,
      turnPage: GrimoireApp.#onTurnPage,
      goContents: GrimoireApp.#onGoContents
    }
  };

  static PARTS = {
    book: { template: `modules/${MODULE_ID}/templates/grimoire.hbs`, scrollable: [".grimoire-toc-list", ".grimoire-details"] }
  };

  constructor({ book, ...options }) {
    super({ id: `${MODULE_ID}-${book.uuid.replaceAll(".", "-")}`, ...options });
    this.book = book;
    this.selectedId = null;
    this.view = GrimoireApp.#views.get(book.uuid) ?? CONTENTS;
    this.editMode = false;
    this.search = "";
  }

  get title() {
    return this.book.name;
  }

  get data() {
    return readBook(this.book);
  }

  get canEdit() {
    return this.book.isOwner;
  }

  async close(options) {
    GrimoireApp.#open.delete(this.book.uuid);
    return super.close(options);
  }

  /* -------------------------------------------- */

  async _prepareContext() {
    const ctx = bookContext(this.book);
    const { book, actor, reading, isGM } = ctx;
    const hidden = !reading.readable && !isGM;

    const rows = book.entries
      .filter((entry) => isGM || !typeOf(entry).visible || typeOf(entry).visible(entry, ctx))
      .map((entry) => {
        const type = typeOf(entry);
        const state = pageState(book, ctx.actorId, entry, entryPages);
        return { entry, type, state, status: state === OPEN ? type.status(entry, ctx) : state };
      });
    // Szyfr zasłania także tytuł strony; MG widzi treść, ale stan pozostaje stanem postaci
    const titleHidden = (row) => hidden || (row.state === CIPHERED && !isGM);
    const describe = (entry) => ({ ...typeOf(entry).group(entry), order: typeOf(entry).order ?? 0 });
    const rowById = new Map(rows.map((r) => [r.entry.id, r]));
    // Kolejność rozkładówek: jak w spisie treści, bez filtra wyszukiwania
    const order = groupEntries(rows.map((r) => r.entry), describe).flatMap((group) => group.entries.map((entry) => entry.id));
    const illuminated = useIlluminated();
    if (illuminated) {
      if (this.view !== CONTENTS && !order.includes(this.view)) this.view = CONTENTS;
      if (this.view !== CONTENTS) this.selectedId = this.view;
      GrimoireApp.#views.set(this.book.uuid, this.view);
    }
    if (!this.selectedId || !rows.some((r) => r.entry.id === this.selectedId)) this.selectedId = rows[0]?.entry.id ?? null;

    // Foliały: karta tytułowa to f. 1, wpisy po kolei według zajmowanych stron
    const folios = new Map();
    let nextFolio = 2;
    for (const id of order) {
      const size = entryPages(rowById.get(id).entry);
      folios.set(id, size > 1 ? `${nextFolio}–${nextFolio + size - 1}` : `${nextFolio}`);
      nextFolio += size;
    }
    const rowTheme = (row) => (titleHidden(row) ? "arcane" : entryTheme(row.type, row.entry, row.type.group(row.entry).key));

    const query = normalize(this.search);
    const visible = rows.filter((r) => !query || titleHidden(r) || normalize(r.type.name(r.entry)).includes(query));
    const byId = new Map(visible.map((r) => [r.entry.id, r]));
    const multipleTypes = new Set(rows.map((r) => r.type.id)).size > 1;
    const seenOrders = new Set();

    const groups = groupEntries(visible.map((r) => r.entry), (entry) => ({
      ...typeOf(entry).group(entry),
      order: typeOf(entry).order ?? 0
    })).map((group) => {
      const firstOfType = !seenOrders.has(group.order);
      seenOrders.add(group.order);
      const labelKey = typeOf(group.entries[0]).labelKey;
      // Nagłówek działu nie może zdradzać, co kryją strony zaszyfrowane
      const showType = multipleTypes && firstOfType && labelKey && group.entries.some((entry) => !titleHidden(byId.get(entry.id)));
      const groupType = typeOf(group.entries[0]).id;
      // Kolor i sigil szkoły zdradzałyby treść stron, których postać nie może odczytać
      const veiled = group.entries.every((entry) => titleHidden(byId.get(entry.id)));
      return {
        lore: group.key,
        theme: veiled ? "arcane" : entryTheme(typeOf(group.entries[0]), group.entries[0], group.key),
        glyph: veiled ? "lore-arcane" : entryGlyph(typeOf(group.entries[0]), group.entries[0], group.key),
        typeLabel: showType ? game.i18n.localize(labelKey) : null,
        label: hidden ? illegible(group.label) : group.label,
        entries: group.entries.map((entry) => {
          const row = byId.get(entry.id);
          const name = row.type.name(entry);
          const locked = row.state !== OPEN;
          return {
            id: entry.id,
            name: titleHidden(row) ? illegible(name) : name,
            corner: row.state === CIPHERED
              ? `${entryProgress(book, ctx.actorId, entry.id)}/${decodeNeeded(book, entryPages(entry))}`
              : locked ? "" : row.type.corner?.(entry, row.status, ctx) ?? "",
            status: row.status,
            statusLabel: locked ? t(`Page.${shownState(row.state, isGM)}`) : row.type.statusLabel(row.status),
            statusIcon: locked ? LOCKED_ICONS[shownState(row.state, isGM)] : row.type.statusIcon?.(row.status) ?? "",
            statusGlyph: statusGlyph(locked ? shownState(row.state, isGM) : row.status),
            flawed: Boolean(entry.flawed),
            flawedLabel: entry.flawed ? flawText(row.type) : "",
            folio: folios.get(entry.id),
            selected: entry.id === this.selectedId
          };
        })
      };
    });

    const selected = rows.find((r) => r.entry.id === this.selectedId);
    let details = null;
    if (selected) {
      const { entry, type, state } = selected;
      const locked = state !== OPEN;
      const concealed = hidden || (locked && !isGM);
      const name = type.name(entry);
      const info = await type.details(entry, locked ? "none" : selected.status, ctx);
      const copy = !locked && !hidden ? copyAction(this.book, entry, selected.status, ctx) : null;
      const baseNote = locked
        ? t(`Page.Note.${shownState(state, isGM)}`, { strength: book.forbidden ? corruptionLabel(book.forbidden).toLocaleLowerCase() : "" })
        : info.note;
      // Szkoła wybranego wpisu wyznacza motyw strony (kolor rubryk, sigil, marginalia)
      const loreKey = type.group(entry).key;
      details = {
        id: entry.id,
        theme: concealed ? "arcane" : entryTheme(type, entry, loreKey),
        glyph: concealed ? "lore-arcane" : entryGlyph(type, entry, loreKey),
        marginalia: concealed ? "marg-arcane" : type.theme ? loreMarginalia(type.theme(entry) ?? "arcane") : loreMarginalia(loreKey, type.id),
        name: titleHidden(selected) ? illegible(name) : name,
        subtitle: titleHidden(selected) ? illegible(info.subtitle) : concealed ? "" : info.subtitle,
        stats: info.stats,
        description: concealed ? "" : info.description,
        hidden: concealed,
        // Strona zamknięta: szyfr (postęp jako pieczęcie), zakazana albo nieczytelna dla postaci
        lockState: hidden ? "illegible" : locked && !isGM ? shownState(state, isGM) : null,
        cipher: state === CIPHERED ? (() => {
          const needed = decodeNeeded(book, entryPages(entry));
          const done = Math.min(needed, entryProgress(book, ctx.actorId, entry.id));
          return { needed, done, seals: Array.from({ length: Math.min(needed, 12) }, (_, i) => ({ filled: i < done })) };
        })() : null,
        hiddenNote: hidden ? t("Illegible") : locked ? t(`Page.Sealed.${shownState(state, isGM)}`) : "",
        status: selected.status,
        folio: folios.get(entry.id),
        statusGlyph: statusGlyph(locked ? shownState(state, isGM) : selected.status),
        wholeBook: entryWholeBook(entry),
        // Na stronie iluminowanej PM stoi w medalionie, reszta parametrów obok z ikonami
        medallion: concealed ? null : info.stats.find((s) => s.key === "CN") ?? null,
        sideStats: info.stats.filter((s) => s.key !== "CN").map((s) => ({ ...s, glyph: statGlyph(s.key) })),
        note: entry.flawed && !locked ? `${flawText(type)} ${baseNote}`.trim() : baseNote,
        actions: (hidden ? [] : locked ? lockedActions(state, ctx) : [...info.actions, ...(copy ? [copy] : [])])
          .map((action) => ({ ...action, glyph: actionGlyph(action) }))
      };
    }

    const kind = getBookKind(book.kind);
    const held = isHeldKind(book.kind);
    const hasSpells = acceptsType(book.kind, SPELL_TYPE) && (book.entries.some((entry) => entry.type === SPELL_TYPE) || book.entries.length === 0);
    const difficulties = Object.entries(game.wfrp4e?.config?.difficultyLabels ?? {}).map(([key, label]) => ({
      key, label: game.i18n.localize(label), selected: book.cipher?.difficulty === key
    }));
    const index = this.view === CONTENTS ? 0 : order.indexOf(this.view) + 1;
    const spread = illuminated ? {
      contents: this.view === CONTENTS,
      index,
      total: order.length + 1,
      prev: index > 0,
      next: index < order.length,
      ribbons: order.map((id) => {
        const row = rowById.get(id);
        const name = row.type.name(row.entry);
        return { id, theme: rowTheme(row), label: titleHidden(row) ? illegible(name) : name, active: id === this.view };
      }),
      // Wolne zapisy jako czyste karty; bez limitu jedna czysta karta w trybie edycji (cel upuszczenia)
      emptySlots: book.slots
        ? Array.from({ length: Math.min(freeSlots(book, entryWholeBook), 12) }, (_, i) => i)
        : this.editMode && this.canEdit ? [0] : []
    } : null;

    return {
      illuminated,
      spread,
      book: this.book,
      cover: book.cover,
      kind: book.kind ?? "",
      kindLabel: kind ? game.i18n.localize(kind.labelKey) : "",
      lightCover: isLightCover(book.cover),
      // Ręce zajmowane przez księgę „przy sobie” (gdy postać jej wymaga przy sobie)
      handsLabel: book.hands ? t(`Badge.hands${book.hands}`) : "",
      languageLabel: languageLabel(book.language),
      languages: Object.keys(LANGUAGES).map((key) => ({ key, label: languageLabel(key), selected: key === book.language })),
      customLanguage: LANGUAGES[book.language] ? "" : book.language,
      badges: actor ? requirementBadges(reading, book.requirements).map((b) => ({
        ...b,
        glyph: badgeGlyph(b.key),
        label: b.key === "language" ? t("Badge.language", { language: languageLabel(book.language) }) : t(`Badge.${b.key}`)
      })) : [],
      requirementToggles: REQUIREMENT_TOGGLES
        .filter((key) => (key !== "lore" || hasSpells) && (key !== "carried" || held))
        .map((key) => ({ key, label: t(`Edit.Needs.${key}`), checked: book.requirements[key] })),
      slotsLabel: book.slots ? t("Badge.slots", { used: slotsUsed(book, entryWholeBook), total: book.slots }) : "",
      pagesLabel: book.pages ? t("Badge.pages", { used: pagesUsed(book, entryPages), total: book.pages }) : "",
      // Reguły księgi ustala MG: inaczej gracz sam zdjąłby szyfr ze swojej księgi
      rules: isGM ? {
        slots: book.slots ?? "",
        hands: held ? [2, 1, 0].map((value) => ({ value, label: t(`Edit.HandsOptions.${value}`), selected: book.hands === value })) : null,
        pages: book.pages ?? "",
        cipherOff: !book.cipher,
        difficulties,
        cipherSkill: book.cipher?.skill ?? "",
        cipherSL: book.cipher?.slPerPage ?? 1,
        forbidden: ["minor", "moderate", "major"].map((key) => ({ key, label: corruptionLabel(key), selected: book.forbidden === key }))
      } : null,
      actorName: actor?.name,
      carried: ctx.carried,
      showCarried: Boolean(actor) && held && book.requirements.carried,
      groups,
      empty: rows.length === 0,
      details,
      canEdit: this.canEdit,
      editMode: this.editMode && this.canEdit,
      search: this.search
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;

    html.classList.toggle("gr-illuminated", Boolean(context.illuminated));
    // Rodzaj księgi (np. alchemiczna) – motyw okna dokłada moduł, który ten rodzaj zarejestrował
    html.dataset.kind = context.kind;
    html.dataset.lore = context.illuminated && context.spread?.contents ? "" : context.details?.theme ?? "";
    applyAccessibility(html);
    if (context.illuminated) {
      this._spreadOrder = context.spread.ribbons.map((r) => r.id);
      if (this._lastView !== this.view) this._sheet = 0;
      this._lastView = this.view;
      requestAnimationFrame(() => this.#paginate(html));
      if (this._turnDirection) {
        const spreadEl = html.querySelector(".gr-spread");
        spreadEl?.classList.add(`turning-${this._turnDirection}`);
        // Nowa rozkładówka przejmuje fokus, żeby strzałki działały dalej
        spreadEl?.focus({ preventScroll: true });
        this._turnDirection = null;
      }
      // Klawiatura: strzałki przewracają karty, Home wraca do spisu treści
      if (this._keysBoundTo !== html) {
        this._keysBoundTo = html;
        // Zmiana rozmiaru okna zmienia szerokość karty, więc dzielimy opis od nowa
        new ResizeObserver(() => this.#paginate(this.element)).observe(html);
        html.addEventListener("keydown", (ev) => {
          if (!useIlluminated() || ev.target.closest("input, select, textarea, [contenteditable]")) return;
          if (ev.key === "ArrowRight" || ev.key === "PageDown") this.#turn("next");
          else if (ev.key === "ArrowLeft" || ev.key === "PageUp") this.#turn("prev");
          else if (ev.key === "Home") this.#goTo(CONTENTS, { direction: "prev" });
          else return;
          ev.preventDefault();
        });
      }
    }

    // Tytuł okna nadążający za nazwą księgi
    if (this.window?.title) this.window.title.textContent = this.title;

    html.querySelector("input[name=search]")?.addEventListener("input", (ev) => {
      this.search = ev.target.value;
      clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => this.render({ parts: ["book"] }).then(() => {
        const input = this.element.querySelector("input[name=search]");
        input?.focus();
        input?.setSelectionRange(input.value.length, input.value.length);
      }), 200);
    });

    html.querySelector("select[name=language]")?.addEventListener("change", (ev) => this.#updateBook({ language: ev.target.value }));
    html.querySelector("input[name=customLanguage]")?.addEventListener("change", (ev) => {
      if (ev.target.value.trim()) this.#updateBook({ language: ev.target.value.trim() });
    });
    html.querySelector("input[name=cover]")?.addEventListener("change", (ev) => this.#updateBook({ cover: ev.target.value }));
    for (const box of html.querySelectorAll("input[data-requirement]")) {
      box.addEventListener("change", (ev) => this.#updateBook({
        requirements: { ...this.data.requirements, [ev.target.dataset.requirement]: ev.target.checked }
      }));
    }

    html.querySelector("select[name=hands]")?.addEventListener("change", (ev) => this.#updateBook({ hands: Number(ev.target.value) }));
    html.querySelector("input[name=slots]")?.addEventListener("change", (ev) => {
      const slots = Number.parseInt(ev.target.value, 10);
      this.#updateBook({ slots: slots > 0 ? slots : null });
    });
    html.querySelector("input[name=pages]")?.addEventListener("change", (ev) => {
      const pages = Number.parseInt(ev.target.value, 10);
      this.#updateBook({ pages: pages > 0 ? pages : null });
    });
    html.querySelector("select[name=forbidden]")?.addEventListener("change", (ev) => this.#updateBook({ forbidden: ev.target.value || null }));
    html.querySelector("select[name=cipherDifficulty]")?.addEventListener("change", (ev) => this.#updateBook({
      cipher: ev.target.value ? { skill: "", slPerPage: 1, ...this.data.cipher, difficulty: ev.target.value } : null
    }));
    html.querySelector("input[name=cipherSkill]")?.addEventListener("change", (ev) => this.#updateBook({ cipher: { ...this.data.cipher, skill: ev.target.value.trim() } }));
    html.querySelector("input[name=cipherSL]")?.addEventListener("change", (ev) => this.#updateBook({ cipher: { ...this.data.cipher, slPerPage: Number.parseInt(ev.target.value, 10) || 1 } }));

    // Element główny okna jest ten sam między renderami – nasłuch tylko raz
    if (this.canEdit && this._dropBoundTo !== html) {
      this._dropBoundTo = html;
      html.addEventListener("dragover", (ev) => {
        ev.preventDefault();
        html.classList.add("gr-dropping");
      });
      html.addEventListener("dragleave", (ev) => {
        if (!html.contains(ev.relatedTarget)) html.classList.remove("gr-dropping");
      });
      html.addEventListener("drop", (ev) => {
        html.classList.remove("gr-dropping");
        this.#onDrop(ev);
      });
    }

    if (this._turnPage) {
      html.querySelector(".grimoire-page.right")?.classList.add("turning");
      this._turnPage = false;
    }
  }

  /* -------------------------------------------- */

  async #updateBook(changes) {
    await this.book.update(writeBook({ ...this.data, ...changes }));
  }

  async #onDrop(event) {
    const data = TextEditorImpl().getDragEventData(event);
    if (!data) return;
    const found = await entryFromDrop(data);
    if (!found) return ui.notifications.warn(t("Notify.NotWritable"));
    const { entry, type } = found;
    if (!acceptsType(this.data.kind, type.id)) {
      return ui.notifications.warn(t("Notify.WrongKind", { kind: game.i18n.localize(getBookKind(this.data.kind)?.labelKey ?? "") }));
    }
    if (type.canWrite && !type.canWrite()) return ui.notifications.warn(game.i18n.localize(type.writeDeniedKey ?? `${I18N}.Notify.NotWritable`));
    const noRoom = noRoomReason(this.data, entry, entryPages, entryWholeBook);
    if (noRoom === "whole") return ui.notifications.warn(t("Notify.WholeBook"));
    if (noRoom === "slots") return ui.notifications.warn(t("Notify.NoSlot", { total: this.data.slots }));
    if (noRoom === "pages") {
      return ui.notifications.warn(t("Notify.NoRoom", { needed: entryPages(entry), free: freePages(this.data, entryPages) }));
    }
    const { book, added } = addEntry(this.data, entry, type.same);
    if (!added) return ui.notifications.info(t("Notify.AlreadyInBook", { name: type.name(entry) }));
    this.selectedId = entry.id;
    await this.#updateBook({ entries: book.entries });
  }

  #entry(target) {
    const id = target.closest("[data-entry-id]")?.dataset.entryId ?? this.selectedId;
    return this.data?.entries.find((e) => e.id === id);
  }

  static #onSelect(_event, target) {
    const id = target.closest("[data-entry-id]")?.dataset.entryId;
    if (!id) return;
    if (useIlluminated()) return this.#goTo(id);
    if (id === this.selectedId) return;
    this.selectedId = id;
    this._turnPage = true;
    this.render({ parts: ["book"] });
  }

  /* ---------- Rozkładówki (wygląd iluminowany) ---------- */

  /** Przechodzi do rozkładówki: spisu treści albo wpisu. */
  #goTo(view, { direction, lastSheet = false } = {}) {
    if (view === this.view) return;
    const order = this._spreadOrder ?? [];
    const from = this.view === CONTENTS ? 0 : order.indexOf(this.view) + 1;
    const to = view === CONTENTS ? 0 : order.indexOf(view) + 1;
    this._turnDirection = direction ?? (to >= from ? "next" : "prev");
    this._openOnLastSheet = lastSheet;
    this.view = view;
    if (view !== CONTENTS) this.selectedId = view;
    this.render({ parts: ["book"] });
  }

  /** Następna lub poprzednia karta: najpierw dalszy ciąg opisu, potem kolejna rozkładówka. */
  #turn(direction) {
    const flow = this.element?.querySelector(".gr-flow");
    const sheets = Number(flow?.dataset.sheets ?? 1);
    if (flow && direction === "next" && this._sheet < sheets - 1) return this.#showSheet(flow, this._sheet + 1);
    if (flow && direction === "prev" && this._sheet > 0) return this.#showSheet(flow, this._sheet - 1);
    const order = [CONTENTS, ...(this._spreadOrder ?? [])];
    const index = order.indexOf(this.view);
    const target = order[index + (direction === "next" ? 1 : -1)];
    if (target) this.#goTo(target, { direction, lastSheet: direction === "prev" });
  }

  static #onTurnPage(_event, target) {
    this.#turn(target.dataset.dir === "prev" ? "prev" : "next");
  }

  static #onGoContents() {
    this.#goTo(CONTENTS, { direction: "prev" });
  }

  /**
   * Dzieli opis wpisu na karty (kolumny o szerokości strony) zamiast przewijać stronę.
   * Liczba kart trafia do `data-sheets`, a licznik i rogi stron odświeżają się bez ponownego renderu.
   */
  #paginate(html) {
    const flow = html.querySelector(".gr-flow");
    if (!flow) return;
    const inner = flow.querySelector(".gr-flow-inner");
    const gap = 48;
    const width = flow.clientWidth;
    if (!width || !inner) return;
    inner.style.columnWidth = `${width}px`;
    inner.style.columnGap = `${gap}px`;
    inner.style.height = `${flow.clientHeight}px`;
    const sheets = Math.max(1, Math.round((inner.scrollWidth + gap) / (width + gap)));
    flow.dataset.sheets = String(sheets);
    flow.dataset.step = String(width + gap);
    const sheet = this._openOnLastSheet ? sheets - 1 : Math.min(this._sheet ?? 0, sheets - 1);
    this._openOnLastSheet = false;
    this.#showSheet(flow, sheet);
  }

  #showSheet(flow, sheet) {
    this._sheet = sheet;
    const sheets = Number(flow.dataset.sheets ?? 1);
    flow.querySelector(".gr-flow-inner").style.transform = `translateX(-${sheet * Number(flow.dataset.step ?? 0)}px)`;
    const root = this.element;
    const counter = root.querySelector(".gr-sheet-counter");
    if (counter) {
      counter.hidden = sheets < 2;
      counter.textContent = t("Spread.Sheet", { sheet: sheet + 1, sheets });
    }
    const order = [CONTENTS, ...(this._spreadOrder ?? [])];
    const index = order.indexOf(this.view);
    const prev = root.querySelector(".gr-turn.prev");
    const next = root.querySelector(".gr-turn.next");
    if (prev) prev.disabled = index <= 0 && sheet <= 0;
    if (next) next.disabled = index >= order.length - 1 && sheet >= sheets - 1;
  }

  static async #onEntryAction(_event, target) {
    const entry = this.#entry(target);
    if (entry) await runEntryAction(target.dataset.entryAction, this.book, entry, bookContext(this.book));
  }

  static #onToggleEdit() {
    this.editMode = !this.editMode;
    this.render();
  }

  static async #onRemove(_event, target) {
    const entry = this.#entry(target);
    if (!entry) return;
    const type = typeOf(entry);
    if (type.canWrite && !type.canWrite()) return ui.notifications.warn(game.i18n.localize(type.writeDeniedKey ?? `${I18N}.Notify.NotWritable`));
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: t("Edit.RemoveTitle") },
      content: `<p>${t("Edit.RemoveConfirm", { name: foundry.utils.escapeHTML(type.name(entry)) })}</p>`
    });
    if (ok) await this.#updateBook({ entries: removeEntry(this.data, entry.id).entries });
  }

  static async #onMove(_event, target) {
    const entry = this.#entry(target);
    const direction = target.dataset.action === "moveUp" ? -1 : 1;
    if (entry) await this.#updateBook({ entries: moveEntry(this.data, entry.id, direction).entries });
  }
}
