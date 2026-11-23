import * as T from 'three';
let atlas;
export async function prepareDetailedStorefront(){atlas=await new T.TextureLoader().loadAsync(new URL('./surfaces-v3.png',import.meta.url).href);atlas.colorSpace=T.SRGBColorSpace;}
export function buildDetailedStorefront(){
 const root=new T.Group();root.name='ReferenceV3Exterior';const mats=new Map();
 const mat=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.85}));return mats.get(c);};
 function box(name,x,y,z,w,h,d,c){const o=new T.Mesh(new T.BoxGeometry(w,h,d),typeof c==='string'?mat(c):c);o.name=name;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
 function rod(name,a,b,r,c){const va=new T.Vector3(...a),vb=new T.Vector3(...b),v=vb.clone().sub(va);const o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),8),mat(c));o.name=name;o.position.copy(va.add(vb).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());root.add(o);return o;}
 function tile(col,row){const t=atlas.clone();t.repeat.set(.495,.495);t.offset.set(col*.5+.0025,(1-row)*.5+.0025);t.needsUpdate=true;return new T.MeshStandardMaterial({map:t,roughness:1});}
 const stock=tile(0,0),freezer=tile(1,0),stone=tile(0,1),ceiling=tile(1,1);
 freezer.map.repeat.set(.475,.30);freezer.map.offset.set(.512,.51);
 const cream=mat('#b9b8a7'),steel='#777d73',dark='#263b32';
 function furniture(name,x,y,z,w,h,d,front){return box(name,x,y,z,w,h,d,[cream,cream,cream,cream,front,cream]);}
 // The photo is a frontage of a larger building. Side/rear dimensions are inferred.
 box('RoomBack',0,1.85,-3.2,9.4,3.7,.12,stone);
 box('RoomFloor',0,.10,-1.5,9.4,.12,3.5,stone);
 box('Ceiling',0,3.70,-1.4,9.4,.12,3.7,ceiling);
 for(const x of [-4.70,4.70])box('RoomSide',x,1.90,-1.5,.15,3.8,3.4,stone);
 for(const x of [-4.65,-.12,4.65])box('StoneFacadePier',x,1.92,-.05,x===-.12?.38:.28,3.84,.45,stone);
 box('StoneSignBacking',0,5.25,-.20,9.65,2.9,.48,stone);
 box('UpperStoneWall',0,6.60,-.24,9.65,1.2,.40,stone);
 for(let i=0;i<5;i++){
  const x=-3.75+i*1.87;box('UpperWindowFrame',x,6.68,.0,1.79,1.05,.08,dark);
  box('UpperWindowGlass',x,6.68,.047,1.66,.92,.018,'#477471');
  box('UpperWindowMullion',x,6.68,.07,.035,1.0,.04,dark);
 }
 function logoTexture(){const c=document.createElement('canvas');c.width=512;c.height=512;const p=c.getContext('2d');p.fillStyle='#f2f1e8';p.fillRect(0,0,512,512);
 p.fillStyle='#f47e48';p.beginPath();p.moveTo(100,62);p.lineTo(400,62);p.lineTo(324,126);p.lineTo(100,126);p.closePath();p.fill();
 p.fillStyle='#e34334';p.beginPath();p.moveTo(404,76);p.bezierCurveTo(290,126,237,190,223,285);p.lineTo(319,285);p.bezierCurveTo(328,215,348,163,404,132);p.closePath();p.fill();p.fillRect(224,355,92,113);
 p.fillStyle='#12613f';p.font='900 71px Arial';p.textAlign='center';p.fillText('ELEVEN',262,340,397);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:t,roughness:.8});}
 const logo=logoTexture();
 // Four stripe panels on either side of one larger logo panel, as in the new reference.
 const signY=4.98,signH=1.58,centerW=1.48,sideW=(9.35-centerW)/8;
 box('BlackSignHousing',0,signY,.14,9.48,signH+.14,.30,'#272c29');
 for(const side of [-1,1])for(let i=0;i<4;i++){
  const x=side*(centerW/2+sideW*(i+.5));box('WhiteSignPanel',x,signY,.305,sideW-.035,signH,.035,'#e9e9e3');
  for(const [dy,h,c]of [[.48,.21,'#fb8252'],[-.01,.32,'#176344'],[-.52,.20,'#e8473e']])box('SignStripe',x,signY+dy,.328,sideW-.045,h,.008,c);
 }
 box('CenterLogoPanel',0,signY,.31,centerW-.035,signH,.035,[cream,cream,cream,cream,logo,cream]);
 for(const y of [signY-signH/2-.04,signY+signH/2+.04])box('SignOuterRim',0,y,.34,9.49,.045,.07,'#272d29');
 // Deep dark-green awning with slim pale hems and ribbed underside.
 box('AwningMount',0,3.98,.15,9.52,.12,.24,'#677367');
 const awning=box('GreenAwning',0,3.94,.73,9.60,.09,1.42,'#174c39');awning.rotation.x=.055;
 box('AwningValance',0,3.78,1.43,9.60,.27,.07,'#164d3b');
 for(const y of [3.64,3.91])box('AwningPaleHem',0,y,1.47,9.60,.025,.025,'#a4b5a0');
 box('AwningSmallLogo',4.02,3.78,1.48,.46,.22,.012,[cream,cream,cream,cream,logo,cream]);
 for(let i=0;i<30;i++)box('SoffitSeam',-4.65+i*.32,3.875,.65,.012,.015,1.38,'#415c4b');
 for(const x of [-3.5,-1.4,1.4,3.5])box('CanopyLight',x,3.83,.74,.24,.055,.20,'#d0d2ba');
 // Window partitions and a recessed entrance; keep the real door opening clear.
 for(const [l,r]of [[-4.48,-.33],[.10,4.48]]){
  for(const y of [.25,2.57,3.63])box('WindowHorizontalFrame',(l+r)/2,y,.16,r-l,.048,.10,steel);
  for(let j=0;j<4;j++)box('WindowUpright',l+(r-l)*j/3,1.94,.16,.045,3.40,.10,steel);
 }
 for(const x of [-1.57,-.40])box('EntryDoorJamb',x,1.46,.24,.045,2.46,.11,steel);
 for(const y of [.23,2.69])box('EntryDoorRail',-.985,y,.24,1.22,.045,.11,steel);
 rod('DoorHandle',[-.57,1.05,.34],[-.57,1.50,.34],.018,'#b9c1ae');
 for(const y of [1.05,1.50])rod('HandleMount',[-.57,y,.24],[-.57,y,.34],.013,steel);
 // Interior: only textured cuboids, rather than individual products.
 for(const x of [-3.1,0,3.1])furniture('InteriorTexturedShelf',x,1.40,-2.8,2.45,2.6,.45,stock);
 furniture('InteriorLowCounter',2.8,.65,-1.25,2.0,1.1,.65,freezer);
 box('InteriorPartition',-3.8,1.55,-1.8,.12,2.9,1.6,stone);
 for(const z of [-.65,-1.75,-2.8])for(const x of [-2.5,2.2])box('CeilingStripLight',x,3.60,z,2.4,.03,.07,'#e7f0dc');
 // Exterior merchandise displays and freezers are also simple textured volumes.
 furniture('LeftOutdoorRack',-2.55,1.15,.53,1.35,2.12,.45,stock);
 furniture('CenterOutdoorRack',.60,1.12,.55,.78,2.08,.44,stock);
 for(const x of [1.72,3.06]){
  furniture('ChestFreezer',x,.64,.70,1.29,.96,.80,freezer);
  box('FreezerLidFrame',x,1.15,.70,1.32,.06,.83,steel);
  box('FreezerGlass',x,1.19,.70,1.18,.024,.68,'#9cae9e');
  box('FreezerLidTrack',x,1.21,.70,.035,.025,.75,'#d1d4c3');
 }
 const packCanvas=document.createElement('canvas');packCanvas.width=512;packCanvas.height=512;const pc=packCanvas.getContext('2d');
 pc.fillStyle='#dedeca';pc.fillRect(0,0,512,512);
 for(let row=0;row<3;row++)for(let col=0;col<2;col++){
  const x=col*256,y=row*170;pc.fillStyle=(row+col)%2?'#e5e4d1':'#d9dfcf';pc.fillRect(x+5,y+5,246,160);
  pc.strokeStyle='#adba9a';pc.lineWidth=5;pc.strokeRect(x+9,y+9,238,152);
  pc.fillStyle=['#789753','#537c86','#b9a064'][row];pc.beginPath();pc.ellipse(x+128,y+80,48,63,0,0,Math.PI*2);pc.fill();
  pc.fillStyle='#eeeede';pc.font='bold 28px sans-serif';pc.textAlign='center';pc.fillText('12',x+128,y+90);
 }
 const packMap=new T.CanvasTexture(packCanvas);packMap.colorSpace=T.SRGBColorSpace;
 furniture('StackedPaperGoods',2.17,1.98,.26,1.30,1.56,.55,new T.MeshStandardMaterial({map:packMap,roughness:1}));
 furniture('PackagedWater',-3.15,.43,1.15,.63,.72,.55,stock);
 // Exterior forecourt, picnic furniture and two green-and-white umbrellas.
 box('ConcreteForecourt',0,-.03,2.7,11.3,.18,5.8,stone);
 box('CurbFace',0,-.14,5.58,11.3,.24,.18,'#93958a');
 function picnic(x,z,scale=1){
  const wood='#775339';
  for(let i=0;i<5;i++)box('TablePlank',x,.80*scale,z+(i-2)*.16*scale,1.65*scale,.07*scale,.15*scale,wood);
  for(const side of [-1,1]){
   for(let i=0;i<2;i++)box('BenchPlank',x,.45*scale,z+side*.76*scale+(i-.5)*.15*scale,1.95*scale,.075*scale,.14*scale,wood);
   for(const xx of [-.56,.56])rod('PicnicALeg',[x+xx*scale,.76*scale,z],[x+xx*scale,.05,z+side*.73*scale],.065*scale,wood);
  }
  for(const xx of [-.56,.56])box('BenchSupport',x+xx*scale,.36*scale,z,.09*scale,.10*scale,1.9*scale,wood);
 }
 picnic(-3.65,3.90,1.14);picnic(-3.65,2.03,.95);picnic(3.55,4.0,1.15);picnic(3.47,2.05,.95);
 function umbrella(x,z){
  rod('UmbrellaPole',[x,0,z],[x,3.38,z],.035,'#d8dccb');
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,b=(i+1)*Math.PI/4,r=1.95;
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([x,3.38,z,x+Math.cos(a)*r,2.65,z+Math.sin(a)*r,x+Math.cos(b)*r,2.65,z+Math.sin(b)*r],3));geo.computeVertexNormals();
   const m=mat(i%2?'#eeeedd':'#14925b').clone();m.side=T.DoubleSide;root.add(new T.Mesh(geo,m));
   rod('UmbrellaRib',[x,3.34,z],[x+Math.cos(a)*r,2.64,z+Math.sin(a)*r],.012,'#c0cabc');
  }
  const badge=new T.Mesh(new T.PlaneGeometry(.47,.42),logo);badge.position.set(x,2.88,z+1.40);badge.rotation.x=-1.21;root.add(badge);
 }
 umbrella(-3.65,2.65);umbrella(3.65,2.68);
 function greenTable(x,z){const o=new T.Mesh(new T.CylinderGeometry(.60,.60,.055,24),mat('#7fce27'));o.position.set(x,.75,z);root.add(o);rod('TablePedestal',[x,.12,z],[x,.73,z],.045,'#ccd0b9');for(const a of [0,2.1,4.2])rod('TableFoot',[x,.25,z],[x+Math.cos(a)*.48,.03,z+Math.sin(a)*.48],.025,'#c3cbb7');}
 function chair(x,z,rotation){const group=new T.Group(),start=root.children.length;
  box('PlasticSeat',x,.47,z,.44,.06,.43,'#81ca25');
  for(const dx of [-.18,.18])for(const dz of [-.16,.16])rod('ChairLeg',[x+dx,.45,z+dz],[x+dx*1.2,.03,z+dz*1.2],.026,'#7bc529');
  for(const dx of [-.20,-.10,0,.10,.20])box('ChairBackSlat',x+dx,.75,z-.19,.055,.48,.045,'#81ca25');
  box('ChairBackTop',x,.99,z-.19,.47,.07,.06,'#81ca25');
  const pieces=root.children.slice(start);for(const p of pieces){p.position.x-=x;p.position.z-=z;group.add(p);}group.position.set(x,0,z);group.rotation.y=rotation;root.add(group);
 }
 greenTable(-.85,3.65);greenTable(-1.02,2.14);
 for(const [x,z,a]of [[-1.65,3.65,-1.57],[-.1,3.65,1.57],[-.85,4.40,0],[-1.8,2.13,-1.57],[-.25,2.10,1.57]])chair(x,z,a);
 root.userData.localReview={revision:3,assetId:'shop:convenience-01',reference:'reference-v3.png',interior:'textured boxes, walls and ceiling',unobserved:'dimensions and rear geometry estimated',publicDeployment:false};
 return root;
}
