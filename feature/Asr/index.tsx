import { Canvas } from "@react-three/fiber";
import React, { useEffect, useRef, useState } from "react";
import GLBModel from "@/modules/GLBModel";
import CameraScene from "@/modules/CameraScene";
import { VisemeUtterance } from "@/class/VisemeUtterance";
import { AsrWordAligner } from "@/utils/asrWordAligner";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

const A2F: React.FC = () => {
  const [text, setText] = useState("");
  const [viseme, setViseme] = useState<string[]>([]);
  const [duration, setDuration] = useState(150);
  const [speak, setSpeak] = useState(false);
  const url = "/models/face5.glb";
  const [subTitle, setSubTitle] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  const testTime = useRef(0);

  const speekNumber = useRef(2);

  const {
    isRecording,
    startRecord,
    stopRecord,
    recognitionResult,
    ttsAudio,
    ttsSentence,
  } = useSpeechRecognition();

  const demoText = [
    "你好我是您的智慧健康小助手目前正在華碩服務",
    "要與我互動請按麥克風開始說話說完時再按一次",
    "您可以問我高血壓可以怎麼改善",
    "或是問我過敏才會氣喘嗎",
    "還可以問我胃鏡檢查需要準備什麼嗎",
  ];

  function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numChannels * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    let offset = 0;
    writeString(offset, "RIFF");
    offset += 4;
    view.setUint32(offset, 36 + length, true);
    offset += 4;
    writeString(offset, "WAVE");
    offset += 4;
    writeString(offset, "fmt ");
    offset += 4;
    view.setUint32(offset, 16, true);
    offset += 4; // Subchunk1Size
    view.setUint16(offset, 1, true);
    offset += 2; // PCM format
    view.setUint16(offset, numChannels, true);
    offset += 2;
    view.setUint32(offset, sampleRate, true);
    offset += 4;
    view.setUint32(offset, sampleRate * numChannels * 2, true);
    offset += 4; // byte rate
    view.setUint16(offset, numChannels * 2, true);
    offset += 2; // block align
    view.setUint16(offset, 16, true);
    offset += 2; // bits per sample
    writeString(offset, "data");
    offset += 4;
    view.setUint32(offset, length, true);
    offset += 4;

    // 寫入 PCM data
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = audioBuffer.getChannelData(ch)[i];
        const s = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, s * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([buffer], { type: "audio/wav" });
  }

  // 將 base64 string 轉為 ArrayBuffer
  function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const cleaned = base64.replace(/[^A-Za-z0-9+/=]/g, "");
    const padded = cleaned + "=".repeat((4 - (cleaned.length % 4)) % 4);
    const binaryString = atob(padded);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // 合併 AudioBuffer
  async function mergeAudioChunks(
    base64Chunks: string[],
    mimeType = "audio/wav"
  ): Promise<Blob> {
    const audioCtx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const decodedBuffers: AudioBuffer[] = [];

    // 解碼所有 base64 chunk
    for (const base64 of base64Chunks) {
      const buffer = base64ToArrayBuffer(base64);
      const audioBuffer = await audioCtx.decodeAudioData(buffer.slice(0)); // 注意 .slice() 解決 Safari bug
      decodedBuffers.push(audioBuffer);
    }

    // 計算總長度
    const totalLength = decodedBuffers.reduce(
      (sum, buf) => sum + buf.length,
      0
    );
    const numberOfChannels = decodedBuffers[0].numberOfChannels;
    const sampleRate = decodedBuffers[0].sampleRate;

    // 建立合併後的 buffer
    const output = audioCtx.createBuffer(
      numberOfChannels,
      totalLength,
      sampleRate
    );

    for (let channel = 0; channel < numberOfChannels; channel++) {
      let offset = 0;
      for (const buffer of decodedBuffers) {
        output
          .getChannelData(channel)
          .set(buffer.getChannelData(channel), offset);
        offset += buffer.length;
      }
    }

    // 將 AudioBuffer 導出為 WAV Blob（使用 helper）
    return audioBufferToWavBlob(output);
  }

  async function runAsrWordAlign(base64Audio: string[], text: string) {
    testTime.current = Date.now();
    const aligner = new AsrWordAligner();
    //const response = await fetch(audioPath);
    //const audioBuffer = await response.arrayBuffer();
    //console.warn("轉audio buffer 時間:", Date.now() - testTime.current);
    const blob = await mergeAudioChunks(base64Audio);
    const url = URL.createObjectURL(blob);

    const audioBuffer = await blob.arrayBuffer();

    testTime.current = Date.now();
    aligner.align(
      audioBuffer,
      text,
      (result) => {
        console.warn("ASR 時間:", Date.now() - testTime.current);
        console.log("對齊結果：", result);
        try {
          const wordSegments = result.align_result.flatMap(
            (
              item: { start: number; end: number; word: string },
              index: number
            ) => {
              const start = item.start;
              const end = item.end;
              const word = item.word;
              if (
                index < result.align_result.length - 1 &&
                end != result.align_result[index + 1].start
              ) {
                return [
                  { start, end, word },
                  {
                    start: end,
                    end: result.align_result[index + 1].start,
                    word: ",",
                  },
                ];
              } else {
                return [{ start, end, word }];
              }
            }
          );

          const fullText = wordSegments
            .map((segment: { word: any }) => segment.word)
            .join("");
          console.warn("語音辨識結果物件(原始):", result);
          console.log("語音辨識結果物件(轉過):", wordSegments);

          if (wordSegments) {
            // const wordSegments = data.segments[0].words.filter(
            //   (w: { word: string }) => /[\u4e00-\u9fa5]/.test(w.word)
            // ); //把標點移除

            const utterance = new VisemeUtterance({
              audioBuffer: audioBuffer,
              wordSegments: wordSegments,
              onViseme: (viseme, word, start, end) => {
                setDuration(
                  viseme.length > 0
                    ? ((end - start) / viseme.length) * 1000 * 0.5
                    : 10
                );
                setText(word);
                setViseme(viseme);
              },
              onLastViseme: (viseme, word, start, end) => {
                console.log("onLastViseme:", viseme, word, start, end);
                setText(word);
                setViseme(viseme);
                setTimeout(() => {
                  setText("");
                  setViseme([]);
                  stopRecording();
                }, 500);
              },
              onEnd: () => {
                console.log("onEnd:");
              },
            });
            utterance.play();
            setSpeak(true);
          }
        } catch (e) {
          console.log("errrrrrrr:", e);
          setSpeak(false);
        }
        if (speekNumber.current == 5) {
          speekNumber.current = 1;
        } else {
          speekNumber.current = speekNumber.current + 1;
        }
        speekNumber.current = 2;
      },
      (err) => {
        console.error("錯誤：", err);
      }
    );
  }

  useEffect(() => {
    if (ttsAudio.length > 0 && ttsSentence.length > 0) {
      runAsrWordAlign(ttsAudio, ttsSentence);
    }
  }, [ttsAudio, ttsSentence]);

  const startRecording = async () => {
    const record_para = "record_newMed_dictation"; //// **全時收音參數**  "record_dictation_use4lang"
    startRecord(
      record_para,
      () => {},
      () => {}
    );
  };

  const stopRecording = () => {
    stopRecord();
    setSpeak(false);
  };

  return (
    <div
      style={{
        height: "97vh",
        width: "99vw",
        backgroundColor: "#2d2d2d",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
      }}
    >
      <Canvas camera={{ position: [0, 0, 10], fov: 10 }}>
        <ambientLight />
        <directionalLight position={[-3.77, 14.86, 363.63]} intensity={1} />

        <GLBModel
          url={url}
          text={text}
          viseme={viseme}
          speak={speak}
          setSpeak={setSpeak}
          setSubtitle={setSubTitle}
          duration={duration} // 英文: 150 中文: 350
          animation={""}
        />
        {/* <FBXModel
                url={url}
                text={text}
                speak={speak}
                setSpeak={setSpeak}
                setSubtitle={setSubTitle}
                duration={150} // 英文: 150 中文: 350
                animation={animation}
              /> */}

        <CameraScene
          enableZoom={true}
          enablePan={true}
          rotateSpeed={0.8}
          zoomSpeed={0.5}
        />
      </Canvas>
      <div
        ref={boxRef}
        className="flex justify-center items-center h-[40px] overflow-auto"
      >
        {subTitle}
      </div>
      <div className="p-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? "分析中....." : "開始ASR"}
        </button>
        <div className="mt-4 p-4 border rounded bg-gray-100 text-black whitespace-pre-wrap">
          {recognitionResult}
        </div>
      </div>
    </div>
  );
};

export default A2F;
