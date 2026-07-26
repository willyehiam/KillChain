import { advanceRoute } from "./motion";
import { bearingDegrees, distanceNm, projectCoordinate, type Coordinate } from "./geography";

export type Faction = "USA" | "PRC" | "TWN" | "ROK";
export type Stage = "FIND" | "FIX" | "TRACK" | "TARGET" | "ENGAGE" | "ASSESS";
export type TrackStatus = "ACTIVE" | "STALE" | "LOST" | "EFFECTS PENDING" | "ASSESSING" | "CLOSED";
export type DesiredEffect = "SUPPRESS" | "DISRUPT" | "DISABLE" | "DESTROY";
export type TaskPurpose = "IDENTIFY" | "CUSTODY" | "BDA";
export type DoctrineAction = "SILENT WATCH" | "ISR SURGE" | "FORCE DISPERSAL" | "CRISIS CHANNEL";
export type BlockadePosture =
  | "ESCORT"
  | "SHADOW"
  | "COALITION"
  | "TIGHTEN_QUARANTINE"
  | "SELECTIVE_INSPECTION"
  | "DECEPTIVE_EXERCISE"
  | "DISPERSE_ENDURE"
  | "CHALLENGE_INSPECTIONS"
  | "PROTECTED_PASSAGE"
  | "PENINSULA_HOLD"
  | "ALLIANCE_ISR"
  | "LOGISTICS_BRIDGE";

export interface OpeningOption {
  id: BlockadePosture;
  label: string;
  detail: string;
}

export interface OpeningMission {
  optionId: BlockadePosture;
  label: string;
  assignedUnitIds: string[];
  unitDepartures: Record<string, number>;
  movement: OperationalUnit["movement"];
  startedAt: number;
  resolvesAt: number;
  status: "TRANSIT" | "DELAYED" | "COMPLETE";
}

export interface Hypothesis {
  label: string;
  probability: number;
  trend: "UP" | "DOWN" | "FLAT";
}

export interface Observation {
  id: string;
  taskId: string;
  targetId: string;
  sensorId: string;
  source: string;
  correlationKey: string;
  collectedAt: number;
  availableAt: number;
  reliability: number;
  supports: string;
  contradicts?: string;
  strength: number;
  features: string[];
  observedPosition: Coordinate;
  observedHeading: number;
  observedSpeedKnots: number;
  observedStationary: boolean;
  observedBehavior: Truth["behavior"];
  locationUncertainty: number;
  delivered: boolean;
  purpose: TaskPurpose;
}

export interface Assessment {
  physical: number;
  functional: number;
  collateral: number;
  confidence: number;
  conclusion: string;
  evidence: string[];
  sourceGroups: string[];
  provisional: boolean;
  completedAt: number;
}

export interface Track {
  id: string;
  callsign: string;
  publicLabel: string;
  domain: "LAND" | "SEA" | "AIR" | "CYBER";
  position: [number, number];
  heading: number;
  speedKnots: number;
  stationary: boolean;
  history: Array<[number, number]>;
  lastObservedAt: number;
  uncertainty: number;
  quality: number;
  freshness: number;
  deceptionRisk: number;
  collateralRisk: number;
  hypotheses: Hypothesis[];
  evidence: string[];
  stage: Stage;
  status: TrackStatus;
  custodyAt: number;
  nominatedAt?: number;
  assessment?: Assessment;
  observedCountermeasures: string[];
}

interface TruthFunctions {
  sense: number;
  command: number;
  move: number;
  act: number;
  sustain: number;
}

interface Truth {
  id: string;
  actualLabel: string;
  kind: "REAL" | "DECOY" | "CIVILIAN";
  position: [number, number];
  route: Coordinate[];
  routeIndex: number;
  loopRoute: boolean;
  heading: number;
  speedKnots: number;
  stationary: boolean;
  concealment: number;
  defense: number;
  mobility: number;
  density: number;
  behavior: "HIDING" | "MOVING" | "EMITTING" | "JAMMING" | "DISPERSED";
  functions: TruthFunctions;
  preEffectFunctions?: TruthFunctions;
}

export type UnitDomain = "AIR" | "SEA" | "LAND" | "SPACE";
export type UnitAffiliation = "FRIENDLY" | "ALLY" | "NEUTRAL" | "CIVILIAN";
export type UnitEchelon = "FORMATION" | "PLATFORM" | "FACILITY";
export type UnitKind =
  | "FIXED_WING"
  | "UNCREWED_AIR"
  | "TANKER"
  | "SURFACE_COMBATANT"
  | "CARRIER_GROUP"
  | "PATROL_CRAFT"
  | "MERCHANT"
  | "FISHING"
  | "GROUND_FORMATION"
  | "AIR_DEFENSE"
  | "RADAR"
  | "AIRFIELD"
  | "PORT"
  | "SATELLITE";

export interface OperationalUnit {
  id: string;
  callsign: string;
  owner: string;
  affiliation: UnitAffiliation;
  domain: UnitDomain;
  kind: UnitKind;
  echelon: UnitEchelon;
  formationId?: string;
  position: Coordinate;
  route: Coordinate[];
  routeIndex: number;
  loopRoute: boolean;
  heading: number;
  speedKnots: number;
  stationary: boolean;
  movement: "TRANSIT" | "PATROL" | "ORBIT" | "HOLDING" | "FIXED" | "DISABLED";
  mission: string;
  base: string;
  readiness: number;
  fuel: number;
  enduranceMinutes: number;
  commandMode: "FORMATION" | "DIRECT";
  trail: Coordinate[];
}

export interface Sensor {
  id: string;
  name: string;
  modality: string;
  operator: string;
  correlationKey: string;
  aame: 1 | 2 | 3 | 4;
  reliability: number;
  classification: number;
  custody: number;
  precision: number;
  falseAlarm: number;
  bandwidthCost: number;
  computeCost: number;
  latency: number;
  collectTime: number;
  revisit: number;
  readyAt: number;
}

export interface CollectionTask {
  id: string;
  sensorId: string;
  targetId: string;
  purpose: TaskPurpose;
  requestedAt: number;
  collectAt: number;
  availableAt: number;
  status: "COLLECTING" | "TRANSMITTING" | "PROCESSING" | "COMPLETE";
}

export interface Effector {
  id: string;
  name: string;
  platform: string;
  employmentLabel: "Launcher" | "Jammer" | "Access mechanism";
  employmentSystem: string;
  payload: string;
  missionProfile: string;
  stockLabel: string;
  expenditure: number;
  sourceUnitId?: string;
  base: string;
  position: [number, number];
  targetDomains: Track["domain"][];
  compatible: DesiredEffect[];
  effect: number;
  collateral: number;
  signature: number;
  escalation: number;
  transit: number;
  reach: number;
  readiness: number;
  fuel: number;
  stock: number;
  assets: string[];
}

export interface PackageWeights {
  effect: number;
  time: number;
  distance: number;
  fuel: number;
  inventory: number;
  collateral: number;
  platformRisk: number;
  escalation: number;
}

export interface PackageEstimate {
  effectorId: string;
  score: number;
  effect: number;
  collateral: number;
  timeToTarget: number;
  distance: number;
  platformRisk: number;
  escalation: number;
  inRange: boolean;
  available: boolean;
  checks: Array<{ passed: boolean; label: string }>;
  reasons: string[];
}

export interface Operation {
  id: string;
  targetId: string;
  effect: DesiredEffect;
  effectorId: string;
  supports: string[];
  assets: string[];
  estimate: PackageEstimate;
  version: number;
  evidenceVersion: number;
  status: "PLANNED" | "AUTHORIZED" | "EXECUTING" | "ASSESSMENT" | "COMPLETE" | "ABORTED";
  authority?: {
    grantedAt: number;
    expiresAt: number;
    evidenceVersion: number;
    maxCollateral: number;
    commandPath: string[];
  };
  impactAt?: number;
  releaseOrigin?: Coordinate;
  releaseAimpoint?: Coordinate;
  releaseUncertainty?: number;
  bdaTaskId?: string;
  abortReason?: string;
}

export interface Event {
  id: string;
  minute: number;
  elapsedMinute: number;
  severity: "INFO" | "WATCH" | "CRITICAL" | "SUCCESS";
  title: string;
  detail: string;
  category: "INTEL" | "COMMAND" | "EFFECTS" | "LOGISTICS" | "POLITICAL";
}

export interface CommandLink {
  id: string;
  from: string;
  to: string;
  integrity: number;
  capacity: number;
  latency: number;
  active: boolean;
}

export interface TheaterNode {
  id: string;
  label: string;
  type: "CITY" | "PORT" | "AIRFIELD" | "COMMAND" | "LOGISTICS";
  position: [number, number];
  side: "FRIENDLY" | "NEUTRAL" | "UNKNOWN";
}

export interface ExerciseZone {
  id: string;
  code: string;
  label: string;
  role: string;
  ring: Coordinate[];
  sourceCoordinates: string[];
  restriction: string;
  tone: string;
}

export interface ScenarioBaseline {
  label: string;
  value: string;
  detail: string;
}

export interface ScenarioForceDatum {
  branch: string;
  measure: "SORTIES" | "PEAK PRESENCE" | "FIRES" | "FORMATIONS" | "IDENTIFIED HULLS";
  value: string;
  confidence: "CONFIRMED" | "REPORTED" | "ASSESSED";
  detail: string;
}

export interface IdentifiedAsset {
  id: string;
  branch: string;
  name: string;
  designation: string;
  status: "IDENTIFIED" | "ASSOCIATED" | "UNRESOLVED";
  detail: string;
}

export interface Scenario {
  id: string;
  code: string;
  name: string;
  region: string;
  intensity: string;
  startDateLabel?: string;
  synopsis: string;
  historicalBasis?: string;
  divergence?: string;
  bounds: [number, number, number, number];
  objective: Record<Faction, string>;
  nodes: TheaterNode[];
  lanes: Array<{ id: string; label: string; points: Array<[number, number]>; throughput: number }>;
  exerciseZones?: ExerciseZone[];
  baseline?: ScenarioBaseline[];
  forcePicture?: ScenarioForceDatum[];
  identifiedAssets?: IdentifiedAsset[];
  locked?: boolean;
}

export interface Sim {
  scenarioId: string;
  faction: Faction;
  factionName: string;
  seed: number;
  serial: number;
  minute: number;
  elapsedMinute: number;
  paused: boolean;
  speed: number;
  phase: "WARNING" | "COERCION" | "CONTESTED" | "OPEN CONFLICT";
  selected: string;
  tracks: Track[];
  observations: Observation[];
  truth: Truth[];
  units: OperationalUnit[];
  sensors: Sensor[];
  collectionTasks: CollectionTask[];
  effectors: Effector[];
  operations: Operation[];
  reservations: Record<string, string>;
  commandLinks: CommandLink[];
  bandwidth: number;
  compute: number;
  analystAttention: number;
  storage: number;
  logistics: number;
  readiness: number;
  coalition: number;
  political: number;
  escalation: number;
  information: number;
  exposure: number;
  adversaryTempo: number;
  shippingThroughput: number;
  civilianAccess: number;
  continuity: number;
  decisionPoints: number;
  doctrineCooldowns: Partial<Record<DoctrineAction, number>>;
  blockadePosture?: BlockadePosture;
  openingMission?: OpeningMission;
  events: Event[];
}

const H_MOBILE = "Mobile coastal fires unit";
const H_RELAY = "Integrated air defense relay";
const H_COMMERCIAL = "Commercial logistics formation";
const H_DECOY = "Deception formation";
const H_UNKNOWN = "Unresolved military activity";
const targetVocabulary: Record<Faction, {
  mobile: string;
  relay: string;
  commercial: string;
  decoy: string;
  unknown: string;
  publicMobile: string;
  publicRelay: string;
  publicCommercial: string;
  publicDecoy: string;
}> = {
  USA: {
    mobile: H_MOBILE,
    relay: H_RELAY,
    commercial: H_COMMERCIAL,
    decoy: H_DECOY,
    unknown: H_UNKNOWN,
    publicMobile: "Unresolved mobile formation",
    publicRelay: "Probable air defense support",
    publicCommercial: "Ambiguous merchant formation",
    publicDecoy: "Suspected military activity"
  },
  TWN: {
    mobile: "Mobile quarantine fires unit",
    relay: "Eastern Theater air defense relay",
    commercial: "Inspection support formation",
    decoy: "Quarantine deception formation",
    unknown: "Unresolved cross strait activity",
    publicMobile: "Unresolved coastal fires formation",
    publicRelay: "Probable blockade air defense support",
    publicCommercial: "Ambiguous inspection support",
    publicDecoy: "Suspected quarantine deception"
  },
  ROK: {
    mobile: "Mobile theater fires unit",
    relay: "Regional air defense relay",
    commercial: "Inspection logistics formation",
    decoy: "Theater deception formation",
    unknown: "Unresolved regional military activity",
    publicMobile: "Unresolved regional fires formation",
    publicRelay: "Probable theater air defense support",
    publicCommercial: "Ambiguous inspection logistics",
    publicDecoy: "Suspected regional deception"
  },
  PRC: {
    mobile: "Dispersed Taiwanese coastal defense battery",
    relay: "Allied air defense and sortie relay",
    commercial: "Coalition logistics convoy",
    decoy: "Taiwanese signature replication unit",
    unknown: "Unresolved allied military activity",
    publicMobile: "Unresolved Taiwanese mobile formation",
    publicRelay: "Probable allied defense support",
    publicCommercial: "Ambiguous coalition logistics",
    publicDecoy: "Suspected Taiwanese deception"
  }
};
const SUPPORTS = ["PRECISION ISR", "ELECTRONIC ATTACK", "CYBER ISOLATION", "TANKER SUPPORT"] as const;
export const supportOptions = [...SUPPORTS];
export const stages: Stage[] = ["FIND", "FIX", "TRACK", "TARGET", "ENGAGE", "ASSESS"];

export const justiceMission2025Zones: ExerciseZone[] = [
  {
    id: "jm25-zone-1",
    code: "JM25-01",
    label: "LIVE FIRE AREA 1",
    role: "Northeast live fire area affecting the approaches to Keelung",
    ring: [
      [121.6666667, 26.5333333],
      [122.6, 26.5333333],
      [122.6, 25.7166667],
      [121.6666667, 25.7166667],
      [121.6666667, 26.5333333]
    ],
    sourceCoordinates: ["26°32′00″N 121°40′00″E", "26°32′00″N 122°36′00″E", "25°43′00″N 122°36′00″E", "25°43′00″N 121°40′00″E"],
    restriction: "Declared closed to unrelated vessels and aircraft during live firing",
    tone: "#E86868"
  },
  {
    id: "jm25-zone-2",
    code: "JM25-02",
    label: "LIVE FIRE AREA 2",
    role: "Northwest approach and civil aviation corridor",
    ring: [
      [120.0666667, 24.9833333],
      [121.2166667, 25.65],
      [121.2166667, 26.2833333],
      [120.0666667, 25.6166667],
      [120.0666667, 24.9833333]
    ],
    sourceCoordinates: ["24°59′00″N 120°04′00″E", "25°39′00″N 121°13′00″E", "26°17′00″N 121°13′00″E", "25°37′00″N 120°04′00″E"],
    restriction: "Declared closed to unrelated vessels and aircraft during live firing",
    tone: "#E86868"
  },
  {
    id: "jm25-zone-3",
    code: "JM25-03",
    label: "LIVE FIRE AREA 3",
    role: "Southwest live fire area affecting the approaches to Kaohsiung",
    ring: [
      [118.2333333, 23.45],
      [119.2166667, 23.45],
      [119.7333333, 22.2166667],
      [118.75, 22.2166667],
      [118.2333333, 23.45]
    ],
    sourceCoordinates: ["23°27′00″N 118°14′00″E", "23°27′00″N 119°13′00″E", "22°13′00″N 119°44′00″E", "22°13′00″N 118°45′00″E"],
    restriction: "Declared closed to unrelated vessels and aircraft during live firing",
    tone: "#E86868"
  },
  {
    id: "jm25-zone-4",
    code: "JM25-04",
    label: "LIVE FIRE AREA 4",
    role: "Southern live fire area across the Bashi approach",
    ring: [
      [119.2666667, 21.8166667],
      [121, 21.8166667],
      [121, 21.0833333],
      [119.2666667, 21.0833333],
      [119.2666667, 21.8166667]
    ],
    sourceCoordinates: ["21°49′00″N 119°16′00″E", "21°49′00″N 121°00′00″E", "21°05′00″N 121°00′00″E", "21°05′00″N 119°16′00″E"],
    restriction: "Declared closed to unrelated vessels and aircraft during live firing",
    tone: "#E86868"
  },
  {
    id: "jm25-zone-5",
    code: "JM25-05",
    label: "LIVE FIRE AREA 5",
    role: "Southeast live fire area affecting the eastern reinforcement corridor",
    ring: [
      [121.6666667, 21.9666667],
      [122.4666667, 21.9666667],
      [122.4666667, 23.3833333],
      [121.6666667, 23.3833333],
      [121.6666667, 21.9666667]
    ],
    sourceCoordinates: ["21°58′00″N 121°40′00″E", "21°58′00″N 122°28′00″E", "23°23′00″N 122°28′00″E", "23°23′00″N 121°40′00″E"],
    restriction: "Declared closed to unrelated vessels and aircraft during live firing",
    tone: "#E86868"
  }
];

const objective = (USA: string, PRC: string, TWN: string, ROK: string) => ({ USA, PRC, TWN, ROK });
export const scenarios: Scenario[] = [
  {
    id: "taiwan",
    code: "PAC 01",
    name: "JUSTICE MISSION 2026",
    region: "TAIWAN STRAIT",
    intensity: "JULY 2026 OPEN ENDED CRISIS",
    startDateLabel: "28 JUL 2026",
    synopsis: "Take command twenty minutes before a declared live fire exercise is scheduled to end. The published operating areas match Justice Mission 2025, but this fictional July 2026 exercise does not terminate. Coast guard inspections, military patrols, civilian disruption, and ambiguous unmanned systems begin to form a coercive quarantine.",
    historicalBasis: "The scenario baseline uses publicly reported Justice Mission 2025 activity. Reporting supports 207 aircraft sorties across the main forty eight hour period, a peak snapshot of 17 PLA Navy ships and 15 China Coast Guard vessels, a four ship amphibious group east and southeast of Taiwan, 27 Ground Force rockets, and disruption to 941 civil aviation flights. Sorties, peak presence, formations, and munitions are kept as separate measures because they cannot be added into a defensible unique platform total.",
    divergence: "The historical exercise ended. This campaign diverges at 18:00 on 28 July 2026, when no termination notice arrives and nominal exercise controls become persistent inspection and exclusion measures. What follows is fictional and changes through player and faction decisions.",
    bounds: [117.4, 20.9, 124.5, 27.4],
    objective: objective(
      "Preserve access and civilian throughput while preventing a coercive fait accompli and uncontrolled escalation.",
      "Create an irreversible political settlement before outside combat power can organize.",
      "Preserve sovereign command, infrastructure continuity, and eastern access without exhausting defensive capacity.",
      "Maintain peninsula readiness while contributing useful alliance sensing and logistics."
    ),
    nodes: [
      { id: "taipei", label: "Taipei", type: "COMMAND", position: [121.56, 25.04], side: "FRIENDLY" },
      { id: "kaohsiung", label: "Kaohsiung", type: "PORT", position: [120.30, 22.62], side: "FRIENDLY" },
      { id: "hualien", label: "Hualien", type: "AIRFIELD", position: [121.61, 23.99], side: "FRIENDLY" },
      { id: "penghu", label: "Penghu", type: "LOGISTICS", position: [119.56, 23.57], side: "FRIENDLY" },
      { id: "xiamen", label: "Xiamen", type: "PORT", position: [118.08, 24.48], side: "UNKNOWN" },
      { id: "fuzhou", label: "Fuzhou", type: "COMMAND", position: [119.30, 26.08], side: "UNKNOWN" },
      { id: "miyako", label: "Miyako access", type: "LOGISTICS", position: [124.05, 24.80], side: "NEUTRAL" },
      { id: "bashi", label: "Bashi access", type: "LOGISTICS", position: [122.75, 21.45], side: "NEUTRAL" }
    ],
    lanes: [
      { id: "north", label: "Northern commercial lane", points: [[117.8, 25.8], [119.4, 25.3], [121.4, 25.0], [124.1, 25.2]], throughput: 74 },
      { id: "south", label: "Southern commercial lane", points: [[117.8, 22.2], [119.5, 22.5], [121.5, 22.1], [123.9, 21.4]], throughput: 68 },
      { id: "east", label: "Eastern reinforcement lane", points: [[124.1, 24.8], [122.9, 24.4], [121.8, 24.0]], throughput: 81 }
    ],
    exerciseZones: justiceMission2025Zones,
    baseline: [
      { label: "Air tempo", value: "207 sorties", detail: "Reported across the main forty eight hours. Unique airframes remain unknown." },
      { label: "Peak maritime presence", value: "17 PLAN + 15 CCG", detail: "Peak snapshots, not additive daily ship totals" },
      { label: "Eastern group", value: "4 amphibious ships", detail: "Reported approximately 85 kilometers east and southeast of Taiwan" },
      { label: "Ground fires", value: "27 rockets", detail: "Seventeen from Pingtan and ten from Shishi into northern and southwestern areas" },
      { label: "Civil disruption", value: "941 flights", detail: "Reported affected by exercise area closures" }
    ],
    forcePicture: [
      { branch: "PLA Air Force", measure: "SORTIES", value: "207", confidence: "REPORTED", detail: "130 sorties in the first complete reporting period and 77 in the second. This is operational tempo, not a count of unique aircraft." },
      { branch: "PLA Navy", measure: "PEAK PRESENCE", value: "17 ships", confidence: "REPORTED", detail: "Peak detected strength. Eight ships were individually identified in public imagery and reporting." },
      { branch: "China Coast Guard", measure: "PEAK PRESENCE", value: "15 vessels", confidence: "REPORTED", detail: "Exercise specific peak. At least seven hull numbers were individually identified. Patrol formations operated around the island." },
      { branch: "PLA Ground Force", measure: "FIRES", value: "27 rockets", confidence: "CONFIRMED", detail: "Two firing formations associated with the 72nd and 73rd Group Armies used long range fires. Exact launcher count remains unknown." },
      { branch: "PLA Rocket Force", measure: "FORMATIONS", value: "2 organizations", confidence: "ASSESSED", detail: "Open source analysis associated a Base 61 missile brigade battalion and an unmanned aircraft regiment. No reliable public launcher count exists." }
    ],
    identifiedAssets: [
      { id: "plan-hainan-31", branch: "PLA Navy", name: "Hainan", designation: "Hull 31 · Type 075", status: "IDENTIFIED", detail: "Central ship in the reported four ship amphibious group east and southeast of Taiwan." },
      { id: "plan-taiyuan-131", branch: "PLA Navy", name: "Taiyuan", designation: "Hull 131", status: "IDENTIFIED", detail: "Individually identified in public imagery and reporting." },
      { id: "plan-xian-153", branch: "PLA Navy", name: "Xi’an", designation: "Hull 153", status: "IDENTIFIED", detail: "Individually identified in public imagery and reporting." },
      { id: "plan-huaibei-516", branch: "PLA Navy", name: "Huaibei", designation: "Hull 516", status: "IDENTIFIED", detail: "Individually identified in public imagery and reporting." },
      { id: "plan-quzhou-517", branch: "PLA Navy", name: "Quzhou", designation: "Hull 517", status: "IDENTIFIED", detail: "Individually identified in public imagery and reporting." },
      { id: "plan-baoji-534", branch: "PLA Navy", name: "Baoji", designation: "Hull 534", status: "IDENTIFIED", detail: "Individually identified in public imagery and reporting." },
      { id: "plan-yixing-537", branch: "PLA Navy", name: "Yixing", designation: "Hull 537", status: "IDENTIFIED", detail: "Individually identified in public imagery and reporting." },
      { id: "plan-anyang-599", branch: "PLA Navy", name: "Anyang", designation: "Hull 599", status: "IDENTIFIED", detail: "Individually identified in public imagery and reporting." },
      { id: "ccg-1302", branch: "China Coast Guard", name: "CCG 1302", designation: "Formation lead", status: "IDENTIFIED", detail: "Associated with the northern and eastern law enforcement patrol arc." },
      { id: "ccg-1303", branch: "China Coast Guard", name: "CCG 1303", designation: "Patrol vessel", status: "IDENTIFIED", detail: "One of at least seven publicly identified Coast Guard hulls." },
      { id: "ccg-1306", branch: "China Coast Guard", name: "CCG 1306", designation: "Formation lead", status: "IDENTIFIED", detail: "Associated with the eastern and southern law enforcement patrol arc." },
      { id: "ccg-2203", branch: "China Coast Guard", name: "CCG 2203", designation: "Formation lead", status: "IDENTIFIED", detail: "Associated with the southwestern law enforcement patrol arc." },
      { id: "ccg-2204", branch: "China Coast Guard", name: "CCG 2204", designation: "Formation lead", status: "IDENTIFIED", detail: "Associated with the northwestern law enforcement patrol arc." },
      { id: "ccg-14606", branch: "China Coast Guard", name: "CCG 14606", designation: "Patrol vessel", status: "IDENTIFIED", detail: "One of at least seven publicly identified Coast Guard hulls." },
      { id: "ccg-14609", branch: "China Coast Guard", name: "CCG 14609", designation: "Patrol vessel", status: "IDENTIFIED", detail: "One of at least seven publicly identified Coast Guard hulls." }
    ]
  },
  { id: "baltic", code: "EUR 02", name: "BALTIC FRACTURE", region: "NORTHERN EUROPE", intensity: "FUTURE MODULE", synopsis: "Scenario engine pending.", bounds: [17, 53, 31, 61], objective: objective("", "", "", ""), nodes: [], lanes: [], locked: true },
  { id: "blacksea", code: "EUR 05", name: "BLACK SEA ATTRITION", region: "UKRAINE AND BLACK SEA", intensity: "FUTURE MODULE", synopsis: "Scenario engine pending.", bounds: [27, 42, 42, 51], objective: objective("", "", "", ""), nodes: [], lanes: [], locked: true },
  { id: "gulf", code: "GULF 03", name: "GULF FLASHPOINT", region: "ARABIAN GULF", intensity: "FUTURE MODULE", synopsis: "Scenario engine pending.", bounds: [47, 22, 58, 31], objective: objective("", "", "", ""), nodes: [], lanes: [], locked: true },
  { id: "nile", code: "AFR 01", name: "NILE BASIN CRISIS", region: "NORTHEAST AFRICA", intensity: "FUTURE MODULE", synopsis: "Scenario engine pending.", bounds: [27, 7, 42, 32], objective: objective("", "", "", ""), nodes: [], lanes: [], locked: true },
  { id: "kashmir", code: "SAS 04", name: "KASHMIR LADDER", region: "SOUTH ASIA", intensity: "FUTURE MODULE", synopsis: "Scenario engine pending.", bounds: [69, 29, 82, 38], objective: objective("", "", "", ""), nodes: [], lanes: [], locked: true },
  { id: "korea", code: "PAC 06", name: "PENINSULA RUPTURE", region: "KOREAN PENINSULA", intensity: "FUTURE MODULE", synopsis: "Scenario engine pending.", bounds: [123, 32, 132, 44], objective: objective("", "", "", ""), nodes: [], lanes: [], locked: true },
  { id: "malacca", code: "SEA 07", name: "MALACCA INTERDICTION", region: "MALACCA STRAIT", intensity: "FUTURE MODULE", synopsis: "Scenario engine pending.", bounds: [94, -2, 108, 9], objective: objective("", "", "", ""), nodes: [], lanes: [], locked: true },
  { id: "hormuz", code: "GULF 08", name: "HORMUZ CLOSURE", region: "STRAIT OF HORMUZ", intensity: "FUTURE MODULE", synopsis: "Scenario engine pending.", bounds: [53, 23, 60, 28], objective: objective("", "", "", ""), nodes: [], lanes: [], locked: true },
  { id: "scs", code: "SEA 03", name: "REEF COLLISION", region: "SOUTH CHINA SEA", intensity: "FUTURE MODULE", synopsis: "Scenario engine pending.", bounds: [106, 5, 124, 22], objective: objective("", "", "", ""), nodes: [], lanes: [], locked: true }
];
export const scenarioById = Object.fromEntries(scenarios.map(item => [item.id, item])) as Record<string, Scenario>;

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const seeded = (seed: number) => {
  const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return [next / 4294967296, next] as const;
};
const topHypothesis = (track: Track) => [...track.hypotheses].sort((a, b) => b.probability - a.probability)[0];
const independentGroups = (sim: Sim, track: Track) => new Set(track.evidence.map(id => sim.observations.find(item => item.id === id)?.correlationKey).filter(Boolean)).size;
const requiredCommandRoute = (sim: Sim) => {
  const requiredIds = ["cmd1", "cmd2"];
  const route = requiredIds.map(id => sim.commandLinks.find(link => link.id === id)).filter(Boolean) as CommandLink[];
  return route.length === requiredIds.length && route.every(link => link.active && link.integrity >= 42 && link.capacity >= 20) ? route : [];
};
const addEvent = (sim: Sim, severity: Event["severity"], title: string, detail: string, category: Event["category"]): Sim => {
  const serial = sim.serial + 1;
  const event: Event = { id: `EV.${serial}`, minute: sim.minute, elapsedMinute: sim.elapsedMinute, severity, title, detail, category };
  return { ...sim, serial, events: [event, ...sim.events].slice(0, 120) };
};

