import {FacadeBatch,facadeStyles} from './korean-facades.js';
import {wallTextureFor} from './facade-textures.js';

// Building pairs, not separate per-house loops, own the common separator.
export function applyNeighborBoundaries(pkg,boundary,owners,enabled=true){
 const d=pkg.neighbors;if(!d)return null;
 const pairs=d.pairs.filter(p=>p.owners.every(id=>owners.has(id)));
 const ids=new Set(pairs.map(p=>p.id));
 const closures=d.closures.filter(p=>ids.has(p.pair));
 const walls=d.walls.filter(w=>owners.has(w.owner)&&(!w.owners||w.owners.every(id=>owners.has(id))));
 if(enabled){
  boundary.scene.walls=walls;
  const removed=new Set(pairs.flatMap(p=>p.replacedGates||[]));
  boundary.gates=pkg.boundary.gates.filter((g,i)=>owners.has(g.owner)&&!removed.has(i));
 }
 return {pairs,closures:enabled?closures:[],previewClosures:closures,enabled,
  qa:{enabled,pairs:pairs.length,sharedWalls:walls.filter(w=>w.role==='shared-middle').length,
   closures:closures.length,kinds:closures.reduce((s,c)=>(s[c.kind]=(s[c.kind]||0)+1,s),{}),
   oldSideSpansRemoved:enabled?pkg.boundary.ground.walls.filter(w=>owners.has(w.owner)&&w.role==='shared-side').length:0}};
}

export function createGapClosures(closures,frontages,height){
 const batch=new FacadeBatch();
 for(const c of closures){
  const L=Math.hypot(c.b[0]-c.a[0],c.b[1]-c.a[1]),u=[(c.b[0]-c.a[0])/L,(c.b[1]-c.a[1])/L],n=[-u[1],u[0]];
  const f=frontages.buildings[c.owner],style=facadeStyles[f.styleIndex];
  const out=batch.writer([c.a[0],0,c.a[1]],...u,...n);
  const h=x=>height(c.a[0]+u[0]*x,c.a[1]+u[1]*x)+.04;
  // Level metal leaves, a short filled sill follows the ground instead of floating.
  const base=Math.max(h(0),h(L),h(L/2)),low=Math.min(h(0),h(L),h(L/2));
  const masonry=(x,y,w,t)=>out.box(x,y,0,w,t,.18,style.wall,false,false,wallTextureFor(f));
  if(c.kind==='low-wall'){
   masonry(L/2,low+(base-low+c.height)/2,L,base-low+c.height);
   out.box(L/2,base+c.height+.035,0,L+.025,.07,.22,0xbebcb0);
   continue;
  }
  const color=c.kind==='iron-fence'?0x303b39:(c.owner%3===0?0x37644d:0x8b9590);
  const bottom=c.kind==='iron-fence'?.28:0;
  if(base-low+bottom>.02)masonry(L/2,low+(base-low+bottom)/2,L,base-low+bottom);
  const top=base+c.height,foot=base+bottom;
  const box=(x,y,w,t,z=.065,offset=0)=>out.box(x,y,offset,w,t,z,color);
  for(const x of [.04,L-.04])box(x,(foot+top)/2,.08,top-foot,.09);
  for(const y of [foot+.07,top-.045])box(L/2,y,L,.065);
  if(c.kind==='iron-fence'){
   const count=Math.max(2,Math.round((L-.16)/.15));
   for(let i=1;i<count;i++)box(.08+(L-.16)*i/count,(foot+top)/2,.028,top-foot-.08,.035);
  }else{
   const W=Math.min(1.05,L-.12);
   box(W/2+.06,(foot+top)/2,W-.055,top-foot-.15,.035);
   for(let x=.19;x<W;x+=.16)out.box(x,(foot+top)/2,.024,.012,top-foot-.20,.012,0x566862);
   box(W+.06,(foot+top)/2,.045,top-foot);
   for(const y of [foot+.19,top-.2])box(W/2+.06,y,W,.07,.06);
   out.box(W-.08,foot+.92,.058,.12,.035,.07,0xc1c4bb);
   for(const y of [foot+.3,top-.3])box(.065,y,.065,.13,.1);
   for(let x=W+.19;x<L-.08;x+=.15)box(x,(foot+top)/2,.028,top-foot-.08,.035);
  }
 }
 const group=batch.finish('BetweenBuildingClosures');
 group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 return group;
}
