const fs = require("fs");

let idCounter = 0;
const uid = () => `elem_${++idCounter}`;
const seed = () => Math.floor(Math.random() * 2000000000);

function makeRect(id, x, y, w, h, bg, strokeColor = "#1e1e1e", roundness = 3) {
  return {
    id,
    type: "rectangle",
    x, y, width: w, height: h,
    angle: 0,
    strokeColor,
    backgroundColor: bg,
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    roundness: { type: roundness },
    seed: seed(),
    version: 1,
    versionNonce: seed(),
    isDeleted: false,
    boundElements: [],
    updated: Date.now(),
    link: null,
    locked: false,
  };
}

function makeDiamond(id, x, y, w, h, bg, strokeColor = "#1e1e1e") {
  return {
    ...makeRect(id, x, y, w, h, bg, strokeColor),
    type: "diamond",
    roundness: null,
  };
}

function makeText(id, x, y, w, h, text, fontSize = 18, color = "#1e1e1e", containerId = null) {
  return {
    id,
    type: "text",
    x, y, width: w, height: h,
    angle: 0,
    strokeColor: color,
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    roundness: null,
    seed: seed(),
    version: 1,
    versionNonce: seed(),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    text,
    fontSize,
    fontFamily: 1,
    textAlign: "center",
    verticalAlign: containerId ? "middle" : "top",
    containerId,
    originalText: text,
    autoResize: true,
    lineHeight: 1.25,
  };
}

function makeArrow(id, points, startId, endId, label = null) {
  const arrow = {
    id,
    type: "arrow",
    x: 0, y: 0,
    width: 0, height: 0,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    roundness: { type: 2 },
    seed: seed(),
    version: 1,
    versionNonce: seed(),
    isDeleted: false,
    boundElements: [],
    updated: Date.now(),
    link: null,
    locked: false,
    points,
    lastCommittedPoint: null,
    startBinding: startId ? { elementId: startId, focus: 0, gap: 5 } : null,
    endBinding: endId ? { elementId: endId, focus: 0, gap: 5 } : null,
    startArrowhead: null,
    endArrowhead: "arrow",
  };
  // Set x,y to the first point's absolute position
  arrow.x = points[0][0];
  arrow.y = points[0][1];
  // Make points relative to first point
  const ox = points[0][0], oy = points[0][1];
  arrow.points = points.map(([px, py]) => [px - ox, py - oy]);
  return arrow;
}

function bindTextToShape(shape, textElem) {
  if (!shape.boundElements) shape.boundElements = [];
  shape.boundElements.push({ id: textElem.id, type: "text" });
}

function bindArrowToShape(shape, arrowElem) {
  if (!shape.boundElements) shape.boundElements = [];
  shape.boundElements.push({ id: arrowElem.id, type: "arrow" });
}

// ==================== DIAGRAM 1: AGENT LOOP ====================

