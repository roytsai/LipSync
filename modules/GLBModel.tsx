import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { AnimationMixer } from "three";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import {
  OculusVisemes,
  phonemeToViseme,
  textToVisemes,
} from "@/utils/phonemeToViseme";
import { textToPinyin } from "@/utils/textToPinyin";
import { pinyinToArpabet } from "@/utils/pinyinToViseme";
import { GLTFLoader } from "three-stdlib";

type Props = {
  url: string;
  duration?: number;
  speak: boolean;
  viseme?: string[];
  text: string;
  setSpeak?: React.Dispatch<React.SetStateAction<boolean>>;
  setSubtitle?: React.Dispatch<React.SetStateAction<string>>;
  animation: "changePose" | "standTalk" | "";
};

export default function FaceModel({
  url,
  duration = 200,
  speak = false,
  text = "",
  viseme = [],
  setSpeak,
  setSubtitle,
  animation = "",
}: Props) {
  const { scene, animations } = useGLTF(url);
  const mesh = useRef<THREE.Mesh | null>(null);
  const morphDict = useRef<Record<string, number>>({});
  const morphInfluences = useRef<number[]>([]);
  const currentIndex = useRef(0);
  const elapsedTime = useRef(0);
  const currentViseme = useRef<string[] | null>(null);
  const mixer = useRef<AnimationMixer | null>(null);
  const changePose = useRef<THREE.AnimationAction | null>(null);
  const standTalk = useRef<THREE.AnimationAction | null>(null);

  const csvRef = useRef<string[][]>([]);

  const stopAllAnimation = () => {
    if (standTalk.current) {
      standTalk.current.stop();
    }
    if (changePose.current) {
      changePose.current.stop();
    }
  };

  async function fetchAndParseCSV(url: string): Promise<string[][]> {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);

      const text = await res.text();

      // 簡易 CSV 解析，將每行用換行切割，每行再用逗號切割
      const rows = text
        .trim()
        .split("\n")
        .map((line) => line.split(",").map((cell) => cell.trim()));

      return rows;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  const csvToArray = (csvString: string) => {
    const lines = csvString.trim().split("\n");
    return lines.map((line) => line.split(","));
  };

  useEffect(() => {
    fetchAndParseCSV("/animation_frames_1.csv").then((data) => {
      //console.log("csv: ", data[1]);
      // data 是 string[][]，例如：[ ["name", "age"], ["Gary", "30"] ]
      csvRef.current = data;
    });
  }, []);

  useEffect(() => {
    //stopAllAnimation();
    switch (animation) {
      case "":
        stopAllAnimation();
        break;
      case "changePose":
        if (changePose.current) {
          if (standTalk.current) {
            standTalk.current.crossFadeTo(changePose.current, 0.5, true);
            setTimeout(() => {
              standTalk.current!.stop();
            }, 0.5 * 1000);
          }
          changePose.current.play();
        }
        break;
      case "standTalk":
        if (standTalk.current) {
          if (changePose.current) {
            changePose.current.crossFadeTo(standTalk.current, 0.5, true);
            setTimeout(() => {
              changePose.current!.stop();
            }, 0.5 * 1000);
          }
          standTalk.current.play();
        }
        break;
    }
  }, [animation]);

  const isChinese = (text: string): boolean => {
    return /^[\u4e00-\u9fa5]+$/.test(text);
  };

  useEffect(() => {
    const head = scene.getObjectByName("AvatarHead") as THREE.Mesh;
    if (head) {
      mesh.current = head;
      morphDict.current = head.morphTargetDictionary || {};
      morphInfluences.current = head.morphTargetInfluences || [];
    } else {
      console.log("找不到 morph target 的 mesh，請確認名稱");
    }

    // if (animations.length > 0) {
    //   mixer.current = new AnimationMixer(scene);
    //   animations.forEach((clip) => {
    //     const action = mixer.current!.clipAction(clip);
    //     console.log("action", action);
    //     //action.play();
    //     //action.paused = true;
    //   });
    // }

    // const loader = new GLTFLoader();
    // loader.load("/models/change-pose.glb", (gltf) => {
    //   //console.log("llllllllllll gltf", gltf);
    //   const clip = gltf.animations[1]; // 假設一個 animation clip
    //   const action = mixer.current!.clipAction(clip); // 套用到主模型
    //   changePose.current = action;
    //   //action.play();
    // });

    // loader.load("/models/stand-talk.glb", (gltf) => {
    //   const clip = gltf.animations[1]; // 假設一個 animation clip
    //   const action = mixer.current!.clipAction(clip); // 套用到主模型
    //   standTalk.current = action;
    //   //action.play();
    // });
  }, [scene]);

  useEffect(() => {
    if (speak) {
      if (setSubtitle) {
        setSubtitle((prev) => prev + text);
      }
      const filtered = viseme.filter((item) => item !== "");
      if (filtered.length > 0) {
        currentViseme.current = filtered; //[firstNonEmpty!];
        currentIndex.current = 0;
      } else {
        currentViseme.current = [OculusVisemes[0]];
        currentIndex.current = 0;
      }
    } else {
      currentViseme.current = null;
      if (standTalk.current && url == "/models/Sage_cc4_model_idle01.glb") {
        standTalk.current.stop();
      }

      if (setSubtitle) {
        setSubtitle("");
      }
      if (mesh.current) {
        const influences = mesh.current.morphTargetInfluences!;
        for (let i = 0; i < influences.length; i++) {
          influences[i] = 0;
        }
      }
    }
  }, [speak, viseme]);

  useFrame((_, delta) => {
    mixer.current?.update(delta);
    if (!mesh.current) return;
    elapsedTime.current += delta * 1000;
    if (elapsedTime.current >= duration && currentViseme.current) {
      elapsedTime.current = 0;

      // 重置所有
      const influences = mesh.current.morphTargetInfluences!;
      if (currentIndex.current == 0) {
        for (let i = 0; i < influences.length; i++) {
          influences[i] = 0;
        }
      }

      const viseme = currentViseme.current[currentIndex.current];
      const index = morphDict.current[viseme];
      if (index !== undefined) {
        influences[index] = 0.8 / currentViseme.current.length;
      } else {
        console.warn(`找不到 viseme "${viseme}" 的 morph target`);
      }
      if (currentIndex.current < currentViseme.current.length - 1) {
        currentIndex.current += 1;
      }
    } else if (
      elapsedTime.current >= 150 &&
      currentViseme.current &&
      currentIndex.current === currentViseme.current.length - 1
    ) {
      currentViseme.current = null;
      const influences = mesh.current.morphTargetInfluences!;
      for (let i = 0; i < influences.length; i++) {
        influences[i] = 0;
      }
    }
  });

  return <primitive object={scene} />;
}
