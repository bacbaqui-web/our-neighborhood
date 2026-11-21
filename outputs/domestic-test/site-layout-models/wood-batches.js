import * as T from 'three';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';

// The tree pipeline has fixed world-space wood. Merge only
// identical material settings in small spatial cells; leave leaf cards alone.
export function batchFixedWood(foliage,cellSize=32){
 const qa={beforeMeshes:0,afterMeshes:0,beforeTriangles:0,afterTriangles:0};
 for(const system of foliage.batches||[foliage]){
  const parent=system.wood,bins=new Map();
  for(const mesh of parent.children){
   if(!mesh.isMesh||Array.isArray(mesh.material))continue;
   mesh.geometry.computeBoundingBox();const center=mesh.geometry.boundingBox.getCenter(new T.Vector3()),m=mesh.material;
   const key=[Math.floor(center.x/cellSize),Math.floor(center.z/cellSize),m.color.getHex(),m.roughness,m.side,m.vertexColors].join(':');
   if(!bins.has(key))bins.set(key,[]);bins.get(key).push(mesh);
  }
  for(const meshes of bins.values()){
   const triangles=meshes.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0);
   qa.beforeMeshes+=meshes.length;qa.beforeTriangles+=triangles;
   if(meshes.length<2){qa.afterMeshes++;qa.afterTriangles+=triangles;continue;}
   const geometry=mergeGeometries(meshes.map(m=>m.geometry),false);
   if(!geometry)throw Error('나무 줄기를 묶지 못했습니다.');
   const count=(geometry.index?.count||geometry.attributes.position.count)/3;
   if(count!==triangles)throw Error('나무 줄기 모양 검사가 맞지 않습니다.');
   const combined=new T.Mesh(geometry,meshes[0].material);combined.castShadow=combined.receiveShadow=true;combined.name='FixedWoodCell';
   parent.add(combined);qa.afterMeshes++;qa.afterTriangles+=count;
   for(const mesh of meshes){parent.remove(mesh);mesh.geometry.dispose();if(mesh!==meshes[0])mesh.material.dispose();}
  }
 }
 return qa;
}
