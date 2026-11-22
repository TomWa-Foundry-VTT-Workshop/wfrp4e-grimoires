/**
 * Integracja z kartą postaci i arkuszem przedmiotu:
 *  - osobny dział "Księgi zaklęć" w ekwipunku: w WFRP przez hook systemu wfrp4e:constructInventory,
 *    w innych systemach (The Old World) działy dokładane do listy wyposażenia po renderze karty,
 *  - ikona otwarcia księgi w wierszu, "+" tworzący nową księgę,
 *  - znacznik kopii zaklęć z księgi w zakładce Magia,
 *  - przycisk w nagłówku arkusza książki: "Otwórz księgę" / "Uczyń księgą zaklęć",
 *  - pozycja "Księga zaklęć" w oknie tworzenia przedmiotu.
 */
import { MODULE_ID, t } from "./constants.mjs";
import { FLAG_SCOPE, GRIMOIRE_FLAG, bookKindOf, emptyBook, isGrimoire, isScroll } from "./grimoire-data.mjs";
import { getBookKind, listBookKinds } from "./book-kinds.mjs";
import { isCopy } from "./actors.mjs";
import { GrimoireApp } from "./grimoire-app.mjs";
import { ScrollApp } from "./scroll-app.mjs";
import { createScroll, makeScroll } from "./scrolls.mjs";
import { activeSystem } from "./systems/index.mjs";

const SECTION = "grimoires";
const SCROLL_SECTION = "scrolls";

/** Znacznik z okna tworzenia przedmiotu; przed zapisem zamieniany na dane księgi. */
const CREATE_MARKER = "newGrimoire";
const OPEN_AFTER_CREATE = `${MODULE_ID}.openBook`;

/** Wygląd i dane systemu nowej księgi (bez nazwy i danych księgi). */
const bookBase = (kind = null) => ({
  img: kind?.img ?? "icons/sundries/books/book-embossed-gold-red.webp",
  ...activeSystem().book.data()
});

/** Dział ekwipunku dla rodzaju księgi. */
const kindSection = (kind) => `grimoires-${kind.id}`;

/** Nazwa nowej księgi danego rodzaju. */
const newBookName = (kind) => (kind ? game.i18n.localize(kind.newNameKey ?? kind.labelKey) : t("NewGrimoire"));

/** Rodzaj księgi zarejestrowany przez włączony moduł (bez niego księga zostaje w zwykłym dziale ksiąg). */
const registeredKind = (item) => getBookKind(bookKindOf(item));

/**
 * Tworzy nową księgę na aktorze i otwiera ją.
 * @param {string|null} [kindId]  rodzaj księgi (book-kinds.mjs), domyślnie księga zaklęć
 */
export async function createGrimoire(actor, kindId = null) {
  const kind = getBookKind(kindId);
  const [book] = await actor.createEmbeddedDocuments("Item", [{
    type: "trapping",
    name: newBookName(kind),
    ...bookBase(kind),
    flags: { [FLAG_SCOPE]: { [GRIMOIRE_FLAG]: emptyBook(undefined, kind?.id) } }
  }]);
  if (book) GrimoireApp.open(book);
  return book;
}

/**
 * Dokłada księgę do listy typów w oknie tworzenia przedmiotu. Księga jest zwykłym przedmiotem "trapping",
 * więc pozycja niesie ten typ, a ukryte pole przekazuje znacznik do preCreateItem.
 */
function addToCreateDialog(element) {
  const select = element.querySelector('select[name="type"]');
  if (!select?.querySelector('option[value="trapping"]') || !select.querySelector('option[value="spell"]')) return;

  if (select.querySelector("option[data-grimoire]")) return;

  // Księga zaklęć i każdy zarejestrowany rodzaj księgi; znacznik niesie rodzaj ("true" = księga zaklęć)
  const choices = [
    { label: t("CreateType"), value: "true" },
    ...listBookKinds().map((kind) => ({ label: game.i18n.localize(kind.labelKey), value: kind.id }))
  ];
  for (const choice of choices) {
    const option = new Option(choice.label, "trapping");
    option.dataset.grimoire = choice.value;
    select.insertBefore(option, [...select.options].find((o) => o.label.localeCompare(choice.label, game.i18n.lang) > 0) ?? null);
  }

  const marker = document.createElement("input");
  Object.assign(marker, { type: "hidden", name: `flags.${FLAG_SCOPE}.${CREATE_MARKER}`, value: "true", disabled: true });
  select.after(marker);

  select.addEventListener("change", () => {
    const chosen = select.selectedOptions[0]?.dataset.grimoire;
    marker.disabled = !chosen;
    if (!chosen) return;
    marker.value = chosen;
    element.querySelector('[name="name"]').placeholder = newBookName(getBookKind(chosen));
    const hint = select.closest(".form-group").querySelector(".hint");
    if (hint) hint.textContent = t("CreateHint");
  });
}

