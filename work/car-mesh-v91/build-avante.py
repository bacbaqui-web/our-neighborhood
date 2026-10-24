"""CN7-inspired editable mesh. Metres; Blender X=width, Y=front, Z=up.

All visible colour comes from constant materials. No image maps, projected
photos, camera-facing geometry or view-dependent transforms are used.
"""
import bpy, math, json, bmesh
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import tessellate_polygon

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'outputs/domestic-test/cars/avante-cn7-mesh-v91'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, roughness=.78, metal=0):
    # Hex palette is authored in sRGB, Blender node values are linear.
    rgb=[int(color[i:i+2],16)/255 for i in (1,3,5)]
    rgb=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
    m=bpy.data.materials.new(name); m.diffuse_color=(*rgb,1); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*rgb,1)
    bs.inputs['Roughness'].default_value=roughness
    bs.inputs['Metallic'].default_value=metal
    bs.inputs['Specular IOR Level'].default_value=.18
    return m

paint=material('Paint | ceramic white','#e5e9e7')
glass=material('Glass | solid slate blue','#304753',.62)
trim=material('Trim | graphite','#242c30')
rubber=material('Tires | charcoal','#303437',.95)
silver=material('Wheels | satin silver','#b4bfc3',.67,.15)
rimdark=material('Wheels | inner graphite','#40494e')
brake=material('Brakes | grey','#6f7c81')
red=material('Tail lamps | red','#b72535',.68)
redbright=material('Tail lamps | light red','#ef5155',.6)
lamp=material('Headlamps | pale ice','#c3e2ea',.6)
plate=material('Number plates | blank ivory','#e8eee9')
seam=material('Panel gaps | soft grey','#647077')

def mesh(name,verts,faces,mat,smooth=True):
    me=bpy.data.meshes.new(name); me.from_pydata(verts,[],faces); me.update()
    ob=bpy.data.objects.new(name,me); bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat)
    bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free()
    for p in me.polygons:p.use_smooth=smooth
    return ob

def bevel(ob,width=.015,segments=2):
    mod=ob.modifiers.new('Small formed edge','BEVEL');mod.width=width;mod.segments=segments
    mod=ob.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL');mod.keep_sharp=True
    return ob

def box(name,pos,size,mat,rounding=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos)
    ob=bpy.context.object;ob.name=name;ob.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    ob.data.materials.append(mat)
    
    return ob

def simplify_line(points, tolerance=.006):
    if len(points)<3:return points
    a,b=points[0],points[-1];direction=b-a
    distances=[]
    for p in points[1:-1]:
        t=max(0,min(1,(p-a).dot(direction)/max(1e-12,direction.length_squared)))
        distances.append((p-a-direction*t).length)
    if not distances or max(distances)<=tolerance:return [a,b]
    i=distances.index(max(distances))+1
    return simplify_line(points[:i+1],tolerance)[:-1]+simplify_line(points[i:],tolerance)

def curve(name,points,radius,mat,closed=False):
    # Thin trim is an actual ribbon mesh; no round tubes and no bitmap decal.
    if any(key in name for key in ['formed arch lip','Grille jewel upper edge','Slanted badge stroke','Oval metal badge','parametric crease','window sill','fuel door','Rear signature light']):return None
    if name.startswith('Left'):normal=Vector((-1,0,0))
    elif name.startswith('Right'):normal=Vector((1,0,0))
    elif 'Rear signature' in name or 'Trunk lid lower' in name:normal=Vector((0,-1,0))
    elif 'Grille' in name:normal=Vector((0,1,0))
    else:normal=Vector((0,0,1))
    pts=simplify_line([Vector(p) for p in points],.008)
    if closed:pts.append(pts[0])
    vs=[];fs=[]
    for a,b in zip(pts,pts[1:]):
        direction=(b-a).normalized();side=normal.cross(direction).normalized()*radius
        j=len(vs);vs.extend([a-side+normal*.005,b-side+normal*.005,b+side+normal*.005,a+side+normal*.005]);fs.append((j,j+1,j+2,j+3))
    ob=mesh(name,vs,fs,mat,False)
    for f in ob.data.polygons:
        if f.normal.dot(normal)<0:f.flip()
    return ob

