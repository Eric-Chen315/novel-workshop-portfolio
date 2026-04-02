#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复outline.json中200-246章的mustInclude解析问题
使用更智能的拆分策略
"""

import json
import re
from pathlib import Path

def smart_split_mustinclude(item):
    """智能拆分mustInclude条目
    
    策略：
    1. 先按换行符拆分
    2. 如果没有换行符，查找中文语句的自然分界点
    3. 通过识别"主语+动词"模式来判断新句子的开始
    """
    # 如果包含换行符，直接按换行拆分
    if '\n' in item:
        parts = [p.strip() for p in item.split('\n') if p.strip()]
        return parts
    
    # 如果文本较短，不拆分
    if len(item) < 30:
        return [item]
    
    # 尝试识别多个独立的描述性短语
    # 通过识别常见的起始模式：人名、动作、场景等
    patterns = [
        r'([A-Z][a-z]+·\w+)',  # 英文人名如 Marcus·韦恩
        r'(报告第\d+页)',      # 报告页码
        r'(红星\w+)',          # 红星相关
        r'(李弈["""][^"""])',  # 李弈的引语
        r'(魏莱\w+)',          # 魏莱相关
        r'(\w+首次\w+)',       # XX首次XX
    ]
    
    # 查找所有匹配位置
    matches = []
    for pattern in patterns:
        for match in re.finditer(pattern, item):
            matches.append((match.start(), match.group()))
    
    # 按位置排序
    matches.sort(key=lambda x: x[0])
    
    # 如果找到多个匹配点，尝试拆分
    if len(matches) >= 2:
        parts = []
        last_pos = 0
        
        for i, (pos, text) in enumerate(matches):
            if i > 0:  # 从第二个匹配开始拆分
                part = item[last_pos:pos].strip()
                if part:
                    parts.append(part)
                last_pos = pos
        
        # 添加最后一部分
        if last_pos < len(item):
            part = item[last_pos:].strip()
            if part:
                parts.append(part)
        
        # 如果成功拆分出多个部分，返回
        if len(parts) > 1:
            return parts
    
    # 如果上述方法都失败，返回原文
    return [item]

def fix_chapter_mustinclude(chapter):
    """修复单个章节的mustInclude数组"""
    if 'mustInclude' not in chapter or not isinstance(chapter['mustInclude'], list):
        return False, 0, 0, []
    
    original_items = chapter['mustInclude']
    original_count = len(original_items)
    
    # 拆分所有条目
    new_items = []
    for item in original_items:
        if isinstance(item, str):
            split_items = smart_split_mustinclude(item)
            new_items.extend(split_items)
        else:
            new_items.append(item)
    
    new_count = len(new_items)
    
    # 如果有变化，更新
    if new_count != original_count:
        chapter['mustInclude'] = new_items
        return True, original_count, new_count, new_items
    
    return False, original_count, new_count, []

def main():
    # 文件路径
    outline_path = Path('novel-workshop/data/projects/d0ca5fae-df9e-48f1-96b0-566087c5cd94/knowledge/outline.json')
    
    print(f"读取文件: {outline_path}")
    
    # 读取JSON
    with open(outline_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 找到第四卷
    volume4 = None
    for vol in data['volumes']:
        if vol.get('volumeNum') == 4:
            volume4 = vol
            break
    
    if not volume4:
        print("错误: 未找到第四卷")
        return
    
    print(f"\n找到第四卷，共 {len(volume4['chapters'])} 章")
    print("=" * 80)
    
    # 统计信息
    fixed_chapters = []
    short_content_chapters = []
    
    # 处理200-246章
    for chapter in volume4['chapters']:
        chapter_num = chapter.get('chapterNum', 0)
        
        if 200 <= chapter_num <= 246:
            # 修复mustInclude
            fixed, old_count, new_count, new_items = fix_chapter_mustinclude(chapter)
            
            if fixed:
                fixed_chapters.append({
                    'num': chapter_num,
                    'title': chapter.get('title', ''),
                    'old_count': old_count,
                    'new_count': new_count,
                    'new_items': new_items
                })
            
            # 检查rawContent长度
            raw_content = chapter.get('rawContent', '')
            content_length = len(raw_content)
            
            if content_length < 300:
                short_content_chapters.append({
                    'num': chapter_num,
                    'title': chapter.get('title', ''),
                    'length': content_length
                })
    
    # 输出修复结果
    print("\n【mustInclude修复结果】")
    if fixed_chapters:
        print(f"共修复 {len(fixed_chapters)} 章:\n")
        for ch in fixed_chapters:
            print(f"第{ch['num']}章《{ch['title']}》: {ch['old_count']}项 → {ch['new_count']}项")
            print("拆分后的条目:")
            for i, item in enumerate(ch['new_items'], 1):
                print(f"  {i}. {item}")
            print()
    else:
        print("  无需修复")
    
    print("\n【rawContent长度检查】")
    if short_content_chapters:
        print(f"共 {len(short_content_chapters)} 章内容过短(<300字符):")
        for ch in short_content_chapters:
            print(f"  第{ch['num']}章《{ch['title']}》: {ch['length']}字符")
    else:
        print("  所有章节内容长度正常")
    
    # 保存修改
    if fixed_chapters:
        backup_path = outline_path.with_suffix('.json.backup2')
        print(f"\n备份原文件到: {backup_path}")
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"写入修复后的文件: {outline_path}")
        with open(outline_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print("\n✓ 修复完成!")
    else:
        print("\n无需修改文件")
    
    print("=" * 80)

if __name__ == '__main__':
    main()
