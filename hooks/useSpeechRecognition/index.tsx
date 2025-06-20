"use client";
import { generateSilentAudioBlob } from "@/utils/silentAudio";
import axios from "axios";
import { useEffect, useRef, useState } from "react";

type MediaSuccessCallback = (stream: MediaStream) => void;
type MediaErrorCallback = (error: any) => void;

export type AlignResultItem = {
  word: string;
  start: number;
  end: number;
};

export type TTSresultItem = {
  ttsAudio: string[];
  ttsSentence: string;
  alignResult: AlignResultItem[];
  index: number;
  total: number;
};

export function useSpeechRecognition() {
  const alignMode = 2;
  const recordRate = 150; //record every 150 mss chunks
  const sequence = process.env.NEXT_PUBLIC_SEQUENCE;
  const clientId = process.env.NEXT_PUBLIC_CLIENTID || "";
  const clientKey = process.env.NEXT_PUBLIC_CLIENTKEY;
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "";
  const rag_source = process.env.NEXT_PUBLIC_RAG_SOURCE;
  const rag_account = process.env.NEXT_PUBLIC_RAG_ACCOUNT;

  const audioChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaStreamRecorder>(null);
  const mediaStreamRef = useRef<MediaStream>(null);
  const tmp_response_id = useRef("");
  const TTS_sentence_tmp_check = useRef("");
  const TTS_sentence_tmp = useRef("");
  const TTS_audio_temp = useRef<string[]>([]);
  const is_TTS_audio_done = useRef<boolean>(false);
  const rafId = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const isPauseRecordingRef = useRef(false);

  const [service, setService] = useState(null);
  const [token, setToken] = useState<{ token: any; clientid: string } | null>(
    null
  );

  const [connectStatus, setConnectStatus] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState("");

  const [ttsResult, setTTsResult] = useState<TTSresultItem | null>(null);

  const mediaConstraints: MediaStreamConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      googEchoCancellation: false,
      googNoiseSuppression: false,
    },
  } as any;

  async function getToken() {
    try {
      const headers = { "Content-Type": "application/json" };
      const postData = {
        cmddata: {
          clientid: clientId,
          clientsecret: clientKey,
          useruid: "dementia",
          isVerified: "True",
        },
      };

      console.log("clientId:", clientId);
      console.log("key:", clientKey);

      const response = await axios.post(authUrl, JSON.stringify(postData), {
        headers: headers,
        validateStatus: () => true,
      });

      const resultJson = response.data;
      console.log("the auth token is", resultJson.granted_privileges.ds);

      let responseToken = {
        token: resultJson.granted_privileges.ds,
        clientid: clientId,
      };

      setToken(responseToken);
    } catch (error) {
      console.error("no token:", error);
    }
  }

  const captureUserMedia = (
    successCallback: MediaSuccessCallback,
    errorCallback: MediaErrorCallback
  ) => {
    navigator.mediaDevices
      .getUserMedia(mediaConstraints)
      .then(successCallback)
      .catch(errorCallback);
  };

  const recognition_result = function (result: any) {
    console.log("kkkkkkkkkk recognition_result->", result);
    var key = Object.keys(result);
    if (key.includes("result")) {
      var partial = result["result"];
      var isFinal = result["isFinal"];
      if (isFinal) {
        setRecognitionResult(partial);
        stopSendSilentLoop();
        service?.stop_recognition();
      }
    }
    if (key.includes("status")) {
      if (result["status"] == "VAD_onEndOfSpeech") {
        console.log("!!!in VAD_onEndOfSpeech");
      } //VAD_onEndOfSpeech
      else if (result["status"] == "FinishRecognition") {
        console.log("kkkkkkkkkk !!!in VAD_onEndOfSpeech");
      }
    }
    if (key.includes("error_code")) {
      console.log("error_code", result["error_code"] + result["message"]);
    }
    if (key.includes("tts_sentence")) {
      //**處理LLM回復**
      console.log("kkkkkkkkkk 🎧 收到 TTS audio:", result.tts_sentence);
      console.log("kkkkkkkkkk response_id--->", result.response_id);
      if (!tmp_response_id.current.includes(result.response_id)) {
        is_TTS_audio_done.current = false;
        TTS_sentence_tmp_check.current = result.tts_sentence;
        if (TTS_sentence_tmp.current != "") {
          TTS_sentence_tmp.current =
            TTS_sentence_tmp.current + "\n" + result.tts_sentence;
        } else {
          TTS_sentence_tmp.current = result.tts_sentence;
        }
      } else {
        if (!TTS_sentence_tmp_check.current.includes(result.tts_sentence)) {
          TTS_sentence_tmp_check.current = result.tts_sentence;
          TTS_sentence_tmp.current =
            TTS_sentence_tmp.current + result.tts_sentence;
        }
        if (result.index == result.total) {
          is_TTS_audio_done.current = true;
        }
      }

      if (!tmp_response_id.current.includes(result.response_id)) {
        tmp_response_id.current = result.response_id;
        service?.send("EEND__" + tmp_response_id); //**說話插斷功能**
      }
      TTS_audio_temp.current.push(result.tts_audio);
      if (is_TTS_audio_done.current || alignMode == 2) {
        console.log(
          "kkkkkkkkkk TTS end result.tts_sentence",
          result.tts_sentence
        );
        stopRecord();
        const TTS_sentence = TTS_sentence_tmp.current;
        const TTS_audio = TTS_audio_temp.current;
        TTS_audio_temp.current = [];
        TTS_sentence_tmp.current = "";
        is_TTS_audio_done.current = false;
        setTTsResult({
          ttsAudio: TTS_audio,
          ttsSentence: TTS_sentence,
          alignResult: result.align_result,
          index: result.index,
          total: result.total,
        });
      }
    }
    if (key.includes("tts_stop")) {
      //**處理說話插斷tts停止播放**
      console.log(
        "[Kakaya_debug]tts_stop：中斷播放並清空 queue, time=" + new Date()
      );
    }
  };

  const token_result = function (result: any) {
    console.log("token_result: ", result);
    const keys = Object.keys(result);
    if (keys.includes("token_check")) {
      switch (result["token_check"]) {
        case "success":
          setConnectStatus(true);
          break;
        case "fail":
          setConnectStatus(false);
          break;
        default:
          break;
      }
    }
  };

  useEffect(() => {
    if (connectStatus) {
      service?.send("customParam__alignText__on");
      service?.send(`customParam__alignMode__${alignMode}`);
    }
  }, [connectStatus]);

  useEffect(() => {
    const Service = new speechRecognition(recognition_result, token_result);
    setService(Service);
    getToken();

    return () => {
      stopMediaRecorder();
      disconnectService();
    };
  }, []);

  useEffect(() => {
    if (token != null) {
      connectService();
    }
  }, [token]);

  const connectService = () => {
    if (service != null) {
      service.setIP(sequence);
      service.start_connect(token);
    }
  };

  function disconnectService() {
    mediaRecorderRef?.current.stop();
    if (service != null) {
      service.stop_connect();
    }
  }

  const startRecord = (
    mode: string,
    onSuccess: MediaSuccessCallback,
    onError: MediaErrorCallback
  ) => {
    // stopSendSilentLoop();
    // service?.stop_recognition();
    service?.send("rag_source_" + rag_source); // **上傳rag source參數**
    service?.send("rag_account_" + rag_account); // **上傳rag account參數**
    setRecognitionResult("");
    //isPauseRecordingRef.current = false;

    setTimeout(() => {
      if (!isRecording) {
        captureUserMedia((stream) => {
          handleMediaStream(stream);
          onSuccess(stream);
        }, onError);

        setIsRecording(true);
      }

      if (service != null && !service.check_connect()) {
        service.start_connect();
        console.log("Reconnected to Service");
      }

      service?.samplerate(48000);
      setTimeout(() => {
        console.log("start_recognition  ");
        service?.start_recognition(mode);
      }, 200);
    }, 10);
  };

  const stopMediaRecorder = () => {
    mediaRecorderRef.current?.stop(() => {
      // Clean up media stream
      // mediaStreamRef.current
      //   ?.getTracks()
      //   .forEach((track: { stop: () => any }) => track.stop());
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
    });
  };
  const stopRecord = () => {
    console.log("kkkkkkkkkk stopRecord");
    stopMediaRecorder();
    //audioChunksRef.current = [];
    //isPauseRecordingRef.current = true;
    startSendSilentLoop();
    //service?.stop_recognition();
    setIsRecording(false);
  };

  const startSendSilentLoop = () => {
    if (rafId.current != null) return;
    const SendSilent = async () => {
      const silentBlob = await generateSilentAudioBlob(recordRate);
      audioChunksRef.current.push(silentBlob);
      service?.sendbuffer(audioChunksRef.current);
      setTimeout(() => {
        rafId.current = requestAnimationFrame(SendSilent);
      }, recordRate);
    };

    rafId.current = requestAnimationFrame(SendSilent);
  };

  const stopSendSilentLoop = () => {
    if (rafId.current != null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  };

  const handleMediaStream = (stream: MediaStream) => {
    mediaStreamRef.current = stream;
    audioChunksRef.current = [];
    const mediaRecorder = new MediaStreamRecorder(mediaStreamRef.current);
    mediaRecorder.recorderType = StereoAudioRecorder;
    mediaRecorder.mimeType = "audio/wav";
    mediaRecorder.audioChannels = 1;
    mediaRecorder.sampleRate = 48000;

    mediaRecorder.ondataavailable = async (blob: Blob) => {
      console.log(
        "kkkkkkkkkk isPauseRecordingRef.current",
        isPauseRecordingRef.current
      );
      if (!isPauseRecordingRef.current) {
        audioChunksRef.current.push(blob);
        service?.sendbuffer(audioChunksRef.current);
      } else {
        const silentBlob = await generateSilentAudioBlob(recordRate); // 1 秒靜音
        service?.sendbuffer([silentBlob]);
      }
    };

    mediaRecorder.start(recordRate);
    mediaRecorderRef.current = mediaRecorder;
  };

  return {
    isRecording,
    recognitionResult,
    service,
    ttsResult,
    startRecord,
    stopRecord,
  };
}
