export const CAR_SIZE = Object.freeze({length:4.710,width:1.825,height:1.420,wheelbase:2.720});
export const ELEVATIONS = Object.freeze([0,20,45,70]);
export const wrapDegrees = value => ((value % 360) + 360) % 360;

// One pixel-to-world scale for the entire image set. Angle, camera distance,
// and the bounds of the currently selected car never alter this layout.
export function sourceImageLayout(catalog){
  const reference=catalog.frames.find(f=>f.angle===90&&f.elevation===0)??catalog.frames[0];
  const referenceWidth=reference.pixels[2]-reference.pixels[0];
  const metresPerPixel=(catalog.dimensions?.length??CAR_SIZE.length)/referenceWidth;
  const canvasWidth=Math.max(...catalog.frames.map(f=>f.pixels[2]-f.pixels[0]));
  const canvasHeight=Math.max(...catalog.frames.map(f=>f.pixels[3]-f.pixels[1]));
  return {canvasWidth,canvasHeight,metresPerPixel,width:canvasWidth*metresPerPixel,height:canvasHeight*metresPerPixel};
}

// A silhouette envelope, not visible geometry. Recessed roof corners keep a
// high-angle sprite from acquiring the dimensions of a rectangular box.
const envelope=[];
for(const [z,y,x] of [[2.355,.38,.82],[2.20,.72,.88],[1.05,.85,.88],[.42,1.42,.67],[-.70,1.42,.67],[-1.55,.92,.86],[-2.355,.48,.85],[-2.18,.86,.87],[.62,1.01,1.025]]){
  envelope.push([x,y,z],[-x,y,z]);
}
for(const x of [-.80,.80])for(const z of [-1.36,1.36])envelope.push([x,0,z]);
export function projectedEnvelope(azimuth,elevation){
  const a=azimuth*Math.PI/180,p=elevation*Math.PI/180;
  const right=[Math.cos(a),0,-Math.sin(a)],up=[-Math.sin(a)*Math.sin(p),Math.cos(p),-Math.cos(a)*Math.sin(p)];
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const v of envelope){const x=v.reduce((s,n,i)=>s+n*right[i],0),y=v.reduce((s,n,i)=>s+n*up[i],0);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  return {width:maxX-minX,height:maxY-minY,cx:(minX+maxX)/2,cy:(minY+maxY)/2,right,up,minY,maxY};
}
export function chooseCarFrame(azimuth,elevation,step=15,previous=null){
  const angle=wrapDegrees(azimuth),direction=Math.round(angle/step)*step%360;
  let pitch=ELEVATIONS.reduce((best,v)=>Math.abs(v-elevation)<Math.abs(best-elevation)?v:best,ELEVATIONS[0]);
  let selected=direction;
  // A small deadband stops repeated image changes at an exact boundary.
  if(previous){const d=Math.abs(wrapDegrees(angle-previous.angle+180)-180);if(d<step/2+1.2)selected=previous.angle;if(Math.abs(elevation-previous.elevation)<Math.abs(elevation-pitch)+1.2)pitch=previous.elevation;}
  return {angle:selected,elevation:pitch,index:ELEVATIONS.indexOf(pitch)*24+Math.round(selected/15)};
}

export function groundedCard(bounds,elevation,distance){
  const p=elevation*Math.PI/180,c=Math.cos(p),s=Math.sin(p),centerHeight=CAR_SIZE.height/2;
  const bottom=bounds.minY-centerHeight*c;
  const depth=(.004-centerHeight-c*bottom)/Math.max(.001,s-c*bottom/distance);
  const ratio=Math.max(.5,(distance-depth)/distance);
  return {depth,ratio,cx:bounds.cx*ratio,cy:(bounds.cy-centerHeight*c)*ratio,centerHeight,
    minimumY:centerHeight+bottom*ratio*c+depth*s};
}
