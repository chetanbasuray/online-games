import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PACMAN_ORIGINS, formatPacmanOriginSummary } from "../app/pacman/history.js";

describe("Pac-Man origins copy", () => {
  it("includes inventor, studio, and year in the summary", () => {
    const summary = formatPacmanOriginSummary();
    assert(summary.includes(PACMAN_ORIGINS.creator));
    assert(summary.includes(PACMAN_ORIGINS.studio));
    assert(summary.includes(String(PACMAN_ORIGINS.releaseYear)));
  });

  it("links to the official Pac-Man site", () => {
    const url = new URL(PACMAN_ORIGINS.officialSite);
    assert.equal(url.protocol, "https:");
    assert.equal(url.hostname, "www.pacman.com");
  });
});