def cylinder(name,pos,radius,depth,mat,segments=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=segments,radius=radius,depth=depth,location=pos,rotation=(0,math.pi/2,0))
    ob=bpy.context.object;ob.name=name;ob.data.materials.append(mat)
    for p in ob.data.polygons:p.use_smooth=len(p.vertices)==4
    return ob

def lerp_profile(stations,y):
    for i in range(len(stations)-1):
        a,b=stations[i:i+2]
        if a[0]<=y<=b[0]+1e-6:
            t=(y-a[0])/(b[0]-a[0]);t=max(0,min(1,t))
            return [a[k]*(1-t)+b[k]*t for k in range(1,len(a))]
    return list(stations[0 if y<stations[0][0] else -1][1:])

# Shoulder, hood and trunk form one watertight shell, with real wheel openings.
stations=[(-2.355,.805,1.025),(-2.29,.856,1.047),(-2.12,.883,1.045),(-1.80,.903,1.027),
          (-1.36,.9125,1.015),(-.65,.903,.993),(0,.895,.978),(.68,.902,.955),
          (1.02,.905,.947),(1.36,.9125,.897),(1.80,.893,.817),(2.10,.872,.757),(2.28,.846,.704),(2.355,.805,.684)]
ys=sorted(set([a[0] for a in stations]+[-2.355+i*4.71/100 for i in range(101)]))
verts=[];rings=[]
for y in ys:
    w,deck=lerp_profile(stations,y)
    fold=lerp_profile([(-2.355,.68),(-1.20,.83),(-.30,.53),(.86,.79),(2.355,.49)],y)[0]
    fold=min(deck-.12,max(.40,fold))
    sculpt=max(0,1-abs((y+.20)/1.20))
    bottom=lerp_profile([(-2.355,.395),(-2.17,.29),(-1.84,.215),(-1.05,.175),
                         (.80,.175),(1.84,.205),(2.355,.265)],y)[0]
    corner_lift=.075*max(0,min(1,(y-1.70)/.50))
    half=[(0,deck+.013),(.52*w,deck+.006+corner_lift*.25),(.83*w,deck-.008+corner_lift*.8),(.965*w,deck-.045+corner_lift),
          (w,deck-.085+corner_lift),(w-.016*sculpt,fold+.024),(w,fold),
          (w-.035*sculpt,fold-.038),(w*.965,bottom+.095),
          (w*.95,bottom+.054),(w*.84,bottom),(0,bottom)]
    cross=half+ [(-x,z) for x,z in half[-2:0:-1]]
    ring=[]
    for x,z in cross:
        bend=.11*(abs(x)/.913)**3
        nose_under=max(0,.43-z)*.24
        rear_under=max(0,.70-z)*.32
        yy=y-(max(0,(y-1.8)/.555)*(bend+nose_under) if y>1.8 else 0)+(max(0,(-y-1.9)/.455)*(bend+rear_under) if y< -1.9 else 0)
        ring.append(len(verts));verts.append((x,yy,z))
    rings.append(ring)
faces=[tuple(reversed(rings[0])),tuple(rings[-1])]
for a,b in zip(rings,rings[1:]):
    for j in range(len(a)):faces.append((a[j],a[(j+1)%len(a)],b[(j+1)%len(a)],b[j]))
body=mesh('Body shell - formed fenders',verts,faces,paint)
for axle in [-1.36,1.36]:
    cutter=cylinder('Arch cutter',(0,axle,.319),.359,2.4,trim,32)
    mod=body.modifiers.new('Open wheel arch','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
    bpy.context.view_layer.objects.active=body;bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)

