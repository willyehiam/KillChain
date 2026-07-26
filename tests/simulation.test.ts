import test from "node:test";
import assert from "node:assert/strict";
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
  doctrineAction,
  executePackage,
  justiceMission2025Zones,
  nominateTarget,
  nominationGates,
  openingOptionsFor,
  packageRecommendations,
  projectFactionView,
  releaseGates,
  scenarioById,
  setUnitCommandMode,
  taskCollection,
  validate,
  type Sim,
  type TaskPurpose
} from "../lib/sim.ts";
import { distanceNm } from "../lib/geography.ts";

function deliverTask(sim: Sim, sensorId: string, purpose: TaskPurpose = "IDENTIFY") {
  let next = taskCollection(sim, sensorId, purpose);
  const task = next.collectionTasks[0];
  assert.ok(task, "collection task should be created");
  next = { ...next, paused: false };
  next = advance(next, task.availableAt - next.minute + 1);
  return { ...next, paused: true };
}

function developedSim(seed = 42) {
  let sim = createSim("taiwan", "USA", seed);
  sim = deliverTask(sim, "uav");
  sim = deliverTask(sim, "sat");
  assert.equal(sim.tracks.find(track => track.id === "orchid")?.stage, "TRACK");
  sim = nominateTarget(sim);
  assert.equal(sim.tracks.find(track => track.id === "orchid")?.stage, "TARGET");
  return sim;
}

function executingSim(seed = 42) {
  let sim = developedSim(seed);
  const recommendation = packageRecommendations(sim, "DISABLE", ["PRECISION ISR"])[0];
  assert.ok(recommendation.available);
  sim = composePackage(sim, recommendation.effectorId, "DISABLE", ["PRECISION ISR"]);
  sim = authorizePackage(sim);
  assert.equal(sim.operations[0].status, "AUTHORIZED");
  return executePackage(sim);
}

function assessmentSim(seed = 42) {
  let sim = executingSim(seed);
  const impactAt = sim.operations[0].impactAt!;
  sim = { ...sim, paused: false };
  sim = advance(sim, impactAt - sim.minute);
  sim = { ...sim, paused: true };
  assert.equal(sim.operations[0].status, "ASSESSMENT");
  return sim;
}

test("same seed and orders replay deterministically", () => {
  const play = () => deliverTask(deliverTask(createSim("taiwan", "USA", 99173), "uav"), "sat");
  assert.deepEqual(play(), play());
});

test("Justice Mission uses the five published live fire polygons without invented geometry", () => {
  assert.equal(justiceMission2025Zones.length, 5);
  for (const zone of justiceMission2025Zones) {
    assert.equal(zone.ring.length, 5);
    assert.deepEqual(zone.ring[0], zone.ring.at(-1));
    assert.equal(zone.sourceCoordinates.length, 4);
  }
  assert.deepEqual(justiceMission2025Zones[0].ring[0], [121.6666667, 26.5333333]);
  assert.deepEqual(justiceMission2025Zones[4].ring[2], [122.4666667, 23.3833333]);
  assert.equal(scenarioById.taiwan.exerciseZones, justiceMission2025Zones);
});

test("scenario force picture keeps incompatible measures separate", () => {
  const scenario = scenarioById.taiwan;
  assert.equal(scenario.startDateLabel, "28 JUL 2026");
  assert.equal(scenario.forcePicture?.find(item => item.branch === "PLA Air Force")?.measure, "SORTIES");
  assert.equal(scenario.forcePicture?.find(item => item.branch === "PLA Navy")?.measure, "PEAK PRESENCE");
  assert.equal(scenario.forcePicture?.find(item => item.branch === "PLA Ground Force")?.measure, "FIRES");
  assert.equal(scenario.identifiedAssets?.filter(item => item.branch === "PLA Navy").length, 8);
  assert.equal(scenario.identifiedAssets?.filter(item => item.branch === "China Coast Guard").length, 7);
});

