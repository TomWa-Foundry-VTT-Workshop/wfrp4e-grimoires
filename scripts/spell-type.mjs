/**
 * Typ wpisu "zaklęcie": status, szczegóły i akcje zaklęcia w księdze albo na zwoju.
 */
import { I18N, MODULE_ID, t } from "./constants.mjs";
import { activeSystem, supports, term } from "./systems/index.mjs";
import { FORM_SCROLL } from "./grimoire-data.mjs";
import {
  FLAW_CN_PENALTY, FROM_BOOK_STATUSES, SPELL_TYPE, effectiveCN, flawSpell, sameSpell, spellEntry, spellLores, spellPages, spellSummary
} from "./spell-data.mjs";
import { spellStatus } from "./requirements.mjs";
import { castFromBook, requestMemorize } from "./actors.mjs";
import { castFromScroll } from "./scrolls.mjs";
import { scrollCount } from "./scroll-data.mjs";
import { getSettings } from "./settings.mjs";
import { loreGlyph, loreMarginalia, loreTheme } from "./ui.mjs";

const TextEditorImpl = () => foundry.applications.ux.TextEditor.implementation;

const loreLabel = (lore) => activeSystem().spell.loreLabel(lore);
/** Motyw iluminacji szkoły (adapter przekłada szkoły innych systemów na motywy modułu). */
const loreThemeKey = (lore) => activeSystem().spell.loreTheme(lore ?? "") ?? "";
const loresText = (summary) => summary.lores.map(loreLabel).join(", ");

const STATUS_ICONS = {
  known: "fa-check",
  readOnly: "fa-eye",
  unmemorized: "fa-book-open",
  learnable: "fa-graduation-cap",
  copyable: "fa-pen-nib"
};

function stat(key, value, hint) {
  // Medalion to zawsze klucz "CN"; nazwa zależy od systemu (PM w WFRP, CV w The Old World)
  const label = key === "CN" ? t(`Stat.${activeSystem().spell.cnStat}`) : t(`Stat.${key}`);
  return { key, label, value, hint };
}

/** Akcje "tylko do przeglądania", wspólne dla księgi i zwoju. */
const viewActions = (ctx) => [
  { id: "chat", label: t("Action.Chat"), icon: "fa-comment" },
  ...(ctx.form === FORM_SCROLL ? [] : [{ id: "openSheet", label: t("Action.Open"), icon: "fa-up-right-from-square" }])
];

async function bookDetails(entry, status, ctx) {
  const s = spellSummary(entry.data);
  const owner = ctx.actor?.isOwner;
  // Niezapamiętane zaklęcie z karty rzuca się z księgi – wymaga księgi przy sobie, jak kopia
  const fromBook = FROM_BOOK_STATUSES.includes(status);
  const castable = fromBook && ctx.carried && owner;
  const cn = effectiveCN(s, status);
  const actions = [];
  if (castable) actions.push({ id: "cast", label: t("Action.Cast"), icon: "fa-wand-sparkles", primary: true });
  if (castable && !s.isPetty && s.cn > 0 && supports("channel") && activeSystem().channelAvailable()) {
    actions.push({ id: "channel", label: t("Action.Channel"), icon: "fa-hurricane" });
  }
  // Zapamiętanie: te same warunki co rzucanie (czytanie + Tradycja); koszt PD liczy system
  if (owner && [...FROM_BOOK_STATUSES, "learnable"].includes(status)) actions.push({ id: "learn", label: t("Action.Learn"), icon: "fa-graduation-cap" });
  // Bez zapamiętywania (The Old World): przepisanie zaklęcia na kartę za zgodą MG
  if (owner && status === "copyable") actions.push({ id: "learn", label: t("Action.LearnCopy"), icon: "fa-pen-nib", glyph: "ui-act_memorise", primary: true });
  actions.push(...viewActions(ctx));
  return {
    img: s.img,
    subtitle: loresText(s),
    stats: [
      // Przy rzucaniu z księgi pokazujemy też PM po zapamiętaniu (system podwaja PM niezapamiętanych)
      stat("CN", cn, cn !== s.cn ? t("Stat.CNMemorized", { cn: s.cn }) : null),
      stat("Range", s.range), stat("Target", s.target), stat("Duration", s.duration)
    ],
    description: await TextEditorImpl().enrichHTML(s.description, { relativeTo: ctx.item, secrets: ctx.isGM }),
    note: fromBook && !ctx.carried && ctx.actor ? t("Note.notCarried") : term(`Note.${status}`, { lore: loresText(s) }),
    actions
  };
}

