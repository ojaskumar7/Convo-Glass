"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Terminal,
  BarChart3,
  GlassWater,
  FileUp,
  Play,
  Pause,
  CheckCircle,
  VideoOff,
  Bot,
  Mic,
  Send,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Award,
  Volume2
} from "lucide-react";

import {
  INTERVIEW_PERSONAS,
  InterviewerPersona,
  SessionMetrics
} from "../../lib/data";
import type { Chart as ChartType } from "chart.js";

import { getSpeechEngineInstance } from "../../lib/speech";
import CodeWorkspace from "../../components/CodeWorkspace";
import SystemDesignCanvas from "../../components/SystemDesignCanvas";

interface ChatBubble {
  id: string;
  speaker: string;
  text: string;
  isUser: boolean;
}

interface HistoricalSession {
  date: string;
  round: string;
  score: number;
  persona: string;
  company: string;
}

export default function WorkspacePage() {
  const [currentView, setCurrentView] = useState<"dashboard" | "arena" | "feedback" | "analytics">("dashboard");
  const [selectedRound, setSelectedRound] = useState<"behavioral" | "coding" | "sysdesign">("behavioral");
  const [selectedPersona, setSelectedPersona] = useState<InterviewerPersona>(INTERVIEW_PERSONAS[0]);
  const [selectedCompany, setSelectedCompany] = useState<string>("google");
  
  // Resume Parsing Mock State
  const [isResumeParsed, setIsResumeParsed] = useState<boolean>(false);
  const [isParsingResume, setIsParsingResume] = useState<boolean>(false);
  const [parsedResumeDetails, setParsedResumeDetails] = useState<{
    name: string;
    projects: string[];
    skills: string[];
  } | null>(null);

  // Active Mock Interview Session State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [arenaStatus, setArenaStatus] = useState<string>("Awaiting your reply...");
  const [arenaStatusColor, setArenaStatusColor] = useState<string>("var(--accent-violet)");
  const [chatInput, setChatInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatBubble[]>([]);

  // Session Statistics
  const [questionsAsked, setQuestionsAsked] = useState<number>(0);
  const [, setSessionMetricsHistory] = useState<SessionMetrics[]>([]);
  const [paceVal, setPaceVal] = useState<string>("--");
  const [fillerVal, setFillerVal] = useState<number>(0);
  const [confidenceVal, setConfidenceVal] = useState<number>(0);

  // Scorecard Evaluation Results State
  const [finalScore, setFinalScore] = useState<number>(84);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [critiqueSelf, setCritiqueSelf] = useState<string>("");
  const [critiqueAi, setCritiqueAi] = useState<string>("");
  const [roadmapTopics, setRoadmapTopics] = useState<string[]>([]);

  // Webcam Video Ref and Stream State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const webcamStreamRef = useRef<MediaStream | null>(null);

  // Custom modal state
  const [isModalActive, setIsModalActive] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalMessage, setModalMessage] = useState<string>("");
  
  // Historical Mocks State
  const [recentSessions, setRecentSessions] = useState<HistoricalSession[]>([
    { date: "5/18/2026", round: "behavioral", score: 86, persona: "Friendly Fred", company: "Amazon" },
    { date: "5/15/2026", round: "coding", score: 78, persona: "FAANG Frank", company: "Google" }
  ]);

  // Chart instances refs for performance analysis
  const chartScoresRef = useRef<ChartType | null>(null);
  const chartSpeechRef = useRef<ChartType | null>(null);
  const scoresCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const speechCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Speech engine reference
  const speechEngine = useRef(getSpeechEngineInstance());
  const chatIdCounterRef = useRef(0);

  const createChatId = (prefix: string) => {
    chatIdCounterRef.current += 1;
    return `${prefix}-${chatIdCounterRef.current}`;
  };

  const stopWebcam = useCallback(() => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }
    setIsWebcamActive(false);
  }, []);

  // Clean speech / video streams on unmount
  useEffect(() => {
    const engine = speechEngine.current;
    return () => {
      engine.stopSpeaking();
      engine.stopListening();
      stopWebcam();
    };
  }, [stopWebcam]);

  // Sync interviewer speech metrics inside the Arena voice loop
  const syncArenaSpeech = () => {
    // Start listening process
    if (isListening) {
      speechEngine.current.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      setArenaStatus("Listening to your voice...");
      setArenaStatusColor("var(--accent-violet)");

      // Create a temporary placeholder bubble for speech transcript
      const bubbleId = createChatId("speech-bubble");
      if (selectedRound === "behavioral") {
        setChatHistory((prev) => [
          ...prev,
          { id: bubbleId, speaker: "You", text: "Speaking...", isUser: true }
        ]);
      }

      const started = speechEngine.current.startListening(
        (interimText) => {
          if (selectedRound === "behavioral") {
            setChatHistory((prev) =>
              prev.map((c) => (c.id === bubbleId ? { ...c, text: interimText || "Listening..." } : c))
            );
          } else {
            setChatInput(interimText);
          }
        },
        (metrics) => {
          setPaceVal(metrics.wordsPerMinute > 0 ? `${metrics.wordsPerMinute} WPM` : "--");
          setFillerVal(metrics.fillerCount);
          setConfidenceVal(metrics.confidenceScore);
        },
        (finalMetrics) => {
          setIsListening(false);
          setArenaStatus("Analyzing reply...");

          if (finalMetrics.transcript.trim().length > 0) {
            setSessionMetricsHistory((prev) => [...prev, finalMetrics]);
            if (selectedRound === "behavioral") {
              setChatHistory((prev) =>
                prev.map((c) => (c.id === bubbleId ? { ...c, text: finalMetrics.transcript } : c))
              );
            }
            setTimeout(() => {
              triggerInterviewerReply();
            }, 1200);
          } else {
            if (selectedRound === "behavioral") {
              setChatHistory((prev) => prev.filter((c) => c.id !== bubbleId));
            }
            setArenaStatus("Awaiting reply...");
          }
        }
      );

      if (!started) {
        setIsListening(false);
        setArenaStatus("Awaiting reply...");
        alert("Browser voice recognition is not supported. Please type your reply in the input field.");
      }
    }
  };

  const submitTypedArenaAnswer = () => {
    const text = chatInput.trim();
    if (!text) return;

    setChatInput("");
    if (selectedRound === "behavioral") {
      setChatHistory((prev) => [
        ...prev,
        { id: createChatId("typed"), speaker: "You", text, isUser: true }
      ]);
    }

    setArenaStatus("Analyzing reply...");
    speechEngine.current.simulateTypeAnswer(
      text,
      undefined,
      (metrics) => {
        setPaceVal(`${metrics.wordsPerMinute} WPM`);
        setFillerVal(metrics.fillerCount);
        setConfidenceVal(metrics.confidenceScore);
      },
      (finalMetrics) => {
        setSessionMetricsHistory((prev) => [...prev, finalMetrics]);
        setTimeout(() => {
          triggerInterviewerReply();
        }, 1200);
      }
    );
  };

  const triggerInterviewerReply = () => {
    setQuestionsAsked((prev) => prev + 1);
    setArenaStatus("AI Interviewer Speaking...");
    setArenaStatusColor("var(--accent-cyan)");
    
    let reply = "";
    if (selectedRound === "coding") {
      reply = "Excellent code structure. But have you evaluated complexity when the input array contains empty nodes or duplicates? How can we reduce allocations?";
    } else if (selectedRound === "sysdesign") {
      reply = "That database schema setup is clear. Let's talk about scalability. What happens if the write operations spike to 20,000 requests per second? How will sharding and Redis factors play in?";
    } else {
      // Behavioral round responses
      const qIndex = questionsAsked + 1;
      if (qIndex === 1) {
        reply = "That's a sound resolution. How did you align the stakeholders who initially disagreed with your technology choice?";
      } else {
        reply = "Understood. That reflects strong technical ownership. Let's finish the mock here. Ready to see your scorecard report?";
      }
      setChatHistory((prev) => [
        ...prev,
        { id: createChatId("ai-reply"), speaker: selectedPersona.name, text: reply, isUser: false }
      ]);
    }

    setIsSpeaking(true);
    speechEngine.current.speak(
      reply,
      selectedPersona,
      () => setIsSpeaking(true),
      () => {
        setIsSpeaking(false);
        setArenaStatus("Awaiting reply...");
        setArenaStatusColor("var(--accent-violet)");
      }
    );
  };

  // Launch Arena
  const handleLaunchArena = () => {
    setCurrentView("arena");
    setQuestionsAsked(0);
    setChatHistory([]);
    setSessionMetricsHistory([]);
    setPaceVal("--");
    setFillerVal(0);
    setConfidenceVal(0);

    // Initial interviewer greeting
    setArenaStatus("AI Interviewer Speaking...");
    setArenaStatusColor("var(--accent-cyan)");

    let greeting = selectedPersona.intro;
    if (isResumeParsed && parsedResumeDetails) {
      if (selectedRound === "coding") {
        greeting = `Welcome ${parsedResumeDetails.name}. Let's do a coding round. Since your resume lists a ${parsedResumeDetails.projects[0]} project, let's explore optimization structures. Look at the code on the screen.`;
      } else if (selectedRound === "sysdesign") {
        greeting = `Welcome ${parsedResumeDetails.name}. Let's discuss system design. Given your work designing a ${parsedResumeDetails.projects[1]}, I'd like you to draw a design for a URL shortener service on the board.`;
      } else {
        greeting = `Welcome ${parsedResumeDetails.name}! Glad to have you. Looking at your background in ${parsedResumeDetails.skills[0]} and your ${parsedResumeDetails.projects[2]}, I'd love to hear how you resolved engineering disagreements. Let's start there.`;
      }
    }

    if (selectedRound === "behavioral") {
      setChatHistory([
        { id: "greeting", speaker: selectedPersona.name, text: greeting, isUser: false }
      ]);
    }

    setIsSpeaking(true);
    speechEngine.current.speak(
      greeting,
      selectedPersona,
      () => setIsSpeaking(true),
      () => {
        setIsSpeaking(false);
        setArenaStatus("Awaiting reply...");
        setArenaStatusColor("var(--accent-violet)");
      }
    );
  };

  // Resume PDF Parser simulation
  const handleResumeSimulation = () => {
    setIsParsingResume(true);
    setParsedResumeDetails(null);

    setTimeout(() => {
      setIsResumeParsed(true);
      setIsParsingResume(false);
      setParsedResumeDetails({
        name: "Jane Doe",
        projects: ["TinyURL system", "Distributed cache architecture", "Collaborative web spreadsheet"],
        skills: ["Golang", "JavaScript/React", "Redis", "WebSockets", "Docker"]
      });
    }, 1500);
  };

  // Webcam Controls
  const enableWebcam = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          setIsWebcamActive(true);
          webcamStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn("Unable to access camera: ", err);
          alert("Camera permission denied or camera not found. Proceeding with video avatar placeholder.");
        });
    } else {
      alert("Camera media capturing is not supported on this browser.");
    }
  };

  // Finish Interview & Grade Scorecard
  const handleFinishInterview = () => {
    speechEngine.current.stopSpeaking();
    speechEngine.current.stopListening();
    setIsSpeaking(false);
    setIsListening(false);
    
    let score = 84;
    if (selectedRound === "coding") {
      score = 88;
      setStrengths([
        "Implemented optimal twoSum map lookup with O(N) complexity.",
        "Clear explanation of memory allocation limits.",
        "High readability with inline comment annotations."
      ]);
      setWeaknesses([
        "Used fillers during prompt constraints questions.",
        "Missed duplicate inputs edge case checks on first run."
      ]);
      setCritiqueSelf('Your code: "I\'d probably check all items using maps to find matches..."');
      setCritiqueAi('AI: "To find targets, we iterate numbers mapping complements in O(1) time. This ensures a linear O(N) execution rather than brute-force quadratic loops."');
      setRoadmapTopics(["Consistent Hashing", "Reducing space allocations", "Linked list reversals"]);
    } else if (selectedRound === "sysdesign") {
      score = 82;
      setStrengths([
        "Solid partition boundaries for database replication.",
        "Addressed single-points-of-failures using local caches.",
        "Appropriate choice of KGS (Key Generation Service)."
      ]);
      setWeaknesses([
        "Underestimated load balancer connection queue lengths.",
        "Did not discuss consistent hashing for Redis clusters."
      ]);
      setCritiqueSelf('Your layout: "We can place a cache and a SQL DB side by side..."');
      setCritiqueAi('AI: "Excellent, but describe replication sync models. E.g., write-through vs write-back caches to avoid stale read nodes."');
      setRoadmapTopics(["Consistent Hashing", "Distributed Locking", "Write-back cache syncs"]);
    } else {
      score = 78;
      setStrengths([
        "Strong STAR structural storytelling.",
        "Exhibited clear technical ownership and cross-team alignment.",
        "Calm pacing (130 WPM average)."
      ]);
      setWeaknesses([
        "Used filler words (um, like, basically) during stakeholder conflict question.",
        "Failed to quantify project impact details."
      ]);
      setCritiqueSelf('Your response: "We had a conflict about databases and then I convinced them..."');
      setCritiqueAi('AI: "Refine conflict steps: State technical metrics (e.g. read speed), write a POC to compare, gather stakeholders to review data. This removes emotional bias."');
      setRoadmapTopics(["STAR quantifications", "Reducing filler phrases", "Stakeholder communications"]);
    }

    setFinalScore(score);
    setCurrentView("feedback");

    // Store in historical sessions list
    const newHistorySession: HistoricalSession = {
      date: new Date().toLocaleDateString(),
      round: selectedRound,
      score: score,
      persona: selectedPersona.name,
      company: selectedCompany
    };
    setRecentSessions((prev) => [newHistorySession, ...prev]);
  };

  // Pause Mock Session
  const handlePauseSession = () => {
    speechEngine.current.stopSpeaking();
    speechEngine.current.stopListening();
    setIsSpeaking(false);
    setIsListening(false);
    setArenaStatus("Session Paused");

    setModalTitle("Session Paused");
    setModalMessage("Your practice session is temporarily on hold. Ready to resume practice?");
    setIsModalActive(true);
  };

  // Analytics Chart rendering
  useEffect(() => {
    if (currentView !== "analytics" || !scoresCanvasRef.current || !speechCanvasRef.current) return;
    let isCancelled = false;

    async function renderCharts() {
      const { Chart, registerables } = await import("chart.js");
      if (isCancelled || !scoresCanvasRef.current || !speechCanvasRef.current) return;

      Chart.register(...registerables);

      // Destroy existing chart instances if they exist
      if (chartScoresRef.current) chartScoresRef.current.destroy();
      if (chartSpeechRef.current) chartSpeechRef.current.destroy();

      const accentCyan = "#06b6d4";
      const accentViolet = "#8b5cf6";

      // 1. Scores line chart
      chartScoresRef.current = new Chart(scoresCanvasRef.current, {
        type: "line",
        data: {
          labels: ["Session 1", "Session 2", "Session 3", "Session 4", "Session 5", "Session 6"],
          datasets: [
            {
              label: "Interview Scores",
              data: [72, 75, 78, 80, 84, 88],
              borderColor: accentCyan,
              backgroundColor: "rgba(6, 182, 212, 0.1)",
              borderWidth: 2,
              tension: 0.3,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              min: 50,
              max: 100,
              grid: { color: "rgba(255, 255, 255, 0.05)" },
              ticks: { color: "#a1a1aa" }
            },
            x: {
              grid: { display: false },
              ticks: { color: "#a1a1aa" }
            }
          }
        }
      });

      // 2. Speech scatter chart
      chartSpeechRef.current = new Chart(speechCanvasRef.current, {
        type: "scatter",
        data: {
          datasets: [
            {
              label: "Speech Sessions",
              data: [
                { x: 100, y: 5 },
                { x: 120, y: 3 },
                { x: 135, y: 2 },
                { x: 140, y: 1 },
                { x: 145, y: 0 }
              ],
              backgroundColor: accentViolet,
              borderColor: "rgba(139, 92, 246, 0.5)",
              borderWidth: 2,
              pointRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              title: { display: true, text: "Filler Words Count", color: "#a1a1aa" },
              min: 0,
              max: 6,
              grid: { color: "rgba(255, 255, 255, 0.05)" },
              ticks: { color: "#a1a1aa", stepSize: 1 }
            },
            x: {
              title: { display: true, text: "Pace (Words Per Minute)", color: "#a1a1aa" },
              min: 80,
              max: 180,
              grid: { color: "rgba(255, 255, 255, 0.05)" },
              ticks: { color: "#a1a1aa" }
            }
          }
        }
      });
    }

    renderCharts();

    return () => {
      isCancelled = true;
      if (chartScoresRef.current) chartScoresRef.current.destroy();
      if (chartSpeechRef.current) chartSpeechRef.current.destroy();
    };
  }, [currentView]);

  return (
    <div className="app-container" style={{ display: "flex", width: "100vw", height: "100vh", background: "var(--bg-primary)" }}>
      {/* Sidebar Navigation */}
      <div className="app-sidebar">
        <div className="sidebar-header">
          <Link href="/" className="logo" style={{ fontSize: "1.35rem" }}>
            <GlassWater style={{ stroke: "url(#logo-grad-app)", strokeWidth: 2.5 }} />
            <span>ConvoGlass</span>
          </Link>
          <svg width="0" height="0">
            <linearGradient id="logo-grad-app" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </svg>
        </div>

        <nav style={{ flex: 1 }}>
          <ul className="sidebar-menu" style={{ padding: 0 }}>
            <li>
              <button
                className={`menu-item ${currentView === "dashboard" ? "active" : ""}`}
                onClick={() => {
                  setCurrentView("dashboard");
                  stopWebcam();
                }}
                style={{ background: "none", border: "none", width: "100%", textAlign: "left" }}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </button>
            </li>
            <li>
              <button
                className={`menu-item ${currentView === "arena" ? "active" : ""}`}
                onClick={handleLaunchArena}
                style={{ background: "none", border: "none", width: "100%", textAlign: "left" }}
              >
                <Terminal size={18} />
                Practice Arena
              </button>
            </li>
            <li>
              <button
                className={`menu-item ${currentView === "analytics" ? "active" : ""}`}
                onClick={() => {
                  setCurrentView("analytics");
                  stopWebcam();
                }}
                style={{ background: "none", border: "none", width: "100%", textAlign: "left" }}
              >
                <BarChart3 size={18} />
                Performance
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">JD</div>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Jane Doe</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Pro Practitioner</div>
          </div>
        </div>
      </div>

      {/* Main Workspace Content */}
      <div className="app-content" style={{ flex: 1, padding: "30px", overflowY: "auto", position: "relative" }}>
        <div className="bg-glow-sphere" style={{ top: "-10%", right: "-10%" }}></div>

        {/* 1. DASHBOARD VIEW */}
        {currentView === "dashboard" && (
          <div className="app-view active" id="view-dashboard">
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.8rem", fontWeight: 800, marginBottom: "24px" }}>
              Welcome back, Jane!
            </h2>

            <div className="dashboard-metrics">
              <div className="glass-panel metric-card">
                <span className="metric-title">Average Score</span>
                <div className="metric-value text-cyan">82%</div>
                <span style={{ fontSize: "0.8rem", color: "var(--accent-emerald)" }}>↑ 4% this week</span>
              </div>
              <div className="glass-panel metric-card">
                <span className="metric-title">Mocks Completed</span>
                <div className="metric-value text-violet">12</div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Goal: 20 per month</span>
              </div>
              <div className="glass-panel metric-card">
                <span className="metric-title">Filler Word Rate</span>
                <div className="metric-value text-rose">1.8%</div>
                <span style={{ fontSize: "0.8rem", color: "var(--accent-emerald)" }}>↓ 0.5% lower</span>
              </div>
              <div className="glass-panel metric-card">
                <span className="metric-title">Practice Duration</span>
                <div className="metric-value">8.5h</div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>2.4h coding edit</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "24px" }}>
              {/* Setup Wizard Panel */}
              <div className="glass-panel" style={{ padding: "24px" }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.25rem", marginBottom: "16px" }}>
                  Configure Practice Mock Session
                </h3>

                {/* Resume upload parser */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "8px" }}>
                    Resume Customization (Optional)
                  </div>
                  <div className="resume-upload-zone" onClick={handleResumeSimulation} style={{ cursor: "pointer" }}>
                    <FileUp style={{ color: "var(--accent-violet)", marginBottom: "8px" }} size={28} />
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      {isParsingResume ? (
                        <span className="text-violet">Scanning & Parsing PDF...</span>
                      ) : isResumeParsed ? (
                        <span className="text-emerald" style={{ fontWeight: 700 }}>✓ Resume Parsed Successfully</span>
                      ) : (
                        "Drag & Drop Resume PDF here"
                      )}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                      {isResumeParsed && parsedResumeDetails ? (
                        `Detected: ${parsedResumeDetails.projects[0]}, ${parsedResumeDetails.skills[0]} skills.`
                      ) : (
                        "AI constructs questions matching your work history"
                      )}
                    </div>
                  </div>
                </div>

                {/* Setup options */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* 1. Round Type */}
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "8px" }}>
                      1. Interview Round Type
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                      <button
                        className={`setup-option-card ${selectedRound === "behavioral" ? "selected" : ""}`}
                        onClick={() => setSelectedRound("behavioral")}
                      >
                        <Volume2 className="text-violet" size={16} />
                        <div style={{ textAlign: "left", fontSize: "0.85rem", fontWeight: 600 }}>HR / Behavioral</div>
                      </button>
                      <button
                        className={`setup-option-card ${selectedRound === "coding" ? "selected" : ""}`}
                        onClick={() => setSelectedRound("coding")}
                      >
                        <Terminal className="text-cyan" size={16} />
                        <div style={{ textAlign: "left", fontSize: "0.85rem", fontWeight: 600 }}>Technical Coding</div>
                      </button>
                      <button
                        className={`setup-option-card ${selectedRound === "sysdesign" ? "selected" : ""}`}
                        onClick={() => setSelectedRound("sysdesign")}
                      >
                        <BarChart3 className="text-emerald" size={16} />
                        <div style={{ textAlign: "left", fontSize: "0.85rem", fontWeight: 600 }}>System Design</div>
                      </button>
                    </div>
                  </div>

                  {/* 2. Interviewer Persona */}
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "8px" }}>
                      2. Interviewer Persona
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                      {INTERVIEW_PERSONAS.map((persona) => (
                        <button
                          key={persona.id}
                          className={`setup-option-card ${selectedPersona.id === persona.id ? "selected" : ""}`}
                          onClick={() => setSelectedPersona(persona)}
                        >
                          <span style={{ fontSize: "1.2rem" }}>{persona.emoji}</span>
                          <div style={{ textAlign: "left" }}>
                            <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{persona.name}</div>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>{persona.role}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Company Format */}
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "8px" }}>
                      3. Target Company Style
                    </div>
                    <select
                      className="text-input-field"
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      style={{ width: "100%", cursor: "pointer", background: "rgba(10, 10, 15, 0.8)", border: "1px solid var(--border-color)", color: "#fff", borderRadius: "4px", padding: "8px" }}
                    >
                      <option value="google">Google (Algorithmic Focus & Math)</option>
                      <option value="amazon">Amazon (Leadership Principles Focus)</option>
                      <option value="meta">Meta (Fast-Paced Speed Coding)</option>
                      <option value="startup">Sleek Startup (Pragmatic Architecture & Autonomy)</option>
                    </select>
                  </div>

                  <button className="btn btn-primary" onClick={handleLaunchArena} style={{ width: "100%", padding: "14px", marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <Play size={16} />
                    Launch Interview Arena
                  </button>
                </div>
              </div>

              {/* History panel */}
              <div className="glass-panel" style={{ padding: "24px" }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.25rem", marginBottom: "16px" }}>
                  Recent Sessions
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {recentSessions.map((session, idx) => (
                    <div
                      key={idx}
                      className="glass-panel"
                      style={{
                        padding: "12px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "rgba(255, 255, 255, 0.01)",
                        border: "1px solid var(--border-color)"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "capitalize" }}>
                          {session.round} Mock
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          {session.date} • {session.persona}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 800 }} className={session.score >= 80 ? "text-emerald" : "text-cyan"}>
                          {session.score}%
                        </span>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                          onClick={() => {
                            setFinalScore(session.score);
                            // Populate default mockup feedback for history review
                            if (session.round === "coding") {
                              setSelectedRound("coding");
                              setStrengths(["Implemented optimal twoSum map lookup with O(N) complexity.", "Clean memory layouts."]);
                              setWeaknesses(["Used filler words under query challenge."]);
                            } else if (session.round === "sysdesign") {
                              setSelectedRound("sysdesign");
                              setStrengths(["Solid boundaries representation.", "High uptime configurations."]);
                              setWeaknesses(["Ineffective indexing choices."]);
                            } else {
                              setSelectedRound("behavioral");
                              setStrengths(["Strong STAR storytelling method.", "Calm pacing."]);
                              setWeaknesses(["Minor filler count in introduction."]);
                            }
                            setCurrentView("feedback");
                          }}
                        >
                          View Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PRACTICE ARENA VIEW */}
        {currentView === "arena" && (
          <div className="app-view active" id="view-arena">
            {/* Control Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.4rem", margin: 0 }}>
                  {selectedRound.toUpperCase()} Round Session
                </h2>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Target: {selectedCompany.toUpperCase()} expectation • Personality: {selectedPersona.name}
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn btn-secondary" onClick={handlePauseSession} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Pause size={14} />
                  Pause
                </button>
                <button className="btn btn-primary btn-cyan" onClick={handleFinishInterview} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle size={14} />
                  Finish & Evaluate
                </button>
              </div>
            </div>

            <div className="arena-layout">
              {/* Left Column: Interviewer Video and Audio metrics */}
              <div className="arena-left">
                <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Bot className="text-cyan" size={18} />
                      <span style={{ fontWeight: 700 }}>{selectedPersona.name}</span>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem" }}>
                      {selectedPersona.role}
                    </div>
                  </div>

                  {/* AI Video Avatar */}
                  <div className="avatar-card" style={{ aspectRatio: "16/10", position: "relative" }}>
                    <div className={`avatar-speaking-glow ${isSpeaking ? "speaking" : ""}`}></div>
                    <div className="avatar-video-placeholder">
                      <span className="avatar-image">{selectedPersona.emoji}</span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>AI INTERVIEWER STREAM</span>
                    </div>
                  </div>

                  {/* Waveform */}
                  <div className="wave-container" style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <div key={idx} className={`wave-bar ${isSpeaking ? "speaking" : ""}`}></div>
                    ))}
                  </div>

                  {/* Speech State Indicator */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", padding: "4px 12px", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: arenaStatusColor }}></span>
                      <span>{arenaStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Webcam Feed of Candidate */}
                <div className="camera-card">
                  {!isWebcamActive ? (
                    <div className="camera-placeholder">
                      <VideoOff style={{ color: "var(--text-muted)", marginBottom: "8px" }} size={24} />
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Webcam Feed (Inactive)</span>
                      <button className="btn btn-secondary" onClick={enableWebcam} style={{ fontSize: "0.7rem", padding: "6px 12px", marginTop: "8px" }}>
                        Enable Camera
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: "100%", height: "100%", position: "relative" }}>
                      <video ref={videoRef} className="camera-video" style={{ display: "block" }} autoPlay playsInline muted></video>
                      <button
                        className="btn btn-secondary"
                        onClick={stopWebcam}
                        style={{ position: "absolute", bottom: "8px", right: "8px", fontSize: "0.65rem", padding: "4px 8px", background: "rgba(0, 0, 0, 0.6)", borderColor: "rgba(255, 255, 255, 0.2)" }}
                      >
                        Disable Camera
                      </button>
                    </div>
                  )}
                </div>

                {/* Speech metrics widget */}
                <div className="glass-panel" style={{ padding: "16px" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "12px" }}>
                    Real-time Speech Metrics
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: "1rem", fontWeight: 700 }}>{paceVal}</div>
                      <div style={{ fontSize: "0.6rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Speaking Pace</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: "1rem", fontWeight: 700 }}>{fillerVal}</div>
                      <div style={{ fontSize: "0.6rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Filler Count</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: "1rem", fontWeight: 700 }}>{confidenceVal > 0 ? `${confidenceVal}%` : "0%"}</div>
                      <div style={{ fontSize: "0.6rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Confidence</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Work Environment */}
              <div className="arena-right glass-panel" style={{ background: "rgba(10, 10, 15, 0.4)" }}>
                {/* A: Behavioral Chat */}
                {selectedRound === "behavioral" && (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "20px" }}>
                    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px", maxHeight: "400px" }}>
                      {chatHistory.map((bubble) => (
                        <div
                          key={bubble.id}
                          className="demo-dialogue"
                          style={{
                            borderLeft: bubble.isUser ? "3px solid var(--accent-violet)" : "3px solid var(--accent-cyan)",
                            background: bubble.isUser ? "rgba(139, 92, 246, 0.03)" : "rgba(6, 182, 212, 0.03)",
                            marginBottom: "8px",
                            padding: "12px",
                            borderRadius: "6px"
                          }}
                        >
                          <div className={`dialogue-speaker ${bubble.isUser ? "user text-violet" : "text-cyan"}`} style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "4px" }}>
                            {bubble.speaker}
                          </div>
                          <div className="dialogue-text" style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>{bubble.text}</div>
                        </div>
                      ))}
                    </div>

                    <div className="demo-input-container" style={{ display: "flex", gap: "10px" }}>
                      <button
                        className={`speech-btn ${isListening ? "listening" : ""}`}
                        onClick={syncArenaSpeech}
                        style={{ width: "55px", height: "55px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Mic size={22} />
                      </button>
                      <input
                        type="text"
                        className="text-input-field"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") submitTypedArenaAnswer();
                        }}
                        placeholder="Speak your answer or type here..."
                        style={{ flex: 1, height: "55px" }}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={submitTypedArenaAnswer}
                        style={{ height: "55px", width: "55px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* B: Coding Editor Sandbox */}
                {selectedRound === "coding" && (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "12px" }}>
                    <CodeWorkspace
                      onCodeSubmitComplete={() => {
                        setArenaStatus("AI Interviewer Speaking...");
                        setArenaStatusColor("var(--accent-cyan)");
                        setIsSpeaking(true);
                        
                        speechEngine.current.speak(
                          "Your code looks fully functional and optimized under runtime scenarios. Let's see your final grading evaluation report.",
                          selectedPersona,
                          () => setIsSpeaking(true),
                          () => {
                            setIsSpeaking(false);
                            setArenaStatus("Ready to Grade");
                            setArenaStatusColor("var(--accent-emerald)");
                          }
                        );
                      }}
                    />
                  </div>
                )}

                {/* C: System Design Canvas */}
                {selectedRound === "sysdesign" && (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <SystemDesignCanvas />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. FEEDBACK REPORT VIEW */}
        {currentView === "feedback" && (
          <div className="app-view active" id="view-feedback">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.8rem", fontWeight: 800, marginBottom: "4px" }}>
                  Evaluation Report
                </h2>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Candidate: Jane Doe • Target: {selectedCompany.toUpperCase()} expectation • Style: {selectedRound.toUpperCase()}
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => setCurrentView("dashboard")} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <ArrowLeft size={16} />
                Back to Dashboard
              </button>
            </div>

            <div className="report-grid">
              {/* Left Column Score Card */}
              <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px", alignItems: "center", textAlign: "center" }}>
                <span className="badge-pass" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Award size={14} />
                  PASS / OFFER READY
                </span>
                
                <div style={{ position: "relative", width: "150px", height: "150px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <svg width="150" height="150" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="75" cy="75" r="65" stroke="rgba(255,255,255,0.05)" stroke-width="12" fill="transparent"/>
                    <circle
                      cx="75"
                      cy="75"
                      r="65"
                      stroke="var(--accent-cyan)"
                      stroke-width="12"
                      fill="transparent"
                      stroke-linecap="round"
                      stroke-dasharray="408"
                      stroke-dashoffset={408 - (408 * finalScore) / 100}
                      style={{ transition: "stroke-dashoffset 1s ease-out" }}
                    />
                  </svg>
                  <div style={{ position: "absolute", fontFamily: "var(--font-heading)", fontSize: "2.8rem", fontWeight: 800, color: "#fff" }}>
                    {finalScore}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.25rem", margin: 0 }}>
                    Overall Score
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "6px" }}>
                    Excellent structural answers with detailed considerations.
                  </p>
                </div>

                {/* Parameters scale */}
                <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", gap: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "4px" }}>
                      <span>Technical Logic</span>
                      <span className="text-cyan">{finalScore}%</span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${finalScore}%`, height: "100%", background: "var(--accent-cyan)" }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "4px" }}>
                      <span>STAR Communication</span>
                      <span className="text-violet">90%</span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: "90%", height: "100%", background: "var(--accent-violet)" }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "4px" }}>
                      <span>Pace & Speed</span>
                      <span className="text-emerald">80%</span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: "80%", height: "100%", background: "var(--accent-emerald)" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column Detailed Insights */}
              <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--accent-emerald)", fontSize: "1rem", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
                      <CheckCircle2 size={16} /> Key Strengths
                    </h4>
                    <ul style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "16px" }}>
                      {strengths.map((str, idx) => <li key={idx}>{str}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--accent-rose)", fontSize: "1rem", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
                      <AlertTriangle size={16} /> Improvements
                    </h4>
                    <ul style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "16px" }}>
                      {weaknesses.map((wk, idx) => <li key={idx}>{wk}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Breakdown critique comparison */}
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                  <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1rem", marginBottom: "12px", margin: 0 }}>
                    Answer Breakdown & Critique
                  </h4>
                  <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "16px", marginTop: "8px" }}>
                    <div style={{ marginBottom: "10px" }}>
                      <strong className="text-violet">Your response highlights:</strong>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontStyle: "italic", marginTop: "2px" }}>
                        {critiqueSelf || '"Let\'s check all values to see if there is a match..."'}
                      </div>
                    </div>
                    <div>
                      <strong className="text-cyan">AI recommendation suggestion:</strong>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontStyle: "italic", marginTop: "2px" }}>
                        {critiqueAi || '"Using complements mapping speeds up execution time complexity to O(N)."'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personalized roadmap */}
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                  <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1rem", marginBottom: "10px", color: "var(--accent-cyan)", margin: 0 }}>
                    Recommended Roadmap Topics
                  </h4>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                    {roadmapTopics.map((topic, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "0.75rem",
                          background: "rgba(6, 182, 212, 0.1)",
                          color: "var(--accent-cyan)",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontWeight: 600
                        }}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. PERFORMANCE / ANALYTICS VIEW */}
        {currentView === "analytics" && (
          <div className="app-view active" id="view-analytics">
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.8rem", fontWeight: 800, marginBottom: "24px" }}>
              Practice Analytics Dashboard
            </h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", marginBottom: "24px" }}>
              <div className="glass-panel" style={{ padding: "20px", height: "380px", display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.1rem", marginBottom: "12px", margin: 0 }}>
                  Interview Score Trajectory
                </h3>
                <div style={{ flex: 1, position: "relative" }}>
                  <canvas ref={scoresCanvasRef}></canvas>
                </div>
              </div>
              
              <div className="glass-panel" style={{ padding: "20px", height: "380px", display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.1rem", marginBottom: "12px", margin: 0 }}>
                  Filler Words & Speech Speed Distribution
                </h3>
                <div style={{ flex: 1, position: "relative" }}>
                  <canvas ref={speechCanvasRef}></canvas>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "20px" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.1rem", marginBottom: "16px", margin: 0 }}>
                Skill Strengths & Domain-wise Performance
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px" }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: "0.9rem", fontWeight: 700, marginBottom: "10px" }}>
                    Coding Algorithm Speed
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-cyan)" }}>24 min</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-emerald)", marginTop: "4px" }}>
                    ↓ 6 minutes faster than average candidate
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px" }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: "0.9rem", fontWeight: 700, marginBottom: "10px" }}>
                    System Scalability Score
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-violet)" }}>86%</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                    High coverage of cache & load balancer nodes
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px" }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: "0.9rem", fontWeight: 700, marginBottom: "10px" }}>
                    Behavioral Leadership Rating
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-emerald)" }}>Strong Hire</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-emerald)", marginTop: "4px" }}>
                    STAR structural method was consistently followed
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Alert/Modal Popup Dialogue */}
      {isModalActive && (
        <div className="modal-backdrop active" id="custom-modal-backdrop">
          <div className="glass-panel modal-card">
            <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.3rem", marginBottom: "12px", margin: 0 }} id="modal-title">
              {modalTitle}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "24px" }} id="modal-message">
              {modalMessage}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                className="btn btn-secondary"
                id="modal-btn-cancel"
                onClick={() => {
                  setIsModalActive(false);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                id="modal-btn-action"
                onClick={() => {
                  setIsModalActive(false);
                  // Resume speaking checks if behavioral
                  if (selectedRound === "behavioral" && chatHistory.length > 0) {
                    const lastMsg = chatHistory[chatHistory.length - 1];
                    if (!lastMsg.isUser) {
                      speechEngine.current.speak(
                        lastMsg.text,
                        selectedPersona,
                        () => setIsSpeaking(true),
                        () => setIsSpeaking(false)
                      );
                    }
                  }
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
