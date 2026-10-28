const DB='our-neighborhood-created-v1';
function open(){return new Promise((resolve,reject)=>{
 const r=indexedDB.open(DB,2);
 r.onupgradeneeded=()=>{
  const db=r.result,scenes=db.objectStoreNames.contains('scenes')?r.transaction.objectStore('scenes'):db.createObjectStore('scenes',{keyPath:'id'});
  const catalog=db.createObjectStore('catalog',{keyPath:'id'}),cursor=scenes.openCursor();cursor.onsuccess=()=>{const c=cursor.result;if(c){catalog.put(c.value.manifest);c.continue();}};
 };r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});}
export async function saveScene(manifest,files){
 const db=await open();try{await new Promise((resolve,reject)=>{const tx=db.transaction(['scenes','catalog'],'readwrite');tx.objectStore('scenes').put({id:manifest.id,manifest,files});tx.objectStore('catalog').put(manifest);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}
}
async function read(store,id){const db=await open();try{return await new Promise((resolve,reject)=>{const s=db.transaction(store).objectStore(store),r=id===undefined?s.getAll():s.get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
export const getScene=id=>read('scenes',id);
export const listScenes=()=>read('catalog');
export async function browserContext(id){const scene=await getScene(id);if(!scene)return null;const files={};for(const [name,bytes] of Object.entries(scene.files))files[name]=URL.createObjectURL(new Blob([bytes],{type:name.endsWith('.glb')?'model/gltf-binary':'application/json'}));return {...scene.manifest,browserFiles:files};}
