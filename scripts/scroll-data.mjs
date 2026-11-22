/**
 * Dane zwoju – bez zależności od Foundry.
 *
 * Zwój to księga w formie "scroll": jeden wpis, a liczba zwojów to zwykła ilość
 * przedmiotu (WFRP: system.quantity.value, The Old World: system.quantity).
 */
import { FORM_SCROLL, emptyBook, isScroll, readBook } from "./grimoire-data.mjs";

export { isScroll };

export function emptyScroll() {
  return emptyBook(FORM_SCROLL);
}

/** Odczyt danych zwoju; `null`, gdy przedmiot nie jest zwojem. `entry` to jedyny wpis albo `null`. */
export function readScroll(item) {
  if (!isScroll(item)) return null;
  const book = readBook(item);
  return { ...book, entry: book.entries[0] ?? null };
}

/** Liczba zwojów w stosie. */
export function scrollCount(item) {
  const quantity = item?.system?.quantity;
  const value = quantity !== null && typeof quantity === "object" ? quantity.value : quantity;
  return Math.max(0, Number(value ?? 1));
}

/** Ścieżka ilości przedmiotu do aktualizacji (zależna od systemu). */
export function quantityPath(item) {
  const quantity = item?.system?.quantity;
  return quantity !== null && typeof quantity === "object" ? "system.quantity.value" : "system.quantity";
}

/**
 * Czy zużyć zwój po teście.
 * @param {{succeeded?: boolean}|null} test  wynik testu (null = anulowany dialog)
 * @param {{consumeOnFailure?: boolean}} settings
 */
export function shouldConsume(test, { consumeOnFailure = true } = {}) {
  if (!test) return false;
  return consumeOnFailure || Boolean(test.succeeded);
}

/** Nazwa zwoju z nazwy wpisu (wzorzec z tłumaczenia, {name} = nazwa). */
export function scrollName(pattern, name) {
  return String(pattern ?? "{name}").replace("{name}", name ?? "");
}
