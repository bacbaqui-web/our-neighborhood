"""Publish canonical shop guidance and existing reference metadata without a second editable copy."""
import json,re,sys
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'outputs/domestic-test/asset-encyclopedia'
class Images(HTMLParser):
 def __init__(self):super().__init__();self.images=[];self.links=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='img' and a.get('src'):self.images.append({'image':a['src'],'label':a.get('alt','참고 사진')})
  if tag=='a' and a.get('href','').startswith('https://'):self.links.append(a['href'])
s=(ROOT/'docs/project-guidelines.txt').read_text();start=s.index('가게 제작·조립 기준');end=s.index('\n자동차',start)
data={'source':'docs/project-guidelines.txt 7절','text':s[start:end].strip(),'references':{}}
for pack,folder in [('convenience-local','local-detail'),('pharmacy-local','pharmacy-local'),('bakery-local','bakery-local'),('bakery-blue','bakery-blue'),('salon-local','salon-local')]:
 p=Images();p.feed((BASE/f'categories/commerce/{folder}/index.html').read_text());base=f'categories/commerce/{folder}/'
 data['references'][pack]={'images':[{**x,'image':urljoin(base,x['image'])} for x in p.images],'sources':list(dict.fromkeys(p.links)),'comparison':base,'note':'기존 제작 페이지의 참고 자료입니다. 치수와 보이지 않는 내부는 사진 비례 추정·가상 구성입니다.'}
output=json.dumps(data,ensure_ascii=False,indent=2)+'\n';dest=BASE/'shop-guide.json'
if '--check' in sys.argv:
 assert dest.read_text()==output,'상가 지침 공개 발췌가 기준 문서와 다릅니다.'
 print('PASS canonical shop guide and reference extraction')
else:dest.write_text(output)