function generateAgentLoop() {
  const elements = [];
  const CX = 400; // center x
  const BW = 260; // box width
  const BH = 80;  // box height
  const GAP = 40; // gap between boxes

  // Colors
  const BLUE = "#a5d8ff";
  const DARK_BLUE = "#4dabf7";
  const ORANGE = "#ffec99";
  const GREEN = "#b2f2bb";
  const RED = "#ffc9c9";
  const GRAY = "#e9ecef";

  // 1. REQUEST
  const r1 = makeRect(uid(), CX - BW/2, 30, BW, 65, DARK_BLUE);
  const t1 = makeText(uid(), 0, 0, BW - 20, 50, "REQUEST\nfrom User", 20, "#1e1e1e", r1.id);
  bindTextToShape(r1, t1);
  elements.push(r1, t1);

  // 2. UNDERSTAND CONTEXT
  const r2 = makeRect(uid(), CX - BW/2, 145, BW, BH, BLUE);
  const t2 = makeText(uid(), 0, 0, BW - 20, 70, "UNDERSTAND CONTEXT\nRead files, docs,\nsystem state", 18, "#1e1e1e", r2.id);
  bindTextToShape(r2, t2);
  elements.push(r2, t2);

  // 3. PLAN
  const r3 = makeRect(uid(), CX - BW/2, 275, BW, BH, BLUE);
  const t3 = makeText(uid(), 0, 0, BW - 20, 50, "PLAN\nBreak into tasks, identify tools", 18, "#1e1e1e", r3.id);
  bindTextToShape(r3, t3);
  elements.push(r3, t3);

  // 4. EXECUTE
  const r4 = makeRect(uid(), CX - BW/2, 405, BW, BH, ORANGE);
  const t4 = makeText(uid(), 0, 0, BW - 20, 70, "EXECUTE\nRun commands, call APIs,\nuse MCP tools", 18, "#1e1e1e", r4.id);
  bindTextToShape(r4, t4);
  elements.push(r4, t4);

  // 5. OBSERVE
  const r5 = makeRect(uid(), CX - BW/2, 535, BW, BH, BLUE);
  const t5 = makeText(uid(), 0, 0, BW - 20, 50, "OBSERVE\nCheck output, analyze logs", 18, "#1e1e1e", r5.id);
  bindTextToShape(r5, t5);
  elements.push(r5, t5);

  // 6. SUCCESS? (diamond)
  const DW = 180, DH = 180;
  const d6 = makeDiamond(uid(), CX - DW/2, 670, DW, DH, GRAY);
  const t6 = makeText(uid(), 0, 0, DW - 40, 25, "SUCCESS?", 20, "#1e1e1e", d6.id);
  bindTextToShape(d6, t6);
  elements.push(d6, t6);

  // 7. REPORT COMPLETE (left - YES)
  const r7 = makeRect(uid(), 60, 920, 240, 65, GREEN);
  const t7 = makeText(uid(), 0, 0, 220, 50, "REPORT COMPLETE\nReturn to user", 18, "#1e1e1e", r7.id);
  bindTextToShape(r7, t7);
  elements.push(r7, t7);

  // 8. ANALYZE FAILURE (right - NO)
  const r8 = makeRect(uid(), 500, 920, 240, 65, RED);
  const t8 = makeText(uid(), 0, 0, 220, 50, "ANALYZE FAILURE\nWhat went wrong?", 18, "#1e1e1e", r8.id);
  bindTextToShape(r8, t8);
  elements.push(r8, t8);

  // 9. FIX & RETRY
  const r9 = makeRect(uid(), 500, 1040, 240, BH, ORANGE);
  const t9 = makeText(uid(), 0, 0, 220, 50, "FIX & RETRY\nAdjust approach", 18, "#1e1e1e", r9.id);
  bindTextToShape(r9, t9);
  elements.push(r9, t9);

  // Arrows
  // 1 → 2
  const a12 = makeArrow(uid(), [[CX, 95], [CX, 145]], r1.id, r2.id);
  bindArrowToShape(r1, a12); bindArrowToShape(r2, a12);
  elements.push(a12);

  // 2 → 3
  const a23 = makeArrow(uid(), [[CX, 225], [CX, 275]], r2.id, r3.id);
  bindArrowToShape(r2, a23); bindArrowToShape(r3, a23);
  elements.push(a23);

  // 3 → 4
  const a34 = makeArrow(uid(), [[CX, 355], [CX, 405]], r3.id, r4.id);
  bindArrowToShape(r3, a34); bindArrowToShape(r4, a34);
  elements.push(a34);

  // 4 → 5
  const a45 = makeArrow(uid(), [[CX, 485], [CX, 535]], r4.id, r5.id);
  bindArrowToShape(r4, a45); bindArrowToShape(r5, a45);
  elements.push(a45);

  // 5 → 6
  const a56 = makeArrow(uid(), [[CX, 615], [CX, 670]], r5.id, d6.id);
  bindArrowToShape(r5, a56); bindArrowToShape(d6, a56);
  elements.push(a56);

  // 6 → 7 (YES - left)
  const a67 = makeArrow(uid(), [[CX - DW/2, 760], [180, 920]], d6.id, r7.id);
  bindArrowToShape(d6, a67); bindArrowToShape(r7, a67);
  elements.push(a67);

  // YES label
  const tYes = makeText(uid(), 200, 830, 50, 25, "YES", 16, "#2f9e44");
  elements.push(tYes);

  // 6 → 8 (NO - right)
  const a68 = makeArrow(uid(), [[CX + DW/2, 760], [620, 920]], d6.id, r8.id);
  bindArrowToShape(d6, a68); bindArrowToShape(r8, a68);
  elements.push(a68);

  // NO label
  const tNo = makeText(uid(), 560, 830, 40, 25, "NO", 16, "#e03131");
  elements.push(tNo);

  // 8 → 9
  const a89 = makeArrow(uid(), [[620, 985], [620, 1040]], r8.id, r9.id);
  bindArrowToShape(r8, a89); bindArrowToShape(r9, a89);
  elements.push(a89);

  // 9 → 4 (loop back - goes left then up)
  const a94 = makeArrow(uid(), [
    [500, 1080],
    [180, 1080],
    [180, 445],
    [270, 445],
  ], r9.id, r4.id);
  bindArrowToShape(r9, a94); bindArrowToShape(r4, a94);
  elements.push(a94);

  // "Back to Execute" label
  const tLoop = makeText(uid(), 70, 750, 120, 25, "retry loop", 14, "#868e96");
  elements.push(tLoop);

  // Title
  const title = makeText(uid(), CX - 130, -30, 260, 35, "THE AGENT LOOP", 28, "#1e1e1e");
  elements.push(title);

  return {
    type: "excalidraw",
    version: 2,
    source: "manual",
    elements,
    appState: {
      gridSize: null,
      viewBackgroundColor: "#ffffff",
    },
    files: {},
  };
}

// ==================== DIAGRAM 2: ENTERPRISE ARCHITECTURE ====================

