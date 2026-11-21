import {approvedBuildingProfiles} from '../building-remakes/models.js?v=replacements3';
import * as T from 'three';
import {facilityById} from './catalog.js';
import {facilityShops} from './storefronts.js';
import {buildStorefront} from '../shops/storefront-models.js';
import {createDetails} from '../details.js?v=replacements3';
import {createBuildingShellGeometry} from '../building-shell.js';
import {facadeStyles} from '../korean-facades.js';
export function previewBuilding(id,{neighbors=true}={}){
 const f=facilityById[id],approved=approvedBuildingProfiles['facility:'+id],shop=f.pattern==='shop'&&!approved,[w,hh,dd]=approved?.nominal||f.nominal,h=shop?9:hh,d=shop?8:dd;
 const root=new T.Group(),specs=[];
 function house(x,z,W,H,D,seed,facility){
  const points=[[x-W/2,z+D/2],[x+W/2,z+D/2],[x+W/2,z-D/2],[x-W/2,z-D/2]],style=facadeStyles[seed%6];
  const shape=new T.Shape(points.map(p=>new T.Vector2(p[0],-p[1]))),mesh=new T.Mesh(createBuildingShellGeometry(shape,0,H,facility?(approved?.wall??f.wall):style.wall,facility?(approved?.roofColor??0x8c9185):0x8c9185),new T.MeshStandardMaterial({vertexColors:true,roughness:.95}));root.add(mesh);mesh.userData.windowOwner=seed;
  const b={points,base:0,top:H,levels:facility?(approved?.levels??Math.round(H/3)):Math.round(H/3),floor:3,seed,inkObjectId:mesh.id,frontEdge:0,holes:false,basementLevels:0};if(facility)b.facility={id,frontEdge:0};specs.push(b);return b;
 }
 const b=house(0,0,w,h,d,2,!shop);
 if(shop){const s=structuredClone(facilityShops.find(s=>s.facilityId===id));b.storefronts=[{edge:0,lo:.1,hi:w-.1,position:[0,0,d/2],width:w,height:s.height,spec:s}];const model=buildStorefront(s,{shell:false,attachment:true});model.position.z=d/2+.025;root.add(model);}
 if(neighbors){house(-w/2-6,0,9,9,9,0,false);house(w/2+6,-1,9,12,9,3,false);}
 root.add(createDetails(specs,()=>0,{structures:[]},approved?{shells:root.children.filter(o=>o.isMesh),auditWindows:true}:{}));root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 root.userData={id,width:w+(neighbors?24:0),height:h,depth:d,specs};return root;
}
