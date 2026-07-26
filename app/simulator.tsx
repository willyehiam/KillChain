"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, { type LayerState } from "./map";
import {
  advance,
  assessmentEffectOutcome,
  authorizePackage,
  cancelCollectionTask,
  cancelPackage,
  chooseBlockadePosture,
  collectionRecommendations,
  composePackage,
  createSim,
  defaultWeights,
  doctrineAction,
  effectorOrigin,
  executePackage,
  formatTime,
  initiativeScore,
  nominateTarget,
  nominationGates,
  openingOptionsFor,
  packageRecommendations,
  pipelineLoad,
  projectFactionView,
  releaseGates,
  scenarioById,
  setUnitCommandMode,
  supportOptions,
  taskAssessment,
  taskCollection,
  type BlockadePosture,
  type DesiredEffect,
  type DoctrineAction,
  type Faction,
  type PackageWeights,
  type Sim,
  type TaskPurpose
} from "@/lib/sim";

type Panel = "brief" | "tracks" | "collection" | "board" | "operations" | "resources" | "influence" | "audit" | "layers" | null;
type InspectorTab = "overview" | "evidence" | "chain";
type RailIconName = "tracks" | "collection" | "board" | "operations" | "resources" | "influence" | "audit" | "layers" | "staff" | "help";

const factions: Array<{ id: Faction; label: string }> = [
  { id: "USA", label: "United States" },
  { id: "PRC", label: "China" },
  { id: "TWN", label: "Taiwan" },
  { id: "ROK", label: "South Korea" }
];

const openingBriefs: Record<Faction, { title: string; detail: string }> = {
  USA: {
    title: "The exercise never ended",
    detail: "Chinese inspection zones are constricting commercial access. Choose the intent commanders will execute first."
  },
  PRC: {
    title: "The inspection regime is exposed",
    detail: "Outside forces are organizing while commercial pressure remains incomplete. Choose how the Eastern Theater sustains coercive leverage."
  },
  TWN: {
    title: "The quarantine is becoming permanent",
    detail: "Commercial access is narrowing and the first contested inspection is approaching. Choose how Taiwan preserves sovereign action."
  },
  ROK: {
    title: "The alliance needs a Korean decision",
    detail: "The Taiwan crisis is pulling sensing and sustainment south while northern readiness still matters. Choose the contribution South Korea can sustain."
  }
};

const panelItems: Array<{ id: Exclude<Panel, "brief" | null>; icon: RailIconName; label: string; shortcut?: string }> = [
  { id: "tracks", icon: "tracks", label: "Tracks" },
  { id: "collection", icon: "collection", label: "Collection", shortcut: "C" },
  { id: "board", icon: "board", label: "Target board" },
  { id: "operations", icon: "operations", label: "Operations" },
  { id: "resources", icon: "resources", label: "Resources" },
  { id: "influence", icon: "influence", label: "Strategic effects" },
  { id: "audit", icon: "audit", label: "Decision log" },
  { id: "layers", icon: "layers", label: "Map layers", shortcut: "L" }
];

