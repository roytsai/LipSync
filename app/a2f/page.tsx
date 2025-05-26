"use client";
import A2F from "@/feature/A2F/A2F";
import React, { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import FbxModel, { FbxModelHandle } from "./components/FbxModel";

function Page() {
  const fbxRef = useRef<FbxModelHandle>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const canvas = document.querySelector("canvas");
      if (canvas) {
        canvas.style.width = "100%";
        canvas.style.height = "100%";
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePlay = () => {
    audioRef.current!.play();         // 撥放音檔
    fbxRef.current!.playAnimation('animation1');  // 執行模型動畫

  };
  const handlePlay2 = () => {
    audioRef.current!.play();         // 撥放音檔
    fbxRef.current!.playAnimation('animation2');  // 執行模型動畫

  };

  return (
    <>
      <button
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          padding: "10px 20px",
          fontSize: "16px",
        }}
        onClick={handlePlay}
      >
        撥放動作1
      </button>

      <button
        style={{
          position: "absolute",
          top: 70,
          left: 20,
          zIndex: 10,
          padding: "10px 20px",
          fontSize: "16px",
        }}
        onClick={handlePlay2}
      >
        撥放動作2
      </button>

      <audio ref={audioRef} src="/idle_3.wav" />

      <Canvas
        style={{ width: "100vw", height: "100vh" }}
        camera={{ position: [0, 16, 30], fov: 40 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <FbxModel ref={fbxRef} url="/Sage_cc4_model_stand.Fbx" />
        {/* <GlbModel url="/Sage_cc4_model_stand_g.glb" /> */}
        <OrbitControls />
      </Canvas>
    </>
  );
}

export default Page;
