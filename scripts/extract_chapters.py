#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json

# 读取outline.json
with open(r'data\projects\d0ca5fae-df9e-48f1-96b0-566087c5cd94\knowledge\outline.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 找到第四卷
v4 = [v for v in data['volumes'] if v['volumeNum']==4][0]

# 提取第200章
ch200 = [c for c in v4['chapters'] if c['chapterNum']==200][0]

# 提取第216章
ch216 = [c for c in v4['chapters'] if c['chapterNum']==216][0]

# 输出到文件
with open('chapter_200_216_raw.txt', 'w', encoding='utf-8') as f:
    f.write("="*80 + "\n")
    f.write("第200章原始JSON\n")
    f.write("="*80 + "\n\n")
    f.write(json.dumps(ch200, ensure_ascii=False, indent=2))
    f.write("\n\n" + "="*80 + "\n")
    f.write("第216章原始JSON\n")
    f.write("="*80 + "\n\n")
    f.write(json.dumps(ch216, ensure_ascii=False, indent=2))

print("已保存到 chapter_200_216_raw.txt")
