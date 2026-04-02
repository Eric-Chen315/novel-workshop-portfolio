#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""验证outline.json的修改结果"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
OUTLINE_FILE = BASE_DIR / "data/projects/d0ca5fae-df9e-48f1-96b0-566087c5cd94/knowledge/outline.json"

def main():
    with open(OUTLINE_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 找到第四卷
    vol4 = [v for v in data['volumes'] if v['volumeNum'] == 4][0]
    
    print("=" * 60)
    print("验证结果")
    print("=" * 60)
    
    # 1. 总章节数
    print(f"\n第四卷总章节数: {len(vol4['chapters'])}")
    
    # 2. 第199章（确认未被修改）
    ch199 = [c for c in vol4['chapters'] if c['chapterNum'] == 199][0]
    print(f"\n第199章标题: {ch199['title']}")
    print(f"第199章状态: {ch199.get('status', 'N/A')}")
    
    # 3. 第200章（确认新数据写入正确）
    ch200 = [c for c in vol4['chapters'] if c['chapterNum'] == 200][0]
    print(f"\n第200章标题: {ch200['title']}")
    print(f"第200章必须包含:")
    for item in ch200['mustInclude']:
        print(f"  - {item}")
    print(f"第200章字数建议: {ch200.get('suggestedWordCount', 'N/A')}")
    
    # 4. 第246章（确认最后一章存在）
    ch246 = [c for c in vol4['chapters'] if c['chapterNum'] == 246][0]
    print(f"\n第246章标题: {ch246['title']}")
    
    # 5. 检查章节号连续性和重复
    nums = [c['chapterNum'] for c in vol4['chapters']]
    print(f"\n章节号范围: {min(nums)} - {max(nums)}")
    
    # 检查重复
    duplicates = [num for num in set(nums) if nums.count(num) > 1]
    if duplicates:
        print(f"❌ 发现重复章节号: {duplicates}")
    else:
        print("✓ 无重复章节号")
    
    # 检查缺失
    expected = list(range(172, 247))
    missing = [num for num in expected if num not in nums]
    if missing:
        print(f"❌ 缺失章节号: {missing}")
    else:
        print("✓ 章节号连续完整 (172-246)")
    
    print("\n" + "=" * 60)

if __name__ == '__main__':
    main()
