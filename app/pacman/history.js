export const PACMAN_ORIGINS = {
  creator: "Toru Iwatani",
  studio: "Namco",
  releaseYear: 1980,
  officialSite: "https://www.pacman.com/",
};

export function formatPacmanOriginSummary() {
  return `${PACMAN_ORIGINS.creator} at ${PACMAN_ORIGINS.studio} crafted Pac-Man in ${PACMAN_ORIGINS.releaseYear}.`;
}
