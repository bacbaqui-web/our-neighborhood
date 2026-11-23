import * as T from 'three';
import {primitives} from '../local-detail/modular-primitives.js';
import {createPart as shared} from './shared-parts.js';
import {surface} from './textures.js';
import {blueSurface as tex} from './blue-textures.js';
import {definitions,dimensions,PREFIX} from './config.js';
export{definitions,dimensions,PREFIX};
export function createPart(key,options={}){
 if(!definitions[key])throw Error('알 수 없는 에셋: '+key);
 if(['showcase','counter','oven','pos','bags','light'].includes(key))return shared(key,options);
 const d=dimensions(options),{width:w,height:h,depth}=d,{root,box,rod,mat}=primitives(definitions[key].name);
 const plane=(name,x,y,z,ww,hh,m)=>{const p=new T.Mesh(new T.PlaneGeometry(ww,hh),m);p.name=name;p.position.set(x,y,z);root.add(p);return p;};
 const glass=new T.MeshStandardMaterial({color:'#d3e5de',transparent:true,opacity:.055,depthWrite:false,roughness:.25});
 const glaze=(x,y,ww,hh)=>{box('ClearWindow',x,y,0,ww,hh,.014,glass).castShadow=false;};
 if(key==='body'){
 box('Floor',0,.06,-depth/2,w,.12,depth,tex('floor',w,depth));box('Ceiling',0,h+.17,-depth/2,w,.10,depth,tex('ceiling',w,depth));box('WoodBackWall',0,(h+.12)/2,-depth,w,h+.12,.12,tex('wood',w,h));
 for(const s of [-1,1]){box('SideWall',s*w/2,(h+.12)/2,-depth/2,.14,h+.12,depth,tex(s<0?'wood':'wall',depth,h));box('BlueOuterPier',s*(w/2-.15),d.glassTop/2,0,.30,d.glassTop,.24,'#145d80');}
 box('FrontHead',0,(d.glassTop+d.signBottom)/2,0,w,d.signBottom-d.glassTop,.20,'#185a7b');box('BlueDoorPier',d.doorLeft-.25,d.glassTop/2,.015,.42,d.glassTop,.23,'#126086');
 const spans=[[-w/2+.30,d.doorLeft-.46],[d.doorRight,w/2-.30]];
 for(const[a,b]of spans){const cx=(a+b)/2;for(const y of [.12,d.glassTop])box('WoodWindowRail',cx,y,.05,b-a,.06,.09,'#b48551');for(const x of[a,b])box('WoodWindowJamb',x,(d.glassTop+.12)/2,.05,.065,d.glassTop-.12,.10,'#b48551');glaze(cx,(d.glassTop+.12)/2,b-a-.06,d.glassTop-.18);}
 for(const x of[d.doorLeft,d.doorRight])box('WoodDoorFrame',x,(d.glassTop+.12)/2,.05,.075,d.glassTop-.12,.12,'#c08e53');for(const y of[.12,d.doorTop,d.glassTop])box('WoodDoorRail',d.doorX,y,.05,.96,.065,.12,'#c08e53');
 glaze(d.doorX,(d.doorTop+.12)/2,.88,d.doorTop-.18);if(d.transomHeight>.06)glaze(d.doorX,(d.doorTop+d.glassTop)/2,.88,d.transomHeight-.05);
 rod('DoorHandle',[d.doorRight-.14,1.03,.14],[d.doorRight-.14,1.36,.14],.015,'#bca56d');box('Threshold',d.doorX,.08,.12,1.03,.08,.26,'#a7a99f');
 }else if(key==='sign'){
 box('BlueSignFrame',0,.45,0,w,.90,.20,'#174f6a');box('BlueSignFace',0,.45,.115,w-.14,.76,.04,'#155d82');
 for(const y of[.12,.78])box('GoldBorder',0,y,.14,w-.35,.016,.012,'#cfb478');for(const x of[-w/2+.175,w/2-.175])box('GoldBorder',x,.45,.14,.016,.66,.012,'#cfb478');
 box('NamePlaque',0,.45,.15,2.35,.50,.035,'#245e7b');plane('Name',0,.45,.175,2.2,.40,tex('name',2.2,.40));plane('LeftCopy',-w/2+.94,.46,.15,1.2,.30,tex('left',1.2,.30));plane('RightCopy',w/2-1,.46,.15,1.42,.30,tex('right',1.42,.30));
 }else if(key==='awning'){
 const a=box('StripedSlope',0,.25,.48,w+.30,.035,1.08,tex('stripe',w+.30,1.08));a.rotation.x=.34;box('StripedValance',0,.04,1.0,w+.30,.17,.04,tex('stripe',w+.30,.17));rod('AwningHem',[-w/2-.15,-.05,1.02],[w/2+.15,-.05,1.02],.018,'#d6dbd2');
 }else if(key==='wallrack'||key==='island'){
 const sample=shared('showcase',options);
 const level=key==='island'?[.96]:[.86,1.34,1.82],ww=key==='island'?1.6:1.4,dd=key==='island'?.95:.7;
 box('WoodCabinet',0,.41,0,ww,.82,dd,tex('wood',ww,.82));
 for(const y of level){box('OpenShelf',0,y-.035,0,ww,.04,dd,'#ae8254');for(const child of sample.children){if(!['TexturedBreadGroup','PriceCard','BreadTray'].includes(child.name)||child.position.y>1.15)continue;const c=child.clone();c.position.y+=y-.88;root.add(c);}}
 if(key==='wallrack')for(const x of[-.68,.68])for(const z of[-.32,.32])box('RackPost',x,1.37,z,.025,1.12,.025,'#6c6456');
 }else if(key==='bench'){
 box('BenchSeat',0,.43,0,1.55,.10,.43,'#c29154');for(const x of[-.70,.70])box('BenchLeg',x,.22,0,.10,.44,.4,'#b27d42');box('BenchApron',0,.30,.17,1.5,.18,.05,'#d8aa69');
 }else if(key==='poster'){plane('ButterPoster',0,.31,0,.36,.62,tex('poster',.36,.62));
 }else if(key==='decal'){plane('OpenDecal',0,.10,0,.36,.20,tex('open',.36,.20));
 }else if(key==='board'){
 const tilt=.22;
 for(const s of[-1,1]){const leg=box(s>0?'AFrameFront':'AFrameBack',0,.47,s*.12,.55,.94,.04,'#455858');leg.rotation.x=-s*tilt;}
 const paper=plane('PinkBreadPoster',0,.47+.03*Math.cos(tilt)+.024*Math.sin(tilt),.12-.03*Math.sin(tilt)+.024*Math.cos(tilt),.48,.78,tex('board',.48,.78));paper.rotation.x=-tilt;
 rod('TopHinge',[-.26,.934,0],[.26,.934,0],.018,'#596360');
 }else if(key==='fridge'){
 box('FridgeBox',0,.95,0,.7,1.9,.65,'#bfc9c2');plane('DrinkDoors',0,.95,.33,.64,1.8,tex('fridge',.64,1.8));
 }else if(key==='coffee'){
 box('CoffeeCounter',0,.48,0,1.3,.96,.65,'#9b9d8f');box('Worktop',0,.98,0,1.3,.04,.65,'#c8c7b8');box('EspressoMachine',-.23,1.22,-.1,.65,.44,.36,'#58615d');box('MachineFront',-.23,1.2,.09,.6,.18,.02,'#c6c7b4');box('Grinder',.4,1.18,-.12,.2,.36,.22,'#5b635b');box('BeanHopper',.4,1.43,-.12,.22,.14,.22,'#9b8e74');
 }
 root.userData={key,assetId:PREFIX+key,dimensions:d};return root;
}
