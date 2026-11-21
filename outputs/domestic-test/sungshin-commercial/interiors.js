import * as T from 'three';
import {addInteriorFurniture} from '../shops/interior-furniture.js?v=shop50v3';

// The existing shop collection owns these two original comic atlases. All rooms share
// their images; per-building materials and geometry remain disposable by the viewer.
const textureFiles=[
  ['fixtures','../shops/textures/furniture-v2.png'],
  ['goods','../shops/textures/comic-interior/trade-surfaces.png'],
];
const atlas=Object.fromEntries(textureFiles.map(([key])=>{
  const texture=new T.Texture();texture.name='SungshinInterior-'+key;texture.colorSpace=T.SRGBColorSpace;
  texture.userData.sharedShopInterior=true;return [key,texture];
}));
let pending;
export function prepareCommercialInteriors(){
  if(typeof document==='undefined')return Promise.resolve();
  return pending??=Promise.all(textureFiles.map(async([key,file])=>{
    const image=new Image();
    await new Promise((resolve,reject)=>{
      image.onload=resolve;image.onerror=()=>reject(Error('상가 실내 그림을 읽지 못했습니다. '+file));
      image.src=new URL(file,import.meta.url).href;
    });
    atlas[key].image=image;atlas[key].needsUpdate=true;
  })).catch(error=>{pending=undefined;throw error;});
}

