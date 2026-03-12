const fs = require("fs");

let idCounter = 0;
const uid = () => `elem_${++idCounter}`;
const seed = () => Math.floor(Math.random() * 2000000000);

function makeRect(id, x, y, w, h, bg, strokeColor = "#1e1e1e", roundness = 3) {
  return {
    id, type: "rectangle", x, y, width: w, height: h,
    angle: 0, strokeColor, backgroundColor: bg, fillStyle: "solid",
    strokeWidth: 2, strokeStyle: "solid", roughness: 1, opacity: 100,
    groupIds: [], roundness: { type: roundness }, seed: seed(),
    version: 1, versionNonce: seed(), isDeleted: false, boundElements: [],
    updated: Date.now(), link: null, locked: false,
  };
}

function makeDiamond(id, x, y, w, h, bg, strokeColor = "#1e1e1e") {
  return { ...makeRect(id, x, y, w, h, bg, strokeColor), type: "diamond", roundness: null };
}

function makeText(id, x, y, w, h, text, fontSize = 18, color = "#1e1e1e", containerId = null) {
  return {
    id, type: "text", x, y, width: w, height: h, angle: 0,
    strokeColor: color, backgroundColor: "transparent", fillStyle: "solid",
    strokeWidth: 2, strokeStyle: "solid", roughness: 1, opacity: 100,
    groupIds: [], roundness: null, seed: seed(), version: 1, versionNonce: seed(),
    isDeleted: false, boundElements: null, updated: Date.now(), link: null, locked: false,
    text, fontSize, fontFamily: 1, textAlign: "center",
    verticalAlign: containerId ? "middle" : "top",
    containerId, originalText: text, autoResize: true, lineHeight: 1.25,
  };
}

function makeArrow(id, points, startId, endId, strokeColor = "#1e1e1e", strokeStyle = "solid") {
  const arrow = {
    id, type: "arrow", x: 0, y: 0, width: 0, height: 0, angle: 0,
    strokeColor, backgroundColor: "transparent", fillStyle: "solid",
    strokeWidth: 2, strokeStyle, roughness: 1, opacity: 100,
    groupIds: [], roundness: { type: 2 }, seed: seed(), version: 1, versionNonce: seed(),
    isDeleted: false, boundElements: [], updated: Date.now(), link: null, locked: false,
    points, lastCommittedPoint: null,
    startBinding: startId ? { elementId: startId, focus: 0, gap: 5 } : null,
    endBinding: endId ? { elementId: endId, focus: 0, gap: 5 } : null,
    startArrowhead: null, endArrowhead: "arrow",
  };
  arrow.x = points[0][0];
  arrow.y = points[0][1];
  const ox = points[0][0], oy = points[0][1];
  arrow.points = points.map(([px, py]) => [px - ox, py - oy]);
  return arrow;
}

// Bidirectional arrow (no arrowhead at start, arrowhead at both ends)
function makeBiArrow(id, points, startId, endId, strokeColor = "#1e1e1e", strokeStyle = "dashed") {
  const a = makeArrow(id, points, startId, endId, strokeColor, strokeStyle);
  a.startArrowhead = "arrow";
  return a;
}

function bind(shape, elem, type) {
  if (!shape.boundElements) shape.boundElements = [];
  shape.boundElements.push({ id: elem.id, type });
}

