import { GoogleGenAI, Chat, Modality, LiveServerMessage } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let chatSession: Chat | null = null;
let audioContext: AudioContext | null = null;

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey });
};

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
};

export const initializeChat = async () => {
  try {
    const ai = getAiClient();
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to initialize chat:", error);
    return false;
  }
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatSession) {
    const success = await initializeChat();
    if (!success || !chatSession) {
      return "ക്ഷമിക്കണം, എനിക്ക് ഇപ്പോൾ മറുപടി നൽകാൻ കഴിയുന്നില്ല. അല്പസമയത്തിന് ശേഷം വീണ്ടും ശ്രമിക്കുക.";
    }
  }

  try {
    const response = await chatSession.sendMessage({ message });
    return response.text || "";
  } catch (error) {
    console.error("Error sending message:", error);
    return "ക്ഷമിക്കണം, എന്തോ തകരാറു സംഭവിച്ചു. ദയവായി വീണ്ടും പറയുമോ?";
  }
};

// --- Standard TTS Logic (for text chat) ---

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext
): Promise<AudioBuffer> {
  const sampleRate = 24000;
  const numChannels = 1;
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export const speakText = async (text: string) => {
  try {
    const ai = getAiClient();
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // Male voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      console.warn("No audio data returned");
      return;
    }

    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const audioBytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, ctx);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();

  } catch (error) {
    console.error("TTS Error:", error);
  }
};

// --- Live API (Real-time Voice Assistant) ---

// Helper functions for Live API audio encoding
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export class GeminiLiveSession {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private nextStartTime: number = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();
  private sessionPromise: Promise<any> | null = null;
  private onStatusChange: (status: string) => void;
  private active: boolean = false;

  constructor(onStatusChange: (status: string) => void) {
    this.ai = getAiClient();
    this.onStatusChange = onStatusChange;
  }

  async start() {
    if (this.active) return;
    this.active = true;
    this.onStatusChange("Connecting...");

    try {
      // Input context (Microphone) - 16kHz
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      // Output context (Speaker) - 24kHz
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Resume contexts to ensure they are active
      await this.inputAudioContext.resume();
      await this.outputAudioContext.resume();

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      };

      this.sessionPromise = this.ai.live.connect({
        model: config.model,
        config: config.config,
        callbacks: {
          onopen: () => {
            if (this.active) {
              this.onStatusChange("Connected");
              this.startAudioInput();
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            if (this.active) {
              this.handleMessage(message);
            }
          },
          onclose: () => {
            if (this.active) {
              console.log("Session closed by server");
              this.onStatusChange("Disconnected");
              this.stop();
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            if (this.active) {
               this.onStatusChange("Error");
               this.stop();
            }
          }
        }
      });

    } catch (error) {
      console.error("Failed to start live session:", error);
      this.onStatusChange("Connection Failed");
      this.stop();
    }
  }

  private startAudioInput() {
    if (!this.inputAudioContext || !this.stream) return;

    const source = this.inputAudioContext.createMediaStreamSource(this.stream);
    const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    scriptProcessor.onaudioprocess = (e) => {
      if (!this.active) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createBlob(inputData);
      
      if (this.sessionPromise) {
        this.sessionPromise.then((session) => {
           session.sendRealtimeInput({ media: pcmBlob });
        }).catch((err) => {
            console.error("Error sending real-time input:", err);
            // Optionally stop the session if sending fails repeatedly
        });
      }
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    const serverContent = message.serverContent;
    
    if (serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
      const base64Audio = serverContent.modelTurn.parts[0].inlineData.data;
      
      if (this.outputAudioContext) {
        if (this.outputAudioContext.state === 'suspended') {
            await this.outputAudioContext.resume();
        }

        const audioBytes = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, this.outputAudioContext);
        
        // Schedule playback
        this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
        
        const source = this.outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputAudioContext.destination);
        
        source.addEventListener('ended', () => {
          this.sources.delete(source);
        });

        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;
        this.sources.add(source);
      }
    }

    if (serverContent?.interrupted) {
      this.sources.forEach(source => {
          try { source.stop(); } catch(e){}
      });
      this.sources.clear();
      this.nextStartTime = 0;
    }
  }

  stop() {
    this.active = false;
    
    if (this.inputAudioContext) {
        try { this.inputAudioContext.close(); } catch(e) {}
        this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
        try { this.outputAudioContext.close(); } catch(e) {}
        this.outputAudioContext = null;
    }

    if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
    }

    this.sessionPromise = null;
  }
}
