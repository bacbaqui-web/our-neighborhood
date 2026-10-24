import * as T from 'three';

// World-space precipitation: depth-tested against the scene and stopped at roofs.
export function createPrecipitation(buildings, elevation, structures = []) {
  const group = new T.Group(); group.name = 'Weather'; group.userData.environmentOwned = true;
  const cells = new Map(), cellSize = 12;
  const inside = (x, z, ring) => {
    let result = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j];
      if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) result = !result;
    }
    return result;
  };
  const roofs = buildings.map(b => ({ points: b.points, holes: b.holePoints || [], top: b.top + .3 }));
  for (const s of structures) {
    if (!s.roofKind || s.roofKind === 'none' || !Number.isFinite(s.roofHeight)) continue;
    const points = [[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b]) => [s.x + s.ux*a*s.width/2 + s.nx*b*s.depth/2, s.z + s.uz*a*s.width/2 + s.nz*b*s.depth/2]);
    if (points.flat().every(Number.isFinite)) roofs.push({ points, holes: [], top: s.roofHeight + .4 });
  }
  for (const b of roofs) {
    const xs = b.points.map(p=>p[0]), zs = b.points.map(p=>p[1]);
    for (let x = Math.floor(Math.min(...xs)/cellSize); x <= Math.floor(Math.max(...xs)/cellSize); x++)
      for (let z = Math.floor(Math.min(...zs)/cellSize); z <= Math.floor(Math.max(...zs)/cellSize); z++) {
        const key = `${x},${z}`; if (!cells.has(key)) cells.set(key, []); cells.get(key).push(b);
      }
  }
  function surface(x,z) {
    let y = elevation(x,z);
    for (const b of cells.get(`${Math.floor(x/cellSize)},${Math.floor(z/cellSize)}`) || [])
      if (inside(x,z,b.points) && !b.holes.some(r=>inside(x,z,r))) y = Math.max(y,b.top);
    return y + .12;
  }
  let seed = 9217;
  function random() { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; }
  const common = { time: {value: 0}, tint: {value: new T.Color('#b6c4cc')}, opacity: {value: .35}, viewport: {value: 800} };
  function make(snow) {
    const count = snow ? 18000 : 24000, vertices = snow ? count : count*2;
    const positions = new Float32Array(vertices*3), phases = new Float32Array(vertices), ends = new Float32Array(vertices);
    for (let i=0;i<count;i++) {
      const x=(random()-.5)*340, z=(random()-.5)*340, y=surface(x,z), phase=random();
      for (let j=0;j<(snow?1:2);j++) { const k=snow?i:i*2+j; positions.set([x,y,z],k*3); phases[k]=phase; ends[k]=j; }
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position',new T.BufferAttribute(positions,3));
    geometry.setAttribute('phase',new T.BufferAttribute(phases,1));
    geometry.setAttribute('end',new T.BufferAttribute(ends,1));
    const uniforms = {...common, snow: {value: snow?1:0}};
    const material = new T.ShaderMaterial({ uniforms, transparent:true, depthWrite:false, depthTest:true,
      vertexShader:`attribute float phase,end; uniform float time,snow,viewport; varying float vAlpha;
        void main(){
          float fall=fract(phase-time*mix(.38,.055,snow));
          vec3 p=position; p.y+=fall*42.+end*.72;
          vec4 mv=modelViewMatrix*vec4(p,1.);
          gl_Position=projectionMatrix*mv;
          gl_PointSize=clamp(viewport*.13/max(1.,-mv.z),1.25,5.);
          vAlpha=smoothstep(0.,.05,fall)*(1.-smoothstep(.85,1.,fall));
        }`,
      fragmentShader:`uniform vec3 tint; uniform float opacity,snow; varying float vAlpha;
        void main(){
          float a=opacity*vAlpha;
          ${snow?'float r=length(gl_PointCoord-.5);a*=1.-smoothstep(.25,.5,r);if(a<.01)discard;':''}
          gl_FragColor=vec4(tint,a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    });
    const object = snow ? new T.Points(geometry,material) : new T.LineSegments(geometry,material);
    object.name=snow?'Snow':'Rain'; object.userData.environmentOwned=true; object.frustumCulled=false; object.visible=false;
    group.add(object); return object;
  }
  const rain=make(false), snow=make(true);
  let active=false, last=0, elapsed=0;
  function set(weather,profile,style) {
    rain.visible=weather==='rain'; snow.visible=weather==='snow'; active=rain.visible||snow.visible;
    const painted=style==='color';
    common.tint.value.set(painted?(snow.visible?'#e5edf3':'#b0c0cf'):(style==='line'?'#637078':'#89969e'));
    common.tint.value.multiplyScalar(1-profile.night*.48);
    common.opacity.value=snow.visible?.85:.43;
    group.visible=active;
  }
  function update(now,motion,viewportHeight) {
    common.viewport.value=viewportHeight;
    const dt=Math.min(Math.max(0,now-last),100); last=now;
    if (!active || !motion) return false;
    elapsed+=dt/1000; common.time.value=elapsed;
    return true;
  }
  return {group,set,update,get active(){return active;}};
}
