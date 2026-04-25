/** Paleta fija para distinguir regiones en gráficos y tarjetas (estable por nombre). */
const PALETTE = [
  "#60a5fa",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#22d3ee",
  "#c084fc",
  "#4ade80",
  "#f97316",
  "#38bdf8",
  "#e879f9",
  "#2dd4bf",
  "#fcd34d",
  "#818cf8",
  "#f472b6",
  "#94a3b8",
] as const;

function hashRegionKey(region: string): number {
  let h = 0;
  for (let i = 0; i < region.length; i += 1) {
    h = (Math.imul(31, h) + region.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function regionChartColor(region: string): string {
  return PALETTE[hashRegionKey(region) % PALETTE.length]!;
}
