import * as T from 'three';
import {buildStorefront} from '../../../../shops/storefront-models.js';

// Local review variant. Dimensions inferred from the approved front photograph.
export function buildDetailedStorefront(original){
 const spec=structuredClone(original);
 spec.props=[];
 spec.openings=[
  {x:-2.48,y:1.43,w:2.60,h:2.42,panes:3,frame:'#47594d',frameWidth:.055},
  {x:-.25,y:1.43,w:1.65,h:2.42,panes:2,door:0,frame:'#8c968c',frameWidth:.04},
  {x:2.17,y:1.43,w:3.02,h:2.42,panes:3,frame:'#47594d',frameWidth:.055}
 ];
 spec.comicArtwork=spec.comicArtwork.filter(a=>a.role==='sign').map(a=>({...a,w:7.57,h:.86,z:.285}));
 const root=buildStorefront(spec),detail=new T.Group();detail.name='PhotoObservedDetails';root.add(detail);
 const materials=new Map();
 function box(name,x,y,z,w,h,d,color){
  if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.8}));
  const m=new T.Mesh(new T.BoxGeometry(w,h,d),materials.get(color));m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;detail.add(m);return m;
 }
 const steel='#7f8a80',dark='#374b3f',white='#dcded4';
 // The photo has seven separately framed sign panels, with a wider logo panel.
 for(const x of [-3.85,-3.24,-1.94,-.64,.72,2.02,3.24,3.85])box('SignPanelDivider',x,3.28,.31,.045,.92,.08,dark);
 for(const y of [2.81,3.75])box('SignPerimeterRail',0,y,.29,7.82,.055,.12,steel);
 box('SignTopFlashing',0,3.82,.1,7.96,.05,.56,steel);
 box('AwningFrontGutter',0,2.64,.72,7.96,.085,.11,'#547c61');
 for(const x of [-3.7,-1.1,.68,3.7]){
  box('AwningSupport',x,2.72,.43,.035,.045,.58,steel);
  box('GreenFacadePost',x,1.42,.18,.075,2.42,.10,'#39724f');
 }
 // Slim sill and door hardware stay outside the clear passage.
 for(const o of spec.openings){
  box('DeepWindowSill',o.x,.20,.18,o.w+.05,.055,.27,steel);
  if(o.door===undefined)box('WindowCrossRail',o.x,1.10,.19,o.w,.035,.06,steel);
 }
 for(const x of [-.63,.13]){
  box('DoorPull',x,1.18,.27,.025,.38,.035,steel);
  for(const y of [1.01,1.35])box('DoorPullMount',x,y,.22,.025,.025,.10,steel);
 }
 for(const x of [-2.2,1.78]){
  const w=x<0?1.60:1.68,z=.65;
  box('FreezerCabinet',x,.46,z,w,.75,.75,white);
  box('FreezerPlinth',x,.09,z,w-.08,.10,.68,steel);
  box('FreezerUpperRim',x,.86,z,w+.04,.07,.81,steel);
  for(const dx of [-w*.245,w*.245]){
   box('FreezerGlassLid',x+dx,.91,z,w*.46,.025,.66,'#7f9790');
   for(const zz of [-.34,.34])box('LidFrame',x+dx,.93,z+zz,w*.48,.03,.025,white);
   box('LidHandle',x+dx,.955,z+.22,.22,.035,.035,white);
  }
  box('LidCenterTrack',x,.94,z,.03,.035,.73,white);
  for(let j=0;j<10;j++)box('VentSlot',x-w*.40+j*w*.087,.23,z+.381,.035,.13,.012,'#87938a');
  box('FrontInset',x,.57,z+.379,w-.10,.42,.012,'#e8e9e0');
 }
 // Left upright drinks cabinet: shelves and individual bottles seen in the reference.
 box('DrinksFridgeBody',-3.43,1.14,.45,.73,2.18,.55,white);
 box('DrinksFridgeDarkInterior',-3.43,1.16,.735,.62,1.83,.025,dark);
 for(let row=0;row<5;row++){
  const y=.37+row*.34;box('DrinksShelf',-3.43,y,.79,.61,.035,.11,white);
  for(let col=0;col<5;col++){
   const x=-3.67+col*.12;
   box('Bottle',x,y+.13,.79,.075,.20,.08,['#a6c8ad','#ddd1a2','#8ca9bc'][col%3]);
   box('BottleCap',x,y+.24,.79,.045,.025,.045,white);
  }
 }
 for(const x of [-3.77,-3.09])box('FridgeDoorFrame',x,1.14,.81,.035,2.02,.035,steel);
 for(const y of [.15,2.16])box('FridgeDoorRail',-3.43,y,.81,.70,.035,.035,steel);
 box('FridgeDoorHandle',-3.13,1.10,.86,.025,.37,.04,steel);
 root.userData.localReview={assetId:'shop:convenience-01',referenceId:original.approvedReferenceId,status:'representative-awaiting-review',unobserved:'rear, dimensions and interior remain inferred'};
 return root;
}