# Cabin roof is gently crowned. Side glass is projected onto this exact surface.
cabin_stations=[(-1.96,1.052,.790),(-1.80,1.093,.765),(-1.58,1.162,.734),
                (-1.30,1.259,.700),(-1.02,1.352,.673),(-.75,1.404,.665),
                (-.45,1.420,.665),(-.12,1.412,.670),(.16,1.373,.682),
                (.40,1.294,.708),(.65,1.164,.751),(.87,1.031,.793),(1.045,.948,.813)]
cys=[a[0] for a in cabin_stations]
verts=[];rings=[]
for y in cys:
    h,w=lerp_profile(cabin_stations,y)
    belt=lerp_profile(stations,y)[1]-.065;bw=.865
    cross=[(0,h),(.83*w,h-.015),(w,h-.037),(bw,belt),(-bw,belt),(-w,h-.037),(-.83*w,h-.015)]
    ring=[]
    for x,z in cross:ring.append(len(verts));verts.append((x,y,z))
    rings.append(ring)
faces=[tuple(reversed(rings[0])),tuple(rings[-1])]
for a,b in zip(rings,rings[1:]):
    for j in range(len(a)):faces.append((a[j],a[(j+1)%len(a)],b[(j+1)%len(a)],b[j]))
cabin=mesh('Cabin - roof and pillars',verts,faces,paint)

def bvh(ob):
    # Freeze triangulation before projecting trim onto the shell. Otherwise
    # Blender's GLB exporter may split a curved end-cap ngon differently from
    # the BVH, leaving a formerly flush grille underneath the exported bumper.
    bm=bmesh.new();bm.from_mesh(ob.data)
    bmesh.ops.triangulate(bm,faces=list(bm.faces))
    bm.to_mesh(ob.data);bm.free()
    return BVHTree.FromPolygons([v.co.copy() for v in ob.data.vertices],[list(p.vertices) for p in ob.data.polygons])
def reduce_shell(ob,budget):
    bm=bmesh.new();bm.from_mesh(ob.data)
    bmesh.ops.dissolve_limit(bm,angle_limit=.006,verts=list(bm.verts),edges=list(bm.edges),use_dissolve_boundaries=False,delimit={'MATERIAL'})
    bmesh.ops.triangulate(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free()
    count=len(ob.data.polygons)
    if count>budget:
        mod=ob.modifiers.new('Silhouette budget','DECIMATE');mod.decimate_type='COLLAPSE';mod.ratio=budget/count
        mod.use_symmetry=True;mod.symmetry_axis='X';mod.use_collapse_triangulate=True
        bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=mod.name)
# Retain smooth normals from the uncollapsed shell without adding geometry.
body_reference=body.copy();body_reference.data=body.data.copy();body_reference.name='Normal transfer reference'
bpy.context.collection.objects.link(body_reference);body_reference.hide_render=True
reduce_shell(body,440)
# Boolean cutter material must not expand into visible fender faces on collapse.
for face in body.data.polygons:face.material_index=0
body_bvh=bvh(body); cabin_bvh=bvh(cabin)

def project(uv,axis,sign=1,offset=.008,trees=None):
    trees=trees or [body_bvh,cabin_bvh]
    if axis=='side':start=Vector((sign*3,uv[0],uv[1]));direction=Vector((-sign,0,0))
    elif axis=='front':start=Vector((uv[0],sign*4,uv[1]));direction=Vector((0,-sign,0))
    else:start=Vector((uv[0],uv[1],4));direction=Vector((0,0,-1))
    hits=[]
    for tree in trees:
        hit,normal,face,dist=tree.ray_cast(start,direction)
        if hit is not None:hits.append((dist,hit))
    if not hits:raise RuntimeError(f'Panel outside shell: {axis} {sign} {uv}')
    hit=min(hits,key=lambda h:h[0])[1]
    return tuple(hit-direction*offset)

