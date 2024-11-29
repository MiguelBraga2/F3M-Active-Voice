import os
from flask import Flask, request, jsonify
import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
import os

app = Flask(__name__)

device = "cuda:0" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

model_id = os.getenv('MODEL_NAME', default='openai/whisper-base')

model = AutoModelForSpeechSeq2Seq.from_pretrained(
    model_id, torch_dtype=torch_dtype, low_cpu_mem_usage=True, use_safetensors=True, attn_implementation="sdpa"
)
model.to(device)

processor = AutoProcessor.from_pretrained(model_id)

pipe = pipeline(
    "automatic-speech-recognition",
    model=model,
    tokenizer=processor.tokenizer,
    feature_extractor=processor.feature_extractor,
    torch_dtype=torch_dtype,
    chunk_length_s=30,
    batch_size=16,
    device=device,
)


@app.route('/transcribe', methods=['POST'])
def transcribe():
    print(request)
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    audio_file = request.files['file']
    temp_file_path = os.path.join('temp', audio_file.filename)

    audio_file.save(temp_file_path)

    try:
        result = pipe(temp_file_path)
        transcription = result["text"]
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        os.remove(temp_file_path)

    return jsonify({"transcription": transcription})

if __name__ == '__main__':
    os.makedirs('temp', exist_ok=True)
    
    app.run(host='0.0.0.0', port=6666)