const factionProfiles: Record<Faction, {
  name: string;
  resources: Pick<Sim, "bandwidth" | "compute" | "analystAttention" | "storage" | "logistics" | "readiness" | "coalition" | "political" | "information">;
  sensorNames: [string, string, string, string, string];
  effectorNames: [string, string, string, string];
  beliefOffset: number;
}> = {
  USA: {
    name: "United States Joint Force",
    resources: { bandwidth: 74, compute: 70, analystAttention: 62, storage: 83, logistics: 72, readiness: 68, coalition: 74, political: 64, information: 57 },
    sensorNames: ["ORBITAL PASS 41", "RIVET LENS", "WATCHTOWER 06", "ALLIED REPORTING", "ACCESS VEIL"],
    effectorNames: ["F 35A STANDOFF STRIKE", "DDG 113 VLS STRIKE", "EA 18G ELECTRONIC ATTACK", "JOINT NETWORK EFFECTS"],
    beliefOffset: 0
  },
  PRC: {
    name: "Eastern Theater Command",
    resources: { bandwidth: 82, compute: 66, analystAttention: 70, storage: 78, logistics: 84, readiness: 79, coalition: 42, political: 72, information: 68 },
    sensorNames: ["COASTAL SKYNET", "MARITIME FUSION", "HORIZON UAV 12", "CIVIL SHIPPING NET", "NETWORK ACCESS CELL"],
    effectorNames: ["H 6K STANDOFF STRIKE", "PLAN SURFACE VLS STRIKE", "J 16D ELECTRONIC ATTACK", "THEATER NETWORK EFFECTS"],
    beliefOffset: 7
  },
  TWN: {
    name: "Taiwan Joint Operations Command",
    resources: { bandwidth: 61, compute: 54, analystAttention: 73, storage: 58, logistics: 56, readiness: 76, coalition: 79, political: 70, information: 63 },
    sensorNames: ["ISLAND RADAR FUSION", "EASTERN PASSIVE ARRAY", "PERSISTENT UAS 03", "CIVIL RESILIENCE NET", "DEFENSIVE CYBER CELL"],
    effectorNames: ["F 16V PRECISION STRIKE", "COASTAL MISSILE BATTERY", "ELECTRONIC WARFARE FLIGHT", "DEFENSIVE NETWORK EFFECTS"],
    beliefOffset: -4
  },
  ROK: {
    name: "Republic of Korea Joint Staff",
    resources: { bandwidth: 64, compute: 62, analystAttention: 59, storage: 67, logistics: 61, readiness: 80, coalition: 76, political: 67, information: 54 },
    sensorNames: ["REGIONAL ORBITAL SHARE", "ALLIANCE SIGINT", "MARITIME PATROL 08", "DIPLOMATIC REPORTING", "DEFENSIVE CYBER WATCH"],
    effectorNames: ["F 15K STANDOFF STRIKE", "KDX III VLS STRIKE", "ALLIANCE ELECTRONIC ATTACK", "ALLIANCE NETWORK SUPPORT"],
    beliefOffset: 3
  }
};

const makeSensors = (faction: Faction): Sensor[] => {
  const names = factionProfiles[faction].sensorNames;
  const modifier = faction === "USA"
    ? { reliability: 4, classification: 2, custody: 0, latency: -2, falseAlarm: -2 }
    : faction === "PRC"
      ? { reliability: 1, classification: 0, custody: 4, latency: -1, falseAlarm: 1 }
      : faction === "TWN"
        ? { reliability: 0, classification: -1, custody: 6, latency: 1, falseAlarm: 0 }
        : { reliability: 2, classification: 1, custody: 1, latency: 0, falseAlarm: -1 };
  const tune = (sensor: Sensor): Sensor => ({
    ...sensor,
    reliability: clamp(sensor.reliability + modifier.reliability),
    classification: clamp(sensor.classification + modifier.classification),
    custody: clamp(sensor.custody + modifier.custody),
    latency: Math.max(3, sensor.latency + modifier.latency),
    falseAlarm: clamp(sensor.falseAlarm + modifier.falseAlarm)
  });
  const sensors: Sensor[] = [
    { id: "sat", name: names[0], modality: "Multispectral imagery", operator: "National collection", correlationKey: "NATIONAL IMAGERY", aame: 4, reliability: 82, classification: 13, custody: 5, precision: 20, falseAlarm: 7, bandwidthCost: 15, computeCost: 19, latency: 22, collectTime: 8, revisit: 42, readyAt: 0 },
    { id: "sigint", name: names[1], modality: "Signals fusion", operator: "Theater intelligence", correlationKey: "THEATER SIGINT", aame: 3, reliability: 74, classification: 9, custody: 11, precision: 8, falseAlarm: 11, bandwidthCost: 9, computeCost: 12, latency: 12, collectTime: 5, revisit: 26, readyAt: 0 },
    { id: "uav", name: names[2], modality: "Persistent airborne imagery", operator: "Joint task force", correlationKey: "PERSISTENT EO", aame: 4, reliability: 88, classification: 8, custody: 25, precision: 18, falseAlarm: 5, bandwidthCost: 20, computeCost: 14, latency: 7, collectTime: 7, revisit: 18, readyAt: 0 },
    { id: "partner", name: names[3], modality: "Partner reporting", operator: "Coalition network", correlationKey: "PARTNER NET", aame: 2, reliability: 58, classification: 6, custody: 5, precision: 5, falseAlarm: 24, bandwidthCost: 4, computeCost: 5, latency: 5, collectTime: 3, revisit: 14, readyAt: 0 },
    { id: "cyber", name: names[4], modality: "Network intelligence", operator: "Cyber mission cell", correlationKey: "NETWORK ACCESS", aame: 3, reliability: 69, classification: 15, custody: 4, precision: 4, falseAlarm: 14, bandwidthCost: 11, computeCost: 22, latency: 28, collectTime: 12, revisit: 56, readyAt: 0 }
  ];
  return sensors.map(tune);
};

const makeEffectors = (faction: Faction): Effector[] => {
  const names = factionProfiles[faction].effectorNames;
  const modifier = faction === "USA"
    ? { effect: 5, reach: 65, readiness: 0, signature: -5 }
    : faction === "PRC"
      ? { effect: 2, reach: 25, readiness: 6, signature: 4 }
      : faction === "TWN"
        ? { effect: -3, reach: -70, readiness: 8, signature: -2 }
        : { effect: 0, reach: 10, readiness: 4, signature: -3 };
  const tune = (effector: Effector): Effector => ({
    ...effector,
    effect: clamp(effector.effect + modifier.effect),
    reach: Math.max(90, effector.reach + modifier.reach),
    readiness: clamp(effector.readiness + modifier.readiness),
    signature: clamp(effector.signature + modifier.signature)
  });

  const byFaction: Record<Faction, Effector[]> = {
    USA: [
      {
        id: "nightglass",
        name: names[0],
        platform: "Two aircraft F 35A strike flight",
        employmentLabel: "Launcher",
        employmentSystem: "F 35A internal weapons stations",
        payload: "Four GBU 53/B precision glide bombs",
        missionProfile: "Launch from Kadena, join a named tanker orbit when required, ingress at low signature, release inside weapon range, then recover to Okinawa.",
        stockLabel: "strike sorties",
        expenditure: 2,
        sourceUnitId: "us-f35a-11",
        base: "Kadena Air Base, Okinawa",
        position: [127.77, 26.35],
        targetDomains: ["LAND", "SEA"],
        compatible: ["SUPPRESS", "DISRUPT", "DISABLE"],
        effect: 75,
        collateral: 22,
        signature: 47,
        escalation: 18,
        transit: 46,
        reach: 590,
        readiness: 82,
        fuel: 76,
        stock: 8,
        assets: ["F 35A FLIGHT 11", "AIR MISSION CELL", "PRECISION SUPPORT"]
      },
      {
        id: "lantern",
        name: names[1],
        platform: "Arleigh Burke class destroyer DDG 113",
        employmentLabel: "Launcher",
        employmentSystem: "Mk 41 Vertical Launching System",
        payload: "Four Tomahawk Block V missiles with land attack or maritime seeker load",
        missionProfile: "Surface launched standoff salvo from the destroyer current position using theater fire control and a time coordinated aimpoint.",
        stockLabel: "VLS strike cells",
        expenditure: 4,
        sourceUnitId: "us-ddg-113",
        base: "RESOLUTE GROUP, Philippine Sea",
        position: [130.35, 22.62],
        targetDomains: ["LAND", "SEA"],
        compatible: ["DISABLE", "DESTROY"],
        effect: 81,
        collateral: 31,
        signature: 39,
        escalation: 27,
        transit: 55,
        reach: 900,
        readiness: 74,
        fuel: 83,
        stock: 24,
        assets: ["DDG 113", "MK 41 VLS", "THEATER FIRE CONTROL"]
      },
      {
        id: "meridian",
        name: names[2],
        platform: "Two aircraft EA 18G section from CVN 72",
        employmentLabel: "Jammer",
        employmentSystem: "AN/ALQ 218 receivers with airborne electronic attack pods",
        payload: "Radar and datalink suppression with anti radiation support when authorized",
        missionProfile: "Carrier launched electronic attack coordinated with an airborne relay and a protected recovery window.",
        stockLabel: "jammer sortie hours",
        expenditure: 3,
        sourceUnitId: "us-carrier-72",
        base: "CVN 72, Philippine Sea",
        position: [130.13, 22.75],
        targetDomains: ["LAND", "SEA", "AIR"],
        compatible: ["SUPPRESS", "DISRUPT"],
        effect: 67,
        collateral: 9,
        signature: 68,
        escalation: 13,
        transit: 42,
        reach: 650,
        readiness: 88,
        fuel: 69,
        stock: 18,
        assets: ["CVN 72 AIR WING", "EA 18G SECTION", "AIRBORNE RELAY"]
      },
      {
        id: "circuit",
        name: names[3],
        platform: "Joint cyber mission force",
        employmentLabel: "Access mechanism",
        employmentSystem: "Prepositioned mission system access",
        payload: "Nonkinetic isolation of selected command and mission services",
        missionProfile: "A bounded network operation that risks burning access and cannot directly produce physical destruction.",
        stockLabel: "access windows",
        expenditure: 1,
        base: "Distributed network access",
        position: [121.9, 24.1],
        targetDomains: ["LAND", "SEA", "AIR", "CYBER"],
        compatible: ["DISRUPT", "DISABLE"],
        effect: 54,
        collateral: 6,
        signature: 18,
        escalation: 10,
        transit: 63,
        reach: 999,
        readiness: 61,
        fuel: 100,
        stock: 3,
        assets: ["NETWORK ACCESS", "MISSION ANALYTICS"]
      }
    ],
    PRC: [
      {
        id: "nightglass",
        name: names[0],
        platform: "H 6K bomber package",
        employmentLabel: "Launcher",
        employmentSystem: "H 6K external wing stations",
        payload: "Four air launched standoff cruise missiles",
        missionProfile: "Launch from Eastern Theater airfields, assemble with escort, release outside the densest defensive zone, and recover through the strait.",
        stockLabel: "bomber sorties",
        expenditure: 2,
        sourceUnitId: "plaaf-sortie-surge",
        base: "Multiple Eastern Theater airfields",
        position: [120.2, 26],
        targetDomains: ["LAND", "SEA"],
        compatible: ["SUPPRESS", "DISRUPT", "DISABLE"],
        effect: 75,
        collateral: 22,
        signature: 47,
        escalation: 18,
        transit: 38,
        reach: 700,
        readiness: 82,
        fuel: 76,
        stock: 12,
        assets: ["H 6K PACKAGE", "ESCORT CELL", "THEATER FIRE CONTROL"]
      },
      {
        id: "lantern",
        name: names[1],
        platform: "PLAN surface combatant group led by Taiyuan, hull 131",
        employmentLabel: "Launcher",
        employmentSystem: "Shipboard vertical launching system",
        payload: "Four land attack or maritime cruise missiles",
        missionProfile: "Distributed surface launch from the group current position using theater sensor cueing.",
        stockLabel: "VLS strike cells",
        expenditure: 4,
        sourceUnitId: "plan-taiyuan-131",
        base: "Eastern Theater surface screen",
        position: [121.58, 26.04],
        targetDomains: ["LAND", "SEA"],
        compatible: ["DISABLE", "DESTROY"],
        effect: 81,
        collateral: 31,
        signature: 39,
        escalation: 27,
        transit: 44,
        reach: 700,
        readiness: 74,
        fuel: 83,
        stock: 28,
        assets: ["TAIYUAN 131", "SHIPBOARD VLS", "THEATER FIRE CONTROL"]
      },
      {
        id: "meridian",
        name: names[2],
        platform: "Two aircraft J 16D electronic attack flight",
        employmentLabel: "Jammer",
        employmentSystem: "Airborne electronic attack suite",
        payload: "Radar and datalink suppression with anti radiation support when authorized",
        missionProfile: "Escort supported electronic attack from the live PLAAF formation position.",
        stockLabel: "jammer sortie hours",
        expenditure: 3,
        sourceUnitId: "plaaf-sortie-surge",
        base: "Eastern Theater airfields",
        position: [120.2, 26],
        targetDomains: ["LAND", "SEA", "AIR"],
        compatible: ["SUPPRESS", "DISRUPT"],
        effect: 67,
        collateral: 9,
        signature: 68,
        escalation: 13,
        transit: 28,
        reach: 420,
        readiness: 88,
        fuel: 69,
        stock: 21,
        assets: ["J 16D FLIGHT", "SPECTRUM CELL", "AIRBORNE RELAY"]
      },
      {
        id: "circuit",
        name: names[3],
        platform: "Theater network operations force",
        employmentLabel: "Access mechanism",
        employmentSystem: "Prepositioned mission system access",
        payload: "Nonkinetic isolation of selected command and mission services",
        missionProfile: "A bounded network operation that risks burning access and cannot directly produce physical destruction.",
        stockLabel: "access windows",
        expenditure: 1,
        base: "Distributed network access",
        position: [121.9, 24.1],
        targetDomains: ["LAND", "SEA", "AIR", "CYBER"],
        compatible: ["DISRUPT", "DISABLE"],
        effect: 54,
        collateral: 6,
        signature: 18,
        escalation: 10,
        transit: 58,
        reach: 999,
        readiness: 61,
        fuel: 100,
        stock: 4,
        assets: ["NETWORK ACCESS", "MISSION ANALYTICS"]
      }
    ],
    TWN: [
      {
        id: "nightglass",
        name: names[0],
        platform: "Two aircraft F 16V strike flight",
        employmentLabel: "Launcher",
        employmentSystem: "F 16V external weapons stations",
        payload: "Four AGM 154C JSOW precision glide weapons",
        missionProfile: "Dispersed defensive launch from Hualien with island radar cueing and terrain masked ingress.",
        stockLabel: "strike sorties",
        expenditure: 2,
        sourceUnitId: "twn-cap-17",
        base: "Hualien Air Base",
        position: [121.5, 24.5],
        targetDomains: ["LAND", "SEA"],
        compatible: ["SUPPRESS", "DISRUPT", "DISABLE"],
        effect: 75,
        collateral: 22,
        signature: 47,
        escalation: 18,
        transit: 30,
        reach: 330,
        readiness: 82,
        fuel: 76,
        stock: 10,
        assets: ["F 16V FLIGHT 17", "ISLAND RADAR FUSION", "PRECISION SUPPORT"]
      },
      {
        id: "lantern",
        name: names[1],
        platform: "Mobile coastal defense battery",
        employmentLabel: "Launcher",
        employmentSystem: "Road mobile canister launcher",
        payload: "Four Hsiung Feng III anti ship missiles",
        missionProfile: "Disperse from concealed firing points, launch against a maritime track, then displace before counterfire.",
        stockLabel: "anti ship missiles",
        expenditure: 4,
        sourceUnitId: "twn-coastal-battery",
        base: "Southern Taiwan dispersal area",
        position: [120.31, 22.63],
        targetDomains: ["SEA"],
        compatible: ["DISABLE", "DESTROY"],
        effect: 81,
        collateral: 31,
        signature: 39,
        escalation: 27,
        transit: 24,
        reach: 250,
        readiness: 74,
        fuel: 83,
        stock: 20,
        assets: ["COASTAL BATTERY 6", "ROAD MOBILE LAUNCHER", "ISLAND FIRE CONTROL"]
      },
      {
        id: "meridian",
        name: names[2],
        platform: "Airborne and ground electronic warfare flight",
        employmentLabel: "Jammer",
        employmentSystem: "Airborne and ground electronic attack suite",
        payload: "Radar, navigation, and datalink suppression",
        missionProfile: "Short range defensive electronic attack coordinated with island emitters.",
        stockLabel: "jammer sortie hours",
        expenditure: 3,
        sourceUnitId: "twn-cap-17",
        base: "Hualien Air Base",
        position: [121.5, 24.5],
        targetDomains: ["LAND", "SEA", "AIR"],
        compatible: ["SUPPRESS", "DISRUPT"],
        effect: 67,
        collateral: 9,
        signature: 68,
        escalation: 13,
        transit: 20,
        reach: 260,
        readiness: 88,
        fuel: 69,
        stock: 15,
        assets: ["ELECTRONIC WARFARE FLIGHT", "ISLAND SPECTRUM CELL", "AIRBORNE RELAY"]
      },
      {
        id: "circuit",
        name: names[3],
        platform: "Defensive cyber mission force",
        employmentLabel: "Access mechanism",
        employmentSystem: "Prepositioned mission system access",
        payload: "Nonkinetic isolation of selected command and mission services",
        missionProfile: "A bounded network operation that risks burning access and cannot directly produce physical destruction.",
        stockLabel: "access windows",
        expenditure: 1,
        base: "Distributed defensive access",
        position: [121.9, 24.1],
        targetDomains: ["LAND", "SEA", "AIR", "CYBER"],
        compatible: ["DISRUPT", "DISABLE"],
        effect: 54,
        collateral: 6,
        signature: 18,
        escalation: 10,
        transit: 54,
        reach: 999,
        readiness: 61,
        fuel: 100,
        stock: 3,
        assets: ["NETWORK ACCESS", "MISSION ANALYTICS"]
      }
    ],
    ROK: [
      {
        id: "nightglass",
        name: names[0],
        platform: "Two aircraft F 15K strike flight",
        employmentLabel: "Launcher",
        employmentSystem: "F 15K external weapons stations",
        payload: "Four AGM 84H SLAM ER standoff missiles",
        missionProfile: "Launch from the southern peninsula with alliance tanker support and a long range overwater route.",
        stockLabel: "strike sorties",
        expenditure: 2,
        sourceUnitId: "rok-f15k-21",
        base: "Daegu Air Base",
        position: [128.66, 35.89],
        targetDomains: ["LAND", "SEA"],
        compatible: ["SUPPRESS", "DISRUPT", "DISABLE"],
        effect: 75,
        collateral: 22,
        signature: 47,
        escalation: 18,
        transit: 62,
        reach: 720,
        readiness: 82,
        fuel: 76,
        stock: 8,
        assets: ["F 15K FLIGHT 21", "ALLIANCE AIR MISSION CELL", "PRECISION SUPPORT"]
      },
      {
        id: "lantern",
        name: names[1],
        platform: "KDX III destroyer",
        employmentLabel: "Launcher",
        employmentSystem: "Korean Vertical Launching System",
        payload: "Four Hyunmoo III land attack cruise missiles",
        missionProfile: "Surface launched standoff salvo from the destroyer current position using alliance fire control.",
        stockLabel: "VLS strike cells",
        expenditure: 4,
        sourceUnitId: "rok-kdx-991",
        base: "HAEDONG GROUP",
        position: [128.78, 32.3],
        targetDomains: ["LAND"],
        compatible: ["DISABLE", "DESTROY"],
        effect: 81,
        collateral: 31,
        signature: 39,
        escalation: 27,
        transit: 68,
        reach: 850,
        readiness: 74,
        fuel: 83,
        stock: 20,
        assets: ["KDX III 991", "K VLS", "ALLIANCE FIRE CONTROL"]
      },
      {
        id: "meridian",
        name: names[2],
        platform: "Alliance airborne electronic attack flight",
        employmentLabel: "Jammer",
        employmentSystem: "Airborne electronic attack suite",
        payload: "Radar and datalink suppression",
        missionProfile: "Long range alliance electronic attack with tanker and relay support.",
        stockLabel: "jammer sortie hours",
        expenditure: 3,
        sourceUnitId: "rok-f15k-21",
        base: "Daegu Air Base",
        position: [128.66, 35.89],
        targetDomains: ["LAND", "SEA", "AIR"],
        compatible: ["SUPPRESS", "DISRUPT"],
        effect: 67,
        collateral: 9,
        signature: 68,
        escalation: 13,
        transit: 58,
        reach: 720,
        readiness: 88,
        fuel: 69,
        stock: 12,
        assets: ["ALLIANCE ELECTRONIC ATTACK", "SPECTRUM CELL", "AIRBORNE RELAY"]
      },
      {
        id: "circuit",
        name: names[3],
        platform: "Alliance cyber mission force",
        employmentLabel: "Access mechanism",
        employmentSystem: "Prepositioned mission system access",
        payload: "Nonkinetic isolation of selected command and mission services",
        missionProfile: "A bounded network operation that risks burning access and cannot directly produce physical destruction.",
        stockLabel: "access windows",
        expenditure: 1,
        base: "Distributed alliance access",
        position: [121.9, 24.1],
        targetDomains: ["LAND", "SEA", "AIR", "CYBER"],
        compatible: ["DISRUPT", "DISABLE"],
        effect: 54,
        collateral: 6,
        signature: 18,
        escalation: 10,
        transit: 60,
        reach: 999,
        readiness: 61,
        fuel: 100,
        stock: 3,
        assets: ["NETWORK ACCESS", "MISSION ANALYTICS"]
      }
    ]
  };
  const effectors = byFaction[faction];
  return effectors.map(tune);
};

