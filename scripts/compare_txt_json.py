#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
对比txt原文与outline.json中的rawContent
诊断数据丢失问题
"""

import json
import re

def extract_chapter_from_txt(txt_content, chapter_num):
    """从txt中提取指定章节的完整内容"""
    # 匹配章节标题模式
    pattern = rf'第{chapter_num}章[《【]([^》】]+)[》】]'
    
    # 找到当前章节的起始位置
    match = re.search(pattern, txt_content)
    if not match:
        return None, None
    
    title = match.group(1)
    start_pos = match.start()
    
    # 找到下一章的起始位置
    next_chapter_pattern = rf'第{chapter_num + 1}章[《【]'
    next_match = re.search(next_chapter_pattern, txt_content[start_pos:])
    
    if next_match:
        end_pos = start_pos + next_match.start()
        chapter_content = txt_content[start_pos:end_pos].strip()
    else:
        # 如果没有下一章，取到文件末尾
        chapter_content = txt_content[start_pos:].strip()
    
    return title, chapter_content

def get_chapter_from_json(data, chapter_num):
    """从outline.json中获取指定章节的rawContent"""
    for vol in data['volumes']:
        if vol.get('volumeNum') == 4:
            for ch in vol['chapters']:
                if ch.get('chapterNum') == chapter_num:
                    return ch.get('title', ''), ch.get('rawContent', '')
    return None, None

def main():
    # 读取txt文件
    txt_path = 'novel-workshop/第四卷扩充细纲.txt'
    print(f"读取txt文件: {txt_path}")
    with open(txt_path, 'r', encoding='utf-8') as f:
        txt_content = f.read()
    
    # 读取JSON文件
    json_path = 'novel-workshop/data/projects/d0ca5fae-df9e-48f1-96b0-566087c5cd94/knowledge/outline.json'
    print(f"读取JSON文件: {json_path}\n")
    with open(json_path, 'r', encoding='utf-8') as f:
        json_data = json.load(f)
    
    # 对比第216章和第220章
    for chapter_num in [216, 220]:
        print("=" * 80)
        print(f"第{chapter_num}章对比分析")
        print("=" * 80)
        
        # 从txt提取
        txt_title, txt_chapter = extract_chapter_from_txt(txt_content, chapter_num)
        if txt_chapter:
            print(f"\n【TXT原文】")
            print(f"标题: {txt_title}")
            print(f"长度: {len(txt_chapter)} 字符")
            print(f"\n完整内容:\n{'-' * 80}")
            print(txt_chapter)
            print('-' * 80)
        else:
            print(f"\n【TXT原文】未找到第{chapter_num}章")
        
        # 从JSON提取
        json_title, json_raw = get_chapter_from_json(json_data, chapter_num)
        if json_raw:
            print(f"\n【JSON rawContent】")
            print(f"标题: {json_title}")
            print(f"长度: {len(json_raw)} 字符")
            print(f"\n完整内容:\n{'-' * 80}")
            print(json_raw)
            print('-' * 80)
        else:
            print(f"\n【JSON rawContent】未找到第{chapter_num}章")
        
        # 对比分析
        if txt_chapter and json_raw:
            print(f"\n【差异分析】")
            print(f"TXT长度: {len(txt_chapter)} 字符")
            print(f"JSON长度: {len(json_raw)} 字符")
            print(f"丢失: {len(txt_chapter) - len(json_raw)} 字符")
            
            # 检查JSON内容是否是TXT的子集
            if json_raw in txt_chapter:
                print("\n✓ JSON内容是TXT的子集")
                # 找出缺失的部分
                missing_start = txt_chapter.find(json_raw)
                if missing_start > 0:
                    print(f"\n缺失的开头部分 ({missing_start}字符):")
                    print(txt_chapter[:missing_start])
                
                missing_end_start = missing_start + len(json_raw)
                if missing_end_start < len(txt_chapter):
                    print(f"\n缺失的结尾部分 ({len(txt_chapter) - missing_end_start}字符):")
                    print(txt_chapter[missing_end_start:])
            else:
                print("\n✗ JSON内容不是TXT的完整子集，可能有内容被修改或替换")
        
        print("\n")

if __name__ == '__main__':
    main()
