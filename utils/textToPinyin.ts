import pinyin from "pinyin";

export function textToPinyin(text: string): string[] {
  const result = pinyin(text, {
    style: pinyin.STYLE_NORMAL,
    heteronym: false,
  });

  return result.flat(); // 返回 ["ni3", "hao3"]
}