// Self-occlusion between physical foliage masses. No ground-height tint or
// random per-card darkness: the outermost / uppermost masses keep their color.
// A sparse neighbor list is built once; changing seasons ignores absent cards.
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function layerCover(delta,occluderRadius,receiverRadius,direction){
 const depth=delta[0]*direction[0]+delta[1]*direction[1]+delta[2]*direction[2];
 if(depth<=.06)return 0;
 const lateral2=Math.max(0,delta[0]**2+delta[1]**2+delta[2]**2-depth*depth);
 // Sample the card's footprint, not merely its center. Distant non-overlapping
 // cards cannot cast this stylized depth shade across an open gap.
 const reach=occluderRadius*.72+receiverRadius*.36;
 const overlap=clamp(1-lateral2/(reach*reach));
 return overlap*overlap*smooth((depth-.06)/Math.max(.18,receiverRadius*.55))
  *Math.min(1,occluderRadius**2/receiverRadius**2)/(1+depth*.14);
}
export function createCanopyLayers(leaves){
 const trees=new Map(),neighbors=leaves.map(()=>[]),targets=new Float32Array(leaves.length).fill(1),values=new Float32Array(leaves.length).fill(1);
 const directions=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],cover=new Float32Array(leaves.length*6);
 leaves.forEach((c,i)=>{const key=c.plan.id;if(!trees.has(key))trees.set(key,[]);trees.get(key).push(i);});
 for(const indices of trees.values())for(const i of indices)for(const j of indices){
  if(i===j)continue;const a=leaves[i],b=leaves[j],delta=b.center.map((v,k)=>v-a.center[k]);
  if(Math.hypot(...delta)>(a.radius+b.radius)*3.2)continue;
  neighbors[i].push({index:j,delta,radius:b.radius,coverage:b.coverage??1,distance:Math.hypot(...delta)});
 }
 // Nearby masses dominate enclosure; retain candidates from every direction.
 // This is baked only at generation / season changes, not every camera frame.
 for(let i=0;i<neighbors.length;i++){
  const selected=new Set();neighbors[i].sort((a,b)=>a.distance-b.distance);
  for(const d of directions){let n=0;for(const item of neighbors[i])if(layerCover(item.delta,item.radius,leaves[i].radius,d)>0){selected.add(item);if(++n===12)break;}}
  neighbors[i]=[...selected];
 }
 let lastCamera=null,lastCount=-1,lastTime=-Infinity,initialized=false;
 const stats={version:68,mode:'perceptual-layer-shade',updates:0,neighborPairs:neighbors.reduce((n,a)=>n+a.length,0),min:1,max:1,average:1};
 function update(camera,count,time=performance.now(),force=false){
  const p=camera.toArray?camera.toArray():camera,moved=!lastCamera||Math.hypot(...p.map((v,k)=>v-lastCamera[k]))>.10;
  const recompute=force||lastCount!==count||(moved&&time-lastTime>=80);
  if(recompute){
   if(lastCount!==count)for(let i=0;i<count;i++)for(let axis=0;axis<6;axis++){
    let sum=0;for(const n of neighbors[i])if(n.index<count)sum+=n.coverage*layerCover(n.delta,n.radius,leaves[i].radius,directions[axis]);
    cover[i*6+axis]=1-Math.exp(-sum*.82);
   }
   for(let i=0;i<count;i++){
    const c=leaves[i],v=p.map((x,k)=>x-c.center[k]),length=Math.hypot(...v)||1,direction=v.map(x=>x/length);let viewCover=0;
    // Smoothly interpolate six precomputed face visibilities, like a tiny
    // ambient cube. Camera movement is O(cards), including the full town.
    for(let axis=0;axis<3;axis++){const d=direction[axis];viewCover+=d*d*cover[i*6+axis*2+(d<0?1:0)];}
    const skyCover=cover[i*6+2];
    // A visible outer / top face is unmodified. Behind it, overlap builds a
    // bounded shade; underside sky occlusion adds a smaller, stable component.
    // Choose contrast in display brightness, then convert the multiplier to
    // linear light. A .43 linear multiplier still looks about 69% as bright
    // after sRGB output, which hid the depth between saturated leaf sprays.
    const brightness=Math.max(.34,1-.58*smooth((viewCover-.04)/.90)-.08*smooth((skyCover-.04)/.96));
    targets[i]=brightness**2.2;
   }
   lastCamera=[...p];lastCount=count;lastTime=time;stats.updates++;
  }
  // setFoliage restores the seasonal base colors, so reapply layer multipliers
  // even when toggling back to the exact same camera / occlusion values.
  let changed=!initialized||force,min=1,max=0,sum=0;
  for(let i=0;i<count;i++){
   const next=(!initialized||force)?targets[i]:values[i]+(targets[i]-values[i])*.24;
   if(Math.abs(next-values[i])>.0005){values[i]=next;changed=true;}
   min=Math.min(min,values[i]);max=Math.max(max,values[i]);sum+=values[i];
  }
  initialized=true;Object.assign(stats,{min:count?min:1,max:count?max:1,average:count?sum/count:1});
  return changed;
 }
 return{values,targets,stats,update,invalidate(){lastCount=-1;initialized=false;}};
}
