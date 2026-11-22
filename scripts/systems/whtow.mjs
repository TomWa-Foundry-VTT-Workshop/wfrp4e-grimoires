/**
 * Warhammer: The Old World (system "whtow").
 *
 * Rzucanie: test szkoły (Siła Woli) zbiera moc, a przycisk „Cast Spell” na czacie pozwala wybrać
 * zaklęcie tej szkoły z karty, którego Wartość Rzucania (CV) moc już osiąga.
 *
 * Zasady (Player's Guide: Formalise Spell, Memorise Spell): czarodziej zapisuje zaklęcia w swoim
 * grimuarze i rzuca je z niego; zapamiętane zaklęcie nie potrzebuje już księgi. Dlatego księga
 * założona („przy sobie”) wpisuje na kartę kopie zaklęć szkół, które postać zna – system rzuca je
 * jak każde inne. Zapamiętanie (za zgodą MG) zamienia kopię we własne zaklęcie postaci. System nie
 * ma pola „zapamiętane” ani podwajania CV, więc kopia ma zwykłe CV.
 *
 * Nie ma talentu Czytanie/Pisanie, umiejętności Język, punktów wyposażenia ani testu Zepsucia
 * przy lekturze, więc te warunki są wyłączone. Zwojów nie rzuca się bezpośrednio.
 */
import { t } from "../constants.mjs";
import { normalize } from "../names.mjs";

const config = () => globalThis.game?.oldworld?.config ?? {};
const localize = (key) => globalThis.game?.i18n?.localize(key) ?? key;

/** Etykieta z konfiguracji systemu (np. zasięg „Short”) albo sam klucz. */
const configLabel = (group, key) => {
  const label = config()[group]?.[key];
  return label ? localize(label) : String(key);
};

/** Pole zaklęcia { value, custom }: własny opis i wartość z listy systemu. */
const fieldText = (field, group) => {
  if (field === null || field === undefined) return "";
  if (typeof field !== "object") return String(field);
  const parts = [field.custom, field.value !== "" && field.value !== null && field.value !== undefined ? configLabel(group, field.value) : ""];
  return parts.filter(Boolean).join(" ");
};

/**
 * Motywy iluminacji dla szkół The Old World (sigile i kolory szkół WFRP):
 * magia bitewna – ogień, żywiołów – niebiosa, iluzji – cienie.
 */
export const LORE_THEMES = Object.freeze({
  battle: "fire",
  elementalism: "heavens",
  illusion: "shadow",
  necromancy: "necromancy",
  daemonology: "daemonology",
  other: "arcane"
});

/** Klucz umiejętności systemu dla nazwy wpisanej przez MG (klucz albo przetłumaczona nazwa). */
function skillKey(name) {
  const skills = config().skills ?? {};
  const wanted = normalize(name);
  return Object.keys(skills).find((key) => normalize(key) === wanted || normalize(localize(skills[key])) === wanted) ?? null;
}

export default {
  id: "whtow",
  inventory: "dom",
  features: {
    copies: true, castFromBook: true, channel: false, memorize: false, scrollCast: false,
    hands: false, readWrite: false, language: false, corruption: false
  },

  // Księgę zakłada się jak trapping z przełącznikiem „założone”; to jest „przy sobie”
  book: {
    data: () => ({ system: { equippable: true } }),
    make: () => ({ "system.equippable": true }),
    scroll: () => ({ system: { quantity: 1, equippable: false } }),
    makeScroll: () => ({})
  },

  spell: {
    cnStat: "CV",
    cnShort: "CVShort",
    read: (system = {}) => ({
      cn: Number(system.cv ?? 0),
      range: fieldText(system.range, "range"),
      target: fieldText(system.target, "target"),
      duration: fieldText(system.duration, "duration"),
      description: system.description?.public ?? "",
      isRitual: false
    }),
    withCN: (system = {}, cn) => ({ ...system, cv: cn }),
    loreLabel: (lore) => configLabel("magicLore", lore),
    loreTheme: (lore) => LORE_THEMES[lore] ?? "arcane"
  },

  channelAvailable: () => false,

  xp: (actor) => actor?.system?.xp?.available ?? actor?.system?.xp?.total ?? 0,

  /** Test szkoły z zaklęciem z karty (kopią z księgi); samo zaklęcie wybiera się potem na czacie. */
  cast: async (actor, spell) => (await actor.setupCastingTest({ spell: spell.id })) ?? null,
  castScroll: async () => null,

  // Testy to pule kości bez stopni trudności: szyfr jest albo go nie ma
  difficulties: () => [{ key: "standard", label: t("Edit.CipherOn") }],

  /** Test czytania: wskazana umiejętność systemu, domyślnie Przypominanie (Recall). System rzuca od razu. */
  async readingTest(actor, { skill, title }) {
    let key = "recall";
    if (skill?.trim()) {
      key = skillKey(skill);
      if (!key) {
        ui.notifications.warn(t("Page.NeedsSkill", { skill }));
        return null;
      }
    }
    return (await actor.setupSkillTest(key, { appendTitle: ` – ${title}`, skipTargets: true })) ?? null;
  },

  // Sukcesy zastępują PS; porażka nie ma stopni, więc wadliwy odpis zamiast zniszczonego
  outcome: (test) => {
    const success = Boolean(test.result?.succeeded);
    return { success, sl: success ? Number(test.result?.successes) || 0 : 0, fumble: false };
  },

  // Sukcesy zamiast PS, WR zamiast PM, kopia z księgi bez podwojonego CV
  terms: {
    "Edit.CipherSL": "Edit.CipherSuccesses",
    "Edit.CipherSkillDefault": "Edit.CipherSkillRecall",
    "Page.Note.ciphered": "Page.Note.cipheredPool",
    "Page.DecipherProgress": "Page.DecipherProgressPool",
    "Page.FlawSpell": "Page.FlawSpellCV",
    "Note.castable": "Note.castableCV"
  },

  corruptionKey: () => null,
  corruption: async () => null
};
