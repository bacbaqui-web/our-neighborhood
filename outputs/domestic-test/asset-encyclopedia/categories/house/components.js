// Shared existing door geometry. Selection policy belongs to assembly-rules.
export function emitHouseDoor(out,id,{u,g,w=1.34,h=2.12}){
 const B=out.box,glass=id==='original-glass-door';
 B(u,g+h/2+.1,.06,w+.16,h+.18,.15,0x9b9f93,true);B(u,g+h/2+.1,.16,w,h,.065,glass?0x757c71:0x41584d,true);
 if(glass){B(u,g+1.48,.202,w-.18,1.05,.025,0x5c7976,false);B(u,g+1.05,.23,.035,1.98,.032,0xb1b7ac,false);}else for(let j=0;j<5;j++)B(u,g+.32+j*.34,.205,w-.18,.23,.024,0x334a42,false);
 B(u+w*.33,g+1.03,.255,.025,.28,.035,0xd1d1bc,false);
}