def panel(name,uvs,mat,axis,sign=1,offset=.008,subdivision=2,trees=None):
    if name in ['Windshield gasket','Rear glass gasket']:return None
    offset += .017 if axis=='top' else .010 if axis=='side' else .015
    if name=='Outer triangular air intake':offset+=.020
    # Keep polygon outlines, triangulate the interior once. Large glass and
    # fascia use one split; the tiny facets need no internal subdivision.
    span=max(p[0] for p in uvs)-min(p[0] for p in uvs)
    subdivision=1 if (span>.40 and 'plate' not in name) or name in ['Swept headlamp housing','Outer triangular air intake','Tail lamp side return','Tail lamp side red'] else 0
    triangles=[tuple(uvs[p] if isinstance(p,int) else (p.x,p.y) for p in triangle) for triangle in tessellate_polygon([[Vector((u,v,0)) for u,v in uvs]])]
    for _ in range(subdivision):
        new=[]
        for a,b,c in triangles:
            ab=tuple((a[k]+b[k])*.5 for k in [0,1]);bc=tuple((b[k]+c[k])*.5 for k in [0,1]);ca=tuple((c[k]+a[k])*.5 for k in [0,1])
            new.extend([(a,ab,ca),(ab,b,bc),(ca,bc,c),(ab,bc,ca)])
        triangles=new
    vs=[];fs=[]
    for triangle in triangles:
        fs.append(tuple(range(len(vs),len(vs)+3)))
        vs.extend(project(p,axis,sign,offset,trees) for p in triangle)
    ob=mesh(name,vs,fs,mat)
    # These open surfaces need a consistent outward normal, not a closed-volume heuristic.
    outward=Vector((sign,0,0)) if axis=='side' else Vector((0,sign,0)) if axis=='front' else Vector((0,0,1))
    bm=bmesh.new();bm.from_mesh(ob.data)
    for f in bm.faces:
        if f.normal.dot(outward)<0:f.normal_flip()
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
    bm.normal_update()
    bm.to_mesh(ob.data);bm.free()
    ob['projection_axis']=axis;ob['projection_sign']=sign;ob['projection_offset']=offset
    return ob

def inset(poly,amount):
    center=[sum(p[k] for p in poly)/len(poly) for k in [0,1]]
    return [tuple(center[k]+(p[k]-center[k])*(1-amount) for k in [0,1]) for p in poly]

front_glass=[(-.770,.938),(.770,.938),(.642,.238),(.48,.198),(-.48,.198),(-.642,.238)]
rear_glass=[(-.622,-.918),(.622,-.918),(.730,-1.766),(-.730,-1.766)]
for name,poly in [('Windshield',front_glass),('Rear glass',rear_glass)]:
    panel(name+' gasket',poly,trim,'top',offset=.006,subdivision=3,trees=[cabin_bvh])
    panel(name,inset(poly,.055),glass,'top',offset=.010,subdivision=3,trees=[cabin_bvh])

