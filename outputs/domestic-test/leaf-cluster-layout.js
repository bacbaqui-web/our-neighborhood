// Perforated foliage sprays follow a woody tip instead of stacking three disks
// at the same center. All randomness is seeded; rotating the camera only turns
// the cards, never moves the foliage or changes its pattern.
// Keep placement tests unchanged; scale only the rendered sprays and their shadows.
export const LEAF_CARD_SCALE=2.3;
export function subdivideLeafClusters(clumps,{random,space,nodes=[],leafScale=1}){
 const result=[];
 for(const [group,c] of clumps.entries()){
  const node=nodes[c.node],parent=nodes[node?.parent],direction=node&&parent?node.p.map((v,k)=>v-parent.p[k]):[0,1,0];
  const length=Math.hypot(...direction)||1,axis=direction.map(v=>v/length);
  const cross=Math.abs(axis[1])<.9?[-axis[2],0,axis[0]]:[1,0,0],crossLength=Math.hypot(...cross)||1;
  const side=cross.map(v=>v/crossLength),count=random()<.24?1:2;
  const groupRank=random(),baseVariant=Math.floor(random()*4);
  for(let i=0;i<count;i++){
   const radius=Math.min(c.radius*(.67+random()*.14),.98*leafScale);
   const along=i===0?.12:-.52,across=(i===0?1:-1)*(.14+random()*.16);
   const center=c.center.map((v,k)=>v+c.radius*(axis[k]*along+side[k]*across));
   if(!space.clearSphere(center,radius*.22))continue;
   result.push({...c,center,radius,variant:(baseVariant+i*2)%4,
    // Spring keeps a main spray on more branch tips rather than a few full balls.
    seasonRank:i===0?groupRank*.52:.52+random()*.48,
    roll:(random()-.5)*1.5,aspect:.8+random()*.4,mirror:random()<.5?-1:1,
    axis,cardScale:LEAF_CARD_SCALE,coverage:.52,tone:.97+random()*.03,
    lightingGroup:group,lightingCenter:c.center,lightingRadius:c.radius});
  }
 }
 return result;
}
