/**
 * Adaptery systemów Warhammera – bez zależności od Foundry przy imporcie.
 *
 * Silnik ksiąg (okno, spis treści, strony, szyfry, zwoje) jest wspólny. Adapter opisuje, czym różni się
 * system: jaki przedmiot jest księgą, jak czytać dane zaklęcia, jak rzucać, uczyć się i testować.
 * Nowy system = nowy plik w tym katalogu i wpis w `SYSTEMS`.
 *
 * Adapter:
 *   id                         – identyfikator systemu (`game.system.id`)
 *   inventory                  – "hook": dział ekwipunku przez hook systemu wfrp4e:constructInventory,
 *                                "dom": działy dokładane do karty postaci po renderze
 *   features                   – co system obsługuje:
 *     copies                   – kopie zaklęć z księgi na karcie (rzucanie z księgi)
 *     castFromBook, channel    – rzucanie i splatanie z księgi
 *     memorize                 – nauka przez zapamiętanie (inaczej: przepisanie zaklęcia na kartę)
 *     scrollCast               – rzucanie ze zwoju
 *     hands                    – ręce zajęte przez księgę (punkty wyposażenia)
 *     readWrite, language      – warunki czytania (talent Czytanie/Pisanie, umiejętność Język)
 *     corruption               – test Zepsucia przy stronach zakazanych
 *   book.data(), book.make()   – dane nowej księgi i zmiana zwykłego przedmiotu w księgę
 *   book.scroll(), book.makeScroll()
 *   spell.read(system)         – { cn, range, target, duration, description, isRitual }
 *   spell.withCN(system, cn)   – dane systemowe zaklęcia z nowym PM (wadliwy odpis)
 *   spell.cnStat, cnShort      – klucze tłumaczeń PM (np. "CN" / "CV")
 *   spell.loreLabel(lore), spell.loreTheme(lore)  – nazwa szkoły i motyw iluminacji
 *   xp(actor)                  – wolne PD postaci
 *   cast(actor, spell, opts), castScroll(actor, spell, opts)
 *   difficulties()             – [{ key, label }] dla szyfru
 *   readingTest(actor, opts)   – test czytania (wykonany) albo null
 *   outcome(test)              – { success, sl, fumble }
 *   corruption(actor, label)   – test Zepsucia albo null
 *   terms                      – (opcjonalne) klucze tłumaczeń zastępujące wspólne, np. sukcesy zamiast PS
 */
import { t } from "../constants.mjs";
import wfrp4e from "./wfrp4e.mjs";
import whtow from "./whtow.mjs";

export const SYSTEMS = Object.freeze({ [wfrp4e.id]: wfrp4e, [whtow.id]: whtow });

let forced = null;

/** Adapter aktywnego systemu; poza Foundry (testy) – WFRP4e. */
export function activeSystem() {
  return forced ?? SYSTEMS[globalThis.game?.system?.id] ?? wfrp4e;
}

/** Wymusza adapter (testy); `null` przywraca wykrywanie systemu. */
export function useSystem(id) {
  forced = id ? SYSTEMS[id] ?? null : null;
}

/** Czy aktywny system obsługuje daną funkcję. */
export const supports = (name) => Boolean(activeSystem().features[name]);

/** Warunki księgi, których system nie obsługuje, są wyłączone (dane księgi zostają bez zmian). */
export function systemRequirements(requirements = {}, system = activeSystem()) {
  return {
    ...requirements,
    readWrite: Boolean(system.features.readWrite) && requirements.readWrite !== false,
    language: Boolean(system.features.language) && requirements.language !== false
  };
}

/** Tłumaczenie z uwzględnieniem nazewnictwa systemu (`terms` adaptera). */
export function term(key, data) {
  return t(activeSystem().terms?.[key] ?? key, data);
}
