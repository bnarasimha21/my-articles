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

function makeArrow(id, points, startId, endId) {
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
  arrow.x = points[0][0];
  arrow.y = points[0][1];
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

function generatePipeline() {
  const elements = [];
  const CX = 450;

  // Colors
  const DARK_BLUE = "#4dabf7";
  const ORANGE = "#ffec99";
  const BLUE = "#a5d8ff";
  const GREEN = "#b2f2bb";
  const GRAY = "#e9ecef";

  // Title
  const title = makeText(uid(), CX - 200, 0, 400, 35, "DYNAMIC AGENT ORCHESTRATION", 26, "#1e1e1e");
  elements.push(title);

  // ── Phase labels (left side) ──
  const phaseColor = "#868e96";

  // ── 1. USER QUERY ──
  const BW = 260, BH = 60;
  const r1 = makeRect(uid(), CX - BW / 2, 60, BW, BH, DARK_BLUE);
  const t1 = makeText(uid(), 0, 0, BW - 20, 25, "USER QUERY", 20, "#1e1e1e", r1.id);
  bindTextToShape(r1, t1);
  elements.push(r1, t1);

  // ── 2. DECOMPOSE ──
  const decompY = 170;
  const decompW = 300, decompH = 75;
  const r2 = makeRect(uid(), CX - decompW / 2, decompY, decompW, decompH, ORANGE, "#e8590c");
  const t2 = makeText(uid(), 0, 0, decompW - 20, 50, "DECOMPOSE\n1 LLM call (main model)", 18, "#1e1e1e", r2.id);
  bindTextToShape(r2, t2);
  elements.push(r2, t2);

  // Phase 1 label
  const p1Label = makeText(uid(), CX - decompW / 2 - 160, decompY + 20, 140, 25, "PHASE 1", 16, phaseColor);
  elements.push(p1Label);

  // Arrow: query -> decompose
  const a12 = makeArrow(uid(), [[CX, 120], [CX, decompY]], r1.id, r2.id);
  bindArrowToShape(r1, a12); bindArrowToShape(r2, a12);
  elements.push(a12);

  // ── 3. PARALLEL AGENTS (fan-out) ──
  const agentY = 310;
  const AW = 150, AH = 70, AGap = 20;
  const agentCount = 5;
  const totalAgentW = agentCount * AW + (agentCount - 1) * AGap;
  const agentStartX = CX - totalAgentW / 2;

  // Background box for parallel section
  const parBg = makeRect(uid(), agentStartX - 25, agentY - 30, totalAgentW + 50, AH + 80, "#f8f9fa", "#dee2e6");
  elements.push(parBg);

  // "PARALLEL EXECUTION" label inside bg
  const parLabel = makeText(uid(), CX - 100, agentY - 25, 200, 20, "PARALLEL EXECUTION", 14, phaseColor);
  elements.push(parLabel);

  // Phase 2 label
  const p2Label = makeText(uid(), agentStartX - 185, agentY + 15, 140, 25, "PHASE 2", 16, phaseColor);
  elements.push(p2Label);

  const agentLabels = ["Agent 1\nFlights", "Agent 2\nHotels", "Agent 3\nFood", "Agent 4\nSights", "Agent N\n..."];
  const agentRects = [];

  agentLabels.forEach((label, i) => {
    const x = agentStartX + i * (AW + AGap);
    const bg = i === agentCount - 1 ? GRAY : BLUE;
    const stroke = i === agentCount - 1 ? "#868e96" : "#1971c2";
    const r = makeRect(uid(), x, agentY + 5, AW, AH, bg, stroke);
    const t = makeText(uid(), 0, 0, AW - 10, 50, label, 16, "#1e1e1e", r.id);
    bindTextToShape(r, t);
    elements.push(r, t);
    agentRects.push(r);

    // Arrow: decompose -> each agent
    const arrow = makeArrow(uid(), [[CX, decompY + decompH], [x + AW / 2, agentY + 5]], r2.id, r.id);
    bindArrowToShape(r2, arrow); bindArrowToShape(r, arrow);
    elements.push(arrow);
  });

  // "fast model" annotation
  const fastLabel = makeText(uid(), CX + totalAgentW / 2 + 40, agentY + 15, 130, 40, "N parallel\nLLM calls\n(fast model)", 14, phaseColor);
  elements.push(fastLabel);

  // ── 4. AGGREGATE ──
  const aggY = 460;
  const aggW = 300, aggH = 75;
  const r4 = makeRect(uid(), CX - aggW / 2, aggY, aggW, aggH, ORANGE, "#e8590c");
  const t4 = makeText(uid(), 0, 0, aggW - 20, 50, "AGGREGATE\n1 LLM call (main model)", 18, "#1e1e1e", r4.id);
  bindTextToShape(r4, t4);
  elements.push(r4, t4);

  // Phase 3 label
  const p3Label = makeText(uid(), CX - aggW / 2 - 160, aggY + 20, 140, 25, "PHASE 3", 16, phaseColor);
  elements.push(p3Label);

  // Arrows: each agent -> aggregate
  agentRects.forEach((ar) => {
    const ax = ar.x + ar.width / 2;
    const arrow = makeArrow(uid(), [[ax, agentY + 5 + AH], [CX, aggY]], ar.id, r4.id);
    bindArrowToShape(ar, arrow); bindArrowToShape(r4, arrow);
    elements.push(arrow);
  });

  // ── 5. FINAL RESULT ──
  const resY = 590;
  const r5 = makeRect(uid(), CX - BW / 2, resY, BW, BH, GREEN, "#2f9e44");
  const t5 = makeText(uid(), 0, 0, BW - 20, 25, "FINAL RESULT", 20, "#1e1e1e", r5.id);
  bindTextToShape(r5, t5);
  elements.push(r5, t5);

  // Arrow: aggregate -> result
  const a45 = makeArrow(uid(), [[CX, aggY + aggH], [CX, resY]], r4.id, r5.id);
  bindArrowToShape(r4, a45); bindArrowToShape(r5, a45);
  elements.push(a45);

  // ── Timing annotation (right side) ──
  const timeX = CX + aggW / 2 + 50;
  const timeBrace = makeText(uid(), timeX, 170, 220, 100,
    "Total latency:\ndecompose\n+ slowest agent\n+ aggregate", 15, "#495057");
  elements.push(timeBrace);

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

const dir = __dirname;
fs.writeFileSync(`${dir}/pipeline.excalidraw`, JSON.stringify(generatePipeline(), null, 2));
console.log("Created pipeline.excalidraw");
