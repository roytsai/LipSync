// app/api/pinyin/route.ts
import { spawn } from "child_process";
import { NextRequest, NextResponse } from "next/server";
import { pinyinToArpabet } from "@/utils/pinyinToViseme";
import { phonemeToViseme } from "@/utils/phonemeToViseme";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");

  if (!text) {
    return NextResponse.json({ error: "請提供文字" }, { status: 400 });
  }

  return new Promise((resolve) => {
    const py = spawn("python3", ["./scripts/get_pinyin.py", text]);

    let result = "";
    py.stdout.on("data", (data) => {
      result += data.toString();
    });

    py.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
    });

    py.on("close", () => {
      try {
        
        const pinyin = JSON.parse(result);
        const arpabet = pinyin
          .map(pinyinToArpabet)       // e.g., "N IY"
          .flatMap((item: string) => item.split(" ")); // e.g., ["N", "IY"]
        const visemes = arpabet.map((p: string) => {
          const basePhoneme = p.replace(/[0-9]/g, ""); // 移除重音符號
          return phonemeToViseme[basePhoneme] ?? "viseme_sil";
        });
        resolve(NextResponse.json({ 
          text,
          pinyin,
          visemes,
          arpabet
        }));
      } catch (e) {
        resolve(NextResponse.json({ error: "Python 回傳資料無法解析" }, { status: 500 }));
      }
    });
  });
}
