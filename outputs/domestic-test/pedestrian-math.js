export const TAU=Math.PI*2;
export const FRAME_LABELS=['정면','오른쪽을 향한 앞 사선','오른쪽 측면','오른쪽을 향한 뒤 사선','뒷모습','왼쪽을 향한 뒤 사선','왼쪽 측면','왼쪽을 향한 앞 사선'];
export const wrapAngle=a=>((a+Math.PI)%TAU+TAU)%TAU-Math.PI;
// Camera on the character's LEFT sees the nose pointing screen-right (atlas frame 2).
export function directionalFrame(heading,cameraAzimuth,previous=-1){
 const angle=wrapAngle(heading-cameraAzimuth),step=TAU/8;
 if(previous>=0&&Math.abs(wrapAngle(angle-previous*step))<=step/2+.045)return previous;
 return ((Math.round(angle/step)%8)+8)%8;
}
export const ELEVATION_LABELS=['눈높이','살짝 위','높은 곳'];
export function elevationTier(degrees,previous=-1,angles=[0,30,60]){
 if(previous>=0&&previous<angles.length){
  const low=previous===0?-Infinity:(angles[previous-1]+angles[previous])/2-2.5;
  const high=previous===angles.length-1?Infinity:(angles[previous]+angles[previous+1])/2+2.5;
  if(degrees>=low&&degrees<=high)return previous;
 }
 let best=0;for(let i=1;i<angles.length;i++)if(Math.abs(degrees-angles[i])<Math.abs(degrees-angles[best]))best=i;
 return best;
}
// Projected extent of an upright body, including its head/stride depth.
export function projectedHeight(height,pitch){return height*Math.max(.22,Math.cos(pitch)+.20*Math.abs(Math.sin(pitch)));}

// View tiers describe looking at a person at eye level, not at their waist.
// All ten adult silhouettes share an eye landmark at about 93% of standing height.
export const pedestrianEyeHeight=height=>height*.93;
export function pedestrianView(camera,feet,height,previousAzimuth=0){
 const dx=camera.x-feet.x,dz=camera.z-feet.z;
 const horizontal=Math.hypot(dx,dz),dy=camera.y-feet.y-pedestrianEyeHeight(height);
 const pitch=Math.atan2(dy,horizontal);
 // There are no below-eye atlases. Keep that artwork upright rather than
 // leaning a standing person toward a low/near camera.
 return {degrees:pitch*180/Math.PI,pitch:Math.max(0,pitch),
  azimuth:horizontal>.025?Math.atan2(dx,dz):previousAzimuth};
}
