
const pinyinToIPA = (input: string) => {
    const pinyinMap: Record<string, string> = {
        "a": "a", "ai": "ai", "an": "an", "ang": "ɑŋ", "ao": "au",
        "ba": "pa", "bai": "pai", "ban": "pan", "bang": "pɑŋ", "bao": "pau", "bei": "pei", "ben": "pən", "beng": "pəŋ", "bi": "pi", "bian": "pien", "biao": "pjau", "bie": "piɛ", "bin": "pin", "bing": "piŋ", "bo": "puɔ", "bu": "pu",
        "ca": "tsʰa", "cai": "tsʰai", "can": "tsʰan", "cang": "tsʰɑŋ", "cao": "tsʰau", "ce": "tsʰɤ", "cen": "tsʰən", "ceng": "tsʰəŋ", "cha": "ʈʂʰa", "chai": "ʈʂʰai", "chan": "ʈʂʰan", "chang": "ʈʂʰɑŋ", "chao": "ʈʂʰau", "che": "ʈʂʰɤ", "chen": "ʈʂʰən", "cheng": "ʈʂʰəŋ", "chi": "ʈʂʰɻ̩", "chong": "ʈʂʰʊŋ", "chou": "ʈʂʰou", "chu": "ʈʂʰu", "chuai": "ʈʂʰuai", "chuan": "ʈʂʰuan", "chuang": "ʈʂʰuɑŋ", "chui": "ʈʂʰuei", "chun": "ʈʂʰuən", "chuo": "ʈʂʰuɔ",
        "ci": "tsʰɹ̩", "cong": "tsʰʊŋ", "cou": "tsʰou", "cu": "tsʰu", "cuan": "tsʰuan", "cui": "tsʰuei", "cun": "tsʰuən", "cuo": "tsʰuɔ",
        "da": "ta", "dai": "tai", "dan": "tan", "dang": "tɑŋ", "dao": "tau", "de": "tɤ", "dei": "tei", "den": "tən", "deng": "təŋ", "di": "ti", "dia": "tia", "dian": "tien", "diao": "tjau", "die": "tiɛ", "ding": "tiŋ", "diu": "tiou", "dong": "tʊŋ", "dou": "tou", "du": "tu", "duan": "tuan", "dui": "tuei", "dun": "tuən", "duo": "tuɔ",
        "e": "ɤ", "ei": "ei", "en": "ən", "eng": "əŋ", "er": "ɑɻ",
        "fa": "fa", "fan": "fan", "fang": "fɑŋ", "fei": "fei", "fen": "fən", "feng": "fəŋ", "fo": "fuɔ", "fou": "fou", "fu": "fu",
        "ga": "ka", "gai": "kai", "gan": "kan", "gang": "kɑŋ", "gao": "kau", "ge": "kɤ", "gei": "kei", "gen": "kən", "geng": "kəŋ", "gong": "kʊŋ", "gou": "kou", "gu": "ku", "gua": "kua", "guai": "kuai", "guan": "kuan", "guang": "kuɑŋ", "gui": "kuei", "gun": "kuən", "guo": "kuɔ",
        "ha": "xa", "hai": "xai", "han": "xan", "hang": "xɑŋ", "hao": "xau", "he": "xɤ", "hei": "xei", "hen": "xən", "heng": "xəŋ", "hong": "xʊŋ", "hou": "xou", "hu": "xu", "hua": "xua", "huai": "xuai", "huan": "xuan", "huang": "xuɑŋ", "hui": "xuei", "hun": "xuən", "huo": "xuɔ",
        "ji": "tɕi", "jia": "tɕia", "jian": "tɕien", "jiang": "tɕjɑŋ", "jiao": "tɕjau", "jie": "tɕiɛ", "jin": "tɕin", "jing": "tɕiŋ", "jiong": "tɕʊŋ", "jiu": "tɕiou", "ju": "ty", "juan": "tyan", "jue": "tyœ", "jun": "tyn",
        "ka": "kʰa", "kai": "kʰai", "kan": "kʰan", "kang": "kʰɑŋ", "kao": "kʰau", "ke": "kʰɤ", "ken": "kʰən", "keng": "kʰəŋ", "kong": "kʰʊŋ", "kou": "kʰou", "ku": "kʰu", "kua": "kʰua", "kuai": "kʰuai", "kuan": "kʰuan", "kuang": "kʰuɑŋ", "kui": "kʰuei", "kun": "kʰuən", "kuo": "kʰuɔ",
        "la": "la", "lai": "lai", "lan": "lan", "lang": "lɑŋ", "lao": "lau", "le": "lɤ", "lei": "lei", "leng": "ləŋ", "li": "li", "lia": "lia", "lian": "lien", "liang": "ljɑŋ", "liao": "ljau", "lie": "liɛ", "lin": "lin", "ling": "liŋ", "liu": "liou", "long": "lʊŋ", "lou": "lou", "lu": "lu", "luan": "luan", "lun": "luən", "luo": "luɔ", "lü": "ly", "lüe": "lyœ", "lüan": "lyan", "lün": "lyn",
        "ma": "ma", "mai": "mai", "man": "man", "mang": "mɑŋ", "mao": "mau", "me": "mə", "mei": "mei", "men": "mən", "meng": "məŋ", "mi": "mi", "mian": "mien", "miao": "mjau", "mie": "miɛ", "min": "min", "ming": "miŋ", "miu": "miou", "mo": "muɔ", "mou": "mou", "mu": "mu",
        "na": "na", "nai": "nai", "nan": "nan", "nang": "nɑŋ", "nao": "nau", "ne": "nə", "nei": "nei", "nen": "nən", "neng": "nəŋ", "ni": "ni", "nian": "nien", "niang": "njɑŋ", "niao": "njau", "nie": "niɛ", "nin": "nin", "ning": "niŋ", "niu": "niou", "nong": "nʊŋ", "nou": "nou", "nu": "nu", "nuan": "nuan", "nun": "nuən", "nuo": "nuɔ", "nü": "ny", "nüe": "nyœ", "nüan": "nyan", "nün": "nyn",
        "o": "uɔ", "ou": "ou",
        "pa": "pʰa", "pai": "pʰai", "pan": "pʰan", "pang": "pʰɑŋ", "pao": "pʰau", "pei": "pʰei", "pen": "pʰən", "peng": "pʰəŋ", "pi": "pʰi", "pian": "pʰien", "piao": "pʰjau", "pie": "pʰiɛ", "pin": "pʰin", "ping": "pʰiŋ", "po": "pʰuɔ", "pou": "pʰou", "pu": "pʰu",
        "qi": "tɕʰi", "qia": "tɕʰia", "qian": "tɕʰien", "qiang": "tɕʰjɑŋ", "qiao": "tɕʰjau", "qie": "tɕʰiɛ", "qin": "tɕʰin", "qing": "tɕʰiŋ", "qiong": "tɕʰʊŋ", "qiu": "tɕʰiou", "qu": "tʰy", "quan": "tʰyan", "que": "tʰyœ", "qun": "tʰyn",
        "ran": "ʐan", "rang": "ʐɑŋ", "rao": "ʐau", "re": "ʐɤ", "ren": "ʐən", "reng": "ʐəŋ", "ri": "ʐɻ̩", "rong": "ʐʊŋ", "rou": "ʐou", "ru": "ʐu", "rua": "ʐua", "ruan": "ʐuan", "rui": "ʐuei", "run": "ʐuən", "ruo": "ʐuɔ",
        "sa": "sa", "sai": "sai", "san": "san", "sang": "sɑŋ", "sao": "sau", "se": "sɤ", "sen": "sən", "seng": "səŋ", "sha": "ʂa", "shai": "ʂai", "shan": "ʂan", "shang": "ʂɑŋ", "shao": "ʂau", "she": "ʂɤ", "shen": "ʂən", "sheng": "ʂəŋ", "shi": "ʂɻ̩", "shou": "ʂou", "shu": "ʂu", "shua": "ʂua", "shuai": "ʂuai", "shuan": "ʂuan", "shuang": "ʂuɑŋ", "shui": "ʂuei", "shun": "ʂuən", "shuo": "ʂuɔ",
        "si": "sɹ̩", "song": "sʊŋ", "sou": "sou", "su": "su", "suan": "suan", "sui": "suei", "sun": "suən", "suo": "suɔ",
        "ta": "tʰa", "tai": "tʰai", "tan": "tʰan", "tang": "tʰɑŋ", "tao": "tʰau", "te": "tʰɤ", "teng": "tʰəŋ", "ti": "tʰi", "tian": "tʰien", "tiao": "tʰjau", "tie": "tʰiɛ", "ting": "tʰiŋ", "tong": "tʰʊŋ", "tou": "tʰou", "tu": "tʰu", "tuan": "tʰuan", "tui": "tʰuei", "tun": "tʰuən", "tuo": "tʰuɔ",
        "wa": "ua", "wai": "uai", "wan": "uan", "wang": "uɑŋ", "wei": "uei", "wen": "uən", "weng": "uəŋ", "wo": "uɔ", "wu": "u",
        "xi": "ɕi", "xia": "ɕia", "xian": "ɕien", "xiang": "ɕjɑŋ", "xiao": "ɕjau", "xie": "ɕiɛ", "xin": "ɕin", "xing": "ɕiŋ", "xiong": "ɕʊŋ", "xiu": "ɕiou", "xu": "ɕy", "xuan": "ɕyan", "xue": "ɕyœ", "xun": "ɕyn",
        "ya": "ia", "yan": "ien", "yang": "jɑŋ", "yao": "jau", "ye": "iɛ", "yi": "i", "yin": "in", "ying": "iŋ", "yo": "iɔ", "yong": "ʊŋ", "you": "iou", "yu": "y", "yuan": "yan", "yue": "yœ", "yun": "yn",
        "za": "tsa", "zai": "tsai", "zan": "tsan", "zang": "tsɑŋ", "zao": "tsau", "ze": "tsɤ", "zei": "tsei", "zen": "tsən", "zeng": "tsəŋ", "zha": "ʈʂa", "zhai": "ʈʂai", "zhan": "ʈʂan", "zhang": "ʈʂɑŋ", "zhao": "ʈʂau", "zhe": "ʈʂɤ", "zhen": "ʈʂən", "zheng": "ʈʂəŋ", "zhi": "ʈʂɻ̩", "zhong": "ʈʂʊŋ", "zhou": "ʈʂou", "zhu": "ʈʂu", "zhua": "ʈʂua", "zhuai": "ʈʂuai", "zhuan": "ʈʂuan", "zhuang": "ʈʂuɑŋ", "zhui": "ʈʂuei", "zhun": "ʈʂuən", "zhuo": "ʈʂuɔ",
        "zi": "tsɹ̩", "zong": "tsʊŋ", "zou": "tsou", "zu": "tsu", "zuan": "tsuan", "zui": "tsuei", "zun": "tsuən", "zuo": "tsuɔ"
      };
    return input
      .toLowerCase()
      .split(/\s+/)
      .map(p => pinyinMap[p] || `[${p}]`)
      .join(" ");
  };
  
  const ipaToARPAbet = (ipaStr: string) => {
    const ipaToArpaMap: Record<string, string> = {
      // 子音
      "pʰ": "P", "p": "P",
      "tʰ": "T", "t": "T",
      "kʰ": "K", "k": "K",
      "m": "M", "n": "N", "ŋ": "NG",
      "f": "F", "v": "V", "l": "L", "r": "R",
      "ts": "TS", "tsʰ": "TS", "dz": "DZ",
      "s": "S", "z": "Z", "ʂ": "SH", "ʐ": "ZH",
      "tɕ": "CH", "tɕʰ": "CH", "dʑ": "JH",
      "ɕ": "SH", "ʑ": "ZH",
      "ʈʂ": "CH", "ʈʂʰ": "CH", "ɻ": "ER",
  
      // 母音（無重音）
      "a": "AA", "ɑ": "AA", "ɤ": "ER", "ə": "AH", "ɛ": "EH",
      "e": "EH", "o": "OW", "u": "UW", "ʊ": "UH", "i": "IY", "y": "IH", "œ": "OE",
      "ai": "AY", "ei": "EY", "au": "AW", "ou": "OW",
      "ia": "YA", "ie": "YE", "ua": "WA", "uo": "WO",
  
      // 複合元音（合併簡化）
      "an": "AE N", "en": "EH N", "in": "IH N", "ɑŋ": "AA NG", "iŋ": "IH NG", "ʊŋ": "UH NG", "əŋ": "AH NG",
      "uɔ": "W AO", "uei": "W EY", "iou": "Y UW", "yœ": "Y OE", "yan": "Y AE", "yn": "Y N"
    };
    return ipaStr.split("").map((ch: string | number) => ipaToArpaMap[ch] || `[${ch}]`).join(" ");
    // return ipaStr
    //   .split(/\s+/)
    //   .map(syllable => {
    //     // 依照長度排序來確保匹配複合音優先（例如ʈʂʰ > ʈʂ）
    //     const sortedKeys = Object.keys(ipaToArpaMap).sort((a, b) => b.length - a.length);
    //     for (const k of sortedKeys) {
    //       if (syllable.includes(k)) {
    //         return syllable.replace(k, ipaToArpaMap[k]);
    //       }
    //     }
    //     return `[${syllable}]`; // fallback
    //   })
    //   .join(" ");
  };


  export const pinyinToArpabet = (pinyinStr: string) => {
    const ipa = pinyinToIPA(pinyinStr);
    const arpa = ipaToARPAbet(ipa);
    //console.log("pinyinStr", pinyinStr)
    //console.log("ipa", ipa)
    //console.log("arpa", arpa)
    return arpa;
  };

