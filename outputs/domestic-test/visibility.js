import {chooseLOD} from './lod-policy.js?v=29';
import * as T from 'three';

// Draw proxies are separate from editable geometry, collision meshes and exports.
// A whole triangle/segment belongs to one cell; its true bounds include every vertex.
export function spatialBatch(root, cellSize=48, cellHeight=48) {
  root.updateWorldMatrix(true, true);
  const sources=[], buckets=[], byKey=new Map(), cells=new Map();
  const rootWasVisible=root.visible;root.visible=true;
  try{root.traverseVisible(object=>{
    if ((!object.isMesh&&!object.isLineSegments)||Array.isArray(object.material)) return;
    const material=object.material, geometry=object.geometry;
    if (material.map||object.isSkinnedMesh||object.isInstancedMesh) throw Error('Unsupported spatial source: '+object.name);
    const position=geometry.attributes.position, step=object.isLineSegments?2:3;
    const count=(geometry.index?.count??position.count)/step;
    const source={object,geometry,material,position,step,count,ids:new Uint32Array(count),levels:new Uint8Array(count),matrix:object.matrixWorld.elements};
    const signature=JSON.stringify([step,object.userData.arterialLightColor??'',object.userData.storefrontLightKey??'',material.userData.nightWindowBand??-1,object.userData.detailKind??'',material.type,material.side,material.transparent,material.opacity,material.depthWrite,material.depthTest,material.polygonOffset,material.polygonOffsetFactor,material.polygonOffsetUnits,material.roughness,material.metalness,material.toneMapped,object.castShadow,object.receiveShadow,object.renderOrder]);
    const index=geometry.index, m=source.matrix, lod=geometry.attributes.lodMax;
    for(let i=0;i<count;i++) {
      let x=0,y=0,z=0;const vertex=index?index.getX(i*step):i*step;const level=lod?lod.getX(vertex):(object.userData.lodMaxLevel??2);source.levels[i]=level;
      for(let k=0;k<step;k++){const j=index?index.getX(i*step+k):i*step+k;x+=position.getX(j);y+=position.getY(j);z+=position.getZ(j);}
      x/=step;y/=step;z/=step;
      const cell=[Math.floor((m[0]*x+m[4]*y+m[8]*z+m[12])/cellSize),Math.floor((m[1]*x+m[5]*y+m[9]*z+m[13])/cellHeight),Math.floor((m[2]*x+m[6]*y+m[10]*z+m[14])/cellSize)].join(',');
      const key=cell+'|'+signature;
      let b=byKey.get(key);
      if(!b){b={id:buckets.length,cell,source,count:0,counts:[0,0,0]};byKey.set(key,b);buckets.push(b);}
      source.ids[i]=b.id;b.count+=step;b.counts[level]+=step;
    }
    sources.push(source);
  });}finally{root.visible=rootWasVisible;}
  for(const b of buckets){b.p=new Float32Array(b.count*3);b.c=new Float32Array(b.count*3);b.inkIds=new Float32Array(b.count);if(b.source.step===3)b.n=new Float32Array(b.count*3);b.offsets=[(b.counts[2]+b.counts[1])*3,b.counts[2]*3,0];}
  const normalMatrix=new T.Matrix3(),v=new T.Vector3(),n=new T.Vector3();
  for(const s of sources){
    const index=s.geometry.index, normals=s.geometry.attributes.normal, color=s.material.color;
    normalMatrix.getNormalMatrix(s.object.matrixWorld);
    for(let i=0;i<s.count;i++){
      const b=buckets[s.ids[i]],level=s.levels[i];
      for(let k=0;k<s.step;k++){
        const j=index?index.getX(i*s.step+k):i*s.step+k,o=b.offsets[level];
        v.fromBufferAttribute(s.position,j).applyMatrix4(s.object.matrixWorld);b.p[o]=v.x;b.p[o+1]=v.y;b.p[o+2]=v.z;
        const vc=s.material.vertexColors?s.geometry.attributes.color:null;
        b.c[o]=color.r*(vc?.getX(j)??1);b.c[o+1]=color.g*(vc?.getY(j)??1);b.c[o+2]=color.b*(vc?.getZ(j)??1);
        if(b.n){if(normals)n.fromBufferAttribute(normals,j).applyNormalMatrix(normalMatrix);else n.set(0,1,0);b.n[o]=n.x;b.n[o+1]=n.y;b.n[o+2]=n.z;}
        b.inkIds[o/3]=s.geometry.attributes.inkObjectId?.getX(j)||s.object.id;b.offsets[level]+=3;
      }
    }
  }
  const group=new T.Group();group.name='SpatialDrawProxy-'+root.name;group.visible=false;
  for(const b of buckets){
    let cell=cells.get(b.cell);
    if(!cell){const object=new T.Group();object.name='render-cell-'+b.cell;cell={object,box:new T.Box3(),triangles:0,level:null};cells.set(b.cell,cell);group.add(object);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(b.p,3));g.setAttribute('color',new T.BufferAttribute(b.c,3));g.setAttribute('inkObjectId',new T.BufferAttribute(b.inkIds,1));if(b.n)g.setAttribute('normal',new T.BufferAttribute(b.n,3));g.computeBoundingBox();g.computeBoundingSphere();
    const material=b.source.material.clone();material.color.set(0xffffff);material.vertexColors=true;
    const object=b.n?new T.Mesh(g,material):new T.LineSegments(g,material);
    object.name='spatial-'+b.source.object.name;object.userData={...b.source.object.userData,spatialVertexColor:true,lodCounts:[b.count,b.counts[2]+b.counts[1],b.counts[2]]};
    object.castShadow=false;object.receiveShadow=b.source.object.receiveShadow;object.renderOrder=b.source.object.renderOrder;
    cell.object.add(object);cell.box.union(g.boundingBox);cell.triangles+=b.n?b.count/3:0;
  }
  return {source:root,group,originals:sources.map(s=>({object:s.object,counts:s.object.userData.lodCounts??[0,1,2].map(l=>(s.object.userData.lodMaxLevel??2)>=l?s.count*s.step:0)})),cells:[...cells.values()],sourceDraws:sources.length,proxyDraws:buckets.length};
}

