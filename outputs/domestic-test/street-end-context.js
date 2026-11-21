import * as T from 'three';
import {facadeStyles} from './korean-facades.js?v=151';

// Real footprints, batched into two draws. No per-building props or textures.
export function createStreetEndContext(data,owners,heightAt){
 const group=new T.Group();group.name='StreetEndContext';
 const walls=[],wallColors=[],wallIds=[],roads=[],roadColors=[];
 const color=(s)=>new T.Color(s).toArray();
 const add=(out,colors,a,b,c,tint)=>{out.push(...a,...b,...c);colors.push(...tint,...tint,...tint);};
 function surface(rings,emit){
  const contour=rings[0].map(p=>new T.Vector2(...p)),holes=rings.slice(1).map(r=>r.map(p=>new T.Vector2(...p))),points=[...contour,...holes.flat()];
  for(const tri of T.ShapeUtils.triangulateShape(contour,holes)){
   const pts=tri.map(i=>points[i].toArray());
   const [a,b,c]=pts;if((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])>0)pts.reverse();
   emit(...pts);
  }
 }
 let count=0;
 for(const b of data.buildings){
  if(owners?.has(Number(b.owner)))continue;
  const style=facadeStyles[Math.abs(b.owner)%facadeStyles.length],wall=color(style.wall),roof=color(style.roof);
  const firstVertex=walls.length/3;
  const top=Math.max(...b.rings.flat().map(p=>heightAt(...p)))+b.height;
  for(const ring of b.rings)for(let i=0;i<ring.length;i++){
   const a=ring[i],b=ring[(i+1)%ring.length],v=[a[0],heightAt(...a)-.08,a[1]],w=[b[0],heightAt(...b)-.08,b[1]],u=[a[0],top,a[1]],z=[b[0],top,b[1]];
   add(walls,wallColors,v,u,w,wall);add(walls,wallColors,w,u,z,wall);
  }
  surface(b.rings,(a,b,c)=>add(walls,wallColors,...[a,b,c].map(p=>[p[0],top,p[1]]),roof));for(let i=firstVertex;i<walls.length/3;i++)wallIds.push(5000000+count);count++;
 }
 const asphalt=color('#41464c');
 function paving(a,b,c,depth=0){
  const points=[a,b,c],lengths=points.map((p,i)=>Math.hypot(p[0]-points[(i+1)%3][0],p[1]-points[(i+1)%3][1]));
  const edge=lengths.indexOf(Math.max(...lengths));
  if(lengths[edge]>10&&depth<16){
   const p=points[edge],q=points[(edge+1)%3],r=points[(edge+2)%3],mid=[(p[0]+q[0])/2,(p[1]+q[1])/2];
   paving(p,mid,r,depth+1);paving(mid,q,r,depth+1);return;
  }
  add(roads,roadColors,...points.map(p=>[p[0],heightAt(...p)+.025,p[1]]),asphalt);
 }
 for(const road of data.roads)surface(road.rings,paving);
 function mesh(name,positions,colors){
  if(!positions.length)return;
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));if(name==='StreetEndBuildings')geometry.setAttribute('inkObjectId',new T.Float32BufferAttribute(wallIds,1));geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const material=new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide});
  const object=new T.Mesh(geometry,material);object.name=name;object.userData.environmentOwned=true;object.userData.noInk=name==='StreetEndRoads';group.add(object);
 }
 mesh('StreetEndBuildings',walls,wallColors);mesh('StreetEndRoads',roads,roadColors);
 return {group,stats:{buildings:count,drawCalls:group.children.length,triangles:(walls.length+roads.length)/9,windowGeometry:0},dispose(){group.removeFromParent();group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}};
}
