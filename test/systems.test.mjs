import { afterEach, describe, expect, it } from "vitest";
import { SYSTEMS, activeSystem, supports, systemRequirements, term, useSystem } from "../scripts/systems/index.mjs";
import { LORE_THEMES } from "../scripts/systems/whtow.mjs";
import { FLAW_CN_PENALTY, effectiveCN, flawSpell, spellLores, spellPages, spellSummary } from "../scripts/spell-data.mjs";
import { quantityPath, scrollCount } from "../scripts/scroll-data.mjs";
import { copyOutcome } from "../scripts/book-rules.mjs";
import { loreGlyph, loreTheme } from "../scripts/ui.mjs";

/** Zaklęcie z The Old World w postaci danych przedmiotu. */
const towSpell = (system = {}) => ({
  name: "Fiery Blast",
  img: "icons/fire.webp",
  system: {
    cv: 6,
    lore: "battle",
    range: { value: "", custom: "12 yards" },
    target: { value: "", custom: "1 creature" },
    duration: { value: "", custom: "" },
    description: { public: "<p>Flames.</p>", gm: "" },
    ...system
  }
});

afterEach(() => {
  useSystem(null);
  delete globalThis.game;
});

describe("rejestr systemów", () => {
  it("poza Foundry używa WFRP4e", () => {
    expect(activeSystem().id).toBe("wfrp4e");
    expect(supports("castFromBook")).toBe(true);
  });

  it("wykrywa system z game.system.id", () => {
    globalThis.game = { system: { id: "whtow" } };
    expect(activeSystem().id).toBe("whtow");
  });

  it("nieznany system wraca do WFRP4e", () => {
    globalThis.game = { system: { id: "dnd5e" } };
    expect(activeSystem().id).toBe("wfrp4e");
  });

  it("każdy adapter ma komplet pól", () => {
    for (const system of Object.values(SYSTEMS)) {
      expect(["hook", "dom"]).toContain(system.inventory);
      for (const fn of ["read", "withCN", "loreLabel", "loreTheme"]) expect(typeof system.spell[fn]).toBe("function");
      for (const fn of ["data", "make", "scroll", "makeScroll"]) expect(typeof system.book[fn]).toBe("function");
      for (const fn of ["xp", "cast", "castScroll", "difficulties", "readingTest", "outcome", "corruption", "corruptionKey", "channelAvailable"]) {
        expect(typeof system[fn]).toBe("function");
      }
    }
  });
});