/**
 * System traktuje założone przedmioty jak noszone i zmniejsza ich obciążenie o 1.
 * Księga "przy sobie" nadal waży tyle samo.
 */
function keepBookWeight() {
  const proto = CONFIG.Item.dataModels.trapping?.prototype;
  const original = proto && Object.getOwnPropertyDescriptor(proto, "weighsLessEquipped");
  if (!original?.get) return;
  Object.defineProperty(proto, "weighsLessEquipped", {
    configurable: true,
    get() {
      return !isGrimoire(this.parent) && original.get.call(this);
    }
  });
}

function registerCreateDialog() {
  Hooks.on("renderDialogV2", (_app, element) => addToCreateDialog(element));

  Hooks.on("preCreateItem", (item, _data, options) => {
    const marker = item.flags[FLAG_SCOPE]?.[CREATE_MARKER];
    if (!marker) return;
    const kind = getBookKind(String(marker));
    const unnamed = item.name === item.constructor.defaultName({ type: "trapping", parent: item.parent, pack: item.pack });
    item.updateSource({
      ...bookBase(kind),
      ...(unnamed ? { name: newBookName(kind) } : {}),
      flags: { [FLAG_SCOPE]: { [GRIMOIRE_FLAG]: emptyBook(undefined, kind?.id), [`-=${CREATE_MARKER}`]: null } }
    });
    options[OPEN_AFTER_CREATE] = true;
  });

  Hooks.on("createItem", (item, options, userId) => {
    if (options[OPEN_AFTER_CREATE] && userId === game.user.id) GrimoireApp.open(item);
  });
}

/** Zamienia zwykłą książkę (trapping) w księgę zaklęć. */
export async function makeGrimoire(item) {
  await item.update({
    ...activeSystem().book.make(),
    [`flags.${FLAG_SCOPE}.${GRIMOIRE_FLAG}`]: emptyBook()
  });
  GrimoireApp.open(item);
}

export function registerInventory() {
  registerCreateDialog();
  keepBookWeight();

  // Dział w ekwipunku: księgi wyjęte z "Książek i dokumentów"
  if (activeSystem().inventory === "hook") {
    Hooks.on("wfrp4e:constructInventory", (_sheet, categories, collapsed) => {
      const books = categories.booksAndDocuments?.items ?? [];
      if (categories.booksAndDocuments) categories.booksAndDocuments.items = books.filter((i) => !isGrimoire(i) && !isScroll(i));
      for (const section of bookSections()) {
        categories[section.key] = {
          label: section.label,
          items: books.filter(section.holds),
          ...(section.carried ? { toggle: true, toggleName: t("Inventory.Carried") } : {}),
          show: false,
          collapsed: collapsed?.[section.key],
          dataType: "trapping"
        };
      }
    });
  }

  // Ikony w wierszach i obsługa "+" (render hook wszystkich arkuszy aktorów ApplicationV2)
  Hooks.on("renderActorSheetV2", (app, element) => decorateActorSheet(app, element));

  // Przycisk w nagłówku arkusza przedmiotu
  Hooks.on("getHeaderControlsDocumentSheetV2", (app, controls) => {
    const item = app.document;
    if (!(item instanceof Item) || item.type !== "trapping" || !item.isOwner) return;
    const grimoireAction = `${MODULE_ID}-grimoire`;
    const scrollAction = `${MODULE_ID}-scroll`;
    app.options.actions[grimoireAction] ??= () => (isGrimoire(item) ? GrimoireApp.open(item) : makeGrimoire(item));
    app.options.actions[scrollAction] ??= async () => {
      if (!isScroll(item)) await makeScroll(item);
      ScrollApp.open(item);
    };
    if (isScroll(item)) {
      controls.unshift({ action: scrollAction, icon: "fa-solid fa-scroll", label: t("Header.OpenScroll") });
    } else if (isGrimoire(item)) {
      controls.unshift({ action: grimoireAction, icon: "fa-solid fa-book-journal-whills", label: t("Header.Open") });
    } else {
      controls.unshift(
        { action: scrollAction, icon: "fa-solid fa-scroll", label: t("Header.MakeScroll") },
        { action: grimoireAction, icon: "fa-solid fa-book-journal-whills", label: t("Header.Make") }
      );
    }
  });
}

/**
 * Działy ksiąg w kolejności z karty WFRP: rodzaje ksiąg z innych modułów, księgi zaklęć, zwoje.
 * `carried` – dział ma przełącznik „przy sobie” (księgi, których się nie trzyma, go nie mają).
 */
