// ConvoGlass Vector Whiteboard Canvas Engine

let canvas = null;
let ctx = null;
let currentCanvasTool = 'select'; // select, rect, circle, cloud, arrow, text
let canvasNodes = [];
let canvasConnections = [];

// Dragging tracking states
let selectedNode = null;
let isDraggingNode = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Arrow drawing tracking states
let arrowStartNode = null;
let tempArrowTargetX = 0;
let tempArrowTargetY = 0;
let isDrawingArrow = false;

function initSystemDesignCanvas() {
  canvas = document.getElementById('sysdesign-canvas-element');
  if (!canvas) return;
  
  ctx = canvas.getContext('2d');
  
  // Set logical dimensions matching container layout sizes
  resizeCanvasToContainer();
  
  // Event listeners for drawing / interactions
  canvas.addEventListener('mousedown', handleCanvasMouseDown);
  canvas.addEventListener('mousemove', handleCanvasMouseMove);
  canvas.addEventListener('mouseup', handleCanvasMouseUp);
  canvas.addEventListener('dblclick', handleCanvasDblClick);
  
  window.addEventListener('resize', resizeCanvasToContainer);

  // Load default starter system layout
  loadStarterSystemDiagram();
  drawCanvasBoard();
}

function resizeCanvasToContainer() {
  if (!canvas) return;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  drawCanvasBoard();
}

// Starter system diagram template
function loadStarterSystemDiagram() {
  canvasNodes = [
    { id: 1, type: 'cloud', label: 'Client App', x: 80, y: 150, w: 100, h: 50 },
    { id: 2, type: 'rect', label: 'Load Balancer', x: 240, y: 150, w: 120, h: 50 },
    { id: 3, type: 'rect', label: 'API Server', x: 420, y: 150, w: 120, h: 50 }
  ];
  
  canvasConnections = [
    { from: 1, to: 2 },
    { from: 2, to: 3 }
  ];
}

function setCanvasTool(tool) {
  currentCanvasTool = tool;
  
  // Update button active state
  const tools = ['select', 'rect', 'circle', 'cloud', 'arrow', 'text'];
  tools.forEach(t => {
    const el = document.getElementById(`tool-${t}`);
    if (el) el.classList.remove('active');
  });

  const activeBtn = document.getElementById(`tool-${tool}`);
  if (activeBtn) activeBtn.classList.add('active');
  
  // Reset states
  selectedNode = null;
  arrowStartNode = null;
  isDrawingArrow = false;
  isDraggingNode = false;
}

function clearCanvasBoard() {
  if (confirm("Are you sure you want to clear the system design whiteboard?")) {
    canvasNodes = [];
    canvasConnections = [];
    drawCanvasBoard();
  }
}

// Find node at specific coordinate
function getNodeAtPosition(x, y) {
  // Loop backwards to check top layered nodes first
  for (let i = canvasNodes.length - 1; i >= 0; i--) {
    const node = canvasNodes[i];
    if (x >= node.x && x <= node.x + node.w && y >= node.y && y <= node.y + node.h) {
      return node;
    }
  }
  return null;
}

// Mouse Action Handlers
function handleCanvasMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const clickedNode = getNodeAtPosition(mouseX, mouseY);

  if (currentCanvasTool === 'select') {
    if (clickedNode) {
      selectedNode = clickedNode;
      isDraggingNode = true;
      dragOffsetX = mouseX - clickedNode.x;
      dragOffsetY = mouseY - clickedNode.y;
    }
  } else if (currentCanvasTool === 'arrow') {
    if (clickedNode) {
      arrowStartNode = clickedNode;
      isDrawingArrow = true;
      tempArrowTargetX = mouseX;
      tempArrowTargetY = mouseY;
    }
  } else {
    // Add Node Tools
    let newType = '';
    let defaultLabel = '';
    let w = 110, h = 50;

    if (currentCanvasTool === 'rect') {
      newType = 'rect';
      defaultLabel = 'API / Service';
    } else if (currentCanvasTool === 'circle') {
      newType = 'circle';
      defaultLabel = 'Database';
      w = 80; h = 80;
    } else if (currentCanvasTool === 'cloud') {
      newType = 'cloud';
      defaultLabel = 'Load Balancer';
      w = 120;
    } else if (currentCanvasTool === 'text') {
      newType = 'text';
      defaultLabel = 'Custom Label';
      w = 100; h = 30;
    }

    if (newType) {
      const labelText = prompt(`Enter label name for ${defaultLabel}:`, defaultLabel);
      if (labelText !== null) {
        const newNode = {
          id: Date.now(),
          type: newType,
          label: labelText || defaultLabel,
          x: mouseX - w/2,
          y: mouseY - h/2,
          w: w,
          h: h
        };
        canvasNodes.push(newNode);
        drawCanvasBoard();
        setCanvasTool('select');
      }
    }
  }
}

function handleCanvasMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (isDraggingNode && selectedNode) {
    selectedNode.x = mouseX - dragOffsetX;
    selectedNode.y = mouseY - dragOffsetY;
    drawCanvasBoard();
  } else if (isDrawingArrow && arrowStartNode) {
    tempArrowTargetX = mouseX;
    tempArrowTargetY = mouseY;
    drawCanvasBoard();
  }
}

