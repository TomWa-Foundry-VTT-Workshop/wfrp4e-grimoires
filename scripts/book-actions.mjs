/**
 * Czynności na stronach księgi niezależne od rodzaju wpisu: odszyfrowywanie, czytanie stron
 * zakazanych i przepisywanie do innej księgi.
 */
import { t } from "./constants.mjs";
import { FORM_BOOK, addEntry, isGrimoire, readBook, writeBook } from "./grimoire-data.mjs";
import { acceptsType } from "./book-kinds.mjs";
import { CIPHERED, WARDED, applyDecode, copyOutcome, decodeNeeded, fits, markKnown, markRead } from "./book-rules.mjs";
import { entryPages, entryWholeBook, typeOf } from "./entry-types.mjs";
import { activeSystem, term } from "./systems/index.mjs";

const { DialogV2 } = foundry.applications.api;

const COPY_DIFFICULTY = "challenging";

/** Siła Zepsucia: nazwa z systemu, a gdy system jej nie ma – z tłumaczeń modułu. */
export function corruptionLabel(strength) {
  const key = activeSystem().corruptionKey(strength);
  return key && game.i18n.has(key) ? game.i18n.localize(key) : t(`Corruption.${strength}`);
}

const costProviders = [];

/**
 * Dokłada koszt przepisywania (np. atrament z alchemii).
 * @param {(args: {entry: object, pages: number, actor: Actor, item: Item}) =>
 *   ({label: string, available: boolean, consume: () => Promise<void>}|null)} provider
 */
export function registerCopyCost(provider) {
  costProviders.push(provider);
}

/** Test czytania w systemie postaci (wykonany) albo null, gdy anulowano. */
function rollReadingTest(ctx, { skill, difficulty, title }) {
  return activeSystem().readingTest(ctx.actor, { skill, difficulty, title, language: ctx.book.language });
}

const outcomeOf = (test) => activeSystem().outcome(test);

async function decipher(item, entry, ctx) {
  const { cipher } = ctx.book;
  const test = await rollReadingTest(ctx, { skill: cipher.skill, difficulty: cipher.difficulty, title: t("Page.DecipherTitle", { book: item.name }) });
  if (!test) return;
  const needed = decodeNeeded(ctx.book, entryPages(entry));
  const { book, progress, lost, done } = applyDecode(readBook(item), ctx.actor.id, entry.id, outcomeOf(test), needed);
  await item.update(writeBook(book));
  if (done) ui.notifications.info(t("Page.Deciphered", { name: typeOf(entry).name(entry) }));
  else if (lost) ui.notifications.warn(t("Page.DecipherLost"));
  else ui.notifications.info(term("Page.DecipherProgress", { progress, needed }));
}

async function readForbidden(item, entry, ctx) {
  const strength = corruptionLabel(ctx.book.forbidden);
  // MG dostaje ostrzeżenie; gracz tylko potwierdza rozpoczęcie lektury
  const confirmed = await DialogV2.confirm({
    window: { title: ctx.isGM ? t("Page.ReadForbidden") : t("Page.ReadUnread") },
    content: `<p>${ctx.isGM ? t("Page.ForbiddenConfirm", { strength: strength.toLocaleLowerCase() }) : t("Page.UnreadConfirm")}</p>`
  });
  if (!confirmed) return;
  // System bez testu Zepsucia (The Old World): strona zostaje przeczytana, skutki ustala MG
  if (!supportsCorruption()) {
    await item.update(writeBook(markRead(readBook(item), ctx.actor.id, entry.id)));
    return ui.notifications.info(t("Page.ReadNoTest"));
  }
  const test = await activeSystem().corruption(ctx.actor, strength);
  if (test) await item.update(writeBook(markRead(readBook(item), ctx.actor.id, entry.id)));
}

/** Księgi postaci, do których można przepisać wpis. */
function copyTargets(item, entry, ctx) {
  const type = typeOf(entry);
  return ctx.actor.items.filter((other) => {
    if (other.id === item.id || !isGrimoire(other)) return false;
    const book = readBook(other);
    return acceptsType(book.kind, type.id) && fits(book, entry, entryPages, entryWholeBook) && addEntry(book, entry, type.same).added;
  });
}

