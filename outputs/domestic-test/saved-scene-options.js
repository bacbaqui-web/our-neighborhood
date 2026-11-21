// Native datalist values must uniquely identify scenes, not just their address.
export function savedSceneOptions(rows){
 const unique=[...new Map(rows.map(row=>[row.id,row])).values()],counts=new Map(),used=new Map();
 for(const row of unique)counts.set(row.address,(counts.get(row.address)||0)+1);
 return unique.map(row=>{const n=(used.get(row.address)||0)+1;used.set(row.address,n);return{id:row.id,value:row.address+(counts.get(row.address)>1?` · 저장 ${n}`:'')};});
}
