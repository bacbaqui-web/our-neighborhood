import assert from 'node:assert/strict';
import {routeCorrection,deformTerrain} from '../outputs/domestic-test/route-elevation.js';
import * as T from 'three';
import {seatGroundAsset} from '../outputs/domestic-test/ground-contact.js';
const base=(x,z)=>x*.05+z*.01,c=routeCorrection({datum:0,segments:[[[0,0,2],[10,0,3]]]},p=>p.slice(0,2),base);
assert(Math.abs(base(5,0)+c.delta(5,0)-2.5)<1e-8);assert.equal(c.delta(5,130),0);
const root=new T.Group(),g=new T.PlaneGeometry(10,10,2,2);g.rotateX(-Math.PI/2);const m=new T.Mesh(g);m.name='ground';root.add(m);const n=g.attributes.position.count;deformTerrain(root,c.delta);assert.equal(g.attributes.position.count,n);assert([...g.attributes.position.array,...g.attributes.normal.array].every(Number.isFinite));
const car=new T.Group();for(const x of [-.7,.7])for(const z of [-1,1]){const w=new T.Mesh(new T.CylinderGeometry(.25,.25,.15,12),new T.MeshBasicMaterial());w.rotation.z=Math.PI/2;w.position.set(x,.25,z);w.userData.groundContactWheel=true;car.add(w);}
const qa=seatGroundAsset(car,(x,z)=>.025*x*z,{suspension:true});assert(qa.maxGap<.001);console.log('Route height constraints, fade, geometry budget and wheel contact passed');
