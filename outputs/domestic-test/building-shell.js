import * as T from 'three';

// Paint the extrusion's existing top cap. A second roof skin, even 12 mm
// above this cap, loses depth precision in overview shots and causes stripes.
// Vertex colors keep one draw call and carry the same colors into GLB exports.
export function createBuildingShellGeometry(shape, base, top, wall, roof) {
 const geometry = new T.ExtrudeGeometry(shape, {
  depth: Math.max(1, top - base), bevelEnabled: false, steps: 1,
 });
 geometry.rotateX(-Math.PI / 2);
 geometry.translate(0, base, 0);
 const normals = geometry.attributes.normal;
 const colors = new Float32Array(normals.count * 3);
 const wallColor = new T.Color(wall), roofColor = new T.Color(roof);
 let roofVertices = 0;
 for (let i = 0; i < normals.count; i++) {
  const isRoof = normals.getY(i) > .99;
  (isRoof ? roofColor : wallColor).toArray(colors, i * 3);
  if (isRoof) roofVertices++;
 }
 geometry.setAttribute('color', new T.BufferAttribute(colors, 3));
 geometry.userData.surfacePolicy = 'single-roof-cap';
 geometry.userData.roofTriangles = roofVertices / 3;
 return geometry;
}
