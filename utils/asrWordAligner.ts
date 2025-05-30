export class AsrWordAligner {
    private localProxyUrl: string;
  
    constructor(localProxyUrl = '/api/alignWord') {
      this.localProxyUrl = localProxyUrl;
    }
  
    align(
      audioBuffer: ArrayBuffer,
      inputText: string,
      onSuccess: (result: any) => void,
      onError?: (error: any) => void
    ) {
      const audioBase64 = this.arrayBufferToBase64(audioBuffer);
      const payload = {
        audio_buffer: audioBase64,
        input_text: inputText,
      };
  
      fetch(this.localProxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(onSuccess)
        .catch((err) => {
          console.error('align_word error:', err);
          if (onError) onError(err);
        });
    }
  
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
  
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
  
      return btoa(binary);
    }
  }