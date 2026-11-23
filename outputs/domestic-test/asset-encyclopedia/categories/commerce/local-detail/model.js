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
 // Preserve the printed sign only; rebuild the facade and visible room to avoid
 // inherited generic walls/furniture obscuring the photographed entrance.
 for(const child of [...root.children])if(child!==detail&&child.name!=='ComicShopArtwork')root.remove(child);
 const materials=new Map();
 function box(name,x,y,z,w,h,d,color){
  if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.8}));
  const m=new T.Mesh(new T.BoxGeometry(w,h,d),materials.get(color));m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;detail.add(m);return m;
 }
 const steel='#7f8a80',dark='#374b3f',white='#dcded4';
 box('BackWall',0,1.4,-2.7,7.65,2.8,.10,'#596250');
 box('Floor',0,.11,-1.1,7.65,.12,3.2,'#a9a796');
 box('Ceiling',0,2.7,-1.1,7.65,.10,3.2,'#e4ddc2');
 for(const x of [-3.87,3.87])box('SideReturn',x,1.4,-1.1,.10,2.8,3.2,'#b2b09c');
 box('SignCabinet',0,3.28,.08,7.8,.96,.38,'#bdc3b4');
 box('UnderSignFascia',0,2.8,.06,7.8,.12,.28,'#c2bba0');
 const canopy=box('ShallowGreenCanopy',0,2.71,.38,7.95,.045,.7,'#4e8060');canopy.rotation.x=.16;
 for(const x of [-3.83,-1.30,.48,3.75])box('MainFacadePost',x,1.42,.10,.075,2.50,.16,'#36734c');
 for(const [left,right] of [[-3.82,-1.30],[-1.30,.48],[.48,3.75]]){
  for(const y of [.23,2.64])box('OuterWindowRail',(left+right)/2,y,.12,right-left,.045,.10,steel);
  const count=left< -2?3:2;
  for(let j=1;j<count;j++)box('WindowDivision',left+(right-left)*j/count,1.43,.12,.035,2.4,.07,steel);
 }
 // Clear central double doors with narrow stiles instead of an opaque infill.
 for(const x of [-1.24,-.38,.43])box('DoorStile',x,1.41,.20,.035,2.36,.07,'#a5aaa0');
 for(const y of [.27,2.59])box('DoubleDoorRail',-.40,y,.20,1.7,.04,.07,steel);
 for(const x of [-.49,-.27]){
  box('DoubleDoorPull',x,1.27,.29,.027,.42,.04,'#b9c1b7');
  for(const y of [1.08,1.46])box('PullStandOff',x,y,.25,.025,.025,.09,steel);
 }
 // Bottles and packets are solid low-detail forms. No roadview photo is a texture.
 const palette=['#a26c35','#d9b44e','#568361','#c4d0ae','#8eb2be','#c7c1a2'];
 function stockShelf(x,y,z,w,rows,cols){
  box('ShelfDarkBack',x,y+.45,z-.06,w,.98,.06,'#3e4c3b');
  for(let row=0;row<rows;row++){
   const yy=y+row*.27;box('StockShelfRail',x,yy,z+.04,w,.035,.24,'#b3ad91');
   for(let col=0;col<cols;col++){
    const xx=x-w/2+.09+col*(w-.18)/(cols-1),c=palette[(row*2+col)%palette.length];
    const h=.15+((col+row)%4)*.018;
    box('VisibleProduct',xx,yy+h/2+.025,z+.07,.07+(col%3)*.009,h,.09,c);
    box('ProductLabel',xx,yy+.10,z+.118,.069,.05,.008,'#e5dec2');
    box('ProductCap',xx,yy+.22,z+.07,.05,.025,.06,'#d0cdb7');
   }
  }
 }
 stockShelf(-2.34,1.22,-.17,1.63,4,12);
 stockShelf(1.24,1.12,-.12,1.32,4,9);
 stockShelf(2.78,.93,-.32,1.45,4,10);
 stockShelf(-1.9,.45,-2.35,2.45,7,15);
 stockShelf(1.6,.45,-2.35,2.6,7,16);
 stockShelf(.04,.38,-.48,.75,4,5);
 box('DoorLowerKickplate',-.82,.35,.22,.77,.12,.025,'#8c9384');
 for(let i=0;i<6;i++)box('LeftDoorNotice',-.98+(i%2)*.22,1.5+Math.floor(i/2)*.19,.235,.18,.14,.008,['#d0b568','#e3dfc3','#94bdb6'][i%3]);
 for(let row=0;row<2;row++)for(let col=0;col<3;col++){
  box('RightDisplayPackage',.81+col*.28,1.65+row*.32,.19,.23,.27,.07,['#b36d2c','#769536','#c3a94c'][(row+col)%3]);
  box('PackageFrontLabel',.81+col*.28,1.65+row*.32,.23,.16,.06,.01,'#e6dbaa');
 }
 // Right lower window's pale advertising band and low counter.
 box('WindowLowerBand',2.54,.62,.155,2.31,.53,.015,'#a8c9ba');
 box('WindowBandTop',2.54,.91,.17,2.31,.025,.025,'#e8e4ce');
 box('WindowBandBottom',2.54,.34,.17,2.31,.025,.025,'#d8ded0');
 for(const x of [2.05,2.48,2.91,3.34])box('LowerWindowDivider',x,.65,.19,.025,.65,.04,'#917b57');
 box('RightCounter',2.63,1.09,-.03,2.0,.07,.48,'#bcbca6');
 // Small printed panels use only readable reference text and simplified graphic blocks.
 function print(name,x,y,z,w,h,bg,lines,fg='#eff0dc'){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,256);
  ctx.strokeStyle=fg;ctx.lineWidth=4;ctx.strokeRect(6,6,500,244);
  ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';
  lines.forEach((line,i)=>{ctx.font=`bold ${lines.length===1?70:54}px sans-serif`;ctx.fillText(line,256,256*(i+.5)/lines.length,480);});
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map,roughness:1}));m.name=name;m.position.set(x,y,z);detail.add(m);
 }
 print('EntryPromotion',-.40,2.41,.24,1.63,.30,'#187c83',['20%'],'#f0d63f');
 print('FreezerPrintLeft',-2.20,.48,1.038,1.43,.37,'#dfe5da',['Ice cream'],'#41a5ac');
 print('FreezerPrintRight',1.78,.48,1.038,1.51,.37,'#dfe5da',['Ice cream'],'#41a5ac');
 for(const [x,color] of [[2.73,'#368fa0'],[3.29,'#bf5a41']]){
  print('WindowPromotion',x,2.29,.21,.49,.55,color,['7','ELEVEN']);
 }
 print('CounterCard',1.9,1.42,.26,.38,.42,'#326677',['7']);
 for(const x of [-2.85,-2.2,-1.55])box('DisplayCaseUpright',x,1.84,.20,.04,1.08,.08,'#a9ad9a');
 for(const y of [1.31,2.36])box('DisplayCaseRail',-2.2,y,.20,1.34,.045,.08,'#b1b7a7');
 for(let i=0;i<9;i++)box('EntryTile',-1.23+i*.19,.18,.46,.18,.06,.43,'#c3b6a4');
 for(const x of [-3.90,3.90]){
  box('RoofEndCap',x,3.91,-.06,.10,.28,.18,'#4b6d62');
  const end=box('RoofRaisedEnd',x,3.94,.06,.10,.08,.35,'#4b6d62');end.rotation.x=.45;
 }
 box('RightDownpipe',3.97,1.5,.30,.09,2.85,.09,'#a0afa1');
 box('DownpipeOutlet',3.97,.14,.44,.09,.09,.36,'#a0afa1');
 // Two narrow service conduits below the sign.
 for(const y of [2.86,2.91])box('SignConduit',0,y,.33,7.75,.022,.025,'#8b8c76');
 // The photo has seven separately framed sign panels, with a wider logo panel.
 for(const x of [-3.85,-3.24,-1.94,-.64,.72,2.02,3.24,3.85])box('SignPanelDivider',x,3.28,.31,.045,.92,.08,dark);
 for(const y of [2.81,3.75])box('SignPerimeterRail',0,y,.29,7.82,.055,.12,steel);
 box('SignTopFlashing',0,3.82,.1,7.96,.05,.56,steel);
 box('AwningFrontGutter',0,2.64,.72,7.96,.085,.11,'#547c61');
 for(const x of [-3.7,-1.3,.48,3.7]){
  box('AwningSupport',x,2.72,.43,.035,.045,.58,steel);
 }
 // Slim sill and door hardware stay outside the clear passage.
 for(const [x,w] of [[-2.56,2.50],[2.12,3.23]])box('DeepWindowSill',x,.20,.18,w,.055,.27,steel);
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
 for(let i=0;i<4;i++)box('FridgeBaseLouvre',-3.43,.13+i*.04,.745,.65,.018,.015,'#818d7d');
 for(const x of [2.87,3.20,3.48]){
  const bag=new T.Mesh(new T.SphereGeometry(.12,8,6),new T.MeshStandardMaterial({color:'#d9dfcc',roughness:1}));
  bag.name='CounterBag';bag.position.set(x,1.15,.29);bag.scale.set(.8,1.35,.65);detail.add(bag);
  box('BagYellowTop',x,1.30,.29,.13,.07,.11,'#d8b135');
 }
 // Sparse, regular paving joints: no photographic noise or baked shadows.
 for(let row=0;row<3;row++)for(let col=0;col<32;col++)box('FrontPaving',-3.92+col*.25+(row%2)*.06,.035,1.22+row*.18,.24,.06,.17,['#929f8a','#a2ab96','#879784'][(col+row)%3]);
 root.userData.localReview={assetId:'shop:convenience-01',referenceId:original.approvedReferenceId,status:'representative-awaiting-review',unobserved:'rear, dimensions and interior remain inferred'};
 return root;
}
