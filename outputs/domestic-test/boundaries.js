import * as T from 'three';
// Build entire wings + returns + gate posts together. No independently scattered fence assets.
export function boundaryAssembly(front,depth,elevation,style){
 const g=new T.Group(),segments=[],opening=2.15,lo=.20,hi=front.L-.20,door=front.entry,gateL=door-opening/2,gateR=door+opening/2;
 if(gateL-lo<1.15||hi-gateR<1.15)return null;
 const point=(u,v)=>[front.a[0]+front.ux*u+front.nx*v,front.a[1]+front.uz*u+front.nz*v];
 const palette=style==='brick'?{body:0x977664,cap:0xc8bca8,joint:0x6d6359}:{body:0xaaa69b,cap:0xcac5b7,joint:0x7b7b70};
 const mats=Object.fromEntries(Object.entries(palette).map(([k,color])=>[k,new T.MeshStandardMaterial({color,roughness:.93})]));mats.iron=new T.MeshStandardMaterial({color:0x4e5b58,roughness:.75});
 function box(x,y,z,w,h,d,angle,mat){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mats[mat]);mesh.position.set(x,y,z);mesh.rotation.y=angle;g.add(mesh);return mesh}
 function wall(a,b){const L=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L,ang=-Math.atan2(uz,ux),N=Math.max(1,Math.ceil(L/1.5));
 for(let j=0;j<N;j++){const t0=j/N,t1=(j+1)/N,A=[a[0]+ux*L*t0,a[1]+uz*L*t0],B=[a[0]+ux*L*t1,a[1]+uz*L*t1],h0=elevation(...A),h1=elevation(...B),base=Math.min(h0,h1)-.12,top=Math.ceil(Math.max(h0,h1)/.15)*.15+(depth<1.4?.65:.95),cx=(A[0]+B[0])/2,cz=(A[1]+B[1])/2,w=L/N;
 box(cx,(base+top)/2,cz,w+.012,top-base,.24,ang,'body');box(cx,top+.045,cz,w+.04,.09,.32,ang,'cap');
 // Mortar courses and staggered joints are shallow geometry, not photographic textures.
 const row=style==='brick'?.145:.26,bw=style==='brick'?.3:.52;
 for(let y=base+row;y<top-.04;y+=row){box(cx,y,cz,w+.01,.013,.246,ang,'joint');const r=Math.round((y-base)/row);for(let u=-w/2+bw*(r%2?.5:1);u<w/2-.06;u+=bw)box(cx+ux*u,y-row/2,cz+uz*u,.012,row-.015,.246,ang,'joint')}
 segments.push({a:A,b:B,base,top:top+.09,width:.32,kind:'wall'});
 }
 }
 wall(point(lo,depth),point(gateL,depth));wall(point(gateR,depth),point(hi,depth));wall(point(lo,.10),point(lo,depth));wall(point(hi,depth),point(hi,.10));
 for(const u of [lo,gateL,gateR,hi]){const p=point(u,depth),y=elevation(...p),height=u===lo||u===hi?(depth<1.4?.82:1.1):1.4;box(p[0],y+height/2,p[1],.38,height,.38,front.angle,'body');box(p[0],y+height+.05,p[1],.45,.10,.45,front.angle,'cap');segments.push({a:p,b:p,base:y,top:y+height+.1,width:.45,angle:front.angle,kind:'post'})}
 // Open leaves fold into the lot, attached to the gate posts; the passage remains open.
 if(depth>=1.7){for(const [u,side] of [[gateL,1],[gateR,-1]]){const P=point(u,depth-.1),end=point(u+side*.12,depth-.95),L=Math.hypot(end[0]-P[0],end[1]-P[1]),ang=-Math.atan2(end[1]-P[1],end[0]-P[0]),base=elevation(...P)+.08;
 for(let j=0;j<=7;j++){const t=j/7;box(P[0]+(end[0]-P[0])*t,base+.55,P[1]+(end[1]-P[1])*t,.025,1.1,.025,ang,'iron')}
 for(const y of [.12,.98])box((P[0]+end[0])/2,base+y,(P[1]+end[1])/2,L,.035,.035,ang,'iron');segments.push({a:P,b:end,base,top:base+1.1,width:.06,kind:'open-gate'})}}
 const yard=[point(lo,.08),point(hi,.08),point(hi,depth),point(lo,depth)];
 return {group:g,segments,yard,entry:{a:point(door,.0),b:point(door,depth+.5),width:opening-.8},front,depth,style,gateL,gateR,lo,hi};
}