async function copyEntry(item, entry, ctx) {
  const type = typeOf(entry);
  const targets = copyTargets(item, entry, ctx);
  if (!targets.length) return ui.notifications.warn(t("Page.NoTarget"));
  const costs = costProviders.map((provider) => provider({ entry, pages: entryPages(entry), actor: ctx.actor, item })).filter(Boolean);
  const missing = costs.find((cost) => !cost.available);
  if (missing) return ui.notifications.warn(t("Page.NoMaterials", { cost: missing.label }));

  const escape = foundry.utils.escapeHTML;
  const options = targets.map((b) => `<option value="${b.id}">${escape(b.name)}</option>`).join("");
  const costLine = costs.length ? `<p>${t("Page.CopyCost", { cost: costs.map((c) => escape(c.label)).join(", ") })}</p>` : "";
  const targetId = await DialogV2.prompt({
    window: { title: t("Page.Copy") },
    content: `<div class="form-group"><label>${t("Page.CopyTarget")}</label><select name="target">${options}</select></div>${costLine}`,
    ok: { label: t("Page.Copy"), callback: (_event, button) => button.form.elements.target.value },
    rejectClose: false
  });
  const target = targetId ? ctx.actor.items.get(targetId) : null;
  if (!target) return;

  const test = await rollReadingTest(ctx, { difficulty: COPY_DIFFICULTY, title: t("Page.CopyTitle", { book: target.name }) });
  if (!test) return;
  for (const cost of costs) await cost.consume();

  const name = type.name(entry);
  const outcome = copyOutcome(outcomeOf(test));
  if (outcome === "ruined") return ui.notifications.warn(t("Page.CopyRuined", { name }));

  const fresh = { ...foundry.utils.deepClone(entry), id: foundry.utils.randomID(), flawed: Boolean(entry.flawed) || outcome === "flawed" };
  const copy = outcome === "flawed" && !entry.flawed && type.applyFlaw ? type.applyFlaw(fresh) : fresh;
  const { book } = addEntry(readBook(target), copy, type.same);
  await target.update(writeBook(markKnown(book, ctx.actor.id, copy, entryPages)));
  ui.notifications.info(t(copy.flawed ? "Page.CopiedFlawed" : "Page.Copied", { name, book: target.name }));
}

const supportsCorruption = () => Boolean(activeSystem().features.corruption);

const PAGE_ACTIONS = { decipher, readForbidden, copyEntry };

/** Wykonuje czynność na stronie albo akcję należącą do typu wpisu. */
export function runEntryAction(actionId, item, entry, ctx) {
  const action = PAGE_ACTIONS[actionId];
  return action ? action(item, entry, ctx) : typeOf(entry).run(actionId, entry, ctx);
}

/** Przyciski strony zamkniętej. */
export function lockedActions(state, ctx) {
  if (!ctx.actor?.isOwner) return [];
  if (state === CIPHERED) return [{ id: "decipher", label: t("Page.Decipher"), icon: "fa-key", primary: true }];
  // Gracz widzi zwykłe „Przeczytaj stronę”: o Zepsuciu dowie się dopiero z testu
  if (state === WARDED) {
    return [ctx.isGM
      ? { id: "readForbidden", label: t("Page.ReadForbidden"), icon: "fa-skull", primary: true }
      : { id: "readForbidden", label: t("Page.ReadUnread"), icon: "fa-book-open", glyph: "ui-status_read_only", primary: true }];
  }
  return [];
}

/** Przycisk przepisywania, gdy postać ma dokąd przepisać. */
export function copyAction(item, entry, status, ctx) {
  const type = typeOf(entry);
  if (!ctx.actor?.isOwner || ctx.form !== FORM_BOOK || type.id === "") return null;
  if (type.canCopy && !type.canCopy(entry, status, ctx)) return null;
  if (!ctx.actor.items.some((other) => other.id !== item.id && isGrimoire(other))) return null;
  return { id: "copyEntry", label: t("Page.Copy"), icon: "fa-pen-nib" };
}
