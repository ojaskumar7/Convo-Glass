// ConvoGlass App Logic Coordinator

// Global State
let currentView = 'dashboard';
let selectedRound = 'behavioral'; // behavioral, coding, sysdesign
let selectedPersona = null;
let selectedCompany = 'google';
let isResumeParsed = false;
let parsedResumeDetails = null;

// Mock Interview Session State
let activeSession = {
  isRecording: false,
  questionsAsked: 0,
  transcript: [],
  metricsHistory: [],
  codeRunCount: 0,
  currentQuestion: "",
  averagePace: 0,
  totalFillers: 0,
  averageConfidence: 0
};

// Monaco Editor Instance
let monacoEditorInstance = null;

// Chart Instances
let scoresChartInstance = null;
let speechChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize navigation and components
  initSetupPersonas();
  initRecentSessions();
  setupResumeDragDrop();
  
  // Set up microphone capture listener in app arena
  const arenaMicBtn = document.getElementById('arena-mic-btn');
  const arenaTextInput = document.getElementById('arena-text-input');
  const arenaSendBtn = document.getElementById('arena-send-btn');
  
  if (arenaMicBtn) {
    arenaMicBtn.addEventListener('click', toggleArenaVoiceRecording);
  }
  if (arenaSendBtn) {
    arenaSendBtn.addEventListener('click', submitArenaTypedAnswer);
  }
  if (arenaTextInput) {
    arenaTextInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') submitArenaTypedAnswer();
    });
  }
});

// Switch Views
function switchView(viewId) {
  currentView = viewId;
  
  // Update menu items class active
  const menuItems = ['menu-dash', 'menu-arena', 'menu-analytics'];
  menuItems.forEach(item => {
    const el = document.getElementById(item);
    if (el) el.classList.remove('active');
  });

  if (viewId === 'dashboard') {
    document.getElementById('menu-dash').classList.add('active');
  } else if (viewId === 'arena') {
    document.getElementById('menu-arena').classList.add('active');
  } else if (viewId === 'analytics') {
    document.getElementById('menu-analytics').classList.add('active');
    setTimeout(renderAnalyticsCharts, 100);
  }

  // Update views visible
  const views = ['view-dashboard', 'view-arena', 'view-feedback', 'view-analytics'];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (el) el.classList.remove('active');
  });

  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) targetView.classList.add('active');
}

// Injections: Personas setup
function initSetupPersonas() {
  const container = document.getElementById('setup-persona-grid');
  if (!container) return;
  
  container.innerHTML = '';
  
  INTERVIEW_PERSONAS.forEach((persona, index) => {
    const isSelected = index === 0;
    if (isSelected) selectedPersona = persona;

    const card = document.createElement('button');
    card.className = `setup-option-card ${isSelected ? 'selected' : ''}`;
    card.id = `setup-p-${persona.id}`;
    card.onclick = () => selectPersona(persona.id);
    
    card.innerHTML = `
      <span style="font-size:1.5rem;">${persona.emoji}</span>
      <div style="text-align:left;">
        <div style="font-size:0.85rem; font-weight:600;">${persona.name}</div>
        <div style="font-size:0.7rem; color:var(--text-secondary);">${persona.role}</div>
      </div>
    `;
    
    container.appendChild(card);
  });
}

function selectPersona(id) {
  INTERVIEW_PERSONAS.forEach(p => {
    const el = document.getElementById(`setup-p-${p.id}`);
    if (el) el.classList.remove('selected');
  });
  
  const target = document.getElementById(`setup-p-${id}`);
  if (target) target.classList.add('selected');
  
  selectedPersona = INTERVIEW_PERSONAS.find(p => p.id === id);
}

function selectRound(roundType) {
  const rounds = ['behavioral', 'coding', 'sysdesign'];
  rounds.forEach(r => {
    const el = document.getElementById(`opt-round-${r}`);
    if (el) el.classList.remove('selected');
  });
  
  const target = document.getElementById(`opt-round-${roundType}`);
  if (target) target.classList.add('selected');
  
  selectedRound = roundType;
}

