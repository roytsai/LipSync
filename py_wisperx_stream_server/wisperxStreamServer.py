import asyncio
import json
import websockets
import tempfile
import wave
import os
import torch
import whisperx

# === 載入 WhisperX 模型（支援中文、支援 large-v2 模型）===
device = "cuda" if torch.cuda.is_available() else "cpu"
model = whisperx.load_model(
    "small",
    device=device,
    compute_type="float16" if device == "cuda" else "float32"
)

# === 處理來自前端的 WebSocket 音訊串流 ===
async def handle_connection(websocket):
    print("✅ Client connected")
    buffer = bytearray()

    try:
        async for message in websocket:
            if isinstance(message, bytes):
                buffer.extend(message)

                # 如果累積超過 5 秒（16kHz * 2 bytes * 秒數）
                if len(buffer) >= 16000 * 2 * 5:
                    # 存為暫存 wav 檔
                    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                        wav_path = tmp.name
                        write_pcm_to_wav(buffer, wav_path)

                    # WhisperX 辨識
                    print("🔍 Running WhisperX on: ", wav_path)
                    try:
                        result = model.transcribe(wav_path, language="zh")
                        #result = model.transcribe("/Users/irobot13/Gary/lip_sync_test/lip_sync/py_wisperx_stream_server/output_fixed.wav", language="zh")
                        print("📝 result: ", result)
                        json_string = json.dumps(result, ensure_ascii=False)
                        # transcript = result.get("segments", "").strip() or "（無語音）"
                        # print("📝 Transcript: ", transcript)
                        await websocket.send(json_string)
                    except Exception as e:
                        print("❌ WhisperX error:", e)
                        await websocket.send("辨識失敗：" + str(e))

                    # 清理資源
                    os.remove(wav_path)
                    buffer.clear()
            elif isinstance(message, str):
                print("🔍 Running WhisperX on: ", message)
                try:
                    audio_path = message
                    result = model.transcribe(audio_path, language="zh")
                    # Step 2: 載入對齊模型
                    model_a, metadata = whisperx.load_align_model(language_code=result["language"], device=device)
                    aligned_result = whisperx.align(result["segments"], model_a, metadata, audio_path, device)
                    print("📝 result: ", result)
                    print("📝 aligned_result: ", aligned_result)
                    json_string = json.dumps(aligned_result, ensure_ascii=False)
                    await websocket.send(json_string)
                except Exception as e:
                    print("❌ WhisperX error:", e)
                    await websocket.send("辨識失敗：" + str(e))

    except websockets.exceptions.ConnectionClosed:
        print("❎ Client disconnected")

# === 將 PCM 原始資料轉為 .wav 檔案 ===
def write_pcm_to_wav(pcm_data: bytes, output_path: str):
    with wave.open(output_path, "wb") as wf:
        wf.setnchannels(1)      # mono 單聲道
        wf.setsampwidth(2)      # 16-bit (2 bytes)
        wf.setframerate(16000)  # 16kHz 取樣率
        wf.writeframes(pcm_data)

# === 啟動 WebSocket Server ===
async def main():
    async with websockets.serve(handle_connection, "0.0.0.0", 8765):
        print("🚀 WebSocket server listening at ws://0.0.0.0:8765")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())