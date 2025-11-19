import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import PieceSprite, { PIECE_LABELS } from "../app/chess/PieceSprite.js";

test("PieceSprite renders svg output for each piece", () => {
  for (const piece of Object.keys(PIECE_LABELS)) {
    const whiteMarkup = renderToStaticMarkup(createElement(PieceSprite, { piece: piece.toUpperCase() }));
    const blackMarkup = renderToStaticMarkup(createElement(PieceSprite, { piece }));
    assert.ok(whiteMarkup.includes("<svg"), `expected svg for ${piece} white`);
    assert.ok(blackMarkup.includes("<svg"), `expected svg for ${piece} black`);
  }
});

test("PieceSprite uses a consistent view box", () => {
  const markup = renderToStaticMarkup(createElement(PieceSprite, { piece: "K" }));
  assert.ok(markup.includes('viewBox="0 0 64 64"'));
  assert.ok(markup.includes('class="h-full w-full"'));
});

test("PieceSprite gracefully handles unknown pieces", () => {
  const markup = renderToStaticMarkup(createElement(PieceSprite, { piece: "x" }));
  assert.strictEqual(markup, "");
});
