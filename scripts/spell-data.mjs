/**
 * Dane wpisu typu "zaklęcie" – bez zależności od Foundry.
 * Pola zaklęcia czyta adapter systemu (scripts/systems), domyślnie aktywnego.
 */
import { FLAG_SCOPE } from "./grimoire-data.mjs";
import { activeSystem } from "./systems/index.mjs";

export const SPELL_TYPE = "spell";

/** Pola zaklęcia, których nie przenosimy do księgi (zależne od miejsca przechowywania). */
const STRIP_KEYS = ["_id", "folder", "sort", "ownership", "_stats"];

/** Kopia danych zaklęcia do zapisania w księdze. */
export function spellEntry(spellData, { id, sourceUuid } = {}) {
  const data = { ...spellData };
  for (const key of STRIP_KEYS) delete data[key];
  if (data.flags?.[FLAG_SCOPE]) {
    data.flags = { ...data.flags };
    delete data.flags[FLAG_SCOPE];
  }
  return { id, type: SPELL_TYPE, sourceUuid: sourceUuid ?? null, data };
}

/** Tradycje zaklęcia: WFRP 10.x trzyma tablicę w `lore.value`, starsze wersje tekst, The Old World tekst w `lore`. */
export function spellLores(data) {
  const lore = data?.system?.lore;
  const value = lore !== null && typeof lore === "object" ? lore.value : lore;
  return [value].flat().filter(Boolean);
}

/** To samo zaklęcie: ta sama nazwa i Tradycja. */
export function sameSpell(a, b) {
  const lore = (entry) => JSON.stringify(spellLores(entry.data));
  return a.data.name === b.data.name && lore(a) === lore(b);
}

/** Najważniejsze dane czaru do wyświetlenia. */
export function spellSummary(data, system = activeSystem()) {
  return {
    name: data?.name ?? "",
    img: data?.img,
    lores: spellLores(data),
    ...system.spell.read(data?.system ?? {}),
    isPetty: spellLores(data).includes("petty")
  };
}

/** Strony zajmowane przez zaklęcie: im wyższy PM, tym dłuższy zapis. */
export function spellPages(summary) {
  return 1 + Math.floor(summary.cn / 5);
}

/** O tyle rośnie PM zaklęcia w wadliwym odpisie. */
export const FLAW_CN_PENALTY = 2;

/** Wpis po nieudanym przepisaniu: wyższy PM. */
export function flawSpell(entry, system = activeSystem()) {
  const cn = system.spell.read(entry.data?.system ?? {}).cn;
  return { ...entry, data: { ...entry.data, system: system.spell.withCN(entry.data?.system ?? {}, cn + FLAW_CN_PENALTY) } };
}

/** Statusy, w których postać rzuca zaklęcie z księgi (czyli niezapamiętane). */
export const FROM_BOOK_STATUSES = ["castable", "unmemorized"];

/**
 * Poziom Mocy tak, jak liczy go system dla postaci: zaklęcie niezapamiętane (rzucane z księgi)
 * ma PM ×2, a niezapamiętany rytuał ×4. Magia prosta nie korzysta z ksiąg.
 */
export function effectiveCN(summary, status) {
  if (!FROM_BOOK_STATUSES.includes(status) || summary.isPetty) return summary.cn;
  return summary.cn * (summary.isRitual ? 4 : 2);
}
