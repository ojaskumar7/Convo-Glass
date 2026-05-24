// ConvoGlass Landing Page Interactivity

document.addEventListener('DOMContentLoaded', () => {
  // Check global dependencies
  const personas = INTERVIEW_PERSONAS;
  let activePersona = personas[0];
  let isInterviewerSpeaking = false;
  
  // DOM Elements - Hero Demo
  const personaButtons = document.querySelectorAll('.persona-btn');
  const demoTitle = document.getElementById('demo-persona-title');
  const demoRole = document.getElementById('demo-persona-role');
  const avatarImage = document.querySelector('.avatar-image');
  const avatarGlow = document.querySelector('.avatar-speaking-glow');
  const waveBars = document.querySelectorAll('.wave-bar');
  const speakQuestionBtn = document.getElementById('listen-question-btn');
  
  // DOM Elements - User Interaction
  const dialogueText = document.getElementById('dialogue-content');
  const dialogueSpeakerName = document.getElementById('dialogue-speaker-name');
  const textInput = document.getElementById('text-answer-input');
  const voiceRecordBtn = document.getElementById('mic-record-btn');
  const sendAnswerBtn = document.getElementById('submit-answer-btn');
  
  // DOM Elements - Metrics
  const paceVal = document.getElementById('pace-metric-val');
  const fillerVal = document.getElementById('filler-metric-val');
  const confidenceVal = document.getElementById('confidence-metric-val');

  // Initialize Landing Demo Persona Details
  function loadPersona(persona) {
    activePersona = persona;
    demoTitle.textContent = persona.name;
    demoRole.textContent = persona.role;
    avatarImage.textContent = persona.emoji;
    
    // Reset dialogue box
    dialogueSpeakerName.textContent = `${persona.name}`;
    dialogueSpeakerName.className = "dialogue-speaker";
    dialogueText.textContent = `Click "Listen to Question" to hear what ${persona.name} wants to ask you.`;
    
    // Reset inputs
    textInput.value = "";
    textInput.placeholder = "Type your response here or click the mic to speak...";
    
    // Reset metrics
    paceVal.textContent = "--";
    fillerVal.textContent = "0";
    confidenceVal.textContent = "0%";
    confidenceVal.className = "metric-mini-val";
    
    // Stop any active speech/listening
    window.speechEngineInstance.stopSpeaking();
    window.speechEngineInstance.stopListening();
    stopVisualSpeechWave();
  }

  // Visual Wave animations
  function startVisualSpeechWave() {
    isInterviewerSpeaking = true;
    avatarGlow.classList.add('speaking');
    waveBars.forEach(bar => bar.classList.add('speaking'));
  }

  function stopVisualSpeechWave() {
    isInterviewerSpeaking = false;
    avatarGlow.classList.remove('speaking');
    waveBars.forEach(bar => bar.classList.remove('speaking'));
  }

  // Listen to Question logic
  speakQuestionBtn.addEventListener('click', () => {
    // Select a random sample question from persona
    const questions = activePersona.sampleQuestions;
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    
    dialogueSpeakerName.textContent = activePersona.name;
    dialogueSpeakerName.className = "dialogue-speaker text-cyan";
    dialogueText.textContent = randomQuestion;
    
    startVisualSpeechWave();
    
    window.speechEngineInstance.speak(
      randomQuestion,
      activePersona,
      () => {
        // speech started
        startVisualSpeechWave();
      },
      () => {
        // speech ended
        stopVisualSpeechWave();
        dialogueText.innerHTML = `${randomQuestion} <br><br><strong>It's your turn! Type below or click the microphone to speak your answer.</strong>`;
      }
    );
  });

  // Persona Selection Buttons
  personaButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      personaButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const personaId = btn.getAttribute('data-persona-id');
      const selected = personas.find(p => p.id === personaId);
      if (selected) {
        loadPersona(selected);
      }
    });
  });

  // User Voice Recognition (Microphone)
  voiceRecordBtn.addEventListener('click', () => {
    if (window.speechEngineInstance.isListening) {
      // Stop Capture
      window.speechEngineInstance.stopListening();
      voiceRecordBtn.classList.remove('listening');
    } else {
      // Start Capture
      voiceRecordBtn.classList.add('listening');
      dialogueSpeakerName.textContent = "You (Speaking...)";
      dialogueSpeakerName.className = "dialogue-speaker user text-violet";
      dialogueText.textContent = "Listening...";
      
      const started = window.speechEngineInstance.startListening(
        (interimText) => {
          // Live voice text display
          dialogueText.textContent = interimText || "Listening...";
        },
        (metrics) => {
          // Real-time metrics calculations
          paceVal.textContent = metrics.wordsPerMinute > 0 ? `${metrics.wordsPerMinute} WPM` : "--";
          fillerVal.textContent = metrics.fillerCount;
          confidenceVal.textContent = `${metrics.confidenceScore}%`;
          
          // Color grading for confidence
          if (metrics.confidenceScore >= 80) {
            confidenceVal.className = "metric-mini-val text-emerald";
          } else if (metrics.confidenceScore >= 60) {
            confidenceVal.className = "metric-mini-val text-cyan";
          } else {
            confidenceVal.className = "metric-mini-val text-rose";
          }
        },
        (finalMetrics) => {
          // Voice capture complete
          voiceRecordBtn.classList.remove('listening');
          dialogueText.textContent = finalMetrics.transcript || "No speech detected. Please try again.";
          
          // Display follow up reply from AI
          if (finalMetrics.transcript.trim().length > 0) {
            setTimeout(() => {
              triggerInterviewerReply(finalMetrics);
            }, 1500);
          }
        }
      );

      if (!started) {
        voiceRecordBtn.classList.remove('listening');
        dialogueText.textContent = "Speech recognition is not supported in this browser. Please type your reply instead!";
      }
    }
  });

  // Submit Typed Text Reply
  sendAnswerBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (!text) return;
    
    dialogueSpeakerName.textContent = "You (Typed)";
    dialogueSpeakerName.className = "dialogue-speaker user text-violet";
    dialogueText.textContent = text;
    textInput.value = "";
    
    // Simulate speech intelligence parsing
    window.speechEngineInstance.simulateTypeAnswer(
      text,
      null,
      (metrics) => {
        paceVal.textContent = `${metrics.wordsPerMinute} WPM`;
        fillerVal.textContent = metrics.fillerCount;
        confidenceVal.textContent = `${metrics.confidenceScore}%`;
        confidenceVal.className = "metric-mini-val text-emerald";
      },
      (finalMetrics) => {
        setTimeout(() => {
          triggerInterviewerReply(finalMetrics);
        }, 1500);
      }
    );
  });

  // Let interviewer react dynamically to the answer
  function triggerInterviewerReply(metrics) {
    dialogueSpeakerName.textContent = activePersona.name;
    dialogueSpeakerName.className = "dialogue-speaker text-cyan";
    
    let replyText = activePersona.responses.default;
    
    // Custom check: if user used fillers
    if (metrics.fillerCount > 2) {
      replyText = activePersona.responses.um;
    } else if (metrics.confidenceScore > 85) {
      replyText = activePersona.responses.agreement;
    }
    
    dialogueText.textContent = replyText;
    
    startVisualSpeechWave();
    window.speechEngineInstance.speak(
      replyText,
      activePersona,
      () => startVisualSpeechWave(),
      () => stopVisualSpeechWave()
    );
  }

  // Platform Mockup Visual Carousel Tab switches
  const mockupTabBtns = document.querySelectorAll('.mockup-tab-btn');
  const mockupSlides = document.querySelectorAll('.mockup-slide');

  mockupTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      mockupTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const tabId = btn.getAttribute('data-tab');
      mockupSlides.forEach(slide => {
        if (slide.getAttribute('id') === `mockup-${tabId}`) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });
    });
  });

  // FAQ Accordions Toggle
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // Load first persona default
  loadPersona(personas[0]);
});