// Setup Drag & Drop Resume PDF Mock
function setupResumeDragDrop() {
  const dropBox = document.getElementById('resume-upload-box');
  const statusLabel = document.getElementById('resume-upload-status');
  
  if (!dropBox) return;

  dropBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropBox.style.borderColor = 'var(--accent-cyan)';
    dropBox.style.background = 'rgba(6, 182, 212, 0.05)';
  });

  dropBox.addEventListener('dragleave', () => {
    dropBox.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    dropBox.style.background = 'rgba(255, 255, 255, 0.01)';
  });

  dropBox.addEventListener('drop', (e) => {
    e.preventDefault();
    simulateResumeParse();
  });

  dropBox.addEventListener('click', () => {
    simulateResumeParse();
  });

  function simulateResumeParse() {
    statusLabel.innerHTML = `<span class="text-violet">Scanning & Parsing PDF...</span>`;
    
    setTimeout(() => {
      isResumeParsed = true;
      parsedResumeDetails = {
        name: "Jane Doe",
        projects: ["TinyURL system", "Distributed cache architecture", "Collaborative web spreadsheet"],
        skills: ["Golang", "JavaScript/React", "Redis", "WebSockets", "Docker"]
      };
      
      dropBox.style.borderColor = 'var(--accent-emerald)';
      dropBox.style.background = 'rgba(16, 185, 129, 0.05)';
      statusLabel.innerHTML = `
        <span class="text-emerald" style="font-weight:700;">✓ Resume Parsed Successfully</span>
        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px;">
          Detected: URL Shortener project, distributed caches, React/Go skills.
        </div>
      `;
    }, 1500);
  }
}

// Enable local user camera feed
function enableWebcam() {
  const video = document.getElementById('webcam-video-element');
  const placeholder = document.getElementById('webcam-placeholder-box');
  
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (video) {
          video.srcObject = stream;
          video.style.display = 'block';
        }
        if (placeholder) {
          placeholder.style.display = 'none';
        }
      })
      .catch((err) => {
        console.warn("Unable to access camera: ", err);
        alert("Camera permission denied or camera not found. Proceeding with video avatar placeholder.");
      });
  } else {
    alert("Camera media capturing is not supported on this browser.");
  }
}

// Launch Interview Arena Core Loop
function launchArena() {
  switchView('arena');
  
  // Set UI Header values
  document.getElementById('arena-session-title').textContent = `${selectedRound.toUpperCase()} Round Session`;
  document.getElementById('arena-session-subtitle').textContent = `Target: ${selectedCompany.toUpperCase()} expectation • Personality: ${selectedPersona.name}`;
  
  document.getElementById('arena-interviewer-name').textContent = selectedPersona.name;
  document.getElementById('arena-interviewer-role').textContent = selectedPersona.role;
  document.getElementById('arena-avatar-emoji').textContent = selectedPersona.emoji;
  
  // Set Workspace view layout based on round selection
  const containers = {
    behavioral: document.getElementById('arena-sub-behavioral'),
    coding: document.getElementById('arena-sub-coding'),
    sysdesign: document.getElementById('arena-sub-sysdesign')
  };

  Object.keys(containers).forEach(key => {
    if (containers[key]) {
      containers[key].style.display = key === selectedRound ? 'flex' : 'none';
    }
  });

  // Reset metrics
  document.getElementById('arena-pace-val').textContent = "--";
  document.getElementById('arena-filler-val').textContent = "0";
  document.getElementById('arena-confidence-val').textContent = "0%";
  
  activeSession = {
    isRecording: false,
    questionsAsked: 0,
    transcript: [],
    metricsHistory: [],
    codeRunCount: 0,
    currentQuestion: "",
    averagePace: 0,
    totalFillers: 0,
    averageConfidence: 0
  };

  // Start Session Actions
  if (selectedRound === 'coding') {
    loadMonacoEnvironment();
  } else if (selectedRound === 'sysdesign') {
    setTimeout(initSystemDesignCanvas, 200);
  }

  // Trigger Persona voice greeting
  triggerInterviewerGreeting();
}