const alliancePartners: Record<Faction, Set<string>> = {
  USA: new Set(["USA", "TWN", "JPN", "PHL", "ROK"]),
  PRC: new Set(["PRC"]),
  TWN: new Set(["TWN", "USA", "JPN", "PHL", "ROK"]),
  ROK: new Set(["ROK", "USA", "TWN", "JPN"])
};

const unitAffiliation = (owner: string, faction: Faction, civilian = false): UnitAffiliation | "HIDDEN" => {
  if (civilian) return "CIVILIAN";
  if (owner === faction) return "FRIENDLY";
  if (alliancePartners[faction].has(owner)) return "ALLY";
  if (["USA", "TWN", "JPN", "PHL", "ROK", "PRC"].includes(owner)) return "HIDDEN";
  return "NEUTRAL";
};

const makeUnit = (
  faction: Faction,
  unit: Omit<OperationalUnit, "affiliation" | "routeIndex" | "heading" | "trail" | "commandMode"> & { civilian?: boolean; publiclyReported?: boolean }
): OperationalUnit | null => {
  const resolvedAffiliation = unitAffiliation(unit.owner, faction, unit.civilian);
  const affiliation = resolvedAffiliation === "HIDDEN" && unit.publiclyReported ? "NEUTRAL" : resolvedAffiliation;
  if (affiliation === "HIDDEN") return null;
  const routeIndex = unit.route.length > 1 ? 1 : 0;
  const heading = unit.route.length > 1 ? bearingDegrees(unit.position, unit.route[routeIndex]) : 0;
  const { civilian: _civilian, publiclyReported: _publiclyReported, ...rest } = unit;
  void _civilian;
  void _publiclyReported;
  return {
    ...rest,
    owner: resolvedAffiliation === "HIDDEN" && unit.publiclyReported ? "PUBLIC REPORTING" : rest.owner,
    affiliation,
    routeIndex,
    heading,
    trail: [unit.position],
    commandMode: "FORMATION"
  };
};

const makeUnits = (faction: Faction): OperationalUnit[] => {
  const definitions: Array<Parameters<typeof makeUnit>[1]> = [
    {
      id: "us-csg-formation",
      callsign: "RESOLUTE GROUP",
      owner: "USA",
      domain: "SEA",
      kind: "CARRIER_GROUP",
      echelon: "FORMATION",
      position: [130.2, 22.7],
      route: [[130.2, 22.7], [127.6, 21.8], [125.8, 24.3], [128.1, 27.1], [131.0, 25.1]],
      loopRoute: true,
      speedKnots: 19,
      stationary: false,
      movement: "PATROL",
      mission: "Preserve eastern access and protect reinforcement routes",
      base: "Philippine Sea",
      readiness: 84,
      fuel: 77,
      enduranceMinutes: 6200
    },
    {
      id: "us-carrier-72",
      callsign: "CVN 72",
      owner: "USA",
      domain: "SEA",
      kind: "SURFACE_COMBATANT",
      echelon: "PLATFORM",
      formationId: "us-csg-formation",
      position: [130.13, 22.75],
      route: [[130.13, 22.75], [127.55, 21.85], [125.73, 24.35], [128.03, 27.15], [130.93, 25.15]],
      loopRoute: true,
      speedKnots: 19,
      stationary: false,
      movement: "PATROL",
      mission: "Generate combat air patrols",
      base: "Philippine Sea",
      readiness: 82,
      fuel: 75,
      enduranceMinutes: 6100
    },
    {
      id: "us-ddg-113",
      callsign: "DDG 113",
      owner: "USA",
      domain: "SEA",
      kind: "SURFACE_COMBATANT",
      echelon: "PLATFORM",
      formationId: "us-csg-formation",
      position: [130.35, 22.62],
      route: [[130.35, 22.62], [127.82, 21.66], [125.98, 24.18], [128.34, 26.96], [131.19, 24.95]],
      loopRoute: true,
      speedKnots: 20,
      stationary: false,
      movement: "PATROL",
      mission: "Screen the carrier group",
      base: "Philippine Sea",
      readiness: 89,
      fuel: 81,
      enduranceMinutes: 5900
    },
    {
      id: "us-p8-03",
      callsign: "TRIDENT 03",
      owner: "USA",
      domain: "AIR",
      kind: "FIXED_WING",
      echelon: "PLATFORM",
      position: [124.8, 20.4],
      route: [[124.8, 20.4], [121.7, 20.8], [119.8, 22.0], [122.4, 22.7], [125.2, 22.0]],
      loopRoute: true,
      speedKnots: 370,
      stationary: false,
      movement: "PATROL",
      mission: "Search the Bashi Channel",
      base: "Clark",
      readiness: 91,
      fuel: 64,
      enduranceMinutes: 440
    },
    {
      id: "us-mq4-21",
      callsign: "VANTAGE 21",
      owner: "USA",
      domain: "AIR",
      kind: "UNCREWED_AIR",
      echelon: "PLATFORM",
      position: [124.3, 25.8],
      route: [[124.3, 25.8], [122.8, 26.6], [121.9, 25.2], [123.1, 24.0], [124.6, 24.7]],
      loopRoute: true,
      speedKnots: 290,
      stationary: false,
      movement: "ORBIT",
      mission: "Maintain broad area maritime custody",
      base: "Misawa",
      readiness: 76,
      fuel: 88,
      enduranceMinutes: 1520
    },
    {
      id: "us-kc135-64",
      callsign: "ARCO 64",
      owner: "USA",
      domain: "AIR",
      kind: "TANKER",
      echelon: "PLATFORM",
      position: [127.8, 26.2],
      route: [[127.8, 26.2], [129.6, 26.6], [129.8, 25.6], [128.0, 25.2]],
      loopRoute: true,
      speedKnots: 410,
      stationary: false,
      movement: "ORBIT",
      mission: "Support long range combat air patrols",
      base: "Kadena",
      readiness: 72,
      fuel: 58,
      enduranceMinutes: 310
    },
    {
      id: "us-f35a-11",
      callsign: "VIPER 11 · F 35A",
      owner: "USA",
      domain: "AIR",
      kind: "FIXED_WING",
      echelon: "PLATFORM",
      position: [127.86, 26.31],
      route: [[127.86, 26.31], [128.46, 26.58], [128.78, 25.98], [128.14, 25.76]],
      loopRoute: true,
      speedKnots: 430,
      stationary: false,
      movement: "PATROL",
      mission: "Standby precision strike and defensive counter air",
      base: "Kadena",
      readiness: 84,
      fuel: 72,
      enduranceMinutes: 165
    },
    {
      id: "twn-sag-formation",
      callsign: "PENGHU GROUP",
      owner: "TWN",
      domain: "SEA",
      kind: "SURFACE_COMBATANT",
      echelon: "FORMATION",
      position: [121.0, 23.2],
      route: [[121.0, 23.2], [121.8, 23.8], [121.7, 24.7], [120.8, 24.9], [120.5, 23.8]],
      loopRoute: true,
      speedKnots: 17,
      stationary: false,
      movement: "PATROL",
      mission: "Protect eastern port approaches",
      base: "Suao",
      readiness: 78,
      fuel: 71,
      enduranceMinutes: 3600
    },
    {
      id: "twn-frigate-1202",
      callsign: "ROCS KANG DING",
      owner: "TWN",
      domain: "SEA",
      kind: "SURFACE_COMBATANT",
      echelon: "PLATFORM",
      formationId: "twn-sag-formation",
      position: [121.08, 23.14],
      route: [[121.08, 23.14], [121.88, 23.74], [121.78, 24.64], [120.88, 24.84], [120.58, 23.74]],
      loopRoute: true,
      speedKnots: 18,
      stationary: false,
      movement: "PATROL",
      mission: "Protect eastern port approaches",
      base: "Suao",
      readiness: 81,
      fuel: 73,
      enduranceMinutes: 3300
    },
    {
      id: "twn-cap-17",
      callsign: "BRAVE EAGLE 17",
      owner: "TWN",
      domain: "AIR",
      kind: "FIXED_WING",
      echelon: "PLATFORM",
      position: [121.5, 24.5],
      route: [[121.5, 24.5], [122.4, 25.0], [122.6, 23.8], [121.7, 23.3]],
      loopRoute: true,
      speedKnots: 430,
      stationary: false,
      movement: "PATROL",
      mission: "Defensive combat air patrol",
      base: "Hualien",
      readiness: 86,
      fuel: 61,
      enduranceMinutes: 145
    },
    {
      id: "twn-coastal-battery",
      callsign: "COASTAL BATTERY 6",
      owner: "TWN",
      domain: "LAND",
      kind: "GROUND_FORMATION",
      echelon: "PLATFORM",
      position: [120.31, 22.63],
      route: [[120.31, 22.63], [120.24, 22.70], [120.38, 22.75], [120.43, 22.61]],
      loopRoute: true,
      speedKnots: 7,
      stationary: false,
      movement: "PATROL",
      mission: "Dispersed coastal maritime denial",
      base: "Southern Taiwan dispersal area",
      readiness: 79,
      fuel: 82,
      enduranceMinutes: 2600
    },
    {
      id: "jpn-ddg-179",
      callsign: "JS MAYA",
      owner: "JPN",
      domain: "SEA",
      kind: "SURFACE_COMBATANT",
      echelon: "PLATFORM",
      position: [125.2, 27.2],
      route: [[125.2, 27.2], [123.9, 25.9], [125.1, 24.8], [126.7, 25.9]],
      loopRoute: true,
      speedKnots: 18,
      stationary: false,
      movement: "PATROL",
      mission: "Monitor the Miyako approach",
      base: "Sasebo",
      readiness: 88,
      fuel: 82,
      enduranceMinutes: 4200
    },
    {
      id: "phl-patrol-08",
      callsign: "MAHARLIKA 08",
      owner: "PHL",
      domain: "AIR",
      kind: "FIXED_WING",
      echelon: "PLATFORM",
      position: [120.4, 18.5],
      route: [[120.4, 18.5], [121.5, 20.0], [119.8, 21.3], [118.7, 19.5]],
      loopRoute: true,
      speedKnots: 260,
      stationary: false,
      movement: "PATROL",
      mission: "Monitor Luzon Strait traffic",
      base: "Basa",
      readiness: 69,
      fuel: 66,
      enduranceMinutes: 360
    },
    {
      id: "rok-maritime-formation",
      callsign: "HAEDONG GROUP",
      owner: "ROK",
      domain: "SEA",
      kind: "SURFACE_COMBATANT",
      echelon: "FORMATION",
      position: [128.9, 32.4],
      route: [[128.9, 32.4], [127.2, 30.6], [125.9, 28.7], [128.1, 29.8]],
      loopRoute: true,
      speedKnots: 18,
      stationary: false,
      movement: "PATROL",
      mission: "Preserve peninsula readiness while monitoring southern access",
      base: "Busan",
      readiness: 86,
      fuel: 79,
      enduranceMinutes: 4300
    },
    {
      id: "rok-p8-12",
      callsign: "HAESEONG 12",
      owner: "ROK",
      domain: "AIR",
      kind: "FIXED_WING",
      echelon: "PLATFORM",
      formationId: "rok-maritime-formation",
      position: [129.1, 32.2],
      route: [[129.1, 32.2], [127.4, 30.4], [126.1, 28.5], [128.3, 29.6]],
      loopRoute: true,
      speedKnots: 355,
      stationary: false,
      movement: "PATROL",
      mission: "Alliance maritime intelligence patrol",
      base: "Jeju",
      readiness: 82,
      fuel: 72,
      enduranceMinutes: 410
    },
    {
      id: "rok-f15k-21",
      callsign: "SLAM EAGLE 21 · F 15K",
      owner: "ROK",
      domain: "AIR",
      kind: "FIXED_WING",
      echelon: "PLATFORM",
      position: [128.66, 35.89],
      route: [[128.66, 35.89], [129.7, 34.8], [128.8, 33.9], [127.8, 34.9]],
      loopRoute: true,
      speedKnots: 445,
      stationary: false,
      movement: "PATROL",
      mission: "Alliance long range strike readiness",
      base: "Daegu",
      readiness: 83,
      fuel: 74,
      enduranceMinutes: 190
    },
    {
      id: "rok-kdx-991",
      callsign: "KDX III · HULL 991",
      owner: "ROK",
      domain: "SEA",
      kind: "SURFACE_COMBATANT",
      echelon: "PLATFORM",
      formationId: "rok-maritime-formation",
      position: [128.78, 32.3],
      route: [[128.78, 32.3], [127.08, 30.5], [125.78, 28.6], [127.98, 29.7]],
      loopRoute: true,
      speedKnots: 19,
      stationary: false,
      movement: "PATROL",
      mission: "Alliance air defense and land attack reserve",
      base: "Busan",
      readiness: 87,
      fuel: 81,
      enduranceMinutes: 4400
    },
    {
      id: "prc-quarantine-formation",
      callsign: "EASTERN SCREEN",
      owner: "PRC",
      domain: "SEA",
      kind: "SURFACE_COMBATANT",
      echelon: "FORMATION",
      position: [120.6, 25.8],
      route: [[120.6, 25.8], [121.4, 25.6], [121.8, 24.4], [120.8, 24.0], [120.1, 24.8]],
      loopRoute: true,
      speedKnots: 14,
      stationary: false,
      movement: "PATROL",
      mission: "Sustain the declared inspection regime",
      base: "Eastern Theater ports",
      readiness: 87,
      fuel: 83,
      enduranceMinutes: 5100
    },
    {
      id: "plan-amphibious-formation",
      callsign: "HUBEI AMPHIBIOUS GROUP",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "CARRIER_GROUP",
      echelon: "FORMATION",
      position: [123.05, 23.55],
      route: [[123.05, 23.55], [123.45, 22.65], [122.85, 21.95], [122.25, 22.80], [122.55, 24.05]],
      loopRoute: true,
      speedKnots: 15,
      stationary: false,
      movement: "PATROL",
      mission: "Hold east and southeast of Taiwan as an amphibious deterrent group",
      base: "Eastern Theater ports",
      readiness: 88,
      fuel: 84,
      enduranceMinutes: 5400
    },
    {
      id: "plan-hainan-31",
      callsign: "HAINAN · HULL 31",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "CARRIER_GROUP",
      echelon: "PLATFORM",
      formationId: "plan-amphibious-formation",
      position: [123.10, 23.50],
      route: [[123.10, 23.50], [123.50, 22.60], [122.90, 21.90], [122.30, 22.75], [122.60, 24.00]],
      loopRoute: true,
      speedKnots: 15,
      stationary: false,
      movement: "PATROL",
      mission: "Central ship in the reported four ship amphibious group",
      base: "Eastern Theater ports",
      readiness: 89,
      fuel: 82,
      enduranceMinutes: 5300
    },
    {
      id: "plan-surface-screen",
      callsign: "PLAN SURFACE SCREEN",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "SURFACE_COMBATANT",
      echelon: "FORMATION",
      position: [121.70, 26.10],
      route: [[121.70, 26.10], [120.15, 25.30], [119.85, 23.70], [121.10, 22.10], [122.70, 22.50], [123.15, 24.45], [122.75, 25.70]],
      loopRoute: true,
      speedKnots: 17,
      stationary: false,
      movement: "PATROL",
      mission: "Maintain distributed sea and air readiness around the declared areas",
      base: "Eastern Theater ports",
      readiness: 86,
      fuel: 78,
      enduranceMinutes: 4800
    },
    {
      id: "plan-taiyuan-131",
      callsign: "TAIYUAN · HULL 131",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "SURFACE_COMBATANT",
      echelon: "PLATFORM",
      formationId: "plan-surface-screen",
      position: [121.58, 26.04],
      route: [[121.58, 26.04], [120.03, 25.24], [119.73, 23.64], [120.98, 22.04], [122.58, 22.44], [123.03, 24.39], [122.63, 25.64]],
      loopRoute: true,
      speedKnots: 18,
      stationary: false,
      movement: "PATROL",
      mission: "Surface combat patrol",
      base: "Eastern Theater ports",
      readiness: 87,
      fuel: 76,
      enduranceMinutes: 4700
    },
    {
      id: "plan-xian-153",
      callsign: "XI’AN · HULL 153",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "SURFACE_COMBATANT",
      echelon: "PLATFORM",
      formationId: "plan-surface-screen",
      position: [121.82, 26.16],
      route: [[121.82, 26.16], [120.27, 25.36], [119.97, 23.76], [121.22, 22.16], [122.82, 22.56], [123.27, 24.51], [122.87, 25.76]],
      loopRoute: true,
      speedKnots: 17,
      stationary: false,
      movement: "PATROL",
      mission: "Surface combat patrol",
      base: "Eastern Theater ports",
      readiness: 85,
      fuel: 79,
      enduranceMinutes: 4750
    },
    {
      id: "plan-huaibei-516",
      callsign: "HUAIBEI · HULL 516",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "SURFACE_COMBATANT",
      echelon: "PLATFORM",
      formationId: "plan-surface-screen",
      position: [121.64, 25.92],
      route: [[121.64, 25.92], [120.09, 25.12], [119.79, 23.52], [121.04, 21.92], [122.64, 22.32], [123.09, 24.27], [122.69, 25.52]],
      loopRoute: true,
      speedKnots: 17,
      stationary: false,
      movement: "PATROL",
      mission: "Surface combat patrol",
      base: "Eastern Theater ports",
      readiness: 82,
      fuel: 77,
      enduranceMinutes: 4550
    },
    {
      id: "plan-quzhou-517",
      callsign: "QUZHOU · HULL 517",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "SURFACE_COMBATANT",
      echelon: "PLATFORM",
      formationId: "plan-surface-screen",
      position: [121.94, 26.00],
      route: [[121.94, 26.00], [120.39, 25.20], [120.09, 23.60], [121.34, 22.00], [122.94, 22.40], [123.39, 24.35], [122.99, 25.60]],
      loopRoute: true,
      speedKnots: 17,
      stationary: false,
      movement: "PATROL",
      mission: "Surface combat patrol",
      base: "Eastern Theater ports",
      readiness: 84,
      fuel: 80,
      enduranceMinutes: 4620
    },
    {
      id: "plan-baoji-534",
      callsign: "BAOJI · HULL 534",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "SURFACE_COMBATANT",
      echelon: "PLATFORM",
      formationId: "plan-surface-screen",
      position: [121.52, 26.22],
      route: [[121.52, 26.22], [119.97, 25.42], [119.67, 23.82], [120.92, 22.22], [122.52, 22.62], [122.97, 24.57], [122.57, 25.82]],
      loopRoute: true,
      speedKnots: 16,
      stationary: false,
      movement: "PATROL",
      mission: "Surface combat patrol",
      base: "Eastern Theater ports",
      readiness: 83,
      fuel: 75,
      enduranceMinutes: 4500
    },
    {
      id: "plan-yixing-537",
      callsign: "YIXING · HULL 537",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "SURFACE_COMBATANT",
      echelon: "PLATFORM",
      formationId: "plan-surface-screen",
      position: [121.76, 26.28],
      route: [[121.76, 26.28], [120.21, 25.48], [119.91, 23.88], [121.16, 22.28], [122.76, 22.68], [123.21, 24.63], [122.81, 25.88]],
      loopRoute: true,
      speedKnots: 16,
      stationary: false,
      movement: "PATROL",
      mission: "Surface combat patrol",
      base: "Eastern Theater ports",
      readiness: 81,
      fuel: 78,
      enduranceMinutes: 4480
    },
    {
      id: "plan-anyang-599",
      callsign: "ANYANG · HULL 599",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "SURFACE_COMBATANT",
      echelon: "PLATFORM",
      formationId: "plan-surface-screen",
      position: [122.00, 26.34],
      route: [[122.00, 26.34], [120.45, 25.54], [120.15, 23.94], [121.40, 22.34], [123.00, 22.74], [123.45, 24.69], [123.05, 25.94]],
      loopRoute: true,
      speedKnots: 16,
      stationary: false,
      movement: "PATROL",
      mission: "Surface combat patrol",
      base: "Eastern Theater ports",
      readiness: 82,
      fuel: 77,
      enduranceMinutes: 4520
    },
    {
      id: "ccg-north-formation",
      callsign: "CCG 1302 FORMATION",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "PATROL_CRAFT",
      echelon: "FORMATION",
      position: [120.15, 26.35],
      route: [[120.15, 26.35], [121.05, 26.75], [122.55, 26.25], [123.05, 25.10], [122.65, 24.25]],
      loopRoute: true,
      speedKnots: 14,
      stationary: false,
      movement: "PATROL",
      mission: "Conduct the northern and eastern law enforcement patrol arc",
      base: "Fujian Coast Guard",
      readiness: 91,
      fuel: 86,
      enduranceMinutes: 6200
    },
    {
      id: "ccg-1302",
      callsign: "CCG 1302",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "PATROL_CRAFT",
      echelon: "PLATFORM",
      formationId: "ccg-north-formation",
      position: [120.10, 26.30],
      route: [[120.10, 26.30], [121.00, 26.70], [122.50, 26.20], [123.00, 25.05], [122.60, 24.20]],
      loopRoute: true,
      speedKnots: 14,
      stationary: false,
      movement: "PATROL",
      mission: "Northern and eastern law enforcement patrol arc",
      base: "Fujian Coast Guard",
      readiness: 92,
      fuel: 88,
      enduranceMinutes: 6150
    },
    {
      id: "ccg-1303",
      callsign: "CCG 1303",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "PATROL_CRAFT",
      echelon: "PLATFORM",
      formationId: "ccg-north-formation",
      position: [120.25, 26.42],
      route: [[120.25, 26.42], [121.15, 26.82], [122.65, 26.32], [123.15, 25.17], [122.75, 24.32]],
      loopRoute: true,
      speedKnots: 13,
      stationary: false,
      movement: "PATROL",
      mission: "Northern and eastern law enforcement patrol arc",
      base: "Fujian Coast Guard",
      readiness: 89,
      fuel: 84,
      enduranceMinutes: 6100
    },
    {
      id: "ccg-east-formation",
      callsign: "CCG 1306 FORMATION",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "PATROL_CRAFT",
      echelon: "FORMATION",
      position: [122.70, 24.20],
      route: [[122.70, 24.20], [123.10, 23.10], [122.65, 21.90], [121.65, 21.40], [120.85, 21.65]],
      loopRoute: true,
      speedKnots: 14,
      stationary: false,
      movement: "PATROL",
      mission: "Conduct the eastern and southern law enforcement patrol arc",
      base: "Fujian Coast Guard",
      readiness: 90,
      fuel: 85,
      enduranceMinutes: 6200
    },
    {
      id: "ccg-1306",
      callsign: "CCG 1306",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "PATROL_CRAFT",
      echelon: "PLATFORM",
      formationId: "ccg-east-formation",
      position: [122.75, 24.15],
      route: [[122.75, 24.15], [123.15, 23.05], [122.70, 21.85], [121.70, 21.35], [120.90, 21.60]],
      loopRoute: true,
      speedKnots: 14,
      stationary: false,
      movement: "PATROL",
      mission: "Eastern and southern law enforcement patrol arc",
      base: "Fujian Coast Guard",
      readiness: 91,
      fuel: 86,
      enduranceMinutes: 6100
    },
    {
      id: "ccg-14606",
      callsign: "CCG 14606",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "PATROL_CRAFT",
      echelon: "PLATFORM",
      formationId: "ccg-east-formation",
      position: [122.55, 24.25],
      route: [[122.55, 24.25], [122.95, 23.15], [122.50, 21.95], [121.50, 21.45], [120.70, 21.70]],
      loopRoute: true,
      speedKnots: 13,
      stationary: false,
      movement: "PATROL",
      mission: "Eastern and southern law enforcement patrol arc",
      base: "Fujian Coast Guard",
      readiness: 88,
      fuel: 83,
      enduranceMinutes: 6050
    },
    {
      id: "ccg-southwest-formation",
      callsign: "CCG 2203 FORMATION",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "PATROL_CRAFT",
      echelon: "FORMATION",
      position: [120.80, 21.70],
      route: [[120.80, 21.70], [119.70, 21.90], [118.85, 22.70], [118.70, 23.75], [119.15, 24.30]],
      loopRoute: true,
      speedKnots: 13,
      stationary: false,
      movement: "PATROL",
      mission: "Conduct the southern and western law enforcement patrol arc",
      base: "Fujian Coast Guard",
      readiness: 89,
      fuel: 84,
      enduranceMinutes: 6200
    },
    {
      id: "ccg-2203",
      callsign: "CCG 2203",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "PATROL_CRAFT",
      echelon: "PLATFORM",
      formationId: "ccg-southwest-formation",
      position: [120.75, 21.65],
      route: [[120.75, 21.65], [119.65, 21.85], [118.80, 22.65], [118.65, 23.70], [119.10, 24.25]],
      loopRoute: true,
      speedKnots: 13,
      stationary: false,
      movement: "PATROL",
      mission: "Southern and western law enforcement patrol arc",
      base: "Fujian Coast Guard",
      readiness: 90,
      fuel: 85,
      enduranceMinutes: 6100
    },
    {
      id: "ccg-14609",
      callsign: "CCG 14609",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "PATROL_CRAFT",
      echelon: "PLATFORM",
      formationId: "ccg-southwest-formation",
      position: [120.90, 21.80],
      route: [[120.90, 21.80], [119.80, 22.00], [118.95, 22.80], [118.80, 23.85], [119.25, 24.40]],
      loopRoute: true,
      speedKnots: 12,
      stationary: false,
      movement: "PATROL",
      mission: "Southern and western law enforcement patrol arc",
      base: "Fujian Coast Guard",
      readiness: 87,
      fuel: 82,
      enduranceMinutes: 6000
    },
    {
      id: "ccg-northwest-formation",
      callsign: "CCG 2204 FORMATION",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "PATROL_CRAFT",
      echelon: "FORMATION",
      position: [119.15, 24.35],
      route: [[119.15, 24.35], [118.95, 25.10], [119.35, 25.90], [120.10, 26.35], [120.70, 26.55]],
      loopRoute: true,
      speedKnots: 13,
      stationary: false,
      movement: "PATROL",
      mission: "Conduct the western and northern law enforcement patrol arc",
      base: "Fujian Coast Guard",
      readiness: 90,
      fuel: 85,
      enduranceMinutes: 6200
    },
    {
      id: "ccg-2204",
      callsign: "CCG 2204",
      owner: "PRC",
      publiclyReported: true,
      domain: "SEA",
      kind: "PATROL_CRAFT",
      echelon: "PLATFORM",
      formationId: "ccg-northwest-formation",
      position: [119.10, 24.30],
      route: [[119.10, 24.30], [118.90, 25.05], [119.30, 25.85], [120.05, 26.30], [120.65, 26.50]],
      loopRoute: true,
      speedKnots: 13,
      stationary: false,
      movement: "PATROL",
      mission: "Western and northern law enforcement patrol arc",
      base: "Fujian Coast Guard",
      readiness: 91,
      fuel: 86,
      enduranceMinutes: 6100
    },
    {
      id: "plagf-pingtan-fires",
      callsign: "72ND GROUP ARMY FIRES",
      owner: "PRC",
      publiclyReported: true,
      domain: "LAND",
      kind: "GROUND_FORMATION",
      echelon: "FORMATION",
      position: [119.78, 25.50],
      route: [[119.78, 25.50], [119.68, 25.42], [119.58, 25.56], [119.72, 25.64]],
      loopRoute: true,
      speedKnots: 8,
      stationary: false,
      movement: "PATROL",
      mission: "Disperse after long range rocket fires from Pingtan",
      base: "Pingtan",
      readiness: 82,
      fuel: 77,
      enduranceMinutes: 2800
    },
    {
      id: "plagf-shishi-fires",
      callsign: "73RD GROUP ARMY FIRES",
      owner: "PRC",
      publiclyReported: true,
      domain: "LAND",
      kind: "GROUND_FORMATION",
      echelon: "FORMATION",
      position: [118.65, 24.73],
      route: [[118.65, 24.73], [118.55, 24.66], [118.45, 24.79], [118.59, 24.86]],
      loopRoute: true,
      speedKnots: 8,
      stationary: false,
      movement: "PATROL",
      mission: "Disperse after long range rocket fires from Shishi",
      base: "Shishi",
      readiness: 80,
      fuel: 75,
      enduranceMinutes: 2800
    },
    {
      id: "plaaf-sortie-surge",
      callsign: "PLAAF SORTIE SURGE",
      owner: "PRC",
      publiclyReported: true,
      domain: "AIR",
      kind: "FIXED_WING",
      echelon: "FORMATION",
      position: [120.20, 26.00],
      route: [[120.20, 26.00], [121.45, 26.35], [122.80, 25.35], [123.10, 23.60], [122.40, 21.90], [120.80, 22.05], [119.65, 23.45], [119.35, 25.00]],
      loopRoute: true,
      speedKnots: 410,
      stationary: false,
      movement: "PATROL",
      mission: "Represent reported multi airfield sortie tempo, not a unique airframe count",
      base: "Multiple Eastern Theater airfields",
      readiness: 84,
      fuel: 69,
      enduranceMinutes: 260
    },
    {
      id: "prc-j36-eval",
      callsign: "SABLE FLIGHT",
      owner: "PRC",
      domain: "AIR",
      kind: "FIXED_WING",
      echelon: "PLATFORM",
      position: [119.1, 27.0],
      route: [[119.1, 27.0], [121.0, 27.2], [121.5, 25.8], [119.7, 25.4]],
      loopRoute: true,
      speedKnots: 470,
      stationary: false,
      movement: "PATROL",
      mission: "Low signature counter air evaluation",
      base: "Eastern Theater airfield",
      readiness: 63,
      fuel: 68,
      enduranceMinutes: 170
    },
    {
      id: "prc-air-defense-44",
      callsign: "AD GROUP 44",
      owner: "PRC",
      domain: "LAND",
      kind: "AIR_DEFENSE",
      echelon: "FORMATION",
      position: [119.1, 25.6],
      route: [[119.1, 25.6], [119.4, 25.8], [119.6, 25.5], [119.2, 25.3]],
      loopRoute: true,
      speedKnots: 9,
      stationary: false,
      movement: "PATROL",
      mission: "Protect coastal sensor and fires network",
      base: "Fujian",
      readiness: 83,
      fuel: 74,
      enduranceMinutes: 2700
    },
    {
      id: "merchant-convoy",
      callsign: "FORMOSA CONVOY",
      owner: "CIV",
      civilian: true,
      domain: "SEA",
      kind: "MERCHANT",
      echelon: "FORMATION",
      position: [125.0, 24.9],
      route: [[125.0, 24.9], [123.5, 25.1], [121.7, 25.0], [120.6, 24.7], [119.0, 24.8], [117.8, 25.2]],
      loopRoute: true,
      speedKnots: 16,
      stationary: false,
      movement: "TRANSIT",
      mission: "Commercial passage to western ports",
      base: "Singapore registry",
      readiness: 100,
      fuel: 88,
      enduranceMinutes: 8800
    },
    {
      id: "merchant-a",
      callsign: "PACIFIC GARDEN",
      owner: "CIV",
      civilian: true,
      domain: "SEA",
      kind: "MERCHANT",
      echelon: "PLATFORM",
      formationId: "merchant-convoy",
      position: [124.85, 24.82],
      route: [[124.85, 24.82], [123.35, 25.02], [121.55, 24.92], [120.45, 24.62], [118.85, 24.72], [117.65, 25.12]],
      loopRoute: true,
      speedKnots: 16,
      stationary: false,
      movement: "TRANSIT",
      mission: "Commercial passage to western ports",
      base: "Singapore registry",
      readiness: 100,
      fuel: 86,
      enduranceMinutes: 8600
    },
    {
      id: "merchant-b",
      callsign: "EASTERN LIGHT",
      owner: "CIV",
      civilian: true,
      domain: "SEA",
      kind: "MERCHANT",
      echelon: "PLATFORM",
      formationId: "merchant-convoy",
      position: [125.14, 25.02],
      route: [[125.14, 25.02], [123.64, 25.22], [121.84, 25.12], [120.74, 24.82], [119.14, 24.92], [117.94, 25.32]],
      loopRoute: true,
      speedKnots: 15,
      stationary: false,
      movement: "TRANSIT",
      mission: "Commercial passage to western ports",
      base: "Panama registry",
      readiness: 100,
      fuel: 91,
      enduranceMinutes: 9100
    },
    {
      id: "fishing-formation",
      callsign: "PENGHU FISHING",
      owner: "CIV",
      civilian: true,
      domain: "SEA",
      kind: "FISHING",
      echelon: "FORMATION",
      position: [119.7, 23.7],
      route: [[119.7, 23.7], [119.9, 23.9], [119.6, 24.1], [119.4, 23.8]],
      loopRoute: true,
      speedKnots: 7,
      stationary: false,
      movement: "PATROL",
      mission: "Fishing grounds",
      base: "Penghu",
      readiness: 100,
      fuel: 72,
      enduranceMinutes: 2100
    },
    {
      id: "twn-hualien",
      callsign: "HUALIEN AIR BASE",
      owner: "TWN",
      domain: "LAND",
      kind: "AIRFIELD",
      echelon: "FACILITY",
      position: [121.61, 23.99],
      route: [[121.61, 23.99]],
      loopRoute: false,
      speedKnots: 0,
      stationary: true,
      movement: "FIXED",
      mission: "Generate defensive sorties",
      base: "Hualien",
      readiness: 82,
      fuel: 74,
      enduranceMinutes: 99999
    },
    {
      id: "us-kadena",
      callsign: "KADENA AIR BASE",
      owner: "USA",
      domain: "LAND",
      kind: "AIRFIELD",
      echelon: "FACILITY",
      position: [127.77, 26.35],
      route: [[127.77, 26.35]],
      loopRoute: false,
      speedKnots: 0,
      stationary: true,
      movement: "FIXED",
      mission: "Generate tanker and combat sorties",
      base: "Okinawa",
      readiness: 79,
      fuel: 81,
      enduranceMinutes: 99999
    },
    {
      id: "sat-wideband-6",
      callsign: "WIDEBAND 6",
      owner: "USA",
      domain: "SPACE",
      kind: "SATELLITE",
      echelon: "PLATFORM",
      position: [92, -18],
      route: [[92, -18], [118, 4], [144, 24], [172, 42], [-158, 49], [-128, 35], [-98, 12], [-68, -10], [-38, -28], [-8, -42], [22, -49], [52, -37], [82, -19]],
      loopRoute: true,
      speedKnots: 13800,
      stationary: false,
      movement: "ORBIT",
      mission: "Wideband relay and theater communications",
      base: "Low Earth orbit",
      readiness: 96,
      fuel: 94,
      enduranceMinutes: 250000
    },
    {
      id: "sat-yaogan-41",
      callsign: "ORBITAL ISR 41",
      owner: "PRC",
      domain: "SPACE",
      kind: "SATELLITE",
      echelon: "PLATFORM",
      position: [151, -31],
      route: [[151, -31], [177, -8], [-157, 16], [-131, 37], [-105, 50], [-79, 43], [-53, 25], [-27, 2], [-1, -22], [25, -42], [51, -50], [77, -36], [103, -13], [129, 11]],
      loopRoute: true,
      speedKnots: 14000,
      stationary: false,
      movement: "ORBIT",
      mission: "Ocean surveillance and warning",
      base: "Low Earth orbit",
      readiness: 93,
      fuel: 91,
      enduranceMinutes: 230000
    }
  ];

  return definitions.map(definition => makeUnit(faction, definition)).filter(Boolean) as OperationalUnit[];
};

