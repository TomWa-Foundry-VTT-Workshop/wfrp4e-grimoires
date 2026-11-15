import { describe, expect, it } from "vitest";
import { DEFAULT_HANDS, emptyBook, readBook, readHands } from "../scripts/grimoire-data.mjs";
import { exceedsHands } from "../scripts/hands.mjs";

const flagged = (grimoire) => ({ flags: { "wfrp4e-grimoires": { grimoire } } });

describe("ręce zajęte przez księgę", () => {
  it("księga magii domyślnie w obu rękach, zwój bez rąk", () => {
    expect(DEFAULT_HANDS).toBe(2);
    expect(emptyBook().hands).toBe(2);
    expect(emptyBook("scroll").hands).toBe(0);
    expect(readBook(flagged({ entries: [] })).hands).toBe(2);
    expect(readBook(flagged({ entries: [], hands: 1 })).hands).toBe(1);
    expect(readBook(flagged({ entries: [], hands: 0 })).hands).toBe(0);
    expect(readBook(flagged({ form: "scroll", entries: [], hands: 2 })).hands).toBe(0);
  });

  it("błędne wartości wracają do 2", () => {
    expect(readHands(3)).toBe(2);
    expect(readHands(null)).toBe(2);
    expect(readHands("")).toBe(2);
    expect(readHands("1")).toBe(1);
  });

  it("limit rąk postaci", () => {
    expect(exceedsHands(0, 2, 2)).toBe(false);
    expect(exceedsHands(1, 2, 2)).toBe(true);
    expect(exceedsHands(2, 1, 2)).toBe(true);
    expect(exceedsHands(2, 0, 2)).toBe(false);
  });
});
