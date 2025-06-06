// public/voice-processor.js
class VoiceProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // 緩衝設定：每 30ms 發送一次 (16000 Hz * 0.03s = 480 samples)
    // 調整為符合後端 VAD 要求（< 32ms）
    this.bufferSize = 480;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs) {
    // inputs: [ [ Float32Array, ... ] ]
    const input = inputs[0];
    if (input && input[0]) {
      const inputData = input[0];
      
      // 將輸入數據添加到緩衝區
      for (let i = 0; i < inputData.length; i++) {
        this.buffer[this.bufferIndex] = inputData[i];
        this.bufferIndex++;
        
        // 當緩衝區滿時，發送數據並重置
        if (this.bufferIndex >= this.bufferSize) {
          // 創建副本以避免數據競爭
          const bufferCopy = new Float32Array(this.buffer);
          this.port.postMessage(bufferCopy);
          
          // 重置緩衝區
          this.bufferIndex = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor('voice-processor', VoiceProcessor);
