// Same bounded field as work/gentle_terrain.py. Stable for each selected location.
export function gentleHeight(lat,lon){
 const p=((Math.round(lat*100000)*31+Math.round(lon*100000)*17)%65521)/65521*Math.PI*2;
 return (x,z)=>.9*(Math.sin(x/75+z/110+p)-Math.sin(p))+.55*(Math.sin(-x/105+z/65+p*1.7)-Math.sin(p*1.7))+.25*(Math.sin(x/48+z/83+p*2.3)-Math.sin(p*2.3));
}
export function gentleMeshHeight(lat,lon){
 const h=gentleHeight(lat,lon);
 return (x,z)=>{const ax=Math.floor(x/5)*5,az=Math.floor(z/5)*5,u=(x-ax)/5,v=(z-az)/5,a=h(ax,az),b=h(ax+5,az),c=h(ax,az+5),d=h(ax+5,az+5);return u+v<=1?a*(1-u-v)+b*u+c*v:d*(u+v-1)+b*(1-v)+c*(1-u);};
}