for s in [-1,1]:
    side='Left' if s<0 else 'Right'
    window=[(.890,.963),(.334,1.279),(.101,1.319),(-.292,1.343),
            (-.691,1.322),(-1.008,1.254),(-1.657,1.030),(-.90,.996),(-.12,.979)]
    panel(side+' window surround',window,trim,'side',s,.007,3,[cabin_bvh])
    fg=[(.802,.983),(.308,1.261),(.087,1.300),(-.220,1.320),(-.267,.996)]
    rg=[(-.334,.998),(-.288,1.321),(-.675,1.300),(-.987,1.233),(-1.225,1.137),(-1.245,1.026)]
    qg=[(-1.302,1.028),(-1.284,1.111),(-1.538,1.041)]
    for name,poly in [('front door glass',fg),('rear door glass',rg),('quarter glass',qg)]:
        panel(side+' '+name,poly,glass,'side',s,.012,3,[cabin_bvh])
    # Slim visible window sill and panel gaps, following the actual body surface.
    def side_line(name,points,r=.0028,mat=seam):
        dense=[]
        for a,b in zip(points,points[1:]):
            for i in range(10):dense.append(tuple(a[k]+(b[k]-a[k])*i/10 for k in [0,1]))
        dense.append(points[-1]);return curve(side+' '+name,[project(p,'side',s,.005) for p in dense],r,mat)
    side_line('front door seam',[(.88,.952),(.98,.79),(.91,.55),(.79,.27),(.70,.238),(-.27,.238),(-.32,.31),(-.30,.977)],.0026)
    side_line('rear door seam',[(-.30,.977),(-.32,.31),(-.38,.238),(-.95,.238),(-.99,.535),(-1.17,.76),(-1.65,1.012)],.0026)
    side_line('lower sill',[(-.96,.224),(.83,.224)],.009,trim)
    side_line('window sill',[(.86,.957),(-.12,.973),(-.90,.990),(-1.62,1.020)],.0048,silver)
    # Subtle geometric CN7 diagonal door crease, not photographic shading.
    side_line('parametric crease',[(.86,.79),(-.30,.53),(-1.20,.83)],.002,paint)
    for y,z in [(-.05,.874),(-1.04,.906)]:
        pos=project((y,z),'side',s,.014)

        box(side+' door handle',(pos[0]+s*.014,pos[1],pos[2]+.009),(.025,.174,.027),paint,.01)
    mirrorbase=project((.72,.97),'side',s,.025)
    box(side+' mirror arm',(mirrorbase[0]+s*.043,.72,.990),(.16,.065,.038),trim,.018)
    ob=box(side+' mirror housing',(s*.978,.742,1.016),(.23,.225,.103),paint,.035)
    mesh(side+' mirror glass',[(s*.89,.626,.986),(s*1.075,.626,.986),(s*1.075,.626,1.05),(s*.89,.626,1.05)],[(0,1,2,3) if s>0 else (3,2,1,0)],glass,False)
    curve(side+' mirror indicator',[(s*.89,.854,1.012),(s*1.042,.826,1.012)],.004,lamp)
    if s==1:
        poly=[(-1.76,.76),(-1.60,.76),(-1.60,.60),(-1.76,.60),(-1.76,.76)]
        side_line('fuel door',poly,.002)

# The original CN7 has a broad jewel grille, swept lamp housings and an H tail.
# These are separate constant-colour surfaces, all fitted to the metal shell.
grille=[(-.59,.660),(.59,.660),(.746,.568),(.641,.389),(-.641,.389),(-.746,.568)]
panel('Front grille recess',grille,trim,'front',offset=.017,subdivision=4)
for row in range(3):
    z=.423+row*.070
    for col in range(9):
        x=(col-4)*.145+(row%2)*.022
        if abs(x)>.63:continue
        diamond=[(x-.054,z),(x,z+.034),(x+.054,z),(x,z-.034)]
        panel('Grille jewel facet',diamond,rimdark,'front',offset=.023,subdivision=1)
        curve('Grille jewel upper edge',[project(p,'front',offset=.025) for p in diamond[:3]],.003,seam)