function generateEnterprise() {
  const elements = [];
  const CX = 450;

  // Colors
  const BLUE = "#a5d8ff";
  const DARK_BLUE = "#4dabf7";
  const ORANGE = "#ffec99";
  const GREEN = "#b2f2bb";
  const GRAY = "#e9ecef";
  const PURPLE = "#d0bfff";
  const LIGHT_YELLOW = "#fff9db";

  // ── Title ──
  elements.push(makeText(uid(), CX - 250, 0, 500, 35, "ENTERPRISE AGENT: INSURANCE CLAIM", 26, "#1e1e1e"));

  // ── 1. USER REQUEST ──
  const r1 = makeRect(uid(), CX - 130, 60, 260, 60, DARK_BLUE);
  const t1 = makeText(uid(), 0, 0, 240, 25, "USER REQUEST", 20, "#1e1e1e", r1.id);
  bind(r1, t1, "text");
  elements.push(r1, t1);

  // ── 2. ORCHESTRATOR AGENT ──
  const orch = makeRect(uid(), CX - 180, 180, 360, 90, ORANGE, "#e8590c");
  const tOrch = makeText(uid(), 0, 0, 340, 50, "ORCHESTRATOR AGENT\nUnderstand intent, plan, coordinate", 17, "#1e1e1e", orch.id);
  bind(orch, tOrch, "text");
  elements.push(orch, tOrch);

  // Arrow: User → Orchestrator
  const a1 = makeArrow(uid(), [[CX, 120], [CX, 180]], r1.id, orch.id);
  bind(r1, a1, "arrow"); bind(orch, a1, "arrow");
  elements.push(a1);

  // ── SHARED MEMORY (side box, connected to orchestrator) ──
  const memX = CX + 260;
  const memY = 155;
  const mem = makeRect(uid(), memX, memY, 200, 90, PURPLE, "#7048e8");
  const tMem = makeText(uid(), 0, 0, 180, 50, "SHARED MEMORY\nContext, history,\nintermediate results", 14, "#1e1e1e", mem.id);
  bind(mem, tMem, "text");
  elements.push(mem, tMem);

  // Bidirectional arrow: Orchestrator ↔ Memory
  const aMem = makeBiArrow(uid(), [[CX + 180, 225], [memX, 200]], orch.id, mem.id, "#7048e8", "dashed");
  bind(orch, aMem, "arrow"); bind(mem, aMem, "arrow");
  elements.push(aMem);

  // ── 3. SUB-AGENTS ──
  const SAW = 190, SAH = 70, saY = 335, saGap = 30;
  const totalW = SAW * 3 + saGap * 2;
  const saStartX = CX - totalW / 2;

  const agentLabels = [
    "POLICY AGENT\nCoverage, limits, history",
    "CLAIMS AGENT\nProcess, assess, pay out",
    "COMMS AGENT\nNotify, coordinate, update",
  ];

  const agentRects = [];
  agentLabels.forEach((label, i) => {
    const x = saStartX + i * (SAW + saGap);
    const r = makeRect(uid(), x, saY, SAW, SAH, BLUE, "#1971c2");
    const t = makeText(uid(), 0, 0, SAW - 20, 50, label, 16, "#1e1e1e", r.id);
    bind(r, t, "text");
    elements.push(r, t);
    agentRects.push(r);

    const a = makeArrow(uid(), [[CX - 60 + i * 60, 270], [x + SAW / 2, saY]], orch.id, r.id);
    bind(orch, a, "arrow"); bind(r, a, "arrow");
    elements.push(a);
  });

  // ── 4. ENTERPRISE TOOLS (4x2 grid) ──
  const toolY = 475;
  const TW = 125, TH = 48, TGX = 18, TGY = 14;
  const toolNames = ["Policy DB", "Claims DB", "Adjusters", "Email", "Rules KB", "Repair API", "Calendar", "Payments"];
  const cols = 4;
  const gridW = cols * TW + (cols - 1) * TGX;
  const gridStartX = CX - gridW / 2;

  const toolBg = makeRect(uid(), gridStartX - 25, toolY - 25, gridW + 50, 2 * TH + TGY + 75, "#f0fdf4", "#51cf66", 3);
  elements.push(toolBg);
  elements.push(makeText(uid(), CX - 90, toolY - 20, 180, 22, "ENTERPRISE TOOLS", 15, "#2b8a3e"));

  const toolStartY = toolY + 18;
  const toolRects = {};
  toolNames.forEach((name, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = gridStartX + col * (TW + TGX);
    const y = toolStartY + row * (TH + TGY);
    const r = makeRect(uid(), x, y, TW, TH, GREEN, "#2f9e44");
    const t = makeText(uid(), 0, 0, TW - 10, 22, name, 16, "#1e1e1e", r.id);
    bind(r, t, "text");
    elements.push(r, t);
    toolRects[name] = r;
  });

  // Agent-to-tool mapping (domain-based connections)
  // Policy Agent → Policy DB, Rules KB, Claims DB
  // Claims Agent → Claims DB, Repair API, Payments, Calendar
  // Comms Agent → Email, Adjusters, Calendar
  const agentToolMap = [
    ["Policy DB", "Rules KB", "Claims DB"],             // Policy Agent
    ["Claims DB", "Repair API", "Payments", "Calendar"],// Claims Agent
    ["Email", "Adjusters", "Calendar"],                // Comms Agent
  ];

  const agentColors = ["#1971c2", "#e8590c", "#7048e8"];

  agentRects.forEach((ar, agentIdx) => {
    const tools = agentToolMap[agentIdx];
    const color = agentColors[agentIdx];
    const ax = ar.x + ar.width / 2;

    tools.forEach((toolName) => {
      const tr = toolRects[toolName];
      const tx = tr.x + tr.width / 2;
      const ty = tr.y;
      const a = makeArrow(uid(), [[ax, saY + SAH], [tx, ty]], ar.id, tr.id, color);
      bind(ar, a, "arrow"); bind(tr, a, "arrow");
      elements.push(a);
    });
  });

  // ── 5. COLLECT RESULTS ──
  const toolBgBottom = toolY - 25 + 2 * TH + TGY + 75;
  const resultsY = toolBgBottom + 30;
  const results = makeRect(uid(), CX - 130, resultsY, 260, 60, BLUE, "#1971c2");
  const tResults = makeText(uid(), 0, 0, 240, 25, "COLLECT RESULTS", 18, "#1e1e1e", results.id);
  bind(results, tResults, "text");
  elements.push(results, tResults);

  const aToolRes = makeArrow(uid(), [[CX, toolBgBottom], [CX, resultsY]], toolBg.id, results.id);
  bind(toolBg, aToolRes, "arrow"); bind(results, aToolRes, "arrow");
  elements.push(aToolRes);

  // ── 6. TASK COMPLETE? (diamond) ──
  const DW = 200, DH = 200;
  const dY = resultsY + 110;
  const diamond = makeDiamond(uid(), CX - DW / 2, dY, DW, DH, GRAY);
  const tDiamond = makeText(uid(), 0, 0, DW - 50, 25, "TASK\nCOMPLETE?", 19, "#1e1e1e", diamond.id);
  bind(diamond, tDiamond, "text");
  elements.push(diamond, tDiamond);

  const aResDia = makeArrow(uid(), [[CX, resultsY + 60], [CX, dY]], results.id, diamond.id);
  bind(results, aResDia, "arrow"); bind(diamond, aResDia, "arrow");
  elements.push(aResDia);

  // ── 7. YES → REPORT TO USER (down) ──
  const reportY = dY + DH + 50;
  const report = makeRect(uid(), CX - 130, reportY, 260, 60, GREEN, "#2f9e44");
  const tReport = makeText(uid(), 0, 0, 240, 25, "REPORT TO USER\nTask resolved", 18, "#1e1e1e", report.id);
  bind(report, tReport, "text");
  elements.push(report, tReport);

  const aYes = makeArrow(uid(), [[CX, dY + DH], [CX, reportY]], diamond.id, report.id);
  bind(diamond, aYes, "arrow"); bind(report, aYes, "arrow");
  elements.push(aYes);
  elements.push(makeText(uid(), CX + 15, dY + DH + 10, 45, 22, "YES", 16, "#2f9e44"));

  // ── 8. UNCERTAIN → ESCALATE TO HUMAN (left) ──
  const humanX = 50;
  const humanY = dY + DH / 2 - 30;
  const human = makeRect(uid(), humanX, humanY, 220, 60, PURPLE, "#7048e8");
  const tHuman = makeText(uid(), 0, 0, 200, 25, "ESCALATE TO HUMAN\nLow confidence / high stakes", 14, "#1e1e1e", human.id);
  bind(human, tHuman, "text");
  elements.push(human, tHuman);

  const aUncertain = makeArrow(uid(), [[CX - DW / 2, dY + DH / 2], [humanX + 220, humanY + 30]], diamond.id, human.id);
  bind(diamond, aUncertain, "arrow"); bind(human, aUncertain, "arrow");
  elements.push(aUncertain);
  elements.push(makeText(uid(), CX - DW / 2 - 100, dY + DH / 2 - 30, 90, 22, "UNCERTAIN", 14, "#7048e8"));

  // ── 9. NO → Loop back to Orchestrator (right side) ──
  const loopX = CX + 370;
  const aNo = makeArrow(uid(), [
    [CX + DW / 2, dY + DH / 2],
    [loopX, dY + DH / 2],
    [loopX, 225],
    [CX + 180, 225],
  ], diamond.id, orch.id);
  bind(diamond, aNo, "arrow"); bind(orch, aNo, "arrow");
  elements.push(aNo);
  elements.push(makeText(uid(), CX + DW / 2 + 15, dY + DH / 2 - 28, 30, 22, "NO", 16, "#e03131"));

  // ── Guardrails annotation on the retry loop ──
  const guardY = (dY + DH / 2 + 225) / 2 - 10;
  const guard = makeRect(uid(), loopX - 10, guardY, 170, 55, LIGHT_YELLOW, "#e8590c", 3);
  const tGuard = makeText(uid(), 0, 0, 155, 40, "GUARDRAILS\nMax retries, cost limit,\ntime budget", 12, "#e8590c", guard.id);
  bind(guard, tGuard, "text");
  elements.push(guard, tGuard);

  return {
    type: "excalidraw",
    version: 2,
    source: "manual",
    elements,
    appState: { gridSize: null, viewBackgroundColor: "#ffffff" },
    files: {},
  };
}

const dir = __dirname;
fs.writeFileSync(`${dir}/enterprise-architecture.excalidraw`, JSON.stringify(generateEnterprise(), null, 2));
console.log("Created enterprise-architecture.excalidraw");
