import * as T from 'three';
import {fittedRibbon} from './terrain-fit.js?v=81';
import {fitSupportBase,footprintHeights} from './support-geometry.js?v=82';
import {seatGroundAsset} from './ground-contact.js?v=122';
import {createContactSurfaceSampler} from './contact-shadows.js?v=79';
import {createAsset,addLines} from '../alley-library/models.js?v=122';
// Architecture is dimensioned for the measured space between a facade and its parcel edge.
// It is reserved before the small asset scatter, so big functions cannot be crowded out.
export function renderAttachedStructures(plan,elevation){
 const group=new T.Group();group.name='facade-attached-architecture';const colliders=[],records=[],groundContacts=[],assetPlacements=[],supportQA={posts:0,plinths:0,wheelStops:0,groundStrips:0};
 const materials=new Map();function material(c,overlay=false){const key=c+':'+overlay;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color:c,roughness:.88,side:T.DoubleSide}));return materials.get(key)}
 const C={steel:0x586b6c,post:0xa7aaa1,wall:0xb9b6a5,trim:0xd9d3be,glass:0x536e72,wood:0x907956,concrete:0xabaeaa,dark:0x3e494a};
 for(const s of plan.structures){const g=new T.Group();g.name=s.name;const {width:w,depth:d,ux,uz,nx,nz,origin:o}=s;const angle=-Math.atan2(uz,ux),seed=Math.abs(s.owner),roofColors=[0x648b94,0x7c897c,0x9b7c6a,0x7b8588],roofColor=s.roofColor??roofColors[seed%4],roofKind=s.roofKind??'lean-metal',covered=roofKind!=='none';
 const P=(u,v)=>[o[0]+ux*u+nx*v,o[1]+uz*u+nz*v];const Y=(u,v)=>elevation(...P(u,v));const {high:hi,low:lo}=footprintHeights((a,b)=>P(w/2+a,d/2+b),w,d,elevation,.5);const roofY=hi+(s.roofHeight??2.7),roofAt=(v,u=w/2)=>roofY-.20*v/d+(roofKind==='arched-poly'?.24*Math.sin(Math.PI*v/d):roofKind==='gable-metal'?.40*(1-Math.abs(u-w/2)/(w/2)):0);
 function mesh(geo,color,name='structure-part'){const overlay=name==='yard-access-surface',m=new T.Mesh(geo,material(C[color]??color,overlay));m.name=name;m.userData.surfaceOverlay=overlay;g.add(m);return m}
 function box(u,y,v,ww,hh,dd,color,name='structure-part'){const p=P(u,v),geo=new T.BoxGeometry(ww,hh,dd,name==='shed-grounded-plinth'?Math.ceil(ww/.25):1,1,name==='shed-grounded-plinth'?Math.ceil(dd/.25):1);geo.rotateY(angle);geo.translate(p[0],y,p[1]);return mesh(geo,color,name)}
 function rod(a,b,r,color='steel'){const aa=P(a[0],a[2]),bb=P(b[0],b[2]),v1=new T.Vector3(aa[0],a[1],aa[1]),v2=new T.Vector3(bb[0],b[1],bb[1]),delta=v2.clone().sub(v1),geo=new T.CylinderGeometry(r,r,delta.length(),8);geo.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));geo.translate(...v1.add(v2).multiplyScalar(.5).toArray());return mesh(geo,color)}
 function quad(ps,col,name){let v=ps.map(p=>{const q=P(p[0],p[2]);return[q[0],p[1],q[1]]});const a=new T.Vector3(...v[1]).sub(new T.Vector3(...v[0])),b=new T.Vector3(...v[2]).sub(new T.Vector3(...v[0]));const order=a.cross(b).y<0?[0,2,1,0,3,2]:[0,1,2,0,2,3];const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(order.flatMap(i=>v[i]),3));geo.computeVertexNormals();return mesh(geo,col,name)}
 function solid(u,v,ww,dd,base,top,role){const fp=[[-ww/2,-dd/2],[ww/2,-dd/2],[ww/2,dd/2],[-ww/2,dd/2]].map(([x,z])=>P(u+x,v+z));colliders.push({fp,base,top,owner:s.owner,structure:s.id,role});}
 let pavedSurface;
 function groundBox(u,v,ww,dd,top,color,name){
  const bounds=footprintHeights((a,b)=>P(u+a,v+b),ww,dd,pavedSurface),bottom=bounds.low-.04;
  const m=box(u,(bottom+top)/2,v,ww,top-bottom,dd,color,name);fitSupportBase(m.geometry,pavedSurface);return m;
 }
 function groundStrip(u0,v0,u1,v1,width,color,name){
  const m=mesh(fittedRibbon([P(u0,v0),P(u1,v1)],width,(x,z)=>pavedSurface(x,z)+.002,(x,z)=>pavedSurface(x,z)+.006,.10),color,name);
  m.userData.surfaceOverlay=true;supportQA.groundStrips++;return m;
 }
 function asset(id,u,v,lift=0,scale=1){const a=createAsset(id);a.userData.vegetationAssetId=id;const b=new T.Box3().setFromObject(a),p=P(u,v);a.userData.localBounds=b;a.position.set(p[0],Y(u,v)-b.min.y*scale+.06+lift,p[1]);a.rotation.y=angle;a.scale.multiplyScalar(scale);if(!lift){const qa=seatGroundAsset(a,pavedSurface);groundContacts.push({id,owner:s.owner,...qa});}a.updateMatrixWorld(true);g.add(a);const bb=new T.Box3().setFromObject(a);assetPlacements.push({id,name:a.name,owner:s.owner,x:a.position.x,y:a.position.y,z:a.position.z,angle,height:bb.max.y-bb.min.y,role:s.type==='carport'?'주차면 차량':'차양 아래 생활 소품',groundFit:a.userData.groundFit,footprint:[[bb.min.x,bb.min.z],[bb.max.x,bb.min.z],[bb.max.x,bb.max.z],[bb.min.x,bb.max.z]]});return a}
 // Ground layers have real height separation. A strong depth bias would hide
 // parking paint and lift the apparent floor over tyre/column contacts.
 // Flush concrete apron follows the terrain, with visible expansion joints and parking paint.
 for(let x=0;x<w;x+=.8)for(let z=0;z<d;z+=.8){const xx=Math.min(w,x+.8),zz=Math.min(d,z+.8);quad([[x,Y(x,z)+.085,z],[xx,Y(xx,z)+.085,z],[xx,Y(xx,zz)+.085,zz],[x,Y(x,zz)+.085,zz]],s.type==='carport'?0x9daba9:0xb4b0a2,'yard-access-surface');}
 pavedSurface=createContactSurfaceSampler([g],elevation);
 for(let x=1.2;x<w;x+=2.4)groundStrip(x,.05,x,d-.05,.018,0x8a8f87,'apron-expansion-joint');
 // Roofs express an actual use; open parking has no columns, gutter or overhead light.
 if(covered){
  const count=roofKind==='arched-poly'?12:1;
  if(roofKind==='gable-metal'){
   for(const [a,b] of [[0,w/2],[w/2,w]])quad([[a,roofAt(0,a),0],[b,roofAt(0,b),0],[b,roofAt(d,b),d],[a,roofAt(d,a),d]],roofColor,'gable-roof');
   rod([w/2,roofAt(0)+.025,0],[w/2,roofAt(d)+.025,d],.05,roofColor);
  }else for(let j=0;j<count;j++){const a=d*j/count,b=d*(j+1)/count;quad([[0,roofAt(a),a],[w,roofAt(a),a],[w,roofAt(b),b],[0,roofAt(b),b]],roofColor,roofKind);}
  // A folded flashing closes the measured facade gap without another freestanding back row.
  quad([[0,roofAt(0,0)+.08,-.16],[w,roofAt(0,w)+.08,-.16],[w,roofAt(0,w),.04],[0,roofAt(0,0),.04]],roofColor,'wall-flashing');
  const pitch=['arched-poly','flat-poly'].includes(roofKind)?.65:.30;
  for(let x=.04;x<w;x+=pitch)for(let j=0;j<count;j++){const a=d*j/count,b=d*(j+1)/count;rod([x,roofAt(a,x)+.016,a],[x,roofAt(b,x)+.016,b],.012,roofColor);}
  box(w/2,roofAt(d,0)-.03,d-.04,w,.07,.07,'steel');
  const brackets=Math.max(2,Math.ceil(w/1.4));for(let j=0;j<brackets;j++){const x=.12+(w-.24)*j/(brackets-1);rod([x,roofAt(0,x)-.46,.02],[x,roofAt(d,x)-.065,d-.09],.019,'steel');rod([x,roofAt(0,x)-.05,.02],[x,roofAt(d,x)-.065,d-.09],.022,'steel');}
  if(d>1.6&&!['shed','workshop'].includes(s.type))for(const x of [.12,w-.12]){const z=d-.12,base=pavedSurface(...P(x,z)),top=roofAt(z,x),footTop=footprintHeights((a,b)=>P(x+a,z+b),.15,.15,pavedSurface).high+.07;groundBox(x,z,.075,.075,top,'post','canopy-grounded-post');groundBox(x,z,.15,.15,footTop,'concrete','canopy-footing');supportQA.posts++;solid(x,z,.18,.18,base,top,'post');}
  if(d>1.6){box(w/2,roofAt(d,0)+.025,d-.065,w,.065,.09,'trim');rod([w-.14,roofAt(d,w-.14)-.02,d-.14],[w-.14,pavedSurface(...P(w-.14,d-.14))+.02,d-.14],.027,'trim');}
 }
 const enclosed=['shed','workshop'].includes(s.type);
 if(enclosed){const floor=hi+.09,H=roofAt(d,0)-floor;
  // The plinth closes terrain gaps. Walls terminate against the existing facade.
  groundBox(w/2,d/2,w,d,floor,'concrete','shed-grounded-plinth');supportQA.plinths++;box(w/2,floor+.05,.05,w,.1,.1,'trim');
  for(const x of [.07,w-.07])box(x,(floor+roofY-.12)/2,d/2,.14,roofY-.12-floor,d,'wall');
  box(w/2,(floor+roofAt(d,0))/2,d-.065,w,H,.13,seed%2?'wall':'concrete');
  const doorW=Math.min(w-.6,s.type==='workshop'?2.65:1.35),doorH=Math.min(2.25,H-.15);
  box(w*.5,floor+doorH/2,d+.015,doorW+.14,doorH+.1,.055,'steel');
  for(let y=floor+.09;y<floor+doorH;y+=.105)box(w/2,y,d+.05,doorW,.086,.025,seed%2?0x829094:0x999989);
  box(w/2+.36,floor+.92,d+.073,.24,.04,.025,'dark');
  for(let x=.36;x<w-.2;x+=.48){if(Math.abs(x-w/2)<doorW/2+.2)continue;box(x,(floor+roofAt(d))/2,d+.013,.028,H-.08,.02,'trim');}
  box(w*.24,roofAt(d)-.3,d+.026,.38,.19,.035,'dark');for(let k=0;k<4;k++)box(w*.24,roofAt(d)-.37+k*.045,d+.05,.36,.013,.025,'trim');
  if(roofKind==='gable-metal')for(const v of [.02,d-.015])quad([[0,roofAt(v,0),v],[w/2,roofAt(v,w/2),v],[w,roofAt(v,w),v],[0,roofAt(v,0),v]],C.wall,'shed-gable');
  solid(w/2,d/2,w,d,lo,roofY+.4,'enclosed-room');
 }else{
  // Furnishings belong to the covered activity, not the middle of the remaining courtyard.
  if(s.type==='carport'&&s.car){const {x,z}=s.car;asset(seed%7===0?173:seed%2?211:212,x,z);
solid(x,z,3.8,1.8,Y(x,z),Y(x,z)+1.95,'parked-car');
   for(const x1 of [x-2,x+2])if(x1>.18&&x1<w-.18)groundStrip(x1,.2,x1,d-.15,.05,'trim','parking-paint');
   for(const side of [-1,1]){const center=z+side*.68;mesh(fittedRibbon([P(x-1.48,center-.20),P(x-1.48,center+.20)],.12,(xx,zz)=>pavedSurface(xx,zz)-.015,(xx,zz)=>pavedSurface(xx,zz)+.10,.12),'dark','grounded-wheel-stop');supportQA.wheelStops++;}
  }else{
   // Planner-provided clear subzones also keep canopy posts and belongings off door routes.
   for(const item of s.furnishings||[]){asset(item.id,item.x,item.z);solid(item.x,item.z,item.width,item.depth,Y(item.x,item.z),Y(item.x,item.z)+item.height,'covered-furnishing');}
  }
  // A shallow roof-mounted light stays above the walking clearance.
  if(covered)box(w*.5,roofAt(d*.4)-.16,d*.4,Math.min(.65,w*.3),.04,.09,'trim');
 }
 addLines(g);g.traverse(m=>{if(m.userData.surfaceOverlay)for(const line of [...m.children])if(line.isLineSegments){m.remove(line);line.geometry.dispose();line.material.dispose();}});group.add(g);records.push({...s,base:lo,roofClearance:s.roofHeight,roofHeight:roofY,x:P(w/2,d/2)[0],z:P(w/2,d/2)[1]});
 }
 group.userData.groundContacts=groundContacts;group.userData.supportFit=supportQA;return{group,colliders,records,groundContacts,assetPlacements};
}