function triggerInterviewerGreeting() {
  const statusText = document.getElementById('arena-status-text');
  const statusIndicator = document.getElementById('arena-status-indicator');
  const transcriptBox = document.getElementById('arena-dialogue-transcript');
  
  if (statusText) statusText.textContent = "AI Interviewer Speaking...";
  if (statusIndicator) statusIndicator.style.background = 'var(--accent-cyan)';
  
  let greeting = selectedPersona.intro;
  
  // Tailor introduction to parsed resume projects
  if (isResumeParsed && parsedResumeDetails) {
    if (selectedRound === 'coding') {
      greeting = `Welcome Jane. Let's do a coding round. Since your resume lists a ${parsedResumeDetails.projects[0]} project, let's explore optimization structures. Look at the code on the screen.`;
    } else if (selectedRound === 'sysdesign') {
      greeting = `Welcome Jane. Let's discuss system design. Given your work designing a ${parsedResumeDetails.projects[1]}, I'd like you to draw a design for a TinyURL service on the board.`;
    } else {
      greeting = `Hey Jane! Glad to have you. Looking at your background in ${parsedResumeDetails.skills[0]} and your ${parsedResumeDetails.projects[2]}, I'd love to hear how you resolved engineering disagreements. Let's start there.`;
    }
  }

  // Add greeting to behavioral transcript if behavioral round
  if (selectedRound === 'behavioral') {
    appendChatBubble(selectedPersona.name, greeting, false);
  }

  activeSession.currentQuestion = greeting;
  
  // Speech synthesis speaking audio wave triggers
  startSpeechWaveAnimation();
  window.speechEngineInstance.speak(
    greeting,
    selectedPersona,
    () => startSpeechWaveAnimation(),
    () => {
      stopSpeechWaveAnimation();
      if (statusText) statusText.textContent = "Awaiting your reply...";
      if (statusIndicator) statusIndicator.style.background = 'var(--accent-violet)';
      
      // Inject standard follow up question if coding/system design
      if (selectedRound === 'coding') {
        const codingProblem = CODING_QUESTIONS[0];
        document.getElementById('code-problem-title').textContent = codingProblem.title;
        document.getElementById('code-problem-diff').textContent = codingProblem.difficulty;
        document.getElementById('code-problem-desc').textContent = codingProblem.description;
        
        appendConsoleLog(`AI Loaded: ${codingProblem.title}. Write your solution in the Monaco sandbox.`);
      } else if (selectedRound === 'sysdesign') {
        const sysTopic = SYSTEM_DESIGN_TOPICS[0];
        alert(`Interviewer instructions: Draw architectural nodes for ${sysTopic.title}. Target components: Client App, Load Balancer, Web Server, cache and databases.`);
      }
    }
  );
}

// User Answer Ingestion
function toggleArenaVoiceRecording() {
  const micBtn = document.getElementById('arena-mic-btn');
  const statusText = document.getElementById('arena-status-text');
  const transcriptBox = document.getElementById('arena-dialogue-transcript');
  
  if (window.speechEngineInstance.isListening) {
    window.speechEngineInstance.stopListening();
    micBtn.classList.remove('listening');
  } else {
    micBtn.classList.add('listening');
    if (statusText) statusText.textContent = "Listening to your voice...";
    
    // Inject temporary user bubble for speech preview
    let userBubbleId = null;
    if (selectedRound === 'behavioral') {
      userBubbleId = appendChatBubble("You", "Speaking...", true);
    }

    const started = window.speechEngineInstance.startListening(
      (interimText) => {
        // Update live speech preview
        if (selectedRound === 'behavioral' && userBubbleId) {
          const bubbleText = document.getElementById(userBubbleId).querySelector('.dialogue-text');
          if (bubbleText) bubbleText.textContent = interimText || "Listening...";
        } else {
          document.getElementById('arena-text-input').value = interimText;
        }
      },
      (liveMetrics) => {
        // Update dashboard indicators
        document.getElementById('arena-pace-val').textContent = liveMetrics.wordsPerMinute > 0 ? `${liveMetrics.wordsPerMinute} WPM` : "--";
        document.getElementById('arena-filler-val').textContent = liveMetrics.fillerCount;
        document.getElementById('arena-confidence-val').textContent = `${liveMetrics.confidenceScore}%`;
      },
      (finalMetrics) => {
        // Complete speech
        micBtn.classList.remove('listening');
        if (statusText) statusText.textContent = "Analyzing reply...";
        
        if (finalMetrics.transcript.trim().length > 0) {
          activeSession.metricsHistory.push(finalMetrics);
          
          if (selectedRound === 'behavioral') {
            const finalBubble = document.getElementById(userBubbleId);
            if (finalBubble) {
              finalBubble.querySelector('.dialogue-text').textContent = finalMetrics.transcript;
            }
          }
          
          // AI replies dynamically
          setTimeout(() => {
            triggerArenaAIReply(finalMetrics);
          }, 1500);
        } else {
          if (selectedRound === 'behavioral' && userBubbleId) {
            const bubble = document.getElementById(userBubbleId);
            if (bubble) bubble.remove();
          }
          if (statusText) statusText.textContent = "Awaiting reply...";
        }
      }
    );

    if (!started) {
      micBtn.classList.remove('listening');
      alert("Browser voice capturing recognition is not supported. Please type in the text box.");
    }
  }
}

