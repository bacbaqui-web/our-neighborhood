// Test: cumulative sky occlusion per leaf. Independent of viewing direction.
// Every overlapping leaf along a sky ray attenuates the remaining light.
export function createCanopyLayers(leaves){
 const values=new Float32Array(leaves.length).fill(1),targets=new Float32Array(leaves.length).fill(1);
 const maxRadius=Math.max(.01,...leaves.map(c=>c.radius));
 const directions=[[0,1,0],[.8,.6,0],[-.8,.6,0],[0,.6,.8],[0,.6,-.8]];
 let lastCount=-1;
 const stats={mode:'cumulative-leaf-sky',updates:0,min:1,max:1,average:1};
 function update(_camera,count){
  if(count===lastCount)return false;
  const transmission=new Float32Array(count);
  for(const d of directions){
   // Orthographic spatial bins perpendicular to each fixed sky direction.
   const u=d[0]===0?[1,0,0]:[0,0,1];
   const v=[d[1]*u[2]-d[2]*u[1],d[2]*u[0]-d[0]*u[2],d[0]*u[1]-d[1]*u[0]];
   const dot=(p,a)=>p[0]*a[0]+p[1]*a[1]+p[2]*a[2],cell=Math.max(.5,maxRadius*1.36),grid=new Map();
   const projected=leaves.slice(0,count).map(c=>[dot(c.center,u),dot(c.center,v),dot(c.center,d)]);
   projected.forEach((p,i)=>{const key=Math.floor(p[0]/cell)+','+Math.floor(p[1]/cell);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(i);});
   for(let i=0;i<count;i++){
    const a=projected[i],c=leaves[i],gx=Math.floor(a[0]/cell),gy=Math.floor(a[1]/cell);let cover=0;
    for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(const j of grid.get((gx+x)+','+(gy+y))||[]){
     const b=projected[j];if(b[2]<=a[2]+.025||leaves[j].plan.id!==c.plan.id)continue;
     const reach=(c.radius+leaves[j].radius)*.68;
     const overlap=1-((b[0]-a[0])**2+(b[1]-a[1])**2)/(reach*reach);
     if(overlap>0)cover+=overlap*overlap;
    }
    transmission[i]+=Math.exp(-cover*(maxRadius>.4?.16:.7))*(d[1]===1?.4:.15);
   }
  }
  let min=1,max=0,sum=0;
  for(let i=0;i<count;i++){
   const brightness=.32+.68*transmission[i];
   values[i]=targets[i]=brightness**2.2;min=Math.min(min,values[i]);max=Math.max(max,values[i]);sum+=values[i];
  }
  lastCount=count;Object.assign(stats,{updates:stats.updates+1,min,max,average:count?sum/count:1});return true;
 }
 return{values,targets,stats,update,invalidate(){lastCount=-1;}};
}
