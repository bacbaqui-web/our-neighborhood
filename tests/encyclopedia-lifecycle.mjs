import assert from 'node:assert/strict';
import * as T from 'three';
import {createPreviewEngine} from '../outputs/domestic-test/asset-encyclopedia/preview-engine.js';
import {createThumbnailQueue} from '../outputs/domestic-test/asset-encyclopedia/thumbnail-queue.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const observers=[],pending=new Map(),released=[],painted=[],shown=[];let engines=0,engineDisposes=0;
class Observer{constructor(callback){this.callback=callback;observers.push(this);}observe(){}unobserve(){}disconnect(){this.disconnected=true;}fire(host){this.callback([{target:host,isIntersecting:true}]);}}
const queue=createThumbnailQueue({Observer,createModel:a=>{const d=deferred();pending.set(a.id,d);return d.promise;},release:m=>released.push(m),createEngine:()=>{engines++;return {show:m=>shown.push(m),photo:()=>String(shown.at(-1)),dispose:()=>engineDisposes++};},imageThumb:async a=>a.id,paintImage:(h,src)=>painted.push([h,src]),unavailableArchive:()=>false,nextFrame:tick,warn:()=>{}});
const row=id=>[{id,kind:'model'},{}],a=row('a'),b=row('b'),c=row('c'),bad=row('bad'),good=row('good');
queue.observe([a]);observers.at(-1).fire(a[1]);const old=observers.at(-1);
queue.observe([b,c]);const fresh=observers.at(-1);fresh.fire(b[1]);fresh.fire(c[1]);old.fire(a[1]);
assert(old.disconnected);pending.get('a').resolve('old');await tick();assert.deepEqual(released,['old']);assert(!pending.has('c'));
pending.get('b').resolve('new');await tick();await tick();pending.get('c').resolve('third');await tick();await tick();
assert.equal(engines,1);assert.deepEqual(painted,[[b[1],'new'],[c[1],'third']]);
const cached=row('b');queue.observe([cached]);observers.at(-1).fire(cached[1]);await tick();assert.equal(painted.at(-1)[1],'new');
queue.observe([bad,good]);observers.at(-1).fire(bad[1]);observers.at(-1).fire(good[1]);await tick();pending.get('bad').reject(Error('failed'));await tick();await tick();assert.equal(bad[1].textContent,'미리보기 확인 필요');pending.get('good').resolve('recovered');await tick();await tick();
const late=row('late'),queued=row('queued');queue.observe([late,queued]);const last=observers.at(-1);last.fire(late[1]);last.fire(queued[1]);queue.dispose();queue.dispose();last.fire(queued[1]);pending.get('late').resolve('late');await tick();assert(released.includes('late'));assert(!pending.has('queued'));assert.equal(engineDisposes,1);
// Real Three scene, geometry, framing, counting and ownership; only GPU/browser boundaries stubbed.
let resize,control,draws=0,rendererDisposes=0,inkDisposes=0;const engineReleased=[];
class Resize{constructor(cb){resize=cb;}observe(){}disconnect(){this.disconnected=true;}}
class Controls extends EventTarget{constructor(){super();control=this;this.target=new T.Vector3();}update(){}dispose(){this.disposed=true;}}
const renderer={domElement:{remove(){},toDataURL:()=> 'photo'},setPixelRatio(){},setSize(){},render(){draws++;},dispose(){rendererDisposes++;},forceContextLoss(){}};
const engine=createPreviewEngine({clientWidth:400,clientHeight:300,append(){}},{createRenderer:()=>renderer,Controls,ResizeObserverClass:Resize,createInk:()=>({render:(s,c,draw)=>draw(),dispose:()=>inkDisposes++}),releaseModel:m=>engineReleased.push(m)});
const model=new T.Mesh(new T.BoxGeometry(2,4,6),new T.MeshBasicMaterial());const result=engine.show(model);assert.deepEqual(result.size.toArray(),[2,4,6]);assert.equal(result.triangles,12);assert.equal(engine.photo(),'photo');
resize();control.dispatchEvent(new Event('change'));const before=draws;engine.dispose();engine.dispose();resize();control.dispatchEvent(new Event('change'));engine.frame();assert.equal(draws,before);assert.equal(rendererDisposes,1);assert.equal(inkDisposes,1);assert.deepEqual(engineReleased,[model]);assert(control.disposed);
const loading=deferred();const lateShow=loading.promise.then(m=>engine.show(m));loading.resolve(new T.Group());await lateShow;assert.equal(engineReleased.length,2,'Closed engine releases late models');
console.log('Encyclopedia lifecycle: stale loads, cache, one queue/renderer, recovery and disposal passed');
