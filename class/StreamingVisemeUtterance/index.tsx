import { phonemeToViseme } from "@/utils/phonemeToViseme";
import { pinyinToArpabet } from "@/utils/pinyinToViseme";
import { textToPinyin } from "@/utils/textToPinyin";

type WordSegment = {
  word: string;
  start: number;
  end: number;
};

interface StreamingVisemeUtteranceOptions {
  onViseme?: (
    visemes: string[],
    word: string,
    start: number,
    end: number
  ) => void;
  onLastViseme?: (
    visemes: string[],
    word: string,
    start: number,
    end: number
  ) => void;
  onEnd?: () => void;
}

interface AudioSegment {
  audioBuffer: ArrayBuffer;
  wordSegments: WordSegment[];
  index: number;
  total: number;
}

export class StreamingVisemeUtterance {
  private audioCtx = new AudioContext();
  private queue: AudioSegment[] = [];
  private currentSource?: AudioBufferSourceNode;
  private rafId: number | null = null;
  private triggered = new Set<number>();
  private startTime = 0;
  private onViseme?: StreamingVisemeUtteranceOptions["onViseme"];
  private onLastViseme?: StreamingVisemeUtteranceOptions["onLastViseme"];
  private onEnd?: StreamingVisemeUtteranceOptions["onEnd"];
  private currentSegments: WordSegment[] = [];
  //private currentTime = 0;

  constructor(options: StreamingVisemeUtteranceOptions) {
    this.onViseme = options.onViseme;
    this.onLastViseme = options.onLastViseme;
    this.onEnd = options.onEnd;
  }

  async appendSegment(segment: AudioSegment) {
    this.queue.push(segment);

    // 如果沒有在播放中，開始播放
    if (!this.currentSource) {
      this.playNextSegment();
    }
  }

  stop() {
    this.currentSource?.stop();
    this.stopLoop();
    this.queue = [];
    this.currentSource = undefined;
  }

  private async playNextSegment() {
    if (this.queue.length === 0) {
      this.onEnd?.();
      return;
    }

    const { audioBuffer, wordSegments, index, total } = this.queue.shift()!;
    //this.currentSegments = wordSegments;
    if (index == 1) {
      this.currentSegments = wordSegments;
      this.triggered.clear();
      this.startTime = this.audioCtx.currentTime;
      //this.currentTime = 0;
    }

    const decoded = await this.audioCtx.decodeAudioData(audioBuffer.slice(0));
    const source = this.audioCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(this.audioCtx.destination);
    //this.startTime = this.audioCtx.currentTime;
    this.currentSource = source;

    source.onended = () => {
      this.stopLoop();
      this.currentSource = undefined;
      this.playNextSegment();
    };

    source.start(0);
    this.startLoop();
  }

  private startLoop() {
    const check = () => {
      const currentTime = this.audioCtx.currentTime - this.startTime;
      const lastIndex = this.currentSegments.length - 1;
      0;
      for (let i = 0; i < this.currentSegments.length; i++) {
        const seg = this.currentSegments[i];
        if (!this.triggered.has(i) && currentTime >= seg.start) {
          const pinyins = textToPinyin(seg.word);
          const phonemes = pinyins
            .map((p) => pinyinToArpabet(p) ?? "")
            .join(" ")
            .trim()
            .split(" ")
            .map((p) => p.replace(/[0-9]/g, ""));

          const visemes = phonemes.map(
            (p) => phonemeToViseme[p.replace(/[0-9]/g, "")] ?? ""
          );

          const callback = i === lastIndex ? this.onLastViseme : this.onViseme;
          callback?.(visemes.filter(Boolean), seg.word, seg.start, seg.end);
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