const makeTrack = (
  id: string,
  callsign: string,
  publicLabel: string,
  domain: Track["domain"],
  position: [number, number],
  hypotheses: Array<[string, number]>,
  partial: Partial<Track> = {}
): Track => ({
  id,
  callsign,
  publicLabel,
  domain,
  position,
  heading: 0,
  speedKnots: 0,
  stationary: true,
  history: [position],
  lastObservedAt: 0,
  uncertainty: 76,
  quality: 28,
  freshness: 68,
  deceptionRisk: 48,
  collateralRisk: 34,
  hypotheses: hypotheses.map(([label, probability]) => ({ label, probability, trend: "FLAT" })),
  evidence: [],
  stage: "FIND",
  status: "ACTIVE",
  custodyAt: 0,
  observedCountermeasures: ["Possible emission control"],
  ...partial
});

export function createSim(scenarioId = "taiwan", faction: Faction = "USA", seed = 2901841): Sim {
  const scenario = scenarioById[scenarioId]?.locked ? scenarioById.taiwan : (scenarioById[scenarioId] ?? scenarioById.taiwan);
  const profile = factionProfiles[faction];
  const vocabulary = targetVocabulary[faction];
  const bias = profile.beliefOffset;
  const opposingTaiwan = faction === "PRC";
  const beliefPositions: Record<"orchid" | "jade" | "merchant" | "mirror", Coordinate> = opposingTaiwan
    ? {
        orchid: [121.42 + bias * .004, 24.74 - bias * .003],
        jade: [121.61, 23.99],
        merchant: [123.72, 24.62],
        mirror: [121.15, 23.58]
      }
    : {
        orchid: [119.85 + bias * .004, 25.02 - bias * .003],
        jade: [119.22, 24.26],
        merchant: [120.58, 24.14],
        mirror: [119.94, 24.82]
      };
  const tracks: Track[] = [
    makeTrack("orchid", "ORCHID 31", vocabulary.publicMobile, "LAND", beliefPositions.orchid, [[vocabulary.mobile, 43 + bias], [vocabulary.decoy, 31 - bias / 2], [vocabulary.commercial, 26 - bias / 2]], { heading: opposingTaiwan ? 24 : 202, speedKnots: 11, stationary: false, quality: 34, uncertainty: 64, freshness: 76, deceptionRisk: 67, collateralRisk: 48, stage: "FIX", observedCountermeasures: ["Emission control", "Convoy signature mimicry"] }),
    makeTrack("jade", "JADE CROWN", vocabulary.publicRelay, "LAND", beliefPositions.jade, [[vocabulary.relay, 62], [vocabulary.decoy, 24], [vocabulary.unknown, 14]], { quality: 49, uncertainty: 38, freshness: 81, deceptionRisk: 29, collateralRisk: 66, stage: "FIX", observedCountermeasures: ["Civilian proximity", "Short duration emissions"] }),
    makeTrack("merchant", "MERCHANT ECHO", vocabulary.publicCommercial, "SEA", beliefPositions.merchant, [[vocabulary.commercial, 51], [vocabulary.mobile, 27], [vocabulary.decoy, 22]], { heading: opposingTaiwan ? 252 : 286, speedKnots: 16, stationary: false, quality: 57, uncertainty: 24, freshness: 88, deceptionRisk: 76, collateralRisk: 86, stage: "FIX", observedCountermeasures: ["Commercial traffic blending"] }),
    makeTrack("mirror", "MIRROR FIELD", vocabulary.publicDecoy, "LAND", beliefPositions.mirror, [[vocabulary.mobile, 49], [vocabulary.decoy, 37], [vocabulary.unknown, 14]], { heading: opposingTaiwan ? 315 : 134, speedKnots: 7, stationary: false, quality: 46, uncertainty: 31, freshness: 79, deceptionRisk: 72, collateralRisk: 19, stage: "FIX", observedCountermeasures: ["High fidelity signature replication"] })
  ];
  const truth: Truth[] = opposingTaiwan
    ? [
        { id: "orchid", actualLabel: vocabulary.mobile, kind: "REAL", position: [121.36, 24.79], route: [[121.36, 24.79], [121.53, 24.62], [121.69, 24.47], [121.46, 24.35], [121.27, 24.57]], routeIndex: 1, loopRoute: true, heading: 142, speedKnots: 13, stationary: false, concealment: 58, defense: 54, mobility: 44, density: 47, behavior: "HIDING", functions: { sense: 78, command: 71, move: 86, act: 82, sustain: 68 } },
        { id: "jade", actualLabel: vocabulary.relay, kind: "REAL", position: [121.61, 23.99], route: [[121.61, 23.99]], routeIndex: 0, loopRoute: false, heading: 0, speedKnots: 0, stationary: true, concealment: 41, defense: 77, mobility: 21, density: 72, behavior: "EMITTING", functions: { sense: 91, command: 88, move: 45, act: 66, sustain: 74 } },
        { id: "merchant", actualLabel: vocabulary.commercial, kind: "CIVILIAN", position: [123.76, 24.58], route: [[123.76, 24.58], [122.95, 24.42], [122.10, 24.18], [121.48, 23.98], [123.18, 24.37], [124.24, 24.76]], routeIndex: 1, loopRoute: true, heading: 252, speedKnots: 16, stationary: false, concealment: 32, defense: 5, mobility: 35, density: 92, behavior: "MOVING", functions: { sense: 15, command: 26, move: 93, act: 0, sustain: 84 } },
        { id: "mirror", actualLabel: vocabulary.decoy, kind: "DECOY", position: [121.11, 23.62], route: [[121.11, 23.62], [121.27, 23.78], [121.02, 23.86], [120.92, 23.66]], routeIndex: 1, loopRoute: true, heading: 44, speedKnots: 8, stationary: false, concealment: 79, defense: 9, mobility: 28, density: 14, behavior: "EMITTING", functions: { sense: 8, command: 12, move: 62, act: 4, sustain: 41 } }
      ]
    : [
        { id: "orchid", actualLabel: vocabulary.mobile, kind: "REAL", position: [119.78, 25.08], route: [[119.78, 25.08], [119.57, 24.87], [119.33, 24.72], [119.18, 24.91], [119.43, 25.16]], routeIndex: 1, loopRoute: true, heading: 222, speedKnots: 13, stationary: false, concealment: 58, defense: 54, mobility: 44, density: 47, behavior: "HIDING", functions: { sense: 78, command: 71, move: 86, act: 82, sustain: 68 } },
        { id: "jade", actualLabel: vocabulary.relay, kind: "REAL", position: [119.20, 24.30], route: [[119.20, 24.30]], routeIndex: 0, loopRoute: false, heading: 0, speedKnots: 0, stationary: true, concealment: 41, defense: 77, mobility: 21, density: 72, behavior: "EMITTING", functions: { sense: 91, command: 88, move: 45, act: 66, sustain: 74 } },
        { id: "merchant", actualLabel: vocabulary.commercial, kind: "CIVILIAN", position: [120.60, 24.12], route: [[120.60, 24.12], [119.82, 24.38], [118.95, 24.72], [117.90, 25.18], [121.64, 24.02], [123.30, 23.45]], routeIndex: 1, loopRoute: true, heading: 290, speedKnots: 16, stationary: false, concealment: 32, defense: 5, mobility: 35, density: 92, behavior: "MOVING", functions: { sense: 15, command: 26, move: 93, act: 0, sustain: 84 } },
        { id: "mirror", actualLabel: vocabulary.decoy, kind: "DECOY", position: [119.92, 24.80], route: [[119.92, 24.80], [120.08, 24.69], [119.87, 24.54], [119.68, 24.71]], routeIndex: 1, loopRoute: true, heading: 126, speedKnots: 8, stationary: false, concealment: 79, defense: 9, mobility: 28, density: 14, behavior: "EMITTING", functions: { sense: 8, command: 12, move: 62, act: 4, sustain: 41 } }
      ];
  let sim: Sim = {
    scenarioId: scenario.id,
    faction,
    factionName: profile.name,
    seed,
    serial: 6,
    minute: 1060,
    elapsedMinute: 0,
    paused: true,
    speed: 1,
    phase: "COERCION",
    selected: "orchid",
    tracks,
    observations: [],
    truth,
    units: makeUnits(faction),
    sensors: makeSensors(faction),
    collectionTasks: [],
    effectors: makeEffectors(faction),
    operations: [],
    reservations: {},
    commandLinks: [
      { id: "cmd1", from: "Theater command", to: "Mission cell", integrity: 88, capacity: 72, latency: 4, active: true },
      { id: "cmd2", from: "Mission cell", to: "Effectors", integrity: 76, capacity: 61, latency: 6, active: true },
      { id: "cmd3", from: "Coalition network", to: "Mission cell", integrity: 69, capacity: 48, latency: 9, active: true }
    ],
    ...profile.resources,
    escalation: 31,
    exposure: 12,
    adversaryTempo: 62,
    shippingThroughput: 61,
    civilianAccess: 46,
    continuity: 84,
    decisionPoints: 3,
    doctrineCooldowns: {},
    events: [
      { id: "EV.6", minute: 1055, elapsedMinute: 0, severity: "WATCH", title: "DECLARED END WINDOW APPROACHING", detail: "The published live fire window closes at 18:00. No coordinated drawdown indicators have been observed.", category: "COMMAND" },
      { id: "EV.5", minute: 1045, elapsedMinute: 0, severity: "WATCH", title: "COAST GUARD PATROL ARCS LINKED", detail: "Separate northern, eastern, southern, and western white hull patrols now form a continuous circuit around Taiwan. Seven hull identities are supported by public reporting while the peak presence is assessed at fifteen vessels.", category: "INTEL" },
      { id: "EV.4", minute: 1030, elapsedMinute: 0, severity: "INFO", title: "AMPHIBIOUS GROUP IDENTITY IMPROVED", detail: "Hainan, hull 31, is identified as the central ship in the four ship group east and southeast of Taiwan. Three associated ships remain unresolved.", category: "INTEL" },
      { id: "EV.3", minute: 900, elapsedMinute: 0, severity: "WATCH", title: "AFTERNOON AIR AND MARITIME SURGE", detail: "Military aviation, naval patrols, and coast guard activity continue around the declared operating areas.", category: "INTEL" },
      { id: "EV.2", minute: 540, elapsedMinute: 0, severity: "CRITICAL", title: "COASTAL ROCKET FIRINGS REPORTED", detail: "Long range fires from Fujian have entered the northern and southwestern exercise areas. Some trajectories approach Taiwan's contiguous zone.", category: "INTEL" },
      { id: "EV.1", minute: 480, elapsedMinute: 0, severity: "INFO", title: "FIVE LIVE FIRE AREAS ACTIVATED", detail: "The published Justice Mission geometry now constrains northern, western, southern, and eastern civil access routes.", category: "POLITICAL" }
    ]
  };
  const bootstrap: Observation[] = [
    { id: "OBS.B1", taskId: "BASELINE", targetId: "orchid", sensorId: "partner", source: profile.sensorNames[3], correlationKey: "PARTNER NET", collectedAt: 1002, availableAt: 1007, reliability: 58, supports: vocabulary.mobile, strength: 7, features: ["Unusual convoy spacing", "Possible military support vehicles"], observedPosition: tracks[0].position, observedHeading: tracks[0].heading, observedSpeedKnots: tracks[0].speedKnots, observedStationary: tracks[0].stationary, observedBehavior: "HIDING", locationUncertainty: tracks[0].uncertainty, delivered: true, purpose: "IDENTIFY" },
    { id: "OBS.B2", taskId: "BASELINE", targetId: "jade", sensorId: "sigint", source: profile.sensorNames[1], correlationKey: "THEATER SIGINT", collectedAt: 1025, availableAt: 1035, reliability: 74, supports: vocabulary.relay, strength: 10, features: ["Short duration network activity", "Distributed relay behavior"], observedPosition: tracks[1].position, observedHeading: tracks[1].heading, observedSpeedKnots: tracks[1].speedKnots, observedStationary: tracks[1].stationary, observedBehavior: "EMITTING", locationUncertainty: tracks[1].uncertainty, delivered: true, purpose: "IDENTIFY" },
    { id: "OBS.B3", taskId: "BASELINE", targetId: "merchant", sensorId: "partner", source: profile.sensorNames[3], correlationKey: "PARTNER NET", collectedAt: 1038, availableAt: 1042, reliability: 58, supports: vocabulary.commercial, strength: 8, features: ["Commercial routing pattern", "Mixed registry reporting"], observedPosition: tracks[2].position, observedHeading: tracks[2].heading, observedSpeedKnots: tracks[2].speedKnots, observedStationary: tracks[2].stationary, observedBehavior: "MOVING", locationUncertainty: tracks[2].uncertainty, delivered: true, purpose: "IDENTIFY" },
    { id: "OBS.B4", taskId: "BASELINE", targetId: "mirror", sensorId: "sigint", source: profile.sensorNames[1], correlationKey: "THEATER SIGINT", collectedAt: 1049, availableAt: 1057, reliability: 74, supports: vocabulary.mobile, strength: 9, features: ["Intermittent military like emissions"], observedPosition: tracks[3].position, observedHeading: tracks[3].heading, observedSpeedKnots: tracks[3].speedKnots, observedStationary: tracks[3].stationary, observedBehavior: "EMITTING", locationUncertainty: tracks[3].uncertainty, delivered: true, purpose: "IDENTIFY" }
  ];
  sim = {
    ...sim,
    observations: bootstrap,
    tracks: sim.tracks.map(track => {
      const baseline = bootstrap.find(observation => observation.targetId === track.id);
      return {
        ...track,
        evidence: bootstrap.filter(observation => observation.targetId === track.id).map(observation => observation.id),
        custodyAt: baseline?.collectedAt ?? 0,
        lastObservedAt: baseline?.collectedAt ?? 0
      };
    })
  };
  return sim;
}