test("declared exercise termination becomes the first playable crisis beat", () => {
  const start = { ...createSim("taiwan", "USA", 2036), paused: false };
  const next = advance(start, 20);
  assert.equal(next.events[0].title, "EXERCISE WINDOW EXPIRED");
  assert.ok(next.civilianAccess < start.civilianAccess);
  assert.ok(next.shippingThroughput < start.shippingThroughput);
  assert.ok(next.adversaryTempo > start.adversaryTempo);
});

test("publicly identified Coast Guard hulls move while remaining outside player command", () => {
  const start = { ...createSim("taiwan", "USA", 2037), paused: false };
  const hull = start.units.find(unit => unit.id === "ccg-1302");
  assert.ok(hull);
  assert.equal(hull.affiliation, "NEUTRAL");
  const next = advance(start, 30);
  const moved = next.units.find(unit => unit.id === "ccg-1302");
  assert.ok(moved);
  assert.ok(distanceNm(hull.position, moved.position) > 0.5);
  assert.equal(setUnitCommandMode(start, hull.id, "DIRECT"), start);
});

test("minute partitions produce the same deterministic state", () => {
  let single = { ...createSim("taiwan", "USA", 776), paused: false, exposure: 74 };
  let partitioned = structuredClone(single);
  single = advance(single, 120);
  for (let minute = 0; minute < 120; minute += 1) partitioned = advance(partitioned, 1);
  assert.deepEqual(single, partitioned);
});

test("a moving operational unit advances by its speed while a fixed facility remains fixed", () => {
  const start = createSim("taiwan", "USA", 3301);
  const movingBefore = start.units.find(unit => unit.id === "us-p8-03");
  const fixedBefore = start.units.find(unit => unit.id === "us-kadena");
  assert.ok(movingBefore, "the movement fixture should contain the patrol aircraft");
  assert.ok(fixedBefore, "the movement fixture should contain the fixed air base");
  assert.equal(movingBefore.stationary, false);
  assert.equal(fixedBefore.stationary, true);

  const next = advance({ ...start, paused: false }, 1);
  const movingAfter = next.units.find(unit => unit.id === movingBefore.id);
  const fixedAfter = next.units.find(unit => unit.id === fixedBefore.id);
  assert.ok(movingAfter);
  assert.ok(fixedAfter);

  const movedNm = distanceNm(movingBefore.position, movingAfter.position);
  assert.ok(movedNm > 0, "a moving operational unit must change geographic position");
  assert.ok(
    Math.abs(movedNm - movingBefore.speedKnots / 60) < 0.05,
    `expected about ${(movingBefore.speedKnots / 60).toFixed(2)} NM in one minute, received ${movedNm.toFixed(2)} NM`
  );
  assert.deepEqual(fixedAfter.position, fixedBefore.position);
  assert.equal(distanceNm(fixedBefore.position, fixedAfter.position), 0);
});

test("twelve minute operational movement is partition invariant", () => {
  const start = { ...createSim("taiwan", "USA", 3302), paused: false };
  const single = advance(structuredClone(start), 12);
  let partitioned = structuredClone(start);
  for (let minute = 0; minute < 12; minute += 1) partitioned = advance(partitioned, 1);
  assert.deepEqual(single, partitioned);
});

test("fuel exhaustion stops operational movement and records a logistics failure", () => {
  const start = createSim("taiwan", "USA", 3304);
  const before = start.units.find(unit => unit.id === "us-p8-03");
  assert.ok(before);
  const depleted = {
    ...start,
    paused: false,
    units: start.units.map(unit => unit.id === before.id ? { ...unit, fuel: 0 } : unit)
  };
  const next = advance(depleted, 30);
  const after = next.units.find(unit => unit.id === before.id);
  assert.ok(after);
  assert.deepEqual(after.position, before.position);
  assert.equal(after.movement, "DISABLED");
  assert.equal(next.events.some(event => event.title === "SUSTAINMENT FAILURE"), true);
});

