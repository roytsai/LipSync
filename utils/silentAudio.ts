/**
 * 產生一段指定長度的靜音音訊 Blob（WAV 格式）
 * @param durationMs 音訊長度（毫秒）
 * @returns 靜音音訊 Blob
 */
export async function generateSilentAudioBlob(durationMs: number): Promise<Blob> {
    const sampleRate = 44100;
    const frameCount = sampleRate * (durationMs / 1000);
  
    const offlineCtx = new OfflineAudioContext(1, frameCount, sampleRate);
    const buffer = offlineCtx.createBuffer(1, frameCount, sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start();
  
    const renderedBuffer = await offlineCtx.startRendering();
    return audioBufferToWavBlob(renderedBuffer);
  }
  
  /**
   * 將 AudioBuffer 轉為 WAV Blob
   */
  function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
  
    const length = buffer.length * numOfChan * (bitDepth / 8) + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
  
    let offset = 0;
  
    function writeString(s: string) {
      for (let i = 0; i < s.length; i++) {
        view.setUint8(offset++, s.charCodeAt(i));
      }
    }
  
    function writeUint32(val: number) {
      view.setUint32(offset, val, true);
      offset += 4;
    }
  
    function writeUint16(val: number) {
      view.setUint16(offset, val, true);
      offset += 2;
    }
  
    // RIFF header
    writeString('RIFF');
    writeUint32(length - 8);
    writeString('WAVE');
  
    // fmt chunk
    writeString('fmt ');
    writeUint32(16);
    writeUint16(format);
    writeUint16(numOfChan);
    writeUint32(sampleRate);
    writeUint32(sampleRate * numOfChan * (bitDepth / 8));
    writeUint16(numOfChan * (bitDepth / 8));
    writeUint16(bitDepth);
  
    // data chunk
    writeString('data');
    writeUint32(buffer.length * numOfChan * (bitDepth / 8));
  
    // Write PCM samples
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numOfChan; ch++) {
        let sample = buffer.getChannelData(ch)[i];
        sample = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
  
    return new Blob([view], { type: 'audio/wav' });
  }