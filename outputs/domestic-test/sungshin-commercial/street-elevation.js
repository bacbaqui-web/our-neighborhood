// Each storefront and every upper-storey opening is positioned independently by its source record.
import * as T from 'three';
const tones={pink:0xd58ca5,black:0x41443e,charcoal:0x62645f,gray:0x9d9d93,lilac:0xb7a2ac,cream:0xe2ceb0,white:0xe2e0d4,buff:0xc9baa2,brick:0xa17c66,ochre:0xcfac53,wood:0xa38968,darkgreen:0x526762,sage:0x8e9e98,pale:0xd9d8c7,mint:0x8cbcb0,purple:0x86718e,yellow:0xdcb54e};
const ivoryColor=0xd7d7c8;
const metal=0x535956, timber=0x947353;
export function buildStreetElevation(s,e,k){
  const {root,box,mesh,mat,room,door,opaqueWindow,horizontal,eave,placard,tiledFace,hip,line,group,decal,referencePrint,maps}=k;
  const w=s.width,d=s.depth,ground=e.ground??3.60,pitch=2.72,h=ground+e.upper.length*pitch;
  const trim=tones[e.trim]??tones.gray,wall=tones[e.wall]??({4:0xdedfd6,8:0xaf806e,9:0x9d7461,10:0xb58f7a,14:0x777872,16:0x999993,18:0xb8b9ae,20:0x65645b,28:0xbbbab1,34:0xd7d5c8,35:0x9b7864,36:0xdfdccc,41:0xaa8d7d,42:0xd289a5}[s.number]??trim);
  const midBounds=[0,162,324,486,645,802,953,1104,1254];
  const cornerArt=(p,name,x,y,z,width,height,slot)=>decal(p,name,x,y,z,width,height,maps.corners,slot,2,3,[0,255,510,768]);
  const northBounds=[0,157,313,470,627,784,941,1097,1254];
  const northArt=(p,name,x,y,z,width,height,slot)=>decal(p,name,x,y,z,width,height,maps.north,slot,2,8,northBounds);
  const midArt=(p,name,x,y,z,width,height,slot)=>decal(p,name,x,y,z,width,height,maps.mid,slot,2,8,midBounds);
  const details=new Set((e.extras??'').split(' '));
  const radius=Math.min(w*.25,d*.30,2.45),left=-w/2,right=w/2,front=d/2,back=-d/2;
  const points=s.number===12?[[left,front],[left+w*.49,front],[left+w*.49,front-2.7],[right,front-2.7]]:[[left,front],[e.corner?right-radius:right,front]];
  if(e.corner==='round')for(let j=1;j<=6;j++){const a=j*Math.PI/12;points.push([right-radius+Math.sin(a)*radius,front-radius+Math.cos(a)*radius]);}
  else if(e.corner)points.push([right,front-radius]);
  points.push([right,back],[left,back]);
  function floor(y,height,color,name){
    const path=new T.Shape(points.map(([x,z])=>new T.Vector2(x,-z)));
    const g=new T.ExtrudeGeometry(path,{depth:height,bevelEnabled:false});g.rotateX(-Math.PI/2);mesh(root,name,g,mat(color),0,y,0);
  }
  floor(0,.065,0xb3afa0,'GroundFloor');floor(h,.12,wall,'RoofDeck');
  function section(p,width,x1,x2,b,t,z,depth,color,name){
    if(x2-x1>.001&&t-b>.001)return horizontal(p,x1*width,x2*width,b,t,z,depth,color,name);
  }
  function brickJoints(p,x0,x1,y0,y1){
    if(x1-x0<.13||y1-y0<.13)return;
    const positions=[];
    const line=(x,y,x2,y2)=>positions.push(x,y,.017,x2,y2,.017);
    const course=.17,unit=.40;
    for(let row=Math.ceil(y0/course);row*course<y1;row++){
      const y=row*course;line(x0,y,x1,y);
      const offset=row%2*unit/2;
      for(let col=Math.ceil((x0-offset)/unit);col*unit+offset<x1;col++){
        const x=col*unit+offset;line(x,y,x,Math.min(y1,y+course));
      }
    }
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    const joints=new T.LineSegments(geometry,new T.LineBasicMaterial({color:0x756c60,transparent:true,opacity:.35}));
    joints.name='MasonryJoints';p.add(joints);
  }
  function upperFloor(p,width,openings,f){
    const base=ground+f*pitch;
    if(!openings?.length){horizontal(p,0,width,base,base+pitch,-.10,.20,wall,'UpperReturn');return;}
    let cursor=0;
    for(const [l,r,low,high,count] of openings.toSorted((a,b)=>a[0]-b[0])){
      section(p,width,cursor,l,base,base+pitch,-.1,.21,wall,'WindowPier');
      section(p,width,l,r,base,base+low,-.1,.21,wall,'Spandrel');
      section(p,width,l,r,base+high,base+pitch,-.1,.21,wall,'WindowHeader');
      if([4,8,9,14,35].includes(s.number)){
        brickJoints(p,width*cursor,width*l,base,base+pitch);
        brickJoints(p,width*l,width*r,base,base+low);
        brickJoints(p,width*l,width*r,base+high,base+pitch);
      }
      const color=details.has('darkCurtain')?0x607671:e.trim==='black'?0x73817e:e.trim==='brick'?0x919b98:0x91a5a8;
      const gap=Math.max(1,count||1),divisions=Array.from({length:gap-1},(_,i)=>(i+1)/gap);
      if(s.number===44&&f===0){
        room(p,width*l,width*r,base+low,base+high,-.11,1.78,0x5e5d52,0x464740,[.53],true);
        horizontal(p,width*l+.12,width*r-.13,base+.12,base+.51,-.98,.42,0x947b5f,'RamenCounter');
        horizontal(p,width*l+.09,width*r-.10,base+.51,base+.58,-.98,.52,0xb49d77,'CounterSurface');
      }else opaqueWindow(p,width*l,width*r,base+low,base+high,-.094,color,metal,divisions);
      if(gap>2&&r-l>.6)horizontal(p,width*l,width*r,base+high-.38,base+high-.35,-.02,.06,metal,'Transom');
      cursor=r;
    }
    section(p,width,cursor,1,base,base+pitch,-.10,.21,wall,'WindowPier');
  }
  function groundBays(p,width,layout){
    let start=0;
    for(const b of layout){
      const end=start+b.width,x0=start*width,x1=end*width,mid=(x0+x1)/2,bw=x1-x0;
      const margin=Math.min(.10,bw*.07),l=x0+margin,r=x1-margin;
      const top=b.head??2.49,sill=b.sill??.16,kind=b.kind;
      horizontal(p,x0,x1,top,ground,-.075,.24,trim,'Fascia');
      if(kind==='wall'){horizontal(p,x0,x1,0,top,-.075,.24,trim,'SolidShopWall');start=end;continue;}
      horizontal(p,x0,l,0,top,-.07,.24,trim,'ShopPier');horizontal(p,r,x1,0,top,-.07,.24,trim,'ShopPier');
      if(['drive','passage','stair','stairDoor'].includes(kind)){
        const deep=kind==='drive'?3.80:kind==='passage'?2.68:2.39;
        for(const x of [l,r])box(p,'RecessSide',x,top/2,-deep/2,.095,top,deep,0x969387);
        horizontal(p,l,r,top-.075,top,-deep/2,deep,0xaaa799,'RecessSoffit');
        if(kind!=='drive')horizontal(p,l,r,0,top,-deep,.16,0x6f7066,'RecessBack');
        if(kind==='stair'||kind==='stairDoor'){
          for(let j=0;j<8;j++)horizontal(p,l,r,0,.15+j*.16,-j*.282-.13,.29,0x999b8f,'EntryStep');
          line(p,'StairHandrail',[r-.12,.84,-.03],[r-.12,1.91,-2.04],.038,timber);
          if(kind==='stairDoor'){
            const part=l+(r-l)*.52;door(p,part,r,0,top,-.03,metal);
            for(let j=1;j<6;j++)horizontal(p,part,r,j*.38,j*.38+.035,-.016,.07,metal,'GrilleRail');
            for(let j=1;j<4;j++)box(p,'GrilleStile',part+(r-part)*j/4,top/2,-.015,.035,top,.068,metal);
          }
        }
      }else if(kind==='shutter'){
        horizontal(p,l,r,.08,top,-.105,.095,0xb6b7a9,'MetalShutter');
        for(let j=0;j<17;j++)horizontal(p,l,r,.13+j*.14,.16+j*.14,-.043,.046,j%5===0?0xa89a7c:0x9d9f94,'RollSlat');
      }else{
        if(s.number===49&&kind==='glass'){
          horizontal(p,l,r,0,.095,-.81,1.71,0xb2aa97,'OpenClothingFloor');
          horizontal(p,l,r,0,top,-1.61,.13,0x98998d,'ClothingShopInterior');
          for(const x of [l,r])box(p,'ClothingReturn',x,top/2,-.77,.08,top,1.54,trim);
          start=end;continue;
        }
        const isDoor=['door','greenDoor','gridDoor','recessDoor','fold'].includes(kind);
        const base=isDoor?.09:sill;
        if(base>0)horizontal(p,l,r,0,base,-.09,.24,trim,'WindowApron');
        const ins=s.number===36?-.66:kind==='recessDoor'?-.62:kind==='bars'?-.20:-.10;
        const frame=kind==='greenDoor'?0x577c70:kind==='gridDoor'||kind==='fold'?0x665d50:metal;
        const divisions=Array.from({length:Math.max(0,(b.panes??1)-1)},(_,j)=>(j+1)/b.panes);
        room(p,l,r,base,top,ins,kind==='recessDoor'?1.60:1.05,kind==='bars'?0x7c8275:0xaaa595,frame,divisions,true);
        if(isDoor)door(p,l,r,base,top,ins+.033,frame);
        if(kind==='greenWindow')opaqueWindow(p,l,r,base,top,ins+.024,0x4b6256,0x555b4d);
        if(kind==='gridDoor'||kind==='blind'||kind==='bars'){
          const rows=kind==='blind'?12:kind==='gridDoor'?5:3;
          for(let j=1;j<rows;j++)horizontal(p,l,r,base+(top-base)*j/rows,base+(top-base)*j/rows+(kind==='blind'?.065:.035),ins+.043,.056,kind==='blind'?0xb89e74:frame,'SashRail');
          if(kind==='bars'||kind==='gridDoor')for(let j=1;j<=4;j++)box(p,'MetalGrille',l+(r-l)*j/5,(base+top)/2,ins+.039,.035,top-base,.053,frame);
        }
        if(kind==='rounded'){
          const radius=Math.min(.48,(r-l)*.22);
          for(const edge of [l,r]){
            const corner=group(p,edge,top,ins+.045);
            if(edge===r)corner.scale.x=-1;
            const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(radius,0);shape.quadraticCurveTo(0,0,0,-radius);shape.closePath();
            mesh(corner,'RoundedWindowCorner',new T.ExtrudeGeometry(shape,{depth:.1,bevelEnabled:false}),mat(trim));
          }
        }else if(kind==='leftCurve'){
          const sw=Math.min(.72,bw*.22);
          // Sculpt the rounded left window shoulder. The remainder of the opening stays rectangular.
          const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(0,top-base);shape.lineTo(sw,top-base);
          shape.quadraticCurveTo(0,(top-base)*.89,0,(top-base)*.55);shape.quadraticCurveTo(0,(top-base)*.18,sw,0);shape.closePath();
          mesh(p,'CurvedShoulder',new T.ExtrudeGeometry(shape,{depth:.1,bevelEnabled:false}),mat(trim),l,base,ins+.04);
        }
        if(kind==='listings')for(let y=0;y<3;y++)for(let j=0;j<5;j++)placard(p,l+(r-l)*(j+.5)/5,1.10+y*.35,ins+.086,(r-l)*.164,.29,12);
      }
      start=end;
    }
  }
  for(let i=0;i<points.length;i++){
    const [x,z]=points[i],[x2,z2]=points[(i+1)%points.length];
    const width=Math.hypot(x2-x,z2-z),p=group(root,x,0,z,-Math.atan2(z2-z,x2-x));
    const main=i===0,rightSide=i===points.length-3,leftSide=i===points.length-1,arc=i>0&&i<points.length-3;
    let layout=main?e.front:rightSide?e.side:leftSide?e.leftSide:null;
    if(s.number===12){
      if(i===0)layout=[{kind:'glass',width:1,panes:5,sill:.54,head:2.49}];
      if(i===1)layout=[{kind:'glass',width:1,panes:2,sill:.54,head:2.49}];
      if(i===2)layout=[{kind:'door',width:.315,panes:2,sill:.10,head:2.49},{kind:'drive',width:.685,panes:1,sill:0,head:2.49}];
    }
    if(layout)groundBays(p,width,layout);
    else if(arc)groundBays(p,width,[{kind:'glass',width:1,panes:1,sill:.31,head:2.53}]);
    else if(s.number===12&&i===points.length-2){
      horizontal(p,width*.34,width,0,ground,-.10,.21,wall,'RearWall');
      horizontal(p,0,width*.34,2.49,ground,-.10,.21,wall,'DrivewayHeader');
    }else horizontal(p,0,width,0,ground,-.10,.21,wall,'ReturnWall');
    for(let f=0;f<e.upper.length;f++){
      if(s.number===12&&i<=2){
        const openings=i===0?[[.11,.29,.52,2.18,1],[.50,.85,.48,2.17,2]]:i===1?[[.21,.68,.57,2.10,2]]:[[.01,.313,.01,2.70,2],[.62,.85,.65,2.14,2]];
        upperFloor(p,width,openings,f);continue;
      }
      upperFloor(p,width,main?e.upper[f]:rightSide?e.sideUpper?.[f]:arc?[[.05,.95,.40,2.27,1]]:null,f);
    }
    if(s.number===12&&i===2)decal(p,'EntrancePlaque',width*.16,2.70,.11,width*.26,.27,maps.south,9,2,6);
    if(main&&e.sign&&![14,20,21,23,31,40].includes(s.number)){
      const [l,r,y,height]=e.sign;
      const southCell=({2:0,3:1,4:3,5:4,7:6,8:7,10:8,15:10})[s.number];
      const x=width*(l+r)/2,sw=(r-l)*width;
      const midCell=({16:0,17:1,18:2,19:3,22:6,24:7,26:8,27:10,28:11,29:12,30:8,32:14,33:15})[s.number];
      const northCell=({36:0,37:1,38:2,39:3,41:6,42:8,44:10,45:11,46:12,47:13,49:15})[s.number];
      if(southCell!==undefined||s.number===9||midCell!==undefined||northCell!==undefined||[34,35].includes(s.number)){
        horizontal(p,l*width,r*width,y-height/2-.03,y+height/2+.03,.10,.18,trim,'SignTray');
        if(s.number===9)decal(p,'ShopSign',x,y,.228,sw,height,maps.yard,1,1,2,[0,396,793]);
        else if(s.number===34||s.number===35)cornerArt(p,'ShopSign',x,y,.25,sw,height,s.number===34?0:2);
        else if(northCell!==undefined)northArt(p,'ShopSign',x,y,.40,sw,height,northCell);
        else if(midCell!==undefined)midArt(p,'ShopSign',x,y,.242,sw,height,midCell);
        else decal(p,'ShopSign',x,y,.229,sw,height,maps.south,southCell,2,6);
      }else throw Error('간판 그림 연결을 확인해 주세요. '+s.id);
    }
    ornaments(p,width,main,rightSide,arc,leftSide);
  }
  function ornaments(p,width,main,rightSide,arc,leftSide){
    const has=name=>details.has(name);
    const panel=(l,r,b,t,z,depth,color,name)=>section(p,width,l,r,b,t,z,depth,color,name);
    const canopy=(l,r,y,reach,color,angle=.23)=>eave(p,width*(l+r)/2,y,.07,width*(r-l),reach,color,angle);
    const columns=(x,y,z,col)=>box(p,'SupportColumn',x,y/2,z,.15,y,.15,col);
    function steps(l,r,n,stepDepth=.28){
      for(let j=0;j<n;j++)panel(l,r,0,(j+1)*.14,(n-j-.5)*stepDepth,stepDepth+.01,0xa7a499,'EntryStep');
    }
    function rail(l,r,y,z,color){
      panel(l,r,y-.025,y+.025,z,.055,color,'GuardRail');
      const num=Math.max(3,Math.ceil(width*(r-l)/.49));
      for(let j=0;j<=num;j++)box(p,'Baluster',width*(l+(r-l)*j/num),y/2,z,.036,y,.036,color);
    }
    function shelf(l,r,z,y,depth,color){
      panel(l,r,y,y+.08,z,depth,color,'Shelf');
      for(let j=0;j<6;j++)box(p,'ShopDisplayItem',width*(l+(r-l)*(j+.5)/6),y+.17,z,.15,.19+.05*(j%3),depth*.49,[0xb29e76,0xb9aaa2,0x92a690][j%3]);
    }
    function blade(x,y,color,shape='box'){
      line(p,'BladeArm',[width*x,y+.43,.04],[width*x,y+.43,.78],.033,metal);
      if(shape==='disc'){
        const disc=mesh(p,'RoundBladeSign',new T.CylinderGeometry(.38,.38,.11,22),mat(color),width*x,y,.70);
        disc.rotation.z=Math.PI/2;
      }else box(p,'BladeSign',width*x,y,.57,.14,.72,.88,color);
    }
    function band(l,r,y,height,col){panel(l,r,y-height/2,y+height/2,.14,.31,col,'ProjectingBand');}
    function railingDeck(l,r,z,deckColor){
      panel(l,r,0,.16,z/2,z,deckColor,'ShopDeck');rail(l,r,.87,z,metal);
    }
    if(!main){
      if(leftSide&&has('terraceTurf')){
        canopy(.085,.91,2.71,1.05,0xddbb53);
        panel(.06,.94,0,.25,.76,1.57,0x819468,'TerraceTurf');rail(.06,.94,.98,1.49,metal);
        for(const xx of [.27,.72]){
          box(p,'TerraceTable',width*xx,.89,.78,.62,.065,.53,timber);box(p,'TableLeg',width*xx,.56,.78,.073,.60,.073,metal);
          for(const k of [-1,1]){const x=width*xx+k*.47;box(p,'TerraceSeat',x,.61,.78,.35,.058,.37,timber);for(const z of [.66,.89])box(p,'ChairFoot',x,.43,z,.06,.34,.06,metal);}
        }
      }
      if(rightSide&&has('gapLandings'))for(let f=1;f<=2;f++){const y=ground+(f-1)*pitch;panel(.11,.39,y,y+.16,.43,.93,metal,'SteelLanding');panel(.11,.39,y+.82,y+.87,.88,.055,metal,'LandingRail');if(f===1)line(p,'ServicePipe',[width*.34,.1,.17],[width*.34,h,.17],.039,metal);}
      if((arc||rightSide&&e.side)&&has('curvedCoffeeBand')){band(0,1,3.16,.65,0xd9d8c9);band(0,1,ground+pitch-.14,.58,0x484b47);band(0,1,ground+pitch+.59,.79,0xaaa89e);band(0,1,h-.06,.20,0x8f7364);}
      if(arc&&has('silverCurve')){band(0,1,3.08,.70,0xb6bab4);for(let j=0;j<6;j++)box(p,'CornerFasciaRib',width*(j+.5)/6,3.08,.31,.018,.68,.035,0x969c98);}
      if(arc&&has('aquaArcade'))band(0,1,3.24,.69,0x82b4b0);
      if(!(rightSide||arc))return;
      if(has('redCorner'))canopy(.01,.99,2.79,.83,0xaa5146);
      if(has('vinyl')&&width>1){
        for(const xx of [.20,.77]){
          const vinyl=new T.MeshStandardMaterial({color:0xbac8c1,transparent:true,opacity:.31,roughness:.28,depthWrite:false,side:T.DoubleSide});
          mesh(p,'SideVinyl',new T.PlaneGeometry(width*.34,2.20),vinyl,width*xx,1.36,.83);
          panel(xx-.16,xx+.16,.23,.29,.84,.04,0xa3937c,'VinylHem');
        }
      }
      if(has('sideNavy'))canopy(.04,.70,2.67,.68,0x636575);
      if(has('whiteRail')&&arc)band(0,1,3.10,.59,0xdad9d0);
      if(has('whiteRail')&&rightSide){railingDeck(.08,.69,.84,0xaaa99e);placard(p,width*.22,1.47,.087,width*.33,1.63,14);}
      if(has('sideBalcony'))for(let f=0;f<2;f++){const y=ground+f*pitch;panel(.09,.56,y,y+.12,.25,.73,0x99988f,'BalconySlab');panel(.09,.56,y+.75,y+.80,.61,.06,metal,'BalconyRail');}
      if(has('thickBand')||has('convenienceBand')||has('redArcade'))band(0,1,3.05,.47,has('redArcade')?0xad6653:0xd8d8c8);
      if(has('darkCurtain'))band(0,1,ground,.16,0x414f4c);
      if(has('sideBoard')&&width>3)placard(p,width*.51,ground+1.30,.035,1.37,1.57,15);
      return;
    }
    const awnings=[
      ['whiteAwning',0,1,2.83,1.10,0xd8d5c6],['navyAwning',.015,.985,2.70,.81,0x635d77],
      ['redCorner',0,1,2.80,.87,0xaa5146],['redRestaurant',.01,.488,2.74,1.18,0xab5c51],
      ['silverAwning',.006,.994,2.78,.80,0x9faba8],['creamFascia',.012,.985,3.01,.64,0xd9c59f],
      ['yellowAwning',.02,.98,2.74,.81,0xddbb55],
    ];
    for(const [marker,l,r,yy,dist,col] of awnings)if(has(marker))canopy(l,r,yy,dist,col);
    if(has('twinBlackAwn')){canopy(.00,.448,2.77,1.13,0x424644);canopy(.455,.985,2.78,.96,0x424644);}
    if(has('rightTablet'))panel(.906,.993,.10,2.64,.06,.18,0xe0ded1,'VerticalShopPanel');
    if(has('rafter')){
      const count=Math.ceil(width/.29);
      for(let j=0;j<count;j++)box(p,'ExposedRafter',width*(j+.5)/count,ground+.08,.22,.10,.14,.52,0xb6aa8e);
    }
    if(has('yardGrid')){
      panel(.02,.97,0,.06,1.03,2.14,0x8d9962,'ForecourtTurf');
      for(let j=0;j<4;j++)panel(.63,.79,.06,.10,.29+j*.43,.28,0xa7a69c,'EntryStone');
    }
    if(has('cafeBand')){band(.04,.87,ground+.25,.34,0x434743);decal(p,'UpperCafeSign',.455*width,ground+.25,.325,width*.78,.30,maps.south,2,2,6);}
    if(has('orangeBoard'))panel(.008,.132,ground+.25,ground+2.16,.09,.14,0xc28053,'UpperOrangePanel');
    if(has('stairPanel')&&s.number===5){panel(.807,.991,2.65,3.40,.10,.23,0xc1a18d,'TenantStairPanel');decal(p,'StairSign',width*.899,3.025,.235,width*.173,.64,maps.south,5,2,6);}
    if(has('outsideUnit')||has('condenser')){
      for(const x of [.02,.964]){
        box(p,'Condenser',x*width,.53,.29,.43,.85,.53,0xc3c2b5);
        for(let j=0;j<8;j++)box(p,'VentFin',x*width,.23+j*.075,.57,.31,.018,.025,metal);
      }
    }
    if(has('vinyl')){
      const vinyl=new T.MeshStandardMaterial({color:0xc4cfc4,transparent:true,opacity:.30,roughness:.31,depthWrite:false,side:T.DoubleSide});
      for(const [l,r]of [[.01,.27],[.29,.44],[.69,.985]]){
        mesh(p,'AwningVinyl',new T.PlaneGeometry((r-l)*width,2.24),vinyl,(l+r)*width/2,1.37,.85);
        panel(l,r,.23,.30,.86,.045,0xab8871,'CurtainEdge');
        box(p,'VinylSeam',width*l,1.37,.86,.022,2.22,.027,ivoryColor);
      }
    }
    if(has('entryStairs')||has('stairThree'))steps(has('stairThree')?.03:.22,.97,3);
    if(has('steelRails'))for(const f of [.23,.94]){line(p,'EntryRailing',[f*width,.97,.87],[f*width,1.36,.02],.036,metal);columns(f*width,.97,.86,metal);}
    if(has('plateRoof'))panel(.14,.99,2.68,2.87,.45,1.06,0xc9c9bd,'EntryPlate');
    if(has('deckShutter'))panel(.008,.79,0,.18,.37,.86,0x876e55,'ShopDeck');
    if(has('twinRail')){rail(.02,.32,.75,.79,metal);rail(.39,.76,.75,.79,metal);steps(.807,.994,2);}
    if(has('bladeSquare'))blade(.96,3.62,0xc6bd9f);
    if(has('woodDeck'))panel(.01,.985,0,.17,.42,.98,timber,'ShopDeck');
    if(has('counterStools')){
      panel(.035,.604,.99,1.085,.37,.66,timber,'WindowCounter');
      for(let j=0;j<4;j++){
        const x=width*(.103+j*.139),z=.84;
        box(p,'WovenSeat',x,.64,z,.43,.10,.39,0xb09165);
        for(const xx of [-1,1])for(const zz of [-1,1])line(p,'StoolLeg',[x+xx*.15,.17,z+zz*.14],[x+xx*.14,.62,z+zz*.12],.030,timber);
        for(const xx of [-.16,.16])line(p,'StoolBackPost',[x+xx,.63,z+.14],[x+xx,.99,z+.19],.029,timber);
        for(let r=0;r<3;r++)box(p,'WovenBack',x,.83+r*.067,z+.18,.34,.043,.05,0xbda47c);
      }
      line(p,'EntryWoodRail',[width*.673,.86,.61],[width*.673,1.27,-.59],.042,timber);
    }
    if(has('wideBlackCap'))band(.00,.996,3.56,.22,0x484b46);
    if(has('lowMenu'))for(let j=0;j<3;j++)placard(p,width*(.17+j*.20),.38,.106,.46,.47,15);
    if(has('whiteRepair'))panel(.663,1,0,3.36,.062,.09,0xd9d5c5,'WhiteWallRepair');
    if(has('elbowDuct')||has('pipe')){
      const x=width*(has('elbowDuct')?.05:.92);
      line(p,'DrainRiser',[x,.14,.20],[x,ground+.29,.20],has('elbowDuct')?.115:.046,0xa2a49b);
      line(p,'PipeBend',[x,ground+.29,.20],[x+.42,ground+.45,-.05],has('elbowDuct')?.115:.046,0xa2a49b);
    }
    if(s.number===12){
      canopy(.01,.99,2.74,.95,0xac5b50);
      panel(.01,.98,0,.44,.58,.97,0x95988b,'CourtyardPlanter');
    }
    if(has('planter')){
      panel(.012,.481,0,.46,.52,.93,0x8e8e82,'LowBrickPlanter');
      for(let j=0;j<8;j++){const shrub=mesh(p,'LowHedge',new T.IcosahedronGeometry(.30+(j%2)*.04,0),mat(0x758264),width*(.044+j*.056),.54,.51);shrub.scale.z=.85;}
    }
    if(has('doubleCourse')){band(0,1,ground-.04,.085,0xb5b5a5);band(0,1,ground+.14,.07,0xbbbba9);}
    if(has('doubleBlackSign')){
      panel(.61,.98,2.83,3.20,.11,.18,0x434641,'SecondTenantStrip');
      decal(p,'ShopSign',width*.795,3.015,.23,width*.34,.32,maps.small,0,1,2,[0,444,887]);
      panel(.09,.43,2.88,3.12,.11,.18,0xd4d4c5,'UnletteredPanel');
    }
    if(s.number===8){
      panel(.002,.115,2.68,ground-.01,.08,.22,0x9b574d,'BrickShopBlade');
      for(let row=0;row<8;row++)for(let j=0;j<4;j++){
        const l=.867+j*.027+(row%2)*.013;if(l>.97)continue;
        panel(l,l+.022,.15+row*.29,.39+row*.29,.061,.024,0xaa806b,'BrickHeader');
      }
    }
    if(has('redLanterns'))for(const x of s.number===8?[.14,.42,.71]:[.24,.53]){
      line(p,'LanternCord',[x*width,2.99,.34],[x*width,2.68,.34],.014,metal);
      const lantern=mesh(p,'PaperLantern',new T.SphereGeometry(.17,12,8),mat(0xb5634d),x*width,2.51,.34);lantern.scale.y=1.23;
    }
    if(has('stonePier'))panel(.946,.993,0,2.79,.067,.35,0xaaa998,'EndStonePier');
    if(has('woodSkirt'))for(let j=0;j<16;j++)panel(j/17,(j+.82)/17,.12,.60,.071,.105,0x9c7a54,'TimberApron');
    if(has('wallMenu'))placard(p,width*.45,1.02,.114,.53,.76,3);
    if(has('corrugatedApron'))for(let j=0;j<21;j++)panel(.32+j*.021,.326+j*.021,.12,.76,.086,.071,0xb1b3a3,'ApronFold');
        if([2,8,10,14,15,33,36].includes(s.number)){
      const start=s.number===14?.07:.06,end=s.number===14?.52:.38;
      for(const f of [.16,.76]){
        const x=width*(start+(end-start)*f);
        box(p,'DiningTableTop',x,.87,-.65,.63,.07,.49,0xa58c69);box(p,'TablePedestal',x,.47,-.65,.075,.75,.075,metal);
        for(const z of [-.39,-.91]){box(p,'DiningSeat',x,.51,z,.37,.075,.31,timber);box(p,'ChairLeg',x,.30,z,.075,.39,.075,metal);}
      }
    }
    if([20,21,38,46].includes(s.number)){
      for(const l of [.13,.80]){
        const x=width*l;
        box(p,'ArcadeBase',x,.40,-.60,.51,.64,.47,0xc3a370);
        box(p,'ArcadeDisplay',x,1.18,-.63,.48,.83,.41,0x9daea6);
        box(p,'ArcadeTop',x,1.65,-.61,.53,.13,.48,0xb78582);
        for(const k of [-1,1])box(p,'ArcadeCorner',x+k*.223,1.18,-.40,.029,.83,.037,ivoryColor);
      }
    }
    if([16,24,45].includes(s.number)){
      panel(.08,.33,1.88,1.93,-.64,.042,metal,'GarmentRail');
      for(let j=0;j<6;j++){const x=width*(.10+j*.042);line(p,'Hanger',[x,1.88,-.64],[x+.05,1.69,-.64],.011,metal);box(p,'HangingStock',x,1.31,-.65,.13,.76,.21,[0xbdab93,0x978b80,0xa6a999][j%3]);}
    }
    if([26,30,32,33,37,39,44].includes(s.number)){
      const right=[26,32,37,39].includes(s.number),l=right?.68:.04,r=right?.95:.38;
      for(let level=0;level<3;level++)shelf(l,r,-.64,.40+level*.38,.33,0x9f9d8a);
    }
    if(s.number===35)cornerArt(p,'UpperFoodPrint',width*.50,ground+2.42,.17,width*.61,.43,3);
    if(s.number===21)cornerArt(p,'ArcadeStrip',width*.50,3.17,.32,width*.95,.50,5);
    if(has('yellowTwin')){
      panel(.075,.479,ground+.35,ground+2.12,.031,.09,0xa6a79c,'UpperShutter');
      for(let j=0;j<12;j++)panel(.077,.476,ground+.42+j*.14,ground+.44+j*.14,.089,.04,0x929788,'ShutterSlat');
      panel(.02,.98,ground+2.38,ground+2.69,.087,.16,0x4c4e44,'BlackUpperBand');cornerArt(p,'CoffeeValancePrint',width*.27,2.60,1.095,width*.46,.16,1);canopy(.01,.54,2.79,1.02,0xdbb54b);canopy(.55,.995,2.79,.97,0xe0bd53);}
    if(has('bluePortal')||has('pinkRoundPortal')){
      const color=has('bluePortal')?0x547fbb:0xd7899e;
      panel(0,.052,0,ground,.14,.39,color,'PortalPier');panel(.945,1,0,ground,.14,.39,color,'PortalPier');band(0,1,2.96,.59,color);
      steps(.28,.67,1);
    }
    if(has('pinkPiers')){
      for(const x of [.018,.50,.982])box(p,'PinkShopPier',width*x,ground/2,.17,.28,ground,.53,0xcc7899);
      for(const [l,r]of [[.025,.27],[.72,.974]])panel(l,r,.0,.45,.126,.33,0xd497aa,'RosePlinth');
      for(let j=0;j<5;j++)for(const pos of [.024,.973]){
        const candy=mesh(p,'CapsuleOrnament',new T.SphereGeometry(.20,10,7),mat([0x93ac74,0xd5809f,0xc9a46b,0x84a9b6,0xb499b1][j]),width*pos,ground+.26+j*.48,.18);
        candy.scale.set(1.04,.78,.53);
      }
    }
    if(has('timberPorch')){
      for(const x of [.014,.912])columns(width*x,2.69,.47,timber);
      panel(.00,1,2.64,2.81,.22,.90,timber,'PorchBeam');
      panel(.02,.24,.39,.48,.35,.41,timber,'PorchBench');
    }
    if(has('bracketBalcony')){
      panel(.60,.96,ground+.12,ground+.25,.23,.72,timber,'BalconyFloor');
      panel(.60,.96,ground+.91,ground+.96,.56,.06,metal,'BalconyRail');
      for(const l of [.60,.69,.78,.87,.96])box(p,'Baluster',width*l,ground+.58,.56,.04,.67,.04,metal);
    }
    if(has('pinkSCurve')){
      const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(width*.21,0);
      shape.bezierCurveTo(width*.04,.52,width*.19,1.16,width*.13,1.91);
      shape.bezierCurveTo(width*.11,2.34,width*.12,2.56,width*.13,2.68);shape.lineTo(0,2.68);shape.closePath();
      mesh(p,'CurvedPinkPortal',new T.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:false}),mat(0xd892aa),0,0,.035);
      panel(.00,.32,2.62,3.57,.125,.30,0xce819e,'PinkShopBand');
      panel(.325,.71,2.62,3.57,.13,.30,0xa9484a,'RedShopBand');
      panel(.718,.99,2.62,3.57,.13,.30,0x646663,'VintageShopBand');
      const oval=mesh(p,'OvalPlaque',new T.SphereGeometry(.34,18,10),mat(0x4d4344),width*.175,3.04,.305);oval.scale.set(1.50,.80,.17);
    }
    if(has('oliveRibbed'))panel(.64,.95,ground+.11,ground+.44,.083,.16,0xc8c1af,'UpperSalonPanel');
    if(has('oliveRibbed')||has('silverCurve')){
      const l=has('oliveRibbed')?0:0,r=has('oliveRibbed')?.80:1,col=has('oliveRibbed')?0xa1a595:0xb6bab4;
      panel(l,r,2.73,3.43,.12,.21,col,'RibbedFascia');
      const count=Math.max(1,Math.round(width*(r-l)/.10));
      for(let j=0;j<count;j++)box(p,'FasciaRib',width*l+width*(r-l)*(j+.5)/count,3.08,.24,.018,.68,.034,0x939a92);
      if(has('entryRamp')){const ramp=panel(.02,.30,.06,.15,.48,1.03,0xb4b1a8,'DoorRamp');ramp.rotation.x=.13;}
      if(has('silverCurve')){placard(p,width*.51,1.46,.21,width*.115,1.15,14);blade(.16,3.18,0x8097b2,'disc');}
    }
    if(has('pandaStep')){
      const badge=decal(p,'PandaBadge',width*.15,3.13,.32,.55,.55,maps.north,0,1,1);
      const badgeUV=badge.geometry.attributes.uv;
      for(let i=0;i<badgeUV.count;i++)badgeUV.setXY(i,(235+badgeUV.getX(i)*160)/1254,1-(316+(1-badgeUV.getY(i))*154)/1254);
      steps(.32,.61,1);
      const x=width*.387,z=.72;
      for(const [y,rr,c] of [[.42,.24,0xe3e3d4],[.77,.23,0xe3e3d4]])mesh(p,'PandaDisplay',new T.SphereGeometry(rr,10,9),mat(c),x,y,z);
      for(const k of [-1,1]){
        mesh(p,'PandaEar',new T.SphereGeometry(.082,8,6),mat(0x424341),x+k*.16,.951,z);
        mesh(p,'PandaEye',new T.SphereGeometry(.047,8,6),mat(0x424341),x+k*.097,.81,z+.19);
      }
    }
    if(has('shoeAwning')){northArt(p,'ShoeShopSign',width*.245,3.17,.25,width*.44,.46,5);canopy(.01,.49,2.83,1.18,0xa2b47f);canopy(.50,.99,2.79,.87,0xc18458);}
    if(has('shoeRacks')){
      for(let tier=0;tier<2;tier++){panel(.04,.39,.35+tier*.42,.42+tier*.42,.73,.61,metal,'ShoeShelf');for(let j=0;j<7;j++){
        const item=mesh(p,'ShoeDisplay',new T.SphereGeometry(.146,8,5),mat([0x5f6870,0xaeac9e,0x837c77][j%3]),width*(.068+j*.048),.47+tier*.42,.72);item.scale.set(.63,.48,1.25);
      }}
      panel(.55,.96,.89,1.03,.30,.70,0x9f7957,'ServingCounter');
      const sash=panel(.55,.95,1.91,2.68,.25,.065,0x8eaaa9,'LiftUpSash');sash.rotation.x=-.49;
    }
    if(has('tenantBands')){
      for(const y of [ground+.16,ground+pitch+.12]){panel(.02,.97,y-.18,y+.18,.12,.25,0xa17062,'UpperFoodBand');northArt(p,'UpperRestaurantPrint',width*.50,y,.28,width*.89,.29,7);}
    }
    if(has('lanternRow')){
      for(let j=0;j<6;j++){
        const x=width*(.115+j*.15);
        line(p,'LanternCord',[x,ground+1.57,-.58],[x,ground+1.39,-.58],.011,metal);
        const shade=mesh(p,'RamenLantern',new T.SphereGeometry(.12,12,7),mat(0xe0d8be),x,ground+1.14,-.58);shade.scale.set(.83,1.87,.83);
      }
      for(let j=0;j<15;j++)panel(.05,.35,ground+1.15+j*.037,ground+1.17+j*.037,-.28,.05,0x9a896b,'BambooBlind');
      const yy=ground+2.06;panel(.045,.95,yy-.35,yy+.35,.11,.25,0x504b3b,'RamenSign');decal(p,'UpperRestaurantPrint',width*.499,yy,.28,width*.87,.60,maps.menji,0,1,1);
      for(const xx of [.706,.985])box(p,'TimberStairCladding',width*xx,1.31,-1.12,.073,2.62,2.26,0x786246);
      blade(.83,2.84,0xba9d61,'disc');
    }
    if(has('whiteProjectingFrames'))for(let f=0;f<2;f++){
      const yy=ground+pitch*f;for(const x of [.061,.502,.961])box(p,'ProjectingWindowPier',width*x,yy+1.32,.095,.19,2.62,.41,0xe0dfd3);
      panel(.035,.985,yy+.035,yy+.16,.12,.44,0xdeddd0,'ProjectingWindowSill');
    }
    if(has('aquaArcade')){band(0,1,3.24,.69,0x82b4b0);blade(.84,2.57,0xa5c5b6,'disc');}
    if(has('upperTubeRail')){panel(.03,.97,ground+.04,ground+.19,.34,.85,0xada99c,'BalconyDeck');for(const yy of [ground+.46,ground+.73,ground+1.0])panel(.03,.97,yy,yy+.043,.75,.054,metal,'TubularRail');}
    if(has('curvedCoffeeBand')){
      northArt(p,'UpperCoffeeSign',width*.50,ground+pitch-.14,.32,width*.89,.49,14);
      band(0,1,3.16,.65,0xd9d8c9);band(0,1,ground+pitch-.14,.58,0x484b47);
      band(0,1,ground+pitch+.59,.79,0xaaa89e);band(0,1,h-.06,.20,0x8f7364);
      placard(p,width*.24,ground+pitch+.61,.318,width*.30,.60,7);
      for(let j=0;j<4;j++)opaqueWindow(p,width*(.02+j*.246),width*(.25+j*.246),h-1.62,h-.18,.09,0x87a7a7,metal);
    }
    if(has('blueTwin')){
      canopy(.01,.462,2.72,.97,0x557894);canopy(.51,.98,2.78,1.07,0x587b9e);
      for(const mid of [.225,.76]){panel(mid-.17,mid+.17,1.76,1.81,.69,.051,metal,'ClothingRail');
        for(let j=0;j<7;j++){const x=width*(mid-.135+j*.044);line(p,'WireHanger',[x,1.79,.68],[x+.055,1.61,.68],.009,metal);
          box(p,'HangingGarment',x,1.19+(j%2)*.04,.68,.14,.86-(j%3)*.06,.34,[0xa19887,0xb9b3a4,0x808583,0x787779][j%4]);}}
      for(let f=0;f<2;f++)panel(.06,.93,ground+f*pitch+2.15,ground+f*pitch+2.43,.11,.21,0x939c9f,'KaraokeBand');
      panel(.94,.993,ground+.21,h-.21,.20,.35,0x567b9b,'TallBlueBlade');
    }
    if(s.number===20)midArt(p,'UpperTenantSign',width*.48,h-.55,.20,width*.79,.70,4);
    if(s.number===21)midArt(p,'UpperTenantSign',width*.48,ground+2.40,.19,width*.78,.38,5);
    if(s.number===27)midArt(p,'UpperTenantSign',width*.47,ground+2.49,.18,width*.82,.41,9);
    if(s.number===30)midArt(p,'UpperTenantSign',width*.50,ground+pitch+2.32,.19,width*.78,.50,13);
    if(has('yellowBase')){panel(.00,.041,0,2.61,.14,.25,0xe0bb50,'YellowPortal');panel(.94,.998,0,2.61,.14,.25,0xe0bb50,'YellowPortal');band(.00,1,2.65,.20,0xe0bb50);}
    if(has('highFoodBlade')||has('verticalRepair')){
      panel(.816,.991,ground+.55,h-.07,.16,.25,0x605e53,'VerticalPanel');
      placard(p,width*.905,h-.75,.302,width*.145,1.18,has('highFoodBlade')?3:4);
    }
    if(has('perforatedCrown')){
      panel(0,1,h-.16,h+.46,.108,.26,0xbabdb2,'MetalParapet');
      for(let j=0;j<Math.floor(width/.27);j++)box(p,'ParapetSlot',.15+j*.27,h+.16,.249,.11,.19,.025,0x7e8880);
    }
    if(has('redArcade'))band(0,1,3.18,.63,0xb35f50);
    if(has('horizontalBands')||has('darkCurtain'))for(let f=1;f<=e.upper.length;f++)band(0,1,ground+(f-1)*pitch,.18,has('darkCurtain')?0x405850:0xdbdccf);
    if(has('weatherboards'))for(let j=0;j<15;j++)panel(0,1,2.54+j*.068,2.55+j*.068,.062,.032,0xb0b2a7,'CladdingSeam');
    if(has('mintTrim'))band(.02,.98,2.73,.11,0x96b1a2);
    if(has('deepPiers'))for(const x of [.015,.393,.974])columns(width*x,2.76,.09,0x858980);
    if(has('convenienceBand')){band(0,1,3.35,.18,0x4c9187);band(0,1,2.91,.07,0x5c94ae);}
    if(has('darkBalcony')){panel(.025,.973,ground+.02,ground+.20,.44,1.0,0x50534f,'DarkBalcony');panel(.025,.973,ground+.92,ground+.99,.94,.07,metal,'BalconyRail');for(let j=0;j<13;j++)box(p,'Baluster',width*(.04+j*.076),ground+.54,.94,.042,.80,.06,metal);}
    if(has('marketRow')){
      canopy(.27,.55,2.70,1.34,0x418879);canopy(.55,.80,2.71,.86,0xdbbb58);canopy(.03,.25,2.70,.49,0xb66b5b);
      band(.56,.79,3.24,.54,0xe1c255);band(.80,1,3.27,.60,0x444742);
      for(const x of [.29,.50])for(let j=0;j<3;j++){panel(x,x+.030,.16+j*.24,.36+j*.24,.57,.91,0x567b95,'MarketCrate');shelf(x,x+.035,.59,.30+j*.23,.7,0x86976b);}
    }
    if(has('skewPediment')){
      line(p,'PedimentLine',[width*.02,3.21,.30],[width*.32,3.62,.30],.055,0x4a5774);
      line(p,'PedimentLine',[width*.32,3.62,.30],[width*.98,3.20,.30],.055,0x4a5774);
    }
    if(has('frosted'))panel(.025,.975,.30,.78,-.085,.04,0xbac4bb,'FrostedWindowFilm');
    if(has('beautyBand'))panel(.085,.91,ground+2.27,ground+2.64,.08,.19,0xd9d1c8,'SalonSignStrip');
    if(has('pharmacyPlate')){blade(.89,3.73,0x668d76,'disc');for(const x of [.13,.80])placard(p,x*width,1.31,.01,.68,.82,11);}
    if(has('twoSteps'))steps(.04,.96,2);
    if(has('redWing')){panel(.94,1,0,h+.62,.06,.56,0xb36d60,'TallWingWall');blade(.948,3.46,0xd3cdc0,'disc');}
    if(has('ornamentCaps')){band(0,1,ground-.04,.12,0xc2c7b4);for(const xx of [.03,.96])box(p,'OrnamentalCap',width*xx,ground+.10,.17,.26,.22,.26,0x9bb6a9);}
    if(has('medallions'))decal(p,'ShopSign',width*.48,3.16,.33,width*.60,.42,maps.small,1,1,2,[0,444,887]);
    if(has('medallions'))for(let j=0;j<3;j++){const disc=mesh(p,'ShopMedallion',new T.CylinderGeometry(.21,.21,.09,16),mat(0xd6c3a4),width*(.18+j*.32),2.84,.28);disc.rotation.x=Math.PI/2;}
  }
  if(e.roof==='tiled')hip(root,0,0,w+.58,d+.52,h+.16,.98,w*.71);
  if(e.roof==='gable'||e.roof==='redGable')hip(root,0,0,w+.38,d+.42,h+.10,.83,w-.06,e.roof==='redGable');
  if(e.roof==='shed'){
    const plate=box(root,'MonoPitchRoof',0,h+.39,0,w+.39,.14,d+.35,0x786d5f);plate.rotation.x=.082;
  }
  root.name=s.id;root.userData={design:s,front:'+Z',unit:'m',photographicElevation:true};return root;
}
