# scripts/get_pinyin.py
import sys
from pypinyin import pinyin, Style
import json

text = sys.argv[1]
py = pinyin(text, style=Style.TONE3, strict=False)
flat_py = [item[0] for item in py]
print(json.dumps(flat_py))