import * as T from 'three';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
// Reuse the neighborhood's original textured vehicles, with shared geometry/materials.
export async function createParkedCars(bays){
 const group=new T.Group();group.name='항공 사진 주차열의 차량';
 const assets=[['sonata-dn8/model-glass.glb',4.65],['ray/model-painted-glass.glb',3.6],['carnival-ka4-silver/model.glb',4.7],['grandeur-ig/model.glb',4.7]];
 const occupied=bays.filter(b=>b.occupied),loader=new GLTFLoader();
 await Promise.all(assets.map(async([file,length],index)=>{
 const root=(await loader.loadAsync(new URL('../../vehicles/'+file,import.meta.url).href)).scene;
 let bounds=new T.Box3().setFromObject(root),size=bounds.getSize(new T.Vector3());if(size.x>size.z)root.rotation.y=Math.PI/2;
 bounds=new T.Box3().setFromObject(root);size=bounds.getSize(new T.Vector3());const center=bounds.getCenter(new T.Vector3()),scale=Math.min(length/size.z,1.9/size.x);
 const normalized=new T.Group();normalized.add(root);root.position.add(new T.Vector3(-center.x,-bounds.min.y,-center.z));normalized.scale.setScalar(scale);normalized.updateMatrixWorld(true);
 const slots=occupied.filter((_,i)=>i%assets.length===index),placement=new T.Matrix4(),rotation=new T.Quaternion(),matrix=new T.Matrix4();
 root.traverse(o=>{if(!o.isMesh)return;const mesh=new T.InstancedMesh(o.geometry,o.material,slots.length);slots.forEach((b,i)=>{rotation.setFromAxisAngle(new T.Vector3(0,1,0),b.angle+(i%3===0?Math.PI:0));placement.compose(new T.Vector3(b.point[0],.13,b.point[1]),rotation,new T.Vector3(1,1,1));matrix.multiplyMatrices(placement,o.matrixWorld);mesh.setMatrixAt(i,matrix);});mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);});
 }));group.userData.count=occupied.length;return group;
}
