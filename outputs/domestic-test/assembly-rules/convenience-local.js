// Local trial only. Placement decisions belong here, not in model factories.
export const id=key=>'commerce:seven-local-'+key;
const item=(key,x,z,options={})=>({assetId:id(key),x,z,y:0,yaw:0,required:false,...options});
export const recipe=[
 item('sign',0,.14,{y:4.12,layer:'fixed',required:true}),item('awning',0,.73,{y:3.64,layer:'fixed',required:true}),
 item('rack',-2.65,.55,{layer:'exterior',group:'left-display'}),
 item('narrow-rack',.62,.55,{layer:'exterior',group:'right-display'}),
 item('freezer',1.75,.70,{layer:'exterior',group:'right-display'}),item('freezer',3.15,.70,{layer:'exterior',group:'right-display'}),
 item('picnic',-3.60,2.15,{layer:'exterior',group:'left-seats'}),item('picnic',-3.60,4.20,{layer:'exterior',group:'left-seats'}),item('umbrella',-3.60,3.25,{layer:'exterior',group:'left-seats'}),
 item('picnic',3.70,2.15,{layer:'exterior',group:'right-seats'}),item('picnic',3.70,4.20,{layer:'exterior',group:'right-seats'}),item('umbrella',3.70,3.25,{layer:'exterior',group:'right-seats'}),
 item('table',.95,3.80,{layer:'exterior',group:'green-seats'}),item('chair',.95,4.72,{yaw:Math.PI,layer:'exterior',group:'green-seats'}),item('chair',.05,3.80,{yaw:Math.PI/2,layer:'exterior',group:'green-seats'}),item('chair',1.85,3.80,{yaw:-Math.PI/2,layer:'exterior',group:'green-seats'}),
 item('fridge',-3.1,-2.55,{layer:'interior',required:true}),item('rack',.65,-2.55,{layer:'interior',required:true}),item('rack',2.65,-2.55,{layer:'interior',required:true}),item('checkout',3.15,-.90,{layer:'interior',required:true}),
 item('packs',2.4,-1.75,{layer:'interior'}),
 item('light',-2.45,-1.2,{y:3.53,layer:'lighting',required:true}),item('light',2.4,-1.2,{y:3.53,layer:'lighting',required:true})
];
export const doorCorridor={minX:-1.64,maxX:-.35,minZ:-3.0,maxZ:5.5};
const overlaps=(a,b,gap=0)=>a.minX<b.maxX+gap&&a.maxX>b.minX-gap&&a.minZ<b.maxZ+gap&&a.maxZ>b.minZ-gap;
function bounds(p,d,foot=false){
 const f=foot&&d.footprint?d.footprint:[d.width,d.depth],c=Math.abs(Math.cos(p.yaw)),s=Math.abs(Math.sin(p.yaw)),w=f[0]*c+f[1]*s,depth=f[0]*s+f[1]*c;
 return {minX:p.x-w/2,maxX:p.x+w/2,minZ:p.z-depth/2,maxZ:p.z+depth/2,minY:p.y,maxY:p.y+d.height};
}
export function planConvenience(resolve,{frontDepth=5.5}={}){
 if(!Number.isFinite(frontDepth)||frontDepth<0||frontDepth>8)throw Error('앞 공간 깊이는 0~8m여야 합니다.');
 const placed=[],omitted=[],groups=new Map();
 for(const [index,p]of recipe.entries()){const key=p.group??'single-'+index;if(!groups.has(key))groups.set(key,[]);groups.get(key).push({...p,instanceId:'seven-instance-'+index});}
 for(const candidates of groups.values()){
  const pending=[];let issue=null;
  for(const p of candidates){
   const asset=resolve(p.assetId),d=asset?.assembly?.dimensions;
   if(!asset||!d){issue='백과에 에셋 또는 치수가 없습니다.';break;}
   const full=bounds(p,d),foot=bounds(p,d,true);
   if(p.layer==='exterior'){
    if(full.minX< -5.8||full.maxX>5.8||full.minZ<.02||full.maxZ>frontDepth){issue='앞쪽 가용 공간이 부족합니다.';break;}
   }else if(p.layer==='interior'&&(full.minX< -4.55||full.maxX>4.55||full.minZ< -3.1||full.maxZ>0)){issue='실내 배치 영역을 벗어납니다.';break;}
   if(['interior','exterior'].includes(p.layer)){
    if(overlaps(foot,doorCorridor)){issue='출입 동선을 침범합니다.';break;}
    const collision=[...placed,...pending].find(q=>['interior','exterior'].includes(q.layer)&&q.bounds.minY<full.maxY&&q.bounds.maxY>full.minY&&overlaps(foot,q.bounds,.015));
    // Umbrella poles may pass through the matching table's central socket.
    if(collision&&!(p.assetId===id('umbrella')&&collision.group===p.group)){issue='다른 에셋과 겹칩니다: '+collision.assetId;break;}
   }
   pending.push({...p,bounds:foot,fullBounds:full});
  }
  if(issue)for(const p of candidates)omitted.push({...p,reason:issue});else placed.push(...pending);
 }
 return {placed,omitted,requiredFailures:omitted.filter(p=>p.required),frontDepth,corridor:doorCorridor};
}