test("formation control preserves geometry while direct control creates a costly override", () => {
  const start = { ...createSim("taiwan", "USA", 3305), paused: false };
  const parent = start.units.find(unit => unit.id === "us-csg-formation");
  const child = start.units.find(unit => unit.id === "us-ddg-113");
  assert.ok(parent);
  assert.ok(child);
  const initialSeparation = distanceNm(parent.position, child.position);

  const formation = advance(structuredClone(start), 180);
  const formationParent = formation.units.find(unit => unit.id === parent.id)!;
  const formationChild = formation.units.find(unit => unit.id === child.id)!;
  assert.ok(Math.abs(distanceNm(formationParent.position, formationChild.position) - initialSeparation) < .5);

  const directStart = setUnitCommandMode(structuredClone(start), child.id, "DIRECT");
  const direct = advance({ ...directStart, paused: false }, 180);
  const directChild = direct.units.find(unit => unit.id === child.id)!;
  assert.ok(distanceNm(directChild.position, formationChild.position) > 1);
  assert.ok(direct.analystAttention < start.analystAttention);
  assert.equal(directChild.commandMode, "DIRECT");
});

test("a mobile track dead reckons and becomes less certain without a new observation", () => {
  const start = createSim("taiwan", "USA", 3303);
  const before = start.tracks.find(track => track.id === "orchid");
  assert.ok(before);
  assert.equal(before.stationary, false);

  const next = advance({ ...start, paused: false }, 1);
  const after = next.tracks.find(track => track.id === before.id);
  assert.ok(after);
  assert.ok(distanceNm(before.position, after.position) > 0, "a mobile belief track should coast between observations");
  assert.ok(after.uncertainty > before.uncertainty, "dead reckoning must widen the uncertainty region");
  assert.equal(after.lastObservedAt, before.lastObservedAt, "coasting is not a new observation");
});

test("delayed intelligence fuses the collection snapshot rather than future truth", () => {
  let sim = taskCollection(createSim("taiwan", "USA", 3306), "sat");
  const task = sim.collectionTasks[0];
  sim = advance({ ...sim, paused: false }, task.collectAt - sim.minute);
  const snapshot = sim.observations.find(observation => observation.taskId === task.id);
  assert.ok(snapshot);
  assert.equal(snapshot.delivered, false);

  sim = {
    ...sim,
    truth: sim.truth.map(truth => truth.id === task.targetId ? { ...truth, position: [130, 30] as [number, number] } : truth)
  };
  sim = advance(sim, task.availableAt - sim.minute);
  const track = sim.tracks.find(item => item.id === task.targetId)!;
  const currentTruth = sim.truth.find(item => item.id === task.targetId)!;
  assert.ok(distanceNm(track.position, snapshot.observedPosition) < distanceNm(track.position, currentTruth.position));
  assert.equal(track.lastObservedAt, snapshot.collectedAt);
});

test("phase progression uses elapsed scenario time and never regresses", () => {
  let sim = { ...createSim(), paused: false };
  sim = advance(sim, 1);
  assert.equal(sim.phase, "COERCION");
  assert.equal(sim.elapsedMinute, 1);
  sim = advance(sim, 1439);
  assert.equal(sim.phase, "CONTESTED");
  sim = { ...sim, escalation: 0 };
  sim = advance(sim, 1);
  assert.equal(sim.phase, "CONTESTED");
});

test("collection is delayed and source independence changes recommendation value", () => {
  const start = createSim();
  const ranked = collectionRecommendations(start);
  assert.ok(ranked[0].score >= ranked[1].score);
  const tasked = taskCollection(start, ranked[0].sensorId);
  assert.equal(tasked.tracks[0].evidence.length, start.tracks[0].evidence.length);
  assert.ok(tasked.collectionTasks[0].availableAt > tasked.minute);
  const correlated = ranked.find(item => !item.independent);
  const independent = ranked.find(item => item.independent);
  assert.ok(independent && correlated);
  assert.ok(independent.expectedConfidence > correlated.expectedConfidence);
});

test("zero data or analyst capacity rejects collection", () => {
  const start = createSim();
  for (const constrained of [
    { ...start, analystAttention: 0 },
    { ...start, storage: 0 },
    { ...start, bandwidth: 0 },
    { ...start, compute: 0 }
  ]) {
    const result = taskCollection(constrained, "uav");
    assert.equal(result.collectionTasks.length, 0);
    assert.equal(result.events[0].title, "COLLECTION PIPELINE SATURATED");
  }
});

