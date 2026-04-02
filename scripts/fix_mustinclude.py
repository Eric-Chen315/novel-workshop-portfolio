#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复outline.json中200-246章的mustInclude解析问题
检查rawContent字符数
"""

import json
import re
from pathlib import Path

def split_mustinclude_item(item):
    """拆分连接在一起的mustInclude条目"""
    # 如果包含换行符，按换行符拆分
    if '\n' in item:
        parts = [p.strip() for p in item.split('\n') if p.strip()]
        return parts
    
    # 检查是否包含多个独立语句（通过中文句号、感叹号等判断）
    # 同时排除引号内的标点符号
    sentences = []
    current = []
    in_quote = False
    
    for char in item:
        if char in '"'"'":
            in_quote = not in_quote
        current.append(char)
        
        # 如果不在引号内，且遇到空格，可能是分隔点
        if not in_quote and char == ' ' and len(''.join(current).strip()) > 0:
            # 检查前面是否有完整的语句
            text = ''.join(current).strip()
            # 如果文本较长且包含关键词，可能是独立条目
            if len(text) > 15:
                sentences.append(text)
                current = []
    
    # 添加最后一部分
    if current:
        text = ''.join(current).strip()
        if text:
            sentences.append(text)
    
    # 如果拆分出多个部分，返回；否则返回原文
    if len(sentences) > 1:
        return sentences
    
    # 如果包含多个连续空格（2个或以上），可能是多个条目
    if '  ' in item:
        parts = [p.strip() for p in re.split(r'\s{2,}', item) if p.strip()]
        return parts
    
    # 单个条目
    return [item]

def fix_chapter_mustinclude(chapter):
    """修复单个章节的mustInclude数组"""
    if 'mustInclude' not in chapter or not isinstance(chapter['mustInclude'], list):
        return False, 0, 0
    
    original_items = chapter['mustInclude']
    original_count = len(original_items)
    
    # 拆分所有条目
    new_items = []
    for item in original_items:
        if isinstance(item, str):
            split_items = split_mustinclude_item(item)
            new_items.extend(split_items)
        else:
            new_items.append(item)
    
    new_count = len(new_items)
    
    # 如果有变化，更新
    if new_count != original_count:
        chapter['mustInclude'] = new_items
        return True, original_count, new_count
    
    return False, original_count, new_count

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
            fixed, old_count, new_count = fix_chapter_mustinclude(chapter)
            
            if fixed:
                fixed_chapters.append({
                    'num': chapter_num,
                    'title': chapter.get('title', ''),
                    'old_count': old_count,
                    'new_count': new_count
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
        print(f"共修复 {len(fixed_chapters)} 章:")
        for ch in fixed_chapters:
            print(f"  第{ch['num']}章《{ch['title']}》: {ch['old_count']}项 → {ch['new_count']}项")
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
        backup_path = outline_path.with_suffix('.json.backup')
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
