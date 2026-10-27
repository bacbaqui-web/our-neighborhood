// Reuse the tree foliage atlas/renderer, but arrange a compact plant crown.
// Atlas fringe variant 2 has ~40.7% alpha coverage across the three viewpoints;
// overlapping offset silhouettes fill its holes without making a huge single card.
export const PLANT_FOLIAGE_SPECIES='fringe';
export const PLANT_CARD_SCALE=1.15;
export function planPlantCanopies(plants){
 return plants.map((p,i)=>{
  const [x,y,z]=p.root,sourceRadius=Math.max(.035,Math.min(Number(p.radius)||.08,.65)),height=Math.max(.06,Number(p.height)||.1);
  const radius=sourceRadius*1.06,crownHeight=Math.max(height,radius*1.72),tall=height>sourceRadius*2.5;
  // Main mass + a staggered surrounding ring; tall growth gets one tip spray.
  // Keep centers in a small volume: large translations cause plants to collide.
  const layout=[[0,.48,0,1],[.09,.55,-.06,.94],[-.23,.42,.05,.94],[.22,.46,.10,.94],[-.04,.60,.23,.9],[.03,.62,-.23,.9]];
  if(tall)layout.push([-.06,.79,.02,.78]);
  const phase=(i*.61803398875%1)*Math.PI*2,cs=Math.cos(phase),sn=Math.sin(phase),variants=[2,3,2,1,2,3,1];
  const clumps=layout.map(([dx,fy,dz,s],k)=>{
   const cardRadius=radius*.72*s,effectiveRadius=cardRadius*PLANT_CARD_SCALE;
   // Use each card's bounding-sphere radius, so camera pitch and fixed roll
   // cannot push foliage below its soil anchor or require runtime relayout.
   const minY=effectiveRadius+.006,maxY=Math.max(minY,crownHeight-effectiveRadius);
   return{center:[x+radius*(dx*cs-dz*sn),y+Math.min(maxY,Math.max(minY,crownHeight*fy)),z+radius*(dx*sn+dz*cs)],radius:cardRadius,cardScale:PLANT_CARD_SCALE,variant:variants[k],tone:k<2?.99:.95,roll:[-.25,.28,.12,-.18,.30,-.32,.07][k],mirror:(i+k)%2?-1:1,aspect:1,
    // Surviving seasonal cards start with the core, not isolated outer tips.
    seasonRank:k<2?(i*.381966%1)*.30:.3+((i*.618+k*.23)%1)*.7,
    lightingGroup:0,lightingCenter:[x,y+crownHeight*.5,z],lightingRadius:sourceRadius};
  });
  return{id:p.id,root:p.root,height:crownHeight,radius,species:PLANT_FOLIAGE_SPECIES,paths:[],nodes:[],clumps,stats:{source:p.source,kind:'plant',sourceRadius,sourceHeight:height,plantCardCount:clumps.length,alphaCoverage:.407,layout:'compact-offset-crown-v2'}};
 });
}
