"use client";

import GLBModel from "@/modules/GLBModel";
import CameraScene from "@/modules/CameraScene";
import FBXModel from "@/modules/FBXModel";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";

const Page = () => {
  const [text, setText] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [animation, setAnimation] = useState<"changePose" | "standTalk" | "">(
    ""
  );
  const [speak, setSpeak] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const url = "/models/Sage_0514test/Sage_Model/Sage_cc4_model(0514_V2).glb";
  //const url = "/models/face5.glb";

  //   useEffect(() => {
  //     const getVisemeSequence = async (text: string) => {
  //       const res = await fetch(`/api/pinyin?text=${encodeURIComponent(text)}`);
  //       const data = await res.json();
  //       setVisemeSequence(data.visemes);
  //     };

  //     getVisemeSequence("大家好");
  //   }, []);

  useEffect(() => {
    // 每次 content 變化時，滾動到最上方
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [subTitle]);

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
          speak={speak}
          setSpeak={setSpeak}
          setSubtitle={setSubTitle}
          duration={150} // 英文: 150 中文: 350
          animation={animation}
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
      <div
        style={{
          width: "100%",
          height: "20vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: "rgba(45, 45, 45, 0.9)",
          boxSizing: "border-box",
        }}
      >
        <button
          onClick={() => {
            setAnimation("changePose");
          }}
          style={{
            marginLeft: "10px",
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.3s ease",
          }}
        >
          changePose
        </button>
        <button
          onClick={() => {
            setAnimation("standTalk");
          }}
          style={{
            marginLeft: "10px",
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.3s ease",
          }}
        >
          standTalk
        </button>
        <button
          onClick={() => {
            setAnimation("");
          }}
          style={{
            marginLeft: "10px",
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.3s ease",
          }}
        >
          stop All
        </button>
      </div>
      <div
        style={{
          width: "100%",
          height: "20vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: "rgba(45, 45, 45, 0.9)",
          boxSizing: "border-box",
        }}
      >
        <textarea
          rows={4}
          value={text}
          placeholder="Type something..."
          style={{
            padding: "10px",
            width: "70%",
            borderRadius: "10px",
            border: "1px solid #555",
            resize: "none",
            fontSize: "16px",
            backgroundColor: "#1e1e1e",
            color: "#fff",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            boxSizing: "border-box",
          }}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={() => {
            setSpeak(true);
          }}
          style={{
            marginLeft: "10px",
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.3s ease",
          }}
        >
          Speak
        </button>
      </div>
    </div>
  );
};

export default Page;
