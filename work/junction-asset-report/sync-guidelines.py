"""Publish a read-only excerpt from the sole canonical guideline document."""
import hashlib,json,sys
from pathlib import Path
root=Path(__file__).resolve().parent
canonical=root.parents[1]/'docs/project-guidelines.txt'
text=canonical.read_text()
start='교차로 지침 — 관찰 근거·제작·배치·검수'
section=text[text.index(start):text.index('\n10. 성능과 배포')].strip()
grades=text[text.index('도로 분류\n'):text.index('\n생성 순서와 도로 연결')].strip()
excerpt=grades+'\n\n'+section+'\n'
sections=[]
for line in section.splitlines()[1:]:
 if line.startswith('J') and '. ' in line:
  sections.append({'title':line,'paragraphs':[]})
 elif line.startswith('- '):sections[-1]['paragraphs'].append(line[2:])
assert len(sections)==11 and all(s['paragraphs'] for s in sections)
data={'title':section.splitlines()[0],'canonical':'docs/project-guidelines.txt','sourceSha256':hashlib.sha256(excerpt.encode()).hexdigest(),'grades':[l[2:] for l in grades.splitlines() if l.startswith('- ')],'sections':sections}
files={root/'src/guidelines.json':json.dumps(data,ensure_ascii=False,indent=2)+'\n',root/'public/guidelines.txt':excerpt}
for path,content in files.items():
 if '--check' in sys.argv:
  if not path.exists() or path.read_text()!=content:raise SystemExit(f'Guideline excerpt is stale: {path.name}')
 else:path.write_text(content)
print('Canonical guideline excerpt matches: 11 sections, '+str(sum(len(s['paragraphs']) for s in sections))+' rules')
