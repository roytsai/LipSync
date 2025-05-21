import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { AnimationMixer } from "three";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { phonemeToViseme, textToVisemes } from "@/utils/phonemeToViseme";
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

  const isUseWispre: boolean = true;

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
    const head = scene.getObjectByName("Wolf3D_Head") as THREE.Mesh;
    if (head) {
      console.log("head ", head);
      mesh.current = head;
      morphDict.current = head.morphTargetDictionary || {};
      morphInfluences.current = head.morphTargetInfluences || [];
    } else {
      console.log("找不到 morph target 的 mesh，請確認名稱");
    }

    if (animations.length > 0) {
      mixer.current = new AnimationMixer(scene);
      animations.forEach((clip) => {
        const action = mixer.current!.clipAction(clip);
        console.log("action", action);
        //action.play();
        //action.paused = true;
      });
    }

    const loader = new GLTFLoader();
    loader.load("/models/change-pose.glb", (gltf) => {
      //console.log("llllllllllll gltf", gltf);
      const clip = gltf.animations[1]; // 假設一個 animation clip
      const action = mixer.current!.clipAction(clip); // 套用到主模型
      changePose.current = action;
      //action.play();
    });

    loader.load("/models/stand-talk.glb", (gltf) => {
      const clip = gltf.animations[1]; // 假設一個 animation clip
      const action = mixer.current!.clipAction(clip); // 套用到主模型
      standTalk.current = action;
      //action.play();
    });
  }, [scene]);

  useEffect(() => {
    if (speak) {
      if (isUseWispre) {
        //if (!text) return;
        if (setSubtitle) {
          setSubtitle((prev) => prev + text);
        }
        const filtered = viseme.filter((item) => item !== "");
        if (filtered.length > 0) {
          console.log(filtered);
          currentViseme.current = filtered; //[firstNonEmpty!];
          currentIndex.current = 0;
        }
        return;
      }
    
      if (standTalk.current && url == "/models/Sage_cc4_model_idle01.glb") {
        standTalk.current.play();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const lang = "zh-TW"; //"en-US"
      utterance.lang = lang;
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((v) => v.lang === lang);
      if (voice) utterance.voice = voice;
      utterance.rate = 1;
      const words = text.toUpperCase().split("");
  
      utterance.onboundary = async (event) => {
        //const word = words[(event.charIndex, event.charLength)];
        const start = event.charIndex;
        const end = event.charIndex + event.charLength;
        const word = text.slice(start, end);
        console.log('word:'+word);
        if (!word) return;
        if (setSubtitle) {
          setSubtitle(text.slice(0, end));
        }
        console.warn("word: ", word);
        if (isChinese(word)) {
          const pinyins = textToPinyin(word);
          console.log("pinyins: ", pinyins);
          let phonemes = pinyins
            .map((p) => pinyinToArpabet(p) ?? "")
            .join(" ")
            .trim()
            .split(" ")
            .map((p) => p.replace(/[0-9]/g, ""));

          phonemes = phonemes.length > 2 ? phonemes.slice(0, 2) : phonemes;
          console.log("phonemes: ", phonemes);
          const visemes = phonemes.map((p) => {
            const basePhoneme = p.replace(/[0-9]/g, ""); // 移除重音符號
            return phonemeToViseme[basePhoneme] ?? "";
          });
          console.log(`kk: `, visemes);
          const firstNonEmpty = visemes.find((item) => item !== "");
          const filtered = visemes.filter((item) => item !== "");
          if (filtered.length > 0) {
            currentViseme.current = filtered; //[firstNonEmpty!];
            currentIndex.current = 0;
          }
        } else {
          const phoneme = word.toUpperCase();
          const viseme = textToVisemes(phoneme);
          if (viseme) {
            currentViseme.current = viseme;
            currentIndex.current = 0;
            // setTimeout(() => {
            //   if (currentViseme.current === viseme) {
            //     currentViseme.current = null;
            //   }
            // }, 150);
          }
        }
      };

      utterance.onend = () => {
        console.log("Speech ended, resetting viseme");

        setTimeout(() => {
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
        }, 300);
      };

      speechSynthesis.speak(utterance);
      if (setSpeak) {
        setSpeak(false);
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
      // setTimeout(() => {
      //   currentViseme.current = null;
      //   if (standTalk.current && url == "/models/Sage_cc4_model_idle01.glb") {
      //     standTalk.current.stop();
      //   }

      //   if (setSubtitle) {
      //     setSubtitle("");
      //   }
      //   if (mesh.current) {
      //     const influences = mesh.current.morphTargetInfluences!;
      //     for (let i = 0; i < influences.length; i++) {
      //       influences[i] = 0;
      //     }
      //   }
      // }, 10);
    }
  }, [speak, viseme]);
  let test = 1;
  useFrame((_, delta) => {
    mixer.current?.update(delta);
    // elapsedTime.current += delta * 1000;
    // //if (elapsedTime.current >= duration && currentViseme.current) {
    // elapsedTime.current = 0;

    scene.traverse((object) => {
      // 檢查物體是否有 morphTargetDictionary
      if (object instanceof THREE.Mesh && object.morphTargetDictionary) {
        //console.log(`Mesh: ${object.name}`);
        //console.log("Morph Target Dictionary:", object.morphTargetDictionary);
        if (object.name !== "CC_Base_Body_1") return;
   
        Object.keys(object.morphTargetDictionary!).forEach(
          (targetName, index) => {
            //console.log(`qqqqqqq: ${item[index + 2]}`);
            const targetIndex = object.morphTargetDictionary![targetName];
            object.morphTargetInfluences![targetIndex] = 0;
          }
        );

        if (csvRef.current.length > 0) {
          const item = csvRef.current[test];
          if (item) {
            Object.keys(object.morphTargetDictionary!).forEach(
              (targetName, index) => {
                // console.log(
                //   `qqqqqqqkkkkkkkkkk: lengh : ${item.length}  index : ${
                //     Object.keys(object.morphTargetDictionary!).length
                //   }`
                // );
                if (index > 33 && index < 60) {
                  const targetIndex = object.morphTargetDictionary![targetName];
                  object.morphTargetInfluences![targetIndex] = parseFloat(
                    item[index]
                  );
                }
              }
            );
          }
        }
      }
    });
    test = test > csvRef.current.length ? 1 : test + 1;
    //}

    // scene.traverse((object) => {
    //   // 檢查物體是否有 morphTargetDictionary
    //   if (object instanceof THREE.Mesh && object.morphTargetDictionary) {
    //     //console.log(`Mesh: ${object.name}`);
    //     //console.log("Morph Target Dictionary:", object.morphTargetDictionary);
    //     if (object.name !== "CC_Base_Body_1") return;
    //     Object.keys(object.morphTargetDictionary!).forEach(
    //       (targetName, index) => {
    //         const targetIndex = object.morphTargetDictionary![targetName];
    //         object.morphTargetInfluences![targetIndex] = Math.abs(
    //           Math.sin(performance.now() / 500)
    //         );
    //       }
    //     );
    //   }
    // });

    if (!mesh.current) return;
    //console.log(mesh.current.morphTargetDictionary);

    //test for mouseOpen
    // const index = morphDict.current["mouthOpen"];
    // if (index !== undefined) {
    //   mesh.current.morphTargetInfluences![index] = Math.abs(
    //     Math.sin(performance.now() / 500)
    //   );
    // }

    // const influences = mesh.current.morphTargetInfluences!;
    // if (currentViseme.current) {
    //   const index = morphDict.current[currentViseme.current];
    //   influences[index] = 0.8;
    // } else {
    //   for (let i = 0; i < influences.length; i++) {
    //     influences[i] = 0;
    //   }
    // }
    elapsedTime.current += delta * 1000;
    if (elapsedTime.current >= duration && currentViseme.current) {
      elapsedTime.current = 0;
  
      // 重置所有
      const influences = mesh.current.morphTargetInfluences!;
      if(currentIndex.current == 0){
        for (let i = 0; i < influences.length; i++) {
            influences[i] = 0;
          }
      }
  
      //console.log("所有 morph target 名稱：", Object.keys(morphDict.current));
      // 設定當前 viseme

      const viseme = currentViseme.current[currentIndex.current];
      console.log("viseme:"+viseme);
      
      const index = morphDict.current[viseme];
      if (index !== undefined) {
        influences[index] = 0.35;
      } else {
        console.warn(`找不到 viseme "${viseme}" 的 morph target`);
      }
      if (currentIndex.current < currentViseme.current.length - 1) {
        currentIndex.current += 1;
      }
      // currentIndex.current =
      //   (currentIndex.current + 1) % currentViseme.current.length;
    }
  });

  return <primitive object={scene} />;
}
