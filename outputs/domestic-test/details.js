import {emitFacility,addFacilityLabels} from './facilities/models.js';
import {planGasNetwork,emitGasNetwork} from './gas-network.js?v=59.1';
import * as T from 'three';
import {addBoundaryRibbon} from './boundary-geometry.js?v=82';
import {footprintHeights} from './support-geometry.js?v=82';
import {planRooftops,rooftopCatalog} from './rooftop-plan.js?v=41';
import {emitRooftop} from './rooftops.js?v=41';
import {windowLightBand} from './environment-policy.js?v=32';
import {FacadeBatch,facadeStyles,windowCatalog,emitWindow,emitAircon} from './korean-facades.js?v=137';
export function createDetails(buildings,elevation,architecture={structures:[]},options={}){
 const gasNetworks=[],nightWindowSources=[],windowBands=Array(16).fill(0),batch=new FacadeBatch(options.minimumLOD||0),spots=[],placementProxies=[],windowTypes={},counts={windows:0,skippedNarrowWindows:0,doors:0,roofs:0,aircons:0,downpipes:0,guardWindows:0,doorCanopies:0,shelteredDoors:0};
 const rooftopPlans=planRooftops(buildings),roofsByBuilding=new Map(rooftopPlans.map(p=>[p.buildingIndex,p]));
 const households=new Map((architecture.households||[]).map(h=>[h.owner,h]));
 const styleCounts=Array(6).fill(0),boxes=buildings.map(b=>({b,minX:Math.min(...b.points.map(p=>p[0])),maxX:Math.max(...b.points.map(p=>p[0])),minZ:Math.min(...b.points.map(p=>p[1])),maxZ:Math.max(...b.points.map(p=>p[1]))}));
 const inside=(x,z,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
 const occupied=(x,z,owner)=>boxes.some(q=>q.b.seed!==owner&&x>=q.minX&&x<=q.maxX&&z>=q.minZ&&z<=q.maxZ&&inside(x,z,q.b.points));
 function segments(lo,hi,cuts){let a=[[lo,hi]];for(const [c,d] of cuts)a=a.flatMap(([x,y])=>d<=x||c>=y?[[x,y]]:[[x,Math.min(y,c)],[Math.max(x,d),y]].filter(([u,v])=>v-u>.008));return a;}
 for(const [buildingIndex,b] of buildings.entries()){
  if(b.arterialKiosk||(options.owners&&!options.owners.has(b.seed)))continue;
  batch.inkObjectId=b.inkObjectId;
  if(b.facility){counts.windows+=emitFacility(batch,b,buildings,elevation).windows;continue;}
  const gasFaces=[];
  const {points,top,base,floor,levels,seed,holes}=b,style=facadeStyles[Math.abs(seed)%6],covers=architecture.structures.filter(s=>s.owner===seed&&s.roofKind!=='none'),annexes=architecture.structures.filter(s=>s.owner===seed&&['shed','workshop'].includes(s.type));styleCounts[Math.abs(seed)%6]++;
  let signed=0;for(let i=0;i<points.length;i++){const a=points[i],c=points[(i+1)%points.length];signed+=a[0]*c[1]-c[0]*a[1]}const sign=signed>=0?1:-1;
  const front=Number.isInteger(b.frontEdge)?b.frontEdge:points.reduce((k,p,i)=>Math.hypot(points[(i+1)%points.length][0]-p[0],points[(i+1)%points.length][1]-p[1])>Math.hypot(points[(k+1)%points.length][0]-points[k][0],points[(k+1)%points.length][1]-points[k][1])?i:k,0);
  for(let i=0;i<points.length;i++){
   const a=points[i],c=points[(i+1)%points.length],L=Math.hypot(c[0]-a[0],c[1]-a[1]);if(L<.35)continue;
   const ux=(c[0]-a[0])/L,uz=(c[1]-a[1])/L,nx=uz*sign,nz=-ux*sign,out=batch.writer([a[0],0,a[1]],ux,uz,nx,nz),B=out.box,Q=out.quad,R=out.rod;
   const proxy=(u,y,z,w,h,d)=>{const corners=[];for(const yy of [-1,1])for(const zz of [-1,1])for(const xx of [-1,1])corners.push([a[0]+ux*(u+xx*w/2)+nx*(z+zz*d/2),y+yy*h/2,a[1]+uz*(u+xx*w/2)+nz*(z+zz*d/2)]);placementProxies.push(corners);};
   const sheltered=u=>covers.some(s=>inside(a[0]+ux*u+nx*.38,a[1]+uz*u+nz*.38,s.footprint));
   const groundAt=u=>elevation(a[0]+ux*u+nx*.3,a[1]+uz*u+nz*.3);
   const facadeClear=(u,depth=.8)=>!occupied(a[0]+ux*u+nx*depth,a[1]+uz*u+nz*depth,seed);
   B(L/2,top+.29,0,L,.58,.18,style.wall,true);B(L/2,top+.61,0,L+.025,.065,.28,0xc0beb0,false);
   const exposed=[.2,.5,.8].some(t=>facadeClear(L*t));if(!exposed)continue;
   // Distant facades keep the color, window rhythm and night lights, without
   // generating sash solids, mortar, equipment or tiny frame components.
   if(options.minimumLOD>=2){
    const bays=Math.max(1,Math.floor((L-.6)/3.35)),space=(L-.6)/bays;
    for(let f=0;f<levels;f++)for(let j=0;j<bays;j++){
     const u=.3+space*(j+.5),fy=top-(levels-f)*floor+floor*.57,w=Math.min(1.85,space-.35),h=1.3;
     if(!facadeClear(u,.4)||(b.storefronts||[]).some(p=>p.edge===i&&u>=p.lo&&u<=p.hi&&f===0))continue;
     const band=windowLightBand(seed*997+i*131+f*31+j);
     Q(u,fy,.035,w,h,style.frame,false);out.lit(band,()=>Q(u,fy,.045,w-.10,h-.10,0x79999a,false));
     counts.windows++;windowBands[band]++;
    }
    continue;
   }

   const arterialFace=(b.arterialFacades||[]).find(p=>p.edge===i);
   const shops=(b.storefronts||[]).filter(p=>p.edge===i);
   const shopOpening=p=>[p.lo-.12,p.hi+.12,p.groundMin-.05,p.position[1]+p.height+.12];
   const shopRects=shops.map(shopOpening);
   const shopHits=(lo,hi,bottom,ceil)=>shopRects.some(r=>hi>r[0]&&lo<r[1]&&ceil>r[2]&&bottom<r[3]);
   const openings=shopRects.slice();const isFront=i===front,entry=isFront?(b.frontage?.entry??L/2):null;
   // Long horizontal sashes, smaller wet-room windows, and a distinct stair column.
   const bays=Math.max(1,Math.floor((L-.6)/3.35)),space=(L-.6)/bays;
   for(let f=0;f<levels;f++){
    const commercialGround=groundAt(L/2),commercialFloor=(top-commercialGround)/levels;
    const fy=arterialFace?commercialGround+f*commercialFloor:top-(levels-f)*floor;
    if(arterialFace&&f===0){
     const g=Math.max(fy,groundAt(L/2)),units=Math.max(1,Math.floor(L/6.5)),span=(L-.15)/units;
     for(let k=0;k<units;k++){
      const x=.075+(k+.5)*span,w=span-.16,h=Math.max(1.4,fy+commercialFloor-.65-g);
      if(shopHits(x-w/2,x+w/2,g,fy+3))continue;
      B(x,g+.12,.08,w,.24,.12,0x758582,false);
      const panes=Math.max(2,Math.round(w/1.2)),pw=w/panes;
      for(let j=0;j<panes;j++){
       const xx=x-w/2+(j+.5)*pw;out.lit(windowLightBand(seed+i*31+k),()=>Q(xx,g+.25+h/2,.12,pw-.05,h,0x64878b,false));
       B(xx-pw/2,g+.25+h/2,.15,.04,h,.06,0x3e5357,false);
       if(j===1)B(xx+pw*.3,g+1.20,.19,.025,.44,.035,0xaabbb5,false);
      }
      B(x+w/2,g+.25+h/2,.15,.04,h,.06,0x3e5357,false);
      B(x,fy+commercialFloor-.19,.15,w,.35,.22,k%2?0xa3816e:0xc3cbc3,false);B(x,fy+commercialFloor-.38,.19,w,.055,.24,k%2?0x8c4740:0x637d6b,false);
      out.detail(1,()=>{B(x,g+.028,.34,w,.055,.55,0x9ca79f,false);for(const xx of [x-w*.4,x+w*.4])B(xx,fy+commercialFloor-.47,.23,.16,.06,.12,0xd4dacb,false);});
      openings.push([x-w/2,x+w/2,g,fy+commercialFloor]);counts.windows+=panes;windowBands[windowLightBand(seed+i*31+k)]+=panes;
     }
     continue;
    }
    if(arterialFace&&f>0){
     const ribbon=arterialFace.style==='ribbon-glass',start=.06,end=L-.06,ww=end-start,center=L/2;
     const glassBottom=fy+commercialFloor*(ribbon?.31:.083),glassHeight=commercialFloor*(ribbon?.64:.867);
     // Tile the facade by disjoint wall/window rectangles: no residential sashes behind it.
     B(center,fy+commercialFloor*(ribbon?.153:.04),.045,ww,commercialFloor*(ribbon?.30:.073),.07,ribbon?0xb9c4c1:0x667d80,false);B(center,fy+commercialFloor-.04,.045,ww,.08,.07,ribbon?0xb9c4c1:0x667d80,false);
     const count=Math.max(1,Math.ceil(ww/1.35)),bay=ww/count;
     for(let k=0;k<count;k++){
      const x=start+(k+.5)*bay,h=glassHeight,w=bay-.052,y=glassBottom+h/2;
      out.lit(windowLightBand(seed*997+i*131+f*31+k),()=>Q(x,y,.090,w,h,[0x597b87,0x658b96,0x71939a][(k+f)%3],false));
      counts.windows++;windowBands[windowLightBand(seed*997+i*131+f*31+k)]++;windowTypes['commercial-glass']=(windowTypes['commercial-glass']||0)+1;
      B(start+k*bay,glassBottom+h/2,.11,.044,h,.055,0x485e64,false);
      if(ribbon)out.detail(1,()=>B(x,glassBottom+.43,.12,w,.035,.035,0x485e64,false));
      if(!ribbon&&f<4&&(k+f)%7===0)Q(x,glassBottom+.32,.13,w*.9,.48,[0xc0c7bd,0x527c8e,0x9e665d][f%3],false);
     }
     B(end,glassBottom+glassHeight/2,.11,.044,glassHeight,.055,0x485e64,false);
     for(const yy of [glassBottom-.025,glassBottom+glassHeight+.025])B(center,yy,.11,ww,.05,.055,0x485e64,false);
     if(ribbon)out.detail(1,()=>{for(let x=.7;x<L-.2;x+=1.4)Q(x,fy+.46,.085,.013,.88,0x859595);Q(center,fy+.45,.085,ww,.013,0x859595);});
     continue;
    }
    for(let k=0;k<bays;k++){
     const u=.3+space*(k+.5);if(!facadeClear(u,.55))continue;
     const isStair=isFront&&Math.abs(u-entry)<space*.48;
     if(f===0&&isStair)continue;
     const wet=!isStair&&bays>2&&k===((Math.abs(seed)+i)%bays),veranda=!isStair&&!wet&&isFront&&levels>=3&&k%3===0;
     let id=isStair?'stair':wet?'frosted':veranda?'veranda':style.frame===0x564c43?'brown-slider':space>3.7?'wide-slider':'white-slider';
     if(f===0&&!wet&&!isStair)id=(seed+k)%3===0?'awning':'guard';else if(!wet&&!isStair&&!veranda&&f>0&&levels>2&&(seed+i+k)%9===0)id='bay';
     let w=isStair?.78:wet?.82:veranda?Math.min(3.35,space*.88):Math.min(id==='bay'?2.65:space>3.7?2.65:2.05,space*.79),h=isStair?1.85:wet?.62:veranda?1.85:id==='bay'?1.6:1.35;
     // Short footprint steps are wall returns, not another full window bay.
     // Keep both jambs on the owning wall, with enough room for the frame.
     const minWidth=isStair?.60:wet?.55:.85,cornerMargin=id==='bay'?.42:.18;
     if(w<minWidth||u-w/2<cornerMargin||u+w/2>L-cornerMargin){counts.skippedNarrowWindows++;continue;}
     if((id==='bay'&&w<1.5)||(id==='veranda'&&w<2)||(id==='wide-slider'&&w<1.8))id='white-slider';
     const y=fy+(isStair?.48:wet?1.7:veranda?.6:.92)+h/2;
     const wx=a[0]+ux*u,wz=a[1]+uz*u,ground=groundAt(u);
     if(shopHits(u-w/2-.16,u+w/2+.16,y-h/2-.16,y+h/2+.16))continue;
     if(y-h/2<ground+.16||y+h/2>top-.1)continue;
     if(f===0&&annexes.some(s=>inside(wx+nx*.25,wz+nz*.25,s.footprint)&&y-h/2<Math.max(...s.footprint.map(p=>elevation(...p)))+(s.roofHeight??2.7)+.2))continue;
     if(id==='awning'&&(sheltered(u)||levels>=4))id='guard';
     if(id==='bay'&&!facadeClear(u,.65))id='white-slider';
     openings.push([u-w/2-.13,u+w/2+.13,y-h/2-.17,y+h/2+.16]);emitWindow(out.at(u,y,0),id,w,h,Math.abs(seed)+k+f,style.frame,seed*997+i*131+f*31+k);windowBands[windowLightBand(seed*997+i*131+f*31+k)]++;proxy(u,y,id==='bay'?.28:.23,w+.18,h+.18,id==='awning'?.8:id==='bay'?.6:.48);counts.windows++;windowTypes[id]=(windowTypes[id]||0)+1;if(id==='guard')counts.guardWindows++;
     if(f===1&&!wet&&!isStair&&(seed+k+i)%3===0&&facadeClear(u,.75)&&!shopHits(u-.85,u+.85,fy-.4,fy+.8)){
      emitAircon(out,u,fy+.40,seed+k);proxy(u,fy+.2,.30,1.45,1.2,.6);counts.aircons++;openings.push([u-.85,u+.85,fy-.4,fy+.75]);
     }
     if(f===0&&b.basementLevels>0&&!wet&&!isStair&&y-h/2-ground>1.0&&(seed+k)%2===0){
      const bh=.64,bw=Math.min(1.48,w),by=ground+.43;emitWindow(out.at(u,by,0),'basement',bw,bh,seed,style.frame,seed*991+i*137+k);windowBands[windowLightBand(seed*991+i*137+k)]++;openings.push([u-bw/2-.14,u+bw/2+.14,ground+.03,by+bh/2+.15]);proxy(u,by,.2,bw+.18,bh+.18,.4);counts.windows++;counts.guardWindows++;windowTypes.basement=(windowTypes.basement||0)+1;
     }
     if(y-ground<4.5)nightWindowSources.push({position:[wx+nx*(id==='bay'?.46:.20),y,wz+nz*(id==='bay'?.46:.20)],normal:[nx,nz],band:windowLightBand(seed*997+i*131+f*31+k),heightAboveGround:y-ground});
     if(isFront&&f<=1&&!wet)spots.push({owner:seed,id,style:style.name,x:wx,z:wz,y,nx,nz,ux,uz,w,h,ground});
    }
   }
   if(!arterialFace&&isFront&&L>2.4&&facadeClear(entry)&&!shopHits(entry-1,entry+1,groundAt(entry),groundAt(entry)+2.6)){
    const w=1.34,h=2.12,u=Math.max(.85,Math.min(L-.85,entry)),world=(du,v)=>[a[0]+ux*(u+du)+nx*v,a[1]+uz*(u+du)+nz*v],g=footprintHeights((du,dv)=>world(du,.26+dv),w+.28,.45,elevation).high;
    B(u,g+h/2+.1,.06,w+.16,h+.18,.15,0x9b9f93,true);B(u,g+h/2+.1,.16,w,h,.065,levels>2?0x757c71:0x41584d,true);
    if(levels>2){B(u,g+1.48,.202,w-.18,1.05,.025,0x5c7976,false);B(u,g+1.05,.23,.035,1.98,.032,0xb1b7ac,false);}else for(let j=0;j<5;j++)B(u,g+.32+j*.34,.205,w-.18,.23,.024,0x334a42,false);
    B(u+w*.33,g+1.03,.255,.025,.28,.035,0xd1d1bc,false);addBoundaryRibbon(batch,[world(-(w+.28)/2,.26),world((w+.28)/2,.26)],.45,(x,z)=>elevation(x,z)-.04,()=>g+.10,0xaaa996,{ink:true,step:.12});
    const household=households.get(seed),hasCover=sheltered(u),hasSetback=(b.frontage?.mean??0)>1.1;
    const doorRoof=!hasCover&&hasSetback&&(levels<=3||['stone-gate','rendered'].includes(household?.wallStyle));
    if(hasCover)counts.shelteredDoors++;
    if(doorRoof){
     const curved=['stone-gate','rendered'].includes(household?.wallStyle),depth=curved?.80:.64,ww=w+.32;
     if(curved){const bucket=batch.bucket(0x78998c),P=(x,y,z)=>new T.Vector3(a[0]+ux*x+nx*z,y,a[1]+uz*x+nz*z),ry=z=>g+2.43+.10*Math.sin(Math.PI*z/depth)-.18*z/depth;
      for(let j=0;j<10;j++){const za=j*depth/10,zb=(j+1)*depth/10,ps=[P(u-ww/2,ry(za),za),P(u+ww/2,ry(za),za),P(u+ww/2,ry(zb),zb),P(u-ww/2,ry(zb),zb)],normal=ps[1].clone().sub(ps[0]).cross(ps[2].clone().sub(ps[0])).normalize();for(const k of [0,1,2,0,2,3]){bucket.p.push(...ps[k].toArray());bucket.inkIds.push(batch.inkObjectId??0);bucket.n.push(...normal.toArray());}for(const side of [-1,1])R([u+side*ww/2,ry(za),za],[u+side*ww/2,ry(zb),zb],.013,0x71796d);}
      R([u-ww/2,ry(depth),depth],[u+ww/2,ry(depth),depth],.016,0x71796d);
     }
     else B(u,g+2.38,depth/2,ww,.065,depth,household?.wallStyle==='dark-brick'?0x777779:0x9b9f92,true);
     for(const v of [-.48,.48])R([u+v,g+2.01,.06],[u+v,g+2.32,depth-.08],.014,0x71796d);
     proxy(u,g+2.43,depth/2,ww,.25,depth);counts.doorCanopies++;
    }
    B(u+w/2+.23,g+1.4,.10,.12,.28,.07,0x777e73,false);B(u+w/2+.23,g+1.45,.144,.08,.075,.012,0x333f3b,false);
    // Unlettered blue address plaque: no invented real-world name or address.
    B(u-w/2-.22,g+1.94,.12,.23,.17,.025,0x3d6f8c,false);B(u-w/2-.22,g+1.94,.137,.14,.015,.003,0xe0e2d9,false);
    openings.push([u-w/2-.45,u+w/2+.4,g,g+2.5]);proxy(u,g+1.2,.15,w+.2,2.4,.31);counts.doors++;
   }
   // Surface-only joints are omitted from physical collision indexing.
   const bottom=Math.max(base+.10,Math.min(groundAt(.15),groundAt(L-.15))+.10),rise=top-bottom;
   if(!arterialFace&&style.pattern!=='render'&&rise>0){
    const rh=style.pattern==='brick'?.17:style.pattern==='tile'?.26:.48,cw=style.pattern==='brick'?.39:style.pattern==='tile'?.52:.95,thick=style.pattern==='brick'?.008:.009;
    for(let row=0,y=bottom;y<top;row++,y+=rh){
     for(const [lo,hi] of segments(.04,L-.04,openings.filter(r=>y>r[2]&&y<r[3]).map(r=>[r[0],r[1]])))batch.atLOD(style.pattern==='brick'&&row%3?0:1,()=>Q((lo+hi)/2,y,.014,hi-lo,thick,style.joint));
     const yy=y+rh/2;for(let x=.05+(style.pattern==='brick'?(row%2)*cw/2:0);x<L-.05;x+=cw){
      for(const [lo,hi] of segments(y+.009,Math.min(top,y+rh-.009),openings.filter(r=>x>r[0]&&x<r[1]).map(r=>[r[2],r[3]])))batch.atLOD(0,()=>Q(x,(lo+hi)/2,.015,thick,hi-lo,style.joint));
      if(style.pattern==='brick'&&(row*17+Math.round(x*100)+Math.abs(seed))%19===0&&x+cw<L-.03&&!openings.some(r=>x+cw>r[0]&&x<r[1]&&yy+rh/2>r[2]&&yy-rh/2<r[3]))Q(x+cw/2,yy,.012,cw-.018,rh-.018,new T.Color(style.wall).multiplyScalar(.91).getHex());
     }
    }
   }
   // One rainwater pipe per exposed facade. Thin clamps and an offset at the eaves.
   if(!arterialFace&&L>3&&facadeClear(.22,.3)&&!shopHits(.12,.45,groundAt(.22),top)){
    const x=.22,g=groundAt(x),pipe=0xb4b6a7;R([x,top+.2,.18],[x,top-.35,.18],.044,pipe);R([x,top-.35,.18],[x+.10,top-.55,.10],.044,pipe);R([x+.10,top-.55,.10],[x+.10,g+.18,.10],.044,pipe);R([x+.10,g+.18,.10],[x+.10,g+.07,.27],.044,pipe);
    batch.atLOD(1,()=>{for(let y=g+.65;y<top;y+=2.6)B(x+.10,y,.08,.13,.055,.14,0x777d73,false);});proxy(x+.08,(g+top)/2,.15,.23,top-g,.28);counts.downpipes++;
   }
   if(!arterialFace)gasFaces.push({edge:i,a,L,ux,uz,nx,nz,isFront,clear:facadeClear(L/2,.35),openings,groundAt,proxy,facadeClear});
   // The continuous, corner-joined foundation is generated once by street.js.
   // Do not overlay a second row of flat blocks on a sloping wall base.
  }
  const gas=planGasNetwork(gasFaces,b);if(gas){const face=gasFaces.find(f=>f.edge===gas.face);gasNetworks.push(emitGasNetwork(batch,gas,face.proxy));}
  // The waterproof finish is painted on the building shell cap; no duplicate roof plane.
  const rooftop=roofsByBuilding.get(buildingIndex);
  if(rooftop){emitRooftop(batch,rooftop,style);counts.roofs++;}
 }
 const group=batch.finish();addFacilityLabels(group,buildings.filter(b=>!options.owners||options.owners.has(b.seed)));let triangles=0,finite=true;group.traverse(o=>{if(!o.isMesh)return;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;for(const v of o.geometry.attributes.position.array)if(!Number.isFinite(v))finite=false});if(!finite)throw Error('외관 메쉬 좌표 오류');group.userData={gasNetworks,rooftopPlans:rooftopPlans.filter(p=>!buildings[p.buildingIndex]?.facility).filter(p=>!options.owners||options.owners.has(buildings[p.buildingIndex]?.seed)),rooftopTypes:rooftopCatalog.map(r=>({id:r.id,name:r.name,count:rooftopPlans.filter(p=>p.kind===r.id).length})),nightWindowSources,windowBands,meshValidation:{triangles,finite},...counts,styles:facadeStyles.map((s,i)=>({name:s.name,count:styleCounts[i]})),windowTypes:windowCatalog.map(t=>({id:t.id,name:t.name,count:windowTypes[t.id]||0})),facadeSpots:spots,placementProxies,procedural:true,version:41};return group;
}
