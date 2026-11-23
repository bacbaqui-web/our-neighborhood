export const PREFIX='commerce:bakery-blue-';
export const definitions={body:{name:'PAKO PAKO · 청색 점포 본체',size:[7.76,3.95,5.4]},sign:{name:'청색 금테 간판',size:[7.6,.90,.24]},awning:{name:'검정·흰색 줄무늬 차양',size:[7.9,.48,1.05]},showcase:{name:'창가 유리 빵 쇼케이스',size:[1.4,1.64,.7]},wallrack:{name:'열린 목재 3단 빵 진열장',size:[1.4,1.95,.7]},island:{name:'목재 중앙 빵 매대',size:[1.6,1.13,.95]},counter:{name:'빵집 계산대',size:[1.15,1,.7]},oven:{name:'제빵 오븐',size:[1.2,1.85,.65]},pos:{name:'결제 단말기',size:[.28,.29,.24]},bags:{name:'포장 봉투',size:[.38,.34,.28]},bench:{name:'전면 목재 벤치',size:[1.55,.48,.43]},board:{name:'핑크 빵 안내 입간판',size:[.55,.95,.48]},poster:{name:'버터빵 광고 포스터',size:[.36,.62,.004]},decal:{name:'출입문 OPEN 안내',size:[.36,.20,.003]},light:{name:'균일한 실내 평판등',size:[1.15,.07,.36]},coffee:{name:'커피 작업대와 기계',size:[1.3,1.5,.65]},fridge:{name:'유리 음료 냉장고',size:[.7,1.9,.65]}};
export function dimensions({width=7.6,height=3,depth=5,frontDepth=1.5}={}){
 for(const[k,v,a,b]of [['width',width,6.4,9],['height',height,2.7,3.3],['depth',depth,4.5,6],['frontDepth',frontDepth,0,8]])if(!Number.isFinite(v)||v<a||v>b)throw Error(k+' 지원 범위를 벗어났습니다.');
 const doorX=width*.08,doorLeft=doorX-.48,doorRight=doorX+.48;
 return{width,height,depth,frontDepth,doorX,doorLeft,doorRight,doorTop:2.42,glassTop:height-.25,floor:.12,transomHeight:height-.25-2.42,signBottom:height+.05,signTop:height+.95,fasciaHeight:.30};
}
