"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Terminal,
  PlayCircle,
  Volume2,
  Bot,
  Mic,
  Send,
  Speech,
  Code2,
  Milestone,
  FileText,
  LineChart,
  Users,
  ArrowRight,
  GlassWater
} from "lucide-react";
import { INTERVIEW_PERSONAS, InterviewerPersona } from "../lib/data";
import { getSpeechEngineInstance } from "../lib/speech";

// Custom Brand Icons as SVG components since Lucide has deprecated brand icons
const Twitter = ({ size = 18 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Github = ({ size = 18 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = ({ size = 18 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function LandingPage() {
  const [activePersona, setActivePersona] = useState<InterviewerPersona>(INTERVIEW_PERSONAS[0]);
  const [dialogueSpeaker, setDialogueSpeaker] = useState<string>(INTERVIEW_PERSONAS[0].name);
  const [dialogueText, setDialogueText] = useState<string>(
    `Click "Listen to Question" to hear what ${INTERVIEW_PERSONAS[0].name} wants to ask you.`
  );
  const [dialogueSpeakerClass, setDialogueSpeakerClass] = useState<string>("dialogue-speaker");
  
  const [textInput, setTextInput] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Metrics
  const [paceVal, setPaceVal] = useState<string>("--");
  const [fillerVal, setFillerVal] = useState<number>(0);
  const [confidenceVal, setConfidenceVal] = useState<number>(0);
  const [confidenceColorClass, setConfidenceColorClass] = useState<string>("metric-mini-val");

  // Showcase Environment Active Tab
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<"coding" | "canvas" | "analytics">("coding");

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Speech engine reference
  const speechEngine = useRef(getSpeechEngineInstance());

  // Clean speech engine on unmount
  useEffect(() => {
    const engine = speechEngine.current;
    return () => {
      engine.stopSpeaking();
      engine.stopListening();
    };
  }, []);

  const handleSelectPersona = (persona: InterviewerPersona) => {
    setActivePersona(persona);
    setDialogueSpeaker(persona.name);
    setDialogueSpeakerClass("dialogue-speaker");
    setDialogueText(`Click "Listen to Question" to hear what ${persona.name} wants to ask you.`);
    
    setTextInput("");
    setPaceVal("--");
    setFillerVal(0);
    setConfidenceVal(0);
    setConfidenceColorClass("metric-mini-val");
    
    speechEngine.current.stopSpeaking();
    speechEngine.current.stopListening();
    setIsSpeaking(false);
    setIsListening(false);
  };

  const handleListenQuestion = () => {
    const questions = activePersona.sampleQuestions;
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    
    setDialogueSpeaker(activePersona.name);
    setDialogueSpeakerClass("dialogue-speaker text-cyan");
    setDialogueText(randomQuestion);
    setIsSpeaking(true);

    speechEngine.current.speak(
      randomQuestion,
      activePersona,
      () => {
        setIsSpeaking(true);
      },
      () => {
        setIsSpeaking(false);
        setDialogueText(
          `${randomQuestion}\n\nIt's your turn! Type below or click the microphone to speak your answer.`
        );
      }
    );
  };

  const handleToggleVoice = () => {
    if (isListening) {
      speechEngine.current.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      setDialogueSpeaker("You (Speaking...)");
      setDialogueSpeakerClass("dialogue-speaker user text-violet");
      setDialogueText("Listening...");
      
      const started = speechEngine.current.startListening(
        (interimText) => {
          setDialogueText(interimText || "Listening...");
        },
        (metrics) => {
          setPaceVal(metrics.wordsPerMinute > 0 ? `${metrics.wordsPerMinute} WPM` : "--");
          setFillerVal(metrics.fillerCount);
          setConfidenceVal(metrics.confidenceScore);
          
          if (metrics.confidenceScore >= 80) {
            setConfidenceColorClass("metric-mini-val text-emerald");
          } else if (metrics.confidenceScore >= 60) {
            setConfidenceColorClass("metric-mini-val text-cyan");
          } else {
            setConfidenceColorClass("metric-mini-val text-rose");
          }
        },
        (finalMetrics) => {
          setIsListening(false);
          setDialogueText(finalMetrics.transcript || "No speech detected. Please try again.");
          
          if (finalMetrics.transcript.trim().length > 0) {
            setTimeout(() => {
              triggerInterviewerReply(finalMetrics.fillerCount, finalMetrics.confidenceScore);
            }, 1500);
          }
        }
      );

      if (!started) {
        setIsListening(false);
        setDialogueText("Speech recognition is not supported in this browser. Please type your reply instead!");
      }
    }
  };

  const handleSubmitText = () => {
    const text = textInput.trim();
    if (!text) return;

    setDialogueSpeaker("You (Typed)");
    setDialogueSpeakerClass("dialogue-speaker user text-violet");
    setDialogueText(text);
    setTextInput("");

    speechEngine.current.simulateTypeAnswer(
      text,
      undefined,
      (metrics) => {
        setPaceVal(`${metrics.wordsPerMinute} WPM`);
        setFillerVal(metrics.fillerCount);
        setConfidenceVal(metrics.confidenceScore);
        setConfidenceColorClass("metric-mini-val text-emerald");
      },
      (finalMetrics) => {
        setTimeout(() => {
          triggerInterviewerReply(finalMetrics.fillerCount, finalMetrics.confidenceScore);
        }, 1500);
      }
    );
  };

  const triggerInterviewerReply = (fillers: number, confidence: number) => {
    setDialogueSpeaker(activePersona.name);
    setDialogueSpeakerClass("dialogue-speaker text-cyan");
    
    let replyText = activePersona.responses.default;
    if (fillers > 2) {
      replyText = activePersona.responses.um;
    } else if (confidence > 85) {
      replyText = activePersona.responses.agreement;
    }
    
    setDialogueText(replyText);
    setIsSpeaking(true);
    
    speechEngine.current.speak(
      replyText,
      activePersona,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflowX: "hidden" }}>
      {/* Background Glows */}
      <div className="bg-glow-sphere" style={{ top: "10%", left: "5%" }}></div>
      <div className="bg-glow-cyan" style={{ top: "40%", right: "10%" }}></div>
      <div className="bg-glow-sphere" style={{ bottom: "10%", left: "20%" }}></div>

      {/* Header Section */}
      <header>
        <div className="nav-container">
          <Link href="/" className="logo">
            <GlassWater style={{ stroke: "url(#logo-grad)", strokeWidth: 2.5 }} />
            <span>ConvoGlass</span>
          </Link>
          <svg width="0" height="0">
            <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </svg>
          <nav>
            <ul className="nav-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#demo">Live Demo</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </nav>
          <div>
            <Link href="/workspace" className="btn btn-primary" id="header-launch-btn">
              Launch App
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" style={{ padding: "80px 20px 40px" }}>
        <div className="badge-tag">
          <Sparkles size={14} />
          <span>Next-Gen AI Interview Coaching</span>
        </div>
        <h1 className="hero-title">
          Master Your Technical & Behavioral Interviews with <span>Conversational AI</span>
        </h1>
        <p className="hero-subtitle">
          ConvoGlass simulates realistic, resume-aware mock interviews with real-time speech analytics, adaptive coding environments, and system design whiteboards.
        </p>
        <div className="hero-ctas">
          <Link href="/workspace" className="btn btn-primary btn-cyan">
            <Terminal size={16} />
            Start Practicing Free
          </Link>
          <a href="#demo" className="btn btn-secondary">
            <PlayCircle size={16} />
            Try Mini-Demo
          </a>
        </div>

        {/* Interactive Teaser Box */}
        <div className="teaser-container" id="demo" style={{ marginTop: "60px" }}>
          <div className="section-tag">Interactive Teaser</div>
          <h2 className="section-title" style={{ fontSize: "1.8rem", marginBottom: "24px" }}>
            Test Drive Your AI Interviewer
          </h2>
          
          <div className="teaser-dashboard glass-panel">
            {/* Sidebar: Choose persona */}
            <div className="teaser-sidebar">
              <div>
                <h3 className="teaser-subtitle">1. SELECT AN INTERVIEWER</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {INTERVIEW_PERSONAS.map((persona) => (
                    <button
                      key={persona.id}
                      className={`persona-btn ${activePersona.id === persona.id ? "active" : ""}`}
                      onClick={() => handleSelectPersona(persona)}
                    >
                      <span className="persona-avatar">{persona.emoji}</span>
                      <div style={{ textAlign: "left" }}>
                        <div className="persona-name">{persona.name}</div>
                        <div className="persona-desc">{persona.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ marginTop: "auto" }}>
                <h3 className="teaser-subtitle">2. START SCENARIO</h3>
                <button className="btn btn-primary" id="listen-question-btn" onClick={handleListenQuestion} style={{ width: "100%" }}>
                  <Volume2 size={16} />
                  Listen to Question
                </button>
              </div>
            </div>

            {/* Chat Viewport */}
            <div className="teaser-content">
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div className="teaser-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Bot className="text-cyan" size={18} />
                    <span id="demo-persona-title">{activePersona.name}</span>
                    <span id="demo-persona-role" style={{ fontSize: "0.75rem", fontWeight: "normal", color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "4px" }}>
                      {activePersona.role}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--accent-emerald)" }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: "8px",
                        height: "8px",
                        background: "var(--accent-emerald)",
                        borderRadius: "50%",
                        animation: "pulse-glow 1.5s infinite"
                      }}
                    ></span>
                    Live Audio Feed
                  </div>
                </div>
                
                {/* Video waveform screen */}
                <div className="avatar-card" style={{ position: "relative" }}>
                  <div className={`avatar-speaking-glow ${isSpeaking ? "speaking" : ""}`}></div>
                  <div className="avatar-video-placeholder">
                    <span className="avatar-image">{activePersona.emoji}</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>Simulated Video Feed</span>
                  </div>
                </div>
                
                <div className="wave-container" style={{ display: "flex", gap: "4px", justifyContent: "center", margin: "16px 0" }}>
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className={`wave-bar ${isSpeaking ? "speaking" : ""}`}></div>
                  ))}
                </div>
              </div>

              {/* Question / Answer Transcript Container */}
              <div>
                <div className="demo-dialogue" style={{ whiteSpace: "pre-wrap" }}>
                  <div>
                    <div className={dialogueSpeakerClass}>{dialogueSpeaker}</div>
                    <div className="dialogue-text">{dialogueText}</div>
                  </div>
                </div>

                {/* User Response inputs */}
                <div className="demo-input-container" style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <button
                    className={`speech-btn ${isListening ? "listening" : ""}`}
                    onClick={handleToggleVoice}
                    title="Speak Answer"
                  >
                    <Mic size={18} />
                  </button>
                  <input
                    type="text"
                    className="text-input-field"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleSubmitText();
                    }}
                    placeholder="Type your response here or click the mic to speak..."
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary" onClick={handleSubmitText} style={{ padding: "14px 20px" }}>
                    <Send size={16} />
                  </button>
                </div>
              </div>

              {/* Live metrics gauges */}
              <div className="demo-metrics" style={{ marginTop: "15px" }}>
                <div className="metric-mini-card">
                  <div className="metric-mini-val">{paceVal}</div>
                  <div className="metric-mini-label">Speaking Pace</div>
                </div>
                <div className="metric-mini-card">
                  <div className="metric-mini-val">{fillerVal}</div>
                  <div className="metric-mini-label">Filler Words</div>
                </div>
                <div className="metric-mini-card">
                  <div className={confidenceColorClass}>{confidenceVal > 0 ? `${confidenceVal}%` : "0%"}</div>
                  <div className="metric-mini-label">Confidence</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="section" id="features">
        <span className="section-tag">Features</span>
        <h2 className="section-title">Everything You Need to Get Offer-Ready</h2>
        <p className="section-subtitle">ConvoGlass is not a static list of questions. It&apos;s a dynamic, full-stack coaching platform powered by real conversation logic.</p>
        
        <div className="features-grid">
          <div className="feature-card glass-panel">
            <div className="feature-icon-wrapper">
              <Speech />
            </div>
            <h3>Real-time Speech Intelligence</h3>
            <p>Tracks filler words (um, like, basically), measures speaking pace (WPM), and calculates confidence level dynamically during your mocks.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feature-icon-wrapper">
              <Code2 />
            </div>
            <h3>Technical Coding Sandbox</h3>
            <p>A full Monaco Editor layout supporting syntax highlighting, test-case verification, and live algorithmic code execution feedback.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feature-icon-wrapper">
              <Milestone />
            </div>
            <h3>System Design Whiteboard</h3>
            <p>Interactive drawing canvas allowing you to design system diagrams (databases, API servers, message queues) while the AI questions your trade-offs.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feature-icon-wrapper">
              <FileText />
            </div>
            <h3>Resume-Aware Rounds</h3>
            <p>Upload your resume to have our AI analyze your projects, tech stacks, and experiences to craft deep follow-up questions testing shallow understanding.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feature-icon-wrapper">
              <LineChart />
            </div>
            <h3>Comprehensive Feedback Engine</h3>
            <p>Recieve detailed reports grading structural communication (STAR method), technical correctness, system thinking, and custom path roadmaps.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feature-icon-wrapper">
              <Users />
            </div>
            <h3>Interviewer Personas</h3>
            <p>Practice against distinct interview personalities: from encouraging, behavioral-focused HR reps to silent, high-pressure FAANG leads.</p>
          </div>
        </div>
      </section>

      {/* Interactive Platform Showcase / Tabs */}
      <section className="section">
        <span className="section-tag">Interactive Preview</span>
        <h2 className="section-title">Explore the Environments</h2>
        <p className="section-subtitle">Take a tour of our specialized interview workspaces built to emulate real-world settings.</p>

        <div className="mockup-showcase">
          <div className="mockup-desc">
            <div className="mockup-tabs">
              <button
                className={`mockup-tab-btn ${activeShowcaseTab === "coding" ? "active" : ""}`}
                onClick={() => setActiveShowcaseTab("coding")}
              >
                Coding Round
              </button>
              <button
                className={`mockup-tab-btn ${activeShowcaseTab === "canvas" ? "active" : ""}`}
                onClick={() => setActiveShowcaseTab("canvas")}
              >
                System Design
              </button>
              <button
                className={`mockup-tab-btn ${activeShowcaseTab === "analytics" ? "active" : ""}`}
                onClick={() => setActiveShowcaseTab("analytics")}
              >
                Feedback Dashboard
              </button>
            </div>
            <div>
              {activeShowcaseTab === "coding" && (
                <>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: "700", marginBottom: "12px" }}>
                    Realistic Coding Environment
                  </h3>
                  <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
                    Write cleaner code with live interviewer check-ins. ConvoGlass loads a complete editor supporting multi-language layouts, automatic test cases, execution output panels, and an AI chat assistant challenging your algorithms.
                  </p>
                </>
              )}
              {activeShowcaseTab === "canvas" && (
                <>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: "700", marginBottom: "12px" }}>
                    Collaborative Whiteboarding
                  </h3>
                  <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
                    Construct complex system designs on our custom vector whiteboard. Drag database shapes, load balancers, and connect endpoints while the AI asks about bottlenecks, data replication policies, and single points of failure.
                  </p>
                </>
              )}
              {activeShowcaseTab === "analytics" && (
                <>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: "700", marginBottom: "12px" }}>
                    Detailed Scorecard Auditing
                  </h3>
                  <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
                    Receive objective, comprehensive feedback on communication, code optimizations, and design trade-offs. The feedback scorecard gives strengths, specific weaknesses, filler word counts, and a direct learning roadmap.
                  </p>
                </>
              )}
              <Link href="/workspace" className="btn btn-primary">
                Try Interactive App
              </Link>
            </div>
          </div>

          {/* Preview Panels */}
          <div className="mockup-visual glass-panel" style={{ minHeight: "280px" }}>
            {/* Slide 1: Coding */}
            {activeShowcaseTab === "coding" && (
              <div className="mockup-slide active" id="mockup-coding" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                  <div style={{ fontFamily: "var(--font-code)", fontSize: "0.85rem", color: "var(--accent-cyan)" }}>solution.js</div>
                  <div style={{ background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem" }}>JavaScript</div>
                </div>
                <pre style={{ fontFamily: "var(--font-code)", fontSize: "0.85rem", color: "#a5d6ff", lineHeight: "1.5", margin: "10px 0" }}>
                  {`function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`}
                </pre>
                <div style={{ marginTop: "auto", background: "rgba(0,0,0,0.3)", padding: "12px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>Test Output</div>
                  <div style={{ fontFamily: "var(--font-code)", fontSize: "0.8rem", color: "var(--accent-emerald)" }}>✓ Test Case 1 Passed (twoSum standard array)</div>
                  <div style={{ fontFamily: "var(--font-code)", fontSize: "0.8rem", color: "var(--accent-emerald)" }}>✓ Test Case 2 Passed (complement check correct)</div>
                </div>
              </div>
            )}

            {/* Slide 2: System Design */}
            {activeShowcaseTab === "canvas" && (
              <div className="mockup-slide active" id="mockup-canvas" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <div style={{ position: "relative", width: "90%", height: "90%", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "10px", display: "flex", justifyContent: "center", alignItems: "center", background: "rgba(0,0,0,0.2)" }}>
                  <div style={{ position: "absolute", top: "20px", left: "20px", padding: "8px 16px", border: "1px solid var(--accent-cyan)", background: "rgba(6,182,212,0.1)", borderRadius: "8px", fontSize: "0.8rem" }}>Client App</div>
                  <div style={{ position: "absolute", top: "20px", left: "160px", padding: "8px 16px", border: "1px solid var(--accent-violet)", background: "rgba(139,92,246,0.1)", borderRadius: "8px", fontSize: "0.8rem" }}>Load Balancer</div>
                  <div style={{ position: "absolute", top: "110px", left: "160px", padding: "8px 16px", border: "1px solid var(--accent-violet)", background: "rgba(139,92,246,0.1)", borderRadius: "8px", fontSize: "0.8rem" }}>API Servers</div>
                  <div style={{ position: "absolute", top: "110px", left: "320px", padding: "8px 16px", border: "1px solid var(--accent-emerald)", background: "rgba(16,185,129,0.1)", borderRadius: "8px", fontSize: "0.8rem" }}>Redis Cache</div>
                  <div style={{ position: "absolute", top: "200px", left: "160px", padding: "8px 16px", border: "1px solid var(--accent-rose)", background: "rgba(244,63,94,0.1)", borderRadius: "8px", fontSize: "0.8rem" }}>PostgreSQL</div>
                  
                  <svg style={{ position: "absolute", width: "100%", height: "100%", top: 0, left: 0, pointerEvents: "none" }}>
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#a1a1aa"/>
                      </marker>
                    </defs>
                    <line x1="90" y1="40" x2="155" y2="40" stroke="#a1a1aa" strokeDasharray="4" strokeWidth="1.5" markerEnd="url(#arrow)"/>
                    <line x1="210" y1="58" x2="210" y2="105" stroke="#a1a1aa" strokeWidth="1.5" markerEnd="url(#arrow)"/>
                    <line x1="250" y1="130" x2="315" y2="130" stroke="#a1a1aa" strokeWidth="1.5" markerEnd="url(#arrow)"/>
                    <line x1="210" y1="148" x2="210" y2="195" stroke="#a1a1aa" strokeDasharray="4" strokeWidth="1.5" markerEnd="url(#arrow)"/>
                  </svg>
                  <div style={{ position: "absolute", bottom: "15px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>Interactive whiteboarding challenges scalability trade-offs</div>
                </div>
              </div>
            )}

            {/* Slide 3: Analytics */}
            {activeShowcaseTab === "analytics" && (
              <div className="mockup-slide active" id="mockup-analytics" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.1rem" }}>Evaluation Report</div>
                  <div style={{ fontSize: "0.8rem", background: "rgba(16,185,129,0.1)", color: "var(--accent-emerald)", padding: "4px 10px", borderRadius: "12px", fontWeight: 600 }}>PASS</div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Overall Score</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-cyan)", margin: "4px 0" }}>88 <span style={{ fontSize: "1rem", color: "var(--text-secondary)", fontWeight: "normal" }}>/ 100</span></div>
                    <div style={{ fontSize: "0.75rem", color: "var(--accent-emerald)" }}>Top 5% of candidates</div>
                  </div>
                  
                  <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Speech Clarity</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-violet)", margin: "4px 0" }}>92%</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Filler words: 1.2% (Excellent)</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "3px" }}>
                      <span>Algorithmic Optimization</span>
                      <span className="text-cyan">85%</span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: "85%", height: "100%", background: "var(--accent-cyan)", borderRadius: "3px" }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "3px" }}>
                      <span>System Scalability Design</span>
                      <span className="text-violet">90%</span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: "90%", height: "100%", background: "var(--accent-violet)", borderRadius: "3px" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing section */}
      <section className="section" id="pricing">
        <span className="section-tag">Pricing</span>
        <h2 className="section-title">Flexible Plans for Every Stage</h2>
        <p className="section-subtitle">Accelerate your preparations and land your dream job with flexible memberships.</p>

        <div className="pricing-grid">
          <div className="pricing-card glass-panel">
            <div className="pricing-header">
              <h3>Starter</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Test the waters and practice core behavioral questions.</p>
              <div className="pricing-price">$0 <span>/ forever</span></div>
            </div>
            <ul className="pricing-features">
              <li>3 AI Mock Interviews / month</li>
              <li>Basic HR & behavioral rounds</li>
              <li>Speech pace tracking</li>
              <li>Limited test cases</li>
            </ul>
            <Link href="/workspace" className="btn btn-secondary" style={{ marginTop: "auto" }}>
              Get Started
            </Link>
          </div>

          <div className="pricing-card glass-panel premium-tier">
            <div className="pricing-header">
              <h3>Pro Practitioner</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Complete access to premium technical environments.</p>
              <div className="pricing-price">$29 <span>/ month</span></div>
            </div>
            <ul className="pricing-features">
              <li>Unlimited AI Mock Interviews</li>
              <li>Resume-Aware questioning</li>
              <li>Monaco Coding Rounds</li>
              <li>System Design Drawing Whiteboard</li>
              <li>Full transcript & replay storage</li>
              <li>Company-Specific patterns (Google/Meta)</li>
            </ul>
            <Link href="/workspace" className="btn btn-primary" style={{ marginTop: "auto" }}>
              Upgrade Now
            </Link>
          </div>

          <div className="pricing-card glass-panel">
            <div className="pricing-header">
              <h3>Enterprise / Bootcamp</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Custom portals and bulk pricing for schools and teams.</p>
              <div className="pricing-price">Custom <span>/ contact us</span></div>
            </div>
            <ul className="pricing-features">
              <li>Everything in Pro</li>
              <li>Custom interviewer personas</li>
              <li>Recruiting feedback dashboards</li>
              <li>Candidate matching intelligence</li>
              <li>SLA and administrative tools</li>
            </ul>
            <a href="mailto:support@convoglass.com" className="btn btn-secondary" style={{ marginTop: "auto" }}>
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Accordion section */}
      <section className="section" id="faq">
        <span className="section-tag">FAQ</span>
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-subtitle">Find responses to standard questions about how ConvoGlass operates.</p>

        <div className="faq-container">
          {[
            {
              q: "How does the AI analyze my speech in real-time?",
              a: "ConvoGlass integrates the built-in browser Web Speech API to capture speech data locally. It measures factors like speaking pace (Words Per Minute), pause length, and uses NLP checks to identify filler phrases ('um', 'like', 'you know') to calculate your structural confidence score."
            },
            {
              q: "Are the questions tailored to my specific resume?",
              a: "Yes! When you upload your resume, the ConvoGlass engine parses your projects, technical skills, and work experiences. The AI interviewer then structures direct, conversational questions testing the depth of your projects, simulating real follow-up checks."
            },
            {
              q: "Do I need to download any extensions or packages?",
              a: "No. ConvoGlass runs entirely in your web browser. There is no software to download. We load syntax editors and whiteboard layers dynamically."
            },
            {
              q: "What companies are supported in the mocks?",
              a: "We support specific patterns reflecting the expectations of top-tier companies, including Google (algorithmic complexity), Amazon (leadership principles & system architecture), Meta (product architecture & speed coding), and typical startup profiles."
            }
          ].map((faq, idx) => (
            <div key={idx} className={`faq-item glass-panel ${activeFaq === idx ? "active" : ""}`}>
              <div className="faq-question" onClick={() => toggleFaq(idx)} style={{ cursor: "pointer" }}>
                <span>{faq.q}</span>
                <span className="faq-toggle-icon">{activeFaq === idx ? "-" : "+"}</span>
              </div>
              {activeFaq === idx && <div className="faq-answer">{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Footer section */}
      <footer>
        <div className="footer-container">
          <div className="footer-brand">
            <Link href="/" className="logo">
              <GlassWater style={{ stroke: "url(#logo-grad)", strokeWidth: 2.5 }} />
              <span>ConvoGlass</span>
            </Link>
            <p>Empowering candidates to become interview-ready through conversational intelligence and adaptive simulation.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#demo">Live Teaser</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><Link href="/workspace">Launch App</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Preparation Roadmap</a></li>
              <li><a href="#">Success Stories</a></li>
              <li><a href="#">FAQ Guide</a></li>
              <li><a href="#">Help Center</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Cookie Preferences</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div>&copy; 2026 ConvoGlass Inc. All rights reserved.</div>
          <div style={{ display: "flex", gap: "16px" }}>
            <a href="#" style={{ color: "var(--text-muted)" }}><Twitter size={18} /></a>
            <a href="#" style={{ color: "var(--text-muted)" }}><Github size={18} /></a>
            <a href="#" style={{ color: "var(--text-muted)" }}><Linkedin size={18} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