export function pipelineLoad(sim: Sim) {
  const active = sim.collectionTasks.filter(task => task.status !== "COMPLETE");
  const ingest = active.filter(task => task.status === "TRANSMITTING").length * 17;
  const processing = active.filter(task => task.status === "PROCESSING").reduce((sum, task) => sum + (sim.sensors.find(sensor => sensor.id === task.sensorId)?.computeCost ?? 0), 0);
  const analyst = (active.length * 13 + sim.tracks.filter(track => track.stage === "TRACK").length * 9) / Math.max(1, sim.analystAttention) * 100;
  return {
    active: active.length,
    ingest: clamp(ingest / Math.max(1, sim.bandwidth) * 100),
    processing: clamp(processing / Math.max(1, sim.compute) * 100),
    analyst: clamp(analyst),
    choke: ingest > sim.bandwidth || processing > sim.compute || analyst > 100 || sim.storage < 8
  };
}

export interface CollectionRecommendation {
  sensorId: string;
  score: number;
  deliveryAt: number;
  expectedConfidence: number;
  independent: boolean;
  ready: boolean;
  available: boolean;
  reason: string;
}

export function collectionRecommendations(sim: Sim, purpose: TaskPurpose = "IDENTIFY", targetId = sim.selected): CollectionRecommendation[] {
  const target = sim.tracks.find(item => item.id === targetId);
  if (!target) return [];
  const deliveredGroups = new Set(target.evidence.map(id => sim.observations.find(observation => observation.id === id)?.correlationKey).filter(Boolean));
  return sim.sensors.map(sensor => {
    const independent = !deliveredGroups.has(sensor.correlationKey);
    const purposeValue = purpose === "CUSTODY"
      ? sensor.custody * 1.35 + sensor.precision
      : purpose === "BDA"
        ? sensor.reliability * .28 + sensor.precision * 1.25 + sensor.aame * 5
        : sensor.classification * 1.7 + sensor.reliability * .24 + sensor.precision * .45;
    const expectedConfidence = Math.round(clamp(purposeValue * (independent ? 1 : .38) - sensor.falseAlarm * .18, 1, 35));
    const ready = sensor.readyAt <= sim.minute;
    const available = ready
      && sim.bandwidth >= sensor.bandwidthCost
      && sim.compute >= sensor.computeCost * .5
      && sim.analystAttention >= 5
      && sim.storage >= 8;
    const deliveryAt = Math.max(sim.minute, sensor.readyAt) + sensor.collectTime + sensor.latency + pipelineLoad(sim).active * 6;
    const score = Math.round(expectedConfidence * 3 - (deliveryAt - sim.minute) * .34 - sensor.bandwidthCost * .22 + (independent ? 12 : 0));
    const reason = !ready
      ? `Committed until ${formatTime(sensor.readyAt)}`
      : !available
        ? "Data or analyst capacity is insufficient"
        : independent
          ? "Adds an independent source and reduces uncertainty"
          : "Fast corroboration, but the source chain is correlated";
    return { sensorId: sensor.id, score, deliveryAt, expectedConfidence, independent, ready, available, reason };
  }).sort((a, b) => Number(b.available) - Number(a.available) || b.score - a.score);
}

export function taskCollection(sim: Sim, sensorId: string, purpose: TaskPurpose = "IDENTIFY"): Sim {
  const sensor = sim.sensors.find(item => item.id === sensorId);
  const target = sim.tracks.find(item => item.id === sim.selected);
  if (!sensor || !target) return sim;
  if (!["IDENTIFY", "CUSTODY", "BDA"].includes(purpose)) return addEvent(sim, "CRITICAL", "INVALID COLLECTION REQUEST", "The requested intelligence purpose is not recognized.", "INTEL");
  if (target.status === "CLOSED" && purpose !== "BDA") return addEvent(sim, "WATCH", "COLLECTION NOT REQUIRED", "This intelligence problem is already closed. Reopen it before assigning more collection.", "INTEL");
  if (sensor.readyAt > sim.minute) return addEvent(sim, "CRITICAL", "SENSOR UNAVAILABLE", `${sensor.name} cannot revisit this area for ${sensor.readyAt - sim.minute} minutes.`, "INTEL");
  if (sim.bandwidth < sensor.bandwidthCost || sim.compute < sensor.computeCost * .5 || sim.analystAttention < 5 || sim.storage < 8) return addEvent(sim, "CRITICAL", "COLLECTION PIPELINE SATURATED", "Insufficient communications, processing, storage, or analyst capacity remains for this task.", "INTEL");
  if (purpose === "BDA") {
    const operation = sim.operations.find(item => item.targetId === target.id && item.status === "ASSESSMENT");
    if (!operation) return addEvent(sim, "CRITICAL", "ASSESSMENT NOT AVAILABLE", "No completed effects window requires assessment.", "EFFECTS");
    const existingTask = operation.bdaTaskId ? sim.collectionTasks.find(item => item.id === operation.bdaTaskId) : undefined;
    if (existingTask && existingTask.status !== "COMPLETE") return addEvent(sim, "WATCH", "ASSESSMENT ALREADY TASKED", "A combat assessment collection is already scheduled for this operation.", "EFFECTS");
    if (target.assessment?.provisional && target.assessment.sourceGroups.includes(sensor.correlationKey)) {
      return addEvent(sim, "WATCH", "INDEPENDENT SOURCE REQUIRED", "A second report from the same source group cannot close combat assessment.", "EFFECTS");
    }
  }
  const queue = sim.collectionTasks.filter(task => task.status === "PROCESSING").length;
  const overloadDelay = Math.ceil(queue * 6 + Math.max(0, pipelineLoad(sim).processing - 75) / 5);
  const serial = sim.serial + 1;
  const task: CollectionTask = {
    id: `TASK.${serial}`,
    sensorId,
    targetId: target.id,
    purpose,
    requestedAt: sim.minute,
    collectAt: sim.minute + sensor.collectTime,
    availableAt: sim.minute + sensor.collectTime + sensor.latency + overloadDelay,
    status: "COLLECTING"
  };
  let next: Sim = {
    ...sim,
    serial,
    collectionTasks: [task, ...sim.collectionTasks],
    sensors: sim.sensors.map(item => item.id === sensorId ? { ...item, readyAt: task.collectAt + sensor.revisit } : item),
    bandwidth: clamp(sim.bandwidth - sensor.bandwidthCost * .18),
    compute: clamp(sim.compute - sensor.computeCost * .1),
    analystAttention: clamp(sim.analystAttention - 2),
    storage: clamp(sim.storage - Math.max(1, sensor.computeCost * .025)),
    exposure: clamp(sim.exposure + (sensor.id === "uav" ? 15 : sensor.id === "sigint" ? 8 : sensor.id === "cyber" ? 11 : 4)),
    operations: purpose === "BDA" ? sim.operations.map(item => item.targetId === target.id && item.status === "ASSESSMENT" ? { ...item, bdaTaskId: task.id } : item) : sim.operations
  };
  next = addEvent(next, "INFO", "COLLECTION TASK ACCEPTED", `${sensor.name} will collect in ${sensor.collectTime} minutes. Processed intelligence is expected at ${formatTime(task.availableAt)}.`, "INTEL");
  return next;
}

export function cancelCollectionTask(sim: Sim, taskId: string): Sim {
  const task = sim.collectionTasks.find(item => item.id === taskId);
  if (!task || task.status === "COMPLETE") return sim;
  const sensor = sim.sensors.find(item => item.id === task.sensorId);
  if (!sensor) return sim;
  let next: Sim = {
    ...sim,
    collectionTasks: sim.collectionTasks.filter(item => item.id !== taskId),
    observations: sim.observations.filter(observation => observation.taskId !== taskId || observation.delivered),
    bandwidth: clamp(sim.bandwidth + sensor.bandwidthCost * .1),
    compute: clamp(sim.compute + sensor.computeCost * .06),
    analystAttention: clamp(sim.analystAttention + 1),
    storage: clamp(sim.storage + sensor.computeCost * .015),
    sensors: sim.sensors.map(item => item.id === sensor.id && task.status === "COLLECTING"
      ? { ...item, readyAt: Math.min(item.readyAt, sim.minute + 2) }
      : item)
  };
  next = addEvent(next, "WATCH", "COLLECTION TASK CANCELLED", `${sensor.name} was removed from the queue. Only unused processing capacity was recovered.`, "INTEL");
  return next;
}

const normalizeHypotheses = (hypotheses: Hypothesis[]) => {
  const total = hypotheses.reduce((sum, item) => sum + Math.max(2, item.probability), 0);
  const rounded = hypotheses.map(item => ({ ...item, probability: Math.round(Math.max(2, item.probability) / total * 100) }));
  const delta = 100 - rounded.reduce((sum, item) => sum + item.probability, 0);
  if (rounded[0]) rounded[0].probability += delta;
  return rounded.sort((a, b) => b.probability - a.probability);
};

const generateObservation = (sim: Sim, task: CollectionTask): [Observation, number] => {
  const sensor = sim.sensors.find(item => item.id === task.sensorId)!;
  const truth = sim.truth.find(item => item.id === task.targetId)!;
  const track = sim.tracks.find(item => item.id === task.targetId)!;
  const [roll, seedA] = seeded(sim.seed);
  const [noise, seedB] = seeded(seedA);
  const accreditationAdjustment = (sensor.aame - 2.5) * 3.5;
  const correctThreshold = sensor.reliability + accreditationAdjustment - truth.concealment * .24 - sensor.falseAlarm * .18 - (truth.behavior === "JAMMING" ? 18 : 0);
  const correct = roll * 100 < correctThreshold;
  let supports = task.purpose === "CUSTODY" ? topHypothesis(track).label : correct ? truth.actualLabel : topHypothesis(track).label;
  if (truth.kind === "DECOY" && !correct) supports = topHypothesis(track).label;
  const contradicts = correct && supports !== topHypothesis(track).label ? topHypothesis(track).label : undefined;
  const strength = clamp(
    (task.purpose === "CUSTODY" ? sensor.custody * .42 : sensor.classification)
      + sensor.reliability * .08
      + accreditationAdjustment * .3
      - truth.concealment * .05
      + noise * 4,
    3,
    24
  );
  const baseline = truth.preEffectFunctions ?? truth.functions;
  const baselineFunction = Object.values(baseline).reduce((sum, value) => sum + value, 0) / 5;
  const currentFunction = Object.values(truth.functions).reduce((sum, value) => sum + value, 0) / 5;
  const functionLoss = Math.max(0, baselineFunction - currentFunction);
  const bdaFeatures = functionLoss >= 36
    ? ["No coordinated movement observed", "Sustained loss of expected activity", "No visible recovery pattern"]
    : functionLoss >= 14
      ? ["Reduced activity at several functional nodes", "Intermittent movement and communications", "Possible field repair behavior"]
      : ["Continued coordinated movement", "Expected network activity persists", "No durable loss of function observed"];
  const custodyFeatures = [
    truth.behavior === "MOVING" ? "Movement correlation maintained across the collection window" : "Stationary pattern remains inside the uncertainty region",
    truth.behavior === "JAMMING" ? "Interference reduced location precision" : "Position estimate updated from persistent observations"
  ];
  const identityFeatures = correct
    ? truth.kind === "DECOY"
      ? ["Geometry inconsistent with operational equipment", "Movement pattern lacks supporting activity"]
      : truth.kind === "CIVILIAN"
        ? ["Routing matches commercial traffic", "No coherent military support pattern"]
        : ["Behavior matches a coordinated military formation", truth.behavior === "EMITTING" ? "Short duration network activity observed" : "Emission discipline limits classification"]
    : ["Low signal to noise ratio", "Automated inference requires analyst confirmation"];
  const observation: Observation = {
    id: `OBS.${task.id}`,
    taskId: task.id,
    targetId: task.targetId,
    sensorId: task.sensorId,
    source: sensor.name,
    correlationKey: sensor.correlationKey,
    collectedAt: task.collectAt,
    availableAt: task.availableAt,
    reliability: sensor.reliability,
    supports,
    contradicts,
    strength,
    features: task.purpose === "BDA" ? bdaFeatures : task.purpose === "CUSTODY" ? custodyFeatures : identityFeatures,
    observedPosition: truth.position,
    observedHeading: truth.heading,
    observedSpeedKnots: truth.speedKnots,
    observedStationary: truth.stationary,
    observedBehavior: truth.behavior,
    locationUncertainty: clamp(100 - sensor.precision + (truth.behavior === "JAMMING" ? 28 : 0), 3, 100),
    delivered: false,
    purpose: task.purpose
  };
  return [observation, seedB];
};

const deriveStage = (sim: Sim, track: Track): Stage => {
  const top = topHypothesis(track);
  const groups = independentGroups(sim, track);
  if (track.nominatedAt !== undefined) return track.stage;
  if (track.evidence.length < 1) return "FIND";
  if (top.probability < 58 || track.uncertainty > 58) return "FIX";
  if (track.quality >= 48 && track.freshness >= 58 && groups >= 2) return "TRACK";
  return "FIX";
};

export function assessmentEffectOutcome(assessment: Assessment, effect: DesiredEffect) {
  const achieved = effect === "DESTROY"
    ? assessment.physical >= 65 && assessment.functional >= 70
    : effect === "DISABLE"
      ? assessment.functional >= 65
      : effect === "DISRUPT"
        ? assessment.functional >= 45
        : assessment.functional >= 35;
  const partial = !achieved && (assessment.physical >= 35 || assessment.functional >= 35);
  return {
    achieved,
    partial,
    label: achieved ? `${effect} effect confirmed` : partial ? `Partial effect only, ${effect} not achieved` : `${effect} effect not confirmed`,
    detail: effect === "DESTROY"
      ? `Destroy requires at least 65 physical and 70 functional effect. Current assessment is ${assessment.physical} physical and ${assessment.functional} functional.`
      : `${effect} is evaluated against functional effect. Current functional assessment is ${assessment.functional}.`
  };
}

const applyBda = (sim: Sim, track: Track, observation: Observation): Track => {
  const sensorConfidence = clamp(observation.reliability - sim.exposure * .12);
  const severe = observation.features.some(item => item.includes("Sustained loss"));
  const partial = observation.features.some(item => item.includes("Reduced activity"));
  const functional = severe ? 82 : partial ? 53 : 0;
  const physical = severe ? 68 : partial ? 41 : 0;
  const collateral = severe || partial ? clamp(track.collateralRisk * .36 + (observation.features.some(item => item.includes("recovery")) ? 4 : 0)) : 0;
  const confidence = Math.round(clamp(sensorConfidence * .82 + observation.strength));
  const conclusion = severe
    ? "Probable mission effect. Independent confirmation is required before this assessment can close."
    : partial
      ? "Partial or temporary effect. Remaining functions may still support the wider network."
      : "No durable mission effect confirmed. Silence, concealment, and recovery remain competing explanations.";
  const sourceGroups = [...new Set([...(track.assessment?.sourceGroups ?? []), observation.correlationKey])];
  const provisional = sourceGroups.length < 2;
  const previousEvidence = track.assessment?.evidence ?? [];
  return {
    ...track,
    position: observation.observedPosition,
    heading: observation.observedHeading,
    speedKnots: observation.observedSpeedKnots,
    stationary: observation.observedStationary,
    history: distanceNm(track.position, observation.observedPosition) > .02
      ? [...track.history, observation.observedPosition].slice(-24)
      : track.history,
    lastObservedAt: observation.collectedAt,
    evidence: [...track.evidence, observation.id],
    status: provisional ? "ASSESSING" : "CLOSED",
    stage: "ASSESS",
    assessment: {
      physical: track.assessment ? Math.round((track.assessment.physical + physical) / 2) : physical,
      functional: track.assessment ? Math.round((track.assessment.functional + functional) / 2) : functional,
      collateral: track.assessment ? Math.round((track.assessment.collateral + collateral) / 2) : collateral,
      confidence: track.assessment ? Math.round(clamp((track.assessment.confidence + confidence) / 2 + 9)) : confidence,
      conclusion: provisional ? conclusion : severe ? "Independent sources support a probable durable mission effect." : partial ? "Independent sources support a partial or temporary mission effect." : "Independent sources do not confirm a durable mission effect.",
      evidence: [...new Set([...previousEvidence, ...observation.features])],
      sourceGroups,
      provisional,
      completedAt: sim.minute
    }
  };
};

const applyObservation = (sim: Sim, observation: Observation): Sim => {
  const target = sim.tracks.find(item => item.id === observation.targetId);
  const sensor = sim.sensors.find(item => item.id === observation.sensorId);
  if (!target || !sensor) return sim;
  if (observation.purpose === "BDA") {
    const updated = applyBda(sim, target, observation);
    let next = {
      ...sim,
      tracks: sim.tracks.map(item => item.id === target.id ? updated : item),
      operations: sim.operations.map(item => item.targetId === target.id && item.status === "ASSESSMENT"
        ? { ...item, bdaTaskId: updated.assessment?.provisional ? undefined : item.bdaTaskId, status: updated.assessment?.provisional ? "ASSESSMENT" as const : "COMPLETE" as const }
        : item)
    };
    next = addEvent(next, updated.assessment!.provisional ? "WATCH" : updated.assessment!.functional > 70 ? "SUCCESS" : "INFO", updated.assessment!.provisional ? "PROVISIONAL ASSESSMENT" : "COMBAT ASSESSMENT CLOSED", updated.assessment!.conclusion, "EFFECTS");
    return next;
  }
  const correlated = target.evidence.some(id => sim.observations.find(item => item.id === id)?.correlationKey === observation.correlationKey);
  const purposeMultiplier = observation.purpose === "CUSTODY" ? .42 : 1;
  const gain = observation.strength * purposeMultiplier * (correlated ? .28 : 1);
  const hypotheses = normalizeHypotheses(target.hypotheses.map(item => {
    if (item.label === observation.supports) return { ...item, probability: item.probability + gain, trend: "UP" as const };
    if (item.label === observation.contradicts) return { ...item, probability: item.probability - gain * .8, trend: "DOWN" as const };
    return { ...item, probability: item.probability - gain / Math.max(3, target.hypotheses.length * 2), trend: "FLAT" as const };
  }));
  const custodyMultiplier = observation.purpose === "CUSTODY" ? 1.35 : 1;
  const quality = clamp(target.quality + sensor.custody * custodyMultiplier - (observation.observedBehavior === "JAMMING" ? 9 : 0));
  const uncertainty = clamp(target.uncertainty - sensor.precision * custodyMultiplier * (correlated ? .36 : .82), 3, 240);
  const correctedPosition: Coordinate = [
    target.position[0] + (observation.observedPosition[0] - target.position[0]) * (correlated ? .24 : .53),
    target.position[1] + (observation.observedPosition[1] - target.position[1]) * (correlated ? .24 : .53)
  ];
  const provisional: Track = {
    ...target,
    position: correctedPosition,
    heading: observation.observedHeading,
    speedKnots: observation.observedSpeedKnots,
    stationary: observation.observedStationary,
    history: [...target.history, correctedPosition].slice(-24),
    lastObservedAt: observation.collectedAt,
    hypotheses,
    evidence: [...target.evidence, observation.id],
    quality,
    uncertainty,
    freshness: 100,
    custodyAt: observation.collectedAt,
    status: "ACTIVE",
    deceptionRisk: clamp(target.deceptionRisk + (/decoy|deception|signature replication/i.test(observation.supports) ? 9 : correlated ? 2 : -4))
  };
  provisional.stage = deriveStage({ ...sim, observations: sim.observations.map(item => item.id === observation.id ? { ...item, delivered: true } : item) }, provisional);
  let next: Sim = { ...sim, tracks: sim.tracks.map(item => item.id === target.id ? provisional : item) };
  next = addEvent(next, correlated ? "WATCH" : "SUCCESS", correlated ? "CORRELATED REPORT DISCOUNTED" : "INDEPENDENT EVIDENCE FUSED", `${observation.source} supports ${observation.supports}. ${correlated ? "Its confidence contribution was reduced because the source chain was not independent." : "The target hypothesis and location estimate were updated."}`, "INTEL");
  for (const operation of next.operations.filter(item => item.targetId === target.id && ["PLANNED", "AUTHORIZED"].includes(item.status) && item.evidenceVersion !== provisional.evidence.length)) {
    next = abortOperation(next, operation, "New intelligence invalidated the package assumptions");
  }
  return next;
};

