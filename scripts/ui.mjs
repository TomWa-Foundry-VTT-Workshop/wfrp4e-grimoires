/**
 * Wygląd „Iluminowana Księga”: przełącznik wyglądu, ikony ze sprite'a modułu i motywy szkół magii.
 *
 * Ikony leżą w `assets/ui/sprite.svg` (budowany przez `tools/build-ui-assets.mjs`) jako symbole
 * `lore-*`, `ui-*`, `orn-*` i `marg-*`. Kolor biorą z CSS (`currentColor`).
 */
import { MODULE_ID } from "./constants.mjs";

export const STYLE_ILLUMINATED = "illuminated";
export const STYLE_CLASSIC = "classic";

/** Szkoły i rodzaje wpisów, które mają własny sigil w sprite'cie. */
const LORE_GLYPHS = new Set([
  "petty", "arcane", "beasts", "death", "fire", "heavens", "metal", "life", "light", "shadow",
  "hedgecraft", "witchcraft", "daemonology", "necromancy", "nurgle", "slaanesh", "tzeentch", "undivided",
  "ritual", "recipe"
]);

/** Szkoły Chaosu dzielą jedne marginalia. */
const CHAOS_LORES = new Set(["nurgle", "slaanesh", "tzeentch", "undivided"]);

const MARGINALIA = new Set([
  "petty", "arcane", "beasts", "death", "fire", "heavens", "metal", "life", "light", "shadow",
  "hedgecraft", "witchcraft", "daemonology", "necromancy", "chaos", "ritual"
]);

/** Ikony akcji, stanów i znaków warunków; czego tu brak, zostaje przy ikonie Font Awesome. */
const ACTION_GLYPHS = {
  cast: "ui-act_cast", castScroll: "ui-act_cast", channel: "ui-act_channel", learn: "ui-act_memorise",
  memorize: "ui-act_memorise", chat: "ui-act_chat", openSheet: "ui-act_sheet", copyEntry: "ui-act_copy",
  decipher: "ui-act_decipher", readForbidden: "ui-act_unseal"
};
const STATUS_GLYPHS = {
  known: "ui-status_known", memorized: "ui-status_known", unmemorized: "ui-status_unmemorized", castable: "ui-status_unmemorized",
  readOnly: "ui-status_read_only", unreadable: "ui-status_unreadable", learnable: "ui-status_learnable",
  ciphered: "ui-req_cipher", warded: "ui-req_forbidden", unread: "ui-req_pages"
};
const STAT_GLYPHS = { CN: "ui-stat_cn", Range: "ui-stat_range", Target: "ui-stat_target", Duration: "ui-stat_duration", Ingredients: "ui-stat_ingredient" };
const BADGE_GLYPHS = { readWrite: "ui-req_read_write", language: "ui-req_language", lore: "ui-req_lore", carried: "ui-req_carried" };

/** Ikona akcji wpisu: własna z typu wpisu (`glyph`) albo znana z identyfikatora. */
export const actionGlyph = (action) => action?.glyph ?? ACTION_GLYPHS[action?.id] ?? null;
export const statusGlyph = (status) => STATUS_GLYPHS[status] ?? null;
export const badgeGlyph = (key) => BADGE_GLYPHS[key] ?? null;
export const statGlyph = (key) => STAT_GLYPHS[key] ?? null;

/** Czy klient używa wyglądu iluminowanego (domyślnie tak). */
export function useIlluminated() {
  try {
    return game.settings.get(MODULE_ID, "bookStyle") !== STYLE_CLASSIC;
  } catch {
    return true;
  }
}

/** Klucz motywu w CSS (`data-lore`): szkoła z sigilem, Chaos razem, reszta jako magia bez szkoły. */
export function loreTheme(key) {
  if (CHAOS_LORES.has(key)) return key;
  return LORE_GLYPHS.has(key) ? key : "arcane";
}

/**
 * Sigil grupy w spisie treści.
 * @param {string} key      klucz grupy (dla zaklęć: szkoła)
 * @param {string} typeId   typ wpisu ("spell", "recipe"…)
 */
export function loreGlyph(key, typeId = "spell") {
  if (typeId !== "spell") return LORE_GLYPHS.has(typeId) ? `lore-${typeId}` : "lore-arcane";
  return `lore-${LORE_GLYPHS.has(key) ? key : "arcane"}`;
}

/** Marginalia strony dla szkoły. */
export function loreMarginalia(key, typeId = "spell") {
  if (typeId !== "spell") return "marg-arcane";
  if (CHAOS_LORES.has(key)) return "marg-chaos";
  return `marg-${MARGINALIA.has(key) ? key : "arcane"}`;
}

/** Adres sprite'a z uwzględnieniem prefiksu trasy serwera. */
export function spriteUrl() {
  return foundry.utils.getRoute(`modules/${MODULE_ID}/assets/ui/sprite.svg`);
}

/** Znacznik `<svg><use>` dla symbolu sprite'a. */
export function iconMarkup(id, cls = "") {
  const safeId = String(id).replace(/[^\w-]/g, "");
  const safeCls = String(cls).replace(/[^\w\s-]/g, "");
  return `<svg class="gr-icon${safeCls ? ` ${safeCls}` : ""}" aria-hidden="true" focusable="false"><use href="${spriteUrl()}#${safeId}"></use></svg>`;
}

/**
 * Dostępność okien ksiąg i zwojów: klawiatura dla klikalnych elementów niebędących przyciskami,
 * etykiety dla przycisków i znaczników z samą ikoną (czytniki ekranu nie czytają podpowiedzi).
 */
export function applyAccessibility(html) {
  for (const el of html.querySelectorAll("[data-action]:not(button, input, select, textarea)")) {
    if (!el.hasAttribute("tabindex")) el.tabIndex = 0;
    if (!el.hasAttribute("role")) el.setAttribute("role", "button");
    if (el.dataset.grKeys) continue;
    el.dataset.grKeys = "1";
    el.addEventListener("keydown", (ev) => {
      if (ev.target !== el || (ev.key !== "Enter" && ev.key !== " ")) return;
      ev.preventDefault();
      el.click();
    });
  }
  for (const el of html.querySelectorAll("button, [role='button'], .gr-status, [data-tooltip] > svg.gr-icon:only-child")) {
    const target = el.matches("svg") ? el.parentElement : el;
    if (target.hasAttribute("aria-label") || target.textContent.trim()) continue;
    const label = target.dataset.tooltip || target.getAttribute("title");
    if (!label) continue;
    target.setAttribute("aria-label", label);
    if (!target.matches("button, [role='button']")) target.setAttribute("role", "img");
  }
}

/** Czy kolor okładki jest jasny (złoty napis byłby nieczytelny); kolor w postaci #rrggbb. */
export function isLightCover(hex) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(String(hex ?? ""));
  if (!m) return false;
  const [r, g, b] = m.slice(1).map((v) => parseInt(v, 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55;
}

/** Pomocnik szablonów: {{grIcon "lore-fire" "klasa"}}. */
export function registerUiHelpers() {
  Handlebars.registerHelper("grIcon", (id, cls) => new Handlebars.SafeString(iconMarkup(id, typeof cls === "string" ? cls : "")));
}