// Scalar projection avoids temporary Vector3/array allocations in the frame loop.
// Near-plane crossings remain visible rather than using an unsafe screen estimate.
export function projectBounds(box,view,projection,near){
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,depth=Infinity;
  const m=view.elements,p=projection.elements;
  for(let i=0;i<8;i++){
    const x=i&1?box.max.x:box.min.x,y=i&2?box.max.y:box.min.y,z=i&4?box.max.z:box.min.z;
    const vx=m[0]*x+m[4]*y+m[8]*z+m[12],vy=m[1]*x+m[5]*y+m[9]*z+m[13],vz=m[2]*x+m[6]*y+m[10]*z+m[14],d=-vz;
    if(d<=near+.02)return null;depth=Math.min(depth,d);
    const w=p[3]*vx+p[7]*vy+p[11]*vz+p[15];
    const sx=(p[0]*vx+p[4]*vy+p[8]*vz+p[12])/w,sy=(p[1]*vx+p[5]*vy+p[9]*vz+p[13])/w;
    minX=Math.min(minX,sx);minY=Math.min(minY,sy);maxX=Math.max(maxX,sx);maxY=Math.max(maxY,sy);
  }
  return {minX,minY,maxX,maxY,depth};
}

export function isOccluded(rect,faces,margin=.004){
  if(!rect)return false;
  for(const f of faces){
    // Every point of the blocker must be nearer than every point of the target.
    if(f.depth+.12>=rect.depth||rect.minX<=f.minX+margin||rect.maxX>=f.maxX-margin||rect.minY<=f.minY+margin||rect.maxY>=f.maxY-margin)continue;
    let contains=true;
    for(const [x,y] of [[rect.minX,rect.minY],[rect.maxX,rect.minY],[rect.maxX,rect.maxY],[rect.minX,rect.maxY]]){
      for(let i=0;i<f.points.length;i++){
        const a=f.points[i],b=f.points[(i+1)%f.points.length],dx=b.x-a.x,dy=b.y-a.y;
        if(f.sign*(dx*(y-a.y)-dy*(x-a.x))<=margin*Math.hypot(dx,dy)){contains=false;break;}
      }
      if(!contains)break;
    }
    if(contains)return true;
  }
  return false;
}

