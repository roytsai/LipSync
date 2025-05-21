import torch
import whisperx

device = "cuda" if torch.cuda.is_available() else "cpu"

# Step 1: 載入模型
model = whisperx.load_model("large-v2", device=device, compute_type="float16" if device == "cuda" else "float32")

# Step 2: 辨識文字
result = model.transcribe("/Users/irobot13/Gary/lip_sync_test/lip_sync/py_wisperx_stream_server/output_fixed.wav", language="zh")
print(result["segments"])  # 印出時間戳分段
print(result["text"])      # 印出全文

# Step 3: 進一步對齊（可選）
model_a, metadata = whisperx.load_align_model(language_code="zh", device=device)
aligned = whisperx.align(result["segments"], model_a, metadata, "your_audio.wav", device)
print(aligned["word_segments"])  # 印出字級別時間戳