test("collection queue can shed work before congestion becomes permanent", () => {
  let sim = createSim("taiwan", "USA", 3821);
  sim = taskCollection(sim, "uav");
  sim = { ...sim, selected: "jade" };
  sim = taskCollection(sim, "sat");
  const active = sim.collectionTasks.filter(task => task.status !== "COMPLETE");
  assert.equal(active.length, 2);
  const bandwidthBefore = sim.bandwidth;
  const cancelled = cancelCollectionTask(sim, active[0].id);
  assert.equal(cancelled.collectionTasks.some(task => task.id === active[0].id), false);
  assert.ok(cancelled.bandwidth > bandwidthBefore);
  assert.equal(cancelled.events[0].title, "COLLECTION TASK CANCELLED");
});

test("nomination requires current custody, freshness, and independent evidence", () => {
  const ready = developedSim();
  assert.ok(nominationGates(ready).every(gate => gate.passed));
  const stale = {
    ...ready,
    tracks: ready.tracks.map(track => track.id === ready.selected ? { ...track, freshness: 12, custodyAt: ready.minute - 60 } : track)
  };
  const failed = nominationGates(stale).filter(gate => !gate.passed).map(gate => gate.label);
  assert.ok(failed.includes("Evidence freshness"));
  assert.ok(failed.includes("Custody age"));
});

test("factions have materially different collection and force capabilities", () => {
  const usa = createSim("taiwan", "USA");
  const china = createSim("taiwan", "PRC");
  const taiwan = createSim("taiwan", "TWN");
  assert.notEqual(usa.sensors[0].reliability, china.sensors[0].reliability);
  assert.ok(china.effectors[0].stock > usa.effectors[0].stock);
  assert.ok(taiwan.sensors[2].custody > usa.sensors[2].custody);
  assert.ok(usa.effectors[0].reach > taiwan.effectors[0].reach);
});

test("effects packages identify a real source, employment system, payload, and inventory unit", () => {
  const sim = createSim("taiwan", "USA", 4409);
  for (const effector of sim.effectors) {
    assert.ok(effector.platform.length > 8);
    assert.ok(effector.employmentSystem.length > 8);
    assert.ok(effector.payload.length > 8);
    assert.ok(effector.missionProfile.length > 20);
    assert.ok(effector.stockLabel.length > 3);
    assert.ok(effector.expenditure > 0);
    if (effector.sourceUnitId) assert.ok(sim.units.some(unit => unit.id === effector.sourceUnitId));
  }
  const maritime = sim.effectors.find(effector => effector.id === "lantern")!;
  assert.equal(maritime.sourceUnitId, "us-ddg-113");
  assert.match(maritime.employmentSystem, /Mk 41 Vertical Launching System/i);
  assert.match(maritime.payload, /Tomahawk Block V/i);
  assert.equal(maritime.expenditure, 4);
  assert.equal(maritime.stockLabel, "VLS strike cells");
});

test("recommendations use live source position and expose domain or source failures", () => {
  const usa = createSim("taiwan", "USA", 4410);
  const ddg = usa.units.find(unit => unit.id === "us-ddg-113")!;
  const recommendation = packageRecommendations(usa, "DESTROY", []).find(item => item.effectorId === "lantern")!;
  assert.ok(recommendation.reasons.some(reason => reason.includes(`${distanceNm(ddg.position, usa.tracks[0].position).toFixed(1)} NM`)));
  assert.equal(recommendation.reasons.some(reason => /\d+\.\d{3,}/.test(reason)), false);

  const disabled = {
    ...usa,
    units: usa.units.map(unit => unit.id === ddg.id ? { ...unit, movement: "DISABLED" as const } : unit)
  };
  const unavailable = packageRecommendations(disabled, "DESTROY", []).find(item => item.effectorId === "lantern")!;
  assert.equal(unavailable.available, false);
  assert.ok(unavailable.checks.some(check => !check.passed && /not ready/i.test(check.label)));

  const taiwan = createSim("taiwan", "TWN", 4411);
  const coastal = packageRecommendations(taiwan, "DESTROY", []).find(item => item.effectorId === "lantern")!;
  assert.equal(coastal.available, false);
  assert.ok(coastal.checks.some(check => !check.passed && /LAND target domain is incompatible/i.test(check.label)));
});

