

import { dictionary } from 'cmu-pronouncing-dictionary'
//const cmuDict = dict as Record<string, string[]>;
const OculusVisemes = [
  "viseme_sil",
  "viseme_PP",
  "viseme_FF",
  "viseme_TH",
  "viseme_DD",
  "viseme_kk",
  "viseme_CH",
  "viseme_SS",
  "viseme_nn",
  "viseme_RR",
  "viseme_aa",
  "viseme_E",
  "viseme_I",
  "viseme_O",
  "viseme_U",
]
// 音素到 viseme 的映射表
export const phonemeToViseme: Record<string, string> = {
  neutral: "viseme_sil",
  // 'P': 'viseme_PP', 'B': 'viseme_PP', 'M': 'viseme_PP',
  // 'F': 'viseme_FF', 'V': 'viseme_FF',
  // 'TH': 'viseme_TH', 'DH': 'viseme_TH',
  // 'D': 'viseme_DD', 'T': 'viseme_DD', 'N': 'viseme_DD',
  // 'K': 'viseme_kk', 'G': 'viseme_kk', 'NG': 'viseme_kk',
  // 'CH': 'viseme_CH', 'JH': 'viseme_CH', 'SH': 'viseme_CH', 'ZH': 'viseme_CH',
  // 'S': 'viseme_SS', 'Z': 'viseme_SS',
  // 'L': 'viseme_nn',
  // 'R': 'viseme_RR', 'ER': 'viseme_RR',
  // 'AA': 'viseme_aa', 'AO': 'viseme_aa', 'AH': 'viseme_aa', 'AW': 'viseme_aa', 'AY': 'viseme_aa',
  // 'AE': 'viseme_E', 'EH': 'viseme_E',
  // 'IH': 'viseme_I', 'IY': 'viseme_I',
  // 'OW': 'viseme_O', 'OY': 'viseme_O',
  // 'UH': 'viseme_U', 'UW': 'viseme_U',
  // 'AH0': 'viseme_sil', 'HH': 'viseme_sil', 'Y': 'viseme_sil', 'W': 'viseme_sil', 

  "AA": OculusVisemes[10], "AO": OculusVisemes["13"],
  "AE": OculusVisemes[10], "AH": OculusVisemes[10], "AX": OculusVisemes[11],
  "AY": OculusVisemes[10], "AW": OculusVisemes[14],
  "EH": OculusVisemes[11], "EY": OculusVisemes[11], "ER": OculusVisemes[9],
  "IH": OculusVisemes[12], "IY": OculusVisemes[12],
  "OW": OculusVisemes[13], "UH": OculusVisemes[14], "UW": OculusVisemes[14],
  "OY": OculusVisemes[13],
  "B": OculusVisemes[1], "P": OculusVisemes[1], "M": OculusVisemes[1],
  "F": OculusVisemes[2], "V": OculusVisemes[2],
  "TH": OculusVisemes[3], "DH": OculusVisemes[3],
  "T": OculusVisemes[4], "D": OculusVisemes[4],
  "K": OculusVisemes[5], "G": OculusVisemes[5],
  "CH": OculusVisemes[6], "JH": OculusVisemes[6], "SH": OculusVisemes[6], "ZH": OculusVisemes[6],
  "S": OculusVisemes[7], "Z": OculusVisemes[7],
  "N": OculusVisemes[4], "L": OculusVisemes[9],
  "R": OculusVisemes[9],
  "W": OculusVisemes[14],
  "Y": OculusVisemes[12],
  "TS": OculusVisemes[7],
  "HH": OculusVisemes[0],
  "NG": OculusVisemes[8],
};

  
  // 模擬將文字轉換為音素（實際應使用語音分析工具）
  export function textToPhonemes(text: string): string[] {
    return text.toLowerCase().split('');
  }
  
  // 將文字轉換為 viseme 序列

  export function textToVisemes(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .flatMap(word => {
        //console.warn('word:' ,word)
        const phonemeSt = getPhonemes(word);
        //console.log(`phonemeSt: ${phonemeSt}`);
        if (!phonemeSt) {
          console.warn(`未找到音標: ${word}`);
          return ["viseme_sil"]; // fallback to silence
        }
        const phonemes = phonemeSt.split(" ").map(p => p.replace(/[0-9]/g, ""));
  
        return phonemes.map(p => {
          const basePhoneme = p.replace(/[0-9]/g, ""); // 移除重音符號
          //console.warn(`jjjjjjj: ${phonemeToViseme[basePhoneme] ?? "viseme_sil"}`);
          return phonemeToViseme[basePhoneme] ?? "viseme_sil";
        });
      });
  }

  
  export function getPhonemes(text: string): string {
    //console.log(dictionary[text.toLowerCase()])
    return dictionary[text.toLowerCase()];
  }