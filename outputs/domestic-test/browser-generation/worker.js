import {createMapCache} from './map-cache.js';
const mapCache=createMapCache();
import {prepareScene} from './prepare-scene.js?v=view3c';
const base=new URL('./',import.meta.url);
// Synchronous network access is restricted to this disposable background Worker.
self.browserRequest=url=>{
 const allowed=['https://portal.esrikr.com/','https://tiles.openfreemap.org/','https://s3.amazonaws.com/elevation-tiles-prod/'];
 if(!allowed.some(prefix=>url.startsWith(prefix)))throw Error('허용되지 않은 지도 자료 주소입니다.');
 if(mapCache.memory.has(url))return mapCache.memory.get(url);
 const xhr=new XMLHttpRequest();xhr.open('GET',url,false);xhr.responseType='arraybuffer';xhr.timeout=60000;xhr.send();
 if(xhr.status<200||xhr.status>=300)throw Error('지도 자료를 받지 못했습니다. 잠시 후 다시 시도해 주세요. ('+xhr.status+')');
 const bytes=new Uint8Array(xhr.response);mapCache.remember(url,bytes);return bytes;
};
let started=0;const timings=[];
const progress=(message,percent)=>{timings.push({message,percent,elapsedMs:Math.round(performance.now()-started)});postMessage({type:'progress',message,percent});};
self.onmessage=async({data})=>{
 started=performance.now();timings.length=0;
 try{
  progress('처음 실행에 필요한 파일을 받는 중입니다…',2);
  const {loadPyodide}=await import('https://cdn.jsdelivr.net/pyodide/v314.0.0/full/pyodide.mjs');
  const py=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v314.0.0/full/'});
  await py.loadPackage(['numpy','scipy','scikit-image','shapely','pillow','pyclipper','protobuf','micropip']);
  await py.runPythonAsync("import micropip\nawait micropip.install('mapbox-vector-tile==2.2.0',deps=False)");
  const [sources,terrainText,bounds]=await Promise.all([fetch(new URL('sources.json?v=unified11',base),{cache:'no-cache'}).then(r=>r.json()),fetch(new URL('terrain-source.txt',base)).then(r=>r.text()),fetch(new URL('vehicle-bounds.json',base)).then(r=>r.json())]);
  for(const [path,text] of Object.entries(sources)){py.FS.mkdirTree(path.slice(0,path.lastIndexOf('/')));py.FS.writeFile(path,text);}
  py.globals.set('PARAMETERS',JSON.stringify(data));
  await py.runPythonAsync("exec(open('/work/browser-entry.py').read())");
  progress('길 위에 위치를 맞추고 360도로 보이는 건물을 확인합니다…',12);
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
  progress('멀리 보이는 산을 만들고 있습니다…',90);
  await mapCache.prefetch(JSON.parse(py.runPython('context_request_urls()')));
  await py.runPythonAsync("stage_scripts('build-environment')\nstage_finish()");
  progress('집의 땅과 출입구·담장·주차 배치를 맞추고 있습니다…',94);
  await py.runPythonAsync('stage_site_layout()');
  const files={};function collect(dir,prefix=''){for(const name of py.FS.readdir(dir)){if(name==='.'||name==='..')continue;const path=dir+'/'+name,rel=prefix+name;if(rel==='environment/context')continue;if(py.FS.isDir(py.FS.stat(path).mode))collect(path,rel+'/');else files[rel]=py.FS.readFile(path);}}
  collect(root);const manifest=JSON.parse(new TextDecoder().decode(files['manifest.json']));
  await mapCache.flush();
  manifest.mapCacheStats=mapCache.stats;
  manifest.generationTimings=timings;manifest.generationMilliseconds=Math.round(performance.now()-started);
  postMessage({type:'complete',manifest,files},Object.values(files).map(bytes=>bytes.buffer));
 }catch(error){console.error(error);postMessage({type:'error',message:String(error.message||error).trim().split('\n').at(-1),detail:String(error.message||error),stage:timings.at(-1)?.message});}
};