test("destroy assessment separates finding confidence from mission success", () => {
  const partial = assessmentEffectOutcome({
    physical: 41,
    functional: 53,
    collateral: 12,
    confidence: 92,
    conclusion: "Independent sources support a partial effect.",
    evidence: [],
    sourceGroups: ["A", "B"],
    provisional: false,
    completedAt: 0
  }, "DESTROY");
  assert.equal(partial.achieved, false);
  assert.equal(partial.partial, true);
  assert.match(partial.label, /DESTROY not achieved/i);
});

test("opposing factions develop targets against different sides of the strait", () => {
  const usa = createSim("taiwan", "USA", 4412);
  const china = createSim("taiwan", "PRC", 4412);
  assert.notEqual(usa.truth[0].actualLabel, china.truth[0].actualLabel);
  assert.ok(distanceNm(usa.truth[0].position, china.truth[0].position) > 80);
  assert.match(china.tracks[0].publicLabel, /Taiwanese/i);
  assert.match(usa.truth[0].actualLabel, /coastal fires/i);
});

test("shared assets cannot be reserved twice", () => {
  let sim = developedSim();
  sim = composePackage(sim, "nightglass", "DISABLE", ["PRECISION ISR"]);
  const before = sim.operations.length;
  sim = {
    ...sim,
    selected: "jade",
    tracks: sim.tracks.map(track => track.id === "jade" ? { ...track, stage: "TARGET" as const, nominatedAt: sim.minute } : track)
  };
  sim = composePackage(sim, "nightglass", "DISABLE", ["PRECISION ISR"]);
  assert.equal(sim.operations.length, before);
  assert.equal(sim.events[0].title, "PACKAGE UNAVAILABLE");
  assert.match(sim.events[0].detail, /conflict/i);
});

test("support packages impose coordination, logistics, exposure, and platform requirements", () => {
  const sim = developedSim(4911);
  const unsupported = packageRecommendations(sim, "DISABLE", []).find(item => item.effectorId === "nightglass")!;
  const supported = packageRecommendations(sim, "DISABLE", ["PRECISION ISR", "ELECTRONIC ATTACK", "CYBER ISOLATION"]).find(item => item.effectorId === "nightglass")!;
  assert.ok(supported.timeToTarget > unsupported.timeToTarget);
  assert.ok(supported.platformRisk >= unsupported.platformRisk - 5);

  const composed = composePackage(sim, "nightglass", "DISABLE", ["PRECISION ISR", "ELECTRONIC ATTACK", "CYBER ISOLATION"]);
  assert.ok(composed.logistics < sim.logistics);
  assert.ok(composed.exposure > sim.exposure);

  const chinaPerspective = createSim("taiwan", "PRC", 4912);
  const tankerOption = packageRecommendations(chinaPerspective, "DISABLE", ["TANKER SUPPORT"])[0];
  assert.equal(tankerOption.available, false);
  assert.ok(tankerOption.reasons.some(reason => /tanker/i.test(reason)));
});

test("release validation uses the same gates exposed to the interface", () => {
  let sim = developedSim();
  sim = composePackage(sim, "nightglass", "DISABLE", ["PRECISION ISR"]);
  const operation = sim.operations[0];
  assert.ok(releaseGates(sim, operation.id).every(gate => gate.passed));
  sim = { ...sim, commandLinks: sim.commandLinks.map(link => link.id === "cmd2" ? { ...link, capacity: 0 } : link) };
  assert.ok(releaseGates(sim, operation.id).some(gate => gate.label === "Command route" && !gate.passed));
  sim = authorizePackage(sim);
  assert.equal(sim.operations[0].status, "PLANNED");
  assert.equal(sim.events[0].title, "RELEASE AUTHORITY WITHHELD");
});

