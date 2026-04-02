#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""调试解析逻辑"""

import re
from pathlib import Path

TXT_FILE = Path("novel-workshop/第四卷扩充细纲.txt")

with open(TXT_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# 找第200章
chapter_pattern = r'第200章'
match = re.search(chapter_pattern, content)
if match:
    start = match.start()
    # 找第201章作为结束
    next_match = re.search(r'第201章', content)
    end = next_match.start() if next_match else len(content)
    
    chapter_text = content[start:end]
    
    print("=" * 80)
    print("第200章完整文本:")
    print("=" * 80)
    print(chapter_text[:1000])  # 只打印前1000字符
    print("\n" + "=" * 80)
    
    # 尝试提取rawContent
    raw_match = re.search(r'【情节点】(.*?)【关键角色】', chapter_text, re.DOTALL)
    if raw_match:
        print("\n提取到的rawContent:")
        print("-" * 80)
        print(raw_match.group(1))
        print("-" * 80)
        print(f"长度: {len(raw_match.group(1).strip())} 字符")
    else:
        print("\n未匹配到rawContent")
    
    # 尝试提取mustInclude
    must_match = re.search(r'【必须包含】(.*?)【字数建议】', chapter_text, re.DOTALL)
    if must_match:
        print("\n提取到的mustInclude:")
        print("-" * 80)
        print(must_match.group(1))
        print("-" * 80)
        must_text = must_match.group(1).strip()
        must_list = [line.strip() for line in must_text.split('\n') if line.strip()]
        print(f"拆分后: {len(must_list)} 个元素")
        for i, item in enumerate(must_list, 1):
            print(f"  {i}. {item}")
    else:
        print("\n未匹配到mustInclude")