describe("The Old World", () => {
  it("rzuca z księgi przez kopie na karcie, bez pola zapamiętania, splatania i rąk", () => {
    useSystem("whtow");
    for (const name of ["copies", "castFromBook"]) expect(supports(name)).toBe(true);
    for (const name of ["channel", "memorize", "scrollCast", "hands", "readWrite", "language", "corruption"]) {
      expect(supports(name)).toBe(false);
    }
  });

  it("rzucanie z księgi nie podwaja CV (w WFRP PM ×2)", () => {
    const summary = { cn: 6, isPetty: false, isRitual: false };
    expect(effectiveCN(summary, "castable")).toBe(12);
    useSystem("whtow");
    expect(effectiveCN(summary, "castable")).toBe(6);
    expect(effectiveCN(summary, "unmemorized")).toBe(6);
  });

  it("rzut z księgi: test szkoły z kopią z karty", async () => {
    const calls = [];
    const actor = { setupCastingTest: async (data) => (calls.push(data), { ok: true }) };
    expect(await SYSTEMS.whtow.cast(actor, { id: "kopia" })).toEqual({ ok: true });
    expect(calls).toEqual([{ spell: "kopia" }]);
  });

  it("wyłącza warunki czytania i języka, zostawia pozostałe", () => {
    useSystem("whtow");
    const requirements = { readWrite: true, language: true, lore: true, carried: true };
    expect(systemRequirements(requirements)).toEqual({ readWrite: false, language: false, lore: true, carried: true });
  });

  it("w WFRP warunki zostają bez zmian", () => {
    const requirements = { readWrite: true, language: false, lore: true, carried: false };
    expect(systemRequirements(requirements)).toEqual(requirements);
  });

  it("czyta zaklęcie: CV, szkołę, pola z własnym opisem i opis publiczny", () => {
    useSystem("whtow");
    const summary = spellSummary(towSpell());
    expect(summary).toMatchObject({
      name: "Fiery Blast", cn: 6, lores: ["battle"], range: "12 yards", target: "1 creature",
      duration: "", description: "<p>Flames.</p>", isPetty: false, isRitual: false
    });
    expect(spellPages(summary)).toBe(2);
  });

  it("wartość z listy systemu bez Foundry zostaje kluczem", () => {
    useSystem("whtow");
    expect(spellSummary(towSpell({ duration: { value: "battle", custom: "" } })).duration).toBe("battle");
  });

  it("szkoła jako tekst w lore", () => {
    expect(spellLores(towSpell())).toEqual(["battle"]);
    expect(spellLores({ system: { lore: "" } })).toEqual([]);
  });

  it("wadliwy odpis podnosi CV", () => {
    useSystem("whtow");
    const flawed = flawSpell({ id: "a", type: "spell", data: towSpell() });
    expect(flawed.data.system.cv).toBe(6 + FLAW_CN_PENALTY);
    expect(flawed.data.system.lore).toBe("battle");
  });

  it("szkoły dostają motywy iluminacji modułu", () => {
    const theme = (lore) => loreTheme(SYSTEMS.whtow.spell.loreTheme(lore));
    expect(theme("battle")).toBe("fire");
    expect(theme("illusion")).toBe("shadow");
    expect(theme("necromancy")).toBe("necromancy");
    expect(theme("other")).toBe("arcane");
    expect(theme("nieznana")).toBe("arcane");
    expect(loreGlyph(SYSTEMS.whtow.spell.loreTheme("elementalism"))).toBe("lore-heavens");
    for (const value of Object.values(LORE_THEMES)) expect(loreTheme(value)).toBe(value);
  });

  it("wynik testu: sukcesy zamiast PS, porażka daje wadliwy odpis", () => {
    const { outcome } = SYSTEMS.whtow;
    expect(outcome({ result: { succeeded: true, successes: 3 } })).toEqual({ success: true, sl: 3, fumble: false });
    const failed = outcome({ result: { succeeded: false, successes: 0 } });
    expect(failed).toEqual({ success: false, sl: 0, fumble: false });
    expect(copyOutcome(failed)).toBe("flawed");
  });

  it("nowa księga ma przełącznik założenia, zwój ilość jako liczbę", () => {
    expect(SYSTEMS.whtow.book.data()).toEqual({ system: { equippable: true } });
    expect(SYSTEMS.whtow.book.scroll().system.quantity).toBe(1);
  });

  it("wolne PD z xp.available", () => {
    expect(SYSTEMS.whtow.xp({ system: { xp: { total: 20, available: 7 } } })).toBe(7);
    expect(SYSTEMS.wfrp4e.xp({ system: { details: { experience: { current: 40 } } } })).toBe(40);
  });

  it("nazewnictwo: sukcesy i WR zamiast PS i PM", () => {
    globalThis.game = { i18n: { localize: (key) => key, format: (key) => key } };
    expect(term("Page.FlawSpell")).toBe("WFRP4E_GRIMOIRE.Page.FlawSpell");
    useSystem("whtow");
    expect(term("Page.FlawSpell")).toBe("WFRP4E_GRIMOIRE.Page.FlawSpellCV");
    expect(term("Page.Note.ciphered")).toBe("WFRP4E_GRIMOIRE.Page.Note.cipheredPool");
    expect(term("Page.Copy")).toBe("WFRP4E_GRIMOIRE.Page.Copy");
    expect(term("Note.castable")).toBe("WFRP4E_GRIMOIRE.Note.castableCV");
  });
});

describe("zwoje w różnych systemach", () => {
  it("liczy zwoje z ilości WFRP (obiekt) i The Old World (liczba)", () => {
    expect(scrollCount({ system: { quantity: { value: 3 } } })).toBe(3);
    expect(scrollCount({ system: { quantity: 2 } })).toBe(2);
    expect(scrollCount({ system: {} })).toBe(1);
    expect(quantityPath({ system: { quantity: { value: 3 } } })).toBe("system.quantity.value");
    expect(quantityPath({ system: { quantity: 2 } })).toBe("system.quantity");
  });
});
