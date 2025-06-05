import {
    useEffect,
    useRef,
    useState,
    forwardRef,
    useImperativeHandle,
} from "react";
import { FBXLoader } from "three-stdlib";
import { useFrame } from "@react-three/fiber";
import { AnimationAction, AnimationMixer, Group, Mesh, AnimationClip } from "three";
import Papa from "papaparse";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { useFBX } from "@react-three/drei";


interface FbxModelProps {
    url: string;
}

export interface FbxModelHandle {
    playAnimation: (animation: string) => void;
}

const blendShapeMap: Record<string, string> = {
    EyeBlinkLeft: "Eye_Blink_L",
    EyeLookDownLeft: "Eye_L_Look_Down",
    EyeLookInLeft: "Eye_L_Look_R",
    EyeLookOutLeft: "Eye_L_Look_L",
    EyeLookUpLeft: "Eye_L_Look_Up",
    EyeSquintLeft: "Eye_Squint_L",
    EyeWideLeft: "Eye_Wide_L",
    EyeBlinkRight: "Eye_Blink_R",
    EyeLookDownRight: "Eye_R_Look_Down",
    EyeLookInRight: "Eye_R_Look_L",
    EyeLookOutRight: "Eye_R_Look_R",
    EyeLookUpRight: "Eye_R_Look_Up",
    EyeSquintRight: "Eye_Squint_R",
    EyeWideRight: "Eye_Wide_R",
    JawForward: "Jaw_Forward",
    JawLeft: "Jaw_L",
    JawRight: "Jaw_R",
    JawOpen: "Jaw_Open",
    MouthClose: "Mouth_Close",
    MouthFunnel: "Mouth_Funnel",
    MouthPucker: "Mouth_Pucker",
    MouthLeft: "Mouth_L",
    MouthRight: "Mouth_R",
    MouthSmileLeft: "Mouth_Smile_L",
    MouthSmileRight: "Mouth_Smile_R",
    MouthFrownLeft: "Mouth_Frown_L",
    MouthFrownRight: "Mouth_Frown_R",
    MouthDimpleLeft: "Mouth_Dimple_L",
    MouthDimpleRight: "Mouth_Dimple_R",
    MouthStretchLeft: "Mouth_Stretch_L",
    MouthStretchRight: "Mouth_Stretch_R",
    MouthRollLower: "Mouth_Roll_Lower",
    MouthRollUpper: "Mouth_Roll_Upper",
    MouthShrugLower: "Mouth_Shrug_Lower",
    MouthShrugUpper: "Mouth_Shrug_Upper",
    MouthPressLeft: "Mouth_Press_L",
    MouthPressRight: "Mouth_Press_R",
    MouthLowerDownLeft: "Mouth_Down_Lower_L",
    MouthLowerDownRight: "Mouth_Down_Lower_R",
    MouthUpperUpLeft: "Mouth_Up_Upper_L",
    MouthUpperUpRight: "Mouth_Up_Upper_R",
    BrowDownLeft: "Brow_Drop_L",
    BrowDownRight: "Brow_Drop_R",
    BrowInnerUp: "BrowInnerUp",
    BrowInnerUpLeft: "Brow_Raise_Inner_L",
    BrowInnerUpRight: "Brow_Raise_Inner_R",
    BrowOuterUpLeft: "Brow_Raise_Outer_L",
    BrowOuterUpRight: "Brow_Raise_Outer_R",
    BrowCompressLeft: "Brow_Compress_L",
    BrowCompressRight: "Brow_Compress_R",
    CheekPuff: "CheekPuff",
    CheekPuffLeft: "Cheek_Puff_L",
    CheekPuffRight: "Cheek_Puff_R",
    CheekSquintLeft: "Cheek_Raise_L",
    CheekSquintRight: "Cheek_Raise_R",
    CheekSuckLeft: "Cheek_Suck_L",
    CheekSuckRight: "Cheek_Suck_R",
    NoseSneerLeft: "Nose_Sneer_L",
    NoseSneerRight: "Nose_Sneer_R",
    TongueOut: "Tongue_Out"
};

