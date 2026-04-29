#!/bin/bash
# AMD MI300X vLLM startup — ROCm configuration

export HSA_OVERRIDE_GFX_VERSION=11.0.0
export ROCR_VISIBLE_DEVICES=0

docker run -d \
  --name axiom-vllm \
  --device=/dev/kfd \
  --device=/dev/dri \
  --group-add video \
  --group-add render \
  --ipc=host \
  --shm-size=16g \
  -p 8000:8000 \
  -v ~/.cache/huggingface:/root/.cache/huggingface \
  -e HUGGING_FACE_HUB_TOKEN=${HF_TOKEN} \
  -e HSA_OVERRIDE_GFX_VERSION=11.0.0 \
  rocm/vllm:latest \
  python -m vllm.entrypoints.openai.api_server \
    --model ${MODEL_NAME:-meta-llama/Llama-3.1-8B-Instruct} \
    --device rocm \
    --dtype float16 \
    --max-model-len 32768 \
    --gpu-memory-utilization 0.90 \
    --max-num-seqs 8 \
    --port 8000 \
    --api-key ${VLLM_API_KEY:-token-axiom}

echo "Waiting for vLLM to be ready..."
until curl -s http://localhost:8000/health > /dev/null; do
  sleep 2
done
echo "vLLM ready on port 8000"

# To use Llama-3-70B on MI300X (192GB VRAM — fits natively):
# MODEL_NAME=meta-llama/Llama-3.1-70B-Instruct ./start_vllm_rocm.sh