function bookSections() {
  return [
    ...listBookKinds().map((kind) => ({
      key: kindSection(kind),
      label: game.i18n.localize(kind.sectionKey ?? kind.labelKey),
      holds: (i) => isGrimoire(i) && registeredKind(i) === kind,
      carried: kind.held !== false
    })),
    { key: SECTION, label: t("Inventory.Section"), holds: (i) => isGrimoire(i) && !registeredKind(i), carried: true },
    { key: SCROLL_SECTION, label: t("Inventory.ScrollSection"), holds: isScroll, carried: false }
  ];
}

/**
 * Działy ksiąg na karcie bez hooka ekwipunku (The Old World): kopia nagłówka listy wyposażenia
 * (trapping) dla każdego działu i przeniesione do niej wiersze ksiąg i zwojów. Wiersze zostają
 * wierszami systemu, więc menu, opis i przełącznik „założone” działają jak wcześniej.
 */
function buildSheetSections(element) {
  const add = element.querySelector('.sheet-list .list-header [data-action="createItem"][data-type="trapping"]');
  const source = add?.closest(".sheet-list");
  if (!source || source.dataset.grSections) return;
  source.dataset.grSections = "1";
  const rows = [...source.querySelectorAll(".list-content > .list-row[data-uuid]")];
  let anchor = source;
  for (const section of bookSections()) {
    const list = source.cloneNode(true);
    delete list.dataset.grSections;
    list.classList.add("inventory", section.key, `${MODULE_ID}-section`);
    const header = list.querySelector(".list-header");
    const name = header?.querySelector(".list-name");
    if (name) name.textContent = section.label;
    // Kolumna „Założone” to dla ksiąg „Przy sobie”; zwoje jej nie mają
    const column = [...(header?.children ?? [])].find((el) => !el.matches(".list-name, .list-controls"));
    if (column) {
      if (section.carried) column.textContent = t("Inventory.Carried");
      else column.remove();
    }
    const content = list.querySelector(".list-content");
    content?.replaceChildren(...rows.filter((row) => section.holds(fromUuidSync(row.dataset.uuid))));
    anchor.after(list);
    anchor = list;
  }
}

function decorateActorSheet(app, element) {
  const actor = app.document;
  if (!actor || !element) return;
  if (activeSystem().inventory === "dom") buildSheetSections(element);

  decorateSection(element, SECTION, "fa-book-open", t("Inventory.Open"), (item) => GrimoireApp.open(item), () => createGrimoire(actor));
  for (const kind of listBookKinds()) {
    decorateSection(element, kindSection(kind), kind.icon ?? "fa-book-open", t("Inventory.Open"), (item) => GrimoireApp.open(item), () => createGrimoire(actor, kind.id));
  }
  decorateSection(element, SCROLL_SECTION, "fa-scroll", t("Inventory.OpenScroll"), (item) => ScrollApp.open(item), async () => {
    const scroll = await createScroll(actor);
    if (scroll) ScrollApp.open(scroll);
  });

  // Znacznik kopii zaklęć z księgi
  for (const row of element.querySelectorAll(".list-row[data-uuid]")) {
    if (row.querySelector(`.${MODULE_ID}-copy`)) continue;
    const item = fromUuidSync(row.dataset.uuid);
    if (!isCopy(item)) continue;
    const label = row.querySelector(".list-name .label, .list-name a, .list-name");
    const icon = document.createElement("i");
    icon.className = `fa-solid fa-book-journal-whills ${MODULE_ID}-copy`;
    icon.dataset.tooltip = t("Inventory.CopyTooltip");
    label?.append(" ", icon);
  }
}

/** Ikona otwarcia w wierszach działu, obrazek otwiera okno, "+" tworzy nowy przedmiot. */
function decorateSection(element, section, icon, tooltip, open, create) {
  for (const row of element.querySelectorAll(`.sheet-list.inventory.${section} .list-row[data-uuid]`)) {
    if (row.querySelector(`.${MODULE_ID}-open`)) continue;
    const controls = row.querySelector(".list-controls");
    const button = document.createElement("a");
    button.className = `list-control ${MODULE_ID}-open`;
    button.dataset.tooltip = tooltip;
    button.innerHTML = `<i class="fa-solid ${icon}"></i>`;
    button.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const item = fromUuidSync(row.dataset.uuid);
      if (item) open(item);
    });
    (controls ?? row.querySelector(".row-content"))?.prepend(button);

    const img = row.querySelector("img[data-action='useItem']");
    if (img) {
      img.removeAttribute("data-action");
      img.addEventListener("click", () => {
        const item = fromUuidSync(row.dataset.uuid);
        if (item) open(item);
      });
    }
  }

  const add = element.querySelector(`.sheet-list.inventory.${section} [data-action='createItem']`);
  if (add) {
    add.removeAttribute("data-action");
    add.addEventListener("click", (ev) => {
      ev.preventDefault();
      create();
    });
  }
}