// Interior programmes are inferred from the observed exterior. Several buildings
// house adjacent tenants; these have separate walls and furniture programmes.
const tenantTypes=[
  'meal','meal','dessert','grill','meal','meal','bakery','meal','meal','snack',
  'studio','meal','studio','studio','noodles','salon','cafe','snack','dessert','arcade',
  'arcade','fashion','meal','fashion','cafe','market','salon','market','estate','market',
  'dessert','pharmacy','bakery','cafe','meal','cafe','optical','arcade','beauty','cafe',
  'shoes','arcade','vacant','optical','nail','arcade','electronics','fashion','fashion','socks',
];
const divisions={
  25:[[.42,'cafe'],[.76,'market'],[1,'pickup']],
  28:[[.265,'dessert'],[.55,'market'],[.80,'snack'],[1,'beauty']],
  38:[[.32,'dessert'],[.71,'arcade'],[1,'fashion']],
  41:[[.48,'shoes'],[1,'snack']],
  48:[[.287,'fashion'],[.601,'vintage'],[1,'meal']],
};
const finishes={
  meal:['terrazzo','tile','plaster'],grill:['slate','brick','acoustic'],noodles:['timber','timber','plaster'],
  snack:['tile','tile','acoustic'],cafe:['timber','plaster','timber'],dessert:['terrazzo','rose','plaster'],
  bakery:['timber','cream','plaster'],market:['tile','cream','acoustic'],pickup:['slate','plaster','acoustic'],
  fashion:['timber','cream','plaster'],vintage:['slate','brick','timber'],socks:['timber','plaster','acoustic'],
  shoes:['slate','cream','plaster'],optical:['terrazzo','plaster','acoustic'],beauty:['tile','rose','acoustic'],
  salon:['timber','cream','plaster'],nail:['terrazzo','rose','plaster'],pharmacy:['tile','mint','acoustic'],
  arcade:['slate','acoustic','acoustic'],music:['slate','acoustic','acoustic'],electronics:['slate','plaster','acoustic'],
  estate:['timber','cream','acoustic'],studio:['terrazzo','plaster','acoustic'],vacant:['terrazzo','plaster','plaster'],
};
const colours={terrazzo:[182,177,163],tile:[204,205,193],slate:[109,113,115],timber:[185,153,112],brick:[171,136,112],plaster:[214,211,194],acoustic:[182,183,175],cream:[220,209,184],rose:[212,189,184],mint:[191,207,189]};
const finishMaps=new Map();
function finishTexture(key){
  if(finishMaps.has(key))return finishMaps.get(key);
  const n=128,rgba=new Uint8Array(n*n*4),rgb=colours[key];
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const noise=((x*73+y*151+x*y*7)%43)/43;
    let light=(noise-.5)*3;
    if(key==='timber'){
      const slat=Math.floor(y/32),offset=slat%2*64;
      light+=Math.sin((y+Math.sin(x*.098)*.86)*1.18)*2.7+slat*1.3;
      if(y%32<2||(x+offset)%128<2)light-=22;
    }else if(key==='tile'||key==='slate'){
      if(x%64<2||y%64<2)light-=key==='tile'?24:15;
      else if(x%64===2||y%64===2)light+=4;
    }else if(key==='brick'){
      if(y%25===0||(x+Math.floor(y/25)%2*32)%64<2)light+=18;
    }else if(key==='acoustic'){
      if(x===0||y===0)light-=23;
      else if(x%9<2&&y%9<2)light-=13;
    }else if(key==='terrazzo'&&noise>.92)light+=noise>.96?14:-12;
    else if(['mint','rose','cream'].includes(key)&&x%64===0)light-=5;
    const pos=(y*n+x)*4;
    for(let c=0;c<3;c++)rgba[pos+c]=Math.round(Math.min(255,Math.max(0,rgb[c]+light)));
    rgba[pos+3]=255;
  }
  const texture=new T.DataTexture(rgba,n,n,T.RGBAFormat);texture.name='RoomFinish-'+key;
  texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;
  texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;
  texture.colorSpace=T.SRGBColorSpace;texture.userData.sharedShopInterior=true;texture.needsUpdate=true;
  finishMaps.set(key,texture);return texture;
}
const stockProps=(tile,second=tile)=>({
  category:'alley',tradeSurface:tile,interiorProps:[
    {kind:'shelf',x:-.21,z:-.83,w:.51,h:1.74,d:.21},
    {kind:'display',x:.29,z:-.59,w:.31,h:1.05,d:.22},
  ],second,
});
const programmes={
  meal:{category:'food',chairStyle:'wood'},grill:{category:'food',chairStyle:'stool'},noodles:{category:'food',chairStyle:'bench'},
  cafe:{category:'cafe',chairStyle:'wood'},dessert:{category:'cafe',chairStyle:'upholstered'},bakery:stockProps(1,11),
  snack:{category:'food',chairStyle:'stool'},market:{category:'convenience'},pickup:stockProps(0,11),salon:{category:'salon'},
  nail:stockProps(15,8),optical:stockProps(8),beauty:stockProps(15,8),pharmacy:stockProps(15,12),
  estate:{category:'estate'},studio:stockProps(5,12),fashion:stockProps(9,10),vintage:stockProps(9,10),
  socks:stockProps(9),shoes:stockProps(10),electronics:stockProps(12),arcade:stockProps(12),music:stockProps(14,12),
};
function profileAt(s,localX,span,upper,side){
  if(upper){if(s.number===44)return 'noodles';if(s.number===43)return 'music';}
  if(side&&s.number===48)return 'meal';
  if(side&&s.number===21)return 'salon';
  const fraction=localX/span;
  const zones=divisions[s.number];
  if(zones&&!side)return zones.find(([limit])=>fraction<=limit+.001)?.[1]??zones.at(-1)[1];
  return tenantTypes[s.number-1];
}
function widthOf(o){return o.geometry.parameters.width;}
function depthOf(o){return o.geometry.parameters.depth;}
function collectRooms(root,s){
  const rooms=[];
  root.traverse(p=>{
    const floors=p.children.filter(m=>['RoomFloor','OpenShopFloor','OpenClothingFloor'].includes(m.name));
    if(!floors.length)return;
    const side=Math.abs(p.rotation.y)>.05;
    const maxX=Math.max(...floors.map(m=>m.position.x+widthOf(m)/2));
    const span=Math.max(maxX,side?s.depth:s.width);
    const candidates=floors.map(floor=>{
      const {x,y,z}=floor.position,W=widthOf(floor),D=depthOf(floor),front=z+D/2;
      const ceiling=p.children.find(m=>m.name==='RoomCeiling'&&Math.abs(m.position.x-x)<.015&&Math.abs(m.position.z-z)<.015);
      const top=ceiling?ceiling.position.y+ceiling.geometry.parameters.height/2:floor.name==='OpenShopFloor'?2.27:2.49;
      const base=y>3?y-floor.geometry.parameters.height/2:.09;
      const parts=[floor];
      if(ceiling)parts.push(ceiling);
      for(const m of p.children){
        if(!m.isMesh||m===floor||m===ceiling)continue;
        const mx=m.position.x,mz=m.position.z,mid=(y+top)/2;
        if(Math.abs(m.position.y-mid)>.08)continue;
        if(m.name==='InnerWall'&&Math.abs(mx-x)<.015&&Math.abs(mz-(front-D))<.015)parts.push(m);
        if(m.name==='InteriorReturn'&&Math.abs(Math.abs(mx-x)-W/2)<.015&&Math.abs(mz-z)<.015)parts.push(m);
        if(m.name==='Stockroom'&&floor.name==='OpenShopFloor')parts.push(m);
        if(m.name==='ClothingShopInterior'&&floor.name==='OpenClothingFloor'&&Math.abs(mx-x)<.02)parts.push(m);
      }
      return {l:x-W/2,r:x+W/2,base,top,front,parts,trade:profileAt(s,x,span,base>3,side)};
    }).sort((a,b)=>a.base-b.base||a.l-b.l);
    // Adjacent panes of one tenant look into a continuous room. Do not bridge a
    // stairwell, driveway, solid bay, or boundary between two different tenants.
    let last;
    for(const c of candidates){
      if(last&&last.p===p&&last.trade===c.trade&&Math.abs(last.base-c.base)<.02&&c.l-last.r>=-.02&&c.l-last.r<.27&&Math.abs(last.front-c.front)<.75){
        last.r=c.r;last.front=Math.min(last.front,c.front);last.top=Math.max(last.top,c.top);last.parts.push(...c.parts);
      }else{last={...c,p};rooms.push(last);}
    }
  });
  // The brick wall visible from the yard in photo 001 is solid across the
  // small apparent opening. Only the side-street door actually opens into the shop.
  const visible=rooms.filter(r=>!(s.number===1&&Math.abs(r.p.rotation.y)<.01));
  const arcs=[19,40,47].includes(s.number)?visible.filter(r=>r.p.rotation.y>.025&&r.p.rotation.y<Math.PI/2-.025):[];
  if(arcs.length<2)return visible;
  root.updateMatrixWorld(true);
  const ends=(r,x)=>root.worldToLocal(r.p.localToWorld(new T.Vector3(x,0,r.front)));
  const points=[ends(arcs[0],arcs[0].l),...arcs.map(r=>ends(r,r.r))];
  const end=points.at(-1),begin=points[0],dx=end.x-begin.x,dz=end.z-begin.z;
  const p=new T.Group();p.position.copy(begin);p.rotation.y=-Math.atan2(dz,dx);root.add(p);
  p.updateWorldMatrix(true,false);
  const W=Math.hypot(dx,dz);
  const apron=points.map(v=>p.worldToLocal(root.localToWorld(v.clone()))).map(v=>[v.x-W/2,v.z+.11]);
  return [...visible.filter(r=>!arcs.includes(r)),{p,l:0,r:W,base:arcs[0].base,top:arcs[0].top,
    front:0,parts:arcs.flatMap(r=>r.parts),trade:tenantTypes[s.number-1],curvedApron:apron}];
}

