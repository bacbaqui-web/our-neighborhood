import {addSignText} from '../facilities/models.js';
import * as T from 'three';
import {FacadeBatch} from '../korean-facades.js?v=39';

// Measurements are explicitly estimated from reviewed street views. No text,
// logos or photographic textures are embedded in these editable face meshes.
const c = v => typeof v === 'string' ? Number('0x' + v.replace('#','')) : v;
export function buildStorefront(spec, {shell=true, props=true, attachment=false}={}) {
  const batch=new FacadeBatch(), out=batch.writer(), B=(x,y,z,w,h,d,col)=>out.box(x,y,z,w,h,d,c(col)), Q=(x,y,z,w,h,col)=>out.quad(x,y,z,w,h,c(col),false), R=(a,b,r,col)=>out.rod(a,b,r,c(col),r>.08?8:4);
  const signBatch=new FacadeBatch(),windowBatch=new FacadeBatch(),signOut=signBatch.writer(),windowOut=windowBatch.writer();
  const S=(x,y,z,w,h,d,col)=>signOut.box(x,y,z,w,h,d,c(col));
  const G=(x,y,z,w,h,col)=>windowOut.quad(x,y,z,w,h,c(col),false);
  const plantAnchors=[];
  const W=spec.width,H=spec.height;
  const polygon=(points,col)=>{
    const b=batch.bucket(c(col));
    for(let j=1;j<points.length-1;j++){
      const tri=[points[0],points[j],points[j+1]].map(p=>new T.Vector3(...p));
      const normal=tri[1].clone().sub(tri[0]).cross(tri[2].clone().sub(tri[0])).normalize();
      for(const p of tri){b.p.push(...p.toArray());b.n.push(...normal.toArray());b.inkIds.push(0);}
    }
  };
  const horizontalDisc=(x,y,z,r,col)=>polygon(Array.from({length:12},(_,i)=>{const a=-i*Math.PI/6;return[x+Math.cos(a)*r,y,z+Math.sin(a)*r];}),col);
  if(shell){
    B(0,H/2,-.24,W,H,.48,spec.wall);
    B(0,H+.04,-.03,W+.06,.08,.62,spec.cap||'#b4b1aa');
    // A plinth with shallow reveals; no invented whole upper building.
    B(0,.08,.015,W,.16,.05,spec.base||'#96968e');
  }
  if(attachment)B(0,H/2,.025,W,H,.04,spec.wall);
  if(spec.pattern){
    const brick=spec.pattern==='brick',dy=brick?.18:.42,dx=brick?.40:.70;
    out.detail(0,()=>{for(let row=0,y=.15;y<H;y+=dy,row++){
      batch.lineBucket(c(spec.joint||'#aaa59c')).push(-W/2,y,attachment?.05:.006,W/2,y,attachment?.05:.006);
      const rh=Math.min(dy,H-y);
      for(let x=-W/2+dx/2+(row%2)*dx/2;x<W/2-.01;x+=dx)batch.lineBucket(c(spec.joint||'#aaa59c')).push(x,y,attachment?.051:.007,x,y+rh,attachment?.051:.007);
    }});
  }
  for(const p of spec.panels||[])B(p.x,p.y,p.z??.04,p.w,p.h,p.d??.06,p.color);
  for(const s of spec.signs||[]){
    S(s.x,s.y,.15,s.w,s.h,s.d??.22,s.color);
    for(const t of s.bands||[])S(s.x+(t.x||0),s.y+(t.y||0),.274,t.w||s.w,t.h,.03,t.color);
  }
  for(const s of spec.sideSigns||[])S(s.x,s.y,s.z||.65,.18,s.h,s.depth||.95,s.color);
  for(const o of spec.openings||[]){
    const f=o.frame||'#777b77',z=.13,th=o.frameWidth||.045,bottom=o.y-o.h/2,left=o.x-o.w/2;
    const n=o.panes||2,pw=(o.w-(n+1)*th)/n;
    B(o.x,bottom-.035,.14,o.w+.12,.07,.30,spec.base||'#aaa99f');
    for(let i=0;i<n;i++){
      const x=left+th+pw/2+i*(pw+th),isDoor=i===o.door,gh=o.h-2*th;
      G(x,o.y,z,pw,gh,o.glass||'#465c60');
      if(o.display&&!isDoor){
        // Flat stock silhouettes behind the front frame, without labels or noisy textures.
        const shelves=o.display==='shelves'?3:1;
        for(let row=0;row<shelves;row++){
          const yy=bottom+.46+row*.44;
          B(x,yy,z+.018,pw-.08,.035,.055,'#acb9b2');
          for(let j=0;j<3;j++)B(x-pw*.30+j*pw*.30,yy+.12,z+.025,pw*.14,.19,.035,['#c5d3bd','#d9cbb6','#a7bbb4','#e1ddd0'][(row+j)%4]);
        }
        if(o.display==='counter')B(x,bottom+.38,z+.02,pw-.08,.5,.05,'#917f68');
      }
      if(o.frost)G(x,bottom+th+gh*o.frost/2,z+.006,pw,gh*o.frost,o.frostColor||'#b4c5bf');
      if(o.lowerColor)Q(x,bottom+th+.28,z+.008,pw,.56,o.lowerColor);
      if(isDoor){
        B(x+pw*.32,bottom+1.05,z+.075,.025,.42,.04,'#c7c9bd');
        for(const y of [.25,1.8])B(x-pw/2+.03,bottom+y,z+.035,.045,.09,.04,f);
      }
      if(o.transom){B(x,bottom+o.h-.40,z+.04,pw,.045,.065,f);}
    }
    for(let i=0;i<=n;i++)B(left+th/2+i*(pw+th),o.y,z+.035,th,o.h,.075,f);
    for(const y of [bottom+th/2,bottom+o.h-th/2])B(o.x,y,z+.035,o.w,th,.075,f);
    for(let j=1;j<(o.rows||1);j++)B(o.x,bottom+o.h*j/o.rows,z+.045,o.w,.035,.065,f);
    if(o.stripe)Q(o.x,bottom+(o.stripe.y||.65),z+.055,o.w,o.stripe.h||.08,o.stripe.color);
    for(const p of o.papers||[])Q(o.x+p.x,bottom+p.y,z+.06,p.w,p.h,p.color||'#dcdcd3');
  }
  for(const s of spec.shutters||[]){
    B(s.x,s.y,.07,s.w+.16,s.h+.12,.14,s.frame||'#9a9c97');
    Q(s.x,s.y,.15,s.w,s.h,s.color||'#bdc0b8');
    for(let y=s.y-s.h/2+.09;y<s.y+s.h/2;y+=.105)out.detail(1,()=>Q(s.x,y,.159,s.w,.012,'#919990'));
    B(s.x,s.y-s.h/2+.08,.19,.14,.035,.04,'#555c57');
  }
  for(const a of spec.awnings||[]){
    const depth=a.depth||1,rows=a.kind==='curve'?6:1;
    const yAt=z=>a.y-(a.drop||.40)*(a.kind==='curve'?(1-Math.sqrt(Math.max(0,1-(z/depth)**2))):z/depth);
    const strips=a.stripe?Math.max(2,Math.round(a.w/.30)):1;
    for(let i=0;i<strips;i++)for(let j=0;j<rows;j++){
      const x0=a.x-a.w/2+a.w*i/strips,x1=x0+a.w/strips,z0=.18+depth*j/rows,z1=.18+depth*(j+1)/rows;
      polygon([[x0,yAt(z0-.18),z0],[x1,yAt(z0-.18),z0],[x1,yAt(z1-.18),z1],[x0,yAt(z1-.18),z1]],a.stripe&&i%2?a.stripe:a.color);
    }
    B(a.x,yAt(depth)-.07,depth+.18,a.w,.14,.035,a.color);
    R([a.x-a.w/2,a.y,.16],[a.x+a.w/2,a.y,.16],.024,a.frame||'#777c70');
    for(const x of [a.x-a.w/2,a.x+a.w/2]){
      R([x,a.y-.5,.14],[x,yAt(depth)-.025,depth+.16],.018,a.frame||'#777c70');
      if(a.kind==='curve')for(let j=0;j<rows;j++)R([x,yAt(depth*j/rows),.18+depth*j/rows],[x,yAt(depth*(j+1)/rows),.18+depth*(j+1)/rows],.014,a.frame||'#c7c5b2');
    }
  }
  for(const d of spec.decals||[]){
    if(d.points)polygon(d.points.map(([x,y])=>[x,y,d.z??.29]),d.color);
  }
  for(const s of spec.steps||[])B(s.x,s.h/2,s.z,s.w,s.h,s.d,s.color||'#aaa99e');
  if(props)for(const p of spec.props||[]){
    const x=p.x,y=p.y||0,z=p.z||.55,scale=p.scale||1;
    const box=(xx,yy,zz,w,h,d,col)=>B(x+xx*scale,y+yy*scale,z+zz*scale,w*scale,h*scale,d*scale,col);
    if(p.type==='ac'){
      const count=p.stack||1;
      for(const xx of [-.34,.34])box(xx,.025,0,.10,.05,.34,'#777e78');
      for(let k=0;k<count;k++){
        const yy=.37+k*.75;box(0,yy,0,.92,.64,.4,'#d1cfc0');
        polygon(Array.from({length:12},(_,j)=>{const a=j*Math.PI/6;return[x+(-.19+.21*Math.cos(a))*scale,y+(yy+.21*Math.sin(a))*scale,z+.211*scale];}),'#535d55');
        for(let j=0;j<5;j++)box(.25,yy-.19+j*.093,.215,.22,.012,.025,'#6d776d');
        for(let j=0;j<4;j++){const q=j*Math.PI/2;R([x-.19*scale,y+yy*scale,z+.237*scale],[x+(-.19+.18*Math.cos(q))*scale,y+(yy+.18*Math.sin(q))*scale,z+.237*scale],.008*scale,'#9ba094');}
      }
      if(count>1)for(const xx of [-.51,.51])box(xx,count*.375,0,.035,count*.75,.48,'#535c56');
    }else if(p.type==='freezer'){
      const w=p.w||1.55;box(0,.43,0,w,.78,.72,'#d9dbd2');box(0,.85,0,w+.04,.06,.75,'#9ba5a0');
      for(const d of [-1,1]){box(d*w*.245,.889,0,w*.46,.015,.64,'#c4d3cd');box(d*w*.245,.90,.22,.18,.02,.035,'#6f7871');}
    }else if(p.type==='rack'){
      const w=p.w||1.15,h=p.h||1.55;
      for(const xx of [-w/2,w/2])for(const zz of [-.24,.24])box(xx,h/2,zz,.027,h,.027,'#5e6861');
      for(let k=0;k<4;k++)box(0,.12+k*(h-.18)/3,0,w,.035,.5,'#8b9286');
      if(p.stock)for(let k=0;k<3;k++)for(let j=0;j<3;j++)box(-w*.31+j*w*.31,.29+k*(h-.18)/3,0,w*.25,.28,.36,['#b1baa4','#c7b597','#a0ad9d'][j]);
    }else if(p.type==='crates'){
      for(let k=0;k<(p.stack||3);k++){box(0,.11+k*.22,0,.57,.21,.43,p.color||'#355e8e');for(let j=0;j<4;j++)Q(x+(-.22+j*.145)*scale,y+(.13+k*.22)*scale,z+.222*scale,.085*scale,.10*scale,'#273f54');}
    }else if(p.type==='garments'){
      for(const xx of [-.55,.55]){box(xx,.8,0,.025,1.6,.025,'#a3aaa1');box(xx,.04,0,.04,.06,.55,'#727c74');}
      box(0,1.57,0,1.16,.025,.025,'#a3aaa1');
      polygon([[-.14,1.46],[-.31,1.38],[-.43,1.07],[-.28,1.01],[-.18,1.18],[-.18,.57],[.20,.57],[.20,1.18],[.29,1.02],[.43,1.08],[.29,1.39],[.12,1.46]].map(([xx,yy])=>[x+xx*scale,y+yy*scale,z+.04]),'#d8e0d4');
    }else if(p.type==='heater'||p.type==='cabinet'){
      box(0,.40,0,1.05,.74,.40,'#bfc1b6');
      if(p.type==='heater')for(let j=0;j<4;j++)box(-.09,.18+j*.13,.21,.73,.07,.02,'#4d5952');
      else{box(0,.4,.213,.015,.65,.02,'#8c958c');box(.08,.45,.235,.025,.12,.025,'#59665b');}
    }else if(p.type==='board'){
      box(0,.65,0,p.w||.52,1.25,.08,p.color||'#c7cec7');box(0,.67,.047,(p.w||.52)-.10,1.08,.012,p.face||'#536968');
    }else if(p.type==='bench'){
      box(0,.44,0,p.w||1.5,.08,.40,p.color||'#9b8162');for(const xx of [-.5,.5])box(xx,.22,0,.07,.44,.32,'#646d66');
    }else if(p.type==='planter'){
      box(0,.24,0,.43,.48,.43,p.color||'#a48d73');box(0,.47,0,.34,.025,.34,'#6d6751');
      plantAnchors.push({id:'shop-planter-'+spec.id+'-'+plantAnchors.length,kind:'plant',asset:'leafy-herb',root:[x,y+.48*scale,z],height:.45*scale,radius:.22*scale,source:'storefront-planter'});
    }else if(p.type==='cafeTable'){
      R([x,y+.69*scale,z],[x,y+.73*scale,z],.36*scale,'#999d92');
      horizontalDisc(x,y+.73*scale,z,.36*scale,'#999d92');
      R([x,y+.05*scale,z],[x,y+.69*scale,z],.025*scale,'#657067');
      for(let j=0;j<3;j++){const a=j*Math.PI*2/3;R([x,y+.30*scale,z],[x+Math.cos(a)*.30*scale,y+.03*scale,z+Math.sin(a)*.30*scale],.018*scale,'#657067');}
      for(const side of [-1,1]){
        const cx=x+side*.65*scale;R([cx,y+.42*scale,z],[cx,y+.45*scale,z],.22*scale,'#8d9788');horizontalDisc(cx,y+.45*scale,z,.22*scale,'#8d9788');
        for(const dz of [-.16,.16])for(const dx of [-.15,.15])R([cx+dx*scale,y+.43*scale,z+dz*scale],[cx+dx*1.2*scale,y+.025*scale,z+dz*1.2*scale],.012*scale,'#5d6b61');
        for(let j=0;j<6;j++){const a=j*Math.PI/6,b=(j+1)*Math.PI/6;R([cx+Math.cos(a)*.22*scale,y+(.52+Math.sin(a)*.36)*scale,z-.16*scale],[cx+Math.cos(b)*.22*scale,y+(.52+Math.sin(b)*.36)*scale,z-.16*scale],.012*scale,'#5d6b61');}
        R([cx,y+.46*scale,z-.16*scale],[cx,y+.86*scale,z-.16*scale],.009*scale,'#657067');
      }
    }else if(p.type==='lantern'){
      signOut.rod([x,y+.12,z],[x,y+.46,z],.15,c('#b75c60'),8);
      for(const dy of [.10,.48])R([x,y+dy,z],[x,y+dy+.025,z],.10,'#5a4341');
      R([x,y+.50,z],[x,y+.66,z],.009,'#494e45');
      for(let j=0;j<8;j++){const a=j*Math.PI/4;R([x+Math.cos(a)*.153,y+.14,z+Math.sin(a)*.153],[x+Math.cos(a)*.153,y+.44,z+Math.sin(a)*.153],.006,'#cc7771');}
      R([x,y+.10,z],[x,y-.18,z],.014,'#a34443');
    }else if(p.type==='signLight'){
      R([x,y,z],[x,y+.18,z+.35],.012,'#6a746b');R([x,y+.18,z+.35],[x,y+.12,z+.45],.012,'#6a746b');S(x,y+.10,z+.45,.24,.05,.16,'#bec2b5');
    }else if(p.type==='duct'){
      R([x,y+.4,z],[x,y+(p.h||2.7),z],.09,'#929c98');R([x,y+.4,z],[x,y+.4,.13],.09,'#929c98');
    }
  }
  const root=batch.finish('Storefront-'+spec.id);
  for(const [parts,role] of [[signBatch,'sign'],[windowBatch,'interior']]){
    const group=parts.finish('Storefront-'+role);group.traverse(o=>{if(o.isMesh)o.userData.storefrontLightRole=role;});root.add(group);
  }
  root.userData={plantAnchors,storefrontId:spec.id,category:spec.category,source:spec.source,dimensionsEstimated:true,textFree:true,attachment:{normal:[0,0,1],origin:'frontage center at ground',width:W,height:H},lodCompatible:true};
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  addSignText(root,spec);
  root.userData.textFree=!spec.signText;
  return root;
}
