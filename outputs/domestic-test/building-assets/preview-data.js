import {primaryBuildingRing} from './scene-edit-store.js';
export function localPolygons(feature,origin){
 const lat=origin[0]*Math.PI/180,sx=111412.84*Math.cos(lat)-93.5*Math.cos(3*lat)+.118*Math.cos(5*lat),sy=111132.92-559.82*Math.cos(2*lat)+1.175*Math.cos(4*lat)-.0023*Math.cos(6*lat);
 const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates,primary=primaryBuildingRing(feature.geometry);
 return [...polygons.filter(p=>p[0]===primary),...polygons.filter(p=>p[0]!==primary)].map(p=>p.map(r=>r.slice(0,-1).map(([x,y])=>[(x-origin[1])*sx,(origin[0]-y)*sy])));
}
export function editorContext(feature,features,roads,origin){
 const polygons=localPolygons(feature,origin),ps=polygons.flat(1).flat(1),xs=ps.map(p=>p[0]),zs=ps.map(p=>p[1]);
 const bounds={minX:Math.min(...xs)-18,maxX:Math.max(...xs)+18,minZ:Math.min(...zs)-18,maxZ:Math.max(...zs)+18};
 const overlaps=(points,pad=0)=>Math.min(...points.map(p=>p[0]))<=bounds.maxX+pad&&Math.max(...points.map(p=>p[0]))>=bounds.minX-pad&&Math.min(...points.map(p=>p[1]))<=bounds.maxZ+pad&&Math.max(...points.map(p=>p[1]))>=bounds.minZ-pad;
 const neighbors=features.filter(f=>String(f.properties.objectid)!==String(feature.properties.objectid)).flatMap(f=>localPolygons(f,origin).filter(p=>overlaps(p[0])).map(rings=>({rings,id:f.properties.objectid})));
 return {polygons,bounds,neighbors,roads:roads.filter(r=>overlaps(r.geometry.coordinates,(r.width||5)/2))};
}
export function previewSpecs(feature,origin,{floors,frontEdge,era,use}){
 return localPolygons(feature,origin).map((rings,i)=>({points:rings[0],holePoints:rings.slice(1),holes:rings.length>1,seed:Number(feature.properties.objectid),inkObjectId:i+1,base:0,top:floors*3,floor:3,levels:floors,frontEdge:i===0?frontEdge:0,properties:{...feature.properties,apartment_era:era},previewUse:use}));
}

export function eraStyle(owner,era){return era==='old'?[0,1,2,4][Math.abs(Number(owner))%4]:era==='middle'?4:[3,4,5][Math.abs(Number(owner))%3];}