async function scrollDetails(entry, ctx) {
  const s = spellSummary(entry.data);
  const castsHere = supports("scrollCast");
  const canCast = castsHere && ctx.actor?.isOwner && ctx.reading.readable && scrollCount(ctx.item) > 0;
  const consumeNote = !castsHere ? t("Scroll.NoteNoCast")
    : getSettings().consumeOnFailure ? t("Scroll.NoteConsume") : t("Scroll.NoteConsumeOnSuccess");
  return {
    img: s.img,
    subtitle: loresText(s),
    stats: [stat("CN", s.cn), stat("Range", s.range), stat("Target", s.target), stat("Duration", s.duration)],
    description: await TextEditorImpl().enrichHTML(s.description, { relativeTo: ctx.item, secrets: ctx.isGM }),
    note: !castsHere ? consumeNote : !ctx.actor ? t("Scroll.NoteNoActor") : !ctx.reading.readable ? t("Scroll.CannotRead") : consumeNote,
    actions: [
      ...(canCast ? [{ id: "castScroll", label: t("Scroll.Cast"), icon: "fa-wand-sparkles", primary: true }] : []),
      ...viewActions(ctx)
    ]
  };
}

async function postToChat(entry, ctx) {
  const s = spellSummary(entry.data);
  const content = await foundry.applications.handlebars.renderTemplate(`modules/${MODULE_ID}/templates/chat-spell.hbs`, {
    ...s,
    lore: loresText(s),
    cnLabel: t(`Stat.${activeSystem().spell.cnStat}`),
    cnShort: t(activeSystem().spell.cnShort),
    theme: loreTheme(loreThemeKey(s.lores[0])),
    glyph: loreGlyph(loreThemeKey(s.lores[0])),
    marginalia: loreMarginalia(loreThemeKey(s.lores[0])),
    description: await TextEditorImpl().enrichHTML(s.description),
    book: ctx.item.name
  });
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: ctx.actor }), content });
}

async function openSheet(entry) {
  const source = entry.sourceUuid ? await fromUuid(entry.sourceUuid).catch(() => null) : null;
  if (source?.sheet) return source.sheet.render(true);
  const temp = new Item.implementation(foundry.utils.deepClone(entry.data));
  return temp.sheet.render(true, { editable: false });
}

export const spellType = {
  id: SPELL_TYPE,
  order: 10,
  labelKey: `${I18N}.Types.spell`,

  async fromDrop(data) {
    if (data?.type !== "Item") return null;
    const item = await Item.implementation.fromDropData(data);
    if (item?.type !== "spell") return null;
    return spellEntry(item.toObject(), { id: foundry.utils.randomID(), sourceUuid: item.uuid });
  },

  same: sameSpell,
  name: (entry) => entry.data.name,

  pages: (entry) => spellPages(spellSummary(entry.data)),
  wholeBook: (entry) => spellSummary(entry.data).isRitual,
  applyFlaw: flawSpell,
  flawNote: () => term("Page.FlawSpell", { penalty: FLAW_CN_PENALTY }),

  /** Motyw strony: szkoła zaklęcia przełożona przez adapter systemu. */
  theme: (entry) => loreThemeKey(spellLores(entry.data)[0]),

  group(entry) {
    const lore = spellLores(entry.data)[0] ?? "";
    return { key: lore, label: lore ? loreLabel(lore) : "", rank: lore === "petty" ? 0 : 1 };
  },

  status(entry, ctx) {
    if (!ctx.view) return "none";
    if (ctx.form === FORM_SCROLL) {
      if (!ctx.reading.readable) return "unreadable";
      return supports("scrollCast") ? "castable" : "readOnly";
    }
    const status = spellStatus(ctx.view, spellSummary(entry.data), ctx.reading, ctx.book.requirements, loreLabel);
    // Bez rzucania z księgi to, co dałoby się rzucić, można tylko przepisać na kartę
    if (!supports("castFromBook") && (status === "castable" || status === "learnable")) return "copyable";
    return status;
  },

  statusLabel: (status) => t(`Status.${status}`),
  statusIcon: (status) => STATUS_ICONS[status] ?? "",

  corner(entry, status) {
    const cn = effectiveCN(spellSummary(entry.data), status);
    return cn ? `${t(activeSystem().spell.cnShort)} ${cn}` : "";
  },

  details: (entry, status, ctx) => (ctx.form === FORM_SCROLL ? scrollDetails(entry, ctx) : bookDetails(entry, status, ctx)),

  async run(action, entry, ctx) {
    if (action === "cast") return castFromBook(ctx.item, entry);
    if (action === "channel") return castFromBook(ctx.item, entry, { channel: true });
    if (action === "learn") return requestMemorize(ctx.item, entry);
    if (action === "castScroll") return castFromScroll(ctx.item);
    if (action === "chat") return postToChat(entry, ctx);
    if (action === "openSheet") return openSheet(entry);
  }
};
