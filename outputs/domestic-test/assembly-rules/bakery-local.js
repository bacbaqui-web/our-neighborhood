import {PREFIX,definitions,dimensions} from '../asset-encyclopedia/categories/commerce/bakery-local/config.js';
export const id=k=>PREFIX+k;
export function planBakery(resolve,options={}){
 const d=dimensions(options),{width:w,depth,doorX,doorRight,frontDepth}=d,placed=[],omitted=[];
 function add(key,x,y,z,layer='interior',yaw=0,support=null){const entry=resolve(id(key));if(!entry)throw Error('필수 에셋 누락: '+id(key));const size=definitions[key].size;const p={assetId:id(key),key,instanceId:'bakery-'+placed.length,x,y,z,yaw,layer,required:layer!=='exterior',size,support};if(layer==='exterior'&&z+size[2]/2>frontDepth){omitted.push({...p,reason:'앞 공간이 부족합니다.'});return null;}placed.push(p);return p.instanceId;}
 add('sign',0,d.signBottom,.02,'fixed');add('decal',doorX,1.46,-.015,'fixed');add('partition',0,.12,d.partitionZ,'fixed');
 const available=w/2-.20-(doorRight+.15),count=Math.max(1,Math.floor(available/1.5));
 for(let i=0;i<count;i++)add('showcase',doorRight+.15+.70+i*1.5,.12,-.58);
 const counterX=w/2-.78, counterZ=d.partitionZ+1.15;
 const counter=add('counter',counterX,.12,counterZ);
 add('pos',counterX-.23,1.12,counterZ+.04,'interior',0,counter);
 add('bags',counterX+.23,1.12,counterZ-.04,'interior',0,counter);
 const shelves=Math.max(0,Math.floor((w-3.04)/1.25));
 for(let i=0;i<shelves;i++)add('shelf',doorRight+.78+i*1.25,.12,d.partitionZ+.28);
 add('oven',w/2-.70,.12,-depth+.4);if(w>=4.8)add('trays',doorRight+.32,.12,-1.30);
 add('board',w/2-.7,0,.62,'exterior');// No plant in the selected storefront reference; retained as an unplaced reusable asset.

 const columns=Math.ceil(w/2.5);for(let i=0;i<columns;i++)for(const z of [-depth*.28,-depth*.7])add('light',-w/2+(i+.5)*w/columns,d.height+.045,z,'lighting');
 return {...d,placed,omitted,requiredFailures:[],showcaseCount:count,shelfCount:shelves,doorClearance:1.10};
}
