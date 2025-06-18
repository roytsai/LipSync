import { Canvas } from "@react-three/fiber";
import React, { useEffect, useRef, useState } from "react";
import GLBModel from "@/modules/GLBModel";
import CameraScene from "@/modules/CameraScene";
import { VisemeUtterance } from "@/class/VisemeUtterance";
import {
  TTSresultItem,
  useSpeechRecognition,
} from "@/hooks/useSpeechRecognition";

const A2F: React.FC = () => {
  const [text, setText] = useState("");
  const [viseme, setViseme] = useState<string[]>([]);
  const [duration, setDuration] = useState(150);

  const [speak, setSpeak] = useState(false);
  const url = "/models/asus_boss3.glb";
  const [subTitle, setSubTitle] = useState("");
  const ttsResultQueue = useRef<TTSresultItem[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  const testTime = useRef(0);

  const { isRecording, startRecord, stopRecord, recognitionResult, ttsResult } =
    useSpeechRecognition();

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
  async function mergeAudioChunks(base64Chunks: string[]): Promise<Blob> {
    const audioCtx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const decodedBuffers: AudioBuffer[] = [];

    for (const base64 of base64Chunks) {
      try {
        const buffer = base64ToArrayBuffer(base64);

        const audioBuffer = await audioCtx.decodeAudioData(buffer.slice(0));

        if (!audioBuffer || audioBuffer.length === 0) {
          console.warn("kkkkkkkkkk Empty or invalid audio buffer, skipped.");
          continue;
        }

        // 確保格式一致
        if (decodedBuffers.length > 0) {
          const ref = decodedBuffers[0];
          if (
            audioBuffer.sampleRate !== ref.sampleRate ||
            audioBuffer.numberOfChannels !== ref.numberOfChannels
          ) {
            console.warn("Mismatched audio format, skipped.");
            continue;
          }
        }

        decodedBuffers.push(audioBuffer);
      } catch (err) {
        console.error("kkkkkkkkkk Failed to decode audio chunk", err);
      }
    }

    if (decodedBuffers.length === 0) {
      throw new Error("kkkkkkkkkk No valid audio chunks.");
    }

    // 合併
    const totalLength = decodedBuffers.reduce((sum, b) => sum + b.length, 0);
    const sampleRate = decodedBuffers[0].sampleRate;
    const numChannels = decodedBuffers[0].numberOfChannels;
    const output = audioCtx.createBuffer(numChannels, totalLength, sampleRate);

    for (let ch = 0; ch < numChannels; ch++) {
      let offset = 0;
      for (const buf of decodedBuffers) {
        output.getChannelData(ch).set(buf.getChannelData(ch), offset);
        offset += buf.length;
      }
    }

    return audioBufferToWavBlob(output);
  }

  async function runAsrWordAlign() {
    if (ttsResultQueue.current.length == 0 || speak) {
      return;
    }
    const result = ttsResultQueue.current.shift();
    testTime.current = Date.now();

    const blob = await mergeAudioChunks(result!.ttsAudio);
    const url = URL.createObjectURL(blob);

    const audioBuffer = await blob.arrayBuffer();
    console.warn(
      "kkkkkkkkkk 轉audio buffer 時間:",
      Date.now() - testTime.current
    );

    try {
      const alignResult = result!.alignResult;
      const wordSegments = alignResult.flatMap(
        (item: { start: number; end: number; word: string }, index: number) => {
          const start = item.start;
          const end = item.end;
          const word = item.word;
          if (
            index < alignResult.length - 1 &&
            end != alignResult[index + 1].start
          ) {
            return [
              { start, end, word },
              {
                start: end,
                end: alignResult[index + 1].start,
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
                ? ((end - start) / viseme.length) * 1000
                : (end - start) * 1000
            );
            setText(word);
            setViseme(viseme);
          },
          onLastViseme: (viseme, word, start, end) => {
            console.log("onLastViseme:", viseme, word, start, end);
            setDuration(
              viseme.length > 0
                ? ((end - start) / viseme.length) * 1000
                : (end - start) * 1000
            );
            setText(word);
            setViseme(viseme);
            if (ttsResultQueue.current.length > 0) {
              setSpeak(false);
              runAsrWordAlign();
            } else {
              setTimeout(() => {
                setText("");
                setViseme([]);
                stopRecording();
              }, 500);
            }
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

    // testTime.current = Date.now();
    // aligner.align(
    //   audioBuffer,
    //   text,
    //   (result) => {
    //     console.warn("kkkkkkkkkk ASR 時間:", Date.now() - testTime.current);
    //     console.log("對齊結果：", result);
    //     try {
    //       const wordSegments = result.flatMap(
    //         (
    //           item: { start: number; end: number; word: string },
    //           index: number
    //         ) => {
    //           const start = item.start;
    //           const end = item.end;
    //           const word = item.word;
    //           if (index < result.length - 1 && end != result[index + 1].start) {
    //             return [
    //               { start, end, word },
    //               {
    //                 start: end,
    //                 end: result[index + 1].start,
    //                 word: ",",
    //               },
    //             ];
    //           } else {
    //             return [{ start, end, word }];
    //           }
    //         }
    //       );

    //       const fullText = wordSegments
    //         .map((segment: { word: any }) => segment.word)
    //         .join("");
    //       console.warn("語音辨識結果物件(原始):", result);
    //       console.log("語音辨識結果物件(轉過):", wordSegments);

    //       if (wordSegments) {
    //         // const wordSegments = data.segments[0].words.filter(
    //         //   (w: { word: string }) => /[\u4e00-\u9fa5]/.test(w.word)
    //         // ); //把標點移除

    //         const utterance = new VisemeUtterance({
    //           audioBuffer: audioBuffer,
    //           wordSegments: wordSegments,
    //           onViseme: (viseme, word, start, end) => {
    //             setDuration(
    //               viseme.length > 0
    //                 ? ((end - start) / viseme.length) * 1000
    //                 : (end - start) * 1000
    //             );
    //             setText(word);
    //             setViseme(viseme);
    //           },
    //           onLastViseme: (viseme, word, start, end) => {
    //             console.log("onLastViseme:", viseme, word, start, end);
    //             setDuration(
    //               viseme.length > 0
    //                 ? ((end - start) / viseme.length) * 1000
    //                 : (end - start) * 1000
    //             );
    //             setText(word);
    //             setViseme(viseme);
    //             setTimeout(() => {
    //               setText("");
    //               setViseme([]);
    //               stopRecording();
    //             }, 500);
    //           },
    //           onEnd: () => {
    //             console.log("onEnd:");
    //           },
    //         });
    //         utterance.play();
    //         setSpeak(true);
    //       }
    //     } catch (e) {
    //       console.log("errrrrrrr:", e);
    //       setSpeak(false);
    //     }
    //     if (speekNumber.current == 5) {
    //       speekNumber.current = 1;
    //     } else {
    //       speekNumber.current = speekNumber.current + 1;
    //     }
    //     speekNumber.current = 2;
    //   },
    //   result!.alignResult,
    //   (err) => {
    //     console.error("錯誤：", err);
    //   }
    // );
  }

  useEffect(() => {
    if (ttsResult != null) {
      ttsResultQueue.current.push(ttsResult);
      runAsrWordAlign();
    }
  }, [ttsResult]);

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
        <div className="flex items-center gap-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? "分析中....." : "開始ASR"}
          </button>
        </div>

        <div className="mt-4 p-4 border rounded bg-gray-100 text-black whitespace-pre-wrap">
          {recognitionResult}
        </div>
      </div>
    </div>
  );
};

export default A2F;