function submitArenaTypedAnswer() {
  const textInput = document.getElementById('arena-text-input');
  const text = textInput.value.trim();
  if (!text) return;

  textInput.value = "";
  
  if (selectedRound === 'behavioral') {
    appendChatBubble("You", text, true);
  }

  // Simulate metrics parsing
  window.speechEngineInstance.simulateTypeAnswer(
    text,
    null,
    (liveMetrics) => {
      document.getElementById('arena-pace-val').textContent = `${liveMetrics.wordsPerMinute} WPM`;
      document.getElementById('arena-filler-val').textContent = liveMetrics.fillerCount;
      document.getElementById('arena-confidence-val').textContent = `${liveMetrics.confidenceScore}%`;
    },
    (finalMetrics) => {
      activeSession.metricsHistory.push(finalMetrics);
      setTimeout(() => {
        triggerArenaAIReply(finalMetrics);
      }, 1500);
    }
  );
}

function triggerArenaAIReply(userMetrics) {
  const statusText = document.getElementById('arena-status-text');
  const statusIndicator = document.getElementById('arena-status-indicator');
  
  if (statusText) statusText.textContent = "AI Interviewer Speaking...";
  if (statusIndicator) statusIndicator.style.background = 'var(--accent-cyan)';
  
  // Decide next question based on round and metrics
  activeSession.questionsAsked++;
  let reply = "";
  
  if (selectedRound === 'coding') {
    reply = "Excellent code structure. But have you evaluated complexity when the input array contains empty nodes or duplicates? How can we reduce allocations?";
    appendConsoleLog(`AI Feedback: ${reply}`);
  } else if (selectedRound === 'sysdesign') {
    reply = "That database schema setup is clear. Let's talk about scalability. What happens if the write operations spike to 20,000 requests per second? How will sharding and Redis factors play in?";
    alert(`AI Challenged: ${reply}`);
  } else {
    // Behavioral follow ups
    if (activeSession.questionsAsked === 1) {
      reply = "That's a sound resolution. How did you align the stakeholders who initially disagreed with your technology choice?";
    } else {
      reply = "Understood. That reflects strong technical ownership. Let's finish the mock here. Ready to see your scorecard report?";
    }
    appendChatBubble(selectedPersona.name, reply, false);
  }

  startSpeechWaveAnimation();
  window.speechEngineInstance.speak(
    reply,
    selectedPersona,
    () => startSpeechWaveAnimation(),
    () => {
      stopSpeechWaveAnimation();
      if (statusText) statusText.textContent = "Awaiting reply...";
      if (statusIndicator) statusIndicator.style.background = 'var(--accent-violet)';
    }
  );
}

// Dialog append helpers
function appendChatBubble(speaker, text, isUser) {
  const container = document.getElementById('arena-dialogue-transcript');
  if (!container) return null;

  const bubbleId = `bubble-${Date.now()}`;
  const bubble = document.createElement('div');
  bubble.className = `demo-dialogue`;
  bubble.id = bubbleId;
  bubble.style.borderLeft = isUser ? '3px solid var(--accent-violet)' : '3px solid var(--accent-cyan)';
  bubble.style.background = isUser ? 'rgba(139, 92, 246, 0.03)' : 'rgba(6, 182, 212, 0.03)';
  bubble.style.marginBottom = '8px';
  bubble.style.minHeight = 'auto';

  bubble.innerHTML = `
    <div class="dialogue-speaker ${isUser ? 'user text-violet' : 'text-cyan'}">${speaker}</div>
    <div class="dialogue-text">${text}</div>
  `;

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubbleId;
}