export function projectOccluders(shapes,camera){
  const faces=[],view=camera.matrixWorldInverse,projection=camera.projectionMatrix;
  for(const shape of shapes){
    // Orbit cameras can enter a building; never use that building from inside its bounds.
    if(shape.box.containsPoint(camera.position))continue;
    for(const quad of shape.walls){
      const points=quad.map(p=>p.clone().applyMatrix4(view));
      if(points.some(p=>-p.z<=camera.near+.05))continue;
      const depth=Math.max(...points.map(p=>-p.z));points.forEach(p=>p.applyMatrix4(projection));
      const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
      if(maxX<-1||minX>1||maxY<-1||minY>1||(maxX-minX)*(maxY-minY)<.0002)continue;
      const area=points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.x*q.y-q.x*p.y;},0);
      if(Math.abs(area)<1e-7)continue;
      faces.push({points,depth,minX,maxX,minY,maxY,sign:Math.sign(area)});
    }
  }
  return faces.sort((a,b)=>a.depth-b.depth);
}

function active(object){for(let o=object;o;o=o.parent)if(!o.visible)return false;return true;}

function indexOccluders(faces){
  const bins=Array.from({length:64},()=>[]),cell=n=>Math.max(0,Math.min(7,Math.floor((n+1)*4)));
  for(const f of faces)for(let y=cell(f.minY);y<=cell(f.maxY);y++)for(let x=cell(f.minX);x<=cell(f.maxX);x++)bins[y*8+x].push(f);
  return rect=>{if(!rect)return false;const x=(rect.minX+rect.maxX)/2,y=(rect.minY+rect.maxY)/2;if(x<-1||x>1||y<-1||y>1)return false;return isOccluded(rect,bins[cell(y)*8+cell(x)]);};
}

