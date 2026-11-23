// Photo-proportion estimates, not measured dimensions.
export function frontage({width=6.4,height=3,depth=4}={}){
 if(!Number.isFinite(width)||width<4.8||width>9||!Number.isFinite(height)||height<2.7||height>3.3||!Number.isFinite(depth)||depth<3.5||depth>5)throw Error('지원 크기: 폭 4.8~9m, 실내 천장고 2.7~3.3m, 깊이 3.5~5m');
 const floor=.12,ceiling=height+.17,doorTop=floor+2.4,glassTop=ceiling-.12,signBottom=ceiling+.16;
 const signSideGap=.28,signNameWidth=Math.min(2.95,width-2.35);
 return{frostTop:1.15,handleBottom:1.15,handleTop:1.55,glassLabelCenter:(1.15+glassTop)/2,signNameWidth,signSideGap,signLeftX:-(signNameWidth/2+signSideGap+.39),signRightX:signNameWidth/2+signSideGap+.34,width,height,depth,door:1.65,side:(width-.12-1.65)/2,floor,ceiling,glassHeight:ceiling,doorTop,glassTop,transomHeight:glassTop-doorTop,signBottom,signTop:signBottom+1.22,fasciaHeight:signBottom-glassTop};
}
