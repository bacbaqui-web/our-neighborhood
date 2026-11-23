import * as T from 'three';
import{primitives}from'../local-detail/modular-primitives.js';
import{definitions,dimensions,PREFIX}from'./config.js';
import{surface as tex}from'./textures.js';
export{definitions,dimensions,PREFIX};
export function createPart(key,options={}){
 if(!definitions[key])throw Error('알 수 없는 미용실 에셋: '+key);
 const d=dimensions(options),{width:w,height:h,depth}=d,{root,box,rod,mat}=primitives(definitions[key].name);
 const plane=(name,x,y,z,ww,hh,m)=>{const o=new T.Mesh(new T.PlaneGeometry(ww,hh),m);o.name=name;o.position.set(x,y,z);root.add(o);return o;};
 const glass=new T.MeshStandardMaterial({color:'#d9e2d7',transparent:true,opacity:.045,depthWrite:false,roughness:.25});
 const glaze=(x,y,ww,hh)=>{box('ClearGlass',x,y,.01,ww,hh,.012,glass).castShadow=false;};
 if(key==='body'){
  box('RaisedFloor',0,.16,-depth/2,w,.32,depth,tex('floor',w,depth));box('BackWall',0,(h+.32)/2,-depth,w,h+.32,.12,tex('wall',w,h));box('Ceiling',0,h+.37,-depth/2,w,.1,depth,tex('ceiling',w,depth));
  for(const s of[-1,1]){box('SideWall',s*w/2,(h+.32)/2,-depth/2,.14,h+.32,depth,tex('wall',depth,h));box('IvoryPier',s*(w/2-.08),d.signBottom/2,0,.16,d.signBottom,.22,'#e1ddcd');}
  box('RightBrandPier',w/2-.17,(d.glassTop+.32)/2,0,.32,d.glassTop-.32,.22,'#f2edde');
  const right=w/2-.34;for(const x of[d.doorLeft,d.doorRight,right])box('WhiteFrame',x,(.32+d.glassTop)/2,.055,.05,d.glassTop-.32,.09,'#f5f0df');
  for(const y of[.32,d.doorTop,d.glassTop])box('WhiteRail',(d.doorLeft+right)/2,y,.055,right-d.doorLeft,.055,.09,'#f5f0df');
  glaze(d.doorX,(.32+d.doorTop)/2,.89,d.doorTop-.37);glaze((d.doorRight+right)/2,(.32+d.doorTop)/2,right-d.doorRight-.05,d.doorTop-.37);glaze((d.doorLeft+right)/2,(d.doorTop+d.glassTop)/2,right-d.doorLeft-.05,d.transomHeight-.05);
  box('DoorHandle',d.doorRight-.10,1.35,.13,.027,.40,.035,'#eeeada');
  box('UpperStep',0,.24,.18,w-.10,.16,.38,'#685c4d');box('LowerStep',0,.08,.39,w-.10,.16,.78,'#736556');
 }else if(key==='sign'){
  box('IvorySign',0,.52,0,w-.12,1.04,.18,'#f2edde');plane('SerifName',0,.47,.096,.92,.36,tex('sign',.92,.36));
  box('SignWallLamp',0,.76,.13,.9,.03,.08,'#ded8c5');box('SignDiffuser',0,.735,.14,.86,.012,.04,new T.MeshBasicMaterial({color:'#f6ecd0'}));
 }else if(key==='station'||key==='centerstation'){
  if(key==='centerstation'){box('FreestandingCabinet',0,.285,-.035,.88,.57,.32,tex('wood',.88,.57));box('MirrorBacking',0,1.36,-.065,.86,1.49,.04,'#876e50');}
  box('WoodMirrorFrame',0,1.36,-.03,.86,1.49,.055,'#665039');plane('MirrorTexture',0,1.36,.001,.80,1.43,tex('mirror',.80,1.43));box('FloatingWorkShelf',0,.57,.075,.86,.035,.27,'#7b6145');
 }else if(key==='toolkit'){
  const tray=box('ToolTray',-.12,.014,0,.49,.028,.22,'#7a6a52');
  const tools=plane('ScissorsAndComb',-.12,.030,0,.46,.20,tex('tools',.46,.20));tools.rotation.x=-Math.PI/2;
  box('DryerBody',-.25,.15,-.01,.21,.09,.095,'#424d49');box('DryerNozzle',-.105,.15,-.01,.08,.055,.07,'#687269');const grip=box('DryerHandle',-.27,.08,-.01,.045,.13,.06,'#505952');grip.rotation.z=-.20;
  plane('DryerVent',-.32,.15,.039,.055,.06,tex('aircon',.055,.06));
  for(let i=0;i<3;i++){const x=.15+i*.085,hh=[.20,.16,.23][i];box('StylingBottle',x,hh/2,0,.065,hh,.075,tex('bottle',.065,hh,(i+(options.variant??0))%4));box('BottlePump',x,hh+.009,0,.025,.018,.025,'#565d4d');box('PumpSpout',x+.015,hh+.022,0,.055,.009,.018,'#565d4d');}
 }else if(key==='stock'){
  box('StockCabinet',0,.84,0,.88,1.68,.28,'#b29b74');plane('TowelsAndShampoo',0,.84,.146,.83,1.62,tex('stock',.83,1.62,options.variant??0));
  for(let i=0;i<3;i++){box('FoldedTowelStack',-.22,1.70+i*.045,0,.34,.04,.23,'#d8ceae');}
 }else if(key==='chair'){
  box('HydraulicFoot',0,.035,0,.59,.07,.64,'#4f5750');box('HydraulicBase',0,.20,-.03,.28,.28,.33,'#bbc1b4');
  box('SeatCushion',0,.50,0,.56,.15,.52,tex('leather',.56,.52));const back=box('BackCushion',0,.79,-.235,.56,.56,.115,tex('leather',.56,.56));back.rotation.x=-.10;
  for(const x of[-.325,.325]){rod('ArmUpright',[x,.46,-.19],[x,.73,-.19],.018,'#b4bcb1');rod('ArmRail',[x,.73,-.19],[x,.73,.22],.018,'#c8cbbd');box('ArmPad',x,.745,.035,.045,.045,.36,'#bcaa7c');}
  rod('FootBar',[-.24,.22,.44],[.24,.22,.44],.02,'#a8b3a7');for(const x of[-.22,.22])rod('FootSupport',[x,.42,.23],[x,.22,.44],.013,'#b8c0b3');
 }else if(key==='trolley'){
  box('ToolCart',0,.42,0,.36,.70,.4,tex('cabinet',.36,.70));box('CartTray',0,.79,0,.38,.025,.42,'#717c70');for(const x of[-.14,.14])for(const z of[-.16,.16])box('Caster',x,.04,z,.06,.08,.06,'#535b50');
 }else if(key==='wash'){
  box('WashBase',0,.21,-.14,.66,.42,.9,'#676c5c');box('RecliningSeat',0,.49,.21,.62,.15,.72,tex('leather',.62,.72));const back=box('RecliningBack',0,.65,-.20,.62,.12,.64,tex('leather',.62,.64));back.rotation.x=-.50;
  box('BasinPedestal',0,.63,-.52,.4,.48,.38,'#c6cabd');
  // Hollow bowl from five broad boxes: the recess is real space, not a dark sticker.
  box('BowlBottom',0,.91,-.52,.66,.07,.44,'#eeeade');for(const x of[-.345,.345])box('BowlSide',x,1.005,-.52,.07,.19,.50,'#e9eadb');box('BowlRear',0,1.005,-.75,.66,.19,.06,'#e9eadb');box('BowlFront',0,.975,-.29,.66,.13,.06,'#e9eadb');
  rod('Tap',[.19,1.07,-.72],[.19,1.115,-.63],.015,'#9ca79b');
 }else if(key==='partition'){
  const wall=new T.Shape();wall.moveTo(-w/2,0);wall.lineTo(w/2,0);wall.lineTo(w/2,2.6);wall.lineTo(-w/2,2.6);wall.closePath();
  const ax=-w/2+.75,portal=new T.Path();portal.moveTo(ax-.48,0);portal.lineTo(ax-.48,1.75);portal.absarc(ax,1.75,.48,Math.PI,0,true);portal.lineTo(ax+.48,0);portal.closePath();wall.holes.push(portal);
  const hole=new T.Path();hole.absarc(w/2-.64,1.65,.31,0,Math.PI*2,true);wall.holes.push(hole);
  const geo=new T.ExtrudeGeometry(wall,{depth:.08,bevelEnabled:false,curveSegments:12});const mesh=new T.Mesh(geo,mat('#e7e3d3'));mesh.name='ArchedPartition';mesh.position.z=-.04;root.add(mesh);
  const rim=new T.Mesh(new T.RingGeometry(.31,.325,32),mat('#a9a28d'));rim.position.set(w/2-.64,1.65,.042);root.add(rim);
  plane('Curtain',ax,1.12,-.055,.94,2.24,tex('curtain',.94,2.24));
 }else if(key==='towels'){
  box('StorageBox',0,.925,0,.72,1.85,.42,'#dbd6c2');plane('TowelsAndDyes',0,.925,.216,.68,1.79,tex('cabinet',.68,1.79));
 }else if(key==='reception'){
  box('ReceptionBase',0,.53,0,.68,1.06,.58,'#e7e2d1');box('ReceptionTop',0,1.08,0,.70,.04,.60,'#f2ecda');
 }else if(key==='terminal'){
  box('TerminalFoot',0,.02,0,.24,.04,.20,'#c3c8ba');box('TerminalStem',0,.12,-.04,.04,.20,.04,'#a6b0a1');box('TerminalDisplay',0,.22,-.02,.24,.12,.03,'#58685e');
 }else if(key==='waiting'){
  box('WaitingSeat',0,.43,0,1,.06,.42,'#b49a6c');for(const x of[-.43,.43])box('BenchLeg',x,.215,0,.07,.43,.36,'#a68a5e');
 }else if(key==='products'){
  box('ProductDisplayBlock',0,.35,0,.40,.70,.12,'#e9e4d5');plane('HairProductTexture',0,.35,.066,.39,.68,tex('products',.39,.68));
 }else if(key==='planter'){
  box('WoodPlanter',0,.19,0,1.55,.38,.80,tex('wood',1.55,.38));box('Soil',0,.385,0,1.43,.018,.68,'#6d7152');
  const tree=new T.Mesh(new T.ConeGeometry(.38,1.23,7),mat('#6e8054'));tree.name='Conifer';tree.position.set(.22,1.0,0);root.add(tree);
  for(const [x,z]of[[-.51,.18],[-.48,-.17],[-.18,.22]]){const bush=new T.Mesh(new T.IcosahedronGeometry(.16,0),mat('#9ba176'));bush.position.set(x,.47,z);root.add(bush);}
 }else if(key==='decal'){plane('DoorInformation',0,.26,0,.44,.52,tex('decal',.44,.52));
 }else if(key==='sidebrand'){plane('SmallBrand',0,.10,0,.27,.20,tex('sidebrand',.27,.20));
 }else if(key==='light'){
  const ww=w-.65,dd=depth-2.6,m=new T.MeshBasicMaterial({color:'#fff6da'});
  for(const x of[-ww/2,ww/2])box('LineDiffuser',x,0,0,.035,.025,dd,m);
  for(const z of[-dd/2,dd/2])box('LineDiffuser',0,0,z,ww,.025,.035,m);
 }else if(key==='aircon'){
  box('AirconHousing',0,0,0,.65,.08,.65,'#daddd0');const grille=plane('AirconGrille',0,-.041,0,.60,.60,tex('aircon',.60,.60));grille.rotation.x=Math.PI/2;
 }
 root.userData={key,assetId:PREFIX+key,dimensions:d};return root;
}
