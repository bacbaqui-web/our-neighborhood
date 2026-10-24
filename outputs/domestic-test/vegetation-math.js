export const TAU=Math.PI*2;
const wrap=a=>((a+Math.PI)%TAU+TAU)%TAU-Math.PI;
export function vegetationView(azimuth,pitch,heading,angles,previous={yaw:-1,tier:-1}){
 const a=wrap(azimuth-heading),step=TAU/4;
 const yaw=previous.yaw>=0&&Math.abs(wrap(a-previous.yaw*step))<step/2+.08?previous.yaw:((Math.round(a/step)%4)+4)%4;
 let tier=angles.reduce((best,value,i)=>Math.abs(value-pitch)<Math.abs(angles[best]-pitch)?i:best,0);
 if(previous.tier>=0){const t=previous.tier,lo=t===0?-Infinity:(angles[t-1]+angles[t])/2-3,hi=t===angles.length-1?Infinity:(angles[t]+angles[t+1])/2+3;if(pitch>=lo&&pitch<=hi)tier=t;}
 return{yaw,tier,index:tier*4+yaw};
}
// Project a trunk plus an ellipsoidal crown, rather than keeping a tall side
// silhouette when looking straight down. Includes crown depth in overhead views.
export function vegetationExtent(height,radius,pitch,kind='tree'){
 const c=Math.max(0,Math.cos(pitch)),s=Math.abs(Math.sin(pitch)),centre=height*(kind==='tree'?.69:.52),vertical=height*(kind==='tree'?.31:.48);
 const r=Math.hypot(vertical*c,radius*s),top=Math.max(height*c,centre*c+r),bottom=Math.min(0,centre*c-r);
 return{height:Math.max(.02,top-bottom),width:radius*2,rootFromTop:top/(top-bottom||1)};
}
