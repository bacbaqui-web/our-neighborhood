// Pixel regions measured from broadleaf-flat-v46.png (1448 x 1086).
// Generated leaves cross the nominal 362px grid: e.g. the first row reaches
// y=369, and the next row's first clump reaches x=363. Uniform cells cut those
// tips off and display them as disconnected flecks in the neighboring sprite.
export const CANOPY_ATLAS_SIZE = [1448, 1086];
const columns = [[8, 376], [384, 728], [732, 1082], [1087, 1444]];
const rows = [[40, 385], [402, 718], [728, 1068]];
export function canopyAtlasRect(variant, tier, frames) {
  if(frames)return frames[tier*(frames.length/3)+variant].rect;
  const [x0, x1] = columns[variant], [y0, y1] = rows[tier];
  return [x0 / 1448, 1 - y1 / 1086, (x1 - x0) / 1448, (y1 - y0) / 1086];
}
