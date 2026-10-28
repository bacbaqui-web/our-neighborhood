import * as T from 'three';
import {fittedRibbon} from './terrain-fit.js?v=81';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
export function createStreet(specs,elevation,roadInfo,previewType=null){
 const root=new T.Group();root.name='StreetAndFoundations';const stats={foundationSegments:0,poles:0,cars:0,people:0};const buckets={},edge=[];
 const colors={yardMetal:0x687d87,yardBlue:0x547ca0,yardYellow:0xc9ad63,yardDark:0x38434a,yardFlower:0xc78491,yardGreen:0x76976e,yardWood:0x93735a,yardWall:0xb9b3a7,yardPot:0xab806c,yardPaving:0xc3c1b3,foundation:0xaaa69e,paving:0xd0ccc2,poles:0x85888a,wire:0x343b43,car:0xa7b6bf,glass:0x405362,rubber:0x333940,people:0x647584,skin:0xd8bbaa,lamp:0xe5d9ba};
 function add(g,kind,outline=true){(buckets[kind]??=[]).push(g);if(outline){const e=new T.EdgesGeometry(g,28);edge.push(e.attributes.position.array.slice());e.dispose()}}
 function box(x,y,z,w,h,d,angle,kind){const g=new T.BoxGeometry(w,h,d);g.rotateY(angle);g.translate(x,y,z);add(g,kind)}
 function cyl(x,y,z,r,h,kind){const g=new T.CylinderGeometry(r,r,h,8);g.translate(x,y,z);add(g,kind)}
 function inside(x,z,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){let a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
 const bounds=specs.map(s=>({...s,minX:Math.min(...s.points.map(p=>p[0])),maxX:Math.max(...s.points.map(p=>p[0])),minZ:Math.min(...s.points.map(p=>p[1])),maxZ:Math.max(...s.points.map(p=>p[1]))}));
 function occupied(x,z,pad=.3){return bounds.some(s=>x>=s.minX-pad&&x<=s.maxX+pad&&z>=s.minZ-pad&&z<=s.maxZ+pad&&(inside(x,z,s.points)||pad>0&&[[pad,0],[-pad,0],[0,pad],[0,-pad]].some(([dx,dz])=>inside(x+dx,z+dz,s.points))))}
 for(const s of specs){
 // One closed skirt has shared corner sections instead of overlapping/open
 // one-metre facade strips. Its ground is sampled at the actual outer rim.
 const foundation=fittedRibbon([...s.points,s.points[0]],.10,(x,z)=>elevation(x,z)-.20,(x,z)=>Math.max(elevation(x,z)+.28,s.top-s.levels*s.floor+.12),.4);
 add(foundation,'foundation',false);stats.foundationSegments+=foundation.userData.sections.length-1;
 let area=0;s.points.forEach((a,i)=>{const b=s.points[(i+1)%s.points.length];area+=a[0]*b[1]-b[0]*a[1]});const sign=area>0?1:-1;
 s.points.forEach((a,i)=>{const b=s.points[(i+1)%s.points.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=dz/len*sign,nz=-dx/len*sign,N=Math.ceil(len);if(!len)return;
 for(let k=0;k<N;k++){const t0=k/N,t1=(k+1)/N,x0=a[0]+dx*t0,z0=a[1]+dz*t0,x1=a[0]+dx*t1,z1=a[1]+dz*t1;const cx=(x0+x1)/2+nx*.32,cz=(z0+z1)/2+nz*.32;if(!occupied(cx+nx*.3,cz+nz*.3,0)){const y=elevation(cx,cz);box(cx,y+.035,cz,len/N+.015,.07,.52,-Math.atan2(dz,dx),'paving')}
 }});}
 const polePoints=[];
 for(let x=-140;x<=140;x+=8)for(let z=-140;z<=140;z+=8){const r=roadInfo(x,z);if(!r||occupied(x,z,.65))continue;const dirs=[[1,0],[-1,0],[0,1],[0,-1]];const side=dirs.find(([dx,dz])=>!roadInfo(x+dx*1.8,z+dz*1.8)&&!occupied(x+dx*.4,z+dz*.4,.6));
 if(side&&polePoints.every(p=>Math.hypot(p.x-x,p.z-z)>26)){const y=elevation(x,z);cyl(x,y+3.6,z,.12,7.2,'poles');box(x,y+6.6,z,1.8,.10,.12,0,'poles');box(x+.2,y+4.8,z,.45,.7,.3,0,'poles');polePoints.push({x,z,y});stats.poles++}
 }
 for(let i=0;i<polePoints.length;i++){const a=polePoints[i],near=polePoints.slice(i+1).filter(b=>Math.hypot(a.x-b.x,a.z-b.z)<42).sort((b,c)=>Math.hypot(a.x-b.x,a.z-b.z)-Math.hypot(a.x-c.x,a.z-c.z))[0];if(!near)continue;const b=near;if(Array.from({length:12},(_,k)=>{const t=(k+1)/13;return occupied(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,.1)}).some(Boolean))continue;for(const off of [-.55,0,.55]){const pts=[];for(let k=0;k<=12;k++){let t=k/12;pts.push(new T.Vector3(a.x+(b.x-a.x)*t+off,a.y+6.8+(b.y-a.y)*t-Math.sin(t*Math.PI)*.55,a.z+(b.z-a.z)*t))}add(new T.TubeGeometry(new T.CatmullRomCurve3(pts),12,.023,3,false),'wire',false)}}
 const used=[];
 for(let x=-135;x<140;x+=19)for(let z=-135;z<140;z+=19){const r=roadInfo(x,z);if(!r||occupied(x,z,2.4))continue;const angle=-Math.atan2(r.uz,r.ux),ux=r.ux,uz=r.uz,nx=-uz,nz=ux;const pts=[[-2,-.95],[-2,.95],[2,-.95],[2,.95]].map(([a,b])=>[x+ux*a+nx*b,z+uz*a+nz*b]);if(pts.some(p=>!roadInfo(...p)||occupied(...p,.3)))continue;const y=elevation(x,z);box(x,y+.62,z,4.1,.8,1.7,angle,'car');box(x,y+1.22,z,2.05,.65,1.5,angle,'glass');box(x,y+1.58,z,2.2,.12,1.58,angle,'car');for(const a of [-1.3,1.3])for(const b of [-.82,.82]){const g=new T.CylinderGeometry(.31,.31,.17,10);g.rotateX(Math.PI/2);g.rotateY(angle);g.translate(x+ux*a+nx*b,y+.33,z+uz*a+nz*b);add(g,'rubber')}for(const end of [-1,1]){box(x+ux*end*2.07,y+.42,z+uz*end*2.07,.12,.18,1.55,angle,'rubber');for(const side of [-.52,.52])box(x+ux*end*2.08+nx*side,y+.79,z+uz*end*2.08+nz*side,.08,.23,.34,angle,'lamp')}stats.cars++;used.push([x,z]);}
 // Pedestrians are now authored directional image cutouts (pedestrians.js).
 // Small courtyards occupy sampled clear ground only; keep the longest-facade entry corridor open.
 const entries=specs.map(s=>{let best=null,L=0,area=0;s.points.forEach((a,i)=>{const b=s.points[(i+1)%s.points.length];area+=a[0]*b[1]-b[0]*a[1];const l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l>L){L=l;best=[a,b]}});const [a,b]=best,sign=area>0?1:-1;return {x:(a[0]+b[0])/2,z:(a[1]+b[1])/2,nx:(b[1]-a[1])/L*sign,nz:-(b[0]-a[0])/L*sign}});
 function entryBlocked(x,z,r){return entries.some(e=>{const dx=x-e.x,dz=z-e.z,t=dx*e.nx+dz*e.nz,s=dx*(-e.nz)+dz*e.nx;return t>-.5&&t<5+r&&Math.abs(s)<1.2+r})}
 function clearYard(x,z,r){for(let a=-r;a<=r+.01;a+=r||1)for(let b=-r;b<=r+.01;b+=r||1){if(occupied(x+a,z+b,.55)||roadInfo(x+a,z+b)||roadInfo(x+a+1,z+b)||roadInfo(x+a-1,z+b)||roadInfo(x+a,z+b+1)||roadInfo(x+a,z+b-1))return false}return !entryBlocked(x,z,r)}
 const assetCounts={};
 function rod(a,b,r,kind){const v=new T.Vector3(...b).sub(new T.Vector3(...a));const g=new T.CylinderGeometry(r,r,v.length(),3);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize()));g.translate((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);add(g,kind)}
 function ring(x,y,z,r,kind){const g=new T.TorusGeometry(r,.025,3,12);g.translate(x,y,z);add(g,kind)}
 function bead(x,y,z,rx,ry,rz,kind){if(Math.max(rx,ry,rz)<.014)return;const g=new T.SphereGeometry(1,6,4);g.scale(rx,ry,rz);g.translate(x,y,z);add(g,kind,false)}
 function fineRing(x,y,z,r,t,kind){const g=new T.TorusGeometry(r,t,3,10);g.translate(x,y,z);add(g,kind,false)}
 function asset(x,y,z,type){if(type===5)return;assetCounts[type]=(assetCounts[type]||0)+1;
 if(type===0){ // recycling station
 for(let i=-1;i<=1;i++){const k=['yardBlue','yardGreen','yardYellow'][i+1];box(x+i*.31,y+.38,z,.28,.7,.48,0,k);box(x+i*.31,y+.75,z,.3,.08,.52,0,'yardDark');box(x+i*.31,y+.57,z+.246,.16,.1,.02,0,'yardWall')}}
 if(type===1){ // bicycle and rack
 for(const dx of [-.32,.32]){ring(x+dx,y+.27,z,.24,'yardDark');rod([x+dx,y+.27,z],[x,y+.58,z],.025,'yardMetal')}
 rod([x-.32,y+.27,z],[x+.12,y+.28,z],.025,'yardBlue');rod([x+.12,y+.28,z],[x-.05,y+.65,z],.025,'yardBlue');rod([x-.05,y+.65,z],[x+.29,y+.65,z],.025,'yardBlue');rod([x+.29,y+.65,z],[x+.32,y+.27,z],.025,'yardMetal');bead(x-.06,y+.69,z,.12,.035,.075,'yardDark');rod([x+.29,y+.66,z-.15],[x+.29,y+.66,z+.15],.025,'yardMetal');for(const dx of [-.4,.4])rod([x+dx,y,z+.25],[x+dx,y+.6,z+.25],.035,'yardMetal');rod([x-.4,y+.6,z+.25],[x+.4,y+.6,z+.25],.035,'yardMetal')}
 if(type===2){ // condenser with fan and grille
 box(x,y+.4,z,.85,.65,.4,0,'yardWall');ring(x-.14,y+.42,z+.211,.21,'yardDark');for(let i=-2;i<=2;i++)box(x+.27,y+.42+i*.085,z+.215,.19,.025,.025,0,'yardMetal');for(const dx of [-.3,.3])box(x+dx,y+.06,z,.12,.12,.48,0,'yardDark')}
 if(type===3){ // flower bed
 box(x,y+.16,z,.95,.3,.85,0,'yardPot');box(x,y+.32,z,.83,.04,.72,0,'yardDark');for(const dx of [-.25,0,.25])for(const dz of [-.22,.22]){cyl(x+dx,y+.5,z+dz,.025,.35,'yardGreen');const g=new T.IcosahedronGeometry(.13,0);g.translate(x+dx,y+.7,z+dz);add(g,'yardFlower',false)}}
 if(type===4){ // utility cabinet
 box(x,y+.7,z,.65,1.3,.42,0,'yardMetal');box(x,y+.74,z+.218,.55,1.1,.025,0,'yardWall');box(x+.19,y+.78,z+.245,.04,.15,.04,0,'yardDark');for(let i=0;i<4;i++)box(x,y+.34+i*.07,z+.24,.4,.025,.025,0,'yardDark')}
 if(type===5){ // stacked crates
 for(let i=0;i<3;i++){box(x+(i%2)*.13,y+.15+i*.3,z,.65,.28,.55,0,'yardWood');for(const dx of [-.23,0,.23])box(x+(i%2)*.13+dx,y+.15+i*.3,z+.281,.025,.25,.025,0,'yardDark')}}
 if(type===6){ // neighborhood noticeboard
 for(const dx of [-.36,.36])cyl(x+dx,y+.7,z,.04,1.4,'yardMetal');box(x,y+1.3,z,.95,.65,.1,0,'yardWood');box(x,y+1.3,z+.06,.83,.53,.025,0,'yardWall');for(const dx of [-.24,0,.24])box(x+dx,y+1.31,z+.08,.18,.32,.015,0,dx===0?'yardYellow':'yardBlue')}
 // Small construction details share the existing checked footprint.
 if(type===1){
 for(const dx of [-.32,.32]){fineRing(x+dx,y+.27,z,.215,.009,'yardMetal');rod([x+dx,y+.27,z-.045],[x+dx,y+.27,z+.045],.028,'yardMetal');for(let i=0;i<8;i++){const a=i*Math.PI/4;rod([x+dx,y+.27,z+(i%2?.018:-.018)],[x+dx+Math.cos(a)*.21,y+.27+Math.sin(a)*.21,z],.003,'yardMetal')}for(const dz of [-.035,.035])rod([x+.29,y+.65,z+dz],[x+.32,y+.27,z+dz],.012,'yardMetal')}
 fineRing(x+.08,y+.3,z+.05,.065,.009,'yardMetal');rod([x+.08,y+.3,z+.055],[x+.08,y+.21,z+.10],.012,'yardMetal');box(x+.08,y+.2,z+.13,.09,.025,.10,0,'yardDark');rod([x+.08,y+.3,z-.04],[x+.08,y+.4,z-.10],.012,'yardMetal');box(x+.08,y+.41,z-.13,.09,.025,.10,0,'yardDark');rod([x-.32,y+.3,z+.05],[x+.08,y+.36,z+.05],.004,'yardDark');rod([x-.32,y+.24,z+.05],[x+.08,y+.24,z+.05],.004,'yardDark');for(const dz of [-.12,.12]){rod([x+.29,y+.66,z+dz-.04],[x+.29,y+.66,z+dz+.04],.019,'yardDark');rod([x+.26,y+.65,z+dz],[x+.24,y+.62,z+dz],.007,'yardMetal')}
 const cable=new T.CatmullRomCurve3([new T.Vector3(x+.25,y+.64,z+.1),new T.Vector3(x+.37,y+.56,z+.12),new T.Vector3(x+.3,y+.47,z+.04)]);add(new T.TubeGeometry(cable,10,.004,4,false),'yardDark',false);box(x-.32,y+.48,z+.03,.055,.025,.03,0,'yardFlower');for(const dx of [-.4,.4]){box(x+dx,y+.025,z+.25,.14,.05,.14,0,'yardMetal');for(const dz of [-.045,.045])bead(x+dx,y+.057,z+.25+dz,.012,.008,.012,'yardDark')}
 }
 if(type===0)for(let i=-1;i<=1;i++){const a=x+i*.31;box(a,y+.79,z-.16,.16,.035,.055,0,'yardMetal');box(a,y+.8,z,.13,.018,.085,0,'yardDark');for(const dx of [-.09,.09]){bead(a+dx,y+.08,z-.19,.045,.045,.028,'yardDark');rod([a+dx,y+.58,z-.27],[a+dx,y+.68,z-.27],.012,'yardMetal')}box(a,y+.52,z+.26,.17,.12,.01,0,'yardWall');for(let j=0;j<3;j++)box(a,y+.49+j*.026,z+.268,.10,.007,.008,0,'yardDark')}
 if(type===2){bead(x-.14,y+.42,z+.215,.17,.17,.018,'yardDark');for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const g=new T.SphereGeometry(1,6,4);g.scale(.09,.035,.009);g.rotateZ(a+.6);g.translate(x-.14+Math.cos(a)*.08,y+.42+Math.sin(a)*.08,z+.235);add(g,'yardMetal',false)}for(const r of [.11,.205])fineRing(x-.14,y+.42,z+.252,r,.0035,'yardWall');for(let i=0;i<6;i++){const a=i*Math.PI/3;rod([x-.14,y+.42,z+.254],[x-.14+Math.cos(a)*.205,y+.42+Math.sin(a)*.205,z+.254],.003,'yardWall')}bead(x-.14,y+.42,z+.26,.035,.035,.015,'yardWall');for(const dx of [-.37,.37])for(const dy of [.12,.67])bead(x+dx,y+dy,z+.208,.008,.008,.004,'yardDark');box(x+.27,y+.65,z+.21,.13,.035,.015,0,'yardBlue');for(const dz of [-.08,.08])rod([x+.44,y+.22,z+dz],[x+.44,y+.08,z+dz],.018,'yardMetal')}
 if(type===3){for(const dz of [-.41,.41])box(x,y+.32,z+dz,.98,.055,.055,0,'yardPot');for(const dx of [-.25,0,.25])for(const dz of [-.22,.22]){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;bead(x+dx+Math.cos(a)*.08,y+.71,z+dz+Math.sin(a)*.08,.055,.025,.04,'yardFlower')}bead(x+dx,y+.735,z+dz,.04,.025,.04,'yardYellow');bead(x+dx+.07,y+.48,z+dz,.08,.018,.04,'yardGreen')}}
 if(type===4){box(x,y+1.38,z,.72,.06,.48,0,'yardMetal');for(const dy of [.3,1.13])box(x-.28,y+dy,z+.24,.04,.1,.04,0,'yardMetal');box(x,y+.94,z+.243,.17,.12,.012,0,'yardYellow');rod([x,y+.98,z+.254],[x-.025,y+.93,z+.254],.008,'yardDark');rod([x-.025,y+.93,z+.254],[x+.025,y+.93,z+.254],.008,'yardDark');rod([x+.025,y+.93,z+.254],[x,y+.89,z+.254],.008,'yardDark');for(const dx of [-.22,.22])cyl(x+dx,y+.06,z,.055,.12,'yardDark')}
 if(type===5)for(let i=0;i<3;i++){const a=x+(i%2)*.13;for(const dz of [-.28,.28]){for(const dy of [-.07,.07])box(a,y+.15+i*.3+dy,z+dz,.65,.015,.02,0,'yardDark');for(const dx of [-.26,.26])for(const dy of [-.09,.09])bead(a+dx,y+.15+i*.3+dy,z+dz*1.02,.008,.008,.004,'yardMetal')}box(a,y+.17+i*.3,z+.292,.17,.055,.01,0,'yardDark')}
 if(type===6){box(x,y+1.66,z,.99,.055,.22,0,'yardMetal');for(const dx of [-.24,0,.24]){bead(x+dx,y+1.44,z+.10,.015,.015,.008,'yardFlower');for(let j=0;j<5;j++)box(x+dx,y+1.36-j*.035,z+.099,.12-(j%2)*.025,.006,.004,0,'yardDark')}for(const dx of [-.36,.36])box(x+dx,y+.06,z,.14,.12,.18,0,'yardWall')}
 }
 const yardUsed=[];stats.yards=0;stats.trees=0;stats.planters=0;stats.benches=0;
 function leaf(x,y,z,r){const g=new T.IcosahedronGeometry(r,1);g.scale(1,.85,1);g.translate(x,y,z);add(g,'yardGreen',false)}
 if(previewType!==null&&previewType>=0)asset(0,0,0,previewType);
 for(let ix=0;ix<(previewType===null?56:0);ix++)for(let iz=0;iz<56;iz++){const x=-138+ix*5,z=-138+iz*5,seed=(ix*73+iz*137)%17;if(!clearYard(x,z,.5))continue;if(yardUsed.some(p=>Math.hypot(p.x-x,p.z-z)<p.r+1.5))continue;const y=elevation(x,z);const roomy=clearYard(x,z,2);const ys=[elevation(x-1.5,z),elevation(x+1.5,z),elevation(x,z-1.5),elevation(x,z+1.5)];if(Math.max(...ys)-Math.min(...ys)>.75)continue;
 if(roomy&&seed%3!==0){box(x,y+.08,z,3.6,.16,3.6,0,'yardPaving');box(x-1.45,y+.4,z, .32,.65,3.4,0,'yardWall');box(x,y+.4,z-1.45,3.2,.65,.32,0,'yardWall');box(x-.7,y+.3,z-.5,1.05,.5,1.05,0,'yardPot');cyl(x-.7,y+1.65,z-.5,.10,2.5,'yardWood');leaf(x-.7,y+3,z-.5,1.15);leaf(x-.15,y+2.75,z-.35,.72);box(x+.7,y+.53,z+.85,1.5,.14,.5,0,'yardWood');box(x+.7,y+.89,z+1.08,1.5,.6,.1,0,'yardWood');for(const dx of [-.52,.52])box(x+.7+dx,y+.26,z+.85,.12,.45,.4,0,'yardWall');stats.yards++;stats.trees++;stats.benches++;yardUsed.push({x,z,r:2});
 }else if(seed<7){asset(x,y,z,seed);if(!stats.assetFocus||Math.hypot(x,z)<Math.hypot(stats.assetFocus[0],stats.assetFocus[2]))stats.assetFocus=[x,y,z];yardUsed.push({x,z,r:1})}else{box(x,y+.27,z,.8,.5,.8,0,'yardPot');leaf(x,y+.85,z,.5);if(seed%4===0){cyl(x,y+1.15,z,.06,1.8,'yardWood');leaf(x,y+2.1,z,.65);stats.trees++}stats.planters++;yardUsed.push({x,z,r:1})}
 }

 for(const [kind,gs] of Object.entries(buckets)){const ng=gs.map(g=>g.index?g.toNonIndexed():g);for(const g of ng)g.deleteAttribute('uv');const g=mergeGeometries(ng,false);for(const x of new Set([...gs,...ng]))x.dispose();const m=new T.Mesh(g,new T.MeshStandardMaterial({color:colors[kind],side:T.DoubleSide,roughness:kind==='yardMetal'?.42:.86,metalness:kind==='yardMetal'?.45:0}));m.name='street-'+kind;m.userData.detailKind=kind;root.add(m);if(kind.startsWith('yard')&&kind!=='yardGreen'){const line=new T.LineSegments(new T.EdgesGeometry(g,28),new T.LineBasicMaterial({color:0x3e4549}));line.name='street-yard-outline-'+kind;root.add(line)}}
 let n=edge.reduce((n,a)=>n+a.length,0),arr=new Float32Array(n),off=0;for(const a of edge){arr.set(a,off);off+=a.length}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(arr,3));const lines=new T.LineSegments(g,new T.LineBasicMaterial({color:0x25282b}));root.add(lines);if(used.length){const p=used.slice().sort((a,b)=>Math.hypot(...a)-Math.hypot(...b))[0];stats.focus=[p[0],elevation(...p),p[1]];}stats.assets=assetCounts;root.userData=stats;return root;
}