test("evidence arriving after composition invalidates the package and releases assets", () => {
  let sim = developedSim();
  sim = composePackage(sim, "nightglass", "DISABLE", ["PRECISION ISR"]);
  assert.ok(Object.keys(sim.reservations).length > 0);
  sim = deliverTask(sim, "sigint", "CUSTODY");
  assert.equal(sim.operations[0].status, "ABORTED");
  assert.equal(Object.keys(sim.reservations).length, 0);
});

test("a committed package cannot be manually recalled", () => {
  const executing = executingSim();
  const after = cancelPackage(executing);
  assert.equal(after.operations[0].status, "EXECUTING");
  assert.equal(after.events[0].title, "PACKAGE CANNOT BE RECALLED");
});

test("successful effects can improve strategic outcomes", () => {
  const executing = executingSim(1);
  const before = {
    tempo: executing.adversaryTempo,
    shipping: executing.shippingThroughput,
    continuity: executing.continuity
  };
  let after = { ...executing, paused: false };
  after = advance(after, after.operations[0].impactAt! - after.minute);
  assert.ok(
    after.adversaryTempo < before.tempo
      || after.shippingThroughput > before.shipping
      || after.continuity > before.continuity
  );
});

test("a successful destroy effect stops mobility and BDA updates the map track", () => {
  let sim = developedSim(3);
  sim = composePackage(sim, "lantern", "DESTROY", ["PRECISION ISR"]);
  sim = authorizePackage(sim);
  sim = executePackage(sim);
  const operation = sim.operations[0];
  const source = sim.units.find(unit => unit.id === "us-ddg-113")!;
  assert.deepEqual(operation.releaseOrigin, source.position);

  sim = { ...sim, paused: false };
  sim = advance(sim, operation.impactAt! - sim.minute);
  const truth = sim.truth.find(item => item.id === "orchid")!;
  assert.equal(truth.stationary, true);
  assert.equal(truth.speedKnots, 0);

  sim = { ...sim, paused: true };
  sim = deliverTask(sim, "sigint", "BDA");
  const assessed = sim.tracks.find(item => item.id === "orchid")!;
  assert.equal(assessed.stationary, true);
  assert.equal(assessed.speedKnots, 0);
});

test("a released effect does not magically follow a target that leaves its aimpoint", () => {
  let sim = executingSim(5521);
  const targetId = sim.operations[0].targetId;
  const before = structuredClone(sim.truth.find(truth => truth.id === targetId)!.functions);
  sim = {
    ...sim,
    paused: false,
    truth: sim.truth.map(truth => truth.id === targetId
      ? { ...truth, position: [140, 40] as [number, number], route: [[140, 40]], routeIndex: 0, stationary: true, speedKnots: 0 }
      : truth)
  };
  sim = advance(sim, sim.operations[0].impactAt! - sim.minute);
  assert.deepEqual(sim.truth.find(truth => truth.id === targetId)!.functions, before);
});

test("one source produces only a provisional assessment", () => {
  let sim = assessmentSim();
  sim = deliverTask(sim, "sigint", "BDA");
  assert.equal(sim.operations[0].status, "ASSESSMENT");
  assert.equal(sim.tracks[0].assessment?.provisional, true);
  assert.deepEqual(sim.tracks[0].assessment?.sourceGroups, ["THEATER SIGINT"]);
  sim = deliverTask(sim, "uav", "BDA");
  assert.equal(sim.operations[0].status, "COMPLETE");
  assert.equal(sim.tracks[0].assessment?.provisional, false);
  assert.equal(sim.tracks[0].assessment?.sourceGroups.length, 2);
});

test("an untouched object cannot receive a positive damage assessment", () => {
  let sim = developedSim();
  sim = composePackage(sim, "nightglass", "DISABLE", ["PRECISION ISR"]);
  const template = sim.operations[0];
  sim = {
    ...sim,
    selected: "mirror",
    operations: [{ ...template, targetId: "mirror", status: "ASSESSMENT", bdaTaskId: undefined }],
    reservations: {},
    tracks: sim.tracks.map(track => track.id === "mirror" ? { ...track, stage: "ASSESS" as const, status: "ASSESSING" as const } : track)
  };
  sim = deliverTask(sim, "sigint", "BDA");
  const assessment = sim.tracks.find(track => track.id === "mirror")?.assessment;
  assert.equal(assessment?.physical, 0);
  assert.equal(assessment?.functional, 0);
  assert.equal(assessment?.collateral, 0);
});

