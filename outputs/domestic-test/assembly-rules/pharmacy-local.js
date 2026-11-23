import {frontage} from '../asset-encyclopedia/categories/commerce/pharmacy-local/frontage.js';
export const id=k=>'commerce:pharmacy-local-'+k;
export function planPharmacy(resolve,{width=6.4,height=3.0,depth=4,frontDepth=1.5}={}){
 if(!Number.isFinite(width)||width<4.8||width>9||!Number.isFinite(height)||height<2.7||height>3.3||!Number.isFinite(depth)||depth<3.5||depth>5||!Number.isFinite(frontDepth)||frontDepth<0||frontDepth>8)throw Error('지원 크기 범위를 벗어났습니다.');
 const side=frontage({width,height,depth}).side,gh=height+.17,items=[];const add=(key,x,y,z,layer)=>items.push({assetId:id(key),x,y,z,yaw:0,layer,required:layer!=='exterior'});
 add('sign',0,frontage({width,height,depth}).signBottom+.01,.05,'fixed');for(const s of [-1,1])add('glassprint',s*(.825+side/2),.1,.065,'fixed');
 for(const s of [-1,1]){
  add('doorprint',s*.41,.12,-.014,'fixed');
  // Stable irregular placement in metres; paper size never stretches with glazing.
  for(const [x,y]of [[.43,1.19],[1.08,1.26],[1.45,1.17],[1.84,1.32],[1.12,1.74],[1.52,1.69]])add('a4-notice',s*x,y+(s>0?.055:0),-.019,'fixed');
 }
 add('board',width/2-.5,0,.7,'exterior');add('rack',-width/2+.5,0,.55,'exterior');
 // Front customer area, rear reception, then staff aisle and dispensing storage.
 const count=Math.max(1,Math.floor((width-.2)/1.8));for(let i=0;i<count;i++)add('drawers',(i-(count-1)/2)*1.8,.12,-depth+.35,'interior');
 const counterCount=Math.max(1,Math.floor((width-2.4)/1.8));
 for(let i=0;i<counterCount;i++){const x=(i-(counterCount-1)/2)*1.8,z=-depth+1.7;add('counter',x,.12,z,'interior');const supportIndex=items.length-1;add('counter-display',x-.48,1.14,z+.08,'interior');items.at(-1).supportIndex=supportIndex;add('counter-notice',x+.02,1.14,z+.16,'interior');items.at(-1).supportIndex=supportIndex;}
 const sideCount=Math.max(1,Math.floor((depth-1.4)/1.5));
 for(const sign of [-1,1])for(let i=0;i<sideCount;i++){add('cabinet',sign*(width/2-.30),.12,-depth+.65+.75+i*1.5,'interior');items.at(-1).yaw=-sign*Math.PI/2;}
 for(const sign of [-1,1])add('lowdisplay',sign*(width/2-1.02),.12,-.40,'interior');
 if(width>=8)add('bench',width/2-2.6,.12,-.40,'interior');
 const columns=Math.max(2,Math.ceil(width/2.5));for(let i=0;i<columns;i++)for(const z of [-depth*.28,-depth*.72])add('light',-width/2+(i+.5)*width/columns,gh-.12,z,'lighting');
 const placed=[],omitted=[];for(const [i,p]of items.entries()){p.instanceId='pharmacy-'+i;const d=resolve(p.assetId)?.assembly?.dimensions;let reason=!d?'백과 에셋 또는 치수가 없습니다.':null;if(d&&p.layer==='exterior'&&p.z+d.depth/2>frontDepth)reason='앞 공간이 부족합니다.';if(d&&p.assetId===id('counter')&&p.z+d.depth/2>-.8)reason='접수대 앞 고객 공간이 부족합니다.';if(reason)omitted.push({...p,reason});else placed.push(p);}
 return{placed,omitted,requiredFailures:omitted.filter(p=>p.required),width,height,depth,frontDepth,shelfCount:count,counterCount,counterLength:counterCount*1.8,staffAisle:.75};}
