import * as T from '../domestic-test/vendor/three.module.js';
export const residentVehicleCatalog=[{id:211,name:'경사진 유리창의 소형 해치백',category:'주차·이동',source:'주변 로드뷰 차량 형태 참고',file:'alley-211.glb'},{id:212,name:'골목 주차용 소형 세단',category:'주차·이동',source:'주변 로드뷰 차량 형태 참고',file:'alley-212.glb'}];
// Short body fits the existing 3.8 x 1.8 m bays; glass, seals and wheels are separate editable meshes.
export function createResidentVehicle(id){const g=new T.Group();g.name=residentVehicleCatalog[id-211].name;const hatch=id===211,body=hatch?0x8c9d9e:0xc8cbc5,glass=0x3c535b,trim=0x293237;
 function mesh(geo,color,kind='car'){const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:kind==='glass'?.28:.72}));m.userData.detailKind=kind;g.add(m);return m;}
 function box(x,y,z,w,h,d,c){const geo=new T.BoxGeometry(w,h,d);geo.translate(x,y,z);return mesh(geo,c);}
 function profile(points,depth,c){const s=new T.Shape(points.map(p=>new T.Vector2(...p)));const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:2,steps:1});geo.translate(0,0,-depth/2);return mesh(geo,c);}
 function panel(ps,c,kind='glass'){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([0,1,2,0,2,3].flatMap(i=>ps[i]),3));geo.computeVertexNormals();const m=mesh(geo,c,kind);m.material.side=T.DoubleSide;return m;}
 profile(hatch?[[-1.80,.38],[-1.82,.79],[-1.51,1.35],[.42,1.38],[1.02,.89],[1.63,.79],[1.82,.59],[1.78,.37]]:[[-1.80,.38],[-1.82,.64],[-1.61,.84],[-1.1,.87],[-.84,1.34],[.42,1.38],[1.02,.89],[1.63,.79],[1.82,.59],[1.78,.37]],1.54,body);
 const rear=hatch?-1.60:-.98;
 for(const sign of [-1,1]){const z=.804*sign;
  panel([[rear,.91,z],[hatch?-1.45:-.72,1.28,z],[.03,1.30,z],[.03,.91,z]],glass);
  panel([[.10,.91,z],[.10,1.30,z],[.40,1.31,z],[.87,.92,z]],glass);
  box(.066,1.1,z,.055,.40,.024,trim);box(-.13,.78,z,.017,.22,.02,0x687678);box(-.30,.86,z+.009*sign,.17,.027,.025,trim);box(-1.02,.86,z+.009*sign,.16,.027,.025,trim);
  box(-.1,.37,.79*sign,2.8,.09,.065,trim);box(.56,.94,.82*sign,.20,.13,.12,body);
  for(const x of [-1.14,1.15]){const tire=new T.CylinderGeometry(.285,.285,.16,20);tire.rotateX(Math.PI/2);tire.translate(x,.3,.78*sign);mesh(tire,0x303536,'rubber');const rim=new T.CylinderGeometry(.18,.18,.017,16);rim.rotateX(Math.PI/2);rim.translate(x,.3,.87*sign);mesh(rim,0x9da7a6,'metal');for(let k=0;k<5;k++){const a=k*Math.PI*2/5,sp=box(x+Math.cos(a)*.07,.3+Math.sin(a)*.07,.883*sign,.20,.025,.016,0x526063);sp.geometry.translate(-x,-.3,-.883*sign);sp.geometry.rotateZ(a);sp.geometry.translate(x,.3,.883*sign);}}
 }
 panel([[.44,1.37,-.71],[.44,1.37,.71],[1.0,.93,.72],[1.0,.93,-.72]],glass);
 panel([[hatch?-1.77:-1.09,.91,-.71],[hatch?-1.77:-1.09,.91,.71],[hatch?-1.53:-.85,1.32,.71],[hatch?-1.53:-.85,1.32,-.71]],glass);
 box(1.8,.50,0,.075,.15,1.5,trim);box(-1.79,.49,0,.075,.12,1.48,trim);
 for(const s of [-1,1]){box(1.78,.70,s*.57,.065,.13,.34,0xdad7bd);box(-1.81,.66,s*.57,.05,.13,.29,0x9c5148);}
 box(1.82,.56,0,.018,.15,.43,0xc6d0c9);box(-1.83,.54,0,.018,.13,.41,0xc6d0c9);
 for(const z of [-.17,0,.17])box(1.837,.56,z,.008,.016,.1,0x5d6667);
 for(let i=0;i<4;i++)box(1.819,.42+i*.035,0,.015,.014,.62,0x869390);
 // Windshield wipers and bonnet seam are restrained geometry, without photo textures.
 for(const z of [-.36,.24]){const m=box(.92,.99,z,.028,.018,.44,trim);m.rotation.x=.12;}
 box(1.37,.819,0,.012,.013,1.3,0x8a9593);return g;
}