export interface GateStatus {
  passed: boolean;
  label: string;
  detail: string;
}

export function nominationGates(sim: Sim, targetId = sim.selected): GateStatus[] {
  const track = sim.tracks.find(item => item.id === targetId);
  if (!track) return [{ passed: false, label: "Valid track", detail: "The selected track does not exist" }];
  const top = topHypothesis(track);
  const groups = independentGroups(sim, track);
  return [
    { passed: track.status === "ACTIVE", label: "Current track", detail: `${track.status} / active track required` },
    { passed: track.stage === "TRACK" || track.stage === "TARGET" || track.stage === "ENGAGE", label: "Kill chain maturity", detail: `${track.stage} / track stage required` },
    { passed: top.probability >= 58, label: "Identity confidence", detail: `${top.probability}% / 58% required` },
    { passed: track.quality >= 48, label: "Track custody", detail: `${Math.round(track.quality)} / 48 required` },
    { passed: track.freshness >= 58, label: "Evidence freshness", detail: `${Math.round(track.freshness)}% / 58% required` },
    { passed: sim.minute - track.custodyAt <= 32, label: "Custody age", detail: `${Math.max(0, sim.minute - track.custodyAt)} minutes / maximum 32` },
    { passed: track.uncertainty <= 58, label: "Location uncertainty", detail: `±${Math.round(track.uncertainty)} NM / maximum 58` },
    { passed: groups >= 2, label: "Independent evidence", detail: `${groups} / 2 source groups` }
  ];
}

export function releaseGates(sim: Sim, operationId?: string, requireAuthority = false): GateStatus[] {
  const operation = operationId
    ? sim.operations.find(item => item.id === operationId)
    : sim.operations.find(item => item.targetId === sim.selected && !["COMPLETE", "ABORTED"].includes(item.status));
  if (!operation) return [{ passed: false, label: "Effects package", detail: "No active package exists" }];
  const track = sim.tracks.find(item => item.id === operation.targetId);
  if (!track) return [{ passed: false, label: "Target reference", detail: "The package target no longer exists" }];
  const route = requiredCommandRoute(sim);
  const commandIntegrity = route.length ? Math.min(...route.map(link => link.integrity)) : 0;
  const commandCapacity = route.length ? Math.min(...route.map(link => link.capacity)) : 0;
  const effector = sim.effectors.find(item => item.id === operation.effectorId);
  const sourceUnit = effector?.sourceUnitId ? sim.units.find(unit => unit.id === effector.sourceUnitId) : undefined;
  const sourceReady = !effector?.sourceUnitId || Boolean(
    sourceUnit
    && sourceUnit.movement !== "DISABLED"
    && sourceUnit.fuel >= 25
    && sourceUnit.readiness >= 45
  );
  const authorityValid = !!operation.authority
    && sim.minute <= operation.authority.expiresAt
    && operation.authority.evidenceVersion === track.evidence.length;
  return [
    ...nominationGates(sim, track.id),
    { passed: operation.evidenceVersion === track.evidence.length, label: "Stable evidence record", detail: `${track.evidence.length} current reports / package based on ${operation.evidenceVersion}` },
    { passed: Boolean(effector) && sourceReady, label: "Delivery platform", detail: effector ? sourceReady ? `${sourceUnit?.callsign ?? effector.platform} remains ready` : `${effector.platform} is unavailable at release` : "Package effector no longer exists" },
    { passed: route.length === 2, label: "Command route", detail: route.length === 2 ? `${Math.round(commandIntegrity)}% integrity · ${Math.round(commandCapacity)} capacity` : "Required theater and mission links are not available" },
    { passed: operation.estimate.collateral <= 64, label: "Collateral guidance", detail: `${operation.estimate.collateral}% / maximum 64%` },
    ...(requireAuthority ? [{ passed: authorityValid, label: "Bounded authority", detail: operation.authority ? `Valid through ${formatTime(operation.authority.expiresAt)}` : "Human authorization has not been granted" }] : [])
  ];
}

export function nominateTarget(sim: Sim): Sim {
  const track = sim.tracks.find(item => item.id === sim.selected);
  if (!track) return sim;
  const gates = nominationGates(sim, track.id);
  const failed = gates.filter(item => !item.passed);
  if (failed.length) return addEvent(sim, "CRITICAL", "NOMINATION WITHHELD", failed.map(item => item.label).join(", ") + " remain below threshold.", "COMMAND");
  const updated: Track = { ...track, stage: "TARGET", nominatedAt: sim.minute };
  let next: Sim = { ...sim, tracks: sim.tracks.map(item => item.id === track.id ? updated : item), analystAttention: clamp(sim.analystAttention - 5) };
  next = addEvent(next, "SUCCESS", "TARGET NOMINATED", `${track.callsign} entered deliberate target development. This is not release authority.`, "COMMAND");
  return next;
}

export const defaultWeights: PackageWeights = { effect: 28, time: 16, distance: 8, fuel: 8, inventory: 8, collateral: 18, platformRisk: 8, escalation: 6 };

export const effectorOrigin = (sim: Pick<Sim, "units">, effector: Effector): Coordinate =>
  effector.sourceUnitId
    ? sim.units.find(unit => unit.id === effector.sourceUnitId)?.position ?? effector.position
    : effector.position;

const supportBurden = (supports: string[]) => ({
  logistics: supports.reduce((sum, support) => sum + (
    support === "TANKER SUPPORT" ? 8
      : support === "ELECTRONIC ATTACK" ? 6
        : support === "CYBER ISOLATION" ? 5
          : 3
  ), 0),
  coordination: supports.reduce((sum, support) => sum + (
    support === "TANKER SUPPORT" ? 9
      : support === "ELECTRONIC ATTACK" ? 7
        : support === "CYBER ISOLATION" ? 8
          : 4
  ), 0),
  exposure: supports.reduce((sum, support) => sum + (
    support === "ELECTRONIC ATTACK" ? 8
      : support === "CYBER ISOLATION" ? 4
        : support === "TANKER SUPPORT" ? 3
          : 1
  ), 0)
});

export function estimatePackage(sim: Sim, effectorId: string, effect: DesiredEffect, supports: string[], weights: PackageWeights = defaultWeights): PackageEstimate {
  const track = sim.tracks.find(item => item.id === sim.selected);
  const effector = sim.effectors.find(item => item.id === effectorId);
  const validEffect = ["SUPPRESS", "DISRUPT", "DISABLE", "DESTROY"].includes(effect);
  const validSupports = supports.every(item => SUPPORTS.includes(item as typeof SUPPORTS[number])) && new Set(supports).size === supports.length;
  const validWeights = Object.values(weights).every(value => Number.isFinite(value) && value >= 0);
  if (!track || !effector || !validEffect || !validSupports || !validWeights) {
    return {
      effectorId,
      score: 0,
      effect: 0,
      collateral: 100,
      timeToTarget: 0,
      distance: 0,
      platformRisk: 100,
      escalation: 100,
      inRange: false,
      available: false,
      checks: [{ passed: false, label: !track ? "Target reference is invalid" : !effector ? "Effector reference is invalid" : !validEffect ? "Desired effect is invalid" : !validSupports ? "Support package contains invalid or duplicate assets" : "Recommendation weights are invalid" }],
      reasons: [!track ? "Target reference is invalid" : !effector ? "Effector reference is invalid" : !validEffect ? "Desired effect is invalid" : !validSupports ? "Support package contains invalid or duplicate assets" : "Recommendation weights are invalid"]
    };
  }
  const sourceUnit = effector.sourceUnitId ? sim.units.find(unit => unit.id === effector.sourceUnitId) : undefined;
  const origin = effectorOrigin(sim, effector);
  const distance = distanceNm(origin, track.position);
  const burden = supportBurden(supports);
  const tanker = sim.units.find(unit => unit.kind === "TANKER"
    && unit.affiliation !== "CIVILIAN"
    && unit.fuel >= 35
    && unit.readiness >= 50
    && unit.movement !== "DISABLED"
    && distanceNm(unit.position, origin) <= 650);
  const tankerAvailable = Boolean(tanker);
  const tankerSupportValid = !supports.includes("TANKER SUPPORT") || tankerAvailable;
  const extendedReach = effector.reach + (supports.includes("TANKER SUPPORT") && tankerAvailable ? 110 : 0);
  const inRange = distance <= extendedReach;
  const compatible = effector.compatible.includes(effect);
  const domainCompatible = effector.targetDomains.includes(track.domain);
  const sourceReady = !effector.sourceUnitId || Boolean(
    sourceUnit
    && sourceUnit.movement !== "DISABLED"
    && sourceUnit.fuel >= 25
    && sourceUnit.readiness >= 45
  );
  const sourceAsset = effector.sourceUnitId ? `UNIT:${effector.sourceUnitId}` : undefined;
  const conflicts = [...effector.assets, ...(sourceAsset ? [sourceAsset] : []), ...supports].filter(asset => sim.reservations[asset]);
  const commandRoute = requiredCommandRoute(sim);
  const commandIntegrity = commandRoute.length ? Math.min(...commandRoute.map(link => link.integrity)) : 0;
  const effectValue = clamp(
    effector.effect
      + (supports.includes("ELECTRONIC ATTACK") ? 7 : 0)
      + (supports.includes("CYBER ISOLATION") ? effect === "DISRUPT" || effect === "DISABLE" ? 8 : 2 : 0)
      + (supports.includes("PRECISION ISR") ? 4 : 0)
      - track.deceptionRisk * .12
      - track.uncertainty * .15
  );
  const collateral = clamp(effector.collateral + track.collateralRisk * .38 - (supports.includes("PRECISION ISR") ? 9 : 0) + (effect === "DESTROY" ? 12 : effect === "DISABLE" ? 5 : 0));
  const platformRisk = clamp(effector.signature * .42 + sim.exposure * .28 + sim.adversaryTempo * .18 + burden.exposure * .48 - (supports.includes("ELECTRONIC ATTACK") ? 5 : 0));
  const escalation = clamp(effector.escalation + (effect === "DESTROY" ? 13 : effect === "DISABLE" ? 6 : 0) + (supports.includes("CYBER ISOLATION") ? 3 : 0));
  const timeToTarget = effector.transit + commandRoute.reduce((sum, link) => sum + link.latency, 0) + burden.coordination;
  const available = effector.stock >= effector.expenditure
    && effector.readiness >= 45
    && effector.fuel >= 25
    && sourceReady
    && conflicts.length === 0
    && commandIntegrity >= 42
    && sim.logistics >= burden.logistics
    && sim.analystAttention >= supports.length * 2
    && tankerSupportValid
    && compatible
    && domainCompatible;
  const weighted =
    effectValue * weights.effect
    + (100 - Math.min(100, timeToTarget)) * weights.time
    + (100 - Math.min(100, distance / 4)) * weights.distance
    + effector.fuel * weights.fuel
    + Math.min(100, effector.stock * 13) * weights.inventory
    + (100 - collateral) * weights.collateral
    + (100 - platformRisk) * weights.platformRisk
    + (100 - escalation) * weights.escalation;
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const distanceLabel = distance.toFixed(1);
  const checks = [
    { passed: compatible, label: compatible ? `${effect} effect supported` : `${effect} effect is incompatible` },
    { passed: domainCompatible, label: domainCompatible ? `${track.domain} target domain supported` : `${track.domain} target domain is incompatible` },
    { passed: sourceReady, label: sourceReady ? effector.sourceUnitId ? `${sourceUnit?.callsign ?? effector.platform} is ready at the launch point` : "Required access mechanism is ready" : `${effector.platform} is not ready or is not present` },
    { passed: inRange, label: inRange ? `${distanceLabel} NM route is inside supported reach` : `${distanceLabel} NM route exceeds supported reach` },
    { passed: effector.stock >= effector.expenditure, label: effector.stock >= effector.expenditure ? `${effector.expenditure} ${effector.stockLabel} available from ${effector.stock}` : `${effector.expenditure} ${effector.stockLabel} required but only ${effector.stock} remain` },
    { passed: conflicts.length === 0, label: conflicts.length ? `Shared asset conflict: ${conflicts.join(", ")}` : "No shared asset conflict" },
    { passed: commandIntegrity >= 42, label: commandIntegrity >= 42 ? `Command path integrity ${Math.round(commandIntegrity)}%` : "Command path integrity is insufficient" },
    { passed: tankerSupportValid, label: tankerSupportValid ? supports.includes("TANKER SUPPORT") ? `${tanker?.callsign ?? "Named tanker"} can support the route` : "No tanker support requested" : "No ready tanker can support the route" },
    { passed: sim.logistics >= burden.logistics, label: sim.logistics >= burden.logistics ? `${burden.logistics} logistics reserved for support` : `${burden.logistics} logistics required for support` }
  ];
  const reasons = checks.map(check => check.label);
  return { effectorId, score: Math.round(weighted / Math.max(1, totalWeight)), effect: Math.round(effectValue), collateral: Math.round(collateral), timeToTarget, distance, platformRisk: Math.round(platformRisk), escalation: Math.round(escalation), inRange, available: available && inRange, checks, reasons };
}

export function packageRecommendations(sim: Sim, effect: DesiredEffect, supports: string[], weights: PackageWeights = defaultWeights) {
  return sim.effectors.map(effector => estimatePackage(sim, effector.id, effect, supports, weights)).sort((a, b) => Number(b.available) - Number(a.available) || b.score - a.score);
}

export function composePackage(sim: Sim, effectorId: string, effect: DesiredEffect, supports: string[], weights: PackageWeights = defaultWeights): Sim {
  const track = sim.tracks.find(item => item.id === sim.selected);
  if (!track || track.stage !== "TARGET" || track.nominatedAt === undefined) return addEvent(sim, "CRITICAL", "PACKAGE BLOCKED", "Complete target nomination before pairing an effect.", "EFFECTS");
  const existing = sim.operations.find(item => item.targetId === track.id && !["COMPLETE", "ABORTED"].includes(item.status));
  if (existing) return addEvent(sim, "WATCH", "ACTIVE PACKAGE EXISTS", "Cancel or complete the current package before composing another.", "EFFECTS");
  const estimate = estimatePackage(sim, effectorId, effect, supports, weights);
  if (!estimate.available) {
    const blockingReasons = estimate.checks.filter(check => !check.passed).map(check => check.label);
    return addEvent(sim, "CRITICAL", "PACKAGE UNAVAILABLE", (blockingReasons.length ? blockingReasons : estimate.reasons).join(". "), "EFFECTS");
  }
  const effector = sim.effectors.find(item => item.id === effectorId)!;
  const sourceAsset = effector.sourceUnitId ? `UNIT:${effector.sourceUnitId}` : undefined;
  const assets = [...effector.assets, ...(sourceAsset ? [sourceAsset] : []), ...supports];
  const serial = sim.serial + 1;
  const operation: Operation = {
    id: `OP.${serial}`,
    targetId: track.id,
    effect,
    effectorId,
    supports,
    assets,
    estimate,
    version: 1,
    evidenceVersion: track.evidence.length,
    status: "PLANNED"
  };
  let next: Sim = {
    ...sim,
    serial,
    operations: [operation, ...sim.operations],
    reservations: { ...sim.reservations, ...Object.fromEntries(assets.map(asset => [asset, operation.id])) },
    analystAttention: clamp(sim.analystAttention - 6 - supports.length * 2),
    logistics: clamp(sim.logistics - supportBurden(supports).logistics),
    exposure: clamp(sim.exposure + supportBurden(supports).exposure)
  };
  next = addEvent(next, "SUCCESS", "EFFECT PACKAGE PAIRED", `${effector.name} paired for ${effect.toLowerCase()} with an estimated ${estimate.effect}% effect and ${estimate.collateral}% collateral risk.`, "EFFECTS");
  return next;
}

export function authorizePackage(sim: Sim): Sim {
  const track = sim.tracks.find(item => item.id === sim.selected)!;
  const operation = sim.operations.find(item => item.targetId === track.id && item.status === "PLANNED");
  if (!operation) return addEvent(sim, "CRITICAL", "NO PACKAGE FOR REVIEW", "Compose a valid effects package before requesting release authority.", "COMMAND");
  const gates = releaseGates(sim, operation.id);
  const commandPath = requiredCommandRoute(sim);
  if (gates.some(item => !item.passed)) {
    return addEvent(sim, "CRITICAL", "RELEASE AUTHORITY WITHHELD", `${gates.filter(item => !item.passed).map(item => item.label).join(", ")} remain unresolved.`, "COMMAND");
  }
  const authority = { grantedAt: sim.minute, expiresAt: sim.minute + 24, evidenceVersion: track.evidence.length, maxCollateral: 64, commandPath: commandPath.map(link => link.id) };
  let next: Sim = {
    ...sim,
    operations: sim.operations.map(item => item.id === operation.id ? { ...item, authority, status: "AUTHORIZED" as const } : item),
    tracks: sim.tracks.map(item => item.id === track.id ? { ...item, stage: "ENGAGE" as const } : item),
    political: clamp(sim.political - 2)
  };
  next = addEvent(next, "SUCCESS", "BOUNDED RELEASE AUTHORITY", `Authority expires at ${formatTime(authority.expiresAt)} and remains conditional on custody, evidence version, command path, and collateral guidance.`, "COMMAND");
  return next;
}

const releaseAssets = (sim: Sim, operation: Operation) => {
  const reservations = { ...sim.reservations };
  operation.assets.forEach(asset => delete reservations[asset]);
  return reservations;
};

const abortOperation = (sim: Sim, operation: Operation, reason: string): Sim => {
  if (operation.status === "EXECUTING") return addEvent(sim, "CRITICAL", "PACKAGE CANNOT BE RECALLED", "The package has crossed the commitment point. Continue to the effects window and assess the result.", "EFFECTS");
  const target = sim.tracks.find(item => item.id === operation.targetId);
  const updatedTarget = target ? { ...target, nominatedAt: undefined } : undefined;
  if (updatedTarget) updatedTarget.stage = deriveStage(sim, updatedTarget);
  let next: Sim = {
    ...sim,
    reservations: releaseAssets(sim, operation),
    operations: sim.operations.map(item => item.id === operation.id ? { ...item, status: "ABORTED" as const, abortReason: reason } : item),
    tracks: updatedTarget ? sim.tracks.map(item => item.id === updatedTarget.id ? updatedTarget : item) : sim.tracks
  };
  next = addEvent(next, "WATCH", "PACKAGE CANCELLED", `${reason}. Reserved assets were released.`, "EFFECTS");
  return next;
};

export function cancelPackage(sim: Sim, reason = "Cancelled by commander"): Sim {
  const operation = sim.operations.find(item => item.targetId === sim.selected && !["COMPLETE", "ABORTED"].includes(item.status));
  if (!operation) return sim;
  return abortOperation(sim, operation, reason);
}

export function executePackage(sim: Sim): Sim {
  const track = sim.tracks.find(item => item.id === sim.selected)!;
  const operation = sim.operations.find(item => item.targetId === track.id && item.status === "AUTHORIZED");
  if (!operation || !operation.authority) return addEvent(sim, "CRITICAL", "EXECUTION BLOCKED", "No currently authorized package exists for this target.", "EFFECTS");
  const failedGates = releaseGates(sim, operation.id, true).filter(item => !item.passed);
  if (failedGates.length) {
    return abortOperation(addEvent(sim, "CRITICAL", "AUTOMATIC ABORT", `${failedGates.map(item => item.label).join(", ")} failed before release.`, "EFFECTS"), operation, "Automatic abort released all shared assets");
  }
  const effector = sim.effectors.find(item => item.id === operation.effectorId)!;
  const origin = effectorOrigin(sim, effector);
  const sourceUnit = effector.sourceUnitId ? sim.units.find(unit => unit.id === effector.sourceUnitId) : undefined;
  const impactAt = sim.minute + operation.estimate.timeToTarget;
  const releaseAimpoint = track.stationary
    ? track.position
    : projectCoordinate(track.position, track.heading, track.speedKnots * operation.estimate.timeToTarget / 60);
  let next: Sim = {
    ...sim,
    operations: sim.operations.map(item => item.id === operation.id ? {
      ...item,
      impactAt,
      releaseOrigin: origin,
      releaseAimpoint,
      releaseUncertainty: clamp(track.uncertainty + operation.estimate.timeToTarget * .18, 3, 240),
      status: "EXECUTING" as const
    } : item),
    tracks: sim.tracks.map(item => item.id === track.id ? { ...item, status: "EFFECTS PENDING" as const } : item),
    effectors: sim.effectors.map(item => item.id === effector.id ? { ...item, stock: item.stock - effector.expenditure, fuel: clamp(item.fuel - Math.max(9, operation.estimate.distance / 18)), readiness: clamp(item.readiness - 8) } : item),
    units: sourceUnit
      ? sim.units.map(unit => unit.id === sourceUnit.id ? {
          ...unit,
          fuel: clamp(unit.fuel - Math.max(4, operation.estimate.distance / 40)),
          readiness: clamp(unit.readiness - 6)
        } : unit)
      : sim.units,
    logistics: clamp(sim.logistics - 5),
    exposure: clamp(sim.exposure + effector.signature * .18),
    escalation: clamp(sim.escalation + operation.estimate.escalation * .24)
  };
  next = addEvent(
    next,
    "WATCH",
    "PACKAGE RELEASED",
    `${effector.platform} released ${effector.payload} through ${effector.employmentSystem} from ${sourceUnit?.callsign ?? effector.base}. Effects are expected at ${formatTime(impactAt)}.`,
    "EFFECTS"
  );
  return next;
}

export function taskAssessment(sim: Sim, sensorId: string): Sim {
  return taskCollection(sim, sensorId, "BDA");
}

