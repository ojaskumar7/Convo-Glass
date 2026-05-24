"use client";

import React, { useRef, useEffect, useState } from "react";
import { MousePointer, Square, Database, Cloud, ArrowUpRight, Type, Trash2 } from "lucide-react";

interface Node {
  id: number;
  type: "rect" | "circle" | "cloud" | "text";
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Connection {
  from: number;
  to: number;
}

type Tool = "select" | "rect" | "circle" | "cloud" | "arrow" | "text";

export default function SystemDesignCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [tool, setTool] = useState<Tool>("select");
  const [nodes, setNodes] = useState<Node[]>([
    { id: 1, type: "cloud", label: "Client App", x: 80, y: 150, w: 100, h: 50 },
    { id: 2, type: "rect", label: "Load Balancer", x: 240, y: 150, w: 120, h: 50 },
    { id: 3, type: "rect", label: "API Server", x: 420, y: 150, w: 120, h: 50 }
  ]);
  const [connections, setConnections] = useState<Connection[]>([
    { from: 1, to: 2 },
    { from: 2, to: 3 }
  ]);

  // Interaction tracking state (stored in refs to avoid extra re-renders during active drag)
  const dragInfoRef = useRef<{
    selectedNode: Node | null;
    isDragging: boolean;
    offsetX: number;
    offsetY: number;
  }>({
    selectedNode: null,
    isDragging: false,
    offsetX: 0,
    offsetY: 0
  });

  const arrowInfoRef = useRef<{
    startNode: Node | null;
    isDrawing: boolean;
    tempX: number;
    tempY: number;
  }>({
    startNode: null,
    isDrawing: false,
    tempX: 0,
    tempY: 0
  });

