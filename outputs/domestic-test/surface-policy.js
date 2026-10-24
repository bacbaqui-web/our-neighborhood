// Only intentional finish layers receive a small depth bias. Real solids
// retain normal depth testing; this never makes paint visible through a wall.
export function finishDepth(layer = 1) {
 return {polygonOffset: true, polygonOffsetFactor: -layer, polygonOffsetUnits: -layer};
}
