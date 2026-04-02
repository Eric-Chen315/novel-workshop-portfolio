#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
输出指定章节的原始JSON
"""

import json
import sys

def main():
    outline_path = r"data\projects\d0ca5fae-df9e-48f1-96b0-566087c5cd94\knowledge\outline.json"
    
    try:
        # 读取outline.json
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
        
        # 输出第200章
        print("=" * 80)
        print("第200章原始JSON：")
        print("=" * 80)
        for ch in chapters:
            if ch.get('chapterNum') == 200:
                print(json.dumps(ch, ensure_ascii=False, indent=2))
                break
        
        print("\n" + "=" * 80)
        print("第216章原始JSON：")
        print("=" * 80)
        for ch in chapters:
            if ch.get('chapterNum') == 216:
                print(json.dumps(ch, ensure_ascii=False, indent=2))
                break
        
        return True
        
    except Exception as e:
        print(f"错误：{e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
