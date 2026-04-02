#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查outline.json中指定章节的数据完整性
"""

import json
import sys

def check_chapter_integrity(chapter_data, chapter_num):
    """检查单个章节的数据完整性"""
    print(f"\n{'='*80}")
    print(f"第 {chapter_num} 章数据完整性检查")
    print(f"{'='*80}\n")
    
    # 输出完整的JSON对象
    print("完整JSON对象：")
    print(json.dumps(chapter_data, ensure_ascii=False, indent=2))
    print()
    
    # 统计关键字段
    print(f"{'='*80}")
    print("字段统计：")
    print(f"{'='*80}")
    
    # rawContent字符数
    raw_content = chapter_data.get('rawContent', '')
    print(f"rawContent 字符数: {len(raw_content)}")
    
    # mustInclude数组元素数
    must_include = chapter_data.get('mustInclude', [])
    print(f"mustInclude 元素数: {len(must_include)}")
    if must_include:
        print(f"mustInclude 内容:")
        for i, item in enumerate(must_include, 1):
            print(f"  {i}. {item}")
    
    # connectionToNext是否有值
    connection = chapter_data.get('connectionToNext', '')
    print(f"connectionToNext 是否有值: {'是' if connection else '否'}")
    if connection:
        print(f"connectionToNext 内容: {connection}")
    
    # emotionalArc是否有值
    emotional = chapter_data.get('emotionalArc', '')
    print(f"emotionalArc 是否有值: {'是' if emotional else '否'}")
    if emotional:
        print(f"emotionalArc 内容: {emotional}")
    
    # 其他字段
    print(f"\n其他字段:")
    print(f"  title: {chapter_data.get('title', 'N/A')}")
    print(f"  summary: {chapter_data.get('summary', 'N/A')}")
    print(f"  status: {chapter_data.get('status', 'N/A')}")
    print(f"  suggestedWordCount: {chapter_data.get('suggestedWordCount', 'N/A')}")
    print(f"  volume: {chapter_data.get('volume', 'N/A')}")
    
    return True

def main():
    outline_path = r"data\projects\d0ca5fae-df9e-48f1-96b0-566087c5cd94\knowledge\outline.json"
    
    try:
        # 读取outline.json
        print(f"正在读取文件: {outline_path}")
        with open(outline_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 找到第四卷
        volume4 = None
        for volume in data.get('volumes', []):
            if volume.get('volumeNum') == 4:
                volume4 = volume
                break
        
        if not volume4:
            print("错误：未找到第四卷数据")
            return False
        
        chapters = volume4.get('chapters', [])
        print(f"\n第四卷共有 {len(chapters)} 章")
        
        # 检查指定章节
        target_chapters = [200, 216, 246]
        
        for target_num in target_chapters:
            # 查找章节
            chapter = None
            for ch in chapters:
                if ch.get('chapterNum') == target_num:
                    chapter = ch
                    break
            
            if chapter:
                check_chapter_integrity(chapter, target_num)
            else:
                print(f"\n警告：未找到第 {target_num} 章")
        
        print(f"\n{'='*80}")
        print("检查完成")
        print(f"{'='*80}\n")
        
        return True
        
    except FileNotFoundError:
        print(f"错误：文件不存在 - {outline_path}")
        return False
    except json.JSONDecodeError as e:
        print(f"错误：JSON解析失败 - {e}")
        return False
    except Exception as e:
        print(f"错误：{e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
