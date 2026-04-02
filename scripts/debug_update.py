#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""调试更新逻辑"""

import json
import re
from pathlib import Path

TXT_FILE = Path("novel-workshop/第四卷扩充细纲.txt")
JSON_FILE = Path("novel-workshop/data/projects/d0ca5fae-df9e-48f1-96b0-566087c5cd94/knowledge/outline.json")

# 解析txt
with open(TXT_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# 找第200章
match = re.search(r'第200章', content)
if match:
    start = match.start()
    next_match = re.search(r'第201章', content)
    end = next_match.start() if next_match else len(content)
    chapter_text = content[start:end]
    
    # 提取mustInclude
    must_match = re.search(r'【必须包含】(.*?)【字数建议】', chapter_text, re.DOTALL)
    if must_match:
        must_text = must_match.group(1).strip()
        must_include = [line.strip() for line in must_text.split('\n') if line.strip()]
        print(f"解析出的mustInclude: {must_include}")
        print(f"元素个数: {len(must_include)}")
    
    # 读取JSON
    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        outline = json.load(f)
    
    # 查找第200章
    found = False
    for volume in outline.get('volumes', []):
        for chapter in volume.get('chapters', []):
            if chapter.get('chapterNum') == 200:
                found = True
                print(f"\n找到第200章")
                print(f"更新前 mustInclude: {chapter.get('mustInclude')}")
                
                # 模拟更新
                chapter['mustInclude'] = must_include
                print(f"更新后 mustInclude: {chapter.get('mustInclude')}")
                break
        if found:
            break
    
    if not found:
        print("\n未找到第200章！")
