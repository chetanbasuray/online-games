import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PACMAN_ORIGINS, formatPacmanOriginSummary, getPacmanOriginsDisplay } from "../app/pacman/history.js";

describe("Pac-Man page presentation", () => {
  it("keeps the origins copy aligned with the shared site footer", () => {
    const display = getPacmanOriginsDisplay();

    assert.equal(display.heading, "Pac-Man origins");
    assert.equal(display.summary, formatPacmanOriginSummary());
    assert.equal(display.creatorLine, `${PACMAN_ORIGINS.creator} at ${PACMAN_ORIGINS.studio} in ${PACMAN_ORIGINS.releaseYear}`);
    assert.equal(display.officialSite, PACMAN_ORIGINS.officialSite);
    assert.equal(display.linkLabel, "The official Pac-Man site");
  });
});
