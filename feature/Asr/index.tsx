import { Canvas } from "@react-three/fiber";
import React, { useRef, useState } from "react";
import GLBModel from "@/modules/GLBModel";
import CameraScene from "@/modules/CameraScene";
import { VisemeUtterance } from "@/class/VisemeUtterance";
import { AsrWordAligner } from "@/utils/asrWordAligner";

const A2F: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [text, setText] = useState("");
  const [viseme, setViseme] = useState<string[]>([]);
  const [duration, setDuration] = useState(150);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [speak, setSpeak] = useState(false);
  const url = "/models/face5.glb";
  const [subTitle, setSubTitle] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  const testTime = useRef(0);

  const speekNumber = useRef(2);
  const demoText = [
    "你好我是您的智慧健康小助手目前正在華碩服務",
    "要與我互動請按麥克風開始說話說完時再按一次",
    "您可以問我高血壓可以怎麼改善",
    "或是問我過敏才會氣喘嗎",
    "還可以問我胃鏡檢查需要準備什麼嗎",
  ];

  async function runAsrWordAlign(audioPath: string, text: string) {
    testTime.current = Date.now();
    const aligner = new AsrWordAligner();
    const response = await fetch(audioPath);
    const audioBuffer = await response.arrayBuffer();
    console.warn("轉audio buffer 時間:", Date.now() - testTime.current);

    testTime.current = Date.now();
    aligner.align(
      audioBuffer,
      text,
      (result) => {
        console.warn("ASR 時間:", Date.now() - testTime.current);
        console.log("對齊結果：", result);
        try {
          //const data = JSON.parse(result);
          const wordSegments = result.align_result.flatMap(
            (item: any[], index: number) => {
              const start = item[0];
              const end = result.align_result[index + 1]?.[0] ?? start + 0.1; // 如果最後一個，給預設長度 0.1 秒
              const word = item[1];

              if (end - start > 0.3) {
                return [
                  { start, end: start + 0.3, word },
                  { start: start + 0.3, end, word: "," },
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
              audioUrl: audioPath,
              wordSegments: wordSegments,
              onViseme: (viseme, word, start, end) => {
                setDuration(
                  viseme.length > 0
                    ? ((end - start) / viseme.length) * 1000 * 0.7
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
                  setTranscript("");
                  stopRecording();
                }, 200);
              },
              onEnd: () => {
                console.log("onEnd:");
              },
            });
            utterance.play();
            setTranscript(fullText);
            setSpeak(true);
            //utterance.play();
          } else {
            setTranscript("");
          }
        } catch (e) {
          setTranscript("");
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

  const startRecording = async () => {
    runAsrWordAlign(
      `/idle_${speekNumber.current}.wav`,
      demoText[speekNumber.current - 1]
    );
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    wsRef.current?.close();
    setIsRecording(false);
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
          {transcript || "語音文字將顯示於此..."}
        </div>
      </div>
    </div>
  );
};

export default A2F;
