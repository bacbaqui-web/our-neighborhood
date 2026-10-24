import * as T from 'three';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {speciesById} from './tree-species.js?v=55';

// Continuous tapered rings per woody axis. Parallel transport avoids twisting
// rings, separate cylinders, and ball-shaped knobs at each growth sample.
export function createTreeWood(plan){
 const pieces=[];
 for(const path of plan.paths){
  const rings=path.nodes.map(i=>plan.nodes[i]),sides=[12,9,7,5][path.level]||5,positions=[],uvs=[],indices=[];
  let previousTangent=null,side=new T.Vector3(1,0,0);const q=new T.Quaternion();
  for(let i=0;i<rings.length;i++){
   const a=new T.Vector3(...rings[Math.max(0,i-1)].p),b=new T.Vector3(...rings[Math.min(rings.length-1,i+1)].p),tangent=b.sub(a).normalize();
   if(previousTangent)side.applyQuaternion(q.setFromUnitVectors(previousTangent,tangent));
   else if(Math.abs(side.dot(tangent))>.9)side.set(0,0,1);
   side.addScaledVector(tangent,-side.dot(tangent)).normalize();const across=new T.Vector3().crossVectors(tangent,side).normalize();previousTangent=tangent;
   for(let j=0;j<sides;j++){const angle=j/sides*Math.PI*2,offset=side.clone().multiplyScalar(Math.cos(angle)*rings[i].radius).addScaledVector(across,Math.sin(angle)*rings[i].radius);positions.push(...rings[i].p.map((v,k)=>v+offset.getComponent(k)));uvs.push(j/sides,i/(rings.length-1));}
   if(i)for(let j=0;j<sides;j++){const a=(i-1)*sides+j,an=(i-1)*sides+(j+1)%sides,b=i*sides+j,bn=i*sides+(j+1)%sides;indices.push(a,an,b,an,bn,b);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();pieces.push(g);
 }
 if(!pieces.length)return null;const geometry=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());
 const species=speciesById(plan.species),base=new T.Color(species?.bark??0x81715e),positions=geometry.attributes.position;
 if(plan.species==='plane'||plan.species==='pine'){
  const colors=[];for(let i=0;i<positions.count;i++){const y=positions.getY(i)-plan.root[1],x=positions.getX(i)-plan.root[0],z=positions.getZ(i)-plan.root[2];
   const patch=Math.sin(y*3.4+x*4.8)+Math.cos(z*6.1-y*2.2),c=base.clone();
   if(plan.species==='plane')c.lerp(new T.Color(patch>.7?0xc4c2a5:patch<-.7?0x787d65:species.bark),.6);
   else c.lerp(new T.Color(0xa57455),Math.min(.6,y/plan.height));colors.push(c.r,c.g,c.b);
  }geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 }
 const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color:geometry.attributes.color?0xffffff:base,vertexColors:!!geometry.attributes.color,roughness:1,side:T.DoubleSide}));mesh.name='rooted-trunk-'+plan.id;mesh.userData={detailKind:'yardWood',species:plan.species,pointedTips:plan.stats.tips,branchOrders:plan.stats.orders};mesh.castShadow=mesh.receiveShadow=true;return mesh;
}
