// public/voice-processor.js
class VoiceProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs) {
    // inputs: [ [ Float32Array, ... ] ]
    const input = inputs[0];
    if (input && input[0]) {
      // 將 Float32Array 轉成 transferable buffer 傳回主執行緒
      this.port.postMessage(input[0]);
    }
    return true;
  }
}

registerProcessor('voice-processor', VoiceProcessor);