// Waveform visual loops
function startSpeechWaveAnimation() {
  const glow = document.getElementById('arena-avatar-glow');
  const bars = document.querySelectorAll('#arena-wave-container .wave-bar');
  
  if (glow) glow.classList.add('speaking');
  bars.forEach(bar => bar.classList.add('speaking'));
}

function stopSpeechWaveAnimation() {
  const glow = document.getElementById('arena-avatar-glow');
  const bars = document.querySelectorAll('#arena-wave-container .wave-bar');
  
  if (glow) glow.classList.remove('speaking');
  bars.forEach(bar => bar.classList.remove('speaking'));
}

// Pause session modal dialogs
function pauseSession() {
  window.speechEngineInstance.stopSpeaking();
  window.speechEngineInstance.stopListening();
  
  const modal = document.getElementById('custom-modal-backdrop');
  document.getElementById('modal-title').textContent = "Session Paused";
  document.getElementById('modal-message').textContent = "Your mock session is temporarily paused. Ready to resume practice?";
  document.getElementById('modal-btn-cancel').style.display = 'inline-flex';
  document.getElementById('modal-btn-action').textContent = "Resume Session";
  document.getElementById('modal-btn-action').onclick = () => {
    closeModal();
    // Continue audio checks
  };

  if (modal) modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('custom-modal-backdrop');
  if (modal) modal.classList.remove('active');
}

// Monaco Editor initialization via AMD Loader
function loadMonacoEnvironment() {
  const editorContainer = document.getElementById('monaco-code-container');
  if (!editorContainer) return;

  appendConsoleLog("Monaco loading starting...");
  
  // Check if Monaco is already loaded
  if (window.monaco && monacoEditorInstance) {
    appendConsoleLog("Monaco editor already exists. Reinitializing default starter code.");
    const codingProblem = CODING_QUESTIONS[0];
    monacoEditorInstance.setValue(codingProblem.languages.javascript.starter);
    return;
  }

  // Load Monaco resources using require.js
  if (typeof require !== 'undefined') {
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' } });
    require(['vs/editor/editor.main'], function () {
      const codingProblem = CODING_QUESTIONS[0];
      monacoEditorInstance = monaco.editor.create(editorContainer, {
        value: codingProblem.languages.javascript.starter,
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: false }
      });
      appendConsoleLog("Monaco Environment loaded successfully.");
    });
  } else {
    editorContainer.innerHTML = `<textarea id="fallback-code-area" class="text-input-field" style="width:100%; height:100%; font-family:var(--font-code); font-size:0.9rem;">// Write your JavaScript/Python code here...</textarea>`;
    appendConsoleLog("Warning: Monaco require.js missing. Falling back to plain text code buffer.");
  }
}

function appendConsoleLog(logText) {
  const consoleLog = document.getElementById('coding-console-logs');
  if (consoleLog) {
    consoleLog.innerHTML += `<br>[${new Date().toLocaleTimeString()}] ${logText}`;
    consoleLog.scrollTop = consoleLog.scrollHeight;
  }
}

// Simulate test case run
function simulateRunCode() {
  appendConsoleLog("Executing test scripts...");
  setTimeout(() => {
    appendConsoleLog("✓ Test case 1: twoSum([2,7,11,15], 9) -> Output: [0, 1] (Correct)");
    appendConsoleLog("✓ Test case 2: twoSum([3,2,4], 6) -> Output: [1, 2] (Correct)");
    appendConsoleLog("Test Run Complete. All 2 unit cases passed.");
  }, 1000);
}

