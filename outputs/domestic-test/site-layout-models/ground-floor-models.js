import * as T from 'three';
import {applyWallTexture,wallTextureFor} from '../facade-textures.js?v=masonry19';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';
export function createGroundFloors(plans){
 const group=new T.Group(),batches=new Map();
 function box(x,y,z,w,h,d,color,angle,textureId=null){const g=new T.BoxGeometry(w,h,d);g.rotateY(angle);g.translate(x,y+h/2,z);if(textureId){group.add(applyWallTexture(new T.Mesh(g,new T.MeshStandardMaterial({color,roughness:1})),textureId));return;}if(!batches.has(color))batches.set(color,[]);batches.get(color).push(g);}
 for(const p of plans){const [ux,uz]=p.u,[nx,nz]=p.n,ang=Math.atan2(nx,nz),[x,w,depth]=p.opening,L=p.length,at=(u,v)=>[p.origin[0]+ux*u+nx*v,p.origin[1]+uz*u+nz*v],B=(u,y,v,W,H,D,c,textureId=null)=>{const [X,Z]=at(u,v);box(X,y,Z,W,H,D,c,ang,textureId);};
 const door=(u,v,y=0,W=1.35)=>{B(u,y+.08,v,W,2.15,.08,0x405858);B(u,y+.8,v-.055,W-.12,1.3,.035,0x729194);for(const s of [-1,1])B(u+s*W/2,y+.05,v-.08,.055,2.23,.09,0xb6bcb3);B(u,y+.05,v-.09,.04,2.23,.08,0xb6bcb3);B(u+.19,y+.9,v-.13,.025,.4,.04,0xdadbcf);};
 if(!p.skipWindows&&!p.kind.startsWith('shop'))for(let t=1.25;t<L-1;t+=3.1){
  if(t+1>x-.2&&t-1<x+w+1.8)continue;
  B(t,.95,-.045,1.8,1.1,.07,0x618184);for(const q of [-.92,0,.92])B(t+q,.9,-.09,.05,1.2,.07,0xb4b8ab);for(const y of [.9,2.05])B(t,y,-.09,1.9,.05,.07,0xb4b8ab);
 }
 if(p.kind==='basement-ramp'){
  const ps=[[x,0.09,0],[x+w,.09,0],[x+w,-1.45,depth],[x,-1.45,depth]].map(([a,y,b])=>{const [X,Z]=at(a,b);return [X,y,Z]});const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,1,2,0,2,3].flatMap(i=>ps[i]),3));g.computeVertexNormals();group.add(new T.Mesh(g,new T.MeshStandardMaterial({color:0x747f78,side:T.DoubleSide,roughness:1})));
  for(const side of [x+.08,x+w-.08])B(side,-1.5,depth/2,.15,1.8,depth,0xa9aaa0);
  B(x+w/2,-1.43,depth-.08,w-.2,2.6,.12,0x263330);B(x+w/2,2.35,.12,w,.35,.22,0x54646b);
  B(x+w/2,2.42,-.01,.65,.2,.025,0xd2d6c9);
  for(let k=0;k<8;k++)B(x+(k+.5)*w/8,.11,.3,w/8,.025,.4,k%2?0xd6bc54:0x4c5350);
  // A small pedestrian lobby beside the vehicle opening.
  door(Math.min(L-1,x+w+1),.04,0,1.2);
 }else if(p.kind.startsWith('shop')){
  const count=p.kind==='shop-single'?1:2,gap=p.kind==='shop-pair'?1.4:0,span=(w-gap)/count;
  if(gap)door(x+w/2,depth-.12,0,1.25);
  for(let k=0;k<count;k++){const c=x+(k+.5)*span+(k>0?gap:0),sw=span-.15,v=depth-.1;
   B(c,.08,v,sw,2.35,.08,0x608286);
   if(p.kind==='shop-shutter'&&k===0){B(c,.08,v-.06,sw,2.3,.07,0xa0a8a4);for(let y=.18;y<2.35;y+=.13)B(c,y,v-.11,sw,.018,.025,0x626e6c);}
   else{for(let j=0;j<=3;j++)B(c-sw/2+j*sw/3,.08,v-.08,.045,2.35,.07,0xc2c8bf);B(c+.2,.85,v-.14,.025,.45,.045,0xd4d6c9);}
   B(c,2.46,.18,sw,.35,.3,[0x567b71,0x956957,0x526d88][(p.id+k)%3]);B(c,2.45,.0,sw*.5,.025,.025,0xdadbd0);
   B(c,.08,depth/2,sw,.035,depth,0xbcbdb4);
  }
 }else{
  const step=p.kind==='lobby-steps';door(x+w/2,depth-.1,step?.45:0);
  if(step)for(let j=0;j<3;j++)B(x+w/2,.09,.25+j*.4,w-.1,.15*(j+1),.4,0xa8aaa0);
  B(x+w/2,2.6,.3,w+.1,.1,.75,p.kind==='lobby-side'?0x667d75:0x979b91);
  B(x+w-.15,1.25,depth-.18,.13,.3,.06,0x455250);
  if(p.kind.startsWith('gate')){
   const v=-1.05,gate=x+w/2,G=1.6,h=p.kind==='gate-solid'?1.8:.8,textureId=wallTextureFor({...p,styleIndex:p.styleIndex??0});
   for(const [a,b] of [[.3,gate-G/2],[gate+G/2,L-.3]])if(b>a){B((a+b)/2,.1,v,b-a,h,.18,0x826c60,textureId);B((a+b)/2,h+.1,v,b-a+.03,.08,.25,0xb8b7a6);if(h<1)for(let t=a+.1;t<b;t+=.18)B(t,.9,v,.035,.85,.035,0x3c5148);}
   for(const s of [-1,1])B(gate+s*(G/2+.12),.1,v,.24,1.95,.3,0x85766b,textureId);
   B(gate,.12,v-.02,G,1.7,.075,0x354e44);for(let t=gate-G/2+.09;t<gate+G/2;t+=.13)B(t,.2,v-.07,.025,1.5,.025,0x6f8170);
  }
 }
 }
 for(const [color,gs] of batches){group.add(new T.Mesh(mergeGeometries(gs),new T.MeshStandardMaterial({color,roughness:1})));gs.forEach(g=>g.dispose());}return group;
}
