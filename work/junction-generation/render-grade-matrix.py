import sys
sys.path.insert(0,'work')
from junction_generation import plan_junctions,parts
from shapely.geometry import LineString,mapping,shape
from shapely.ops import unary_union
from PIL import Image,ImageDraw
im=Image.new('RGB',(1000,1370),'#edf0f2');d=ImageDraw.Draw(im);d.text((20,12),'Generated junction geometry: 10 grade pairs (synthetic tests, not surveyed streets)',fill='#14272e')
pairs=[(a,b) for a in range(1,5) for b in range(a,5)]
for i,(a,b) in enumerate(pairs):
 x0=(i%2)*500;y0=45+(i//2)*260;scale=2.25
 rs=[]
 for pts,g in [([[-50,0],[50,0]],a),([[0,0],[0,50]],b)]:
  rs.append({'geometry':mapping(LineString(pts)),'grade':g,'width':{1:5.2,2:7.1,3:13.5,4:19.9}[g],'sidewalkEachSide':{1:0,2:1.5,3:3,4:4}[g],'properties':{'class':'minor'}})
 road=unary_union([shape(r['geometry']).buffer(r['width']/2,cap_style=2) for r in rs]);pub=unary_union([shape(r['geometry']).buffer(r['width']/2+r['sidewalkEachSide'],cap_style=2) for r in rs]);p=plan_junctions(rs,road,pub.difference(road),lambda x,z:0)
 def draw(g,c):
  for poly in parts(g,'Polygon'):
   d.polygon([(x0+250+x*scale,y0+65+z*scale) for x,z in poly.exterior.coords],fill=c)
   for ring in poly.interiors:d.polygon([(x0+250+x*scale,y0+65+z*scale) for x,z in ring.coords],fill='#edf0f2')
 draw(pub,'#c5c8bf');draw(shape(p['road']),'#535c63')
 for r in p['ramps']:draw(shape(r['footprint']),'#c2b761')
 draw(shape(p['marks']['white']),'#ffffff');draw(shape(p['marks']['yellow']),'#edc84a')
 d.text((x0+20,y0+10),f'Grade {a} + {b} | crossings {len(p["crossings"])}',fill='#14272e')
 d.line((x0+10,y0+245,x0+490,y0+245),fill='#aeb7bb')
im.save('verification/junction-generation/grade-pairs.png')
print('Saved geometry matrix, 10 production-plan cases.')
