/**
 * Ręce zajęte przez księgę.
 *
 * System liczy ręce jako punkty wyposażenia: postać ma ich `system.settings.equipPoints` (domyślnie 2),
 * broń jednoręczna zajmuje 1, dwuręczna 2, a przy ustawieniu świata „limitEquippedWeapons” system nie pozwala
 * dobyć broni ponad limit. Księga trzymana „przy sobie” (założona) zajmuje tyle rąk, ile ustawiono w księdze
 * (domyślnie 2), więc wlicza się do tego samego limitu: z księgą w obu rękach nie dobędziesz broni i odwrotnie.
 */
import { t } from "./constants.mjs";
import { bookKindOf, isGrimoire, readBook } from "./grimoire-data.mjs";
import { getBookKind, isHeldKind } from "./book-kinds.mjs";

/** Ręce zajmowane przez trzymaną księgę (0 dla innych przedmiotów). */
export function bookHands(item) {
  return isGrimoire(item) ? readBook(item).hands : 0;
}

/** Czy przedmiot o danych punktach przekroczy limit rąk postaci. */
export function exceedsHands(used, need, max) {
  return need > 0 && used + need > max;
}

/** Szuka gettera w łańcuchu prototypów (model trappingu dziedziczy `equipPoints` po modelu wyposażenia). */
function findGetter(proto, name) {
  for (let p = proto; p; p = Object.getPrototypeOf(p)) {
    const descriptor = Object.getOwnPropertyDescriptor(p, name);
    if (descriptor?.get) return descriptor.get;
  }
  return null;
}

function limitOn() {
  try {
    return game.settings.get("wfrp4e", "limitEquippedWeapons");
  } catch {
    return false;
  }
}

/** Opis przedmiotów, które już zajmują ręce postaci (do komunikatu). */
function heldItems(actor, except) {
  return actor.items
    .filter((i) => i !== except && i.system?.isEquipped && (i.system?.equipPoints ?? 0) > 0)
    .map((i) => i.name)
    .join(", ");
}

export function registerHands() {
  // Księgi, której się nie trzyma (np. alchemicznej), nie da się założyć: działa z samego ekwipunku
  Hooks.on("preUpdateItem", (item, changes, _options, userId) => {
    if (!foundry.utils.getProperty(changes, "system.equipped.value") || !isGrimoire(item)) return;
    const kind = bookKindOf(item);
    if (isHeldKind(kind)) return;
    if (userId === game.user.id) {
      ui.notifications.info(t("Hands.NotHeld", { name: item.name, kind: game.i18n.localize(getBookKind(kind)?.labelKey ?? "") }));
    }
    return false;
  });

  // Księga wlicza się do punktów wyposażenia jak broń
  const proto = CONFIG.Item.dataModels.trapping?.prototype;
  const original = proto && findGetter(proto, "equipPoints");
  if (original) {
    Object.defineProperty(proto, "equipPoints", {
      configurable: true,
      get() {
        return isGrimoire(this.parent) ? bookHands(this.parent) : original.call(this);
      }
    });
  }

  // Wzięcie księgi albo dobycie broni ponad wolne ręce, gdy system ogranicza wyposażenie
  Hooks.on("preUpdateItem", (item, changes, _options, userId) => {
    if (userId !== game.user.id || !limitOn()) return;
    if (!foundry.utils.getProperty(changes, "system.equipped.value") || item.system?.isEquipped) return;
    const actor = item.actor;
    if (!actor || actor.type === "vehicle" || !actor.system?.settings) return;
    const need = item.system?.equipPoints ?? 0;
    const used = actor.system.equipPointsUsed ?? 0;
    const max = actor.system.settings.equipPoints ?? 2;
    if (!exceedsHands(used, need, max)) return;
    // Sama broń bez księgi to sprawa systemu; tu blokujemy tylko, gdy w grę wchodzi księga
    const bookInvolved = isGrimoire(item) || actor.items.some((i) => isGrimoire(i) && i.system?.isEquipped && bookHands(i) > 0);
    if (!bookInvolved) return;
    ui.notifications.warn(t("Hands.Full", { name: item.name, need, free: Math.max(0, max - used), held: heldItems(actor, item) }));
    return false;
  });
}