function simulateSubmitCode() {
  appendConsoleLog("Submitting solution code for compilation...");
  setTimeout(() => {
    appendConsoleLog("✓ Compilation: Success (Zero syntax errors)");
    appendConsoleLog("✓ Running comprehensive test cases (10 passed / 0 failed)");
    appendConsoleLog("AI evaluator grading complete: Time Complexity O(N) | Space Complexity O(N)");
    alert("Code submitted successfully. Ready to click 'Finish & Evaluate' top right to see your detailed scorecard report.");
  }, 1200);
}

// Complete mock and route to feedback report
function finishInterview() {
  window.speechEngineInstance.stopSpeaking();
  window.speechEngineInstance.stopListening();
  
  switchView('feedback');

  // Compute final mock report metrics
  let finalScore = 84;
  let fillerCount = activeSession.metricsHistory.reduce((acc, curr) => acc + curr.fillerCount, 0);
  let averageConfidence = activeSession.metricsHistory.length > 0 
    ? Math.round(activeSession.metricsHistory.reduce((acc, curr) => acc + curr.confidenceScore, 0) / activeSession.metricsHistory.length)
    : 85;

  if (selectedRound === 'coding') {
    finalScore = 88;
  } else if (selectedRound === 'sysdesign') {
    finalScore = 82;
  } else {
    finalScore = 78;
  }

  // Update Feedback scorecard UI
  document.getElementById('report-score-val').textContent = finalScore;
  
  // Calculate SVG circular stroke offset: r=65 -> C = 2 * PI * r = 408
  const offset = 408 - (408 * finalScore) / 100;
  document.getElementById('report-circular-score').setAttribute('stroke-dashoffset', offset);

  // Update report parameters
  document.getElementById('rep-param-tech').textContent = `${finalScore}%`;
  document.getElementById('rep-bar-tech').style.width = `${finalScore}%`;
  
  document.getElementById('rep-param-comm').textContent = `${averageConfidence}%`;
  document.getElementById('rep-bar-comm').style.width = `${averageConfidence}%`;

  const paceScore = Math.min(100, Math.round(100 - (fillerCount * 5)));
  document.getElementById('rep-param-pace').textContent = `${paceScore}%`;
  document.getElementById('rep-bar-pace').style.width = `${paceScore}%`;

  // Inject Strengths
  const strengthsUl = document.getElementById('feedback-strengths');
  strengthsUl.innerHTML = `
    <li>Structured answers according to company expectations.</li>
    <li>Strong time/space complexity optimization insights.</li>
    <li>Calm speaking pace average WPM.</li>
  `;

  // Inject Weaknesses
  const weaknessesUl = document.getElementById('feedback-weaknesses');
  weaknessesUl.innerHTML = `
    <li>Used fillers (${fillerCount} total detected) during deep follow up questioning.</li>
    <li>Failed to mention edge case considerations immediately.</li>
  `;

  // Inject Critique comparison details
  const critiqueBox = document.getElementById('feedback-critique-box');
  critiqueBox.innerHTML = `
    <div style="font-size:0.8rem; color:var(--text-secondary); text-transform:uppercase; margin-bottom:6px;">SAMPLE RESPONSE AUDIT</div>
    <div style="margin-bottom:10px;">
      <strong class="text-violet">Your response highlights:</strong> 
      <div style="font-size:0.85rem; color:var(--text-secondary); font-style:italic; margin-top:2px;">
        "I'd probably use a hashmap and then check each index value to find if there is a match..."
      </div>
    </div>
    <div>
      <strong class="text-cyan">AI Improved recommendation suggestion:</strong>
      <div style="font-size:0.85rem; color:var(--text-secondary); font-style:italic; margin-top:2px;">
        "To find the target sum, I can iterate through the array using a map to lookup complements in O(1) time. This ensures a linear O(N) time complexity instead of a nested brute-force approach."
      </div>
    </div>
  `;

  // Inject Roadmap Topics
  const roadmapContainer = document.getElementById('feedback-roadmap-container');
  roadmapContainer.innerHTML = `
    <span style="font-size:0.75rem; background:rgba(139,92,246,0.1); color:var(--accent-violet); padding:4px 10px; border-radius:4px; font-weight:600;">Consistent Hashing</span>
    <span style="font-size:0.75rem; background:rgba(6,182,212,0.1); color:var(--accent-cyan); padding:4px 10px; border-radius:4px; font-weight:600;">Time Complexity Proofs</span>
    <span style="font-size:0.75rem; background:rgba(16,185,129,0.1); color:var(--accent-emerald); padding:4px 10px; border-radius:4px; font-weight:600;">Reducing filler phrases</span>
  `;

  // Save session to history data store
  saveSessionToHistory({
    date: new Date().toLocaleDateString(),
    round: selectedRound,
    score: finalScore,
    persona: selectedPersona.name,
    company: selectedCompany
  });
}

