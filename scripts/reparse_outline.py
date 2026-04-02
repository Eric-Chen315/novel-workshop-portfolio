#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
重新解析txt细纲，更新outline.json中200-246章的rawContent和mustInclude
"""

import json
import re
from pathlib import Path

# 文件路径
TXT_FILE = Path("novel-workshop/第四卷扩充细纲.txt")
JSON_FILE = Path("novel-workshop/data/projects/d0ca5fae-df9e-48f1-96b0-566087c5cd94/knowledge/outline.json")

def parse_txt_file(txt_path):
    """解析txt文件，提取每章的rawContent和mustInclude"""
    with open(txt_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 按章节分割（第XXX章作为分隔符）
    chapter_pattern = r'第(\d+)章'
    chapters = {}
    
    # 找到所有章节的起始位置，并按章节号排序
    matches = list(re.finditer(chapter_pattern, content))
    # 创建 (章节号, 位置, match对象) 的列表
    chapter_positions = [(int(m.group(1)), m.start(), m) for m in matches]
    # 按章节号排序
    chapter_positions.sort(key=lambda x: x[0])
    
    for i, (chapter_num, start_pos, match) in enumerate(chapter_positions):
        # 确定章节结束位置（下一章开始或文件结束）
        if i + 1 < len(chapter_positions):
            end_pos = chapter_positions[i + 1][1]  # 下一章的起始位置
        else:
            end_pos = len(content)
        
        chapter_text = content[start_pos:end_pos]
        
        # 提取rawContent：从【情节点】到【关键角色】之间的内容
        raw_content = ""
        raw_match = re.search(r'【情节点】(.*?)【关键角色】', chapter_text, re.DOTALL)
        if not raw_match:
            # 如果没有【关键角色】，则取到下一个【开头的标记
            raw_match = re.search(r'【情节点】(.*?)【', chapter_text, re.DOTALL)
        
        if raw_match:
            raw_content = raw_match.group(1).strip()
        
        # 提取mustInclude：从【必须包含】到【字数建议】之间的内容
        must_include = []
        must_match = re.search(r'【必须包含】(.*?)【字数建议】', chapter_text, re.DOTALL)
        if must_match:
            must_text = must_match.group(1).strip()
            # 按换行符拆分，去掉空行和首尾空格
            must_include = [line.strip() for line in must_text.split('\n') if line.strip()]
        
        chapters[chapter_num] = {
            'rawContent': raw_content,
            'mustInclude': must_include
        }
    
    return chapters

def update_outline_json(json_path, parsed_chapters):
    """更新outline.json中200-246章的rawContent和mustInclude"""
    # 读取JSON文件
    with open(json_path, 'r', encoding='utf-8') as f:
        outline = json.load(f)
    
    # 备份
    backup_path = json_path.with_suffix('.json.backup3')
    with open(backup_path, 'w', encoding='utf-8') as f:
        json.dump(outline, f, ensure_ascii=False, indent=2)
    print(f"✓ 备份已保存: {backup_path}")
    
    # 更新章节
    updated_count = 0
    anomalies = []
    
    for volume in outline.get('volumes', []):
        for chapter in volume.get('chapters', []):
            chapter_num = chapter.get('chapterNum')
            
            # 只更新200-246章
            if 200 <= chapter_num <= 246 and chapter_num in parsed_chapters:
                parsed = parsed_chapters[chapter_num]
                
                # 更新字段
                chapter['rawContent'] = parsed['rawContent']
                chapter['mustInclude'] = parsed['mustInclude']
                
                updated_count += 1
                
                # 检查异常
                raw_len = len(parsed['rawContent'])
                must_len = len(parsed['mustInclude'])
                
                print(f"第{chapter_num}章: rawContent={raw_len}字符, mustInclude={must_len}个元素")
                
                if raw_len < 300 or must_len < 3:
                    anomalies.append({
                        'chapterNum': chapter_num,
                        'rawContent': raw_len,
                        'mustInclude': must_len
                    })
    
    # 写入更新后的JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(outline, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ 已更新 {updated_count} 章")
    
    if anomalies:
        print(f"\n⚠ 发现 {len(anomalies)} 个异常章节:")
        for item in anomalies:
            print(f"  第{item['chapterNum']}章: rawContent={item['rawContent']}字符, mustInclude={item['mustInclude']}个元素")
    else:
        print("\n✓ 所有章节数据正常")

def main():
    print("开始解析txt文件...")
    parsed_chapters = parse_txt_file(TXT_FILE)
    print(f"✓ 解析完成，共 {len(parsed_chapters)} 章\n")
    
    print("开始更新outline.json...")
    update_outline_json(JSON_FILE, parsed_chapters)
    print("\n✓ 任务完成")

if __name__ == '__main__':
    main()
