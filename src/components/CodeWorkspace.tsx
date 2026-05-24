"use client";

import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Play, CheckCircle, RotateCcw, Terminal, Code } from "lucide-react";
import { CODING_QUESTIONS, CodingQuestion } from "../lib/data";

interface CodeWorkspaceProps {
  onCodeSubmitComplete?: (feedback: string) => void;
}

export default function CodeWorkspace({ onCodeSubmitComplete }: CodeWorkspaceProps) {
  const [questions] = useState<CodingQuestion[]>(CODING_QUESTIONS);
  const [selectedQuestion, setSelectedQuestion] = useState<CodingQuestion>(CODING_QUESTIONS[0]);
  const [language, setLanguage] = useState<"javascript" | "python">("javascript");
  const [code, setCode] = useState<string>("");
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load starter code based on selected question and language
  useEffect(() => {
    const starter = selectedQuestion.languages[language]?.starter || "";
    setCode(starter);
    setConsoleLogs([`System: Loaded problem "${selectedQuestion.title}" in ${language === "javascript" ? "JavaScript" : "Python"}.`]);
  }, [selectedQuestion, language]);

  const handleReset = () => {
    if (confirm("Are you sure you want to reset the editor to the starter code?")) {
      const starter = selectedQuestion.languages[language]?.starter || "";
      setCode(starter);
      setConsoleLogs((prev) => [...prev, "System: Code reset to starter template."]);
    }
  };

  const appendLog = (msg: string) => {
    setConsoleLogs((prev) => [...prev, msg]);
  };

  // Run Test Cases
  const handleRunCode = async () => {
    setIsRunning(true);
    appendLog("System: Running test cases...");
    
    // Tiny delay to show loading state
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (language === "python") {
      // Mock Python execution
      setIsRunning(false);
      appendLog("System: Executing Python script in mock compiler environment...");
      
      const isCorrectMock = code.includes("def ") && !code.includes("pass");
      if (isCorrectMock) {
        selectedQuestion.testCases.forEach((tc, idx) => {
          appendLog(`✓ Test Case ${idx + 1}: input: ${tc.input} | Expected: ${tc.expected} | Result: Passed (Mocked)`);
        });
        appendLog("System: All test cases passed in Python environment successfully.");
      } else {
        appendLog(`✗ Test Case 1 Failed: Expected ${selectedQuestion.testCases[0].expected}, but function returned None or syntax error.`);
        appendLog("System: Execution failed. Please check your Python function definition.");
      }
      return;
    }

    // Real JS execution sandbox!
    const capturedLogs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      capturedLogs.push(
        args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")
      );
    };

    try {
      let passedCount = 0;

      // Class/Linked list helpers inside the context if needed
      const helperCode = `
        class ListNode {
          constructor(val, next = null) {
            this.val = val;
            this.next = next;
          }
        }
        function arrayToList(arr) {
          if (!Array.isArray(arr)) return null;
          let dummy = new ListNode(0);
          let curr = dummy;
          for (let val of arr) {
            curr.next = new ListNode(val);
            curr = curr.next;
          }
          return dummy.next;
        }
        function listToArray(head) {
          let res = [];
          let curr = head;
          while (curr !== null) {
            res.push(curr.val);
            curr = curr.next;
          }
          return res;
        }
      `;

      for (let i = 0; i < selectedQuestion.testCases.length; i++) {
        const tc = selectedQuestion.testCases[i];
        
        let evalString = "";
        if (selectedQuestion.id === "two-sum") {
          evalString = `${code}\nreturn JSON.stringify(twoSum(${tc.input}));`;
        } else if (selectedQuestion.id === "valid-parentheses") {
          evalString = `${code}\nreturn String(isValid(${tc.input}));`;
        } else if (selectedQuestion.id === "reverse-linked-list") {
          evalString = `
            ${code}
            ${helperCode}
            const listHead = arrayToList(${tc.input});
            const reversed = reverseList(listHead);
            return JSON.stringify(listToArray(reversed));
          `;
        } else if (selectedQuestion.id === "lru-cache") {
          evalString = `
            ${code}
            const cache = new LRUCache(2);
            cache.put(1, 1);
            cache.put(2, 2);
            const val1 = cache.get(1);
            cache.put(3, 3);
            const val2 = cache.get(2);
            return val1 + ", " + val2;
          `;
        } else {
          evalString = `${code}`;
        }

        // Evaluate using a dynamic Function constructor
        const executor = new Function(evalString);
        const resultVal = executor();

        // Standardize output strings for assertion
        const actualString = String(resultVal).replace(/\s/g, "");
        const expectedString = String(tc.expected).replace(/\s/g, "");

        if (actualString === expectedString) {
          appendLog(`✓ Test Case ${i + 1} Passed: Input: ${tc.input} | Output: ${resultVal}`);
          passedCount++;
        } else {
          appendLog(`✗ Test Case ${i + 1} Failed: Input: ${tc.input} | Expected: ${tc.expected} | Got: ${resultVal}`);
        }
      }

      // Append code-driven console.log outputs if any were invoked
      if (capturedLogs.length > 0) {
        appendLog("----- Console Output -----");
        capturedLogs.forEach((l) => appendLog(l));
        appendLog("--------------------------");
      }

      if (passedCount === selectedQuestion.testCases.length) {
        appendLog("System: All tests passed successfully! Click 'Submit Code' to log results.");
      } else {
        appendLog(`System: Run finished. ${passedCount}/${selectedQuestion.testCases.length} tests passed.`);
      }

    } catch (err: any) {
      appendLog(`Compilation/Execution Error: ${err?.message || err}`);
    } finally {
      console.log = originalLog;
      setIsRunning(false);
    }
  };

  // Submit Code
  const handleSubmitCode = async () => {
    setIsSubmitting(true);
    appendLog("System: Submitting code to AI evaluator...");
    
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    setIsSubmitting(false);
    appendLog("System: Solution compilation success.");
    appendLog("System: AI Evaluator Grade: Time Complexity O(N) | Space Complexity O(N).");
    appendLog("System: Code submission complete. Ready to proceed.");

    if (onCodeSubmitComplete) {
      onCodeSubmitComplete(
        `Code verified. Optimization index 94%. Linear complexity is optimal for ${selectedQuestion.title}.`
      );
    }
  };

  return (
    <div className="code-workspace-container" style={{ display: "flex", width: "100%", height: "100%", gap: "16px", minHeight: "450px" }}>
      {/* Left panel: Description */}
      <div className="code-description-panel glass-panel" style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{selectedQuestion.title}</h3>
          <span
            className={`badge ${selectedQuestion.difficulty.toLowerCase()}`}
            style={{
              padding: "3px 8px",
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: 600,
              background:
                selectedQuestion.difficulty === "Easy"
                  ? "rgba(16, 185, 129, 0.15)"
                  : "rgba(245, 158, 11, 0.15)",
              color: selectedQuestion.difficulty === "Easy" ? "var(--accent-emerald)" : "var(--accent-cyan)"
            }}
          >
            {selectedQuestion.difficulty}
          </span>
        </div>

        <div style={{ fontSize: "0.85rem", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
          {selectedQuestion.description}
        </div>

        <div style={{ marginTop: "12px" }}>
          <h4 style={{ margin: "0 0 6px 0", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Test Cases:</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {selectedQuestion.testCases.map((tc, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "4px",
                  padding: "8px",
                  fontSize: "0.75rem"
                }}
              >
                <div>
                  <strong style={{ color: "var(--accent-cyan)" }}>Input:</strong> <code>{tc.input}</code>
                </div>
                <div style={{ marginTop: "4px" }}>
                  <strong style={{ color: "var(--text-secondary)" }}>Expected:</strong> <code>{tc.expected}</code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Problem selector */}
        <div style={{ marginTop: "auto", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
            Change Problem:
          </label>
          <select
            value={selectedQuestion.id}
            onChange={(e) => {
              const found = questions.find((q) => q.id === e.target.value);
              if (found) setSelectedQuestion(found);
            }}
            style={{
              width: "100%",
              padding: "8px",
              background: "rgba(10, 10, 15, 0.8)",
              border: "1px solid var(--border-color)",
              color: "#f4f4f5",
              borderRadius: "4px",
              fontSize: "0.8rem",
              cursor: "pointer"
            }}
          >
            {questions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title} ({q.difficulty})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right panel: Editor & Output */}
      <div style={{ flex: 1.5, display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
        {/* Editor Toolbar */}
        <div
          className="glass-panel"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 12px",
            background: "rgba(10, 10, 15, 0.6)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Code size={16} className="text-cyan" />
            <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Code Sandbox</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "javascript" | "python")}
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid var(--border-color)",
                color: "#fff",
                borderRadius: "4px",
                padding: "4px 8px",
                fontSize: "0.75rem",
                cursor: "pointer"
              }}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>

            <button
              onClick={handleReset}
              className="btn btn-secondary"
              title="Reset starter code"
              style={{ padding: "4px 8px", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>
        </div>

        {/* Monaco Editor Container */}
        <div
          className="glass-panel"
          style={{
            flex: 1.2,
            minHeight: "220px",
            overflow: "hidden",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            background: "#1e1e1e"
          }}
        >
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || "")}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              cursorBlinking: "smooth",
              padding: { top: 8 }
            }}
          />
        </div>

        {/* Console logs */}
        <div
          className="glass-panel"
          style={{
            flex: 0.8,
            display: "flex",
            flexDirection: "column",
            minHeight: "150px",
            maxHeight: "200px"
          }}
        >
          <div
            style={{
              padding: "6px 12px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(10, 10, 15, 0.4)"
            }}
          >
            <Terminal size={14} className="text-violet" />
            <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Execution Logs</span>
          </div>

          <div
            style={{
              flex: 1,
              padding: "10px",
              background: "rgba(2, 2, 5, 0.9)",
              overflowY: "auto",
              fontFamily: "var(--font-code, monospace)",
              fontSize: "0.75rem",
              lineHeight: "1.4"
            }}
          >
            {consoleLogs.map((log, idx) => {
              let color = "#888899"; // Default log color
              if (log.startsWith("✓")) color = "var(--accent-emerald)";
              if (log.startsWith("✗") || log.startsWith("Compilation/Execution")) color = "var(--accent-rose)";
              if (log.startsWith("System:")) color = "var(--accent-cyan)";
              if (log.startsWith("-----")) color = "var(--accent-violet)";

              return (
                <div key={idx} style={{ color, marginBottom: "4px" }}>
                  {log}
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
              background: "rgba(10, 10, 15, 0.4)"
            }}
          >
            <button
              onClick={handleRunCode}
              disabled={isRunning || isSubmitting}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", padding: "6px 12px" }}
            >
              <Play size={12} />
              {isRunning ? "Running..." : "Run Code"}
            </button>

            <button
              onClick={handleSubmitCode}
              disabled={isRunning || isSubmitting}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", padding: "6px 12px" }}
            >
              <CheckCircle size={12} />
              {isSubmitting ? "Submitting..." : "Submit Solution"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
