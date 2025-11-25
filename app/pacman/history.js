export const PACMAN_ORIGINS = {
  creator: "Toru Iwatani",
  studio: "Namco",
  releaseYear: 1980,
  officialSite: "https://www.pacman.com/",
};

export function formatPacmanOriginSummary() {
  return `${PACMAN_ORIGINS.creator} at ${PACMAN_ORIGINS.studio} crafted Pac-Man in ${PACMAN_ORIGINS.releaseYear}.`;
}

export function getPacmanOriginsDisplay() {
  return {
    heading: "Pac-Man origins",
    summary: formatPacmanOriginSummary(),
    creatorLine: `${PACMAN_ORIGINS.creator} at ${PACMAN_ORIGINS.studio} in ${PACMAN_ORIGINS.releaseYear}`,
    officialSite: PACMAN_ORIGINS.officialSite,
    linkLabel: "The official Pac-Man site",
  };
}
