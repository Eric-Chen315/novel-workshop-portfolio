#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""验证更新结果"""

import json
from pathlib import Path

JSON_FILE = Path("novel-workshop/data/projects/d0ca5fae-df9e-48f1-96b0-566087c5cd94/knowledge/outline.json")

with open(JSON_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 找第200章和第216章
ch200 = [c for v in data['volumes'] for c in v['chapters'] if c['chapterNum'] == 200][0]
ch216 = [c for v in data['volumes'] for c in v['chapters'] if c['chapterNum'] == 216][0]

print("第200章:")
print(f"  rawContent: {len(ch200['rawContent'])}字符")
print(f"  mustInclude: {len(ch200['mustInclude'])}个")
print(f"  内容: {ch200['mustInclude']}")

print("\n第216章:")
print(f"  rawContent: {len(ch216['rawContent'])}字符")
print(f"  mustInclude: {len(ch216['mustInclude'])}个")
print(f"  内容: {ch216['mustInclude']}")

# 统计所有200-246章
print("\n" + "="*80)
print("200-246章统计:")
normal_count = 0
short_raw = 0
short_must = 0

for v in data['volumes']:
    for c in v['chapters']:
        if 200 <= c['chapterNum'] <= 246:
            raw_len = len(c['rawContent'])
            must_len = len(c['mustInclude'])
            
            if raw_len >= 300 and must_len >= 3:
                normal_count += 1
            else:
                if raw_len < 300:
                    short_raw += 1
                if must_len < 3:
                    short_must += 1

print(f"  正常章节: {normal_count}")
print(f"  rawContent<300字符: {short_raw}")
print(f"  mustInclude<3个元素: {short_must}")
