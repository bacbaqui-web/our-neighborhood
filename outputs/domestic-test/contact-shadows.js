import * as T from 'three';

// A single terrain-conforming draw call for the whole set. Standard material / UV
// also works in GLB; no hard-edged circle or camera-facing shadow card.
export function createContactShadows(items,elevation){
 const size=64,pixels=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const r=Math.hypot((x+.5)/size*2-1,(y+.5)/size*2-1),i=(y*size+x)*4,fade=Math.max(0,1-r*r);pixels[i]=24;pixels[i+1]=29;pixels[i+2]=37;pixels[i+3]=Math.round(255*Math.exp(-r*r*4.2)*fade*fade);}
 const texture=new T.DataTexture(pixels,size,size);texture.colorSpace=T.SRGBColorSpace;texture.magFilter=texture.minFilter=T.LinearFilter;texture.needsUpdate=true;
 const positions=[],uvs=[],colors=[],ranges=[];
 const segments=32,rings=5;
 for(const item of items){const start=positions.length/3,[cx,cy,cz]=item.root,rx=item.radius,rz=item.radiusZ??rx,base=elevation?elevation(cx,cz):cy,offset=.012;
  function vertex(radius,angle){const u=Math.cos(angle)*radius,v=Math.sin(angle)*radius,x=cx+u*rx,z=cz+v*rz,y=(elevation?elevation(x,z):cy)+offset;positions.push(x,y,z);uvs.push(u*.5+.5,v*.5+.5);colors.push(1,1,1,1);}
  for(let ring=0;ring<rings;ring++)for(let j=0;j<segments;j++){const a=j/segments*Math.PI*2,b=(j+1)/segments*Math.PI*2,lo=ring/rings,hi=(ring+1)/rings;vertex(lo,a);vertex(hi,a);vertex(hi,b);if(ring){vertex(lo,a);vertex(hi,b);vertex(lo,b);}}
  ranges.push({item,start,count:positions.length/3-start});
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.setAttribute('color',new T.Float32BufferAttribute(colors,4));
 const material=new T.MeshBasicMaterial({map:texture,color:0xffffff,vertexColors:true,transparent:true,opacity:.50,depthWrite:false,depthTest:true,side:T.DoubleSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 material.addEventListener('dispose',()=>texture.dispose());
 const mesh=new T.Mesh(geo,material);mesh.name='soft-billboard-contact-shadows';mesh.userData={isBillboardShadow:true,contacts:items.length,terrainAnchored:true};mesh.renderOrder=3;
 let legacy=true,visible=true,night=0;
 function refresh(){for(const r of ranges){const alpha=!legacy&&r.item.legacy?0:1;for(let i=r.start;i<r.start+r.count;i++)geo.attributes.color.setW(i,alpha);}geo.attributes.color.needsUpdate=true;mesh.visible=visible;material.opacity=.48+night*.10;}
 return{mesh,ranges,texture,setEnvironment(value){night=value;refresh();},setVisible(value){visible=value;refresh();},setLegacyVisible(value){legacy=value;refresh();}};
}

// Paved courtyards sit above the base terrain. Index just their ground triangles
// so contact shadows follow that visible surface instead of disappearing below it.
export function createContactSurfaceSampler(roots,fallback){
 const cells=new Map(),v=new T.Vector3();
 for(const root of roots){root.updateWorldMatrix(true,true);root.traverse(o=>{if(!o.isMesh||!o.visible||o.userData.detailKind==='roadmark'||!(o.name.startsWith('alley-batch-ground')||['house-shaped-yard','yard-access-surface'].includes(o.name)))return;const p=o.geometry.attributes.position,index=o.geometry.index,n=index?.count??p.count;for(let i=0;i<n;i+=3){const points=[0,1,2].map(k=>v.fromBufferAttribute(p,index?index.getX(i+k):i+k).applyMatrix4(o.matrixWorld).toArray()),[a,b,c]=points,den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-9)continue;const triangle={a,b,c,den};for(let x=Math.floor(Math.min(a[0],b[0],c[0])/3);x<=Math.floor(Math.max(a[0],b[0],c[0])/3);x++)for(let z=Math.floor(Math.min(a[2],b[2],c[2])/3);z<=Math.floor(Math.max(a[2],b[2],c[2])/3);z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(triangle);}}});}
 return (x,z)=>{let y=fallback(x,z);for(const {a,b,c,den} of cells.get(Math.floor(x/3)+','+Math.floor(z/3))||[]){const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,w=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den,t=1-u-w;if(u>=-1e-6&&w>=-1e-6&&t>=-1e-6)y=Math.max(y,u*a[1]+w*b[1]+t*c[1]);}return y;};
}