test("faction projection contains no truth or undelivered reports", () => {
  const sim = taskCollection(createSim(), "uav");
  const view = projectFactionView(sim);
  const serialized = JSON.stringify(view);
  assert.equal("truth" in view, false);
  assert.doesNotMatch(serialized, /actualLabel|preEffectFunctions|concealment/);
  assert.ok(view.observations.every(observation => observation.delivered));
});

test("faction projection never reveals an adversary precise operational unit", () => {
  const usaView = projectFactionView(createSim("taiwan", "USA", 3304));
  const prcView = projectFactionView(createSim("taiwan", "PRC", 3304));
  assert.equal("truth" in usaView, false);
  assert.equal("truth" in prcView, false);
  assert.ok(usaView.units.every(unit => unit.owner !== "PRC"));
  assert.ok(prcView.units.every(unit => unit.owner !== "USA"));
  assert.doesNotMatch(JSON.stringify(usaView), /prc-quarantine-formation|SABLE FLIGHT/);
  assert.doesNotMatch(JSON.stringify(prcView), /us-p8-03|TRIDENT 03/);
});

test("blockade posture choices have distinct consequences and repeat idempotently", () => {
  const start = createSim("taiwan", "USA", 3305);
  const strategicVector = (sim: Sim) => ({
    logistics: sim.logistics,
    readiness: sim.readiness,
    coalition: sim.coalition,
    political: sim.political,
    escalation: sim.escalation,
    information: sim.information,
    exposure: sim.exposure,
    adversaryTempo: sim.adversaryTempo,
    shippingThroughput: sim.shippingThroughput,
    continuity: sim.continuity
  });

  const escort = chooseBlockadePosture(start, "ESCORT");
  const shadow = chooseBlockadePosture(start, "SHADOW");
  const coalition = chooseBlockadePosture(start, "COALITION");

  assert.equal(start.blockadePosture, undefined, "the choice reducer must not mutate its input");
  assert.equal(escort.blockadePosture, "ESCORT");
  assert.equal(shadow.blockadePosture, "SHADOW");
  assert.equal(coalition.blockadePosture, "COALITION");
  assert.notDeepEqual(strategicVector(escort), strategicVector(start), "ESCORT must alter the simulated strategic state");
  assert.notDeepEqual(strategicVector(shadow), strategicVector(start), "SHADOW must alter the simulated strategic state");
  assert.notDeepEqual(strategicVector(coalition), strategicVector(start), "COALITION must alter the simulated strategic state");
  assert.notDeepEqual(strategicVector(escort), strategicVector(shadow));
  assert.notDeepEqual(strategicVector(shadow), strategicVector(coalition));
  assert.notEqual(escort.events[0]?.id, start.events[0]?.id);
  assert.notEqual(shadow.events[0]?.id, start.events[0]?.id);
  assert.notEqual(coalition.events[0]?.id, start.events[0]?.id);

  assert.deepEqual(
    chooseBlockadePosture(escort, "ESCORT"),
    escort,
    "choosing the active posture again must not spend resources or append another event"
  );
});

test("every faction receives three executable and faction appropriate opening plans", () => {
  for (const faction of ["USA", "PRC", "TWN", "ROK"] as const) {
    const options = openingOptionsFor(faction);
    assert.equal(options.length, 3);
    for (const option of options) {
      const start = createSim("taiwan", faction, 6611);
      const next = chooseBlockadePosture(start, option.id);
      assert.equal(next.blockadePosture, option.id, `${faction} must be able to commit ${option.id}`);
      assert.ok(next.openingMission);
      assert.ok(next.openingMission.assignedUnitIds.length > 0);
      assert.ok(next.openingMission.assignedUnitIds.every(id => next.units.some(unit => unit.id === id)));
      assert.match(next.events[0].detail, /estimated completion/i);
      assert.notEqual(next.events[0].title, "OPENING OPTION REJECTED");
    }
  }
});