export function createVisibilityOptimizer({scene,roots,buildings,shapes}){
  const batches=roots.map(root=>spatialBatch(root));batches.forEach(b=>scene.add(b.group));
  const blocks=shapes.map(s=>({box:new T.Box3(new T.Vector3(Math.min(...s.points.map(p=>p[0])),s.base,Math.min(...s.points.map(p=>p[1]))),new T.Vector3(Math.max(...s.points.map(p=>p[0])),s.top,Math.max(...s.points.map(p=>p[1])))),walls:s.points.map((a,i)=>{const b=s.points[(i+1)%s.points.length];return [new T.Vector3(a[0],s.base,a[1]),new T.Vector3(b[0],s.base,b[1]),new T.Vector3(b[0],s.top,b[1]),new T.Vector3(a[0],s.top,a[1])];})}));
  const buildingBounds=buildings.map(object=>({object,box:new T.Box3().setFromObject(object)}));
  const frustum=new T.Frustum(),vp=new T.Matrix4(),restore=[],restoreRanges=[];
  let stats={};
  function hide(object){if(object.visible){restore.push(object);object.visible=false;}}
  function reset(){for(const [g,start,count] of restoreRanges)g.setDrawRange(start,count);restoreRanges.length=0;for(const object of restore)object.visible=true;restore.length=0;for(const b of batches)b.group.visible=false;}
  function prepare(camera,{enabled=true,occlusion=true,lod=false,lodMode="auto",viewportHeight=720}={}){
    reset();camera.updateMatrixWorld();vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(vp);
    stats={enabled,screenCulled:0,occluded:0,drawnCells:0,totalCells:batches.reduce((n,b)=>n+b.cells.length,0),adaptiveRoots:0,lodEnabled:lod,lodLevels:[0,0,0],lodSavedTriangles:0,lodSavedLines:0};
    if(!enabled&&!lod)return stats;
    const faces=enabled&&occlusion&&buildings.some(active)?projectOccluders(blocks.filter(b=>frustum.intersectsBox(b.box)).map(b=>({b,d:b.box.distanceToPoint(camera.position)})).sort((a,b)=>a.d-b.d).slice(0,24).map(e=>e.b),camera):[];
    const test=indexOccluders(faces),blocked=box=>faces.length>0&&test(projectBounds(box,camera.matrixWorldInverse,camera.projectionMatrix,camera.near));
    for(const b of batches){
      if(!active(b.source))continue;
      let kept=0,draws=0,screenCulled=0,occluded=0,savedTriangles=0,savedLines=0;const levels=[0,0,0];
      for(const c of b.cells){
        if(enabled&&!frustum.intersectsBox(c.box)){c.object.visible=false;screenCulled++;}
        else if(blocked(c.box)){c.object.visible=false;occluded++;}
        else {
          c.object.visible=true;kept++;
          const distance=Math.max(.01,c.box.distanceToPoint(camera.position)),pixelsPerMetre=Math.abs(camera.projectionMatrix.elements[5])*viewportHeight/(2*distance);
          const level=!lod?0:lodMode==='auto'?chooseLOD(pixelsPerMetre,c.level):Number(lodMode);
          c.level=Math.max(0,Math.min(2,level));levels[c.level]++;
          for(const o of c.object.children){const counts=o.userData.lodCounts,count=counts[c.level];o.geometry.setDrawRange(0,count);o.visible=count>0;if(count)draws++;if(o.isMesh)savedTriangles+=(counts[0]-count)/3;else savedLines+=(counts[0]-count)/2;}
        }
      }
      // A uniform distant overview uses original material batches with the same
      // prefix ranges, avoiding hundreds of extra cell draw calls. Restored before
      // collision queries, exports and full-resolution PNG rendering.
      const uniformLevel=levels.findIndex(n=>n===kept);
      if(uniformLevel>=0&&kept>b.cells.length*.65&&draws>b.sourceDraws*1.35){
        stats.adaptiveRoots++;let removedTriangles=0,removedLines=0;
        for(const {object,counts} of b.originals){if(!active(object))continue;const count=counts[uniformLevel],g=object.geometry;
          if(object.isMesh)removedTriangles+=(counts[0]-count)/3;else removedLines+=(counts[0]-count)/2;
          if(count===0)hide(object);else if(count!==counts[0]){restoreRanges.push([g,g.drawRange.start,g.drawRange.count]);g.setDrawRange(0,count);}
        }
        stats.lodSavedTriangles+=removedTriangles;stats.lodSavedLines+=removedLines;stats.lodLevels[uniformLevel]+=kept;continue;
      }
      hide(b.source);b.group.visible=true;stats.drawnCells+=kept;stats.screenCulled+=screenCulled;stats.occluded+=occluded;stats.lodSavedTriangles+=savedTriangles;stats.lodSavedLines+=savedLines;levels.forEach((n,i)=>stats.lodLevels[i]+=n);
    }
    if(enabled)for(const b of buildingBounds){if(!active(b.object))continue;if(!frustum.intersectsBox(b.box)){hide(b.object);stats.screenCulled++;}else if(blocked(b.box)){hide(b.object);stats.occluded++;}}
    return stats;
  }
  function addRoot(root){const batch=spatialBatch(root);batches.push(batch);scene.add(batch.group);return batch;}
  function removeRoot(root){reset();const i=batches.findIndex(b=>b.source===root);if(i<0)return;const [b]=batches.splice(i,1);scene.remove(b.group);b.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();if(o._originalMaterial&&o._originalMaterial!==o.material)o._originalMaterial.dispose();});}
  function dispose(){reset();for(const b of batches){scene.remove(b.group);b.group.traverse(o=>{o.geometry?.dispose();const mats=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];for(const m of mats)m.dispose();if(o._originalMaterial&&o._originalMaterial!==o.material)o._originalMaterial.dispose();});}}
  return {prepare,reset,dispose,addRoot,removeRoot,batches,get stats(){return stats;}};
}
