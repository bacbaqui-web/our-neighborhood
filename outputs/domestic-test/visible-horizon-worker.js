import {buildingParts,createHorizon,TILE_SIZE} from './visible-horizon-policy.js';
let horizon,origin,heightAt,parts=new Map();
self.onmessage=({data})=>{
 try{
  let result;
  if(data.type==='init'){
   origin=data.origin;const {positions,radii,angles}=data.terrain;
   heightAt=(x,z)=>{const d=Math.hypot(x,z),a=(Math.atan2(x,-z)+Math.PI*2)%(Math.PI*2)*angles/(Math.PI*2),j=Math.floor(a),v=a-j;let r=0;while(r<radii.length-2&&radii[r+1]<d)r++;const u=Math.max(0,Math.min(1,(d-radii[r])/(radii[r+1]-radii[r]||1))),h=i=>positions[(i*angles+j)*3+1]*(1-v)+positions[(i*angles+(j+1)%angles)*3+1]*v;return h(r)*(1-u)+h(r+1)*u;};
   // Upper envelope of every terrain triangle intersecting each query tile.
   const upper=new Map(),half=TILE_SIZE/2;
   for(let r=0;r<radii.length-1;r++)for(let j=0;j<angles;j++){
    const ids=[r*angles+j,r*angles+(j+1)%angles,(r+1)*angles+j,(r+1)*angles+(j+1)%angles],xs=ids.map(i=>positions[i*3]),zs=ids.map(i=>positions[i*3+2]),y=Math.max(...ids.map(i=>positions[i*3+1]))+20;
    for(let x=Math.floor((Math.min(...xs)+half)/TILE_SIZE);x<=Math.floor((Math.max(...xs)+half)/TILE_SIZE);x++)for(let z=Math.floor((Math.min(...zs)+half)/TILE_SIZE);z<=Math.floor((Math.max(...zs)+half)/TILE_SIZE);z++){const key=x+','+z;upper.set(key,Math.max(upper.get(key)??-Infinity,y));}
   }
   horizon=createHorizon({...data.view,eyeHeight:data.eyeY-heightAt(...data.view.position),heightAt,terrainUpper:(x,z)=>upper.get(x+","+z)??data.maxTerrain,maxTerrain:data.maxTerrain,terrainRadii:radii});result=true;
  }else if(data.type==='insert'){
   for(const part of buildingParts(data.features,origin,heightAt))parts.set(part.key,part);
   result={visible:horizon.rebuild([...parts.values()]),sourceBuildings:parts.size};
  }else if(data.type==='tile')result=horizon.tileMinimumFloors(data.x,data.z);
  self.postMessage({id:data.id,result});
 }catch(error){self.postMessage({id:data.id,error:error.message});}
};