function roomSurface(parent,name,x,y,z,width,height,depth,material){
  const g=new T.BoxGeometry(width,height,depth),uv=g.attributes.uv;
  const dimensions=[[depth,height],[depth,height],[width,depth],[width,depth],[width,height],[width,height]];
  for(let face=0;face<6;face++)for(let v=0;v<4;v++){
    const i=face*4+v,[uScale,vScale]=dimensions[face];
    uv.setXY(i,uv.getX(i)*uScale/1.35,uv.getY(i)*vScale/1.35);
  }
  const mesh=new T.Mesh(g,material);mesh.name=name;mesh.position.set(x,y,z);
  mesh.receiveShadow=true;mesh.userData.shopInterior=true;mesh.userData.noPlacementCollision=true;
  parent.add(mesh);return mesh;
}
function solid(p,name,x,y,z,w,h,d,material){
  const m=new T.Mesh(new T.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.name=name;
  m.userData={shopInterior:true,noPlacementCollision:true};m.receiveShadow=true;p.add(m);return m;
}
const unitBox=new T.BoxGeometry(1,1,1).toNonIndexed();
function furniture(room,W,D,H,trade,number,materials){
  const recipe=programmes[trade];
  const batches=[[],[]],items=[];
  if(!recipe)return items;
  function addBox(name,x,y,z,w,h,d,tile,paint){
    // The near edge stays inside the glazing. A common scale preserves chairs'
    // proportions in shallow side windows, independently of either atlas.
    w=Math.min(W*.96,w*W);d=Math.min(D*.87,d*D);h=Math.min(H-.11,h);
    if(w<=.005||d<=.005||h<=.005)return;
    x=T.MathUtils.clamp(x*W,-W/2+w/2+.015,W/2-w/2-.015);
    z=T.MathUtils.clamp(z*D,-D+d/2+.08,-d/2-.08);
    y=T.MathUtils.clamp(y,h/2+.035,H-h/2-.025);
    const half=tile>=12?1:0,index=half?tile-12:tile;
    batches[half].push({x,y,z,w,h,d,index,paint});
    items.push({name,center:[x,y,z],size:[w,h,d],tile});
  }
  // Keep the entrance clear when the only aperture is a narrow glazed door.
  if(W<1.38){
    const tile=recipe.tradeSurface!==undefined?12+recipe.tradeSurface:({cafe:11,food:10,estate:9,salon:4,convenience:0}[recipe.category]??3);
    addBox('narrow-back-display',0,.93,-.90,.76,1.78,.10,tile);
  }else{
    addInteriorFurniture(addBox,{...recipe,id:'sungshin-'+String(number).padStart(2,'0')},W,D);
    if(recipe.second!==undefined&&W>2.1)addBox('secondary-goods',.29,1.44,-.91,.31,.69,.065,12+recipe.second);
    if(trade==='bakery')addBox('bakery-service-counter',.22,.48,-.48,.36,.88,.22,11);
    if(trade==='grill')addBox('meat-display',.19,1.62,-.94,.39,.59,.07,14);
    if(trade==='snack'||trade==='meal')addBox('food-preparation-board',-.18,1.65,-.94,.42,.61,.045,12);
    if(trade==='arcade'||trade==='music'){
      addBox('screen-cabinet',.27,1.31,-.78,.26,.91,.20,24);
      addBox('control-console',.27,.73,-.65,.28,.17,.22,2);
    }
  }
  const p=unitBox.attributes.position,n=unitBox.attributes.normal,uv=unitBox.attributes.uv;
  for(const [kind,boxes] of batches.entries()){
    if(!boxes.length)continue;
    const positions=[],normals=[],uvs=[],colors=[],rows=kind?4:3;
    for(const b of boxes){
      const col=b.index%4,row=Math.floor(b.index/4),color=new T.Color(b.paint??0xffffff);
      for(let i=0;i<p.count;i++){
        positions.push(b.x+p.getX(i)*b.w,b.y+p.getY(i)*b.h,b.z+p.getZ(i)*b.d);
        const nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i);normals.push(nx,ny,nz);
        // Only the printed front gets artwork. Narrow edges sample one quiet part of the same cell.
        const u=nz>.5?uv.getX(i):.975,v=nz>.5?uv.getY(i):.022;
        uvs.push((col+.015+u*.97)/4,1-(row+.985-v*.97)/rows);
        const shade=ny>.5?.92:nx!==0?.72:1;
        colors.push(color.r*shade,color.g*shade,color.b*shade);
      }
    }
    const geometry=new T.BufferGeometry();
    for(const [key,data,size] of [['position',positions,3],['normal',normals,3],['uv',uvs,2],['color',colors,3]])
      geometry.setAttribute(key,new T.Float32BufferAttribute(data,size));
    const m=new T.Mesh(geometry,materials[kind]);m.name=kind?'PrintedShopGoods':'PrintedShopFurniture';
    m.userData={shopInterior:true,noPlacementCollision:true};m.receiveShadow=true;m.castShadow=true;room.add(m);
  }
  return items;
}
// Partition intersecting fronts along their angle bisector. A side-wall return
// from one frontage must not create a full-height wall across its neighbour's glass.
function clipPolygon(points,signedDistance){
  const out=[];
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],da=signedDistance(a),db=signedDistance(b);
    if(da>=-.00001)out.push(a);
    if((da>0&&db<0)||(da<0&&db>0)){
      const f=da/(da-db);out.push([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]);
    }
  }
  return out;
}
function polygonArea(p){return Math.abs(p.reduce((sum,a,i)=>sum+a[0]*p[(i+1)%p.length][1]-p[(i+1)%p.length][0]*a[1],0))/2;}
function widthAt(points,z){
  const xs=[];
  for(let i=0;i<points.length;i++){
    const [x0,z0]=points[i],[x1,z1]=points[(i+1)%points.length];
    if(Math.abs(z0-z1)<1e-8)continue;
    const t=(z-z0)/(z1-z0);
    if(t>=-.0001&&t<=1.0001)xs.push(x0+(x1-x0)*t);
  }
  return xs.length>=2?[Math.min(...xs),Math.max(...xs)]:[0,0];
}
function splitFrontages(regions,s){
  for(const r of regions){
    r.w=r.r-r.l;
    r.depth=Math.min(Math.max(1.18,r.w*.63),Math.abs(r.p.rotation.y)>.05?2.15:3.45,Math.min(s.width,s.depth)*.49);
    r.frame=new T.Group();r.frame.position.set((r.l+r.r)/2,r.base,r.front-.11);r.p.add(r.frame);
    r.frame.updateWorldMatrix(true,false);
    r.plan=[[-r.w/2,0],[r.w/2,0],[r.w/2,-r.depth],[-r.w/2,-r.depth]];r.joins=[];
  }
  for(const r of regions)for(const other of regions){
    if(r===other||Math.abs(r.base-other.base)>.09||Math.abs(r.p.rotation.y-other.p.rotation.y)<.03)continue;
    const m=new T.Matrix4().copy(other.frame.matrixWorld).invert().multiply(r.frame.matrixWorld).elements;
    const x=([a,b])=>a*m[0]+b*m[8]+m[12],z=([a,b])=>a*m[2]+b*m[10]+m[14];
    let overlap=r.plan;
    for(const test of [q=>x(q)+other.w/2,q=>other.w/2-x(q),q=>-z(q),q=>other.depth+z(q)])overlap=clipPolygon(overlap,test);
    if(overlap.length<3||polygonArea(overlap)<.008)continue;
    const divider=q=>q[1]-z(q),next=clipPolygon(r.plan,divider);
    if(next.length<3||polygonArea(next)<.09)continue;
    r.plan=next;r.joins.push({divider,other});
  }
}
function footprintSlab(room,name,points,y,thickness,material){
  const shape=new T.Shape(points.map(([x,z])=>new T.Vector2(x,-z)));
  const geometry=new T.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false});geometry.rotateX(-Math.PI/2);
  const uv=geometry.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/1.35,uv.getY(i)/1.35);
  const m=new T.Mesh(geometry,material);m.name=name;m.position.y=y;m.receiveShadow=true;
  m.userData={shopInterior:true,noPlacementCollision:true};room.add(m);return m;
}
export function addCommercialInteriors(root,s){
  if(root.userData.commercialInteriors)return root;
  const regions=collectRooms(root,s),surfaces=new Map();
  if(!regions.length)throw Error('상가 실내를 연결할 창이나 열린 입구를 찾지 못했습니다. '+s.id);
  const material=(key,options)=>{
    if(!surfaces.has(key)){
      const m=new T.MeshStandardMaterial({roughness:.95,...options});m.userData.shopInterior=true;
      surfaces.set(key,m);
    }
    return surfaces.get(key);
  };
  const surface=key=>material('finish-'+key,{color:0xffffff,map:finishTexture(key),emissive:0x28251f,emissiveIntensity:.28});
  const prints=['fixtures','goods'].map(key=>material(key,{color:0xffffff,map:atlas[key],emissive:0xffffff,emissiveMap:atlas[key],emissiveIntensity:.16,vertexColors:true}));
  const summaries=[];splitFrontages(regions,s);
  // Retain the visible storefront, glazing, door frames, thresholds and specialised
  // displays. Replace only the old opaque window-box liners with the room shell.
  for(const region of regions){
    const {p,l,r,base,top,trade,parts}=region,W=r-l,H=top-base;
    if(W<.2||H<.35)continue;
    const D=region.depth;
    const front=region.front-.11;
    for(const part of new Set(parts)){if(part.parent){part.removeFromParent();part.geometry.dispose();}}
    const room=region.frame;room.name='CommercialInteriorRoom';
    room.userData={shopInterior:true,trade,estimatedLayout:true,size:[W,H,D]};p.add(room);
    const [floor,wall,ceiling]=finishes[trade];
    const plan=region.plan;
    room.userData.footprint=plan;
    if(region.joins.length){
      footprintSlab(room,'InteriorFloor',plan,-.07,.07,surface(floor));
      footprintSlab(room,'InteriorCeiling',plan,H,.07,surface(ceiling));
    }else{
      roomSurface(room,'InteriorFloor',0,-.035,-D/2,W,.07,D,surface(floor));
      roomSurface(room,'InteriorCeiling',0,H+.035,-D/2,W,.07,D,surface(ceiling));
    }
    if(region.curvedApron){
      const vestibule=[[-W/2,0],...region.curvedApron,[W/2,0]];
      footprintSlab(room,'CurvedSillFloor',vestibule,-.07,.07,surface(floor));
      footprintSlab(room,'CurvedSoffit',vestibule,H,.07,surface(ceiling));
    }
    for(let i=0;i<plan.length;i++){
      const a=plan[i],b=plan[(i+1)%plan.length],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
      if(Math.abs(mid[1])<.001)continue;
      const join=region.joins.find(j=>Math.abs(j.divider(mid))<.003);
      if(join&&(join.other.trade===trade||regions.indexOf(region)>regions.indexOf(join.other)))continue;
      const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
      if(len<.009)continue;
      const name=Math.abs(mid[1]+D)<.006?'InteriorBackWall':'InteriorSideWall';
      const panel=roomSurface(room,name,mid[0],H/2,mid[1],len,H,.048,surface(wall));panel.rotation.y=-Math.atan2(dz,dx);
    }
    // The original buildings already contain displays against or just behind
    // their windows. Leave that strip free; add the new family deeper inside.
    const occupied=p.children.some(o=>o.isMesh&&o.position.x>=l&&o.position.x<=r&&
      o.position.z<front-.1&&o.position.z>front-D&&o.position.y>=base&&o.position.y<top&&
      !['Glazing','UpperGlass','DoorPull','HandleFixing','WindowSill','WindowHead','WindowJamb'].includes(o.name));
    const hasDoor=p.children.some(m=>m.name==='DoorPull'&&m.position.x>=l-.02&&m.position.x<=r+.02&&m.position.y>=base&&m.position.y<=top);
    const inset=hasDoor?Math.min(.88,D*.48):occupied?Math.min(.81,D*.35):.09;
    let end=D-.075,near=widthAt(plan,-inset),far=widthAt(plan,-end);
    const minimum=Math.min(.65,W*.32);
    while(Math.min(near[1],far[1])-Math.max(near[0],far[0])<minimum&&end-inset>.40){
      end-=.09;far=widthAt(plan,-end);
    }
    const fitL=Math.max(near[0],far[0]),fitR=Math.min(near[1],far[1]);
    if(fitR-fitL<.13)throw Error('실내 가구를 놓을 폭을 확인해 주세요. '+s.id);
    const content=new T.Group();content.position.set((fitL+fitR)/2,0,-inset);content.name='FurnishingLayout';room.add(content);
    room.userData.entranceClearance=hasDoor?inset:0;
    const items=furniture(content,fitR-fitL,end-inset,H,trade,s.number,prints);
    if(trade!=='vacant'&&W>.87){
      const strip=material('light',{color:0xf1e8cb,emissive:0xf2dfae,emissiveIntensity:.24});
      solid(room,'CeilingLight',0,H-.045,-D*.49,Math.min(W*.49,1.18),.044,.17,strip);
    }
    room.userData.furniture=items;
    summaries.push({trade,width:W,height:H,depth:D,items:items.length});
  }
  // No frontage alterations. The dark-green panes of the low yellow side wall are
  // still green, but the visible glazing admits a view of its inferred studio.
  if(s.number===11)root.traverse(o=>{
    if(o.name==='UpperGlass'&&o.position.y<2.8){
      o.material=material('green-glass',{color:0x4b6256,transparent:true,opacity:.47,depthWrite:false,roughness:.24});
    }
  });
  root.userData.commercialInteriors={estimated:true,rooms:summaries};return root;
}
