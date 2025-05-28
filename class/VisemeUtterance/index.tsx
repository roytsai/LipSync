import { phonemeToViseme } from "@/utils/phonemeToViseme";
import { pinyinToArpabet } from "@/utils/pinyinToViseme";
import { textToPinyin } from "@/utils/textToPinyin";

type WordSegment = {
  word: string;
  start: number;
  end: number;
  score?: number;
};

type VisemeUtteranceOptions = {
  wordSegments: WordSegment[];
  audioUrl: string;
  onViseme?: (
    viseme: string[],
    word: string,
    start: number,
    end: number
  ) => void;
  onLastViseme?: (
    viseme: string[],
    word: string,
    start: number,
    end: number
  ) => void;
  onEnd?: () => void;
};

export class VisemeUtterance {
  private audio: HTMLAudioElement;
  private wordSegments: WordSegment[];
  private onViseme?: (
    viseme: string[],
    word: string,
    start: number,
    end: number
  ) => void;
  private onLastViseme?: (
    viseme: string[],
    word: string,
    start: number,
    end: number
  ) => void;
  private onEnd?: () => void;
  private rafId: number | null = null;
  private startTime = 0;
  private triggered = new Set<number>();
  private lastIndex: number;

  constructor({
    wordSegments,
    audioUrl,
    onViseme,
    onLastViseme,
    onEnd,
  }: VisemeUtteranceOptions) {
    this.wordSegments = wordSegments;
    this.audio = new Audio(audioUrl);
    this.audio.onended = () => {
      this.stopLoop();
      onEnd?.();
    };
    this.onViseme = onViseme;
    this.onLastViseme = onLastViseme;
    this.onEnd = onEnd;
    this.lastIndex = wordSegments.length - 1;
  }

  play() {
    this.triggered.clear();
    this.audio.currentTime = 0;
    this.audio.play().then(() => {
      this.startTime = performance.now();
      this.startLoop();
    });
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.stopLoop();
  }

  private startLoop() {
    const check = () => {
      const currentTime = this.audio.currentTime;
      for (let i = 0; i < this.wordSegments.length; i++) {
        const seg = this.wordSegments[i];
        if (!this.triggered.has(i) && currentTime >= seg.start) {
          const pinyins = textToPinyin(seg.word);
          //console.log("pinyins: ", pinyins);
          let phonemes = pinyins
            .map((p) => pinyinToArpabet(p) ?? "")
            .join(" ")
            .trim()
            .split(" ")
            .map((p) => p.replace(/[0-9]/g, ""));

          //phonemes = phonemes.length > 2 ? phonemes.slice(0, 2) : phonemes;
          const visemes = phonemes.map((p) => {
            const basePhoneme = p.replace(/[0-9]/g, ""); // 移除重音符號
            return phonemeToViseme[basePhoneme] ?? "";
          });
          console.warn(seg);
          console.log(visemes);
          if (i === this.lastIndex) {
            this.onLastViseme?.(
              visemes.filter(Boolean),
              seg.word,
              seg.start,
              seg.end
            );
          } else {
            this.onViseme?.(
              visemes.filter(Boolean),
              seg.word,
              seg.start,
              seg.end
            );
          }
          this.triggered.add(i);
        }
      }
      this.rafId = requestAnimationFrame(check);
    };
    this.rafId = requestAnimationFrame(check);
  }

  private stopLoop() {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
