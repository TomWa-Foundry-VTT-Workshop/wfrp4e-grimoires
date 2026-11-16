/**
 * Publiczny interfejs silnika ksiąg dla innych modułów.
 *
 * Moduły serii importują go ścieżką względną (jak companion-lib):
 *   import { registerEntryType } from "../wfrp4e-grimoires/scripts/public.mjs";
 * Rejestrować typ można od razu przy ładowaniu skryptu.
 */
import { FORM_BOOK, FORM_SCROLL, GRIMOIRE_FLAG, FLAG_SCOPE, addEntry, emptyBook, entriesOfType, isBook, isGrimoire, isScroll, readBook, writeBook } from "./grimoire-data.mjs";
import { registerEntryType, getEntryType } from "./entry-types.mjs";
import { bookAccess, bookContext, openEntries } from "./actors.mjs";
import { registerCopyCost } from "./book-actions.mjs";
import { consumeScroll } from "./scrolls.mjs";
import { createGrimoire } from "./inventory.mjs";
import { GrimoireApp, languageLabel } from "./grimoire-app.mjs";
import { ScrollApp } from "./scroll-app.mjs";
import { languageKey } from "./names.mjs";
import { acceptsType, getBookKind, registerBookKind } from "./book-kinds.mjs";
import { noRoomReason } from "./book-rules.mjs";
import { entryPages, entryWholeBook } from "./entry-types.mjs";

export {
  FLAG_SCOPE, GRIMOIRE_FLAG, FORM_BOOK, FORM_SCROLL,
  registerEntryType, getEntryType,
  isBook, isGrimoire, isScroll, readBook, writeBook, emptyBook, entriesOfType,
  bookAccess, bookContext, openEntries, registerCopyCost, consumeScroll, languageKey, languageLabel,
  registerBookKind, getBookKind, acceptsType
};

/** Otwiera księgę albo zwój we właściwym oknie. */
export function openBook(item) {
  return isScroll(item) ? ScrollApp.open(item) : GrimoireApp.open(item);
}

/** Tworzy nową księgę na aktorze i otwiera ją. */
export const createBook = (actor, kindId = null) => createGrimoire(actor, kindId);

/**
 * Dopisuje wpis do księgi.
 * @param {Item} item
 * @param {object} entry
 * @param {(a: object, b: object) => boolean} [same]  porównanie wpisów tego typu
 * @returns {Promise<boolean>} czy wpis został dodany
 */
/**
 * Dlaczego wpis nie zmieści się w księdze: "kind" (rodzaj księgi go nie przyjmuje), "whole", "slots", "pages"
 * albo `null`, gdy się zmieści.
 */
export function bookRoom(item, entry) {
  const book = readBook(item);
  if (!book) return "kind";
  if (!acceptsType(book.kind, entry.type)) return "kind";
  return noRoomReason(book, entry, entryPages, entryWholeBook);
}

export async function addEntryToBook(item, entry, same) {
  if (bookRoom(item, entry)) return false;
  const { book, added } = addEntry(readBook(item), entry, same);
  if (added) await item.update(writeBook(book));
  return added;
}