const resolveEffect = (sim: Sim, operation: Operation): Sim => {
  const truth = sim.truth.find(item => item.id === operation.targetId)!;
  const track = sim.tracks.find(item => item.id === operation.targetId)!;
  const [roll, seedA] = seeded(sim.seed);
  const [damageRoll, seedB] = seeded(seedA);
  const [incidentRoll, seedC] = seeded(seedB);
  const aimpoint = operation.releaseAimpoint ?? track.position;
  const missDistance = distanceNm(aimpoint, truth.position);
  const effectiveProbability = clamp(
    operation.estimate.effect
      - truth.defense * .18
      - truth.concealment * .11
      - missDistance * .9
      - (truth.kind === "DECOY" ? 34 : 0)
  );
  const achieved = roll * 100 <= effectiveProbability;
  const magnitude = achieved ? clamp(38 + damageRoll * 52) : clamp(5 + damageRoll * 18);
  const affected: Array<keyof TruthFunctions> =
    operation.effect === "SUPPRESS" ? ["sense", "act"] :
      operation.effect === "DISRUPT" ? ["command", "sense"] :
        operation.effect === "DISABLE" ? ["move", "act", "command"] :
          ["sense", "command", "move", "act", "sustain"];
  const functions = { ...truth.functions };
  const preEffectFunctions = truth.preEffectFunctions ? { ...truth.preEffectFunctions } : { ...truth.functions };
  if (truth.kind === "REAL" && achieved) affected.forEach(key => { functions[key] = clamp(functions[key] - magnitude); });
  const movementRatio = functions.move / Math.max(1, preEffectFunctions.move);
  const mobilityStopped = truth.stationary || Boolean(
    truth.kind === "REAL"
    && achieved
    && functions.move <= 28
  );
  const postEffectSpeed = mobilityStopped
    ? 0
    : Math.max(2, Math.round(truth.speedKnots * Math.max(.2, movementRatio)));
  const incident = incidentRoll * 100 < operation.estimate.collateral * .32 + truth.density * .08;
  const functionLoss = Object.keys(functions).reduce((sum, key) => sum + Math.max(0, truth.functions[key as keyof TruthFunctions] - functions[key as keyof TruthFunctions]), 0) / 5;
  const strategicBenefit = truth.kind === "REAL" ? functionLoss : 0;
  const tempoEffect = truth.id === "orchid" ? strategicBenefit * .36 : truth.id === "jade" ? strategicBenefit * .24 : strategicBenefit * .12;
  const accessEffect = truth.id === "jade" ? strategicBenefit * .16 : strategicBenefit * .08;
  const continuityEffect = truth.id === "jade" ? strategicBenefit * .09 : strategicBenefit * .03;
  let next: Sim = {
    ...sim,
    seed: seedC,
    truth: sim.truth.map(item => item.id === truth.id ? {
      ...item,
      preEffectFunctions,
      functions,
      speedKnots: postEffectSpeed,
      stationary: mobilityStopped,
      behavior: achieved ? "DISPERSED" as const : item.behavior
    } : item),
    operations: sim.operations.map(item => item.id === operation.id ? { ...item, status: "ASSESSMENT" as const } : item),
    reservations: releaseAssets(sim, operation),
    tracks: sim.tracks.map(item => item.id === track.id ? { ...item, stage: "ASSESS" as const, status: "ASSESSING" as const, freshness: clamp(item.freshness - operation.estimate.timeToTarget * .2), quality: clamp(item.quality - operation.estimate.timeToTarget * .1), uncertainty: clamp(item.uncertainty + operation.estimate.timeToTarget * .16, 3, 240) } : item),
    political: clamp(sim.political - (incident ? 11 : 1)),
    coalition: clamp(sim.coalition - (incident ? 8 : 0)),
    information: clamp(sim.information - (incident ? 9 : 0)),
    adversaryTempo: clamp(sim.adversaryTempo - tempoEffect),
    shippingThroughput: clamp(sim.shippingThroughput + accessEffect),
    continuity: clamp(sim.continuity + continuityEffect)
  };
  next = addEvent(next, incident ? "CRITICAL" : "WATCH", "EFFECTS WINDOW COMPLETE", incident ? "Possible protected object impact is circulating publicly. No mission effect is confirmed without assessment." : "The delivery phase ended. Physical and functional outcomes remain unknown.", "EFFECTS");
  return next;
};

const advanceOperationalUnits = (units: OperationalUnit[], elapsedMinute: number) => {
  const beforeById = new Map(units.map(unit => [unit.id, unit]));
  const independentlyAdvanced = new Map<string, OperationalUnit>();

  for (const unit of units) {
    const fuelBurn = unit.stationary
      || unit.movement === "DISABLED"
      || unit.movement === "FIXED"
      || unit.movement === "HOLDING"
      ? 0
      : 100 / Math.max(60, unit.enduranceMinutes);
    const outOfFuel = !unit.stationary && unit.fuel <= fuelBurn;
    const formationParent = unit.formationId ? beforeById.get(unit.formationId) : undefined;
    const inheritsFormation = unit.commandMode === "FORMATION"
      && formationParent?.domain === unit.domain;
    const moved = outOfFuel || inheritsFormation ? unit : advanceRoute(unit, 1);
    const completedRoute = !unit.loopRoute
      && unit.route.length > 1
      && moved.routeIndex === unit.route.length - 1
      && distanceNm(moved.position, unit.route.at(-1)!) < .05;
    const completedSustainmentCircuit = unit.loopRoute
      && unit.route.length > 1
      && moved.routeIndex < unit.routeIndex;
    independentlyAdvanced.set(unit.id, {
      ...moved,
      fuel: outOfFuel ? 0 : completedSustainmentCircuit ? 100 : clamp(unit.fuel - fuelBurn),
      readiness: completedSustainmentCircuit ? clamp(unit.readiness + 2) : unit.readiness,
      movement: outOfFuel ? "DISABLED" : completedRoute ? "HOLDING" : moved.movement
    });
  }

  return units.map(unit => {
    const independent = independentlyAdvanced.get(unit.id)!;
    const parentBefore = unit.formationId ? beforeById.get(unit.formationId) : undefined;
    const parentAfter = unit.formationId ? independentlyAdvanced.get(unit.formationId) : undefined;
    const canInherit = unit.commandMode === "FORMATION"
      && unit.fuel > 0
      && parentBefore
      && parentAfter
      && parentBefore.domain === unit.domain;
    const parentCompletedSustainmentCircuit = Boolean(
      parentBefore
      && parentAfter
      && parentBefore.domain === unit.domain
      && parentBefore.loopRoute
      && parentAfter.routeIndex < parentBefore.routeIndex
    );
    const moved = canInherit
      ? {
          ...independent,
          position: [
            unit.position[0] + (parentAfter.position[0] - parentBefore.position[0]),
            unit.position[1] + (parentAfter.position[1] - parentBefore.position[1])
          ] as Coordinate,
          heading: parentAfter.heading,
          movement: parentAfter.movement === "DISABLED" ? "HOLDING" as const : parentAfter.movement
        }
      : independent;
    const sustained = parentCompletedSustainmentCircuit
      ? {
          ...moved,
          fuel: 100,
          readiness: clamp(moved.readiness + 2),
          movement: parentAfter?.movement === "DISABLED" ? moved.movement : parentAfter?.movement ?? moved.movement
        }
      : moved;
    const changedPosition = distanceNm(sustained.position, unit.position) > .0001;
    const trail = elapsedMinute % 5 === 0 && changedPosition
      ? [...unit.trail, sustained.position].slice(-24)
      : unit.trail;
    return { ...sustained, trail };
  });
};

const applyTaiwanScenarioBeat = (sim: Sim): Sim => {
  if (sim.scenarioId !== "taiwan") return sim;

  if (sim.elapsedMinute === 10) {
    return addEvent(
      sim,
      "WATCH",
      "TEN MINUTES TO DECLARED TERMINATION",
      "The five live fire areas remain active. Military and coast guard formations show no coordinated recovery pattern.",
      "COMMAND"
    );
  }

  if (sim.elapsedMinute === 20) {
    const changed = {
      ...sim,
      adversaryTempo: clamp(sim.adversaryTempo + 7),
      shippingThroughput: clamp(sim.shippingThroughput - 5),
      civilianAccess: clamp(sim.civilianAccess - 7),
      political: clamp(sim.political - 2),
      escalation: clamp(sim.escalation + 3)
    };
    return addEvent(
      changed,
      "CRITICAL",
      "EXERCISE WINDOW EXPIRED",
      "No termination notice arrived at 18:00. Published exercise controls remain active while coast guard units begin directing commercial traffic.",
      "POLITICAL"
    );
  }

  if (sim.elapsedMinute === 60) {
    const changed = {
      ...sim,
      shippingThroughput: clamp(sim.shippingThroughput - 4),
      civilianAccess: clamp(sim.civilianAccess - 3),
      information: clamp(sim.information - 2)
    };
    return addEvent(
      changed,
      "WATCH",
      "SELECTIVE INSPECTIONS REPORTED",
      "Commercial operators report inconsistent routing instructions from white hull patrols. The pattern remains coercive but deliberately ambiguous.",
      "POLITICAL"
    );
  }

  if (sim.elapsedMinute === 90) {
    const changed = {
      ...sim,
      civilianAccess: clamp(sim.civilianAccess - 2),
      information: clamp(sim.information - 1),
      adversaryTempo: clamp(sim.adversaryTempo + 2)
    };
    return addEvent(
      changed,
      "WATCH",
      "WHITE HULL CIRCUIT SUSTAINED",
      "Four Coast Guard patrol arcs maintain a continuous circuit around Taiwan. Their law enforcement posture complicates proportional response while preserving maritime pressure.",
      "POLITICAL"
    );
  }

  if (sim.elapsedMinute === 180) {
    const changed = {
      ...sim,
      readiness: clamp(sim.readiness - 2),
      coalition: clamp(sim.coalition + 2),
      escalation: clamp(sim.escalation + 2)
    };
    return addEvent(
      changed,
      "WATCH",
      "EASTERN AMPHIBIOUS GROUP HOLDS STATION",
      "Four amphibious ships remain east and southeast of Taiwan. Rotary wing activity is consistent with training, contingency preparation, or both.",
      "INTEL"
    );
  }

  if (sim.elapsedMinute === 360) {
    const changed = {
      ...sim,
      civilianAccess: clamp(sim.civilianAccess - 8),
      continuity: clamp(sim.continuity - 2),
      political: clamp(sim.political - 3)
    };
    return addEvent(
      changed,
      "CRITICAL",
      "CIVIL CORRIDORS REMAIN CONSTRAINED",
      "Airlines and merchant operators continue diversions around the declared areas. Economic disruption is now an operational effect rather than a temporary safety measure.",
      "LOGISTICS"
    );
  }

  if (sim.elapsedMinute === 720) {
    const changed = {
      ...sim,
      shippingThroughput: clamp(sim.shippingThroughput - 6),
      civilianAccess: clamp(sim.civilianAccess - 4),
      adversaryTempo: clamp(sim.adversaryTempo + 4),
      escalation: clamp(sim.escalation + 4)
    };
    return addEvent(
      changed,
      "CRITICAL",
      "QUARANTINE PATTERN ASSESSED",
      "Exercise geometry, selective inspections, and persistent patrols now form a functional quarantine without a formal declaration of blockade.",
      "COMMAND"
    );
  }

  return sim;
};

const advanceMinute = (sim: Sim): Sim => {
  const minute = sim.minute + 1;
  const elapsedMinute = sim.elapsedMinute + 1;
  const mission = sim.openingMission;
  const missionDefinition = mission
    ? openingDefinitionsByFaction[sim.faction].find(option => option.id === mission.optionId)
    : undefined;
  const preparedUnits = mission && missionDefinition && mission.status !== "COMPLETE"
    ? sim.units.map(unit => {
        const departureAt = mission.unitDepartures[unit.id];
        if (departureAt === undefined || unit.movement === "DISABLED") return unit;
        const destination = missionDefinition.route.at(-1);
        const arrived = destination ? distanceNm(unit.position, destination) <= .05 : false;
        if (arrived) return { ...unit, movement: "HOLDING" as const };
        return {
          ...unit,
          movement: minute >= departureAt ? mission.movement : "HOLDING" as const
        };
      })
    : sim.units;
  const units = advanceOperationalUnits(preparedUnits, elapsedMinute);
  let next: Sim = {
    ...sim,
    minute,
    elapsedMinute,
    truth: sim.truth.map(item => advanceRoute(item, 1)),
    units
  };
  const newlyFuelLimited = units.filter(unit => unit.movement === "DISABLED"
    && sim.units.find(previous => previous.id === unit.id)?.movement !== "DISABLED");
  if (newlyFuelLimited.length) {
    next = addEvent(
      next,
      "CRITICAL",
      "SUSTAINMENT FAILURE",
      `${newlyFuelLimited.map(unit => unit.callsign).join(", ")} exhausted usable fuel and can no longer maneuver.`,
      "LOGISTICS"
    );
  }
  next = resolveOpeningMission(next);

  for (const task of next.collectionTasks.filter(item => item.status === "COLLECTING" && item.collectAt <= minute)) {
    const [observation, seed] = generateObservation(next, task);
    next = {
      ...next,
      seed,
      observations: [observation, ...next.observations],
      collectionTasks: next.collectionTasks.map(item => item.id === task.id ? { ...item, status: "TRANSMITTING" as const } : item)
    };
  }

  next = {
    ...next,
    collectionTasks: next.collectionTasks.map(task => task.status === "TRANSMITTING" && minute >= task.collectAt + 2 ? { ...task, status: "PROCESSING" as const } : task)
  };

  const processingLoad = pipelineLoad(next);
  if (processingLoad.processing > 95 || processingLoad.analyst > 95 || processingLoad.choke) {
    const delayedTaskIds = new Set(next.collectionTasks.filter(item => item.status === "PROCESSING" && item.availableAt <= minute).map(item => item.id));
    if (delayedTaskIds.size) {
      next = {
        ...next,
        collectionTasks: next.collectionTasks.map(item => delayedTaskIds.has(item.id) ? { ...item, availableAt: item.availableAt + 1 } : item),
        observations: next.observations.map(item => delayedTaskIds.has(item.taskId) ? { ...item, availableAt: item.availableAt + 1 } : item)
      };
    }
  }

  for (const task of next.collectionTasks.filter(item => item.status === "PROCESSING" && item.availableAt <= minute)) {
    const observation = next.observations.find(item => item.taskId === task.id);
    if (observation && !observation.delivered) {
      next = { ...next, observations: next.observations.map(item => item.id === observation.id ? { ...item, delivered: true } : item) };
      next = applyObservation(next, { ...observation, delivered: true });
    }
    next = { ...next, collectionTasks: next.collectionTasks.map(item => item.id === task.id ? { ...item, status: "COMPLETE" as const } : item) };
  }

  for (const operation of next.operations.filter(item => item.status === "EXECUTING" && (item.impactAt ?? Infinity) <= minute)) {
    next = resolveEffect(next, operation);
  }

  const lost: string[] = [];
  next = {
    ...next,
    tracks: next.tracks.map(track => {
      if (["CLOSED", "ASSESSING"].includes(track.status)) return track;
      const processNoise = track.domain === "AIR"
        ? 1.10
        : track.domain === "SEA"
          ? .20
          : track.domain === "CYBER"
            ? .05
            : track.stationary
              ? .03
              : .25;
      const quality = clamp(track.quality - (track.stationary ? .10 : .16));
      const freshness = clamp(track.freshness - .18);
      const uncertainty = clamp(track.uncertainty + processNoise, 3, 240);
      const status: TrackStatus = quality < 11 || freshness < 7 ? "LOST" : quality < 30 || freshness < 35 ? "STALE" : track.status;
      if (status === "LOST" && track.status !== "LOST") lost.push(track.callsign);
      let stage = track.stage;
      let nominatedAt = track.nominatedAt;
      if ((stage === "TRACK" || stage === "TARGET") && (quality < 40 || uncertainty > 76)) {
        stage = "FIX";
        nominatedAt = undefined;
      }
      const position = track.stationary
        ? track.position
        : projectCoordinate(track.position, track.heading, track.speedKnots / 60);
      const history = elapsedMinute % 5 === 0 && !track.stationary
        ? [...track.history, position].slice(-24)
        : track.history;
      return { ...track, position, history, quality, freshness, uncertainty, status, stage, nominatedAt };
    })
  };

  const trackById = new Map(next.tracks.map(item => [item.id, item]));
  for (const operation of next.operations.filter(item => ["PLANNED", "AUTHORIZED"].includes(item.status))) {
    const track = trackById.get(operation.targetId);
    if (!track) {
      next = abortOperation(next, operation, "Target reference was lost");
      continue;
    }
    const staleAuthority = operation.authority && minute > operation.authority.expiresAt;
    const regressed = track.stage === "FIX" || track.status === "LOST";
    if (staleAuthority || regressed) next = abortOperation(next, operation, staleAuthority ? "Release authority expired" : "Target development regressed below the package floor");
  }

  if (minute % 12 === 0) {
    const [actionRoll, seedA] = seeded(next.seed);
    const [targetRoll, seedB] = seeded(seedA);
    next = { ...next, seed: seedB };
    const chance = clamp(next.adversaryTempo * .28 + next.exposure * .34);
    if (actionRoll * 100 < chance) {
      const candidates = next.truth.filter(item => item.kind !== "CIVILIAN");
      const target = candidates[Math.floor(targetRoll * candidates.length)] ?? candidates[0];
      const behavior = next.exposure > 64 ? "JAMMING" : targetRoll > .66 ? "MOVING" : targetRoll < .24 ? "EMITTING" : "HIDING";
      next = {
        ...next,
        truth: next.truth.map(item => item.id === target.id ? { ...item, behavior } : item),
        commandLinks: next.commandLinks.map((link, index) => next.exposure > 70 && index === 1 ? { ...link, integrity: clamp(link.integrity - 4) } : link),
        information: clamp(next.information - (behavior === "JAMMING" ? 3 : 0))
      };
      const hasSensingPath = next.collectionTasks.some(task => task.targetId === target.id && task.status !== "COMPLETE");
      if (behavior === "JAMMING" || behavior === "EMITTING" || hasSensingPath) {
        next = addEvent(next, next.exposure > 70 ? "CRITICAL" : "WATCH", behavior === "JAMMING" ? "COUNTER ISR RESPONSE" : "INDIRECT ACTIVITY INDICATOR", behavior === "JAMMING" ? "High signature collection triggered disruption across the sensing and command architecture." : "A current collection path detected a change in behavior. Existing target estimates may now be stale.", "INTEL");
      }
    }
  }

  if (lost.length) next = addEvent(next, "CRITICAL", `CUSTODY LOST: ${lost.join(", ")}`, "The hypotheses persist, but their locations are no longer supportable.", "INTEL");
  next = applyTaiwanScenarioBeat(next);
  const candidatePhase: Sim["phase"] = elapsedMinute >= 3000 || next.escalation >= 78
    ? "OPEN CONFLICT"
    : elapsedMinute >= 1440 || next.escalation >= 55
      ? "CONTESTED"
      : elapsedMinute >= 240
        ? "COERCION"
        : "WARNING";
  const phaseOrder: Sim["phase"][] = ["WARNING", "COERCION", "CONTESTED", "OPEN CONFLICT"];
  const phase = phaseOrder[Math.max(phaseOrder.indexOf(next.phase), phaseOrder.indexOf(candidatePhase))];
  return {
    ...next,
    phase,
    bandwidth: clamp(next.bandwidth + .018),
    compute: clamp(next.compute + .025),
    analystAttention: clamp(next.analystAttention + .012),
    storage: clamp(next.storage + .006),
    logistics: clamp(next.logistics - .002),
    readiness: clamp(next.readiness - .004),
    exposure: clamp(next.exposure - .018),
    shippingThroughput: clamp(next.shippingThroughput - next.adversaryTempo * .0007 + next.coalition * .00025),
    civilianAccess: clamp(next.civilianAccess - next.adversaryTempo * .0006 + next.coalition * .00018),
    continuity: clamp(next.continuity - (phase === "OPEN CONFLICT" ? .012 : .002)),
    decisionPoints: Math.min(3, next.decisionPoints + (elapsedMinute % 90 === 0 ? 1 : 0))
  };
};

export function advance(sim: Sim, minutes: number): Sim {
  if (!Number.isInteger(minutes) || !Number.isFinite(minutes)) throw new RangeError("Simulation advances require a finite whole number of minutes.");
  if (sim.paused || minutes <= 0) return sim;
  let next = sim;
  for (let index = 0; index < minutes; index += 1) next = advanceMinute(next);
  return next;
}

type OpeningResource = "readiness" | "coalition" | "political" | "escalation" | "information" | "exposure" | "adversaryTempo" | "shippingThroughput" | "civilianAccess" | "continuity";

interface OpeningDefinition extends OpeningOption {
  assignedUnitIds: string[];
  route: Coordinate[];
  mission: string;
  movement: OperationalUnit["movement"];
  coordinationDelay: number;
  upfront: Partial<Record<OpeningResource, number>>;
  outcome: Partial<Record<OpeningResource, number>>;
  eventTitle: string;
  eventDetail: string;
  completionTitle: string;
  completionDetail: string;
}

