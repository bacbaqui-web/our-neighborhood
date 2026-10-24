// A backlit panel emits its own painted color. Adding warm white to the
// emission washed cyan/red panels out and illuminated dark graphic blocks.
// Leave headroom for reflected light, preserving contrast between sign colors.
export function applySignEmission(material,base,{on=1,night=0,monochrome=false}={}){
 material.emissive.copy(base);
 if(monochrome){const y=.2126*base.r+.7152*base.g+.0722*base.b;material.emissive.setScalar(y);}
 material.emissiveIntensity=on*(.08+Math.max(0,Math.min(1,night))*.74);
}
