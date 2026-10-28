import * as T from 'three';

// Contacts use the rendered tyre/foot vertices, not the centre of a bounding box.
export function contactPoints(geometry,matrix=new T.Matrix4()){
 const points=[],seen=new Set(),p=geometry.attributes.position,v=new T.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);const key=v.toArray().map(n=>Math.round(n*1e5)).join(',');if(!seen.has(key)){seen.add(key);points.push(v.clone());}}
 return points;
}
export function lowestContact(root,points,surface){
 root.updateMatrix();let gap=Infinity,point;
 for(const p of points){const v=p.clone().applyMatrix4(root.matrix),d=v.y-surface(v.x,v.z);if(d<gap){gap=d;point=v;}}
 return{gap,point};
}
function solve(matrix,rhs){
 const a=matrix.map((r,i)=>[...r,rhs[i]]);
 for(let j=0;j<3;j++){let p=j;for(let i=j+1;i<3;i++)if(Math.abs(a[i][j])>Math.abs(a[p][j]))p=i;[a[j],a[p]]=[a[p],a[j]];const d=a[j][j];for(let k=j;k<4;k++)a[j][k]/=d;for(let i=0;i<3;i++)if(i!==j){const f=a[i][j];for(let k=j;k<4;k++)a[i][k]-=f*a[j][k];}}
 return a.map(r=>r[3]);
}
export function fitContactPose(root,contacts,surface){
 if(!contacts.length)return null;
 // Least-squares pitch/roll, iterated because the tyre contact moves when tilted.
 // A two-wheel bike only pitches along its wheelbase; it remains upright sideways.
 for(let pass=0;pass<12;pass++){
  const hits=contacts.map(c=>lowestContact(root,c,surface)),M=[[0,0,0],[0,1e-6,0],[0,0,1e-6]],b=[0,0,0];
  for(const h of hits){const row=[1,h.point.x-root.position.x,h.point.z-root.position.z];for(let i=0;i<3;i++){b[i]-=row[i]*h.gap;for(let j=0;j<3;j++)M[i][j]+=row[i]*row[j];}}
  const [y,dx,dz]=solve(M,b);root.position.y+=y;
  const tilt=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(-dx,1,-dz).normalize());root.quaternion.premultiply(tilt);
  if(Math.max(Math.abs(y),Math.abs(dx),Math.abs(dz))<1e-6)break;
 }
 // A rigid chassis cannot match a twisted surface exactly. No tyre may penetrate.
 const hits=contacts.map(c=>lowestContact(root,c,surface));root.position.y-=Math.min(...hits.map(h=>h.gap));
 return contactReport(root,contacts,surface);
}
export function contactReport(root,contacts,surface){
 const hits=contacts.map(c=>lowestContact(root,c,surface));
 return{method:'rendered-contact-vertices',contacts:hits.map(h=>({at:h.point.toArray(),gap:h.gap})),maxGap:Math.max(...hits.map(h=>h.gap))};
}

// Library models retain separate tyre meshes, so their wheels can be recognised
// before batching. Return their actual local vertex clouds (including bevels).
export function libraryWheelContacts(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),wheels=[];
 root.traverse(m=>{if(!m.isMesh)return;const g=m.geometry,p=g.parameters||{},rubber=m.userData.detailKind==='rubber'||m.userData.part==='dark';
  const matrix=inverse.clone().multiply(m.matrixWorld),torus=g.type==='TorusGeometry';g.computeBoundingBox();const size=g.boundingBox.getSize(new T.Vector3()),dims=size.toArray(),axisIndex=dims.indexOf(Math.min(...dims)),axis=new T.Vector3(axisIndex===0?1:0,axisIndex===1?1:0,axisIndex===2?1:0).transformDirection(matrix);
  if(m.userData.groundContactWheel||(rubber&&Math.abs(axis.y)<.35&&((torus&&p.radius>=.085&&p.tube>=.025)||(g.type==='CylinderGeometry'&&p.radiusTop>=.12)))){const points=contactPoints(g,matrix);if(Math.min(...points.map(v=>v.y))<.12)wheels.push({mesh:m,points});}
 });return wheels;
}
export function seatGroundAsset(root,surface,{wheels=true}={}){
 if(root.userData.wheelContactPoints){const qa=fitContactPose(root,root.userData.wheelContactPoints.map(ps=>ps.map(p=>new T.Vector3(...p))),surface);root.userData.groundFit=qa;return qa;}
 const wheelParts=wheels?libraryWheelContacts(root):[];
 if(wheelParts.length>=2){
  const qa=fitContactPose(root,wheelParts.map(w=>w.points),surface);root.userData.groundFit=qa;return qa;
 }
 // Fixed furniture stays vertical. Only the bottom of its feet/plinth adapts;
 // shelves, doors and seats keep their original rectangular shape.
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),parts=[];let bottom=Infinity;
 root.traverse(m=>{if(!m.isMesh)return;const matrix=inverse.clone().multiply(m.matrixWorld),points=contactPoints(m.geometry,matrix);const min=Math.min(...points.map(p=>p.y));bottom=Math.min(bottom,min);parts.push({m,matrix,points,min});});
 const feet=parts.filter(p=>p.min<=bottom+.055),contacts=feet.map(p=>p.points.filter(v=>v.y<=bottom+.06));
 if(!contacts.length)return null;
 root.position.y-=Math.min(...contacts.map(c=>lowestContact(root,c,surface).gap));root.updateMatrixWorld(true);
 const top=bottom+.24;
 for(const {m,matrix,min} of feet){
  m.geometry=m.geometry.clone();const p=m.geometry.attributes.position,back=matrix.clone().invert(),v=new T.Vector3();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);if(v.y>top)continue;const foot=new T.Vector3(v.x,min,v.z).applyMatrix4(root.matrix),delta=surface(foot.x,foot.z)-foot.y;
   v.y+=delta/root.scale.y*Math.max(0,(top-v.y)/(top-min));v.applyMatrix4(back);p.setXYZ(i,v.x,v.y,v.z);
  }p.needsUpdate=true;m.geometry.computeVertexNormals();m.geometry.computeBoundingBox();m.geometry.computeBoundingSphere();
 }
 root.updateMatrixWorld(true);const actual=feet.map(({m})=>{const cloud=contactPoints(m.geometry,inverse.copy(root.matrixWorld).invert().multiply(m.matrixWorld));return cloud;});
 const qa=contactReport(root,actual,surface);qa.method='vertical-furniture-adaptive-feet';root.userData.groundFit=qa;return qa;
}
