import { Canvas } from "@react-three/fiber";
import React, { useEffect, useRef, useState } from "react";
import GLBModel from "../../../modules/GLBModel";
import CameraScene from "../../../modules/CameraScene";
import { VisemeUtterance } from "@/class/VisemeUtterance";

const WhisperStream: React.FC = () => {
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

  const speekNumber = useRef(3);

  const startRecording = async () => {
    const ws = new WebSocket("ws://localhost:8765");
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      wsRef.current!.send(
        `/Users/irobot13/Gary/lip_sync_test/lip_sync/public/idle_${speekNumber.current}.wav`
      );
    };

    ws.onmessage = (event) => {
      const text = typeof event.data === "string" ? event.data : "";
      //setTranscript((prev) => prev + text);
      try {
        const data = JSON.parse(text); // ← 將 JSON 字串轉為 JS 物件

        console.log("語音辨識結果物件:", data);

        console.log("完整句子jjjjj:", data.segments[0]);
        if (data.segments) {
          // const wordSegments = data.segments[0].words.filter(
          //   (w: { word: string }) => /[\u4e00-\u9fa5]/.test(w.word)
          // ); //把標點移除

          const wordSegments = data.segments[0].words;

          const utterance = new VisemeUtterance({
            audioUrl: `/idle_${speekNumber.current}.wav`,
            wordSegments: wordSegments,
            onViseme: (viseme, word, start, end) => {
              setDuration(
                viseme.length > 0 ? ((end - start) / viseme.length) * 1000 : 10
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
          setTranscript(data.segments[0].text);
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
      //speekNumber.current = 3;
    };

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
          {isRecording ? "分析中....." : "開始Wisper"}
        </button>
        <div className="mt-4 p-4 border rounded bg-gray-100 text-black whitespace-pre-wrap">
          {transcript || "語音文字將顯示於此..."}
        </div>
      </div>
    </div>
  );
};

export default WhisperStream;