// Session History store
let recentSessionsData = [
  { date: "5/18/2026", round: "behavioral", score: 86, persona: "Friendly Fred", company: "Amazon" },
  { date: "5/15/2026", round: "coding", score: 78, persona: "FAANG Frank", company: "Google" }
];

function initRecentSessions() {
  const container = document.getElementById('dashboard-recent-sessions');
  if (!container) return;

  container.innerHTML = '';
  
  recentSessionsData.forEach(session => {
    const row = document.createElement('div');
    row.className = 'glass-panel';
    row.style.padding = '12px 16px';
    row.style.display = 'flex';
    row.style.justify = 'space-between';
    row.style.alignItems = 'center';
    row.style.background = 'rgba(255, 255, 255, 0.01)';
    row.style.border = '1px solid var(--border-color)';

    row.innerHTML = `
      <div>
        <div style="font-size:0.85rem; font-weight:700; text-transform:capitalize;">${session.round} Mock</div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">${session.date} • ${session.persona}</div>
      </div>
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="font-family:var(--font-heading); font-size:1.1rem; font-weight:800;" class="${session.score >= 80 ? 'text-emerald' : 'text-cyan'}">${session.score}%</span>
        <button class="btn btn-secondary" style="padding:6px 12px; font-size:0.75rem;" onclick="viewPastSessionDetails(${session.score})">View Report</button>
      </div>
    `;
    container.appendChild(row);
  });
}

function saveSessionToHistory(session) {
  recentSessionsData.unshift(session);
  initRecentSessions();
}

function viewPastSessionDetails(scoreVal) {
  switchView('feedback');
  document.getElementById('report-score-val').textContent = scoreVal;
  const offset = 408 - (408 * scoreVal) / 100;
  document.getElementById('report-circular-score').setAttribute('stroke-dashoffset', offset);
}

// Render Analytics Chart.js panels
function renderAnalyticsCharts() {
  const ctxScores = document.getElementById('chart-scores-line');
  const ctxSpeech = document.getElementById('chart-speech-scatter');
  
  if (!ctxScores || !ctxSpeech) return;

  // Clear previous charts
  if (scoresChartInstance) scoresChartInstance.destroy();
  if (speechChartInstance) speechChartInstance.destroy();

  // Color variables matching stylesheet
  const accentViolet = '#8b5cf6';
  const accentCyan = '#06b6d4';

  // 1. Line Chart: Scores Progress
  scoresChartInstance = new Chart(ctxScores, {
    type: 'line',
    data: {
      labels: ['Session 1', 'Session 2', 'Session 3', 'Session 4', 'Session 5', 'Session 6'],
      datasets: [{
        label: 'Interview Scores',
        data: [72, 75, 78, 80, 84, 88],
        borderColor: accentCyan,
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          min: 50,
          max: 100,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#a1a1aa' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#a1a1aa' }
        }
      }
    }
  });

  // 2. Scatter/Speech distribution Chart: filler words and WPM pace
  speechChartInstance = new Chart(ctxSpeech, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Speech Sessions',
        data: [
          { x: 100, y: 5 }, // slow start, filler heavy
          { x: 120, y: 3 }, 
          { x: 135, y: 2 }, 
          { x: 140, y: 1 }, 
          { x: 145, y: 0 }  // optimal
        ],
        backgroundColor: accentViolet,
        borderColor: 'rgba(139, 92, 246, 0.5)',
        borderWidth: 2,
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          title: { display: true, text: 'Pacing (Words Per Minute)', color: '#a1a1aa' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#a1a1aa' }
        },
        y: {
          title: { display: true, text: 'Filler Phrase Count', color: '#a1a1aa' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#a1a1aa' }
        }
      }
    }
  });
}