const openingDefinitionsByFaction: Record<Faction, OpeningDefinition[]> = {
  USA: [
    {
      id: "ESCORT",
      label: "Escort shipping",
      detail: "Move surface forces into the southern approach. Access can recover quickly, but exposure and escalation rise.",
      assignedUnitIds: ["us-ddg-113", "twn-frigate-1202"],
      route: [[124.4, 22.7], [122.7, 22.6], [121.0, 22.55], [120.35, 22.63]],
      mission: "Escort protected commercial traffic through the southern approach",
      movement: "TRANSIT",
      coordinationDelay: 10,
      upfront: { readiness: -5, exposure: 14, escalation: 7 },
      outcome: { shippingThroughput: 10, civilianAccess: 4, adversaryTempo: 3 },
      eventTitle: "ESCORT PLAN COMMITTED",
      eventDetail: "Surface forces are moving toward the convoy. Access will improve only if the escorts reach the lane.",
      completionTitle: "ESCORTS ON STATION",
      completionDetail: "The protected passage is operating. Commercial throughput improved while the exposed force remains vulnerable."
    },
    {
      id: "SHADOW",
      label: "Maintain shadow",
      detail: "Prioritize custody and warning. You gain a clearer picture but concede commercial time and reveal collection patterns.",
      assignedUnitIds: ["us-p8-03", "us-mq4-21"],
      route: [[124.2, 25.9], [122.2, 25.5], [120.9, 24.8], [121.6, 23.6]],
      mission: "Maintain custody on the enforcement formation without direct challenge",
      movement: "PATROL",
      coordinationDelay: 5,
      upfront: { exposure: 5, shippingThroughput: -3 },
      outcome: { information: 12, adversaryTempo: 4 },
      eventTitle: "PERSISTENT SHADOW COMMITTED",
      eventDetail: "Airborne collection is converging on the enforcement formation while the merchant remains exposed to delay.",
      completionTitle: "SHADOW ESTABLISHED",
      completionDetail: "Persistent collection is on station. The operational picture improved, but the quarantine gained time."
    },
    {
      id: "COALITION",
      label: "Build coalition convoy",
      detail: "Assemble a shared passage with partners. It distributes risk but consumes political capital and takes longest to organize.",
      assignedUnitIds: ["jpn-ddg-179", "phl-patrol-08"],
      route: [[125.2, 27.2], [124.0, 25.8], [122.6, 24.9], [121.4, 24.2]],
      mission: "Build a coalition protected passage plan",
      movement: "TRANSIT",
      coordinationDelay: 45,
      upfront: { political: -12, readiness: -2, shippingThroughput: -2 },
      outcome: { coalition: 9, shippingThroughput: 7, civilianAccess: 8, adversaryTempo: 2 },
      eventTitle: "COALITION CONVOY REQUESTED",
      eventDetail: "Partners are assembling a shared passage. Benefits depend on their forces reaching the lane.",
      completionTitle: "COALITION PASSAGE FORMED",
      completionDetail: "Partner forces assembled and opened a shared passage at real political and readiness cost."
    }
  ],
  PRC: [
    {
      id: "TIGHTEN_QUARANTINE",
      label: "Tighten quarantine",
      detail: "Concentrate enforcement around western ports. Pressure rises quickly, but the signature invites coalition response.",
      assignedUnitIds: ["prc-quarantine-formation", "prc-air-defense-44"],
      route: [[120.2, 25.7], [120.8, 25.0], [120.5, 23.8]],
      mission: "Close western approaches and enforce the declared inspection regime",
      movement: "PATROL",
      coordinationDelay: 12,
      upfront: { exposure: 13, escalation: 8, readiness: -4 },
      outcome: { adversaryTempo: -8, shippingThroughput: -10, civilianAccess: -12, political: -3 },
      eventTitle: "QUARANTINE CONCENTRATION ORDERED",
      eventDetail: "Enforcement groups are moving to close western approaches. Pressure depends on reaching assigned stations.",
      completionTitle: "QUARANTINE LINE ESTABLISHED",
      completionDetail: "Inspection coverage constricted access, while the concentrated signature increased diplomatic and military risk."
    },
    {
      id: "SELECTIVE_INSPECTION",
      label: "Selective inspection",
      detail: "Inspect chosen traffic while leaving limited passage. The posture is more sustainable but produces slower coercive leverage.",
      assignedUnitIds: ["prc-quarantine-formation"],
      route: [[120.7, 25.6], [121.0, 24.7], [120.8, 23.9]],
      mission: "Apply selective inspections while preserving a controlled commercial lane",
      movement: "PATROL",
      coordinationDelay: 18,
      upfront: { exposure: 5, readiness: -2 },
      outcome: { shippingThroughput: -5, civilianAccess: -4, political: 4, information: 3 },
      eventTitle: "SELECTIVE INSPECTIONS ORDERED",
      eventDetail: "The enforcement screen is repositioning for discriminating inspections and calibrated pressure.",
      completionTitle: "SELECTIVE REGIME ACTIVE",
      completionDetail: "A controlled lane remains open while inspection pressure and political ambiguity increase."
    },
    {
      id: "DECEPTIVE_EXERCISE",
      label: "Extend deceptive exercise",
      detail: "Preserve ambiguity and rotate low signature forces. You gain information advantage but sacrifice immediate blockade pressure.",
      assignedUnitIds: ["prc-j36-eval", "prc-quarantine-formation"],
      route: [[119.8, 26.7], [121.2, 26.0], [122.0, 24.8], [120.4, 24.1]],
      mission: "Sustain exercise ambiguity and mask enforcement preparations",
      movement: "PATROL",
      coordinationDelay: 25,
      upfront: { shippingThroughput: 3, exposure: -6, adversaryTempo: 4 },
      outcome: { information: 11, political: 5, coalition: -4, civilianAccess: -3 },
      eventTitle: "EXERCISE DECEPTION EXTENDED",
      eventDetail: "Low signature forces are rotating through ambiguous profiles while inspection pressure temporarily eases.",
      completionTitle: "DECEPTION PATTERN ESTABLISHED",
      completionDetail: "The extended exercise complicated attribution and slowed an organized external response."
    }
  ],
  TWN: [
    {
      id: "DISPERSE_ENDURE",
      label: "Disperse and endure",
      detail: "Protect command continuity and sortie generation. Immediate access suffers while survivability improves.",
      assignedUnitIds: ["twn-sag-formation", "twn-cap-17"],
      route: [[121.3, 23.3], [121.9, 24.2], [121.5, 25.0]],
      mission: "Disperse combat power to protected eastern operating areas",
      movement: "TRANSIT",
      coordinationDelay: 12,
      upfront: { shippingThroughput: -4, civilianAccess: -5, information: -2 },
      outcome: { readiness: 9, continuity: 8, exposure: -8 },
      eventTitle: "DISPERSAL PLAN COMMITTED",
      eventDetail: "Forces are moving toward protected eastern operating areas before the quarantine can harden.",
      completionTitle: "DISPERSAL COMPLETE",
      completionDetail: "Distributed forces preserved continuity and readiness while accepting reduced immediate access."
    },
    {
      id: "CHALLENGE_INSPECTIONS",
      label: "Challenge inspections",
      detail: "Contest the first boarding attempt with air and maritime cover. It can preserve access but sharply raises escalation risk.",
      assignedUnitIds: ["twn-frigate-1202", "twn-cap-17"],
      route: [[121.4, 24.4], [120.9, 24.7], [120.5, 24.4]],
      mission: "Challenge inspection activity under defensive air cover",
      movement: "TRANSIT",
      coordinationDelay: 8,
      upfront: { exposure: 12, escalation: 12, readiness: -5 },
      outcome: { shippingThroughput: 9, civilianAccess: 7, coalition: 4, adversaryTempo: 5 },
      eventTitle: "INSPECTION CHALLENGE ORDERED",
      eventDetail: "Air and maritime forces are converging on the first contested inspection point.",
      completionTitle: "INSPECTION CHALLENGED",
      completionDetail: "The visible challenge restored limited access and galvanized support while narrowing the escalation margin."
    },
    {
      id: "PROTECTED_PASSAGE",
      label: "Request protected passage",
      detail: "Ask partners to organize an eastern access corridor. It preserves local forces but costs political autonomy and time.",
      assignedUnitIds: ["jpn-ddg-179", "us-ddg-113"],
      route: [[125.2, 26.9], [123.8, 25.4], [122.1, 24.2], [121.5, 23.8]],
      mission: "Assemble an allied protected passage to eastern ports",
      movement: "TRANSIT",
      coordinationDelay: 40,
      upfront: { political: -10, shippingThroughput: -2 },
      outcome: { coalition: 10, shippingThroughput: 7, civilianAccess: 10, readiness: 3 },
      eventTitle: "PROTECTED PASSAGE REQUESTED",
      eventDetail: "Partner forces are organizing an eastern corridor. Taiwan must endure until they arrive.",
      completionTitle: "EASTERN CORRIDOR OPEN",
      completionDetail: "Allied forces opened a protected corridor without consuming the core defensive fleet."
    }
  ],
  ROK: [
    {
      id: "PENINSULA_HOLD",
      label: "Hold peninsula readiness",
      detail: "Keep the main force near Korea while extending warning south. Alliance access gains are limited, but northern risk remains covered.",
      assignedUnitIds: ["rok-maritime-formation", "rok-p8-12"],
      route: [[128.7, 32.0], [127.7, 30.8], [127.0, 29.8]],
      mission: "Maintain a peninsula covering posture while extending maritime warning",
      movement: "PATROL",
      coordinationDelay: 10,
      upfront: { shippingThroughput: -2 },
      outcome: { readiness: 8, information: 5, exposure: -4 },
      eventTitle: "PENINSULA HOLD ORDERED",
      eventDetail: "South Korean forces are establishing a conservative covering posture north of the main crisis.",
      completionTitle: "PENINSULA COVER ESTABLISHED",
      completionDetail: "Northern readiness remained intact while the alliance gained limited additional warning."
    },
    {
      id: "ALLIANCE_ISR",
      label: "Commit alliance ISR",
      detail: "Push maritime patrols south to close collection gaps. Information improves at the cost of peninsula coverage and exposure.",
      assignedUnitIds: ["rok-p8-12"],
      route: [[128.4, 31.2], [126.6, 28.8], [124.8, 26.4], [123.1, 25.1]],
      mission: "Close alliance collection gaps over the northern approaches",
      movement: "PATROL",
      coordinationDelay: 8,
      upfront: { readiness: -4, exposure: 8 },
      outcome: { information: 12, coalition: 4, civilianAccess: 2, adversaryTempo: 3 },
      eventTitle: "ALLIANCE ISR COMMITTED",
      eventDetail: "Maritime patrols are moving south to close the northern collection gap.",
      completionTitle: "ALLIANCE ISR ON STATION",
      completionDetail: "South Korean patrols improved the shared operating picture while reducing reserve coverage."
    },
    {
      id: "LOGISTICS_BRIDGE",
      label: "Build logistics bridge",
      detail: "Commit ports and sustainment to the coalition. The result takes time but strengthens endurance without direct confrontation.",
      assignedUnitIds: ["rok-maritime-formation"],
      route: [[128.8, 31.9], [127.0, 29.7], [125.4, 27.7]],
      mission: "Establish an alliance sustainment bridge from the Korean peninsula",
      movement: "TRANSIT",
      coordinationDelay: 35,
      upfront: { political: -8, readiness: -3 },
      outcome: { continuity: 9, coalition: 8, shippingThroughput: 4, civilianAccess: 5 },
      eventTitle: "LOGISTICS BRIDGE COMMITTED",
      eventDetail: "Port and maritime capacity are assembling into a southbound alliance sustainment chain.",
      completionTitle: "LOGISTICS BRIDGE OPEN",
      completionDetail: "The sustainment chain improved coalition endurance without an immediate direct challenge."
    }
  ]
};

export const openingOptionsFor = (faction: Faction): OpeningOption[] =>
  openingDefinitionsByFaction[faction].map(({ id, label, detail }) => ({ id, label, detail }));

const applyOpeningDeltas = (sim: Sim, deltas: Partial<Record<OpeningResource, number>>): Sim => {
  const next = { ...sim };
  (Object.keys(deltas) as OpeningResource[]).forEach(key => {
    next[key] = clamp(next[key] + (deltas[key] ?? 0));
  });
  return next;
};

const resolveOpeningMission = (sim: Sim): Sim => {
  const mission = sim.openingMission;
  if (!mission || mission.status === "COMPLETE" || sim.minute < mission.resolvesAt) return sim;
  const definition = openingDefinitionsByFaction[sim.faction].find(option => option.id === mission.optionId);
  if (!definition) return sim;
  const destination = definition.route.at(-1);
  if (!destination) return sim;
  const assigned = mission.assignedUnitIds
    .map(id => sim.units.find(unit => unit.id === id))
    .filter(Boolean) as OperationalUnit[];
  const arrived = assigned.length === mission.assignedUnitIds.length
    && assigned.every(unit => distanceNm(unit.position, destination) <= 65 && unit.movement !== "DISABLED");
  if (!arrived) {
    if (mission.status === "DELAYED") return sim;
    return addEvent(
      { ...sim, openingMission: { ...mission, status: "DELAYED" } },
      "CRITICAL",
      "OPENING PLAN DELAYED",
      `${definition.label} missed its planned completion window. Fuel, positioning, or coordination must be restored before benefits can be realized.`,
      "LOGISTICS"
    );
  }
  let next = applyOpeningDeltas(sim, definition.outcome);
  next = { ...next, openingMission: { ...mission, status: "COMPLETE" } };
  return addEvent(next, "SUCCESS", definition.completionTitle, definition.completionDetail, "COMMAND");
};

const routeLength = (origin: Coordinate, route: Coordinate[]) => {
  let total = 0;
  let previous = origin;
  for (const point of route) {
    total += distanceNm(previous, point);
    previous = point;
  }
  return total;
};

export function chooseBlockadePosture(sim: Sim, posture: BlockadePosture): Sim {
  if (sim.blockadePosture) return sim;
  const definition = openingDefinitionsByFaction[sim.faction].find(option => option.id === posture);
  if (!definition) return addEvent(sim, "CRITICAL", "OPENING OPTION REJECTED", "That opening plan is not available to the current command perspective.", "COMMAND");
  const assigned = sim.units.filter(unit => definition.assignedUnitIds.includes(unit.id)
    && unit.affiliation !== "CIVILIAN"
    && unit.affiliation !== "NEUTRAL");
  if (!assigned.length) return addEvent(sim, "CRITICAL", "OPENING OPTION REJECTED", "No controllable unit can execute this plan.", "COMMAND");

  const transitByUnit = Object.fromEntries(assigned.map(unit => [
    unit.id,
    routeLength(unit.position, definition.route) / Math.max(1, unit.speedKnots) * 60
  ]));
  const longestTransit = Math.max(...Object.values(transitByUnit));
  const commonArrivalAt = sim.minute + Math.max(12, Math.ceil(longestTransit));
  const unitDepartures = Object.fromEntries(assigned.map(unit => [
    unit.id,
    Math.max(sim.minute, Math.ceil(commonArrivalAt - transitByUnit[unit.id]))
  ]));
  const resolvesAt = commonArrivalAt + definition.coordinationDelay;
  let next: Sim = {
    ...sim,
    blockadePosture: posture,
    openingMission: {
      optionId: posture,
      label: definition.label,
      assignedUnitIds: assigned.map(unit => unit.id),
      unitDepartures,
      movement: definition.movement,
      startedAt: sim.minute,
      resolvesAt,
      status: "TRANSIT"
    },
    paused: false,
    units: sim.units.map(unit => definition.assignedUnitIds.includes(unit.id)
      ? {
          ...unit,
          route: [unit.position, ...definition.route],
          routeIndex: 1,
          loopRoute: false,
          heading: bearingDegrees(unit.position, definition.route[0]),
          mission: definition.mission,
          movement: unitDepartures[unit.id] <= sim.minute ? definition.movement : "HOLDING",
          commandMode: unit.formationId ? "DIRECT" : unit.commandMode
        }
      : unit)
  };
  next = applyOpeningDeltas(next, definition.upfront);
  return addEvent(next, "WATCH", definition.eventTitle, `${definition.eventDetail} Estimated completion ${formatTime(resolvesAt)}.`, "COMMAND");
}

export function setUnitCommandMode(sim: Sim, unitId: string, mode: OperationalUnit["commandMode"]): Sim {
  const unit = sim.units.find(item => item.id === unitId);
  if (!unit || unit.affiliation === "CIVILIAN" || unit.affiliation === "NEUTRAL") return sim;
  if (!unit.formationId) return addEvent(sim, "WATCH", "DIRECT CONTROL UNAVAILABLE", `${unit.callsign} is already operating as an independent formation.`, "COMMAND");
  if (unit.commandMode === mode) return sim;
  const next = {
    ...sim,
    analystAttention: clamp(sim.analystAttention - (mode === "DIRECT" ? 3 : 1)),
    commandLinks: sim.commandLinks.map((link, index) => index === 1
      ? { ...link, capacity: clamp(link.capacity - (mode === "DIRECT" ? 3 : 1)) }
      : link),
    units: sim.units.map(item => item.id === unitId
      ? {
          ...item,
          commandMode: mode,
          readiness: clamp(item.readiness - (mode === "DIRECT" ? 1 : 0)),
          mission: mode === "DIRECT"
            ? `Direct tasking override from ${item.formationId}`
            : `Rejoin and execute ${sim.units.find(parent => parent.id === item.formationId)?.callsign ?? "formation"} intent`
        }
      : item)
  };
  return addEvent(
    next,
    "INFO",
    mode === "DIRECT" ? "DIRECT CONTROL ASSUMED" : "FORMATION CONTROL RESTORED",
    mode === "DIRECT"
      ? `${unit.callsign} will temporarily ignore formation routing until reattached.`
      : `${unit.callsign} will again execute its parent formation intent.`,
    "COMMAND"
  );
}

export function doctrineAction(sim: Sim, action: DoctrineAction): Sim {
  if (!["SILENT WATCH", "ISR SURGE", "FORCE DISPERSAL", "CRISIS CHANNEL"].includes(action)) return addEvent(sim, "CRITICAL", "INVALID COMMAND ACTION", "The requested theater action is not recognized.", "COMMAND");
  if (sim.decisionPoints < 1) return addEvent(sim, "CRITICAL", "COMMAND CAPACITY EXHAUSTED", "No decision points remain. Time and staff capacity are required before another theater level action.", "COMMAND");
  const cooldown = sim.doctrineCooldowns[action] ?? 0;
  if (cooldown > sim.minute) return addEvent(sim, "WATCH", "ACTION STILL IN EFFECT", `${action.toLowerCase()} cannot be repeated until ${formatTime(cooldown)}.`, "COMMAND");
  let next: Sim = { ...sim, decisionPoints: sim.decisionPoints - 1 };
  if (action === "SILENT WATCH") {
    next = { ...next, doctrineCooldowns: { ...sim.doctrineCooldowns, [action]: sim.minute + 90 }, exposure: clamp(sim.exposure - 20), information: clamp(sim.information - 5), tracks: sim.tracks.map(track => ({ ...track, quality: clamp(track.quality - 5), freshness: clamp(track.freshness - 8), uncertainty: clamp(track.uncertainty + 7, 3, 240) })) };
    return addEvent(next, "WATCH", "SILENT WATCH ORDERED", "Friendly exposure fell, but collection quality and target custody degraded.", "COMMAND");
  }
  if (action === "ISR SURGE") {
    if (sim.logistics < 12 || sim.bandwidth < 16) return addEvent(sim, "CRITICAL", "ISR SURGE BLOCKED", "Logistics or communications capacity cannot support another surge.", "LOGISTICS");
    next = { ...next, doctrineCooldowns: { ...sim.doctrineCooldowns, [action]: sim.minute + 120 }, logistics: clamp(sim.logistics - 9), bandwidth: clamp(sim.bandwidth - 8), compute: clamp(sim.compute + 18), exposure: clamp(sim.exposure + 24), sensors: sim.sensors.map(sensor => ({ ...sensor, readyAt: Math.max(sim.minute, sensor.readyAt - 20) })) };
    return addEvent(next, "SUCCESS", "ISR SURGE ACTIVE", "Revisit times and processing capacity improved. The larger signature increases the chance of counter ISR action.", "INTEL");
  }
  if (action === "FORCE DISPERSAL") {
    if (sim.logistics < 14) return addEvent(sim, "CRITICAL", "DISPERSAL BLOCKED", "The sustainment network cannot support another displacement.", "LOGISTICS");
    next = { ...next, doctrineCooldowns: { ...sim.doctrineCooldowns, [action]: sim.minute + 180 }, logistics: clamp(sim.logistics - 12), readiness: clamp(sim.readiness + 11), exposure: clamp(sim.exposure - 8), commandLinks: sim.commandLinks.map(link => ({ ...link, latency: link.latency + 2, capacity: clamp(link.capacity - 4) })) };
    return addEvent(next, "SUCCESS", "FORCE DISPERSAL COMPLETE", "Survivability improved, but command latency and sustainment burden increased.", "LOGISTICS");
  }
  if (sim.political < 14) return addEvent(sim, "CRITICAL", "CRISIS CHANNEL UNAVAILABLE", "Political capital is insufficient to open another protected channel.", "POLITICAL");
  next = { ...next, doctrineCooldowns: { ...sim.doctrineCooldowns, [action]: sim.minute + 240 }, political: clamp(sim.political - 12), coalition: clamp(sim.coalition + 6), escalation: clamp(sim.escalation - 9), adversaryTempo: clamp(sim.adversaryTempo + 6), shippingThroughput: clamp(sim.shippingThroughput + 2) };
  return addEvent(next, "SUCCESS", "CRISIS CHANNEL OPEN", "Escalation pressure fell and commercial confidence improved, but the adversary gained operational time.", "POLITICAL");
}

export function initiativeScore(sim: Sim) {
  return Math.round(clamp(
    sim.shippingThroughput * .14
      + sim.civilianAccess * .11
      + sim.continuity * .13
      + sim.readiness * .14
      + sim.coalition * .11
      + sim.political * .10
      + sim.information * .12
      + (100 - sim.escalation) * .08
      + (100 - sim.adversaryTempo) * .07
  ));
}

export function formatTime(minute: number) {
  return `${String(Math.floor(minute / 60) % 24).padStart(2, "0")}:${String(Math.floor(minute) % 60).padStart(2, "0")}Z`;
}

export type FactionView = Omit<Sim, "truth" | "observations"> & { observations: Observation[] };

export function projectFactionView(sim: Sim): FactionView {
  const { truth: _hiddenTruth, observations, ...view } = sim;
  void _hiddenTruth;
  return { ...view, observations: observations.filter(item => item.delivered) };
}

export function validate(sim: Sim) {
  const errors: string[] = [];
  const resources: Array<keyof Sim> = ["bandwidth", "compute", "analystAttention", "storage", "logistics", "readiness", "coalition", "political", "escalation", "information", "exposure", "adversaryTempo", "shippingThroughput", "civilianAccess", "continuity"];
  resources.forEach(key => {
    const value = sim[key] as number;
    if (!Number.isFinite(value) || value < 0 || value > 100) errors.push(`${String(key)} outside bounds`);
  });
  if (sim.decisionPoints < 0 || sim.decisionPoints > 3) errors.push("decision points outside bounds");
  if (!Number.isInteger(sim.minute) || !Number.isInteger(sim.elapsedMinute) || sim.elapsedMinute < 0) errors.push("simulation clock is invalid");
  if (!sim.tracks.some(track => track.id === sim.selected)) errors.push("selected track does not exist");
  sim.effectors.forEach(effector => {
    if (![effector.stock, effector.fuel, effector.readiness, effector.reach, effector.transit].every(Number.isFinite)
      || effector.stock < 0
      || effector.fuel < 0
      || effector.fuel > 100
      || effector.readiness < 0
      || effector.readiness > 100
      || effector.reach < 0
      || effector.transit < 0) errors.push(`${effector.id} violates resource conservation`);
    if (![effector.platform, effector.employmentSystem, effector.payload, effector.missionProfile, effector.stockLabel].every(value => value.trim().length > 0)) errors.push(`${effector.id} has an incomplete package manifest`);
    if (!Number.isInteger(effector.expenditure) || effector.expenditure <= 0) errors.push(`${effector.id} has an invalid inventory expenditure`);
    if (!effector.targetDomains.length) errors.push(`${effector.id} has no supported target domain`);
    if (effector.sourceUnitId && !sim.units.some(unit => unit.id === effector.sourceUnitId)) errors.push(`${effector.id} has no visible source unit`);
  });
  sim.units.forEach(unit => {
    if (!Number.isFinite(unit.position[0]) || !Number.isFinite(unit.position[1])) errors.push(`${unit.id} has an invalid position`);
    if (unit.position[0] < -180 || unit.position[0] > 180) errors.push(`${unit.id} has an invalid longitude`);
    if (unit.position[1] < -90 || unit.position[1] > 90) errors.push(`${unit.id} has an invalid latitude`);
    if (unit.fuel < 0 || unit.fuel > 100 || unit.readiness < 0 || unit.readiness > 100) errors.push(`${unit.id} has an invalid readiness or fuel state`);
    if (!Number.isFinite(unit.speedKnots) || unit.speedKnots < 0) errors.push(`${unit.id} has an invalid speed`);
    if (unit.stationary && unit.speedKnots !== 0) errors.push(`${unit.id} is stationary with nonzero speed`);
    if (!unit.stationary && unit.fuel <= 0 && unit.movement !== "DISABLED" && unit.movement !== "HOLDING") errors.push(`${unit.id} is maneuvering without usable fuel`);
    if (!unit.stationary && unit.route.length < 2) errors.push(`${unit.id} is mobile without a route`);
    if (unit.routeIndex < 0 || unit.routeIndex >= Math.max(1, unit.route.length)) errors.push(`${unit.id} has an invalid route index`);
  });
  const reservationValues = Object.values(sim.reservations);
  if (new Set(Object.keys(sim.reservations)).size !== Object.keys(sim.reservations).length) errors.push("duplicate reservation key");
  reservationValues.forEach(operationId => {
    if (!sim.operations.some(operation => operation.id === operationId && !["COMPLETE", "ABORTED"].includes(operation.status))) errors.push(`orphan reservation ${operationId}`);
  });
  sim.operations.forEach(operation => {
    if (!sim.tracks.some(track => track.id === operation.targetId)) errors.push(`${operation.id} has an invalid target reference`);
    if (!sim.effectors.some(effector => effector.id === operation.effectorId)) errors.push(`${operation.id} has an invalid effector reference`);
    if (operation.supports.some(support => !SUPPORTS.includes(support as typeof SUPPORTS[number]))) errors.push(`${operation.id} has an invalid support reference`);
    if (operation.status === "AUTHORIZED" && !operation.authority) errors.push(`${operation.id} authorized without authority record`);
    if (operation.status === "EXECUTING" && operation.impactAt === undefined) errors.push(`${operation.id} executing without effects window`);
    if (operation.status === "EXECUTING" && !operation.releaseOrigin) errors.push(`${operation.id} executing without a release origin`);
    if (operation.status === "EXECUTING" && !operation.releaseAimpoint) errors.push(`${operation.id} executing without a release aimpoint`);
  });
  sim.tracks.forEach(track => {
    if (!sim.truth.some(truth => truth.id === track.id)) errors.push(`${track.id} has no corresponding hidden truth`);
    const probabilities = track.hypotheses.map(item => item.probability);
    if (probabilities.some(value => !Number.isFinite(value) || value < 0 || value > 100)) errors.push(`${track.id} has an invalid hypothesis probability`);
    if (Math.abs(probabilities.reduce((sum, value) => sum + value, 0) - 100) > 0.0001) errors.push(`${track.id} hypothesis probabilities do not sum to 100`);
    track.evidence.forEach(observationId => {
      if (!sim.observations.some(observation => observation.id === observationId && observation.delivered)) errors.push(`${track.id} references unavailable evidence ${observationId}`);
    });
  });
  sim.collectionTasks.forEach(task => {
    if (!sim.sensors.some(sensor => sensor.id === task.sensorId)) errors.push(`${task.id} has an invalid sensor reference`);
    if (!sim.tracks.some(track => track.id === task.targetId)) errors.push(`${task.id} has an invalid target reference`);
  });
  sim.commandLinks.forEach(link => {
    if (![link.integrity, link.capacity, link.latency].every(Number.isFinite)
      || link.integrity < 0
      || link.integrity > 100
      || link.capacity < 0
      || link.capacity > 100
      || link.latency < 0) errors.push(`${link.id} has an invalid command state`);
  });
  return errors;
}
