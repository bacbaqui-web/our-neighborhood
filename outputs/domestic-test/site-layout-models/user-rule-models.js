import * as T from 'three';
import {FacadeBatch} from '../korean-facades.js';

// User-rule mode only. Each ramp has a real aperture in every ground slab.
export function createUserRuleModels(data){
 const group=new T.Group(),batch=new FacadeBatch();
 for(const p of data.ramps||[]){
  const {origin:a,u,n,width:w,depth:d,landing:l,drop}=p,at=(x,y,z)=>[a[0]+u[0]*x+n[0]*z,y,a[1]+u[1]*x+n[1]*z];
  const o=batch.writer([a[0],0,a[1]],u[0],u[1],n[0],n[1]);
  function quad(points,color){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,1,2,0,2,3].flatMap(i=>points[i]),3));g.computeVertexNormals();const m=new T.Mesh(g,new T.MeshStandardMaterial({color,roughness:1,side:T.DoubleSide}));m.receiveShadow=true;group.add(m);}
  quad([at(.03,.07,0),at(w-.03,.07,0),at(w-.03,-drop,d),at(.03,-drop,d)],0x7c817a);
  quad([at(.03,-drop,d),at(w-.03,-drop,d),at(w-.03,-drop,d+l),at(.03,-drop,d+l)],0x646e66);
  for(const x of [.09,w-.09]){
   o.box(x,(2.75-drop)/2,(d+l)/2,.18,2.75+drop,d+l,0xa5aaa0);
   // Short raised boundary at the visible mouth.
   o.box(x,.43,-.15,.22,.72,.3,0x9ca59d);
  }
  o.box(w/2,.3,d+l-.05,w-.2,4.5,.12,0x273632);
  o.box(w/2,2.54,.12,w,.22,.34,0x52636b);
  o.box(w/2,2.55,-.06,.55,.13,.018,0xd8ded3);
  // Drain and transverse grip grooves follow the ramp, not a flat overlay.
  o.box(w/2,.09,.23,w-.2,.035,.23,0x465653);
  for(let z=.6;z<d;z+=.55){const y=.07-(drop+.07)*z/d+.012;quad([at(.2,y,z),at(w-.2,y,z),at(w-.2,y-.01,z+.035),at(.2,y-.01,z+.035)],0x68716b);}
  for(const x of [.23,w-.23])for(let z=.6;z<d;z+=1.6){const y=.07-(drop+.07)*z/d+.02;quad([at(x-.05,y,z),at(x+.05,y,z),at(x+.05,y-.085,z+.5),at(x-.05,y-.085,z+.5)],0xc9bb70);}
 }
 for(const s of data.services||[]){
  const {origin:a,u,n,top,length:L}=s,o=batch.writer([a[0],.07,a[1]],u[0],u[1],n[0],n[1]);
  // Riser, gas meter and valve occupy the selected side facade.
  const x=s.pipeX;
  o.box(x,top/2,.10,.055,top,.055,0x9a9e92);
  o.box(x+.22,.45,.16,.28,.37,.19,0x697269);
  o.box(x+.22,.51,.262,.16,.11,.018,0xb9c4b3);
  o.box((x+L)/2,.70,.12,L-x,.045,.045,0x8f7966);
  o.box(x+.42,.43,.12,.042,.80,.042,0x8f7966);
  o.box(x+.42,.65,.17,.13,.06,.06,0x77795e);
  for(let y=.6;y<top;y+=2.7)o.box(x,y,.08,.13,.055,.14,0x777f73);
 }
 group.add(batch.finish());group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return group;
}