test("every advertised opening plan reaches a valid completion state", () => {
  for (const faction of ["USA", "PRC", "TWN", "ROK"] as const) {
    for (const option of openingOptionsFor(faction)) {
      let sim = chooseBlockadePosture(createSim("taiwan", faction, 9001), option.id);
      assert.ok(sim.openingMission, `${faction} ${option.id} should create an opening mission`);
      sim = advance({ ...sim, paused: false }, sim.openingMission.resolvesAt - sim.minute + 240);
      assert.equal(sim.openingMission?.status, "COMPLETE", `${faction} ${option.id} should be reachable`);
      const assigned = sim.units.filter(unit => sim.openingMission?.assignedUnitIds.includes(unit.id));
      assert.equal(assigned.some(unit => unit.movement === "DISABLED"), false, `${faction} ${option.id} should preserve assigned forces`);
    }
  }
});

test("routine patrol circuits replenish instead of becoming a terminal fuel clock", () => {
  const start = createSim("taiwan", "USA", 1902);
  const next = advance({ ...start, paused: false }, 72 * 60);
  const mobileCombatUnits = next.units.filter(unit =>
    !unit.stationary
    && unit.affiliation !== "CIVILIAN"
    && unit.affiliation !== "NEUTRAL"
  );
  assert.ok(mobileCombatUnits.length > 0);
  assert.equal(mobileCombatUnits.some(unit => unit.movement === "DISABLED"), false);
  assert.equal(mobileCombatUnits.every(unit => unit.fuel > 0), true);
});

test("opening benefits wait for assigned forces to reach their objective", () => {
  const start = createSim("taiwan", "USA", 6612);
  const committed = chooseBlockadePosture(start, "ESCORT");
  assert.ok(committed.openingMission);
  assert.equal(committed.shippingThroughput, start.shippingThroughput);
  const beforeEta = advance(committed, committed.openingMission.resolvesAt - committed.minute - 1);
  assert.notEqual(beforeEta.openingMission?.status, "COMPLETE");
  const completed = advance(beforeEta, 120);
  assert.equal(completed.openingMission?.status, "COMPLETE");
  assert.ok(completed.shippingThroughput > beforeEta.shippingThroughput);
});

test("doctrine actions have cooldowns and explicit opportunity costs", () => {
  const start = createSim();
  const diplomacy = doctrineAction(start, "CRISIS CHANNEL");
  assert.ok(diplomacy.escalation < start.escalation);
  assert.ok(diplomacy.political < start.political);
  assert.ok(diplomacy.adversaryTempo > start.adversaryTempo);
  const repeated = doctrineAction(diplomacy, "CRISIS CHANNEL");
  assert.equal(repeated.decisionPoints, diplomacy.decisionPoints);
  assert.equal(repeated.events[0].title, "ACTION STILL IN EFFECT");
});

test("fractional time steps are rejected", () => {
  assert.throws(() => advance({ ...createSim(), paused: false }, 1.5), RangeError);
});

test("resource and reference invariants survive sustained tempo", () => {
  let sim = { ...createSim("taiwan", "ROK", 81), paused: false };
  for (let index = 0; index < 180; index += 1) sim = advance(sim, 12);
  assert.deepEqual(validate(sim), []);
});

test("large track pictures advance within an interactive budget", () => {
  const base = createSim("taiwan", "USA", 912);
  const tracks = Array.from({ length: 250 }, (_, batch) => base.tracks.map(track => ({ ...structuredClone(track), id: `${track.id}.${batch}`, callsign: `${track.callsign}.${batch}` }))).flat();
  const truth = Array.from({ length: 250 }, (_, batch) => base.truth.map(item => ({ ...structuredClone(item), id: `${item.id}.${batch}` }))).flat();
  const sim = { ...base, paused: false, selected: tracks[0].id, tracks, truth };
  const started = performance.now();
  const advanced = advance(sim, 60);
  const elapsed = performance.now() - started;
  assert.equal(advanced.tracks.length, 1000);
  assert.ok(elapsed < 1500, `large track step took ${elapsed.toFixed(1)}ms`);
  assert.deepEqual(validate(advanced), []);
});
