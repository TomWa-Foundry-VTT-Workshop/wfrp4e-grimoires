import { describe, expect, it } from "vitest";
import { isLightCover, loreGlyph, loreMarginalia, loreTheme } from "../scripts/ui.mjs";

describe("wygląd iluminowany", () => {
  it("motyw, sigil i marginalia szkoły", () => {
    expect(loreTheme("fire")).toBe("fire");
    expect(loreTheme("nieznana")).toBe("arcane");
    expect(loreGlyph("death")).toBe("lore-death");
    expect(loreGlyph("x", "recipe")).toBe("lore-recipe");
    expect(loreMarginalia("tzeentch")).toBe("marg-chaos");
    expect(loreMarginalia("life")).toBe("marg-life");
  });

  it("jasna okładka dostaje ciemny napis", () => {
    expect(isLightCover("#f0e8d0")).toBe(true);
    expect(isLightCover("#6b2d1f")).toBe(false);
    expect(isLightCover("zły")).toBe(false);
  });
});
