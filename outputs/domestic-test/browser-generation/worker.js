import {prepareScene} from './prepare-scene.js?v=149';
const base=new URL('./',import.meta.url);
// Synchronous network access is restricted to this disposable background Worker.
self.browserRequest=url=>{
 const allowed=['https://portal.esrikr.com/','https://tiles.openfreemap.org/','https://s3.amazonaws.com/elevation-tiles-prod/'];
 if(!allowed.some(prefix=>url.startsWith(prefix)))throw Error('허용되지 않은 지도 자료 주소입니다.');
 const xhr=new XMLHttpRequest();xhr.open('GET',url,false);xhr.responseType='arraybuffer';xhr.timeout=60000;xhr.send();
 if(xhr.status<200||xhr.status>=300)throw Error('지도 자료를 받지 못했습니다. 잠시 후 다시 시도해 주세요. ('+xhr.status+')');
 return new Uint8Array(xhr.response);
};
const progress=(message,percent)=>postMessage({type:'progress',message,percent});
self.onmessage=async({data})=>{
 try{
  progress('처음 실행에 필요한 파일을 받는 중입니다…',2);
  const {loadPyodide}=await import('https://cdn.jsdelivr.net/pyodide/v314.0.0/full/pyodide.mjs');
  const py=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v314.0.0/full/'});
  await py.loadPackage(['numpy','scipy','scikit-image','shapely','pillow','pyclipper','protobuf','micropip']);
  await py.runPythonAsync("import micropip\nawait micropip.install('mapbox-vector-tile==2.2.0',deps=False)");
  const [sources,terrainText,bounds]=await Promise.all([fetch(new URL('sources.json?v=149',base),{cache:'no-cache'}).then(r=>r.json()),fetch(new URL('terrain-source.txt',base)).then(r=>r.text()),fetch(new URL('vehicle-bounds.json',base)).then(r=>r.json())]);
  for(const [path,text] of Object.entries(sources)){py.FS.mkdirTree(path.slice(0,path.lastIndexOf('/')));py.FS.writeFile(path,text);}
  py.globals.set('PARAMETERS',JSON.stringify(data));
  await py.runPythonAsync("exec(open('/work/browser-entry.py').read())");
  progress('선택한 위치의 건물·도로·높이를 확인하고 있습니다…',12);
  await py.runPythonAsync('stage_base()');
  const root=py.runPython('str(root)');
  progress('건물 사이의 마당과 길을 나누고 있습니다…',30);
  await py.runPythonAsync("stage_scripts('build-parcels')");await prepareScene(py.FS,root,'profile',terrainText,bounds);
  progress('주차공간·담장·대문을 만들고 있습니다…',40);
  await py.runPythonAsync("stage_scripts('build-space-candidates,build-attached-structures,build-streetscape')");
  progress('도로 포장과 골목 설비를 만들고 있습니다…',54);
  await py.runPythonAsync("stage_scripts('build-road-context,build-utilities')");
  progress('상가와 소품의 위치를 맞추고 있습니다…',66);await prepareScene(py.FS,root,'placement',terrainText,bounds);
  progress('사람·나무·가로등을 배치하고 있습니다…',78);
  await py.runPythonAsync("stage_scripts('build-pedestrians,build-vegetation,build-streetlights')");
  progress('주변 산과 큰길을 만들고 있습니다…',90);
  await py.runPythonAsync("stage_scripts('build-environment')\nstage_finish()");
  const files={};function collect(dir,prefix=''){for(const name of py.FS.readdir(dir)){if(name==='.'||name==='..')continue;const path=dir+'/'+name,rel=prefix+name;if(rel==='environment/context')continue;if(py.FS.isDir(py.FS.stat(path).mode))collect(path,rel+'/');else files[rel]=py.FS.readFile(path);}}
  collect(root);const manifest=JSON.parse(new TextDecoder().decode(files['manifest.json']));
  postMessage({type:'complete',manifest,files},Object.values(files).map(bytes=>bytes.buffer));
 }catch(error){console.error(error);postMessage({type:'error',message:String(error.message||error).trim().split('\n').at(-1)});}
};
