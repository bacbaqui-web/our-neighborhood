import * as T from 'three';
export function shapeTools({root,mat,box,rod},logo){
 function picnic(x,z,scale=1){
  const wood='#775339';
  for(let i=0;i<5;i++)box('TablePlank',x,.80*scale,z+(i-2)*.16*scale,1.65*scale,.07*scale,.15*scale,wood);
  for(const side of [-1,1]){
   for(let i=0;i<2;i++)box('BenchPlank',x,.45*scale,z+side*.76*scale+(i-.5)*.15*scale,1.95*scale,.075*scale,.14*scale,wood);
   for(const xx of [-.56,.56])rod('PicnicALeg',[x+xx*scale,.76*scale,z],[x+xx*scale,.05,z+side*.73*scale],.065*scale,wood);
  }
  for(const xx of [-.56,.56])box('BenchSupport',x+xx*scale,.36*scale,z,.09*scale,.10*scale,1.9*scale,wood);
  box('TableUnderRail',x,.66*scale,z,1.70*scale,.13*scale,.10*scale,'#60432c');
  for(const side of [-1,1])rod('TableDiagonalBrace',[x,.65*scale,z],[x+side*.58*scale,.23*scale,z],.045*scale,'#60432c');
 }
 function umbrella(x,z,radius=2.02){
  rod('UmbrellaPole',[x,0,z],[x,3.38,z],.035,'#d8dccb');
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,r=radius,positions=[];
   const point=(ring,j)=>{const f=ring/5,t=j/5,angle=a+t*Math.PI/4,rr=r*f;return[x+Math.cos(angle)*rr,3.38-.69*Math.pow(f,.72)-.045*Math.sin(t*Math.PI)*f,z+Math.sin(angle)*rr];};
   for(let ring=0;ring<5;ring++)for(let j=0;j<5;j++){
    const A=point(ring,j),B=point(ring+1,j),C=point(ring+1,j+1),D=point(ring,j+1);positions.push(...A,...B,...C,...A,...C,...D);
   }
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.computeVertexNormals();
   const m=mat(i%2?'#e8eadf':'#168657').clone();m.side=T.DoubleSide;const cloth=new T.Mesh(geo,m);cloth.name='CurvedUmbrellaCloth';cloth.castShadow=true;cloth.receiveShadow=true;root.add(cloth);
   for(let ring=0;ring<5;ring++)rod('UmbrellaRib',point(ring,0),point(ring+1,0),.012,'#aab7a2');
  }
  const badge=new T.Mesh(new T.PlaneGeometry(.47,.42),logo);badge.position.set(x,2.88,z+1.40);badge.rotation.x=-1.21;root.add(badge);
 }
 function greenTable(x,z){const o=new T.Mesh(new T.CylinderGeometry(.60,.60,.055,24),mat('#7fce27'));o.position.set(x,.75,z);root.add(o);rod('TablePedestal',[x,.12,z],[x,.73,z],.045,'#ccd0b9');for(const a of [0,2.1,4.2])rod('TableFoot',[x,.25,z],[x+Math.cos(a)*.48,.03,z+Math.sin(a)*.48],.025,'#c3cbb7');}
 function chair(x,z,rotation){const group=new T.Group(),start=root.children.length;
  box('PlasticSeat',x,.47,z,.44,.06,.43,'#81ca25');
  for(const dx of [-.18,.18])for(const dz of [-.16,.16])rod('ChairLeg',[x+dx,.45,z+dz],[x+dx*1.2,.03,z+dz*1.2],.026,'#7bc529');
  const back=new T.Shape();back.moveTo(-.22,0);back.lineTo(-.25,.33);back.quadraticCurveTo(-.25,.51,0,.52);back.quadraticCurveTo(.25,.51,.25,.33);back.lineTo(.22,0);back.closePath();
  for(const hx of [-.13,0,.13]){
   const hole=new T.Path();hole.moveTo(hx-.032,.15);hole.lineTo(hx-.032,.36);hole.quadraticCurveTo(hx-.032,.405,hx,.405);hole.quadraticCurveTo(hx+.032,.405,hx+.032,.36);hole.lineTo(hx+.032,.15);hole.quadraticCurveTo(hx,.10,hx-.032,.15);back.holes.push(hole);
  }
  const molded=new T.Mesh(new T.ExtrudeGeometry(back,{depth:.035,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2,curveSegments:8}),mat('#78c72a'));
  molded.name='MoldedChairBackWithSlots';molded.position.set(x,.48,z-.20);molded.rotation.x=-.12;root.add(molded);
  for(const side of [-1,1]){rod('ChairArm',[x+side*.23,.69,z-.16],[x+side*.23,.68,z+.18],.024,'#78c72a');rod('ChairArmSupport',[x+side*.23,.68,z+.18],[x+side*.19,.47,z+.16],.022,'#78c72a');}
  const pieces=root.children.slice(start);for(const p of pieces){p.position.x-=x;p.position.z-=z;group.add(p);}group.position.set(x,0,z);group.rotation.y=rotation;root.add(group);
 }
return {picnic,umbrella,greenTable,chair};
}
