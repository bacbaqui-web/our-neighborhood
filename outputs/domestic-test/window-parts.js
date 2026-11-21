import * as T from 'three';
import {FacadeBatch,emitWindow} from './korean-facades.js?v=windows20';
import {applyWallTexture} from './facade-textures.js?v=masonry19';

// Local coordinates: opening centre is (0, 0, 0), outside is +Z,
// facade plane is Z=0. Widths and heights describe the outer frame.
export const basicWindowCatalog=[
 {id:'small',name:'작은 방 두짝창',width:.95,height:.9,pattern:'white-slider'},
 {id:'room',name:'방 두짝창',width:1.6,height:1.25,pattern:'white-slider'},
 {id:'living',name:'거실 큰 두짝창',width:2.6,height:1.65,pattern:'white-slider'},
 {id:'wide',name:'거실 세짝창',width:3,height:1.7,pattern:'wide-slider'},
 {id:'veranda',name:'베란다 네짝창',width:3.5,height:1.9,pattern:'veranda'},
 {id:'bath',name:'욕실 불투명창',width:.65,height:.6,pattern:'frosted'},
 {id:'stair',name:'계단실 세로창',width:.75,height:1.8,pattern:'stair'},
 {id:'basement',name:'반지하 가로창',width:1.3,height:.55,pattern:'basement'},
];
export const windowAccessoryCatalog=[
 {id:'flat-guard',name:'평면 방범창',note:'창 앞에 얕게 붙는 세로살입니다.'},
 {id:'box-guard',name:'돌출 방범창',note:'앞과 양옆을 둘러 막는 방범창입니다.'},
 {id:'projecting-railing',name:'돌출형 창문 난간',note:'사진처럼 큰 창문 아래쪽을 감싸는 금속 난간입니다.'},
 {id:'support-rack',name:'창문 앞 받침대',note:'가로 받침살과 삼각 지지대로 만듭니다. 난간과 함께 붙일 수 있습니다.'},
 {id:'awning',name:'빗물 차양',note:'창 위에 놓는 얇은 지붕과 지지대입니다.'},
 {id:'sill',name:'창 아래 물끊기 턱',note:'벽 안쪽 창틀 아래에서 바깥까지 이어지는 턱입니다.'},
];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number(v)));
export function windowOptions(options={}){
 const row=basicWindowCatalog.find(r=>r.id===options.type)||basicWindowCatalog[1];
 const value=(v,fallback,a,b)=>clamp(Number.isFinite(Number(v))?v:fallback,a,b);
 return {type:row.id,width:value(options.width,row.width,.55,3.8),height:value(options.height,row.height,.45,2.2),
  recess:value(options.recess,.14,0,.25),frame:options.frame==='brown'?'brown':'white',wall:options.wall??true,
  wallTexture:options.wallTexture||'gray-stone',guard:['flat-guard','box-guard','projecting-railing'].includes(options.guard)?options.guard:'none',
  rack:!!options.rack,awning:!!options.awning,sill:options.sill??true};
}
export function createWindowUnit(type,options={}){
 const o=windowOptions({...options,type}),row=basicWindowCatalog.find(r=>r.id===o.type),b=new FacadeBatch();
 // Existing sash generator is reused without its bundled accessories or sill.
 // Its frame centre is at +0.110m; move that centre behind the facade plane.
 emitWindow(b.writer([0,0,-o.recess-.110]),row.pattern,o.width,o.height,2,o.frame==='brown'?0x62564c:0xe0e2d9,null,{sill:false,accessories:false});
 const group=b.finish(row.name);group.userData={partType:'window',...o,frameCenterZ:-o.recess,glassZ:-o.recess-.007};return group;
}
export function createWindowAccessory(id,options={}){
 const o=windowOptions(options),w=o.width,h=o.height,b=new FacadeBatch(),out=b.writer(),{box:B,rod:R}=out;
 const steel=0x9ba7a5,dark=0x43504c,at=(x,y,z)=>[x,y,z],tube=(a,c,r=.017,color=steel)=>R(a,c,r,color,r<=.011?4:6);
 const bottom=-h/2-.045,depth=.46;let bars=0;
 const barXs=width=>{const n=Math.max(3,Math.ceil(width/.18));return Array.from({length:n-1},(_,i)=>-width/2+(i+1)*width/n);};
 const mount=(x,y)=>{B(x,y,.026,.085,.09,.045,steel);};
 if(id==='flat-guard'||id==='box-guard'){
  const d=id==='box-guard'?.30:.07,y0=-h/2+.025,y1=h/2-.025;
  for(const y of [y0,y1])B(0,y,d,w,.027,.032,dark);
  for(const x of [-w/2+.014,w/2-.014]){B(x,0,d,.027,h-.027,.032,dark);for(const y of [y0,y1]){B(x,y,d/2,.027,.027,d,dark);mount(x,y);}}
  for(const x of barXs(w)){B(x,0,d,.018,h-.05,.024,dark);bars++;}
  B(0,-h*.18,d-.02,w-.028,.025,.024,dark);
  if(id==='box-guard')for(const x of [-w/2+.014,w/2-.014])B(x,0,d/2,.02,h-.05,.024,dark);
 }else if(id==='projecting-railing'){
  const top=bottom+Math.min(.95,h*.64),left=-w/2-.045,right=w/2+.045;
  for(const y of [bottom+.07,top]){
   tube(at(left,y,.025),at(left,y,depth-.075));tube(at(left,y,depth-.075),at(left+.075,y,depth));
   tube(at(left+.075,y,depth),at(right-.075,y,depth));tube(at(right-.075,y,depth),at(right,y,depth-.075));tube(at(right,y,depth-.075),at(right,y,.025));
  }
  for(const x of barXs(w)){tube(at(x,bottom+.07,depth),at(x,top,depth),.009);bars++;}
  for(const x of [left,right]){for(const z of [.15,.30])tube(at(x,bottom+.07,z),at(x,top,z),.009);for(const y of [bottom+.07,top])mount(x,y);}
 }else if(id==='support-rack'){
  for(const z of [.03,depth])tube(at(-w/2-.04,bottom,z),at(w/2+.04,bottom,z),.019);
  for(const x of barXs(w+.08)){tube(at(x,bottom,.03),at(x,bottom,depth),.011);bars++;}
  for(const x of [-w*.39,w*.39]){tube(at(x,bottom,.02),at(x,bottom,depth),.019);tube(at(x,bottom-.34,.025),at(x,bottom,depth-.04),.017);mount(x,bottom-.34);}
 }else if(id==='awning'){
  B(0,h/2+.12,.25,w+.24,.045,.62,0x849b91,true);
  for(const x of [-w*.38,w*.38]){tube(at(x,h/2-.13,.025),at(x,h/2+.10,.50),.012);mount(x,h/2-.13);}
 }else if(id==='sill'){
  const back=-o.recess-.04,front=.105;B(0,-h/2-.032,(back+front)/2,w+.075,.064,front-back,0xbec0b6,true);
  B(0,-h/2-.065,.078,w+.045,.012,.018,0x707972);
 }else throw Error('Unknown window accessory: '+id);
 const group=b.finish(windowAccessoryCatalog.find(r=>r.id===id).name);group.userData={partType:'window-accessory',accessoryId:id,width:w,height:h,barCount:bars,rodRadius:.009};return group;
}
export function createWindowWall(options={}){
 const o=windowOptions(options),W=o.width+.88,H=o.height+.88,hx=o.width/2+.012,hy=o.height/2+.012;
 const shape=new T.Shape();shape.moveTo(-W/2,-H/2);shape.lineTo(W/2,-H/2);shape.lineTo(W/2,H/2);shape.lineTo(-W/2,H/2);shape.closePath();
 const hole=new T.Path();hole.moveTo(-hx,-hy);hole.lineTo(-hx,hy);hole.lineTo(hx,hy);hole.lineTo(hx,-hy);hole.closePath();shape.holes.push(hole);
 const geometry=new T.ExtrudeGeometry(shape,{depth:.32,bevelEnabled:false});geometry.translate(0,0,-.32);
 const mesh=applyWallTexture(new T.Mesh(geometry,new T.MeshStandardMaterial({color:0xb0b2a7,roughness:1})),o.wallTexture);
 mesh.name='구멍이 있는 외벽';mesh.userData={...mesh.userData,partType:'window-wall',opening:[-hx,-hy,hx,hy],frontZ:0,backZ:-.32};return mesh;
}
export function createWindowAssembly(options={}){
 const o=windowOptions(options),g=new T.Group();g.name='창문과 부착물';g.userData={partType:'window-assembly',options:o};
 if(o.wall)g.add(createWindowWall(o));g.add(createWindowUnit(o.type,o));
 for(const id of [o.guard,o.rack?'support-rack':null,o.awning?'awning':null,o.sill?'sill':null])if(id&&id!=='none')g.add(createWindowAccessory(id,o));
 return g;
}