function generateEnterprise() {
  const elements = [];
  const CX = 420;

  const BLUE = "#a5d8ff";
  const DARK_BLUE = "#4dabf7";
  const ORANGE = "#ffec99";
  const GREEN = "#b2f2bb";
  const LIGHT_GREEN = "#d8f5a2";

  // Title
  const title = makeText(uid(), CX - 200, 0, 400, 35, "ENTERPRISE AGENT ARCHITECTURE", 26, "#1e1e1e");
  elements.push(title);

  // 1. USER REQUEST
  const r1 = makeRect(uid(), CX - 120, 60, 240, 60, DARK_BLUE);
  const t1 = makeText(uid(), 0, 0, 220, 25, "USER REQUEST", 20, "#1e1e1e", r1.id);
  bindTextToShape(r1, t1);
  elements.push(r1, t1);

  // 2. ORCHESTRATOR AGENT (box with border)
  const orchBg = makeRect(uid(), CX - 180, 170, 360, 100, ORANGE, "#e8590c");
  const t2 = makeText(uid(), 0, 0, 340, 50, "ORCHESTRATOR AGENT\nContext-Aware, Intent-Understanding", 18, "#1e1e1e", orchBg.id);
  bindTextToShape(orchBg, t2);
  elements.push(orchBg, t2);

  // Arrow: User → Orchestrator
  const a1 = makeArrow(uid(), [[CX, 120], [CX, 170]], r1.id, orchBg.id);
  bindArrowToShape(r1, a1); bindArrowToShape(orchBg, a1);
  elements.push(a1);

  // 3. Sub-agents
  const SAW = 200, SAH = 75;
  const saY = 330;
  const saGap = 30;
  const totalW = SAW * 3 + saGap * 2;
  const saStartX = CX - totalW / 2;

  const agents = [
    { label: "SUB-AGENT 1\nDatabase Queries", bg: BLUE },
    { label: "SUB-AGENT 2\nExternal APIs", bg: BLUE },
    { label: "SUB-AGENT 3\nInternal Actions", bg: BLUE },
  ];

  const agentRects = [];
  agents.forEach((a, i) => {
    const x = saStartX + i * (SAW + saGap);
    const r = makeRect(uid(), x, saY, SAW, SAH, a.bg, "#1971c2");
    const t = makeText(uid(), 0, 0, SAW - 20, 50, a.label, 17, "#1e1e1e", r.id);
    bindTextToShape(r, t);
    elements.push(r, t);
    agentRects.push(r);

    // Arrow from orchestrator to sub-agent
    const arrow = makeArrow(uid(), [[CX - 60 + i * 60, 270], [x + SAW / 2, saY]], orchBg.id, r.id);
    bindArrowToShape(orchBg, arrow); bindArrowToShape(r, arrow);
    elements.push(arrow);
  });

  // 4. Enterprise Tools section
  const toolY = 470;
  const TW = 130, TH = 50, TGX = 20, TGY = 15;
  const toolNames = ["CRM", "ERP", "Tickets", "Email", "KB", "API", "Calendar", "Slack"];
  const cols = 4;
  const gridW = cols * TW + (cols - 1) * TGX;
  const gridStartX = CX - gridW / 2;

  // Background box for tools section
  const toolBg = makeRect(uid(), gridStartX - 30, toolY - 20, gridW + 60, 2 * TH + TGY + 80, "#f0fdf4", "#51cf66", 3);
  elements.push(toolBg);

  // "ENTERPRISE TOOLS" label
  const toolLabel = makeText(uid(), CX - 100, toolY - 15, 200, 25, "ENTERPRISE TOOLS", 16, "#2b8a3e");
  elements.push(toolLabel);

  const toolStartY = toolY + 20;

  toolNames.forEach((name, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = gridStartX + col * (TW + TGX);
    const y = toolStartY + row * (TH + TGY);
    const r = makeRect(uid(), x, y, TW, TH, GREEN, "#2f9e44");
    const t = makeText(uid(), 0, 0, TW - 10, 25, name, 17, "#1e1e1e", r.id);
    bindTextToShape(r, t);
    elements.push(r, t);
  });

  // Arrows from sub-agents to tools box
  agentRects.forEach((ar) => {
    const ax = ar.x + ar.width / 2;
    const arrow = makeArrow(uid(), [[ax, saY + SAH], [ax, toolY - 20]], ar.id, toolBg.id);
    bindArrowToShape(ar, arrow); bindArrowToShape(toolBg, arrow);
    elements.push(arrow);
  });

  return {
    type: "excalidraw",
    version: 2,
    source: "manual",
    elements,
    appState: {
      gridSize: null,
      viewBackgroundColor: "#ffffff",
    },
    files: {},
  };
}

// Write files
const dir = __dirname;
fs.writeFileSync(`${dir}/agent-loop.excalidraw`, JSON.stringify(generateAgentLoop(), null, 2));
fs.writeFileSync(`${dir}/enterprise-architecture.excalidraw`, JSON.stringify(generateEnterprise(), null, 2));
console.log("Created agent-loop.excalidraw and enterprise-architecture.excalidraw");
