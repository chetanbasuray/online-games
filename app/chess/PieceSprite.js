import { createElement } from "react";

const WHITE_PALETTE = {
  primary: "#ffffff",
  secondary: "#f8fafc",
  accent: "#e2e8f0",
  shadow: "#cbd5f5",
  stroke: "#0f172a",
};

const BLACK_PALETTE = {
  primary: "#1f2937",
  secondary: "#111827",
  accent: "#374151",
  shadow: "#0f172a",
  stroke: "#0f172a",
};

export const PIECE_LABELS = {
  p: "pawn",
  r: "rook",
  n: "knight",
  b: "bishop",
  q: "queen",
  k: "king",
};

const withSvg = (elements) =>
  createElement(
    "svg",
    {
      viewBox: "0 0 64 64",
      role: "img",
      "aria-hidden": "true",
      focusable: "false",
      className: "h-full w-full",
    },
    ...(Array.isArray(elements) ? elements : [elements])
  );

const SPRITES = {
  p: (palette) =>
    withSvg([
      createElement("circle", {
        key: "head",
        cx: 32,
        cy: 18,
        r: 11,
        fill: palette.primary,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
      createElement("rect", {
        key: "torso",
        x: 22,
        y: 30,
        width: 20,
        height: 12,
        rx: 6,
        fill: palette.secondary,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
      createElement("rect", {
        key: "waist",
        x: 16,
        y: 44,
        width: 32,
        height: 10,
        rx: 4,
        fill: palette.primary,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
      createElement("rect", {
        key: "base",
        x: 12,
        y: 52,
        width: 40,
        height: 6,
        rx: 3,
        fill: palette.shadow,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
    ]),
  r: (palette) =>
    withSvg([
      createElement("rect", {
        key: "base",
        x: 12,
        y: 50,
        width: 40,
        height: 6,
        rx: 3,
        fill: palette.shadow,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
      createElement("rect", {
        key: "foot",
        x: 18,
        y: 44,
        width: 28,
        height: 8,
        rx: 2,
        fill: palette.primary,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
      createElement("rect", {
        key: "body",
        x: 18,
        y: 20,
        width: 28,
        height: 24,
        rx: 4,
        fill: palette.secondary,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
      createElement("rect", {
        key: "top",
        x: 16,
        y: 12,
        width: 32,
        height: 8,
        fill: palette.primary,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
      createElement("rect", {
        key: "left",
        x: 14,
        y: 8,
        width: 8,
        height: 6,
        fill: palette.primary,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
      createElement("rect", {
        key: "mid",
        x: 28,
        y: 8,
        width: 8,
        height: 6,
        fill: palette.primary,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
      createElement("rect", {
        key: "right",
        x: 42,
        y: 8,
        width: 8,
        height: 6,
        fill: palette.primary,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
    ]),
  n: (palette) =>
    withSvg([
      createElement("path", {
        key: "body",
        d: "M16 50c10 0 16-6 16-14V20l16 12v12",
        fill: palette.primary,
        stroke: palette.stroke,
        strokeWidth: 4,
        strokeLinejoin: "round",
        strokeLinecap: "round",
      }),
      createElement("path", {
        key: "mane",
        d: "M32 22l-8-8-10 10",
        fill: "none",
        stroke: palette.stroke,
        strokeWidth: 4,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      createElement("circle", {
        key: "eye",
        cx: 40,
        cy: 18,
        r: 4,
        fill: palette.accent,
        stroke: palette.stroke,
        strokeWidth: 3,
      }),
      createElement("rect", {
        key: "base",
        x: 12,
        y: 50,
        width: 40,
        height: 6,
        rx: 3,
        fill: palette.shadow,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
    ]),
  b: (palette) =>
    withSvg([
      createElement("ellipse", {
        key: "body",
        cx: 32,
        cy: 24,
        rx: 12,
        ry: 16,
        fill: palette.primary,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
      createElement("path", {
        key: "cut",
        d: "M26 20l12 12M38 20L26 32",
        stroke: palette.stroke,
        strokeWidth: 4,
        strokeLinecap: "round",
      }),
      createElement("rect", {
        key: "sash",
        x: 22,
        y: 40,
        width: 20,
        height: 10,
        rx: 5,
        fill: palette.secondary,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
      createElement("rect", {
        key: "base",
        x: 18,
        y: 50,
        width: 28,
        height: 6,
        rx: 3,
        fill: palette.shadow,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
      createElement("circle", {
        key: "cap",
        cx: 32,
        cy: 10,
        r: 4,
        fill: palette.primary,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
    ]),
  q: (palette) =>
    withSvg([
      createElement("path", {
        key: "dress",
        d: "M16 48c2-10 6-18 16-18s14 8 16 18",
        fill: palette.primary,
        stroke: palette.stroke,
        strokeWidth: 4,
        strokeLinejoin: "round",
      }),
      createElement("path", {
        key: "belt",
        d: "M20 38h24",
        stroke: palette.stroke,
        strokeWidth: 4,
        strokeLinecap: "round",
      }),
      createElement("circle", {
        key: "left",
        cx: 18,
        cy: 18,
        r: 5,
        fill: palette.secondary,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
      createElement("circle", {
        key: "center",
        cx: 32,
        cy: 14,
        r: 5,
        fill: palette.secondary,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
      createElement("circle", {
        key: "right",
        cx: 46,
        cy: 18,
        r: 5,
        fill: palette.secondary,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
      createElement("rect", {
        key: "base",
        x: 18,
        y: 48,
        width: 28,
        height: 6,
        rx: 3,
        fill: palette.shadow,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
    ]),
  k: (palette) =>
    withSvg([
      createElement("path", {
        key: "body",
        d: "M24 24h16v20H24z",
        fill: palette.primary,
        stroke: palette.stroke,
        strokeWidth: 4,
        strokeLinejoin: "round",
      }),
      createElement("rect", {
        key: "neck",
        x: 28,
        y: 10,
        width: 8,
        height: 12,
        rx: 2,
        fill: palette.secondary,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
      createElement("rect", {
        key: "crown",
        x: 24,
        y: 6,
        width: 16,
        height: 4,
        rx: 2,
        fill: palette.primary,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
      createElement("path", {
        key: "arms",
        d: "M20 44h24",
        stroke: palette.stroke,
        strokeWidth: 4,
        strokeLinecap: "round",
      }),
      createElement("rect", {
        key: "base",
        x: 20,
        y: 48,
        width: 24,
        height: 8,
        rx: 3,
        fill: palette.shadow,
        stroke: palette.stroke,
        strokeWidth: 4,
      }),
    ]),
};

export default function PieceSprite({ piece, className = "h-12 w-12", tone = "board" }) {
  if (!piece) return null;
  const key = piece.toLowerCase();
  const sprite = SPRITES[key];
  if (!sprite) return null;
  const palette = piece === piece.toUpperCase() ? WHITE_PALETTE : BLACK_PALETTE;
  const classes = ["inline-flex items-center justify-center", className, tone === "board" ? "drop-shadow" : ""]
    .filter(Boolean)
    .join(" ");
  return createElement("span", { className: classes }, sprite(palette));
}
