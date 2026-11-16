/**
 * Rodzaje ksiąg – bez zależności od Foundry.
 *
 * Zwykła księga zaklęć nie ma rodzaju. Inne moduły rejestrują własne rodzaje (np. księga alchemiczna
 * z modułu Alchemii): to ta sama księga i to samo okno, ale z własnym działem w ekwipunku, listą
 * przyjmowanych typów wpisów, domyślnymi ustawieniami i motywem (atrybut `data-kind` okna).
 *
 * Rodzaj:
 *   id            – identyfikator zapisywany w księdze (`book.kind`)
 *   labelKey      – klucz tłumaczenia nazwy rodzaju („Księga alchemiczna”)
 *   newNameKey    – (opcjonalne) nazwa nowej księgi, domyślnie labelKey
 *   sectionKey    – klucz tłumaczenia działu w ekwipunku
 *   accepts       – (opcjonalne) lista typów wpisów, które można wpisać; brak = wszystkie
 *   held          – (opcjonalne) false: księgi się nie trzyma, działa z samego ekwipunku
 *                   (bez rąk, bez zakładania, bez warunku „przy sobie”)
 *   img, icon     – obrazek nowej księgi i ikona Font Awesome działu
 *   defaults      – (opcjonalne) pola nowej księgi: cover, slots, language, requirements…
 */

const KINDS = new Map();

export function registerBookKind(kind) {
  if (!kind?.id || typeof kind.id !== "string") throw new Error("Book kind needs an id");
  if (!/^[a-z0-9-]+$/i.test(kind.id)) throw new Error(`Book kind id "${kind.id}" may only use letters, digits and "-"`);
  KINDS.set(kind.id, Object.freeze({ held: true, accepts: null, defaults: {}, ...kind }));
  return KINDS.get(kind.id);
}

export const getBookKind = (id) => (id ? KINDS.get(id) ?? null : null);

export const listBookKinds = () => [...KINDS.values()];

/** Czy księga danego rodzaju przyjmuje wpis danego typu. */
export function acceptsType(kindId, typeId) {
  const accepts = getBookKind(kindId)?.accepts;
  return !Array.isArray(accepts) || accepts.includes(typeId);
}

/** Czy księgę danego rodzaju się trzyma (zajmuje ręce i może być wymagana „przy sobie”). */
export const isHeldKind = (kindId) => getBookKind(kindId)?.held !== false;
