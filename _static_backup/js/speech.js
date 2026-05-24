// ConvoGlass Speech and Analytics Engine

class SpeechEngine {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.recognition = null;
    this.isListening = false;
    
    // Metrics tracking
    this.sessionMetrics = {
      startTime: 0,
      thinkingTime: 0, // time before first spoken word
      speakingTime: 0,
      fillerCount: 0,
      wordCount: 0,
      detectedFillers: [],
      wordsPerMinute: 0,
      confidenceScore: 100, // starting base score
      transcript: ""
    };

    this.fillerWordsList = ["um", "uh", "like", "actually", "basically", "so", "you know", "mean", "right"];
    this.setupRecognition();
  }

  setupRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    } else {
      console.warn("Speech Recognition API is not supported in this browser. Falling back to text simulations.");
    }
  }

  // Voice Synthesis (Interviewer Speak)
  speak(text, persona, onStart, onEnd) {
    if (!this.synthesis) return;
    this.synthesis.cancel(); // Stop any active speech

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice properties based on persona
    utterance.rate = persona.voiceRate || 1;
    utterance.pitch = persona.voicePitch || 1;
    
    // Choose a suitable English voice if available
    const voices = this.synthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en-'));
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

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  // Speech to Text (User Answer)
  startListening(onResult, onMetricsUpdate, onSpeechEnd) {
    if (!this.recognition) {
      // Simulate input fallback if no Speech Recognition API
      console.log("Speech recognition not supported - simulating browser feedback");
      return false;
    }

    this.isListening = true;
    this.sessionMetrics = {
      startTime: Date.now(),
      firstWordTime: 0,
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

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

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
      if (activeText.trim().length > 0 && this.sessionMetrics.firstWordTime === 0) {
        this.sessionMetrics.firstWordTime = Date.now();
        this.sessionMetrics.thinkingTime = ((this.sessionMetrics.firstWordTime - this.sessionMetrics.startTime) / 1000).toFixed(1);
      }

      this.analyzeText(activeText, onMetricsUpdate);

      if (onResult) {
        onResult(activeText);
      }
    };

    this.recognition.onerror = (event) => {
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

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  analyzeText(text, onMetricsUpdate) {
    const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const words = cleanText.split(/\s+/).filter(w => w.length > 0);
    this.sessionMetrics.wordCount = words.length;

    // Detect fillers
    let fillerCount = 0;
    const detected = [];
    words.forEach(word => {
      if (this.fillerWordsList.includes(word)) {
        fillerCount++;
        detected.push(word);
      }
    });

    this.sessionMetrics.fillerCount = fillerCount;
    this.sessionMetrics.detectedFillers = [...new Set(detected)];

    // Live pace calculation (WPM)
    const elapsedMinutes = (Date.now() - this.sessionMetrics.startTime) / 60000;
    if (elapsedMinutes > 0.05) {
      this.sessionMetrics.wordsPerMinute = Math.round(words.length / elapsedMinutes);
    } else {
      this.sessionMetrics.wordsPerMinute = 0;
    }

    // Confidence estimation formula
    // Deducts points for slow starts, filler words ratio, and irregular paces
    let fillerRatio = words.length > 0 ? fillerCount / words.length : 0;
    let confidence = 98 - (fillerRatio * 150) - (Math.max(0, this.sessionMetrics.thinkingTime - 5) * 4);
    
    // Keep pace score between 120 and 150. If outer bounds, penalize slightly.
    if (this.sessionMetrics.wordsPerMinute > 0) {
      if (this.sessionMetrics.wordsPerMinute < 90 || this.sessionMetrics.wordsPerMinute > 170) {
        confidence -= 8;
      }
    }
    
    this.sessionMetrics.confidenceScore = Math.max(45, Math.min(99, Math.round(confidence)));

    if (onMetricsUpdate) {
      onMetricsUpdate(this.sessionMetrics);
    }
  }

  calculateFinalMetrics() {
    const elapsedSeconds = (Date.now() - this.sessionMetrics.startTime) / 1000;
    this.sessionMetrics.speakingTime = Math.max(0, elapsedSeconds - this.sessionMetrics.thinkingTime).toFixed(1);
    
    // Default thinking time if no words spoken
    if (this.sessionMetrics.wordCount === 0) {
      this.sessionMetrics.thinkingTime = elapsedSeconds.toFixed(1);
      this.sessionMetrics.confidenceScore = 40;
    }
  }

  // Trigger simulated voice typing (Fallback)
  simulateTypeAnswer(text, onResult, onMetricsUpdate, onSpeechEnd) {
    this.sessionMetrics = {
      startTime: Date.now(),
      thinkingTime: 1.8, // simulated values
      speakingTime: 4.5,
      fillerCount: 2,
      wordCount: text.split(' ').length,
      detectedFillers: ["like", "basically"],
      wordsPerMinute: 135,
      confidenceScore: 88,
      transcript: text
    };
    
    if (onResult) onResult(text);
    if (onMetricsUpdate) onMetricsUpdate(this.sessionMetrics);
    if (onSpeechEnd) onSpeechEnd(this.sessionMetrics);
  }
}

// Make globally accessible
window.SpeechEngine = SpeechEngine;
window.speechEngineInstance = new SpeechEngine();
console.log("Global speech engine initialized");