panel('Front lower intake',[(-.64,.342),(.64,.342),(.60,.285),(-.60,.285)],trim,'front',offset=.013,subdivision=3)
for s in [-1,1]:
    poly=[(s*.480,.660),(s*.640,.704),(s*.811,.728),(s*.835,.651),(s*.708,.615),(s*.548,.628)]
    panel('Swept headlamp housing',poly,trim,'front',offset=.012,subdivision=4)
    led=[(s*.495,.658),(s*.642,.694),(s*.804,.715),(s*.802,.700),(s*.643,.679),(s*.511,.645)]
    panel('Headlamp upper light blade',led,lamp,'front',offset=.020,subdivision=3)
    for x,z in [(.619,.649),(.702,.659),(.776,.672)]:
        poly=[(s*(x-.025),z+.012),(s*(x+.025),z+.016),(s*(x+.025),z-.008),(s*(x-.025),z-.013)]
        panel('Headlamp projector',poly,silver,'front',offset=.019,subdivision=2)
    # Wrapped corners make both lamps readable from a true side view.
    panel('Headlamp side return',[(2.260,.704),(2.140,.732),(2.080,.737),(2.190,.678),(2.240,.655)],trim,'side',s,.009,3,[body_bvh])
    panel('Headlamp side light',[(2.245,.709),(2.141,.724),(2.105,.731),(2.154,.712)],lamp,'side',s,.014,2,[body_bvh])
    poly=[(s*.685,.499),(s*.803,.585),(s*.826,.358),(s*.717,.312)]
    panel('Outer triangular air intake',poly,trim,'front',offset=.012,subdivision=3)
    tail=[(s*.15,.946),(s*.69,.997),(s*.825,.953),(s*.795,.812),(s*.711,.840),(s*.663,.916),(s*.15,.917)]
    panel('Rear lamp black border',tail,trim,'front',-1,.008,3)
    panel('Rear lamp red lens',inset(tail,.14),red,'front',-1,.013,3)
    curve('Rear signature light',[project((s*x,z),'front',-1,.018) for x,z in [(.17,.935),(.48,.953),(.68,.972),(.79,.935)]],.008,redbright)
    side_tail=[(-2.273,.969),(-1.886,.995),(-2.016,.906),(-2.248,.808)]
    panel('Tail lamp side return',side_tail,trim,'side',s,.008,3,[body_bvh])
    panel('Tail lamp side red',inset(side_tail,.13),red,'side',s,.014,3,[body_bvh])
    panel('Rear reflector',[(s*.60,.460),(s*.77,.479),(s*.75,.505),(s*.62,.491)],red,'front',-1,.020)
panel('Rear connected lamp bar',[(-.65,.959),(.65,.959),(.65,.925),(-.65,.925)],red,'front',-1,.014,3)
panel('Rear bumper lower inset',[(-.73,.640),(.73,.640),(.71,.439),(.64,.412),(-.64,.412),(-.71,.439)],trim,'front',-1,.012,3)
for s in [-1,1]:
    poly=[(-.255,.547),(.255,.547),(.255,.439),(-.255,.439)]
    if s==-1:poly=[(x,z+.040) for x,z in poly]
    panel(('Front' if s==1 else 'Rear')+' plate frame',poly,trim,'front',s,.027,2)
    panel(('Front' if s==1 else 'Rear')+' blank plate',inset(poly,.08),plate,'front',s,.033,2)
# Trunk shut line and badges use small editable metal curves, not a texture.
points=[(-.63,.925),(-.60,.806),(-.52,.713),(-.44,.696),(.44,.696),(.52,.713),(.60,.806),(.63,.925)]
dense=[]
for a,b in zip(points,points[1:]):
    for i in range(12):dense.append(tuple(a[k]+(b[k]-a[k])*i/12 for k in [0,1]))
dense.append(points[-1])
curve('Trunk lid lower seam',[project(p,'front',-1,.008) for p in dense],.003,seam)
for axis,center,sign in [('top',(0,2.22),1),('top',(0,-2.235),1)]:
    rx,ry=.068,.042
    pts=[(center[0]+math.cos(i*math.tau/40)*rx,center[1]+math.sin(i*math.tau/40)*ry) for i in range(40)]
    curve('Oval metal badge',[project(p,axis,sign,.012,trees=[body_bvh]) for p in pts],.0045,silver,True)
    for segment in [[(-.036,-.023),(-.019,.023)],[(.017,-.023),(.034,.023)],[(-.025,0),(.026,0)]]:
        curve('Slanted badge stroke',[project((center[0]+x,center[1]+y),axis,sign,.014,trees=[body_bvh]) for x,y in segment],.005,silver)
