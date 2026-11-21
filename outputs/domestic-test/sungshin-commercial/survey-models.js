import * as T from 'three';
import {elevations} from './elevations.js';
import {buildStreetElevation} from './street-elevation.js';

// Facade coordinates use a fraction of the photographed frontage horizontally and metres vertically.
export function buildSurveyExterior(s,{root,mesh,box,mat,decal,maps}){
  const {width:w,depth:d}=s;
  const group=(parent,x,y,z,angle=0)=>{
    const g=new T.Group();g.position.set(x,y,z);g.rotation.y=angle;parent.add(g);return g;
  };
  const facade=group(root,-w/2,0,d/2);
  const left=group(root,-w/2,0,-d/2,-Math.PI/2);
  const right=group(root,w/2,0,d/2,Math.PI/2);
  const steel=0x3f4243, ivory=0xded9c9, blue=0x7595b0;
  const paneMat=new T.MeshStandardMaterial({color:0xa9c2c5,roughness:.21,transparent:true,opacity:.24,depthWrite:false});
  function horizontal(p,x1,x2,y1,y2,z,thick,color,name='FacadePanel'){
    return box(p,name,(x1+x2)/2,(y1+y2)/2,z,(x2-x1),y2-y1,thick,color);
  }
  const F=(x1,x2,y1,y2,z,thick,color,name)=>horizontal(facade,x1*w,x2*w,y1,y2,z,thick,color,name);
  function line(p,name,a,b,thickness,color){
    const start=new T.Vector3(...a),end=new T.Vector3(...b),dir=end.clone().sub(start);
    const m=mesh(p,name,new T.CylinderGeometry(thickness,thickness,dir.length(),6),mat(color));
    m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());return m;
  }
  function windowFrame(p,l,r,b,t,z,color,divisions=[],bar=.05){
    horizontal(p,l,r,b-bar/2,b+bar/2,z,.105,color,'WindowSill');
    horizontal(p,l,r,t-bar/2,t+bar/2,z,.105,color,'WindowHead');
    for(const x of [l,...divisions.map(v=>l+(r-l)*v),r])
      horizontal(p,x-bar/2,x+bar/2,b,t,z,.105,color,'WindowJamb');
  }
  function room(p,l,r,b,t,z,depth,color,frame,divisions=[],empty=false){
    const width=r-l,height=t-b,middle=(l+r)/2;
    horizontal(p,l,r,b,b+.07,z-depth/2,depth,color,'RoomFloor');
    horizontal(p,l,r,t-.09,t,z-depth/2,depth,color,'RoomCeiling');
    horizontal(p,l,r,b,t,z-depth,.11,color,'InnerWall');
    for(const k of [l,r])box(p,'InteriorReturn',k,(b+t)/2,z-depth/2,.075,height,depth,color);
    if(!empty){
      const counterHeight=Math.min(.83,height*.32);
      horizontal(p,l+.13,r-.14,b,b+counterHeight,z-depth*.72,.40,0x9c8972,'DisplayCounter');
      horizontal(p,l+.08,r-.09,b+counterHeight,b+counterHeight+.06,z-depth*.72,.49,0xc6b69d,'CounterTop');
    }
    mesh(p,'Glazing',new T.PlaneGeometry(width,height),paneMat,middle,(b+t)/2,z-.05);
    windowFrame(p,l,r,b,t,z,frame,divisions);
  }
  function door(p,l,r,b,t,z,color){
    windowFrame(p,l,r,b,t,z,color);
    box(p,'DoorPull',r-.12,b+(t-b)*.43,z+.14,.038,.48,.06,0xb9b6a9);
    for(const y of [b+(t-b)*.43-.16,b+(t-b)*.43+.16])box(p,'HandleFixing',r-.12,y,z+.083,.035,.035,.12,steel);
  }
  function shell(h,color,{glassLeft=false,glassRight=false,basement=null}={}){
    // A U-shaped envelope leaves all photographed openings genuinely open.
    box(root,'RearWall',0,h/2,-d/2+.08,w,h,.16,color);
    if(!glassLeft)box(root,'LeftReturnWall',-w/2+.075,h/2,0,.15,h,d,color);
    if(!glassRight)box(root,'RightReturnWall',w/2-.075,h/2,0,.15,h,d,color);
    box(root,'RoofDeck',0,h+.07,0,w,.14,d,color);
    if(!basement)box(root,'GroundFloor',0,.045,0,w,.09,d,0xb2afa3);
    else{
      const cut=basement*w;
      box(root,'GroundFloor',-w/2+cut/2,.04,0,cut,.08,d,0xb2afa3);
      box(root,'GroundFloorReturn',cut/2,.04,-1.45,w-cut,.08,d-2.90,0xb2afa3);
    }
  }
  function referencePrint(slot,p,x,y,z,width,height,name='ShopSign'){
    return decal(p,name,x,y,z,width,height,maps.fidelity,slot,2,6);
  }
  function tiledFace(p,l,r,b,t,z,color,joints,rows,stagger=false){
    horizontal(p,l,r,b,t,z-.09,.18,color,'Cladding');
    const ww=(r-l)/joints,hh=(t-b)/rows,joint=stagger?0xb19776:0xa28f89;
    for(let row=0;row<rows;row++){
      const y=b+row*hh;horizontal(p,l,r,y,y+.012,z+.008,.017,joint,'BedJoint');
      const off=stagger&&row%2?.5:0;
      for(let col=0;col<=joints;col++){
        const x=l+(col+off)*ww;if(x<=l+.01||x>=r-.01)continue;
        horizontal(p,x-.007,x+.007,y,y+hh,z+.01,.018,joint,'PerpendicularJoint');
      }
    }
  }
  function opaqueWindow(p,l,r,b,t,z,color,frame,div=[]){
    horizontal(p,l,r,b,t,z-.045,.09,color,'UpperGlass');windowFrame(p,l,r,b,t,z+.018,frame,div);
  }
  function placard(p,x,y,z,width,height,slot){
    const geometry=new T.PlaneGeometry(width,height),uv=geometry.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,(slot%4+.03+uv.getX(i)*.94)/4,1-(Math.floor(slot/4)+.97-uv.getY(i)*.94)/4);
    mesh(p,'WindowPrint',geometry,new T.MeshStandardMaterial({color:0xffffff,map:maps.poster??null,roughness:.94}),x,y,z);
  }
  function eave(p,x,y,z,width,reach,color,angle=.18){
    const m=box(p,'AwningFabric',x,y,z+reach/2,width,.07,reach,color);m.rotation.x=angle;
    box(p,'AwningValance',x,y-reach*Math.sin(angle)/2-.095,z+reach*.98,width,.20,.05,color);
    for(const k of [-1,1])line(p,'AwningStay',[x+k*(width/2-.13),y-.48,z],[x+k*(width/2-.13),y-.10,z+reach*.9],.022,steel);
  }
  function roofQuad(p,a,b,c,d,color,name='RoofFace'){
    const vertices=[...a,...b,...c,...a,...c,...d],g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.computeVertexNormals();
    mesh(p,name,g,new T.MeshStandardMaterial({color,roughness:.94,side:T.DoubleSide}));
  }
  function hip(p,cx,cz,width,depth,base,rise,peakWidth,red=false){
    const xx=width/2,zz=depth/2,crest=peakWidth/2;
    const a=[cx-xx,base,cz+zz],b=[cx+xx,base,cz+zz],c=[cx+xx,base,cz-zz],e=[cx-xx,base,cz-zz];
    const L=[cx-crest,base+rise,cz],R=[cx+crest,base+rise,cz];
    roofQuad(p,a,b,R,L,red?0xa76255:0x4f5150);roofQuad(p,e,L,R,c,red?0x995e51:0x555453);
    roofQuad(p,a,L,e,e,red?0xa7685b:0x585858);roofQuad(p,b,c,R,R,red?0x995e51:0x4d5050);
    const count=Math.ceil(width/.175);
    for(let j=0;j<=count;j++){
      const x=cx-xx+width*j/count,frac=Math.min(1,(x-cx+xx)/(xx-crest),(cx+xx-x)/(xx-crest));
      if(frac<=.015)continue;
      for(const sign of [-1,1]){
        const start=[x,base+.045,cz+sign*zz],end=[x,base+rise*frac+.045,cz+sign*zz*(1-frac)];
        line(p,'ClayTileRoll',start,end,.044,red?0xab7162:j%3?0x696b67:0x5c5f5d);
      }
    }
    for(const [start,end] of [[L,R],[a,L],[e,L],[b,R],[c,R]])line(p,'RidgeTile',start,end,.10,0x646461);
  }
  function hanok(){
    const h=2.97;shell(h,0x42433e,{glassLeft:true});
    // 047 reveals the black return to the alley. 051 continues along the same roof into the cream and pickup units.
    const zones=[[0,.42,0x393b36],[.42,.76,0xd6d0b9],[.76,1,0x45423c]];
    for(const [l,r,color] of zones){
      const edge=.018;
      F(l,l+edge,0,h,0,.24,color,'ShopPier');F(r-edge,r,0,h,0,.24,color,'ShopPier');
      F(l,r,2.38,h,.035,.32,color,'ShopFascia');F(l,r,0,.16,-.02,.22,color,'ShopSill');
      room(facade,(l+edge)*w,(r-edge)*w,.17,2.38,-.105,1.18,color===0xd6d0b9?0xc6bca6:0x89877a,color,[.51],true);
    }
    door(facade,.606*w,.736*w,.17,2.31,-.08,0xb2ab96);
    door(facade,.782*w,.887*w,.17,2.34,-.07,0x615d51);
    for(let j=0;j<28;j++)F(.42+j*.0120,.421+j*.0120,2.45,h,.206,.022,0xaea999,'VerticalCladding');
    referencePrint(0,facade,w*.21,2.70,.216,w*.29,.34);
    referencePrint(1,facade,w*.59,2.79,.228,w*.25,.45);
    referencePrint(2,facade,w*.88,2.69,.216,w*.24,.34);
    box(facade,'WhiteNotice',w*.492,1.38,-.04,w*.098,1.60,.025,0xe6e4d6);
    decal(facade,'WindowPrint',.492*w,1.38,-.004,w*.09,1.39,maps.south,11,2,6);
    for(let i=0;i<3;i++){
      horizontal(facade,.54*w,.684*w,.42+i*.42,.47+i*.42,-.78,.43,0x9a8b72,'StoreShelf');
      for(let j=0;j<4;j++)box(facade,'PackagedGoods',(.552+j*.034)*w,.62+i*.42,-.73,.16,.28,.20,[0xb39b71,0xabae99,0xc0afa1,0x9295a4][j]);
    }
    box(facade,'PickupCondenser',w*.915,.32,.23,.72,.52,.45,0xb6b5a6);
    for(let j=0;j<6;j++)box(facade,'VentSlat',w*.915,.14+j*.07,.47,.53,.023,.02,steel);
    horizontal(facade,0,w*.423,2.91,3.18,.18,.42,0x393a35,'BlackCornerCornice');
    horizontal(left,d*.27,d,2.91,3.18,.18,.42,0x393a35,'BlackReturnCornice');
    placard(facade,.82*w,.63,-.042,.68,.38,1);
    horizontal(left,0,d,0,h,-.08,.16,0x363a36,'AlleyWall');
    horizontal(left,d*.22,d*.85,.31,2.18,.031,.065,0x262b29,'AlleyWindowNiche');
    opaqueWindow(left,d*.25,d*.82,.38,2.11,.078,0x64706b,0x333832,[.38,.64]);
    hip(root,0,-.12,w+.65,d+.73,h+.28,1.07,w*.63);
    const cross=group(root,-w*.28,0,.13,Math.PI/2);
    hip(cross,0,0,d+.85,w*.44,h+.28,1.27,d*.51);
    box(root,'TimberEave',0,h+.12,d/2+.08,w+.42,.19,.49,0x5f5548);
    for(let j=0;j<Math.ceil(w/.29);j++){
      const x=-w/2+j*.29;box(root,'RafterTail',x,h+.11,d/2+.23,.095,.12,.43,0x8c7a61);
    }
  }
  function musicBuilding(){
    const h=10.55,stone=0xb7a79c,ledge=0x978a80;
    shell(h,stone,{basement:.69});
    F(0,.135,0,3.67,-.12,.24,0xc4bab0,'PaleSidePier');F(.135,.159,0,3.64,.035,.26,0x9f9080,'ShopJamb');
    F(.62,.69,0,3.64,-.015,.25,stone,'ShopJamb');F(.952,1,0,3.60,-.015,.25,stone,'StairColumn');
    const displayL=.16*w,displayR=.622*w;
    room(facade,displayL,displayR,.21,2.74,-.12,2.07,0x817e71,0x99968b,[.235,.505,.766],true);
    door(facade,displayL+(displayR-displayL)*.235,displayL+(displayR-displayL)*.505,.21,2.68,-.08,steel);
    // Taped glass marks are visible in 083, but the model does not infer the business status.
    for(const k of [-1,1])line(facade,'GlazingTape',[w*.388-.36,1.48-k*.43,-.027],[w*.388+.36,1.48+k*.43,-.027],.019,0xe2ded0);
    F(.13,.65,2.83,3.86,.035,.32,stone,'LowerSignBody');
    referencePrint(3,facade,w*.391,3.37,.209,w*.45,.75);
    eave(facade,w*.389,2.82,.03,w*.501,.47,0x77746c,.23);
    const ramp=(l,r,reach,height)=>{
      const x1=l*w,x2=r*w;
      roofQuad(facade,[x1,height,0],[x2,height,0],[x2,.045,reach],[x1,.045,reach],0xc5bfae,'EntryRamp');
      roofQuad(facade,[x1,0,0],[x1,height,0],[x1,.045,reach],[x1,0,reach],0xa59e91,'RampSide');
    };
    ramp(.09,.251,1.31,.24);ramp(.258,.604,1.55,.21);
    const stairL=.69*w,stairR=.952*w;
    for(let j=0;j<10;j++)horizontal(facade,stairL,stairR,-.165*j-.14,-.165*j,-.155-j*.286,.294,0x8b8981,'BasementStep');
    for(const x of [stairL,stairR])box(facade,'StairReturn',x,.67,-1.47,.115,3.95,2.93,0x79796f);
    horizontal(facade,stairL,stairR,-1.69,2.83,-2.90,.10,0x4c504c,'StairTurn');
    for(const x of [stairL+.13,stairR-.13])line(facade,'BasementRail',[x,.86,-.08],[x,-.60,-2.62],.039,0xb89f69);
    function tenant(slot,x,y,z,width,height){
      box(facade,'TenantLightbox',x,y,z-.10,width+.12,height+.13,.22,0xb6b4a5);
      referencePrint([6,5,4][slot],facade,x,y,z+.02,width,height,'UpperTenantSign');
    }
    F(.656,1,2.78,3.92,.08,.41,stone,'B1Marquee');
    tenant(0,w*.827,3.37,.38,w*.329,.95);
    placard(facade,.718*w,1.10,.067,.48,1.35,7);
    // The blue central pane continues across floor levels. Stone and the tenant tower have independent widths.
    F(0,.226,3.84,h,-.08,.30,stone,'LeftStoneSpine');F(.611,.676,3.84,h,-.08,.30,stone,'RightStoneSpine');
    F(.676,1,5.75,h,-.41,.31,0xb8ac9d,'TenantShaft');
    F(.676,.71,3.85,5.75,-.39,.60,stone,'RecessPier');
    F(.961,1,3.85,5.75,-.38,.60,stone,'RecessPier');
    room(facade,.71*w,.961*w,3.85,5.76,-.89,1.10,0x77776d,steel,[.64],true);
    horizontal(facade,stairL,stairR,-1.78,-1.62,-1.44,2.91,0x837e74,'BasementFoundation');
    for(let j=0;j<7;j++){
      const yy=4.0+j*.91;F(.015,.220,yy,yy+.012,.076,.02,0xa5978c,'StoneCourse');
    }
    const u0=.227*w,u1=.611*w,levels=[3.84,5.33,6.94,8.52,10.32];
    for(let i=0;i<3;i++)for(let j=0;j<4;j++){
      const l=u0+(u1-u0)*i/3,r=u0+(u1-u0)*(i+1)/3;
      opaqueWindow(facade,l,r,levels[j],levels[j+1],-.035,[0x7796ae,0x6b8aa6,0x7898b0,0x7891ac][(i+j)%4],steel);
    }
    F(.22,.62,10.32,h,-.01,.32,stone,'CurtainHeader');
    opaqueWindow(facade,.460*w,.593*w,3.96,5.66,.09,0x91a6b1,ivory);
    opaqueWindow(facade,.334*w,.513*w,7.54,8.02,.09,0x778fa3,ivory,[.52]);
    tenant(1,w*.833,6.04,.37,w*.337,.63);
    tenant(2,w*.833,6.79,.37,w*.337,.80);
    F(.661,1.006,7.26,7.83,.24,.21,ivory,'TenantCoping');
    const blade=group(facade,.059*w,0,.28,-Math.PI/2);
    horizontal(blade,-.82,0,4.05,7.98,.035,.13,steel,'VerticalTenantBoard');
    for(let j=0;j<3;j++)placard(blade,-.40,4.75+j*1.07,.12,.61,.85,[7,3,4][j]);
  }

  function timberShops(){
    const h=9.55,stone=0xb47e70,blush=0xc88f89,aged=0xc2b7a2,wood=0x987451;
    shell(h,stone,{glassRight:true});
    // The separate street view 098 exposes a narrow red return, independent from the timber frontage.
    horizontal(right,0,d*.53,0,3.57,-.10,.21,0xb87f71,'RestaurantReturn');
    room(right,d*.535,d*.975,.14,2.64,-.17,1.07,0x8b8880,steel,[.55],true);
    door(right,d*.54,d*.75,.14,2.56,-.12,steel);
    horizontal(right,d*.52,d,2.67,3.57,.02,.28,0xa7675d,'RestaurantBand');
    decal(right,'KfcReturnSign',d*.75,3.12,.20,d*.44,.69,maps.corners,4,2,3,[0,255,510,768]);
    horizontal(right,0,d,3.57,h,-.22,.19,stone,'SideStoneMass');
    opaqueWindow(right,d*.28,d*.87,3.96,5.57,-.07,0x80979e,steel);
    opaqueWindow(right,d*.11,d*.89,6.36,8.59,-.08,0x8fa0a3,steel,[.34,.64]);
    horizontal(right,0,d,8.63,8.82,.035,.22,0x896d60,'RoofLine');
    const shops=[[0,.287,aged],[.287,.601,wood],[.601,1,0x675454]];
    for(const [l,r,color] of shops){
      F(l,l+.012,0,3.32,.035,.19,color,'ShopJamb');F(r-.012,r,0,3.32,.035,.19,color,'ShopJamb');
      F(l,r,2.62,3.57,.025,.21,color,'ShopFascia');
    }
    room(facade,.012*w,.276*w,.095,2.66,-.16,1.90,0x8e8778,0x837768,[.23,.50,.77],true);
    door(facade,.14*w,.216*w,.095,2.64,-.10,0x746a5b);
    // Narrow alternating boards on the middle shop continue down into its timber folding doors.
    room(facade,.304*w,.59*w,.08,2.59,-.16,1.72,0x786e5c,wood,[],true);
    for(let j=0;j<6;j++){
      const x=(.302+j*.056)*w;box(facade,'DoorStile',x,1.35,.028,.091,2.64,.17,wood);
      for(const y of [.27,1.30,2.26])box(facade,'FoldingHinge',x,y,.13,.038,.10,.032,steel);
    }
    door(facade,.467*w,.525*w,.09,2.54,.005,wood);
    room(facade,.614*w,.976*w,.07,2.57,-.18,2.0,0xb8b3a0,steel,[.58],true);
    door(facade,.835*w,.967*w,.07,2.52,-.14,steel);
    for(let j=0;j<28;j++){
      const x=(.29+j*.011)*w;F(x/w,(x+.026)/w,2.66,3.56,.148,.046,0x70583f,'TimberSeam');
    }
    for(let j=0;j<16;j++)F(.007+j*.017,.009+j*.017,2.67,3.51,.145,.042,0xa29887,'Weatherboard');
    referencePrint(7,facade,w*.144,3.13,.18,w*.252,.58);
    referencePrint(8,facade,w*.444,3.12,.192,w*.23,.55);
    for(let j=0;j<8;j++)F(.606,.989,2.78+j*.10,2.831+j*.10,.144,.16,0x383c3b,'BlackLouvre');
    box(facade,'RedShopCanopy',w*.801,2.65,.37,w*.406,.16,.88,0x9d5755);
    F(.602,.657,3.57,h,.015,.31,stone,'StoneColumn');F(.953,1,3.57,h,.105,.48,blush,'StoneFin');
    F(0,.054,3.57,h,-.055,.24,stone,'StoneColumn');
    // The lower left storey is a recessed black gallery. A separate four-pane curtain projects over it.
    room(facade,.055*w,.304*w,3.59,5.56,-.29,.64,0x767b70,0x343d3d,[.19,.39,.62,.81],true);
    room(facade,.304*w,.600*w,3.59,5.56,-.92,1.23,0x858979,0x414941,[.51],true);
    eave(facade,w*.454,5.28,-.79,w*.276,.64,0x859a95);
    placard(facade,.46*w,4.23,-.82,w*.17,.45,13);
    for(const [l,r] of [[.023,.264],[.312,.577]]){
      const mid=(l+r)*w/2;box(facade,'ClothesRod',mid,2.14,-.64,(r-l)*w,.04,.04,steel);
      for(let j=0;j<8;j++){
        const x=(l+(r-l)*(j+.5)/8)*w;
        line(facade,'ClothesHanger',[x,2.13,-.63],[x+.08,1.94,-.63],.014,steel);
        box(facade,'HangingFabric',x,1.49+j%3*.06,-.66,.15,.92-j%3*.07,.26,[0x7d8179,0x9b8d76,0x756c6b,0xb2a994][j%4]);
      }
    }
    line(facade,'InteriorHandrail',[.625*w,.58,-.54],[.827*w,1.46,-1.22],.041,steel);
    placard(facade,.908*w,1.46,-.106,.38,.57,8);
    for(const y of [4.23,5.3])line(facade,'BladeSupport',[w*.973,y,-.02],[w*.985,y+.17,.58],.032,steel);
    horizontal(facade,.056*w,.304*w,4.59,4.64,-.295,.095,0x303b3a,'GalleryTransom');
    for(let j=0;j<4;j++){
      const l=.045+j*.141,r=l+.141;
      F(l,r,5.55,6.24,.23,.19,0x9ab7c3,'CurtainSpandrel');
      opaqueWindow(facade,l*w,r*w,6.24,h+.055,.23,[0x849eb2,0x7793ac,0x8ba4b4,0x7e99af][j],0x303941);
      F(l,l+.007,5.53,h+.09,.38,.13,0x303941,'DarkCurtainMullion');
    }
    box(facade,'ProjectingCurtainSill',w*.328,5.54,.19,w*.572,.13,.52,0x414744);
    opaqueWindow(facade,.657*w,.952*w,3.64,5.65,-.10,0x79919e,steel);
    tiledFace(facade,.653*w,.955*w,5.67,6.73,.07,stone,5,2,true);
    opaqueWindow(facade,.658*w,.948*w,6.74,8.89,-.105,0x819199,steel);
    F(.652,.956,8.90,h,.012,.27,stone,'StoneSpandrel');
  }
  function yardRestaurant(){
    const h=6.64,bricks=0xcbaa80,white=0xe4dfd0,sign=0x363934;
    shell(h,white,{glassRight:true});
    F(0,.13,0,3.31,-.02,.20,0x706659,'DoorSpandrel');
    room(facade,.012*w,.125*w,.08,2.64,-.27,.9,0x7b7567,0x4b4e46,[],true);
    door(facade,.015*w,.124*w,.09,2.61,-.22,0x494a41);
    tiledFace(facade,.135*w,w,.07,3.66,.025,bricks,20,25,true);
    for(const xx of [.42,.76]){
      F(xx,xx+.039,2.19,2.54,.058,.07,0x424238,'VentInset');
      box(facade,'VentLintel',w*(xx+.019),2.57,.098,w*.052,.068,.15,0xa98963);
    }
    F(.09,1,2.82,4.04,.105,.31,sign,'YardSignTray');
    decal(facade,'ShopSign',w*.546,3.44,.303,w*.86,1.05,maps.yard,0,1,2,[0,396,793]);
    for(const xx of [.13,.46]){
      const x=w*xx;
      box(facade,'CopperDuct',x,2.87,.37,.34,.75,.36,0x9d7250);
      const hood=box(facade,'CopperHood',x,3.11,.47,.52,.47,.51,0xb1845f);hood.rotation.x=-.23;
    }
    // Four distinct upper openings, with broad wall between pairs and inset guard rails.
    const spans=[[0,.033],[.183,.257],[.438,.532],[.676,.776],[.969,1]];
    for(const [l,r] of spans)F(l,r,3.94,h,-.10,.24,white,'UpperWallPier');
    for(const [l,r] of [[.033,.183],[.257,.438],[.532,.676],[.776,.969]]){
      F(l,r,3.94,4.35,-.11,.23,white,'Spandrel');F(l,r,5.99,h,-.11,.23,white,'WindowHeadWall');
      opaqueWindow(facade,l*w,r*w,4.34,5.99,-.19,0x9da9a1,0x83867d,[.53]);
      for(let j=0;j<5;j++)box(facade,'WindowGuard',w*(l+(r-l)*j/4),4.55,-.022,.026,.41,.044,steel);
      box(facade,'GuardTop',w*(l+r)/2,4.76,-.02,w*(r-l),.04,.044,steel);
    }
    horizontal(right,0,d,2.80,4.04,.11,.29,sign,'SideSignTray');
    decal(right,'SideShopSign',d*.43,3.46,.30,d*.81,.89,maps.yard,0,1,2,[0,396,793]);
    horizontal(right,0,d,4.04,h,-.1,.22,white,'UpperReturn');
    for(const [l,r] of [[.006,.317],[.345,.621]]){
      horizontal(right,l*d,r*d,.09,2.77,-.10,.18,0xb5b2a7,'MetalShutter');
      for(let j=0;j<18;j++)horizontal(right,l*d,r*d,.16+j*.142,.186+j*.142,.015,.04,({5:0x7c9b9c,10:0xb6a06c,14:0xaa806b})[j]??0x969c91,'RollSlat');
    }
    horizontal(right,d*.317,d*.345,0,2.81,-.025,.24,0x4b4b40,'ShutterPier');
    room(right,d*.621,d*.85,.13,2.80,-.35,1.24,0x756b58,0x46473e,[.59],true);
    door(right,d*.633,d*.758,.14,2.56,-.28,steel);
    horizontal(right,d*.85,d,0,2.8,-.09,.18,bricks,'SideWall');
    eave(right,d*.41,2.88,.07,d*.81,.69,0xa95746);
    horizontal(right,.16,.82,4.02,6.32,.32,.19,sign,'TallBladeSign');
    for(let j=0;j<3;j++)box(right,'BladeLetterBlock',.48,4.49+j*.64,.43,.24,.085,.03,ivory);
    box(facade,'YardTurf',w*.50,.031,1.64,w,.062,3.29,0x89995b);
    for(let j=0;j<8;j++)for(let k=0;k<2;k++)box(facade,'YardSteppingStone',w*(.07+j*.112),.078,.83+k*.65,.75,.055,.32,0xb2b0a0);
    for(const [xx,zz,ww,hh] of [[.18,.38,.64,1.28],[.86,.33,.67,1.53],[.69,1.95,.65,1.19]]){
      const frame=group(facade,w*xx,0,zz);frame.rotation.x=-.10;
      box(frame,'MenuBacking',0,.18+hh/2,0,ww+.06,hh+.06,.068,0xc5bfaa);
      placard(frame,0,.18+hh/2,.045,ww,hh,3);
      for(const dx of [-1,1])line(facade,'MenuFoot',[w*xx+dx*ww*.36,.07,zz+.15],[w*xx+dx*ww*.36,.52,zz-.03],.026,steel);
    }
    for(const xx of [.30,.52,.77]){
      mesh(facade,'StonePlanter',new T.CylinderGeometry(.19,.13,.23,10),mat(0xc7c4af),w*xx,.17,.18);
      mesh(facade,'PlanterFoliage',new T.IcosahedronGeometry(.14,0),mat(0x788357),w*xx,.32,.18);
    }
  }

  function sockShop(){
    const h=5.92,stone=0xb4a09b,frame=0x939d95,cyan=0x79c2c3;
    shell(h,stone);
    // Source 099 shows the upper windows cropped by the sign; the front roof has a low coping.
    F(0,.035,0,h,.02,.25,0xcac7ba,'LeftPartyPier');F(.968,1,0,h,.02,.25,0xd1cabc,'RightPartyPier');
    horizontal(facade,.033*w,.967*w,0,.10,-.58,1.20,0x9c9583,'OpenShopFloor');
    horizontal(facade,.032*w,.968*w,.10,2.33,-1.4,.15,0x726e60,'Stockroom');
    for(let k=0;k<3;k++)horizontal(facade,.044*w,.328*w,.22+k*.44,.27+k*.44,-.76,.51,0xa2937e,'StockShelf');
    for(let j=0;j<24;j++){
      const x=w*(.045+j*.038);if(x>w*.34&&x<w*.51)continue;
      box(facade,'HangingSockPack',x,1.58,-.16,.17,.60,.14,[0xb3ab9d,0x848487,0xa7aaa2,0x697174][j%4]);
      box(facade,'GarmentHook',x,1.91,-.16,.029,.09,.05,steel);
    }
    box(facade,'DisplayRod',w*.50,1.97,-.16,w*.92,.055,.06,steel);
    F(.008,.993,2.35,3.72,.13,.29,0xd2d2c8,'LongSignTray');
    referencePrint(10,facade,w*.50,3.045,.322,w*.968,1.27);
    eave(facade,w*.50,2.34,.08,w*1.005,1.13,cyan,.255);
    referencePrint(11,facade,w*.50,2.12,1.24,w*.30,.18,'AwningPrint');
    const windows=[[.095,.282],[.464,.541],[.749,.936]];
    const walls=[[.032,.095],[.282,.464],[.541,.749],[.936,.968]];
    for(const [l,r]of walls)tiledFace(facade,l*w,r*w,3.59,h,.015,stone,Math.max(1,Math.round((r-l)*30)),7);
    for(const [l,r]of windows){
      const arch=(r-l)<.1,high=arch?4.93:5.18;
      tiledFace(facade,l*w,r*w,high,h,.015,stone,Math.max(2,Math.round((r-l)*30)),3);
      if(!arch){
        const cx=(l+r)*w/2,ww=(r-l)*w;
        opaqueWindow(facade,cx-ww*.38,cx+ww*.38,3.65,high,.36,0x97aca8,frame);
        for(const k of [-1,1]){
          const wing=group(facade,cx+k*ww*.43,0,.18,k*.96);
          opaqueWindow(wing,-.22,.22,3.64,high,0,0x879c9b,frame);
        }
        box(facade,'ProjectingWindowCap',cx,high+.044,.18,ww,.092,.61,frame);
      }else{
        const cx=(l+r)*w/2,rr=(r-l)*w/2,base=3.62,shoulder=high-rr;
        const archShape=new T.Shape();archShape.moveTo(-rr,0);archShape.lineTo(-rr,shoulder-base);
        archShape.absarc(0,shoulder-base,rr,Math.PI,0,true);archShape.lineTo(rr,0);archShape.closePath();
        mesh(facade,'ArchGlass',new T.ShapeGeometry(archShape,20),mat(0x636e6c),cx,base,.057);
        for(let j=0;j<12;j++){
          const a=j*Math.PI/12,b=(j+1)*Math.PI/12;
          line(facade,'ArchedFrame',[cx+Math.cos(a)*rr,shoulder+Math.sin(a)*rr,.10],[cx+Math.cos(b)*rr,shoulder+Math.sin(b)*rr,.10],.029,steel);
        }
        for(let j=1;j<=2;j++)line(facade,'FanlightSpoke',[cx,shoulder,.105],[cx+Math.cos(Math.PI*j/3)*rr,shoulder+Math.sin(Math.PI*j/3)*rr,.105],.022,steel);
        for(let j=0;j<8;j++)box(facade,'ArchGrille',cx+rr*(j/3.5-1),(base+shoulder)/2,.117,.014,shoulder-base,.022,steel);
        for(let j=0;j<7;j++)horizontal(facade,cx-rr,cx+rr,base+j*(shoulder-base)/7,base+j*(shoulder-base)/7+.014,.12,.019,steel,'ScreenGrid');
        for(const k of [-1,1]){
          const doorLeaf=group(facade,cx+k*rr,0,.10,k*.68);
          opaqueWindow(doorLeaf,k<0?-rr:0,k<0?0:rr,base,shoulder,0,0xb3bbb0,frame);
        }
      }
    }
    const blade=group(facade,w*.352,0,.09,-Math.PI/2);
    horizontal(blade,0,1.08,3.73,6.73,.06,.12,ivory,'ProjectingSign');
    for(const face of [-1,1]){
      const side=group(blade,.54,5.23,.06+face*.086,face===1?0:Math.PI);
      const lettering=group(side,0,0,0);lettering.rotation.z=Math.PI/2;
      referencePrint(10,lettering,0,0,0,2.70,.88,'BladePrint');
    }
    box(facade,'BladeBracket',w*.352,3.89,.50,.09,.10,1.03,steel);
    F(0,1,h-.025,h+.071,.06,.31,0xc6bdb0,'RoofCoping');
  }
  if(elevations[s.number])return buildStreetElevation(s,elevations[s.number],{root,box,mesh,mat,room,door,opaqueWindow,horizontal,eave,placard,tiledFace,hip,line,group,decal,referencePrint,maps});
  if(s.number===1)yardRestaurant();
  if(s.number===50)sockShop();
  if(s.number===25)hanok();
  if(s.number===43)musicBuilding();
  if(s.number===48)timberShops();
  root.name=s.id;root.userData={design:s,front:'+Z',unit:'m',photographicElevation:true};
  return root;
}
