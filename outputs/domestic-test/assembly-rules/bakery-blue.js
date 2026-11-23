import{PREFIX,definitions,dimensions}from'../asset-encyclopedia/categories/commerce/bakery-blue/config.js';
export const id=k=>PREFIX+k;
export function planBakery(resolve,options={}){
 const d=dimensions(options),{width:w,height:h,depth,doorX,doorLeft,doorRight,frontDepth}=d,placed=[],omitted=[];
 function add(key,x,y,z,layer='interior',yaw=0,support=null){if(!resolve(id(key)))throw Error('필수 에셋 누락: '+key);const size=definitions[key].size,p={key,assetId:id(key),instanceId:'blue-'+placed.length,x,y,z,yaw,layer,size,support};if(layer==='exterior'&&z+size[2]/2>frontDepth){omitted.push({...p,reason:'앞 공간이 부족합니다.'});return null;}placed.push(p);return p.instanceId;}
 add('sign',0,d.signBottom,0,'fixed');add('awning',0,h-.45,0,'fixed');add('decal',doorX,2.12,-.015,'fixed');
 for(const x of[doorLeft-.25,doorRight+.38])for(const y of[.95,1.60])add('poster',x,y,x<doorLeft?.142:-.018,'fixed');
 add('showcase',-w/2+1.2,.12,-.60);add('wallrack',-w/2+.39,.12,-2.1,'interior',Math.PI/2);add('island',-.9,.12,-2.2);
 const counterX=w/2-.82,counterZ=-depth+1.85,support=add('counter',counterX,.12,counterZ);
 add('pos',counterX-.22,1.12,counterZ+.03,'interior',0,support);add('bags',counterX+.23,1.12,counterZ-.03,'interior',0,support);
 add('coffee',w/2-.82,.12,-depth+.4);add('oven',-.55,.12,-depth+.4);add('fridge',-w/2+.50,.12,-depth+.4);
 add('bench',w/2-1.08,0,.60,'exterior');add('board',-w/2+.38,0,.60,'exterior');
 const columns=Math.ceil(w/2.6);for(let i=0;i<columns;i++)for(const z of[-depth*.28,-depth*.72])add('light',-w/2+(i+.5)*w/columns,h+.045,z,'lighting');
 return{...d,placed,omitted,requiredFailures:[],doorClearance:.96};
}
