export const eraPresets={
 old:{name:'구축',levels:[5,12,15],description:'낮은 판상동과 중층 동 · 금속 난간 · 실외기 · 옥상 기계실'},
 middle:{name:'중간 시대',description:'기존 정릉풍림아이원 배치 · 베이지 외벽 · 지붕 덮개'},
 new:{name:'신축',levels:[20,25,30],description:'밝은 외벽과 짙은 수직선 · 간결한 창호 · 옥상 프레임'}
};
export function eraProperties(properties,index,era){const preset=eraPresets[era]||eraPresets.middle;if(!preset.levels)return {...properties};return {...properties,apartment_era:era,apartment_variant:index%3,gro_flo_co:preset.levels[index%3]};}
