#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""测试章节解析"""

import re
from pathlib import Path

TXT_FILE = Path("novel-workshop/第四卷扩充细纲.txt")

with open(TXT_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# 按章节分割（第XXX章作为分隔符）
chapter_pattern = r'第(\d+)章'
matches = list(re.finditer(chapter_pattern, content))

print(f"找到 {len(matches)} 个章节标记")
print("\n前10个章节:")
for i, match in enumerate(matches[:10]):
    chapter_num = int(match.group(1))
    print(f"  {i+1}. 第{chapter_num}章 at position {match.start()}")

# 解析第200章
for i, match in enumerate(matches):
    chapter_num = int(match.group(1))
    if chapter_num == 200:
        start_pos = match.start()
        if i + 1 < len(matches):
            end_pos = matches[i + 1].start()
        else:
            end_pos = len(content)
        
        chapter_text = content[start_pos:end_pos]
        
        print(f"\n第200章文本长度: {len(chapter_text)} 字符")
        print(f"前500字符:\n{chapter_text[:500]}")
        
        # 提取mustInclude
        must_match = re.search(r'【必须包含】(.*?)【字数建议】', chapter_text, re.DOTALL)
        if must_match:
            must_text = must_match.group(1).strip()
            must_include = [line.strip() for line in must_text.split('\n') if line.strip()]
            print(f"\nmustInclude: {must_include}")
            print(f"元素个数: {len(must_include)}")
        else:
            print("\n未匹配到mustInclude")
        
        break
