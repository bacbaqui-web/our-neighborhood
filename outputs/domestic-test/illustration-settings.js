export const DEFAULT_APPEARANCE = Object.freeze({
  lines:true, outerWidth:2, outerFace:true, outerBrightness:51, outerSaturation:110,
  minDistance:0, acrossObjects:true, innerWidth:1, innerFace:true,
  innerAngle:2*Math.asin(.18)*180/Math.PI, innerBrightness:90, innerSaturation:110, shading:true, brightness:100,
  density:70, shadows:true, shadingMode:'smooth', antialias:'msaa',
});
export function normalizeAppearance(value={}) {
  const out={...DEFAULT_APPEARANCE};
  for(const key of ['lines','outerFace','acrossObjects','innerFace','shading','shadows'])if(typeof value[key]==='boolean')out[key]=value[key];
  const bounds={innerAngle:[1,90],outerWidth:[0,6],innerWidth:[0,6],outerBrightness:[0,200],innerBrightness:[0,200],outerSaturation:[0,200],innerSaturation:[0,200],minDistance:[0,200],brightness:[0,200],density:[0,100]};
  for(const [key,[min,max]] of Object.entries(bounds))if(Number.isFinite(value[key]))out[key]=Math.max(min,Math.min(max,value[key]));
  if(['smooth','two','three'].includes(value.shadingMode))out.shadingMode=value.shadingMode;
  if(['off','fxaa','msaa'].includes(value.antialias))out.antialias=value.antialias;
  return out;
}
export function loadAppearance(){try{return normalizeAppearance(JSON.parse(localStorage.getItem('neighborhood-appearance-v37')||'{}'));}catch{return normalizeAppearance();}}
export function saveAppearance(value){try{localStorage.setItem('neighborhood-appearance-v37',JSON.stringify(value));}catch{/* Rendering also works when storage is unavailable. */}}