  // Handle resize to container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height || 450;
      drawCanvas();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [nodes, connections]); // Trigger resize and redraw if structural changes happen

  // Redraw when node states or tool states change
  useEffect(() => {
    drawCanvas();
  }, [nodes, connections, tool]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Helper: Rounded Rectangle
    const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // Helper: Cylindrical DB Cylinders
    const drawDatabaseNode = (x: number, y: number, w: number, h: number) => {
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h - h / 4, w / 2, h / 6, 0, 0, Math.PI);
      ctx.lineTo(x, y + h / 4);
      ctx.ellipse(x + w / 2, y + h / 4, w / 2, h / 6, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 4, w / 2, h / 6, 0, 0, 2 * Math.PI);
      ctx.stroke();
    };

    // Helper: Cloud Node
    const drawCloudNode = (x: number, y: number, w: number, h: number) => {
      ctx.beginPath();
      ctx.moveTo(x + w * 0.2, y + h * 0.7);
      ctx.bezierCurveTo(x + w * 0.05, y + h * 0.7, x + w * 0.05, y + h * 0.4, x + w * 0.2, y + h * 0.4);
      ctx.bezierCurveTo(x + w * 0.2, y + h * 0.1, x + w * 0.5, y + h * 0.1, x + w * 0.6, y + h * 0.3);
      ctx.bezierCurveTo(x + w * 0.8, y + h * 0.2, x + w * 0.95, y + h * 0.4, x + w * 0.9, y + h * 0.6);
      ctx.bezierCurveTo(x + w * 0.95, y + h * 0.8, x + w * 0.7, y + h * 0.9, x + w * 0.6, y + h * 0.8);
      ctx.bezierCurveTo(x + w * 0.4, y + h * 0.9, x + w * 0.2, y + h * 0.9, x + w * 0.2, y + h * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // Helper: Arrow Line Drawing
    const drawArrow = (fromNode: Node, toNode: Node) => {
      const fromX = fromNode.x + fromNode.w / 2;
      const fromY = fromNode.y + fromNode.h / 2;
      const toX = toNode.x + toNode.w / 2;
      const toY = toNode.y + toNode.h / 2;

      const angle = Math.atan2(toY - fromY, toX - fromX);

      // Boundary offsets
      const startX = fromX + Math.cos(angle) * (fromNode.w / 2);
      const startY = fromY + Math.sin(angle) * (fromNode.h / 2);
      const endX = toX - Math.cos(angle) * (toNode.w / 2);
      const endY = toY - Math.sin(angle) * (toNode.h / 2);

      ctx.strokeStyle = "#a1a1aa";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Arrow head
      const arrowSize = 8;
      ctx.fillStyle = "#a1a1aa";
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - arrowSize * Math.cos(angle - Math.PI / 6), endY - arrowSize * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(endX - arrowSize * Math.cos(angle + Math.PI / 6), endY - arrowSize * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    };

    // Draw existing connections
    connections.forEach((conn) => {
      const fromNode = nodes.find((n) => n.id === conn.from);
      const toNode = nodes.find((n) => n.id === conn.to);
      if (fromNode && toNode) {
        drawArrow(fromNode, toNode);
      }
    });

    // Draw active drawing connector line
    if (arrowInfoRef.current.isDrawing && arrowInfoRef.current.startNode) {
      const startNode = arrowInfoRef.current.startNode;
      const startX = startNode.x + startNode.w / 2;
      const startY = startNode.y + startNode.h / 2;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(arrowInfoRef.current.tempX, arrowInfoRef.current.tempY);
      ctx.stroke();
      ctx.setLineDash([]); // Reset
    }

    // Draw nodes
    nodes.forEach((node) => {
      ctx.lineWidth = 2;

      if (node.type === "rect") {
        ctx.fillStyle = "rgba(139, 92, 246, 0.1)";
        ctx.strokeStyle = "#8b5cf6"; // Violet
        drawRoundedRect(node.x, node.y, node.w, node.h, 8);
      } else if (node.type === "circle") {
        ctx.fillStyle = "rgba(244, 63, 94, 0.1)";
        ctx.strokeStyle = "#f43f5e"; // Rose
        drawDatabaseNode(node.x, node.y, node.w, node.h);
      } else if (node.type === "cloud") {
        ctx.fillStyle = "rgba(6, 182, 212, 0.1)";
        ctx.strokeStyle = "#06b6d4"; // Cyan
        drawCloudNode(node.x, node.y, node.w, node.h);
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        drawRoundedRect(node.x, node.y, node.w, node.h, 4);
      }

      // Draw label
      ctx.fillStyle = "#f4f4f5";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const textX = node.x + node.w / 2;
      const textY = node.y + node.h / 2;
      ctx.fillText(node.label, textX, textY);
    });
  };

  const getNodeAtPosition = (x: number, y: number): Node | null => {
    // Loop backwards for top layer nodes first
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (x >= node.x && x <= node.x + node.w && y >= node.y && y <= node.y + node.h) {
        return node;
      }
    }
    return null;
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const clickedNode = getNodeAtPosition(mouseX, mouseY);

    if (tool === "select") {
      if (clickedNode) {
        dragInfoRef.current = {
          selectedNode: clickedNode,
          isDragging: true,
          offsetX: mouseX - clickedNode.x,
          offsetY: mouseY - clickedNode.y
        };
      }
    } else if (tool === "arrow") {
      if (clickedNode) {
        arrowInfoRef.current = {
          startNode: clickedNode,
          isDrawing: true,
          tempX: mouseX,
          tempY: mouseY
        };
      }
    } else {
      // Add Node tool clicked
      let newType: "rect" | "circle" | "cloud" | "text" = "rect";
      let defaultLabel = "API / Service";
      let w = 110, h = 50;

      if (tool === "rect") {
        newType = "rect";
        defaultLabel = "API / Service";
      } else if (tool === "circle") {
        newType = "circle";
        defaultLabel = "Database";
        w = 80; h = 80;
      } else if (tool === "cloud") {
        newType = "cloud";
        defaultLabel = "Cache / Cloud";
        w = 120;
      } else if (tool === "text") {
        newType = "text";
        defaultLabel = "Custom Label";
        w = 100; h = 30;
      }

      const labelText = prompt(`Enter label name for ${defaultLabel}:`, defaultLabel);
      if (labelText !== null) {
        const newNode: Node = {
          id: Date.now(),
          type: newType,
          label: labelText || defaultLabel,
          x: mouseX - w / 2,
          y: mouseY - h / 2,
          w,
          h
        };
        setNodes((prev) => [...prev, newNode]);
        setTool("select");
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (dragInfoRef.current.isDragging && dragInfoRef.current.selectedNode) {
      const selected = dragInfoRef.current.selectedNode;
      setNodes((prev) =>
        prev.map((n) =>
          n.id === selected.id
            ? { ...n, x: mouseX - dragInfoRef.current.offsetX, y: mouseY - dragInfoRef.current.offsetY }
            : n
        )
      );
    } else if (arrowInfoRef.current.isDrawing && arrowInfoRef.current.startNode) {
      arrowInfoRef.current.tempX = mouseX;
      arrowInfoRef.current.tempY = mouseY;
      drawCanvas(); // Re-render for the active arrow trace line
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (dragInfoRef.current.isDragging) {
      dragInfoRef.current = { selectedNode: null, isDragging: false, offsetX: 0, offsetY: 0 };
    }

    if (arrowInfoRef.current.isDrawing && arrowInfoRef.current.startNode) {
      const endNode = getNodeAtPosition(mouseX, mouseY);
      if (endNode && endNode.id !== arrowInfoRef.current.startNode.id) {
        const fromId = arrowInfoRef.current.startNode.id;
        const toId = endNode.id;
        // Verify connection does not already exist
        const exists = connections.some((c) => c.from === fromId && c.to === toId);
        if (!exists) {
          setConnections((prev) => [...prev, { from: fromId, to: toId }]);
        }
      }
      arrowInfoRef.current = { startNode: null, isDrawing: false, tempX: 0, tempY: 0 };
      drawCanvas();
    }
  };

  const handleDblClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const clickedNode = getNodeAtPosition(mouseX, mouseY);
    if (clickedNode) {
      const action = confirm(`Choose action for "${clickedNode.label}":\n\nOK - Rename Node\nCancel - Delete Node`);
      if (action) {
        const newLabel = prompt("Enter new node name label:", clickedNode.label);
        if (newLabel !== null && newLabel.trim() !== "") {
          setNodes((prev) =>
            prev.map((n) => (n.id === clickedNode.id ? { ...n, label: newLabel } : n))
          );
        }
      } else {
        // Delete Node
        setNodes((prev) => prev.filter((n) => n.id !== clickedNode.id));
        // Remove active connections
        setConnections((prev) => prev.filter((c) => c.from !== clickedNode.id && c.to !== clickedNode.id));
      }
    }
  };

  const clearBoard = () => {
    if (confirm("Are you sure you want to clear the system design whiteboard?")) {
      setNodes([]);
      setConnections([]);
    }
  };

  return (
    <div className="sysdesign-container" style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      {/* Whiteboard Canvas Toolbar */}
      <div className="canvas-toolbar" style={{ display: "flex", gap: "8px", padding: "8px", borderBottom: "1px solid var(--border-color)", background: "rgba(10, 10, 15, 0.6)", zIndex: 10 }}>
        <button
          className={`btn-tool ${tool === "select" ? "active" : ""}`}
          onClick={() => setTool("select")}
          title="Select and Drag"
          style={{ padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <MousePointer size={16} />
        </button>
        <button
          className={`btn-tool ${tool === "rect" ? "active" : ""}`}
          onClick={() => setTool("rect")}
          title="Add Server Node"
          style={{ padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Square size={16} />
        </button>
        <button
          className={`btn-tool ${tool === "circle" ? "active" : ""}`}
          onClick={() => setTool("circle")}
          title="Add Database Cylinder"
          style={{ padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Database size={16} />
        </button>
        <button
          className={`btn-tool ${tool === "cloud" ? "active" : ""}`}
          onClick={() => setTool("cloud")}
          title="Add Cache / Cloud Shape"
          style={{ padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Cloud size={16} />
        </button>
        <button
          className={`btn-tool ${tool === "arrow" ? "active" : ""}`}
          onClick={() => setTool("arrow")}
          title="Add Arrow Connection"
          style={{ padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ArrowUpRight size={16} />
        </button>
        <button
          className={`btn-tool ${tool === "text" ? "active" : ""}`}
          onClick={() => setTool("text")}
          title="Add Text Label"
          style={{ padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Type size={16} />
        </button>
        <button
          className="btn-tool"
          onClick={clearBoard}
          title="Clear Board"
          style={{ padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "auto", color: "var(--accent-rose)" }}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Vector Drawing Canvas */}
      <div ref={containerRef} style={{ flex: 1, position: "relative", minHeight: "350px", overflow: "hidden" }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDblClick}
          style={{ display: "block", width: "100%", height: "100%", background: "rgba(2, 2, 5, 0.4)", cursor: tool === "select" ? "default" : "crosshair" }}
        />
      </div>
    </div>
  );
}