// export function pinyinToArpabet(pinyin: string): string {
//     const map: Record<string, string> = {
//       a: "AA", ai: "AY", an: "AE N", ang: "AO NG", ao: "AW",
//       ba: "B AA", bai: "B AY", ban: "B AE N", bang: "B AO NG", bao: "B AW",
//       bei: "B EY", ben: "B EH N", bi: "B IY", bie: "B Y EH", bin: "B IY N",
//       bing: "B IH NG", bo: "B AO", bu: "B UW", ca: "TS AA", ce: "TS AH",
//       chi: "CH IH", chu: "CH UW", da: "D AA", de: "D AH", di: "D IY", du: "D UW",
//       e: "AH", en: "AH N", er: "ER", fa: "F AA", fo: "F AO", fu: "F UW",
//       ge: "G AH", gu: "G UW", ha: "HH AA", he: "HH AH", hu: "HH UW",
//       ji: "JH IY", ju: "JH UW", ka: "K AA", ke: "K AH", ku: "K UW",
//       la: "L AA", le: "L AH", li: "L IY", lu: "L UW", ma: "M AA", me: "M EH",
//       mi: "M IY", mu: "M UW", na: "N AA", ne: "N AH", ni: "IY", nu: "N UW",
//       o: "AO", ou: "OW", pa: "P AA", po: "P AO", qi: "CH IY", qu: "CH UW",
//       ran: "R AE N", re: "R AH", ri: "R IH", ru: "R UW", sa: "S AA", se: "S EH",
//       shi: "SH IH", si: "S IY", ta: "T AA", te: "T AH", ti: "T IY", tu: "T UW",
//       wa: "W AA", wo: "W AO", wu: "W UW", xi: "SH IY", xu: "SH UW",
//       ya: "Y AA", ye: "Y EH", yi: "IY", yo: "Y AO", you: "Y OW", yu: "Y UW",
//       za: "Z AA", ze: "Z AH", zha: "JH AA", zhi: "JH IH", zu: "Z UW", hao: "AW",
//       cai: "T AY",
//       guo: "AO",
//       tang: "NG",
//     };
//     const base = pinyin.replace(/[1-5]/g, "").toLowerCase();
//     return map[base] ?? "";
//   }