# Hood and trunk shut lines are genuinely placed on their respective panels.
for s in [-1,1]:
    points=[(s*.57,2.17),(s*.64,1.98),(s*.69,1.55),(s*.72,1.18),(s*.77,1.04)]
    sampled=[]
    for a,b in zip(points,points[1:]):
        for i in range(16):sampled.append(tuple(a[k]+(b[k]-a[k])*i/16 for k in [0,1]))
    sampled.append(points[-1])
    curve('Hood shut line',[project(p,'top',offset=.007,trees=[body_bvh]) for p in sampled],.0025,seam)
curve('Trunk shut line',[project((x,-2.12),'top',offset=.004,trees=[body_bvh]) for x in [-.64+i*.08 for i in range(17)]],.0025,seam)

def lathe_x(name,x,y,z,profile,mat,segments=64):
    vs=[];fs=[]
    for axial,r in profile:
        for i in range(segments):
            a=2*math.pi*i/segments;vs.append((x+axial,y+math.cos(a)*r,z+math.sin(a)*r))
    for j in range(len(profile)-1):
        for i in range(segments):
            a=j*segments+i;b=j*segments+(i+1)%segments
            fs.append((a,b,b+segments,a+segments))
    return mesh(name,vs,fs,mat)

for s in [-1,1]:
    for axle,label in [(1.36,'front'),(-1.36,'rear')]:
        x=s*.8025;z=.319;prefix=('Left' if s<0 else 'Right')+' '+label
        segments=16
        tire=lathe_x(prefix+' tire',x,axle,z,[(-.111,.275),(-.070,.319),(.070,.319),(.111,.275)],rubber,segments)
        # Solid side walls cap the short tire barrel, retaining ground contact.
        bm=bmesh.new();bm.from_mesh(tire.data)
        boundary=[e for e in bm.edges if e.is_boundary]
        bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(tire.data);bm.free()
        tire['wheel_contact']=[x,axle,0];tire['axle']=label
        def disc(name,radius,depth,mat,segments=16):
            vs=[(x+s*depth,axle+math.cos(i*math.tau/segments)*radius,z+math.sin(i*math.tau/segments)*radius) for i in range(segments)]
            ob=mesh(prefix+' '+name,vs,[tuple(range(segments))],mat,False)
            for f in ob.data.polygons:
                if f.normal.x*s<0:f.flip()
            return ob
        disc('rim',.219,.114,silver)
        disc('rim inner',.196,.116,rimdark)
        for n in range(5):
            a=n*math.tau/5
            poly=[(.048,a-.23),(.198,a-.07),(.198,a+.07),(.048,a+.23)]
            vs=[(x+s*.119,axle+math.cos(angle)*r,z+math.sin(angle)*r) for r,angle in poly]
            ob=mesh(prefix+' spoke',vs,[(0,1,2,3)],silver,False)
            for f in ob.data.polygons:
                if f.normal.x*s<0:f.flip()
        disc('hub',.060,.121,silver,8)

# Small roof antenna is a solid low wedge.
mesh('Shark fin',[(0,-.66,1.410),(-.030,-.88,1.382),(.030,-.88,1.382),(0,-.81,1.465)],[(0,1,2),(0,3,1),(0,2,3),(1,3,2)],paint)

# Grouping and neutral editable source. The exporter evaluates all modifiers.
asset=bpy.data.objects.new('AVANTE_CN7_SOLID_MESH',None);bpy.context.collection.objects.link(asset)
for ob in list(bpy.context.scene.objects):
    if ob!=asset:ob.parent=asset
asset['dimensions_m']=[1.825,4.71,1.42]
asset['wheelbase_m']=2.72
asset['style']='Low polygon mesh; constant colour materials; no image textures'
asset['reference']='https://www.hyundai.com/worldwide/en/cars/elantra-2023/design'
scene=bpy.context.scene
scene.world.color=(.8,.8,.8)

