// Embed the generated PNG directly into the GLB so downloads are self-contained.
export function embedBusAtlas(binary,png){
 const source=Buffer.from(binary),jsonSize=source.readUInt32LE(12),doc=JSON.parse(source.subarray(20,20+jsonSize).toString()),binStart=28+jsonSize;
 const old=source.subarray(binStart,binStart+source.readUInt32LE(20+jsonSize));
 const imageOffset=Math.ceil(old.length/4)*4,bin=Buffer.alloc(Math.ceil((imageOffset+png.length)/4)*4);old.copy(bin);png.copy(bin,imageOffset);
 const imageView=doc.bufferViews.length;doc.bufferViews.push({buffer:0,byteOffset:imageOffset,byteLength:png.length});
 doc.images=[{name:'Generated bus sign graphics',mimeType:'image/png',bufferView:imageView}];doc.samplers=[{magFilter:9729,minFilter:9987,wrapS:33071,wrapT:33071}];doc.textures=[{sampler:0,source:0}];
 const mat=doc.materials.find(m=>m.name==='bus-sign-atlas');if(!mat)throw Error('Missing bus atlas material');mat.pbrMetallicRoughness.baseColorTexture={index:0};
 doc.buffers[0].byteLength=bin.length;const raw=Buffer.from(JSON.stringify(doc)),json=Buffer.alloc(Math.ceil(raw.length/4)*4,32);raw.copy(json);
 const out=Buffer.alloc(28+json.length+bin.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(json.length,12);out.writeUInt32LE(0x4e4f534a,16);json.copy(out,20);out.writeUInt32LE(bin.length,20+json.length);out.writeUInt32LE(0x004e4942,24+json.length);bin.copy(out,28+json.length);return out;
}
