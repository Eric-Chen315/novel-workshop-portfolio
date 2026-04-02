import json

with open('novel-workshop/data/projects/d0ca5fae-df9e-48f1-96b0-566087c5cd94/knowledge/outline.json', encoding='utf-8') as f:
    data = json.load(f)

for vol in data['volumes']:
    if vol.get('volumeNum') == 4:
        for ch in vol['chapters']:
            if ch.get('chapterNum') == 216:
                print(f"第216章《{ch['title']}》")
                print(f"\nmustInclude数量: {len(ch['mustInclude'])}")
                print("\nmustInclude内容:")
                for i, item in enumerate(ch['mustInclude'], 1):
                    print(f"{i}. {item}")
                
                print(f"\nrawContent长度: {len(ch.get('rawContent', ''))} 字符")
                break
