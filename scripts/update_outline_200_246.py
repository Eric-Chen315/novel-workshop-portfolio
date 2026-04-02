#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将第四卷扩充细纲.txt中的200-246章写入outline.json
保留172-199章，删除旧200-206章，插入新200-246章
"""

import json
import re
from pathlib import Path

# 文件路径
BASE_DIR = Path(__file__).parent.parent
TXT_FILE = BASE_DIR / "第四卷扩充细纲.txt"
OUTLINE_FILE = BASE_DIR / "data/projects/d0ca5fae-df9e-48f1-96b0-566087c5cd94/knowledge/outline.json"

def parse_txt_chapters(txt_content):
    """解析txt文件，提取200-246章的数据"""
    chapters = []
    
    # 按章节分割
    chapter_pattern = r'第(\d+)章[：:](.*?)\n'
    chapter_matches = list(re.finditer(chapter_pattern, txt_content))
    
    for i, match in enumerate(chapter_matches):
        chapter_num = int(match.group(1))
        if chapter_num < 200 or chapter_num > 246:
            continue
            
        title = match.group(2).strip()
        
        # 提取该章节的完整内容
        start_pos = match.end()
        end_pos = chapter_matches[i + 1].start() if i + 1 < len(chapter_matches) else len(txt_content)
        chapter_content = txt_content[start_pos:end_pos]
        
        # 提取各个字段
        summary = extract_field(chapter_content, r'【核心功能】\s*(.*?)(?=\n【|$)', multiline=True)
        raw_content = extract_field(chapter_content, r'【情节点】\s*(.*?)(?=\n【|$)', multiline=True)
        must_include = extract_list_field(chapter_content, r'【必须包含】\s*(.*?)(?=\n【|$)')
        connection_to_next = extract_field(chapter_content, r'【章末钩子】\s*(.*?)(?=\n【|$)', multiline=True)
        suggested_word_count = extract_word_count(chapter_content)
        emotional_arc = extract_field(chapter_content, r'【情绪弧线】\s*(.*?)(?=\n【|$)', multiline=True)
        
        chapter_obj = {
            "chapterNum": chapter_num,
            "title": title,
            "summary": summary,
            "rawContent": raw_content,
            "mustInclude": must_include,
            "connectionToNext": connection_to_next,
            "status": "pending",
            "suggestedWordCount": suggested_word_count,
            "emotionalArc": emotional_arc,
            "volume": 4
        }
        
        chapters.append(chapter_obj)
    
    return chapters

def extract_field(content, pattern, multiline=False):
    """提取单个字段"""
    flags = re.DOTALL if multiline else 0
    match = re.search(pattern, content, flags)
    if match:
        text = match.group(1).strip()
        # 清理多余的空白
        text = re.sub(r'\n+', '\n', text)
        return text
    return ""

def extract_list_field(content, pattern):
    """提取列表字段（必须包含）"""
    match = re.search(pattern, content, re.DOTALL)
    if match:
        text = match.group(1).strip()
        # 按行分割，去除空行和序号
        items = []
        for line in text.split('\n'):
            line = line.strip()
            if line:
                # 去除开头的序号、破折号等
                line = re.sub(r'^[-•\d.、]+\s*', '', line)
                if line:
                    items.append(line)
        return items
    return []

def extract_word_count(content):
    """提取字数建议"""
    match = re.search(r'【字数建议】\s*(\d+)', content)
    if match:
        return int(match.group(1))
    return 3000

def main():
    print("开始处理...")
    
    # 读取txt文件
    print(f"读取文件: {TXT_FILE}")
    with open(TXT_FILE, 'r', encoding='utf-8') as f:
        txt_content = f.read()
    
    # 解析200-246章
    print("解析200-246章...")
    new_chapters = parse_txt_chapters(txt_content)
    print(f"解析到 {len(new_chapters)} 章")
    
    # 读取outline.json
    print(f"读取文件: {OUTLINE_FILE}")
    with open(OUTLINE_FILE, 'r', encoding='utf-8') as f:
        outline_data = json.load(f)
    
    # 找到第四卷
    volume_4 = None
    for volume in outline_data['volumes']:
        if volume['volumeNum'] == 4:
            volume_4 = volume
            break
    
    if not volume_4:
        print("错误: 未找到第四卷")
        return
    
    # 保留172-199章，删除200-206章
    print("处理章节数据...")
    old_chapters = volume_4['chapters']
    kept_chapters = [ch for ch in old_chapters if ch['chapterNum'] < 200]
    print(f"保留 {len(kept_chapters)} 章 (172-199)")
    
    # 合并章节并排序
    all_chapters = kept_chapters + new_chapters
    all_chapters.sort(key=lambda x: x['chapterNum'])
    
    volume_4['chapters'] = all_chapters
    volume_4['title'] = "天道无亲，全球收割（172-246章）"
    
    # 写入文件
    print(f"写入文件: {OUTLINE_FILE}")
    with open(OUTLINE_FILE, 'w', encoding='utf-8') as f:
        json.dump(outline_data, f, ensure_ascii=False, indent=2)
    
    print("\n处理完成!")
    print(f"第四卷总章节数: {len(all_chapters)}")
    
    # 验证
    print("\n验证结果:")
    ch_199 = next((ch for ch in all_chapters if ch['chapterNum'] == 199), None)
    if ch_199:
        print(f"第199章标题: {ch_199['title']}")
    
    ch_200 = next((ch for ch in all_chapters if ch['chapterNum'] == 200), None)
    if ch_200:
        print(f"第200章标题: {ch_200['title']}")
        print(f"第200章必须包含: {ch_200['mustInclude'][:2]}...")
    
    ch_246 = next((ch for ch in all_chapters if ch['chapterNum'] == 246), None)
    if ch_246:
        print(f"第246章标题: {ch_246['title']}")
    
    # 检查重复和缺失
    chapter_nums = [ch['chapterNum'] for ch in all_chapters]
    duplicates = [num for num in set(chapter_nums) if chapter_nums.count(num) > 1]
    if duplicates:
        print(f"\n警告: 发现重复章节号: {duplicates}")
    
    expected = set(range(172, 247))
    actual = set(chapter_nums)
    missing = expected - actual
    if missing:
        print(f"\n警告: 缺失章节号: {sorted(missing)}")
    else:
        print("\n✓ 章节号连续完整 (172-246)")

if __name__ == '__main__':
    main()