function RailIcon({ name }: { name: RailIconName }) {
  const paths: Record<RailIconName, React.ReactNode> = {
    tracks: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
    collection: <><path d="M4 18c3.8-6.7 7.6-9.8 16-12" /><path d="M5 7v5h5M14 17h5v-5" /><circle cx="17.5" cy="6.5" r="2" /></>,
    board: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9.5 4v16M14.5 4v16M4 9.5h16M4 14.5h16" /></>,
    operations: <><path d="M4 17 10 11l4 3 6-7" /><circle cx="4" cy="17" r="1.8" /><circle cx="10" cy="11" r="1.8" /><circle cx="14" cy="14" r="1.8" /><circle cx="20" cy="7" r="1.8" /></>,
    resources: <><path d="M5 6h14M5 12h14M5 18h14" /><circle cx="9" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="11" cy="18" r="2" /></>,
    influence: <><circle cx="12" cy="12" r="3" /><path d="M12 3a9 9 0 0 1 9 9M12 21a9 9 0 0 1-9-9M6.5 5A9 9 0 0 1 19 17.5" /></>,
    audit: <><path d="M7 5h13M7 12h13M7 19h13" /><path d="m3.5 5 .9.9 1.8-2M3.5 12l.9.9 1.8-2M3.5 19l.9.9 1.8-2" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m4 12 8 4.5 8-4.5M4 16l8 4.5 8-4.5" /></>,
    staff: <><circle cx="8" cy="9" r="3" /><circle cx="17" cy="8" r="2.5" /><path d="M3 20c.8-4 2.7-6 5-6s4.2 2 5 6M14 14c2.8.1 4.8 2 5.8 5" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.7 2.7 0 1 1 4.2 2.3c-1 .6-1.7 1.1-1.7 2.7M12 18h.01" /></>
  };

  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const effectCopy: Record<DesiredEffect, { label: string; description: string }> = {
  SUPPRESS: { label: "Suppress", description: "Temporarily reduce sensing and ability to act." },
  DISRUPT: { label: "Disrupt", description: "Break command and sensing relationships." },
  DISABLE: { label: "Disable", description: "Produce a durable mission kill without requiring destruction." },
  DESTROY: { label: "Destroy", description: "Seek broad physical and functional loss at greater strategic cost." }
};

const doctrinePresets: Record<string, PackageWeights> = {
  Balanced: defaultWeights,
  Fastest: { ...defaultWeights, effect: 18, time: 36, collateral: 14, distance: 12, fuel: 6, inventory: 4, platformRisk: 6, escalation: 4 },
  "Lowest collateral": { ...defaultWeights, effect: 18, time: 8, collateral: 42, distance: 5, fuel: 5, inventory: 5, platformRisk: 10, escalation: 7 },
  "Lowest platform risk": { ...defaultWeights, effect: 17, time: 8, collateral: 16, distance: 7, fuel: 5, inventory: 5, platformRisk: 34, escalation: 8 },
  "Conserve inventory": { ...defaultWeights, effect: 16, time: 8, collateral: 16, distance: 7, fuel: 11, inventory: 28, platformRisk: 8, escalation: 6 }
};

const shouldAutoPause = (title?: string) => !!title && (
  new Set([
    "INDEPENDENT EVIDENCE FUSED",
    "CORRELATED REPORT DISCOUNTED",
    "PACKAGE CANCELLED",
    "EFFECTS WINDOW COMPLETE",
    "PROVISIONAL ASSESSMENT",
    "COMBAT ASSESSMENT CLOSED",
    "EXERCISE WINDOW EXPIRED"
  ]).has(title)
  || title.startsWith("CUSTODY LOST")
);

function Metric({ label, value, suffix = "", tone = "normal" }: { label: string; value: number; suffix?: string; tone?: "normal" | "warning" | "good" }) {
  return (
    <div className={`metric ${tone}`}>
      <span>{label}</span>
      <strong className="mono">{Math.round(value)}{suffix}</strong>
      <i><em style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></i>
    </div>
  );
}

function PanelHeader({ title, eyebrow, onClose }: { title: string; eyebrow: string; onClose: () => void }) {
  return (
    <header className="drawerHeader">
      <div><span>{eyebrow}</span><h2>{title}</h2></div>
      <button onClick={onClose} aria-label={`Close ${title}`}>×</button>
    </header>
  );
}

function StatusIcon({ passed }: { passed: boolean }) {
  return <span className={`statusIcon ${passed ? "passed" : "failed"}`} aria-label={passed ? "Passed" : "Not passed"}>{passed ? "✓" : "!"}</span>;
}

function EventList({ sim }: { sim: Sim }) {
  return (
    <div className="eventList">
      {sim.events.map(event => (
        <article key={event.id} className={`event ${event.severity.toLowerCase()}`}>
          <time className="mono">{formatTime(event.minute)}</time>
          <div><span>{event.category}</span><h3>{event.title}</h3><p>{event.detail}</p></div>
        </article>
      ))}
    </div>
  );
}

function TrackList({ sim, onSelect }: { sim: Sim; onSelect: (id: string) => void }) {
  return (
    <div className="objectList">
      {sim.tracks.map(track => {
        const hypothesis = [...track.hypotheses].sort((a, b) => b.probability - a.probability)[0];
        return (
          <button key={track.id} className={sim.selected === track.id ? "active" : ""} onClick={() => onSelect(track.id)}>
            <span className="objectSymbol">{track.domain === "SEA" ? "◇" : "△"}</span>
            <span className="objectCopy">
              <b>{track.callsign}</b>
              <span>{hypothesis.label}</span>
              <small><span className="mono">{hypothesis.probability}%</span> confidence · {track.stage} · {track.status}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Timeline({ sim, expanded, setExpanded, setSim }: { sim: Sim; expanded: boolean; setExpanded: (value: boolean) => void; setSim: React.Dispatch<React.SetStateAction<Sim>> }) {
  const tasks = sim.collectionTasks.filter(task => task.status !== "COMPLETE").slice(0, 5);
  const operations = sim.operations.filter(operation => !["COMPLETE", "ABORTED"].includes(operation.status)).slice(0, 3);
  const nextTask = [...tasks].sort((a, b) => a.availableAt - b.availableAt)[0];
  return (
    <section className={`timeline ${expanded ? "expanded" : ""}`} aria-label="Mission timeline">
      <div className="timelineControls">
        <button className="playButton" onClick={() => setSim(current => ({ ...current, paused: !current.paused }))} aria-label={sim.paused ? "Play simulation" : "Pause simulation"}>{sim.paused ? "▶" : "Ⅱ"}</button>
        {[1, 4, 12].map(speed => <button key={speed} className={sim.speed === speed ? "active" : ""} onClick={() => setSim(current => ({ ...current, speed }))}>{speed}×</button>)}
        <div className="currentTime"><span>Mission time</span><strong className="mono">{formatTime(sim.minute)}</strong></div>
        <div className="nextEvent"><span>Next intelligence</span><strong>{nextTask ? `${nextTask.status.toLowerCase()} · ${formatTime(nextTask.availableAt)}` : "No task scheduled"}</strong></div>
        <button className="expandTimeline" onClick={() => setExpanded(!expanded)}>{expanded ? "Collapse timeline" : "Expand timeline"}</button>
      </div>
      {expanded && (
        <div className="timelineLanes">
          <div className="timeScale"><span className="mono">T−30</span><span className="mono">NOW</span><span className="mono">T+30</span><span className="mono">T+60</span><span className="mono">T+90</span></div>
          <div className="timelineLane"><b>Collection</b><div>{tasks.map(task => <span key={task.id} style={{ left: `${Math.max(2, Math.min(88, 22 + (task.collectAt - sim.minute) * .72))}%`, width: `${Math.max(7, (task.availableAt - task.collectAt) * .72)}%` }}>{sim.sensors.find(sensor => sensor.id === task.sensorId)?.name}<small>{task.status}</small></span>)}</div></div>
          <div className="timelineLane"><b>Effects</b><div>{operations.map(operation => <span key={operation.id} className="effectBar" style={{ left: "28%", width: `${Math.max(14, Math.min(58, ((operation.impactAt ?? sim.minute + 25) - sim.minute) * .72))}%` }}>{sim.effectors.find(effector => effector.id === operation.effectorId)?.name}<small>{operation.status}</small></span>)}</div></div>
        </div>
      )}
    </section>
  );
}

export default function Simulator() {
  const [sim, setSim] = useState<Sim>(() => createSim());
  const [panel, setPanel] = useState<Panel>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("overview");
  const [selectedUnitId, setSelectedUnitId] = useState<string>();
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [workbenchOpen, setWorkbenchOpen] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [activeSensorId, setActiveSensorId] = useState("sat");
  const [taskPurpose, setTaskPurpose] = useState<TaskPurpose>("IDENTIFY");
  const [effect, setEffect] = useState<DesiredEffect>("DISABLE");
  const [supports, setSupports] = useState<string[]>(["PRECISION ISR"]);
  const [weights, setWeights] = useState<PackageWeights>(defaultWeights);
  const [preset, setPreset] = useState("Balanced");
  const [advancedWeights, setAdvancedWeights] = useState(false);
  const [advancedPlanning, setAdvancedPlanning] = useState(false);
  const [showAllSensors, setShowAllSensors] = useState(false);
  const [staffToolsOpen, setStaffToolsOpen] = useState(false);
  const [selectedEffectorId, setSelectedEffectorId] = useState("nightglass");
  const [layers, setLayers] = useState<LayerState>({ intelligence: true, units: true, space: true, threat: true, shipping: true, command: false });
  const [notice, setNotice] = useState("");
  const simulationAccumulator = useRef(0);
  const workbenchRef = useRef<HTMLElement>(null);
  const assessmentRef = useRef<HTMLElement>(null);

  const scenario = scenarioById[sim.scenarioId];
  const postureChoices = useMemo(() => openingOptionsFor(sim.faction), [sim.faction]);
  const openingBrief = openingBriefs[sim.faction];
  const factionView = useMemo(() => projectFactionView(sim), [sim]);
  const track = sim.tracks.find(item => item.id === sim.selected)!;
  const selectedUnit = selectedUnitId ? sim.units.find(item => item.id === selectedUnitId) : undefined;
  const topHypothesis = [...track.hypotheses].sort((a, b) => b.probability - a.probability)[0];
  const operation = sim.operations.find(item => item.targetId === track.id && !["COMPLETE", "ABORTED"].includes(item.status));
  const latestOperation = sim.operations.find(item => item.targetId === track.id);
  const pipeline = pipelineLoad(sim);
  const gates = nominationGates(sim);
  const operationGates = operation ? releaseGates(sim, operation.id, operation.status === "AUTHORIZED") : [];
  const recommendations = useMemo(() => packageRecommendations(sim, effect, supports, weights), [sim, effect, supports, weights]);
  const sensorCandidates = useMemo(
    () => collectionRecommendations(sim, taskPurpose, sim.selected),
    [sim, taskPurpose]
  );
  const visibleSensors = showAllSensors ? sensorCandidates : sensorCandidates.slice(0, 2);
  const selectedSensorCandidate = sensorCandidates.find(item => item.sensorId === activeSensorId);
  const assessmentCandidates = useMemo(() => {
    const assessmentTrack = sim.tracks.find(item => item.id === sim.selected);
    return collectionRecommendations(sim, "BDA", sim.selected)
      .filter(candidate => !assessmentTrack?.assessment?.sourceGroups.includes(
        sim.sensors.find(sensor => sensor.id === candidate.sensorId)?.correlationKey ?? ""
      ));
  }, [sim]);
  const requestedRecommendation = recommendations.find(item => item.effectorId === selectedEffectorId);
  const selectedRecommendation = requestedRecommendation?.available ? requestedRecommendation : recommendations.find(item => item.available) ?? requestedRecommendation ?? recommendations[0];
  const activeEffectorId = selectedRecommendation?.effectorId ?? selectedEffectorId;
  const activeEffector = sim.effectors.find(item => item.id === activeEffectorId);
  const activeEffectorSource = activeEffector?.sourceUnitId ? sim.units.find(unit => unit.id === activeEffector.sourceUnitId) : undefined;
  const latestEffector = latestOperation ? sim.effectors.find(item => item.id === latestOperation.effectorId) : undefined;
  const latestEffectorSource = latestEffector?.sourceUnitId ? sim.units.find(unit => unit.id === latestEffector.sourceUnitId) : undefined;
  const assessedOutcome = track.assessment && latestOperation
    ? assessmentEffectOutcome(track.assessment, latestOperation.effect)
    : undefined;
  const score = initiativeScore(sim);
  const activeTask = sim.collectionTasks.find(task => task.targetId === track.id && task.status !== "COMPLETE");
  const completedCollectionCount = sim.collectionTasks.filter(task => task.status === "COMPLETE" && task.purpose !== "BDA").length;
  const visiblePanelItems = panelItems.filter(item => {
    if (staffToolsOpen) return true;
    if (["tracks", "collection", "layers"].includes(item.id)) return true;
    if (item.id === "board") return completedCollectionCount > 0;
    if (item.id === "operations") return sim.tracks.some(itemTrack => ["TARGET", "ENGAGE", "ASSESS"].includes(itemTrack.stage));
    return false;
  });
  const loopStep = track.stage === "FIND" || track.stage === "FIX"
    ? "CLARIFY"
    : track.stage === "TRACK"
      ? "DECIDE"
      : track.stage === "TARGET" || track.stage === "ENGAGE"
        ? "COMMIT"
        : "LEARN";

  useEffect(() => {
    if (sim.paused) return;
    let frame = 0;
    let previousTime = performance.now();

    const animate = (time: number) => {
      const elapsedMilliseconds = Math.min(250, Math.max(0, time - previousTime));
      previousTime = time;
      simulationAccumulator.current += elapsedMilliseconds * sim.speed / 1000;

      const wholeMinutes = Math.floor(simulationAccumulator.current);
      if (wholeMinutes > 0) {
        simulationAccumulator.current -= wholeMinutes;
        setSim(current => {
          if (current.paused) return current;
          let next = current;
          for (let minute = 0; minute < wholeMinutes; minute += 1) {
            const previousEventId = next.events[0]?.id;
            next = advance(next, 1);
            const hasDecision = next.events[0]?.id !== previousEventId && shouldAutoPause(next.events[0]?.title);
            if (hasDecision) {
              simulationAccumulator.current = 0;
              return { ...next, paused: true };
            }
          }
          return next;
        });
      }

      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [sim.paused, sim.speed]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const dialog = assessmentOpen ? assessmentRef.current : workbenchOpen ? workbenchRef.current : null;
    if (!dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
      "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
    ));
    focusable[0]?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", trapFocus);
    return () => {
      dialog.removeEventListener("keydown", trapFocus);
      previousFocus?.focus();
    };
  }, [assessmentOpen, workbenchOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
      if (event.key === "Escape") {
        if (assessmentOpen) setAssessmentOpen(false);
        else if (workbenchOpen) setWorkbenchOpen(false);
        else if (panel) setPanel(null);
        else setInspectorOpen(false);
      }
      if (event.key === " ") {
        event.preventDefault();
        setSim(current => ({ ...current, paused: !current.paused }));
      }
      if (event.key.toLowerCase() === "l") setPanel(current => current === "layers" ? null : "layers");
      if (event.key.toLowerCase() === "c") setPanel(current => current === "collection" ? null : "collection");
      if (event.key.toLowerCase() === "p" && track.stage === "TARGET") setWorkbenchOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assessmentOpen, workbenchOpen, panel, track.stage]);

  const selectTrack = (id: string) => {
    setSim(current => ({ ...current, selected: id }));
    setSelectedUnitId(undefined);
    setInspectorOpen(true);
    setInspectorTab("overview");
  };

  const selectUnit = (id: string) => {
    setSelectedUnitId(id);
    setInspectorOpen(true);
    setInspectorTab("overview");
  };

  const act = (fn: (state: Sim) => Sim, fallback = "No state change") => {
    setSim(current => {
      const next = fn(current);
      setNotice(next.events[0]?.id !== current.events[0]?.id ? next.events[0].title : fallback);
      return next;
    });
  };

  const openCollection = (purpose: TaskPurpose = "IDENTIFY") => {
    setTaskPurpose(purpose);
    const recommended = collectionRecommendations(sim, purpose, track.id).find(item => item.available);
    if (recommended) setActiveSensorId(recommended.sensorId);
    setShowAllSensors(false);
    setPanel("collection");
    setWorkbenchOpen(false);
    setAssessmentOpen(false);
  };

  const openAssessment = () => {
    const recommended = assessmentCandidates.find(item => item.available);
    if (recommended) setActiveSensorId(recommended.sensorId);
    setAssessmentOpen(true);
    setWorkbenchOpen(false);
    setPanel(null);
  };

  const primaryAction = () => {
    if (activeTask) return {
      label: sim.paused ? "Resume collection" : "Follow collection",
      detail: `${sim.sensors.find(sensor => sensor.id === activeTask.sensorId)?.name} is ${activeTask.status.toLowerCase()}. Intelligence is expected at ${formatTime(activeTask.availableAt)}.`,
      action: () => {
        setTimelineExpanded(true);
        if (sim.paused) setSim(current => ({ ...current, paused: false }));
      }
    };
    if (track.stage === "FIND" || track.stage === "FIX") {
      const purpose: TaskPurpose = topHypothesis.probability >= 58 ? "CUSTODY" : "IDENTIFY";
      return purpose === "CUSTODY"
        ? { label: "Maintain custody", detail: "Identity is plausible, but the location or track is becoming stale.", action: () => openCollection("CUSTODY") }
        : { label: "Get better intelligence", detail: "Reduce uncertainty before choosing an operational response.", action: () => openCollection("IDENTIFY") };
    }
    if (track.stage === "TRACK") return { label: "Nominate target", detail: "All minimum target development gates are currently satisfied.", action: () => act(nominateTarget) };
    if (track.stage === "TARGET") return { label: operation ? "Review package" : "Develop effects package", detail: operation ? `Package is ${operation.status.toLowerCase()}.` : "Choose a desired effect, constraints, and compatible resources.", action: () => setWorkbenchOpen(true) };
    if (track.stage === "ENGAGE") return { label: "Open release workflow", detail: operation ? `Package is ${operation.status.toLowerCase()}.` : "Review release gates and timing.", action: () => setWorkbenchOpen(true) };
    if (track.assessment) return { label: track.assessment.provisional ? "Verify assessment" : "Review assessment", detail: track.assessment.conclusion, action: openAssessment };
    return { label: "Task combat assessment", detail: "Effects occurred, but physical and functional outcomes remain unknown.", action: openAssessment };
  };
  const nextAction = primaryAction();

  const taskSensor = () => {
    act(state => {
      const tasked = taskCollection(state, activeSensorId, taskPurpose);
      return tasked.collectionTasks[0]?.id !== state.collectionTasks[0]?.id ? { ...tasked, paused: false } : tasked;
    });
    setTimelineExpanded(true);
    setPanel(null);
  };

  const setDoctrinePreset = (name: string) => {
    setPreset(name);
    setWeights(doctrinePresets[name]);
  };

  const compose = () => act(state => composePackage(state, activeEffectorId, effect, supports, weights));
  const authorize = () => act(authorizePackage);
  const execute = () => {
    act(state => {
      const executed = executePackage(state);
      return executed.operations.find(item => item.targetId === state.selected)?.status === "EXECUTING" ? { ...executed, paused: false } : executed;
    });
    setTimelineExpanded(true);
    setWorkbenchOpen(false);
  };

  const selectBlockadePosture = (posture: BlockadePosture) => {
    act(state => {
      const next = chooseBlockadePosture(state, posture);
      return next === state ? state : { ...next, paused: false };
    }, `${postureChoices.find(choice => choice.id === posture)?.label ?? posture} selected`);
    setTimelineExpanded(true);
  };

  const changeFaction = (faction: Faction) => {
    simulationAccumulator.current = 0;
    setSelectedUnitId(undefined);
    setInspectorOpen(false);
    setPanel(null);
    setWorkbenchOpen(false);
    setAssessmentOpen(false);
    setSim(createSim("taiwan", faction, sim.seed));
  };

  const activePanelLabel = panelItems.find(item => item.id === panel)?.label;
  const loopSteps = ["NOTICE", "CLARIFY", "DECIDE", "COMMIT", "LEARN"];
  const loopStepIndex = loopSteps.indexOf(loopStep);

  return (
    <main className={`applicationShell${timelineExpanded ? " timelineExpanded" : ""}${inspectorOpen || workbenchOpen || assessmentOpen ? " panelOpen" : ""}${workbenchOpen || assessmentOpen ? " widePanelOpen" : ""}`}>
      <Map
        sim={factionView}
        layers={layers}
        activeSensorId={panel === "collection" ? activeSensorId : undefined}
        planningEffectorId={workbenchOpen ? activeEffectorId : undefined}
        selectedUnitId={selectedUnitId}
        rightPanelOpen={inspectorOpen || workbenchOpen || assessmentOpen}
        timelineExpanded={timelineExpanded}
        onSelectTrack={selectTrack}
        onSelectUnit={selectUnit}
      />

      <header className="commandBar">
        <button className="brandButton" onClick={() => setPanel("brief")} aria-label="Open mission brief">
          <span>KC</span>
          <div><b>KILLCHAIN</b><small>Decision advantage simulator</small></div>
        </button>
        <div className="theaterIdentity">
          <span className="mono">{scenario.code}</span>
          <div><b>{scenario.name}</b><small>{sim.factionName}</small></div>
          <span className={`phasePill ${sim.phase.toLowerCase().replace(" ", "")}`}>{sim.phase}</span>
        </div>
        <div className="commandObjective"><span>Commander intent</span><p>{scenario.objective[sim.faction]}</p></div>
        <button className="initiative" onClick={() => setPanel("influence")}>
          <span>Decision advantage</span><strong className="mono">{score}</strong><small>{score >= 68 ? "Favorable" : score >= 48 ? "Contested" : "Adverse"}</small>
        </button>
        <button className="alertButton" onClick={() => setPanel("audit")} aria-label="Open alerts">
          <span>{sim.events.filter(event => event.severity === "CRITICAL").length}</span>
          <b>Alerts</b>
        </button>
      </header>

      <nav className="toolRail" aria-label="Primary tools">
        {visiblePanelItems.map(item => (
          <button
            key={item.id}
            className={panel === item.id ? "active" : ""}
            onClick={() => setPanel(current => current === item.id ? null : item.id)}
            aria-label={item.label}
            aria-pressed={panel === item.id}
          >
            <span aria-hidden="true"><RailIcon name={item.icon} /></span>
            <b>{item.label}</b>
            {item.shortcut && <kbd>{item.shortcut}</kbd>}
          </button>
        ))}
        <button className={staffToolsOpen ? "active staffTool" : "staffTool"} onClick={() => setStaffToolsOpen(current => !current)} aria-label={staffToolsOpen ? "Hide staff tools" : "Show staff tools"}>
          <span aria-hidden="true"><RailIcon name="staff" /></span>
          <b>{staffToolsOpen ? "Fewer tools" : "Staff tools"}</b>
        </button>
        <button className="helpTool" onClick={() => setPanel("brief")} aria-label="Mission help"><span aria-hidden="true"><RailIcon name="help" /></span><b>Mission help</b></button>
      </nav>

      {!sim.blockadePosture ? (
        <section className="openingDecision" aria-label="Choose opening blockade posture">
          <header>
            <div>
              <h2>{openingBrief.title}</h2>
              <p>{openingBrief.detail}</p>
            </div>
          </header>
          <div className="decisionChoices">
            {postureChoices.map((choice, index) => (
              <button key={choice.id} className={`decisionChoice ${index === 0 ? "primary" : ""}`} onClick={() => selectBlockadePosture(choice.id)}>
                <b>{choice.label}</b>
                <span>{choice.detail}</span>
              </button>
            ))}
          </div>
          <div className="decisionProgress" aria-label="Decision loop step 3 of 5">
            {loopSteps.map((step, index) => <span key={step} className={index < 2 ? "complete" : index === 2 ? "active" : ""} title={step} />)}
          </div>
        </section>
      ) : (
        <section className="decisionBanner" aria-label="Current decision">
          <span className="decisionSymbol" aria-hidden="true">!</span>
          <div>
            <small>{selectedUnit
              ? `${selectedUnit.domain} UNIT · ${selectedUnit.commandMode === "DIRECT" ? "DIRECT TASKING" : "FORMATION INTENT"}`
              : sim.openingMission && sim.openingMission.status !== "COMPLETE"
              ? `${sim.openingMission.label} · ${sim.openingMission.status.toLowerCase()} · ETA ${formatTime(sim.openingMission.resolvesAt)}`
              : `${loopStep} · PRIORITY DECISION`}</small>
            <b>{selectedUnit ? `${selectedUnit.callsign}: ${selectedUnit.mission}` : `${track.callsign}: ${nextAction.label}`}</b>
            <p>{selectedUnit
              ? `${selectedUnit.movement.toLowerCase()} at ${Math.round(selectedUnit.speedKnots)} knots with ${Math.round(selectedUnit.fuel)} percent fuel.`
              : nextAction.detail}</p>
            {!selectedUnit && <div className="decisionProgress" aria-label={`Decision loop step ${loopStepIndex + 1} of 5`}>
              {loopSteps.map((step, index) => <span key={step} className={index < loopStepIndex ? "complete" : index === loopStepIndex ? "active" : ""} title={step} />)}
            </div>}
          </div>
          {!selectedUnit && <button onClick={nextAction.action}>{nextAction.label}</button>}
        </section>
      )}

      {panel && (
        <aside className={`leftDrawer ${panel === "board" ? "boardDrawer" : ""}`} aria-label={activePanelLabel ?? "Mission brief"}>
          {panel === "brief" && (
            <>
              <PanelHeader title={scenario.name} eyebrow="Mission brief" onClose={() => setPanel(null)} />
              <div className="briefContent">
                <div className="briefStatus"><span className="mono">{scenario.startDateLabel ?? "JUL 2026"} · {formatTime(sim.minute)}</span><b>{sim.phase}</b></div>
                <p className="briefLead">{scenario.synopsis}</p>
                <section><h3>Command perspective</h3><select value={sim.faction} onChange={event => changeFaction(event.target.value as Faction)}>{factions.map(faction => <option key={faction.id} value={faction.id}>{faction.label}</option>)}</select></section>
                <section><h3>Your objective</h3><p>{scenario.objective[sim.faction]}</p></section>
                {scenario.historicalBasis && <section><h3>Historical baseline</h3><p>{scenario.historicalBasis}</p></section>}
                {scenario.divergence && <section className="doctrineNote"><h3>July 2026 divergence</h3><p>{scenario.divergence}</p></section>}
                {!!scenario.baseline?.length && (
                  <section>
                    <h3>Justice Mission 2025 scale</h3>
                    <div className="baselineGrid">
                      {scenario.baseline.map(item => <article key={item.label}><span>{item.label}</span><b className="mono">{item.value}</b><p>{item.detail}</p></article>)}
                    </div>
                  </section>
                )}
                {!!scenario.forcePicture?.length && (
                  <section>
                    <h3>Evidence disciplined force picture</h3>
                    <div className="forcePicture">
                      {scenario.forcePicture.map(item => (
                        <article key={`${item.branch}-${item.measure}`}>
                          <div><span>{item.branch}</span><small>{item.confidence}</small></div>
                          <b className="mono">{item.value}</b>
                          <em>{item.measure.toLowerCase()}</em>
                          <p>{item.detail}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
                {!!scenario.identifiedAssets?.length && (
                  <details className="assetLedger">
                    <summary>Open identified hull ledger · {scenario.identifiedAssets.length} entries</summary>
                    <div>
                      {scenario.identifiedAssets.map(asset => (
                        <article key={asset.id}>
                          <span>{asset.branch}</span>
                          <b>{asset.name}</b>
                          <small>{asset.designation} · {asset.status.toLowerCase()}</small>
                          <p>{asset.detail}</p>
                        </article>
                      ))}
                    </div>
                  </details>
                )}
                <section className="doctrineNote"><h3>Simulation doctrine</h3><p>You command through delayed and imperfect reports. Correlated sources can reinforce a false hypothesis. Custody, authorization, and packages can regress. Tactical success can still create strategic failure.</p></section>
                <section><h3>Victory is not a kill count</h3><div className="objectiveGrid"><span>Shipping <b className="mono">{Math.round(sim.shippingThroughput)}%</b></span><span>Civil access <b className="mono">{Math.round(sim.civilianAccess)}%</b></span><span>Continuity <b className="mono">{Math.round(sim.continuity)}%</b></span><span>Coalition <b className="mono">{Math.round(sim.coalition)}%</b></span><span>Escalation <b className="mono">{Math.round(sim.escalation)}%</b></span></div></section>
                <button className="primaryButton" onClick={() => setPanel(null)}>Return to operational map</button>
              </div>
            </>
          )}

          {panel === "tracks" && <><PanelHeader title="Track picture" eyebrow={`${sim.tracks.length} active hypotheses`} onClose={() => setPanel(null)} /><TrackList sim={sim} onSelect={selectTrack} /></>}

          {panel === "collection" && (
            <>
              <PanelHeader title="Collection planner" eyebrow={`Intelligence question · ${track.callsign}`} onClose={() => setPanel(null)} />
              <div className="drawerBody collectionPlanner">
                <section className="questionCard">
                  <span>Question to answer</span>
                  <h3>{taskPurpose === "BDA" ? "What functions remain after the effects window?" : taskPurpose === "CUSTODY" ? `Where is ${track.callsign} now, and can we keep an actionable track?` : `Is ${track.callsign} a real operational formation, a decoy, or protected civilian activity?`}</h3>
                </section>
                <section>
                  <div className="sectionHeading"><h3>Choose how to clarify</h3><span>Best options first</span></div>
                  <div className="sensorList">
                    {visibleSensors.map((candidate, index) => {
                      const sensor = sim.sensors.find(item => item.id === candidate.sensorId)!;
                      return (
                        <button key={sensor.id} disabled={!candidate.ready} className={activeSensorId === sensor.id ? "active" : ""} onClick={() => setActiveSensorId(sensor.id)}>
                          <div className="sensorTitle"><span>{index === 0 && candidate.available ? "Recommended" : candidate.independent ? "Independent source" : "Correlated source"}</span><b>{sensor.name}</b><small>{sensor.modality}</small></div>
                          <div className="sensorFacts">
                            <span><b className="mono">+{candidate.expectedConfidence}</b> expected confidence</span>
                            <span><b className="mono">{candidate.ready ? formatTime(candidate.deliveryAt) : `T+${sensor.readyAt - sim.minute}`}</b> intelligence ready</span>
                            <span><b className="mono">{sensor.bandwidthCost}</b> bandwidth cost</span>
                            <span><b className="mono">{sensor.falseAlarm}%</b> false alarm rate</span>
                          </div>
                          <p className="sensorReason">{candidate.reason}</p>
                        </button>
                      );
                    })}
                  </div>
                  <button className="disclosureButton" onClick={() => setShowAllSensors(current => !current)}>{showAllSensors ? "Show recommended options only" : "Compare every sensor and data constraint"}</button>
                </section>
                {showAllSensors && <section className="staffDetailSection">
                  <div className="sectionHeading"><h3>Decision engine capacity</h3><span className={pipeline.choke ? "warningText" : ""}>{pipeline.choke ? "Congested" : `${pipeline.active} active tasks`}</span></div>
                  <div className="pipelineGrid">
                    <Metric label="Ingestion" value={pipeline.ingest} suffix="%" tone={pipeline.ingest > 80 ? "warning" : "normal"} />
                    <Metric label="Processing" value={pipeline.processing} suffix="%" tone={pipeline.processing > 80 ? "warning" : "normal"} />
                    <Metric label="Analyst load" value={pipeline.analyst} suffix="%" tone={pipeline.analyst > 80 ? "warning" : "normal"} />
                  </div>
                  <p className="sectionHelp">AAME accreditation, source correlation, bandwidth, compute, storage, and analyst capacity all affect delivery and reliability.</p>
                </section>}
                {sim.collectionTasks.length > 0 && <section><div className="sectionHeading"><h3>Task queue</h3><span>{sim.collectionTasks.filter(task => task.status !== "COMPLETE").length} active</span></div><div className="taskQueue">{sim.collectionTasks.slice(0, 6).map(task => <div key={task.id}><StatusIcon passed={task.status === "COMPLETE"} /><span><b>{sim.sensors.find(sensor => sensor.id === task.sensorId)?.name}</b><small>{task.status} · intelligence at <span className="mono">{formatTime(task.availableAt)}</span></small></span>{task.status !== "COMPLETE" && <button className="textButton" onClick={() => act(state => cancelCollectionTask(state, task.id))}>Cancel</button>}</div>)}</div></section>}
              </div>
              <footer className="drawerFooter">
                <div><span>Expected delivery</span><b className="mono">{selectedSensorCandidate ? formatTime(selectedSensorCandidate.deliveryAt) : "No valid option"}</b></div>
                <button className="primaryButton" disabled={!selectedSensorCandidate?.available} title={selectedSensorCandidate?.available ? "" : selectedSensorCandidate?.reason} onClick={taskSensor}>Task selected sensor</button>
              </footer>
            </>
          )}

          {panel === "board" && (
            <>
              <PanelHeader title="Target development board" eyebrow="Human controlled workflow" onClose={() => setPanel(null)} />
              <div className="targetBoard">
                {[
                  { label: "Discovered", stages: ["FIND", "FIX"] },
                  { label: "Tracked", stages: ["TRACK"] },
                  { label: "Nominated", stages: ["TARGET"] },
                  { label: "In execution", stages: ["ENGAGE"] },
                  { label: "Assessment", stages: ["ASSESS"] }
                ].map(column => (
                  <section key={column.label}>
                    <header><b>{column.label}</b><span>{sim.tracks.filter(item => column.stages.includes(item.stage)).length}</span></header>
                    {sim.tracks.filter(item => column.stages.includes(item.stage)).map(item => {
                      const hypothesis = [...item.hypotheses].sort((a, b) => b.probability - a.probability)[0];
                      return <button key={item.id} onClick={() => { selectTrack(item.id); setPanel(null); }}><span className="mono">{item.callsign}</span><b>{hypothesis.label}</b><small>{hypothesis.probability}% confidence · {item.status}</small></button>;
                    })}
                  </section>
                ))}
              </div>
            </>
          )}

          {panel === "operations" && (
            <>
              <PanelHeader title="Operations" eyebrow={`${sim.operations.length} packages recorded`} onClose={() => setPanel(null)} />
              <div className="drawerBody">
                {sim.operations.length === 0 ? <div className="emptyState"><span>◇</span><h3>No effects packages</h3><p>Develop a target through collection and nomination before creating an effects package.</p></div> : sim.operations.map(item => {
                  const effector = sim.effectors.find(candidate => candidate.id === item.effectorId);
                  const source = effector?.sourceUnitId ? sim.units.find(unit => unit.id === effector.sourceUnitId) : undefined;
                  return <article className="operationCard" key={item.id}><span>{item.status}</span><h3>{sim.tracks.find(target => target.id === item.targetId)?.callsign}</h3><p>{item.effect} via {effector?.platform ?? item.effectorId}</p>{effector && <dl><div><dt>{effector.employmentLabel}</dt><dd>{effector.employmentSystem}</dd></div><div><dt>Payload</dt><dd>{effector.payload}</dd></div><div><dt>Origin</dt><dd>{source?.callsign ?? effector.base}</dd></div></dl>}<div><b>{item.estimate.effect}% estimated effect</b><b>{item.estimate.collateral}% collateral</b></div>{item.abortReason && <small>{item.abortReason}</small>}</article>;
                })}
              </div>
            </>
          )}

          {panel === "resources" && (
            <>
              <PanelHeader title="Force and data resources" eyebrow="Capacity with operational consequence" onClose={() => setPanel(null)} />
              <div className="drawerBody">
                <section><h3>Decision engine</h3><div className="resourceStack"><Metric label="Bandwidth" value={sim.bandwidth} /><Metric label="Compute" value={sim.compute} /><Metric label="Analyst attention" value={sim.analystAttention} /><Metric label="Storage" value={sim.storage} /></div></section>
                <section><h3>Force generation</h3><div className="resourceStack"><Metric label="Logistics" value={sim.logistics} /><Metric label="Readiness" value={sim.readiness} /></div></section>
                <section><h3>Effectors</h3><div className="resourceCards">{sim.effectors.map(effector => {
                  const source = effector.sourceUnitId ? sim.units.find(unit => unit.id === effector.sourceUnitId) : undefined;
                  return <article key={effector.id}><span>{effector.platform}</span><h3>{effector.name}</h3><p>{effector.employmentSystem}</p><small>{effector.payload}</small><small>Origin: {source?.callsign ?? effector.base}</small><div><b className="mono">{effector.stock}</b><small>{effector.stockLabel}</small><b className="mono">{Math.round(effector.readiness)}%</b><small>readiness</small><b className="mono">{Math.round(effector.fuel)}%</b><small>fuel</small></div></article>;
                })}</div></section>
                <section><h3>Command path</h3><div className="commandPath">{sim.commandLinks.map(link => <div key={link.id}><StatusIcon passed={link.active && link.integrity >= 42} /><span><b>{link.from} → {link.to}</b><small>{Math.round(link.integrity)}% integrity · {link.capacity} capacity · {link.latency} minute latency</small></span></div>)}</div></section>
              </div>
            </>
          )}

          {panel === "influence" && (
            <>
              <PanelHeader title="Strategic effects" eyebrow="Second and third order consequences" onClose={() => setPanel(null)} />
              <div className="drawerBody">
                <section className="scoreCard"><span>Decision advantage</span><strong className="mono">{score}</strong><p>Weighted by civilian throughput, continuity, readiness, coalition cohesion, information position, escalation control, and adversary tempo.</p></section>
                <section><div className="resourceStack"><Metric label="Shipping throughput" value={sim.shippingThroughput} tone={sim.shippingThroughput < 45 ? "warning" : "good"} /><Metric label="Command continuity" value={sim.continuity} /><Metric label="Coalition cohesion" value={sim.coalition} /><Metric label="Political capital" value={sim.political} /><Metric label="Information position" value={sim.information} /><Metric label="Escalation pressure" value={sim.escalation} tone={sim.escalation > 60 ? "warning" : "normal"} /><Metric label="Adversary tempo" value={sim.adversaryTempo} tone={sim.adversaryTempo > 70 ? "warning" : "normal"} /></div></section>
                <section><div className="sectionHeading"><h3>Command decisions</h3><span>{sim.decisionPoints} points</span></div><div className="decisionActions">{([
                  ["SILENT WATCH", "Lower exposure", "Custody and information degrade."],
                  ["ISR SURGE", "Accelerate collection", "Consumes logistics and reveals collection posture."],
                  ["FORCE DISPERSAL", "Improve survivability", "Command latency and sustainment burden rise."],
                  ["CRISIS CHANNEL", "Control escalation", "Consumes political capital and gives the adversary time."]
                ] as Array<[DoctrineAction, string, string]>).map(([name, benefit, cost]) => <button key={name} onClick={() => act(state => doctrineAction(state, name))}><b>{name}</b><span>{benefit}</span><small>{cost}</small></button>)}</div></section>
              </div>
            </>
          )}

          {panel === "audit" && <><PanelHeader title="Decision and event log" eyebrow={`Observed events · scenario seed ${sim.seed}`} onClose={() => setPanel(null)} /><EventList sim={sim} /></>}

          {panel === "layers" && (
            <>
              <PanelHeader title="Map layers" eyebrow="Show only information needed now" onClose={() => setPanel(null)} />
              <div className="drawerBody layerControls">
                {([
                  ["intelligence", "Intelligence tracks", "Hypotheses, uncertainty, and custody"],
                  ["units", "Operational units", "Friendly, allied, and civilian forces"],
                  ["space", "Space domain", "Satellites, orbits, and sensing coverage"],
                  ["threat", "Assessed threat zones", "Uncertain denial and sensing envelopes"],
                  ["shipping", "Civilian shipping", "Commercial routes and access"],
                  ["command", "Routes and history", "Selected movement plans and recent entity paths"]
                ] as Array<[keyof LayerState, string, string]>).map(([key, label, description]) => <label key={key}><input type="checkbox" checked={layers[key]} onChange={() => setLayers(current => ({ ...current, [key]: !current[key] }))} /><span><b>{label}</b><small>{description}</small></span></label>)}
              </div>
            </>
          )}
        </aside>
      )}

      {inspectorOpen && !workbenchOpen && selectedUnit && (
        <aside className="unitInspector" aria-label={`Selected unit ${selectedUnit.callsign}`}>
          <header className="inspectorHeader">
            <div><span>{selectedUnit.domain} · {selectedUnit.echelon}</span><h2>{selectedUnit.callsign}</h2><p>{selectedUnit.owner}</p></div>
            <button onClick={() => setInspectorOpen(false)} aria-label="Close unit inspector">×</button>
          </header>
          <div className="inspectorBody">
            <section className="nextDecision">
              <span>Current mission</span>
              <h3>{selectedUnit.mission}</h3>
              <p>{selectedUnit.movement.toLowerCase().replaceAll("_", " ")} from {selectedUnit.base}.</p>
            </section>
            <section>
              <h3>Operational state</h3>
              <div className="unitFacts">
                <div><span>Speed</span><b className="mono">{Math.round(selectedUnit.speedKnots)} kt</b></div>
                <div><span>Heading</span><b className="mono">{Math.round(selectedUnit.heading).toString().padStart(3, "0")}°</b></div>
                <div><span>Readiness</span><b className="mono">{Math.round(selectedUnit.readiness)}%</b></div>
                <div><span>Fuel</span><b className="mono">{Math.round(selectedUnit.fuel)}%</b></div>
                <div><span>Base</span><b>{selectedUnit.base}</b></div>
                <div><span>Command mode</span><b>{selectedUnit.commandMode === "FORMATION" ? "Formation intent" : "Direct tasking"}</b></div>
              </div>
            </section>
            <section>
              <h3>Command relationship</h3>
              <p>{selectedUnit.formationId ? `Assigned to ${sim.units.find(item => item.id === selectedUnit.formationId)?.callsign ?? selectedUnit.formationId}.` : "Operating as an independent formation."}</p>
              <p>Affiliation: {selectedUnit.affiliation.toLowerCase()} · endurance: {Math.round(selectedUnit.enduranceMinutes)} minutes.</p>
              {selectedUnit.formationId && selectedUnit.affiliation !== "CIVILIAN" && selectedUnit.affiliation !== "NEUTRAL" && (
                <button
                  className={selectedUnit.commandMode === "DIRECT" ? "secondaryButton" : "primaryButton"}
                  onClick={() => act(state => setUnitCommandMode(state, selectedUnit.id, selectedUnit.commandMode === "DIRECT" ? "FORMATION" : "DIRECT"))}
                >
                  {selectedUnit.commandMode === "DIRECT" ? "Return to formation control" : "Assume direct control"}
                </button>
              )}
            </section>
            {selectedUnit.commandMode === "DIRECT" && <div className="unitCommandNotice">Direct tasking is temporarily overriding inherited formation intent. The parent formation continues executing around this unit.</div>}
          </div>
        </aside>
      )}

      {inspectorOpen && !workbenchOpen && !selectedUnit && (
        <aside className="targetInspector" aria-label={`Selected track ${track.callsign}`}>
          <header className="inspectorHeader">
            <div><span>{track.stage} · {track.status}</span><h2>{track.callsign}</h2><p>{track.publicLabel}</p></div>
            <button onClick={() => setInspectorOpen(false)} aria-label="Close target inspector">×</button>
          </header>
          <nav className="inspectorTabs" aria-label="Target details">
            {(["overview", "evidence", "chain"] as InspectorTab[]).map(tab => <button key={tab} className={inspectorTab === tab ? "active" : ""} onClick={() => setInspectorTab(tab)}>{tab}</button>)}
          </nav>
          <div className="inspectorBody">
            {inspectorTab === "overview" && (
              <>
                <section className="nextDecision">
                  <span>Recommended next decision</span>
                  <h3>{nextAction.label}</h3>
                  <p>{nextAction.detail}</p>
                  <button className="primaryButton" onClick={nextAction.action}>{nextAction.label}</button>
                </section>
                <section>
                  <div className="hypothesisHeader"><div><span>Leading hypothesis</span><h3>{topHypothesis.label}</h3></div><strong className="mono">{topHypothesis.probability}%</strong></div>
                  <div className="confidenceBar"><i style={{ width: `${topHypothesis.probability}%` }} /></div>
                  <div className="criticalMetrics">
                    <div><span>Track quality</span><b className="mono">{Math.round(track.quality)}</b></div>
                    <div><span>Uncertainty</span><b className="mono">±{Math.round(track.uncertainty)} NM</b></div>
                    <div><span>Freshness</span><b className="mono">{Math.round(track.freshness)}%</b></div>
                    <div><span>Evidence</span><b className="mono">{track.evidence.length}</b></div>
                  </div>
                </section>
                <section><h3>Competing hypotheses</h3><div className="hypothesisList">{track.hypotheses.map(hypothesis => <div key={hypothesis.label}><span>{hypothesis.label}</span><b className="mono">{hypothesis.probability}%</b><i><em style={{ width: `${hypothesis.probability}%` }} /></i></div>)}</div></section>
                <section className="riskNotice"><span>Observed countermeasures</span>{track.observedCountermeasures.map(item => <p key={item}>{item}</p>)}</section>
                <section><h3>Nomination gates</h3><div className="gateList">{gates.map(gate => <div key={gate.label}><StatusIcon passed={gate.passed} /><span><b>{gate.label}</b><small>{gate.detail}</small></span></div>)}</div></section>
              </>
            )}
            {inspectorTab === "evidence" && (
              <section>
                <div className="sectionHeading"><h3>Evidence provenance</h3><span>{track.evidence.length} delivered</span></div>
                <div className="evidenceList">
                  {track.evidence.map(id => sim.observations.find(observation => observation.id === id)).filter(Boolean).map(observation => <article key={observation!.id}><header><span>{observation!.source}</span><b className="mono">{observation!.reliability}% reliable</b></header><h3>Supports {observation!.supports}</h3>{observation!.features.map(feature => <p key={feature}>{feature}</p>)}<small>Collected <span className="mono">{formatTime(observation!.collectedAt)}</span> · correlation group {observation!.correlationKey}</small></article>)}
                </div>
              </section>
            )}
            {inspectorTab === "chain" && (
              <section>
                <h3>Find, Fix, Track, Target, Engage, Assess</h3>
                <div className="chainSteps">
                  {(["FIND", "FIX", "TRACK", "TARGET", "ENGAGE", "ASSESS"] as const).map((stage, index) => {
                    const currentIndex = ["FIND", "FIX", "TRACK", "TARGET", "ENGAGE", "ASSESS"].indexOf(track.stage);
                    const complete = index < currentIndex || (index === currentIndex && track.status === "CLOSED");
                    return <div key={stage} className={stage === track.stage ? "current" : complete ? "complete" : ""}><span>{complete ? "✓" : String(index + 1).padStart(2, "0")}</span><div><b>{stage}</b><p>{["Discover a relevant object or anomaly.", "Localize and discriminate competing identities.", "Maintain current custody with independent evidence.", "Nominate and define the desired operational effect.", "Pair resources, authorize, and execute through a valid command path.", "Collect evidence and estimate physical, functional, and collateral outcomes."][index]}</p></div></div>;
                  })}
                </div>
                {operation && <article className="operationSummary"><span>Current package</span><h3>{operation.effect} · {operation.status}</h3><p>{sim.effectors.find(effector => effector.id === operation.effectorId)?.name}</p>{operation.authority && <small>Authority expires <span className="mono">{formatTime(operation.authority.expiresAt)}</span></small>}</article>}
              </section>
            )}
          </div>
        </aside>
      )}

      {workbenchOpen && (
        <aside ref={workbenchRef} className="workbench" role="dialog" aria-modal="true" aria-label={`Effects workbench for ${track.callsign}`}>
          <PanelHeader title="Effects workbench" eyebrow={`${track.callsign} · Human authorization required`} onClose={() => setWorkbenchOpen(false)} />
          <div className="workbenchSteps">
            {["Define effect", "Pair resources", "Authorize", "Execute"].map((label, index) => {
              const complete = !!operation && (index < 2 || index === 2 && ["AUTHORIZED", "EXECUTING", "ASSESSMENT"].includes(operation.status) || index === 3 && ["EXECUTING", "ASSESSMENT"].includes(operation.status));
              const active = !operation ? index <= 1 : operation.status === "PLANNED" ? index === 2 : operation.status === "AUTHORIZED" ? index === 3 : false;
              return <div key={label} className={complete ? "complete" : active ? "active" : ""}><span>{complete ? "✓" : index + 1}</span><b>{label}</b></div>;
            })}
          </div>
          <div className="workbenchBody">
            {!operation && (
              <>
                <section><h3>1. Choose the desired effect</h3><p className="sectionHelp">Start with the mission outcome, not a weapon.</p><div className="effectChoices">{(Object.keys(effectCopy) as DesiredEffect[]).map(item => <button key={item} className={effect === item ? "active" : ""} onClick={() => setEffect(item)}><b>{effectCopy[item].label}</b><span>{effectCopy[item].description}</span></button>)}</div></section>
                <section className="advancedPlanningToggle"><div><h3>Need more control?</h3><p className="sectionHelp">The balanced recommendation already accounts for timing, risk, collateral, inventory, and escalation.</p></div><button className="textButton" onClick={() => setAdvancedPlanning(current => !current)}>{advancedPlanning ? "Use guided planning" : "Open advanced planning"}</button></section>
                {advancedPlanning && <section className="advancedPlanning">
                  <div className="sectionHeading"><div><h3>Recommendation priorities</h3><p className="sectionHelp">Choose a doctrine or tune the scoring model.</p></div><button className="textButton" onClick={() => setAdvancedWeights(!advancedWeights)}>{advancedWeights ? "Hide weights" : "Adjust weights"}</button></div>
                  <div className="presetChoices">{Object.keys(doctrinePresets).map(name => <button key={name} className={preset === name ? "active" : ""} onClick={() => setDoctrinePreset(name)}>{name}</button>)}</div>
                  {advancedWeights && <div className="weightControls">{(Object.keys(weights) as Array<keyof PackageWeights>).map(key => <label key={key}><span>{key.replace(/([A-Z])/g, " $1")} <b className="mono">{weights[key]}</b></span><input type="range" min="0" max="50" value={weights[key]} onChange={event => { setPreset("Custom"); setWeights(current => ({ ...current, [key]: Number(event.target.value) })); }} /></label>)}</div>}
                  <h3>Supporting effects</h3>
                  <div className="supportChoices">{supportOptions.map(option => <label key={option}><input type="checkbox" checked={supports.includes(option)} onChange={() => setSupports(current => current.includes(option) ? current.filter(item => item !== option) : [...current, option])} /><span><b>{option}</b><small>{option === "PRECISION ISR" ? "Improves custody and lowers collateral uncertainty." : option === "ELECTRONIC ATTACK" ? "Reduces defensive effectiveness while increasing signature." : option === "CYBER ISOLATION" ? "Disrupts command relationships but risks burning access." : "Extends reach while reserving a scarce support asset."}</small></span></label>)}</div>
                </section>}
                <section><div className="sectionHeading"><div><h3>2. Compare operational options</h3><p className="sectionHelp">Each recommendation states its result, cost, risk, and assumptions.</p></div><span>{preset}</span></div><div className="recommendationList">{recommendations.slice(0, advancedPlanning ? recommendations.length : 3).map((recommendation, index) => {
                  const effector = sim.effectors.find(item => item.id === recommendation.effectorId)!;
                  const source = effector.sourceUnitId ? sim.units.find(unit => unit.id === effector.sourceUnitId) : undefined;
                  const origin = effectorOrigin(sim, effector);
                  return <button key={recommendation.effectorId} className={`${activeEffectorId === recommendation.effectorId ? "active " : ""}${recommendation.available ? "available" : "blocked"}`} onClick={() => setSelectedEffectorId(recommendation.effectorId)}>
                    <div className="recommendationRank"><span>{index === 0 && recommendation.available ? "Recommended" : recommendation.available ? `Option ${index + 1}` : "Unavailable"}</span><strong><small>Fit score</small><b className="mono">{recommendation.score}</b><em>of 100</em></strong></div>
                    <div className="deliveryIdentity"><div><small>Delivery platform</small><h3>{effector.name}</h3><p>{effector.platform}</p></div><span className={recommendation.available ? "available" : "blocked"}>{recommendation.available ? "AVAILABLE" : "BLOCKED"}</span></div>
                    <div className="deliveryChain">
                      <span><small>{effector.employmentLabel}</small><b>{effector.employmentSystem}</b></span>
                      <span><small>Payload or effect</small><b>{effector.payload}</b></span>
                      <span><small>Current origin</small><b>{source?.callsign ?? effector.base}</b><em className="mono">{origin[1].toFixed(2)}°, {origin[0].toFixed(2)}°</em></span>
                      <span><small>Inventory committed</small><b>{effector.expenditure} {effector.stockLabel}</b><em>{effector.stock} available before release</em></span>
                    </div>
                    <p className="missionProfile">{effector.missionProfile}</p>
                    <div className="recommendationMetrics"><span><b className="mono">{recommendation.effect}%</b> modeled effect</span><span><b className="mono">{recommendation.timeToTarget} min</b> to target</span><span><b className="mono">{recommendation.collateral}%</b> collateral risk</span><span><b className="mono">{recommendation.platformRisk}%</b> platform risk</span></div>
                    <div className="packageChecks">{recommendation.checks.map(check => <small className={check.passed ? "passed" : "failed"} key={check.label}>{check.label}</small>)}</div>
                  </button>;
                })}</div></section>
              </>
            )}

            {operation && (
              <>
                <section className="packageSummary">
                  <span>{operation.status}</span><h3>{operation.effect} via {sim.effectors.find(item => item.id === operation.effectorId)?.name}</h3>
                  {latestEffector && <div className="packageManifest"><span><small>Delivery platform</small><b>{latestEffector.platform}</b></span><span><small>{latestEffector.employmentLabel}</small><b>{latestEffector.employmentSystem}</b></span><span><small>Payload or effect</small><b>{latestEffector.payload}</b></span><span><small>Origin</small><b>{latestEffectorSource?.callsign ?? latestEffector.base}</b></span></div>}
                  <div><Metric label="Desired effect" value={operation.estimate.effect} suffix="%" /><Metric label="Collateral estimate" value={operation.estimate.collateral} suffix="%" tone={operation.estimate.collateral > 60 ? "warning" : "normal"} /><Metric label="Platform risk" value={operation.estimate.platformRisk} suffix="%" /></div>
                </section>
                <section><h3>Release gates</h3><div className="gateList">{operationGates.map(gate => <div key={gate.label}><StatusIcon passed={gate.passed} /><span><b>{gate.label}</b><small>{gate.detail}</small></span></div>)}</div></section>
                {operation.authority && <section className="authorityCard"><span>Human authorization</span><h3>Bounded release authority granted</h3><p>Valid until <span className="mono">{formatTime(operation.authority.expiresAt)}</span>. Any evidence change, custody regression, or command path failure invalidates release.</p></section>}
                {operation.status === "EXECUTING" && <section className="executionCard"><span>Package committed</span><h3>Effects expected at <span className="mono">{formatTime(operation.impactAt ?? sim.minute)}</span></h3><p>The timeline now governs this operation. A valid combat assessment will be required after the effects window.</p></section>}
              </>
            )}
          </div>
          <footer className="workbenchFooter">
            {operation && !["EXECUTING", "ASSESSMENT"].includes(operation.status) && <button className="secondaryButton dangerButton" onClick={() => act(state => cancelPackage(state, "Cancelled during effects planning"))}>Cancel package</button>}
            {!operation && <div className="footerExplanation"><span>{selectedRecommendation?.available ? "Ready to compose" : "Package unavailable"}</span><p>{selectedRecommendation?.available && activeEffector ? `${activeEffector.platform} will employ ${activeEffector.payload} through ${activeEffector.employmentSystem} from ${activeEffectorSource?.callsign ?? activeEffector.base}. Composing reserves those resources but does not grant release authority.` : selectedRecommendation?.checks.filter(check => !check.passed).map(check => check.label).join(". ")}</p></div>}
            {operation?.status === "PLANNED" && <div className="footerExplanation"><span>Human decision required</span><p>Authorization binds the current evidence, target estimate, collateral ceiling, and command path for a limited time.</p></div>}
            {operation?.status === "AUTHORIZED" && <div className="footerExplanation"><span>Release available</span><p>Executing commits inventory and begins a timed effects window. The simulator will automatically abort if custody or command links fail.</p></div>}
            {!operation && <button className="primaryButton" disabled={!selectedRecommendation?.available} onClick={compose}>Compose and reserve</button>}
            {operation?.status === "PLANNED" && <button className="primaryButton" onClick={authorize}>Authorize package</button>}
            {operation?.status === "AUTHORIZED" && <button className="primaryButton destructiveButton" onClick={execute}>Execute authorized package</button>}
            {operation?.status === "EXECUTING" && <button className="primaryButton" onClick={() => setWorkbenchOpen(false)}>Follow on timeline</button>}
            {operation?.status === "ASSESSMENT" && <button className="primaryButton" onClick={openAssessment}>Open combat assessment</button>}
          </footer>
        </aside>
      )}

      {assessmentOpen && (
        <section ref={assessmentRef} className="assessmentOverlay" role="dialog" aria-modal="true" aria-label={`Combat assessment for ${track.callsign}`}>
          <header><div><span>Combat assessment</span><h2>{track.callsign}</h2><p>Desired effect: {latestOperation?.effect ?? "Unknown"}</p></div><button onClick={() => setAssessmentOpen(false)} aria-label="Close assessment">×</button></header>
          <div className="assessmentBody">
            {latestEffector && <section className="assessmentPackageStrip" aria-label="Executed package">
              <div><small>Delivery platform</small><b>{latestEffector.platform}</b></div>
              <div><small>{latestEffector.employmentLabel}</small><b>{latestEffector.employmentSystem}</b></div>
              <div><small>Payload or effect</small><b>{latestEffector.payload}</b></div>
              <div><small>Release origin</small><b>{latestEffectorSource?.callsign ?? latestEffector.base}</b>{latestOperation?.releaseOrigin && <em className="mono">{latestOperation.releaseOrigin[1].toFixed(2)}°, {latestOperation.releaseOrigin[0].toFixed(2)}°</em>}</div>
            </section>}
            <div className="imageryComparison">
              <article><span>Before effects · reference collection</span><div className="sensorFrame before"><i /><b>Reference activity pattern</b></div><small>Source geometry is simulated and intentionally abstract.</small></article>
              <article><span>After effects · assessment collection</span><div className="sensorFrame after"><i /><b>{track.assessment ? "Observed change pattern" : "Awaiting collection"}</b></div><small>{track.assessment ? `Evidence collected at ${formatTime(track.assessment.completedAt)}` : "No assessment evidence has reached the decision environment."}</small></article>
            </div>
            {track.assessment ? (
              <section className="assessmentResults">
                {assessedOutcome && <article className={`effectOutcome ${assessedOutcome.achieved ? "achieved" : assessedOutcome.partial ? "partial" : "failed"}`}><span>Mission result</span><h3>{assessedOutcome.label}</h3><p>{assessedOutcome.detail}</p><small>Confidence measures how strongly the evidence supports each finding. It is not the probability that the target was destroyed.</small></article>}
                <table><thead><tr><th>Assessment</th><th>Finding</th><th>Confidence in finding</th></tr></thead><tbody>
                  <tr><td>Physical damage</td><td>{track.assessment.physical >= 65 ? "Probable severe damage" : track.assessment.physical >= 40 ? "Possible localized damage" : "No severe damage confirmed"}</td><td className="mono">{track.assessment.confidence}%</td></tr>
                  <tr><td>Functional damage</td><td>{track.assessment.functional >= 70 ? "Probable mission effect" : track.assessment.functional >= 40 ? "Partial or temporary effect" : "No durable effect confirmed"}</td><td className="mono">{track.assessment.confidence}%</td></tr>
                  <tr><td>Observed mobility</td><td>{track.stationary || track.speedKnots === 0 ? "Stopped after the effects window" : `Still moving at approximately ${Math.round(track.speedKnots)} knots`}</td><td className="mono">{track.assessment.confidence}%</td></tr>
                  <tr><td>Collateral damage</td><td>{track.assessment.collateral >= 50 ? "Further review required" : "No significant collateral effect observed"}</td><td className="mono">{Math.max(20, track.assessment.confidence - 9)}%</td></tr>
                  <tr><td>Package effectiveness</td><td>{track.assessment.functional > track.assessment.physical ? "Functional effect exceeded visible physical damage" : "Observed effect is consistent with the planned package"}</td><td className="mono">{Math.max(20, track.assessment.confidence - 5)}%</td></tr>
                </tbody></table>
                <article className={`assessmentConclusion ${assessedOutcome?.achieved ? "achieved" : assessedOutcome?.partial ? "partial" : "failed"}`}><span>{track.assessment.provisional ? "Provisional finding" : "Commander assessment"}</span><h3>{track.assessment.conclusion}</h3>{track.assessment.evidence.map(item => <p key={item}>{item}</p>)}</article>
                {track.assessment.provisional && <section className="confirmationTasking">
                  <div className="sectionHeading"><div><h3>Independent confirmation required</h3><p className="sectionHelp">Choose a different source group. A repeated report from the same chain cannot close the assessment.</p></div><span>{track.assessment.sourceGroups.length} of 2 groups</span></div>
                  <div className="bdaSensors">{assessmentCandidates.slice(0, 3).map(candidate => {
                    const sensor = sim.sensors.find(item => item.id === candidate.sensorId)!;
                    return <button key={sensor.id} disabled={!candidate.available} className={activeSensorId === sensor.id ? "active" : ""} onClick={() => setActiveSensorId(sensor.id)}><b>{sensor.name}</b><span>{sensor.modality}</span><small>{candidate.reason} · intelligence at <span className="mono">{formatTime(candidate.deliveryAt)}</span></small></button>;
                  })}</div>
                </section>}
              </section>
            ) : (
              <section className="assessmentPending">
                <h3>No authoritative outcome yet</h3>
                <p>Silence and missing emissions are not proof of destruction. The first collection creates a provisional finding. A second independent source is required to close the assessment.</p>
                <div className="bdaSensors">{assessmentCandidates.slice(0, 3).map(candidate => {
                  const sensor = sim.sensors.find(item => item.id === candidate.sensorId)!;
                  return <button key={sensor.id} disabled={!candidate.available} className={activeSensorId === sensor.id ? "active" : ""} onClick={() => setActiveSensorId(sensor.id)}><b>{sensor.name}</b><span>{sensor.modality}</span><small>{candidate.reason} · intelligence at <span className="mono">{formatTime(candidate.deliveryAt)}</span></small></button>;
                })}</div>
              </section>
            )}
          </div>
          <footer>{(!track.assessment || track.assessment.provisional) && <button className="primaryButton" disabled={!assessmentCandidates.find(candidate => candidate.sensorId === activeSensorId)?.available} onClick={() => {
            act(state => {
              const tasked = taskAssessment(state, activeSensorId);
              return tasked.collectionTasks[0]?.id !== state.collectionTasks[0]?.id ? { ...tasked, paused: false } : tasked;
            });
            setAssessmentOpen(false);
            setTimelineExpanded(true);
          }}>{track.assessment?.provisional ? "Task independent confirmation" : "Task assessment collection"}</button>}<button className="secondaryButton" onClick={() => setAssessmentOpen(false)}>Return to map</button></footer>
        </section>
      )}

      <Timeline sim={sim} expanded={timelineExpanded} setExpanded={setTimelineExpanded} setSim={setSim} />
      {notice && <div className="statusToast" role="status" aria-live="polite">{notice}</div>}
    </main>
  );
}
