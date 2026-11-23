import{PREFIX,definitions,dimensions}from'../asset-encyclopedia/categories/commerce/salon-local/config.js';
export function planSalon(resolve,options={}){
 const d=dimensions(options),{width:w,height:h,depth,frontDepth}=d,placed=[],omitted=[];
 function add(key,x,y,z,layer='interior',yaw=0,support=null){if(!resolve(PREFIX+key))throw Error('필수 에셋 누락: '+key);const p={key,assetId:PREFIX+key,instanceId:'salon-'+placed.length,x,y,z,layer,yaw,support,size:definitions[key].size};if(layer==='exterior'&&z+p.size[2]/2>frontDepth){omitted.push({...p,reason:'앞쪽 소품 공간이 부족합니다.'});return null;}placed.push(p);return p.instanceId;}
 add('sign',0,d.signBottom,0,'fixed');add('decal',d.doorX,1.38,-.015,'fixed');add('sidebrand',w/2-.17,1.45,.12,'fixed');
 add('partition',0,d.floor,d.partitionZ);
 const count=Math.max(2,Math.floor((depth-2.3)/1.55+1e-6));
 for(let i=0;i<count;i++){const z=-1.35-i*1.55;const station=add('station',-w/2+.16,d.floor,z,'interior',Math.PI/2);add('toolkit',-w/2+.235,d.floor+.5875,z,'interior',Math.PI/2,station);add('chair',-w/2+.94,d.floor,z,'interior',-Math.PI/2);if(i<count-1){add('products',-w/2+.12,1.22,z-.775,'interior',Math.PI/2);add('trolley',-w/2+.94,d.floor,z-.775);}}
 // Keep an 85 cm lane between the left chairs and the central mirror cabinets.
 const centerCount=w>=5.2?2:(w>=4.4||depth>=7?1:0),centerZ=Math.min(-2.9,d.partitionZ+1.05);
 for(let i=0;i<centerCount;i++){const x=-w/2+2.67+i*1.4,station=add('centerstation',x,d.floor,centerZ);add('toolkit',x,d.floor+.5875,centerZ+.075,'interior',0,station);add('chair',x,d.floor,centerZ+.95,'interior',Math.PI);}
 add('stock',w/2-.22,d.floor,-2.55,'interior',-Math.PI/2);
 add('products',w/2-.12,1.25,-depth+.70,'interior',-Math.PI/2);
 const reception=add('reception',w/2-.45,d.floor,-1.4);add('terminal',w/2-.45,d.floor+1.1,-1.4,'interior',0,reception);
 add('waiting',w/2-.75,d.floor,-.45);add('wash',w/2-.80,d.floor,-depth+.92);add('towels',-w/2+.43,d.floor,-depth+.30);
 add('planter',w/2-.30,0,1.10,'exterior');add('light',0,h+.30,-depth/2,'lighting');add('aircon',0,h+.27,-depth*.48,'lighting');
 return{...d,placed,omitted,requiredFailures:[],doorClearance:.94,stationCount:count+centerCount,wallStationCount:count,centerStationCount:centerCount};
}