bpy.ops.object.select_all(action='SELECT')
# Keep curves/modifiers in the .blend, but clean their evaluated mesh in GLB.
bpy.context.view_layer.objects.active=body
bpy.ops.object.convert(target='MESH')
for ob in bpy.context.selected_objects:
    if ob.type!='MESH':continue
    bm=bmesh.new();bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-7)
    bmesh.ops.triangulate(bm,faces=list(bm.faces))
    collapsed=[f for f in bm.faces if f.calc_area()<1e-8]
    if collapsed:bmesh.ops.delete(bm,geom=collapsed,context='FACES_ONLY')
    bm.normal_update();bm.to_mesh(ob.data);bm.free()
# Reuse high-resolution shading normals on the low-resolution body only.
bpy.context.view_layer.objects.active=body
mod=body.modifiers.new('Smooth normals from original shell','DATA_TRANSFER')
mod.object=body_reference;mod.use_loop_data=True;mod.data_types_loops={'CUSTOM_NORMAL'};mod.loop_mapping='POLYINTERP_NEAREST'
bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.data.objects.remove(body_reference,do_unlink=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'avante-cn7.blend'))
# Validate the actual triangles before grouping; joining preserves geometry.
triangle_count=sum(len(o.data.polygons) for o in scene.objects if o.type=='MESH')
assert triangle_count<=2000, f'Triangle budget exceeded: {triangle_count}'
panel_checks=[]
for ob in list(scene.objects):
    if ob.type!='MESH' or 'projection_axis' not in ob:continue
    axis=ob['projection_axis'];sign=ob['projection_sign']
    outward=Vector((sign,0,0)) if axis=='side' else Vector((0,sign,0)) if axis=='front' else Vector((0,0,1))
    hidden=0;max_hidden=0
    for face in ob.data.polygons:
        center=sum((ob.data.vertices[i].co for i in face.vertices),Vector())/len(face.vertices)
        uv=(center.y,center.z) if axis=='side' else (center.x,center.z) if axis=='front' else (center.x,center.y)
        surface=Vector(project(uv,axis,sign,0))
        depth=(surface-center).dot(outward)
        if depth>.002:hidden+=1;max_hidden=max(max_hidden,depth)
    panel_checks.append({'name':ob.name,'triangles':len(ob.data.polygons),'hidden':hidden,'maxHidden':max_hidden})
(OUT/'panel-qa.json').write_text(json.dumps({'panels':len(panel_checks),'samples':sum(p['triangles'] for p in panel_checks),'problemPanels':[p for p in panel_checks if p['hidden']]},indent=2))
assert not any(p['hidden'] for p in panel_checks), 'Panel intersects body; inspect panel-qa.json'
# Preserve the separate editable parts in .blend; batch small details in GLB.
groups={}
for ob in list(scene.objects):
    if ob.type!='MESH' or ob in (body,cabin) or ob.name.endswith(' tire') or 'mirror housing' in ob.name or ob.name=='Shark fin':continue
    key=ob.data.materials[0].name
    groups.setdefault(key,[]).append(ob)
for key,objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for ob in objects:ob.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join()
    ob=bpy.context.object;ob.name='Details | '+key
    for prop in ['projection_axis','projection_sign','projection_offset']:
        if prop in ob:del ob[prop]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'avante-cn7.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_extras=True)
stats={'version':91,'triangles':triangle_count,'triangleBudget':2000,'objects':len(scene.objects),'materials':len(bpy.data.materials),'imageTextures':0,'proportionsNote':'Stylistic CN7 approximation, not a CAD measurement or homologation model','dimensionsMetres':{'length':4.71,'bodyWidth':1.825,'roofHeight':1.42,'wheelbase':2.72},'wheelContacts':[[s*.8025,a,0] for s in [-1,1] for a in [-1.36,1.36]],'reference':asset['reference']}
(OUT/'model-info.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2))
print('MODEL_READY',json.dumps(stats))
