import * as T from 'three';
import {finishDepth} from './surface-policy.js';

// Finishes are ordinary meshes: daylight/shadows, monochrome styles and GLB
// export share the same materials. No opaque box-shaped replacement roads.
const FINISHES={
 block0:[0x9da092,'paving',1],block1:[0xa1a397,'paving',1],
 block2:[0x989d8e,'paving',1],block3:[0xa4a499,'paving',1],block4:[0x96998c,'paving',1],
 joint:[0x8c8c82,'mortar',1],crack:[0x686d64,'roadmark',0],
 repair0:[0xa5a59a,'paving',2],repair1:[0xb6b3a6,'paving',2],repair2:[0x9d9f95,'paving',2],
 repairEdge:[0x92958a,'mortar',1],wear0:[0xa5a598,'paving',1],wear1:[0xb5b2a4,'paving',1],
 moss:[0x7b8262,'yardGreen',0],grass0:[0x68794a,'yardGreen',0],
 grass1:[0x869357,'yardGreen',0],grass2:[0x788747,'yardGreen',0]
};
function geometry(positions,normals){
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 if(normals)g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));else g.computeVertexNormals();
 g.computeBoundingBox();g.computeBoundingSphere();return g;
}
let blockTexture;
function sidewalkBlocks(){
 if(blockTexture)return blockTexture;
 const canvas=typeof document==='undefined'?new OffscreenCanvas(128,128):document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');
 c.fillStyle='#565e5c';c.fillRect(0,0,128,128);
 const colors=['#949d98','#828d88','#89948e','#9aa39d'];
 for(let y=0;y<2;y++)for(let x=0;x<2;x++){c.fillStyle=colors[y*2+x];c.fillRect(x*64+1,y*64+1,62,62);}
 blockTexture=new T.CanvasTexture(canvas);blockTexture.wrapS=blockTexture.wrapT=T.RepeatWrapping;blockTexture.colorSpace=T.SRGBColorSpace;blockTexture.anisotropy=4;return blockTexture;
}
export function applyRoadContext(root,plan){
 const old=[];root.traverse(o=>{if(o.isMesh&&['road','path','seam'].includes(o.name))old.push(o);});
 for(const o of old){o.removeFromParent();o.geometry.dispose();}
 const group=new T.Group();group.name='AdaptiveAlleySurfaces';
 for(const [kind,positions] of Object.entries(plan.positions)){
  if(!positions.length)continue;
  const g=geometry(positions,plan.normals?.[kind]),blocks=kind==='sidewalk'&&plan.roadPriority;
  if(blocks){const uv=[];for(let i=0;i<positions.length;i+=3)uv.push(positions[i]/.8,positions[i+2]/.8);g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));}
  const m=new T.Mesh(g,new T.MeshStandardMaterial({
   map:blocks?sidewalkBlocks():null,
   color:blocks?0xffffff:kind==='asphalt'&&plan.roadPriority?0x30343a:({concrete:0xb0aea1,pavers:0x919487,sidewalk:0xa9ada5,platform:0xb2b5aa,arterial:0x5f6970})[kind]??0x626a70,roughness:1,side:T.DoubleSide
  }));
  // Road base stays in the outline/depth pass, hiding buried plinth edges.
  m.name='road';m.userData={roadClass:kind,canPark:kind==='asphalt'};
  m.receiveShadow=true;group.add(m);
 }
 const wear=new T.Group();wear.name='AlleySurfaceWear';
 for(const [key,positions] of Object.entries(plan.wear?.positions||{})){
  if(!positions.length)continue;
  const [color,detailKind,lodMaxLevel]=FINISHES[key];
  const m=new T.Mesh(geometry(positions),new T.MeshStandardMaterial({color,roughness:1,side:T.DoubleSide,...finishDepth(1)}));
  m.name='alley-surface-'+key;
  m.userData={detailKind,lodMaxLevel,roadFinish:true,surfaceOverlay:true,noPlacementCollision:true};
  m.receiveShadow=true;m.castShadow=false;wear.add(m);
 }
 wear.userData={...plan.wear?.qa};group.add(wear);
 group.userData=plan.qa;root.add(group);return group;
}