const FbxModel = forwardRef<FbxModelHandle, FbxModelProps>(({ url }, ref) => {
    const group = useRef<Group>(null);
    const meshRef = useRef<THREE.Mesh | null>(null);
    const mixerRef = useRef<AnimationMixer | null>(null);
    const actionRef = useRef<AnimationAction | null>(null);
    const timeRef = useRef(0);
    const animationData = useRef<{ time: number; visemes: Record<string, number> }[]>([]);
    const isPlaying = useRef(false);
    const mixerPoseRef = useRef<AnimationMixer | null>(null);
    const changePose = useRef<THREE.AnimationAction | null>(null);
    const standTalk = useRef<THREE.AnimationAction | null>(null);
    const [mixerReady, setMixerReady] = useState(false);
    const fbxRef = useRef<THREE.Group | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const isCallA2f = useRef<Boolean>(false);
    const AUDIO_FILE = "/idle_2.wav";
    const BLEND_SHAPES_FILE = "/animation_frames_2.csv";


    useImperativeHandle(ref, () => ({
        playAnimation: (pose) => {
            console.log('play2:' + pose);
            if (isCallA2f.current) {
                console.log('play2:22');
                const fetchData = async () => {

                    const res = await fetch('http://localhost:5489/run-a2f-client', {
                        method: 'GET',
                    });

                    const csvResponse = await fetch('/a2f_files/animation_frames.csv');
                    const csvText = await csvResponse.text();
                    setFaceAnimation(csvText);
                    if (audioRef.current) {
                        audioRef.current.play();
                    }

                    if (actionRef.current) {
                        actionRef.current.reset().play();
                        isPlaying.current = true;
                    }

                    if (changePose.current && standTalk.current && pose == 'animation1') {
                        console.log('play1');
                        standTalk.current.stop();
                        changePose.current.play();
                    }
                    if (standTalk.current && changePose.current && pose == 'animation2') {
                        console.log('play2');
                        changePose.current.stop();
                        standTalk.current.play();
                    }

                };
                fetchData();
            } else {
                if (audioRef.current) {
                    audioRef.current.play();
                }

                if (actionRef.current) {
                    console.log('play face');
                    actionRef.current.reset().play();
                    isPlaying.current = true;
                }

                if (changePose.current && pose == 'animation1') {
                    console.log('play1');
                    if (standTalk.current) {
                        standTalk.current.stop();
                    }
                    changePose.current.play();

                }
                if (standTalk.current && pose == 'animation2') {
                    console.log('play2');
                    if (changePose.current) {
                        changePose.current.stop();
                    }
                    standTalk.current.play();
                }
            }


        },
    }));

    useEffect(() => {
        fetch(BLEND_SHAPES_FILE)
            .then((res) => res.text())
            .then((csvText) => {
                setFaceAnimation(csvText);
            });

    }, []);

    const setFaceAnimation = (csvText: string) => {
        const result = Papa.parse(csvText, { header: true });
        animationData.current = result.data.map((row: any) => {
            const time = parseFloat(row.timeCode);
            const visemes: Record<string, number> = {};
            for (const key in row) {
                const shortKey = key.replace(/^blendShapes\./, "");
                if (key !== "timeCode") {
                    const morphName = blendShapeMap[shortKey];
                    if (morphName) {
                        visemes[morphName] = parseFloat(row[key]);
                    }
                }
            }
            return { time, visemes };
        });

    };


    useEffect(() => {
        const audio = new Audio(AUDIO_FILE);
        audioRef.current = audio;

        const loader = new FBXLoader();
        loader.load(
            url,
            (fbx) => {
                fbxRef.current = fbx;
                fbx.scale.set(0.05, 0.05, 0.05);
                group.current?.add(fbx);

                if (fbx.animations.length > 0) {
                    const mixer = new AnimationMixer(fbx);
                    const action = mixer.clipAction(fbx.animations[0]);
                    actionRef.current = action;
                    console.log("actionRef init");
                    mixerRef.current = mixer;
                    setMixerReady(true);
                }

                fbx.traverse((child) => {
                    console.log(child.name);
                    if (child.name.includes("Hair")) {
                        console.log(child.name);
                        console.log(child);
                        const mesh = child as THREE.Mesh;
                        mesh.renderOrder = 1; 
                        if (Array.isArray(mesh.material)) {
                            mesh.material.forEach((mat) => {
                                mat.side = THREE.DoubleSide;
                                mat.transparent = true;
                                mat.alphaTest = 0;
                                mat.depthWrite = false;
                            });
                        } else {
                            mesh.material.side = THREE.DoubleSide;
                            mesh.material.transparent = true;
                            mesh.material.alphaTest = 0;
                            mesh.material.depthWrite = false;
      
                        }

                    }

                    if (
                        (child as any).isMesh &&
                        (child as any).morphTargetInfluences &&
                        child.name === "CC_Base_Body") {
                        console.log(child.name);
                        console.log(child);
                        meshRef.current = child as typeof meshRef.current;

                        const mesh = child as THREE.Mesh;
           
                        if (Array.isArray(mesh.material)) {
                            mesh.material.forEach((mat) => {
                                console.log("CC_Base_Body - material name:"+mat.name);
                                if(mat.name.includes("Eyelash")){
                                    console.log("update Eyelash ");
                                    mat.side = THREE.DoubleSide;
                                    mat.transparent = true;
                                    mat.alphaTest = 0.1;
                                    mat.depthWrite = false;
                                }
                            });
                        } 


                    }
                });
            },
            undefined,
            (err) => {
                console.error("FBX load error:", err);
            }
        );

    }, [url]);

    useEffect(() => {
        console.log('mixerRef useEffect');
        console.log(mixerRef.current);
        if (mixerRef.current) {
            const poseLoader = new FBXLoader();
            poseLoader.load("/Sage_0604/Sage_motion_stand_Talk(0604_V1).Fbx", (fbx) => {
                console.log('play1');
                  console.log(fbx.animations);
                const clip = fbx.animations[0];
                const mixer = mixerRef.current;
                if (!mixer) {
                    console.error("Mixer is not ready yet.");
                    return;
                }

                //   const excludedKeywords = ["eye", "morphtargetinfluences"];
                //   const filteredTracks = clip.tracks.filter((track) => {
                //       const name = track.name.toLowerCase();
                //       return !excludedKeywords.some(keyword => name.includes(keyword));
                //   });

                const filteredTracks = clip.tracks;
                // console.log(filteredTracks);
                const filteredClip = new AnimationClip(clip.name, clip.duration, filteredTracks);
                const action = mixer.clipAction(filteredClip);
                changePose.current = action;


            });

            poseLoader.load("/models/stand-talk.fbx", (fbx) => {
                console.log('play2 stand-talk.fbx');
                console.log(fbx.animations);
                const clip = fbx.animations[1];

                const mixer = mixerRef.current;
                if (!mixer) {
                    console.error("Mixer is not ready yet.");
                    return;
                }
                // const filteredTracks = clip.tracks.filter(
                //     (track) => !track.name.toLowerCase().includes("eye")
                // );
                const filteredTracks = clip.tracks;
                // console.log(filteredTracks);
                const filteredClip = new AnimationClip(clip.name, clip.duration, filteredTracks);
                const action = mixer.clipAction(filteredClip);
                console.log(action);
                standTalk.current = action;

            });
        }
    }, [mixerReady]);

    useFrame((_, delta) => {
        mixerRef.current?.update(delta);
        // console.log("目前 group 中模型數量:", group.current?.children.length);
        if (!meshRef.current || !isPlaying.current) return;

        timeRef.current += delta;
        const mesh = meshRef.current;
        if (Array.isArray(mesh.morphTargetInfluences)) {
            mesh.morphTargetInfluences.fill(0);
        }

        for (let i = animationData.current.length - 1; i >= 0; i--) {
            const { time, visemes } = animationData.current[i];
            if (timeRef.current >= time) {
                for (const [name, strength] of Object.entries(visemes)) {
                    const index = mesh.morphTargetDictionary?.[name];
                    if (index !== undefined && mesh.morphTargetInfluences) {
                        mesh.morphTargetInfluences[index] = strength;
                    }
                }
                break;
            }
        }

        if (
            animationData.current.length > 1 &&
            timeRef.current >= animationData.current[animationData.current.length - 2].time
        ) {
            console.log("播放完畢");
            timeRef.current = 0;
            isPlaying.current = false;
        }
    });

    return (
        <>
            <group ref={group} />
        </>
    );
});

export default FbxModel;
