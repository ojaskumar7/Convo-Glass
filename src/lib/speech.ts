import { InterviewerPersona, SessionMetrics } from "./data";

export class SpeechEngine {
  private synthesis: SpeechSynthesis | null = null;
  private recognition: any = null;
  public isListening = false;
  
  public sessionMetrics: SessionMetrics = {
    startTime: 0,
    thinkingTime: 0,
    speakingTime: 0,
    fillerCount: 0,
    wordCount: 0,
    detectedFillers: [],
    wordsPerMinute: 0,
    confidenceScore: 100,
    transcript: ""
  };

  private fillerWordsList = ["um", "uh", "like", "actually", "basically", "so", "you know", "mean", "right"];
  private firstWordTime = 0;

  constructor() {
    if (typeof window !== "undefined") {
      this.synthesis = window.speechSynthesis;
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";
    } else {
      console.warn("Speech Recognition API is not supported in this browser. Falling back to text simulations.");
    }
  }

  // Voice Synthesis (Interviewer Speak)
  public speak(
    text: string, 
    persona: InterviewerPersona, 
    onStart?: () => void, 
    onEnd?: () => void
  ) {
    if (!this.synthesis) {
      // If synthesis is not available, trigger callbacks immediately after a tiny delay
      if (onStart) onStart();
      setTimeout(() => {
        if (onEnd) onEnd();
      }, 2000);
      return;
    }
    
    this.synthesis.cancel(); // Stop any active speech

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice properties based on persona
    utterance.rate = persona.voiceRate || 1;
    utterance.pitch = persona.voicePitch || 1;
    
    // Choose a suitable English voice if available
    const voices = this.synthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith("en-"));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      if (onEnd) onEnd();
    };

    this.synthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  // Speech to Text (User Answer)
  public startListening(
    onResult: (text: string) => void,
    onMetricsUpdate: (metrics: SessionMetrics) => void,
    onSpeechEnd: (metrics: SessionMetrics) => void
  ): boolean {
    if (!this.recognition) {
      console.log("Speech recognition not supported - simulating browser feedback");
      return false;
    }

    this.isListening = true;
    this.firstWordTime = 0;
    this.sessionMetrics = {
      startTime: Date.now(),
      thinkingTime: 0,
      speakingTime: 0,
      fillerCount: 0,
      wordCount: 0,
      detectedFillers: [],
      wordsPerMinute: 0,
      confidenceScore: 95,
      transcript: ""
    };

    this.recognition.onstart = () => {
      console.log("Voice capturing started");
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const activeText = finalTranscript || interimTranscript;
      this.sessionMetrics.transcript = activeText;
      
      // Calculate first word timing (Thinking Time)
      if (activeText.trim().length > 0 && this.firstWordTime === 0) {
        this.firstWordTime = Date.now();
        this.sessionMetrics.thinkingTime = ((this.firstWordTime - this.sessionMetrics.startTime) / 1000).toFixed(1);
      }

      this.analyzeText(activeText, onMetricsUpdate);

      if (onResult) {
        onResult(activeText);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      this.stopListening();
      if (onSpeechEnd) onSpeechEnd(this.sessionMetrics);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.calculateFinalMetrics();
      if (onSpeechEnd) onSpeechEnd(this.sessionMetrics);
    };

    this.recognition.start();
    return true;
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  private analyzeText(text: string, onMetricsUpdate?: (metrics: SessionMetrics) => void) {
    const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const words = cleanText.split(/\s+/).filter(w => w.length > 0);
    this.sessionMetrics.wordCount = words.length;

    // Detect fillers
    let fillerCount = 0;
    const detected: string[] = [];
    words.forEach(word => {
      if (this.fillerWordsList.includes(word)) {
        fillerCount++;
        detected.push(word);
      }
    });

    this.sessionMetrics.fillerCount = fillerCount;
    this.sessionMetrics.detectedFillers = Array.from(new Set(detected));

    // Live pace calculation (WPM)
    const elapsedMinutes = (Date.now() - this.sessionMetrics.startTime) / 60000;
    if (elapsedMinutes > 0.05) {
      this.sessionMetrics.wordsPerMinute = Math.round(words.length / elapsedMinutes);
    } else {
      this.sessionMetrics.wordsPerMinute = 0;
    }

    // Confidence estimation formula
    const thinkingVal = typeof this.sessionMetrics.thinkingTime === "string" 
      ? parseFloat(this.sessionMetrics.thinkingTime) 
      : this.sessionMetrics.thinkingTime;

    const fillerRatio = words.length > 0 ? fillerCount / words.length : 0;
    let confidence = 98 - (fillerRatio * 150) - (Math.max(0, thinkingVal - 5) * 4);
    
    // Keep pace score between 120 and 150. If outer bounds, penalize slightly.
    if (this.sessionMetrics.wordsPerMinute > 0) {
      if (this.sessionMetrics.wordsPerMinute < 90 || this.sessionMetrics.wordsPerMinute > 170) {
        confidence -= 8;
      }
    }
    
    this.sessionMetrics.confidenceScore = Math.max(45, Math.min(99, Math.round(confidence)));

    if (onMetricsUpdate) {
      onMetricsUpdate({ ...this.sessionMetrics });
    }
  }

  private calculateFinalMetrics() {
    const elapsedSeconds = (Date.now() - this.sessionMetrics.startTime) / 1000;
    const thinkingVal = typeof this.sessionMetrics.thinkingTime === "string" 
      ? parseFloat(this.sessionMetrics.thinkingTime) 
      : this.sessionMetrics.thinkingTime;

    this.sessionMetrics.speakingTime = Math.max(0, elapsedSeconds - thinkingVal).toFixed(1);
    
    // Default thinking time if no words spoken
    if (this.sessionMetrics.wordCount === 0) {
      this.sessionMetrics.thinkingTime = elapsedSeconds.toFixed(1);
      this.sessionMetrics.confidenceScore = 40;
    }
  }

  // Trigger simulated voice typing (Fallback)
  public simulateTypeAnswer(
    text: string, 
    onResult?: (text: string) => void, 
    onMetricsUpdate?: (metrics: SessionMetrics) => void, 
    onSpeechEnd?: (metrics: SessionMetrics) => void
  ) {
    this.sessionMetrics = {
      startTime: Date.now(),
      thinkingTime: 1.8, // simulated values
      speakingTime: 4.5,
      fillerCount: 2,
      wordCount: text.split(" ").length,
      detectedFillers: ["like", "basically"],
      wordsPerMinute: 135,
      confidenceScore: 88,
      transcript: text
    };
    
    if (onResult) onResult(text);
    if (onMetricsUpdate) onMetricsUpdate({ ...this.sessionMetrics });
    if (onSpeechEnd) onSpeechEnd({ ...this.sessionMetrics });
  }
}

// Export a getter/initializer helper to ensure it's client-side safe
let speechEngineInstance: SpeechEngine | null = null;
export function getSpeechEngineInstance(): SpeechEngine {
  if (typeof window === "undefined") {
    return new SpeechEngine(); // dummy instance for SSR
  }
  if (!speechEngineInstance) {
    speechEngineInstance = new SpeechEngine();
  }
  return speechEngineInstance;
}