function handleCanvasMouseUp(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (isDraggingNode) {
    isDraggingNode = false;
    selectedNode = null;
  }

  if (isDrawingArrow && arrowStartNode) {
    const endNode = getNodeAtPosition(mouseX, mouseY);
    if (endNode && endNode.id !== arrowStartNode.id) {
      // Connect nodes
      canvasConnections.push({
        from: arrowStartNode.id,
        to: endNode.id
      });
    }
    isDrawingArrow = false;
    arrowStartNode = null;
    drawCanvasBoard();
  }
}

// Double click to rename node labels or delete node
function handleCanvasDblClick(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const node = getNodeAtPosition(mouseX, mouseY);
  if (node) {
    const action = confirm(`Choose action for "${node.label}":\n\nOK - Rename Node\nCancel - Delete Node`);
    if (action) {
      const newLabel = prompt("Enter new node name label:", node.label);
      if (newLabel !== null && newLabel.trim() !== '') {
        node.label = newLabel;
        drawCanvasBoard();
      }
    } else {
      // Delete Node
      canvasNodes = canvasNodes.filter(n => n.id !== node.id);
      // Remove related connections
      canvasConnections = canvasConnections.filter(c => c.from !== node.id && c.to !== node.id);
      drawCanvasBoard();
    }
  }
}

// Canvas Painting Operations
function drawCanvasBoard() {
  if (!ctx) return;
  
  // Clear Frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw Background Grid Pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
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

  // Draw Static Connection Lines
  canvasConnections.forEach(conn => {
    const fromNode = canvasNodes.find(n => n.id === conn.from);
    const toNode = canvasNodes.find(n => n.id === conn.to);
    
    if (fromNode && toNode) {
      drawArrowBetweenNodes(fromNode, toNode);
    }
  });

  // Draw temporary arrow line being actively created
  if (isDrawingArrow && arrowStartNode) {
    const startX = arrowStartNode.x + arrowStartNode.w / 2;
    const startY = arrowStartNode.y + arrowStartNode.h / 2;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(tempArrowTargetX, tempArrowTargetY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash
  }

  // Draw Nodes
  canvasNodes.forEach(node => {
    ctx.lineWidth = 2;
    
    // Choose neon themes matching CSS accents
    if (node.type === 'rect') {
      ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
      ctx.strokeStyle = '#8b5cf6'; // Violet
      drawRoundedRect(node.x, node.y, node.w, node.h, 8);
    } else if (node.type === 'circle') {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.1)';
      ctx.strokeStyle = '#f43f5e'; // Rose
      drawDatabaseNode(node.x, node.y, node.w, node.h);
    } else if (node.type === 'cloud') {
      ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
      ctx.strokeStyle = '#06b6d4'; // Cyan
      drawCloudNode(node.x, node.y, node.w, node.h);
    } else {
      // Plain text labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      drawRoundedRect(node.x, node.y, node.w, node.h, 4);
    }

    // Write Label Name text
    ctx.fillStyle = '#f4f4f5';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textX = node.x + node.w / 2;
    const textY = node.y + node.h / 2;
    ctx.fillText(node.label, textX, textY);
  });
}

// Vector Painting Helper shapes
function drawRoundedRect(x, y, width, height, radius) {
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
}

function drawDatabaseNode(x, y, w, h) {
  // Cylindrical DB drawings
  ctx.beginPath();
  // Draw base
  ctx.ellipse(x + w/2, y + h - h/4, w/2, h/6, 0, 0, Math.PI);
  ctx.lineTo(x, y + h/4);
  // Draw top
  ctx.ellipse(x + w/2, y + h/4, w/2, h/6, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw top ellipse lip lines
  ctx.beginPath();
  ctx.ellipse(x + w/2, y + h/4, w/2, h/6, 0, 0, 2 * Math.PI);
  ctx.stroke();
}

function drawCloudNode(x, y, w, h) {
  // Simplified vector clouds
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
}

// Arrow Drawing connecting node boundary anchors
function drawArrowBetweenNodes(fromNode, toNode) {
  const fromX = fromNode.x + fromNode.w / 2;
  const fromY = fromNode.y + fromNode.h / 2;
  const toX = toNode.x + toNode.w / 2;
  const toY = toNode.y + toNode.h / 2;

  // Calculate angle between centers
  const angle = Math.atan2(toY - fromY, toX - fromX);

  // Find points on bounding box edge representing connection targets
  const startX = fromX + Math.cos(angle) * (fromNode.w / 2);
  const startY = fromY + Math.sin(angle) * (fromNode.h / 2);
  const endX = toX - Math.cos(angle) * (toNode.w / 2);
  const endY = toY - Math.sin(angle) * (toNode.h / 2);

  // Draw connecting line
  ctx.strokeStyle = '#a1a1aa';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Draw arrow head triangle
  const arrowSize = 8;
  ctx.fillStyle = '#a1a1aa';
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - arrowSize * Math.cos(angle - Math.PI/6), endY - arrowSize * Math.sin(angle - Math.PI/6));
  ctx.lineTo(endX - arrowSize * Math.cos(angle + Math.PI/6), endY - arrowSize * Math.sin(angle + Math.PI/6));
  ctx.closePath();
  ctx.fill();
}
