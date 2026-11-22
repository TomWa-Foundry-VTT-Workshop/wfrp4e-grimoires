/**
 * Warhammer Fantasy Roleplay 4e/5e (system "wfrp4e").
 *
 * Zaklęcie niezapamiętane rzuca się z księgi z podwójnym PM, a zapamiętanie kosztuje PD liczone
 * przez system. Księga to trapping „Książki i dokumenty”, ręce to punkty wyposażenia systemu.
 */
import { MODULE_ID, t } from "../constants.mjs";
import { getEdition } from "../edition.mjs";
import { LANGUAGE, hasSpecialised, languageVariants, normalize } from "../names.mjs";

const config = () => globalThis.game?.wfrp4e?.config ?? {};
const localize = (key) => globalThis.game?.i18n?.localize(key) ?? key;

export default {
  id: "wfrp4e",
  inventory: "hook",
  features: {
    copies: true, castFromBook: true, channel: true, memorize: true, scrollCast: true,
    hands: true, readWrite: true, language: true, corruption: true
  },

  book: {
    data: () => ({ system: { trappingType: { value: "booksAndDocuments" }, encumbrance: { value: 1 } } }),
    make: () => ({ "system.trappingType.value": "booksAndDocuments" }),
    scroll: () => ({ system: { trappingType: { value: "booksAndDocuments" }, encumbrance: { value: 0 }, quantity: { value: 1 } } }),
    makeScroll: () => ({ "system.trappingType.value": "booksAndDocuments" })
  },

  spell: {
    cnStat: "CN",
    cnShort: "CNShort",
    read: (system = {}) => ({
      cn: Number(system.cn?.value ?? 0),
      range: system.range?.value ?? "",
      target: system.target?.value ?? "",
      duration: system.duration?.value ?? "",
      description: system.description?.value ?? "",
      isRitual: Boolean(system.ritual?.value)
    }),
    withCN: (system = {}, cn) => ({ ...system, cn: { ...system.cn, value: cn } }),
    loreLabel: (lore) => localize(config().magicLores?.[lore] ?? lore),
    loreTheme: (lore) => lore
  },

  /** Splatanie istnieje tylko w zasadach 4. edycji. */
  channelAvailable: () => getEdition() !== "5e",

  xp: (actor) => actor?.system?.details?.experience?.current ?? 0,

  async cast(actor, spell, { channel = false } = {}) {
    const test = channel ? await actor.setupChannell(spell) : await actor.setupCast(spell);
    if (test?.roll) await test.roll();
    return test;
  },

  /** Zaklęcie ze zwoju nie leży na karcie: system odtworzy je z danych zapisanych w teście. */
  async castScroll(actor, spell, { title } = {}) {
    const test = await actor.setupCast(spell, { appendTitle: ` – ${title}`, [MODULE_ID]: { scroll: true } });
    if (test?.roll) await test.roll();
    return test;
  },

  difficulties: () => Object.entries(config().difficultyLabels ?? {}).map(([key, label]) => ({ key, label: localize(label) })),

  /** Test czytania: wskazana umiejętność, inaczej język księgi, a bez niego Inteligencja. */
  async readingTest(actor, { skill, difficulty, title, language }) {
    const context = { fields: { difficulty }, title, skipTargets: true };
    const skills = actor.itemTypes.skill;
    let test;
    if (skill?.trim()) {
      const named = skills.find((s) => normalize(s.name) === normalize(skill));
      if (!named) {
        ui.notifications.warn(t("Page.NeedsSkill", { skill }));
        return null;
      }
      test = await actor.setupSkill(named, context);
    } else {
      const known = skills.find((s) => hasSpecialised([s.name], LANGUAGE, languageVariants(language)));
      test = known ? await actor.setupSkill(known, context) : await actor.setupCharacteristic("int", context);
    }
    if (!test) return null;
    await test.roll();
    return test;
  },

  outcome: (test) => ({ success: Boolean(test.succeeded), sl: Number(test.result?.SL) || 0, fumble: Boolean(test.result?.fumble) }),

  corruptionKey: (strength) => ({ minor: "CORRUPTION.Minor", moderate: "CORRUPTION.Moderate", major: "CORRUPTION.Major" })[strength],

  corruption: (actor, label) => actor.corruptionDialog(label.toLocaleLowerCase())
};
