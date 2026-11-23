import * as T from 'three';
import {primitives} from '../local-detail/modular-primitives.js';
import {surface} from './textures.js';
import {definitions,dimensions,PREFIX} from './config.js';
export {definitions,dimensions,PREFIX};
export function createPart(key,options={}){
 if(!definitions[key])throw Error('알 수 없는 빵집 에셋: '+key);
 const d=dimensions(options),{width:w,height:h,depth}=d,{root,box,rod,mat}=primitives(definitions[key].name);
 const pane=(name,x,y,z,ww,hh,m)=>{const o=new T.Mesh(new T.PlaneGeometry(ww,hh),m);o.name=name;o.position.set(x,y,z);root.add(o);return o;};
 const glass=new T.MeshStandardMaterial({color:'#d9e5df',transparent:true,opacity:.045,roughness:.3,depthWrite:false});
 const glazing=(x,y,z,ww,hh)=>{const o=box('ClearGlass',x,y,z,ww,hh,.012,glass);o.castShadow=false;return o;};
 const wood=()=>surface('wood',1,1);
 if(key==='body'){
 box('Floor',0,.06,-depth/2,w,.12,depth,surface('floor',w,depth));box('BackWall',0,(h+.12)/2,-depth,w,h+.12,.12,surface('wall',w,h));box('Ceiling',0,h+.17,-depth/2,w,.1,depth,surface('ceiling',w,depth));
 for(const s of [-1,1]){box('SideWall',s*w/2,(h+.12)/2,-depth/2,.16,h+.12,depth,surface('wall',depth,h));box('StoneJamb',s*(w/2-.08),d.signTop/2,0,.16,d.signTop,.20,'#d9c9ad');}
 box('Fascia',0,(d.glassTop+d.signBottom)/2,0,w,d.fasciaHeight,.18,'#ddd1b5');box('SignBacking',0,d.signBottom+.67,-.05,w,1.34,.12,'#d9c9ad');
 const left=d.doorLeft,right=w/2-.16,winLeft=d.doorRight,mid=(winLeft+right)/2;
 for(const x of [left,d.doorRight,mid,right])box('IvoryFrame',x,(d.floor+d.glassTop)/2,.04,.05,d.glassTop-d.floor,.10,'#f0eadb');
 for(const y of [d.floor,d.doorTop,d.glassTop])box('IvoryRail',(left+right)/2,y,.04,right-left,.05,.10,'#f0eadb');
 glazing(d.doorX,(d.floor+d.doorTop)/2,0,1.05,d.doorTop-d.floor-.05);
 for(const [a,b]of [[winLeft,mid],[mid,right]])glazing((a+b)/2,(d.floor+d.doorTop)/2,0,b-a-.05,d.doorTop-d.floor-.05);
 glazing((left+right)/2,(d.doorTop+d.glassTop)/2,0,right-left-.05,d.transomHeight-.05);
 rod('BrassDoorHandle',[d.doorRight-.15,.94,.10],[d.doorRight-.15,1.37,.10],.016,'#9b835a');box('DoorKickplate',d.doorX,.21,.045,1.05,.16,.02,'#d7d0bb');box('Threshold',d.doorX,.08,.12,1.15,.08,.28,'#a9aa9a');
 }else if(key==='sign'){
 const canopy=box('CreamSlopedCanopy',0,.78,.43,w-.16,.045,1.43,'#eee5cd');canopy.rotation.x=.935;
 box('CreamValance',0,.12,.87,w-.16,.24,.045,'#eee5cd');box('AwningHem',0,.002,.87,w-.16,.018,.05,'#d5c6a7');
 // Photo layout: name at the left edge, Bakery at the right; no central logo.
 pane('Name',-(w-.16)/2+.10+.47,.12,.896,.94,.22,surface('sign',.94,.22));
 pane('BakeryLabel',(w-.16)/2-.10-.36,.12,.896,.72,.22,surface('subtitle',.72,.22));
 for(const x of [-w/2+.2,w/2-.2])rod('AwningArm',[x,1.34,0],[x,.12,.85],.014,'#a7987d');
 }else if(key==='showcase'){
 box('DisplayBase',0,.415,0,1.4,.83,.7,wood());box('WoodWorktop',0,.85,0,1.4,.04,.7,'#b99160');
 const caseGlass=new T.MeshStandardMaterial({color:'#d9ede7',transparent:true,opacity:.075,roughness:.18,depthWrite:false});
 // Open air between two trays: no opaque product block or picture across the case.
 for(const y of [.88,1.24]){
  box('GlassShelf',0,y-.012,0,1.32,.016,.61,caseGlass).castShadow=false;
  for(let col=0;col<3;col++){
   const x=(col-1)*.43,variant=(options.variant||0)+col+(y>1?2:0);
   box('BreadTray',x,y+.005,0,.39,.016,.50,'#5c5748');
   for(let row=0;row<2;row++){
    const z=(row-.5)*.23,ww=variant%4===3?.35:.32,hh=variant%4===1?.14:.10;
    const side=surface('bread-side',ww,hh,variant+row),top=surface('bread-top',ww,.20,variant+row);
    const product=box('TexturedBreadGroup',x,y+.019+hh/2,z,ww,hh,.20,[side,side,top,side,side,side]);product.castShadow=false;
    // Three coarse rounded boxes share one group mesh; all pastry detail remains texture.
    product.geometry.dispose();const arrays={position:[],normal:[],uv:[]},count=variant%4===3?2:3,bw=ww/count*.84;
    let offset=0;const groups=[];
    for(let n=0;n<count;n++){
     let geo=new T.BoxGeometry(bw,hh,.20,4,3,4);const vertices=geo.attributes.position,r=Math.min(.043,bw*.44,hh*.44),half=new T.Vector3(bw/2-r,hh/2-r,.10-r),v=new T.Vector3(),core=new T.Vector3();
     for(let i=0;i<vertices.count;i++){v.fromBufferAttribute(vertices,i);core.set(Math.max(-half.x,Math.min(half.x,v.x)),Math.max(-half.y,Math.min(half.y,v.y)),Math.max(-half.z,Math.min(half.z,v.z)));v.sub(core).normalize().multiplyScalar(r).add(core);vertices.setXYZ(i,v.x+(n-(count-1)/2)*ww/count,v.y,v.z);}geo.computeVertexNormals();const flat=geo.toNonIndexed();for(const k of Object.keys(arrays))arrays[k].push(...flat.attributes[k].array);for(const g of flat.groups)groups.push({...g,start:g.start+offset});offset+=flat.attributes.position.count;geo.dispose();flat.dispose();
    }
    product.geometry=new T.BufferGeometry();for(const [k,a]of Object.entries(arrays))product.geometry.setAttribute(k,new T.Float32BufferAttribute(a,k==='uv'?2:3));for(const g of groups)product.geometry.addGroup(g.start,g.count,g.materialIndex);
   }
   pane('PriceCard',x,y+.032,.265,.12,.05,surface('price',.12,.05,variant));
  }
 }
 box('CaseFrontGlass',0,1.25,.343,1.39,.76,.012,caseGlass).castShadow=false;
 for(const x of [-.69,.69])box('CaseSideGlass',x,1.25,0,.012,.76,.69,caseGlass).castShadow=false;
 box('CaseTopGlass',0,1.635,0,1.4,.012,.70,caseGlass).castShadow=false;
 const edge='#91aaa0';for(const y of [.875,1.24,1.64])rod('GlassEdge',[-.69,y,.35],[.69,y,.35],.007,edge);
 for(const x of [-.695,.695])rod('GlassCorner',[x,.87,.35],[x,1.64,.35],.007,edge);
 }else if(key==='shelf'){
 box('ShelfBlock',0,.925,0,1.2,1.85,.46,wood());pane('BreadShelfTexture',0,1.05,.234,1.12,1.5,surface('shelf',1.12,1.5,options.variant||0));
 }else if(key==='counter'){
 box('CounterBase',0,.47,0,1.12,.94,.65,wood());box('CounterTop',0,.97,0,1.15,.06,.70,'#e5dcc6');
 }else if(key==='oven'){
 box('OvenBlock',0,.925,0,1.2,1.85,.65,'#afb2a8');pane('OvenDoors',0,.925,.329,1.2,1.85,surface('oven',1.2,1.85));
 }else if(key==='trays'){
 box('TrayStand',0,.43,0,.50,.86,.44,wood());for(let i=0;i<3;i++)box('TrayStack',0,.87+i*.018,0,.44,.014,.38,'#dccdb0');rod('Tongs',[-.14,.925,.04],[.10,.925,-.10],.008,'#8e978d');
 }else if(key==='pos'){
 box('POSFoot',0,.025,0,.28,.05,.24,'#4b514c');box('POSStand',0,.12,-.035,.06,.18,.06,'#555b53');box('POSScreen',0,.22,-.02,.28,.14,.035,'#3c4c49');
 }else if(key==='bags'){box('PaperBags',0,.17,0,.38,.34,.28,surface('bags',.38,.34));
 }else if(key==='board'){
 for(const s of [-1,1]){const b=box('BoardLeg',0,.47,s*.12,.55,.94,.045,'#a77b4d');b.rotation.x=s*.22;}pane('TodayMenu',0,.50,.204,.48,.78,surface('board',.48,.78));
 }else if(key==='planter'){
 box('Planter',0,.18,0,.34,.36,.34,'#ba8962');rod('Stem',[0,.35,0],[0,.78,0],.015,'#7d7851');for(const [x,y,z]of [[-.1,.55,.05],[.09,.64,0],[-.04,.78,-.05]]){const leaf=new T.Mesh(new T.IcosahedronGeometry(.13,0),mat('#809166'));leaf.position.set(x,y,z);leaf.scale.y=1.3;root.add(leaf);}
 }else if(key==='decal'){pane('OpeningHours',0,.275,0,.58,.55,surface('decal',.58,.55));
 }else if(key==='light'){
 box('PanelHousing',0,.035,0,1.15,.07,.36,'#cbcbbb');const m=new T.MeshBasicMaterial({color:'#fff5d9'});box('Diffuser',0,-.002,0,1.07,.012,.29,m);
 }else if(key==='partition'){
 const openingLeft=d.doorLeft+.04,openingRight=d.doorRight+.04;
 const wall=(a,b)=>box('ProductionPartition',(a+b)/2,h/2,0,b-a,h,.08,surface('wall',b-a,h));
 wall(-w/2,openingLeft);wall(openingRight,w/2);box('ProductionLintel',(openingLeft+openingRight)/2,(h+2.15)/2,0,1.10,h-2.15,.08,'#e7deca');
 box('KitchenDoor',(openingLeft+openingRight)/2,1.075,-.012,1.04,2.15,.035,'#d1c5a8');glazing((openingLeft+openingRight)/2,1.55,.012,.62,.58);
 }
 root.userData={key,assetId:PREFIX+key,dimensions:d};return root;
}
