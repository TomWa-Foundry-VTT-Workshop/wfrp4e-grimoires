import { describe, expect, it } from "vitest";
import { acceptsType, getBookKind, isHeldKind, registerBookKind } from "../scripts/book-kinds.mjs";
import { bookKindOf, emptyBook, readBook } from "../scripts/grimoire-data.mjs";

registerBookKind({
  id: "test-alchemy", labelKey: "X.Label", accepts: ["recipe"], held: false,
  defaults: { cover: "#2f5d50", slots: 12, requirements: { language: false } }
});

const flagged = (grimoire) => ({ flags: { "wfrp4e-grimoires": { grimoire } } });

describe("rodzaje ksiąg", () => {
  it("rejestr i przyjmowane typy wpisów", () => {
    expect(getBookKind("test-alchemy").accepts).toEqual(["recipe"]);
    expect(getBookKind("brak")).toBeNull();
    expect(acceptsType("test-alchemy", "recipe")).toBe(true);
    expect(acceptsType("test-alchemy", "spell")).toBe(false);
    // Księga zaklęć i rodzaj wyłączonego modułu przyjmują wszystko
    expect(acceptsType(null, "spell")).toBe(true);
    expect(acceptsType("brak", "spell")).toBe(true);
    expect(() => registerBookKind({ id: "zła nazwa" })).toThrow();
  });

  it("nowa księga rodzaju dostaje jego ustawienia", () => {
    const book = emptyBook("book", "test-alchemy");
    expect(book).toMatchObject({ kind: "test-alchemy", cover: "#2f5d50", slots: 12, hands: 0 });
    expect(book.requirements).toMatchObject({ language: false, carried: false, readWrite: true });
    expect(emptyBook("scroll", "test-alchemy").kind).toBeNull();
    expect(emptyBook().kind).toBeNull();
  });

  it("księgi, której się nie trzyma, nie wymaga się przy sobie i nie zajmuje rąk", () => {
    expect(isHeldKind("test-alchemy")).toBe(false);
    expect(isHeldKind(null)).toBe(true);
    const book = readBook(flagged({ kind: "test-alchemy", hands: 2, requirements: { carried: true } }));
    expect(book).toMatchObject({ kind: "test-alchemy", hands: 0 });
    expect(book.requirements.carried).toBe(false);
    expect(bookKindOf(flagged({ kind: "test-alchemy" }))).toBe("test-alchemy");
    expect(bookKindOf(flagged({ form: "scroll", kind: "test-alchemy" }))).toBeNull();
  });
});
