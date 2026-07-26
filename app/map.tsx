"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Feature, FeatureCollection, Geometry, LineString, Point, Polygon } from "geojson";
import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import {
  effectorOrigin,
  scenarioById,
  scenarios,
  type FactionView,
  type OperationalUnit,
  type Track,
  type UnitAffiliation,
  type UnitDomain
} from "@/lib/sim";
import { boundsPolygon, circlePolygon, projectCoordinate, type Coordinate } from "@/lib/geography";
import { projectRoutePose } from "@/lib/motion";

export interface LayerState {
  intelligence: boolean;
  threat: boolean;
  shipping: boolean;
  command: boolean;
  units: boolean;
  space: boolean;
}

interface MapProps {
  sim: FactionView;
  layers: LayerState;
  activeSensorId?: string;
  planningEffectorId?: string;
  selectedUnitId?: string;
  rightPanelOpen: boolean;
  timelineExpanded: boolean;
  onSelectTrack: (id: string) => void;
  onSelectUnit: (id: string) => void;
}

type MapMode = "VECTOR" | "SATELLITE";
type MapContext = "WORLD" | "INDO PACIFIC" | "TAIWAN";
type Properties = Record<string, string | number | boolean | null>;

const emptyCollection = (): FeatureCollection<Geometry, Properties> => ({
  type: "FeatureCollection",
  features: []
});

const featureCollection = <G extends Geometry>(features: Array<Feature<G, Properties>>): FeatureCollection<G, Properties> => ({
  type: "FeatureCollection",
  features
});

const pointFeature = (coordinates: Coordinate, properties: Properties): Feature<Point, Properties> => ({
  type: "Feature",
  geometry: { type: "Point", coordinates },
  properties
});

const lineFeature = (coordinates: Coordinate[], properties: Properties): Feature<LineString, Properties> => ({
  type: "Feature",
  geometry: { type: "LineString", coordinates },
  properties
});

const polygonFeature = (coordinates: Coordinate[], properties: Properties): Feature<Polygon, Properties> => ({
  type: "Feature",
  geometry: { type: "Polygon", coordinates: [coordinates] },
  properties
});

const iconName = (affiliation: UnitAffiliation, domain: UnitDomain, echelon: OperationalUnit["echelon"]) =>
  `unit-${affiliation.toLowerCase()}-${domain.toLowerCase()}-${echelon.toLowerCase()}`;

const iconColors: Record<UnitAffiliation, string> = {
  FRIENDLY: "#5B8FE8",
  ALLY: "#77B9DD",
  NEUTRAL: "#9AA6A2",
  CIVILIAN: "#AAB4B1"
};

const drawFrame = (context: CanvasRenderingContext2D, affiliation: UnitAffiliation) => {
  context.lineWidth = 4;
  context.strokeStyle = iconColors[affiliation];
  context.fillStyle = "#10191D";
  context.beginPath();
  if (affiliation === "CIVILIAN") {
    context.arc(32, 32, 23, 0, Math.PI * 2);
  } else if (affiliation === "NEUTRAL") {
    context.rect(9, 9, 46, 46);
  } else if (affiliation === "ALLY") {
    context.moveTo(15, 9);
    context.lineTo(49, 9);
    context.lineTo(57, 17);
    context.lineTo(57, 47);
    context.lineTo(49, 55);
    context.lineTo(15, 55);
    context.lineTo(7, 47);
    context.lineTo(7, 17);
    context.closePath();
  } else {
    context.roundRect(7, 12, 50, 40, 7);
  }
  context.fill();
  context.stroke();
};

const drawDomainGlyph = (context: CanvasRenderingContext2D, affiliation: UnitAffiliation, domain: UnitDomain, echelon: OperationalUnit["echelon"]) => {
  context.strokeStyle = "#F3F0E7";
  context.fillStyle = "#F3F0E7";
  context.lineWidth = 3;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (domain === "AIR") {
    context.beginPath();
    context.moveTo(32, 17);
    context.lineTo(37, 29);
    context.lineTo(51, 36);
    context.lineTo(49, 40);
    context.lineTo(35, 36);
    context.lineTo(35, 47);
    context.lineTo(29, 47);
    context.lineTo(29, 36);
    context.lineTo(15, 40);
    context.lineTo(13, 36);
    context.lineTo(27, 29);
    context.closePath();
    context.fill();
  } else if (domain === "SEA") {
    context.beginPath();
    context.moveTo(15, 31);
    context.lineTo(48, 31);
    context.lineTo(43, 42);
    context.quadraticCurveTo(32, 48, 21, 42);
    context.closePath();
    context.stroke();
    context.beginPath();
    context.moveTo(25, 31);
    context.lineTo(28, 23);
    context.lineTo(39, 23);
    context.lineTo(43, 31);
    context.stroke();
  } else if (domain === "LAND") {
    context.strokeRect(18, 23, 28, 20);
    context.beginPath();
    context.moveTo(21, 47);
    context.lineTo(43, 47);
    context.moveTo(21, 19);
    context.lineTo(43, 19);
    context.stroke();
    context.beginPath();
    context.arc(25, 47, 2, 0, Math.PI * 2);
    context.arc(32, 47, 2, 0, Math.PI * 2);
    context.arc(39, 47, 2, 0, Math.PI * 2);
    context.fill();
  } else {
    context.beginPath();
    context.arc(32, 32, 5, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.ellipse(32, 32, 20, 9, -.35, 0, Math.PI * 2);
    context.stroke();
  }

  if (echelon === "FORMATION") {
    context.fillStyle = iconColors[affiliation];
    context.fillRect(20, 6, 7, 3);
    context.fillRect(29, 6, 7, 3);
    context.fillRect(38, 6, 7, 3);
  }
};

const registerSymbolAtlas = (map: MapLibreMap) => {
  const affiliations: UnitAffiliation[] = ["FRIENDLY", "ALLY", "NEUTRAL", "CIVILIAN"];
  const domains: UnitDomain[] = ["AIR", "SEA", "LAND", "SPACE"];
  const echelons: OperationalUnit["echelon"][] = ["FORMATION", "PLATFORM", "FACILITY"];
  for (const affiliation of affiliations) {
    for (const domain of domains) {
      for (const echelon of echelons) {
        const name = iconName(affiliation, domain, echelon);
        if (map.hasImage(name)) continue;
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext("2d");
        if (!context) continue;
        drawFrame(context, affiliation);
        drawDomainGlyph(context, affiliation, domain, echelon);
        map.addImage(name, context.getImageData(0, 0, 64, 64), { pixelRatio: 2 });
      }
    }
  }

  if (!map.hasImage("track-unknown")) {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (context) {
      context.translate(32, 32);
      context.rotate(Math.PI / 4);
      context.fillStyle = "#11191B";
      context.strokeStyle = "#F2A43C";
      context.lineWidth = 4;
      context.fillRect(-20, -20, 40, 40);
      context.strokeRect(-20, -20, 40, 40);
      context.rotate(-Math.PI / 4);
      context.fillStyle = "#F3F0E7";
      context.font = "700 28px system-ui";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("?", 0, 1);
      map.addImage("track-unknown", context.getImageData(0, 0, 64, 64), { pixelRatio: 2 });
    }
  }
};

const addGeoJsonSource = (map: MapLibreMap, id: string) => {
  if (!map.getSource(id)) map.addSource(id, { type: "geojson", data: emptyCollection() });
};

const setSourceData = (map: MapLibreMap | null, id: string, data: FeatureCollection<Geometry, Properties>) => {
  const source = map?.getSource(id) as GeoJSONSource | undefined;
  if (source) source.setData(data);
};

const visibility = (enabled: boolean) => enabled ? "visible" : "none";

const trackPosition = (track: Track, fraction: number): Coordinate =>
  track.stationary ? track.position : projectCoordinate(track.position, track.heading, track.speedKnots * fraction / 60);

export default function Map({
  sim,
  layers,
  activeSensorId,
  planningEffectorId,
  selectedUnitId,
  rightPanelOpen,
  timelineExpanded,
  onSelectTrack,
  onSelectUnit
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectTrackRef = useRef(onSelectTrack);
  const onSelectUnitRef = useRef(onSelectUnit);
  const simRef = useRef(sim);
  const layersRef = useRef(layers);
  const selectedUnitIdRef = useRef(selectedUnitId);
  const tickStartedAtRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [mode, setMode] = useState<MapMode>("VECTOR");
  const [context, setContext] = useState<MapContext>("INDO PACIFIC");
  const [zoom, setZoom] = useState(4.3);
  const scenario = scenarioById[sim.scenarioId] ?? scenarioById.taiwan;
  const [selectedZoneId, setSelectedZoneId] = useState<string>();
  const selectedZone = scenario.exerciseZones?.find(zone => zone.id === selectedZoneId);

  const mapData = useMemo(() => {
    const unitFeatures = sim.units.filter(unit => layers.space || unit.domain !== "SPACE").map(unit => {
      const pose = projectRoutePose(unit, 0);
      return pointFeature(pose.position, {
        id: unit.id,
        callsign: unit.callsign,
        owner: unit.owner,
        affiliation: unit.affiliation,
        domain: unit.domain,
        echelon: unit.echelon,
        kind: unit.kind,
        heading: pose.heading,
        moving: !unit.stationary,
        selected: unit.id === selectedUnitId,
        icon: iconName(unit.affiliation, unit.domain, unit.echelon)
      });
    });

    const trackFeatures = sim.tracks.map(track => {
      const top = [...track.hypotheses].sort((a, b) => b.probability - a.probability)[0];
      return pointFeature(trackPosition(track, 0), {
        id: track.id,
        callsign: track.callsign,
        domain: track.domain,
        confidence: top.probability,
        stage: track.stage,
        status: track.status,
        selected: track.id === sim.selected && !selectedUnitId
      });
    });

    const uncertaintyFeatures = sim.tracks.map(track => polygonFeature(
      circlePolygon(trackPosition(track, 0), Math.max(3, track.uncertainty), 48),
      {
        id: track.id,
        selected: track.id === sim.selected,
        lost: track.status === "LOST"
      }
    ));

    const trailFeatures: Array<Feature<LineString, Properties>> = [];
    for (const unit of sim.units) {
      if (unit.trail.length > 1) trailFeatures.push(lineFeature([...unit.trail, projectRoutePose(unit, 0).position], { id: unit.id, type: "UNIT", selected: unit.id === selectedUnitId }));
    }
    for (const track of sim.tracks) {
      if (track.history.length > 1) trailFeatures.push(lineFeature([...track.history, trackPosition(track, 0)], { id: track.id, type: "TRACK", selected: track.id === sim.selected }));
    }
    const orbitFeatures = sim.units
      .filter(unit => unit.domain === "SPACE" && unit.route.length > 1)
      .map(unit => lineFeature(unit.route, { id: unit.id, callsign: unit.callsign, affiliation: unit.affiliation }));

    const selectedUnit = sim.units.find(unit => unit.id === selectedUnitId);
    const routeFeatures: Array<Feature<LineString, Properties>> = [];
    if (selectedUnit?.route.length) routeFeatures.push(lineFeature([selectedUnit.position, ...selectedUnit.route.slice(selectedUnit.routeIndex)], { id: selectedUnit.id, type: "UNIT ROUTE" }));
    const selectedTrack = sim.tracks.find(track => track.id === sim.selected);
    const selectedEffector = sim.effectors.find(effector => effector.id === planningEffectorId);
    const selectedOperation = sim.operations.find(operation => operation.targetId === sim.selected && operation.status !== "ABORTED");
    if (selectedOperation?.releaseOrigin && selectedOperation.releaseAimpoint) {
      routeFeatures.push(lineFeature(
        [selectedOperation.releaseOrigin, selectedOperation.releaseAimpoint],
        { id: selectedOperation.id, type: "EXECUTED PACKAGE" }
      ));
    } else if (selectedTrack && selectedEffector) {
      routeFeatures.push(lineFeature(
        [effectorOrigin(sim, selectedEffector), selectedTrack.position],
        { id: selectedEffector.id, type: "EFFECT PACKAGE" }
      ));
    }

    const sensorFeatures: Array<Feature<Polygon, Properties>> = [];
    const selectedSensor = sim.sensors.find(sensor => sensor.id === activeSensorId);
    if (selectedTrack && selectedSensor) {
      const radius = selectedSensor.id === "sat" ? 95 : selectedSensor.id === "uav" ? 55 : 35;
      sensorFeatures.push(polygonFeature(circlePolygon(trackPosition(selectedTrack, 0), radius), { id: selectedSensor.id, label: selectedSensor.name }));
    }

    return {
      units: featureCollection(unitFeatures),
      tracks: featureCollection(trackFeatures),
      uncertainty: featureCollection(uncertaintyFeatures),
      trails: featureCollection(trailFeatures),
      orbits: featureCollection(orbitFeatures),
      routes: featureCollection(routeFeatures),
      sensors: featureCollection(sensorFeatures)
    };
  }, [activeSensorId, layers.space, planningEffectorId, selectedUnitId, sim]);

  useEffect(() => {
    simRef.current = sim;
    layersRef.current = layers;
    selectedUnitIdRef.current = selectedUnitId;
    tickStartedAtRef.current = performance.now();
  }, [layers, selectedUnitId, sim]);

  useEffect(() => {
    onSelectTrackRef.current = onSelectTrack;
    onSelectUnitRef.current = onSelectUnit;
  }, [onSelectTrack, onSelectUnit]);

  const staticData = useMemo(() => {
    const theaterAreas = scenarios.map(item => polygonFeature(boundsPolygon(item.bounds), {
      id: item.id,
      label: item.region,
      active: item.id === sim.scenarioId,
      locked: Boolean(item.locked)
    }));
    const theaterCenters = scenarios.map(item => pointFeature(
      [(item.bounds[0] + item.bounds[2]) / 2, (item.bounds[1] + item.bounds[3]) / 2],
      { id: item.id, label: item.region, active: item.id === sim.scenarioId, locked: Boolean(item.locked) }
    ));
    return {
      theaters: featureCollection(theaterAreas),
      theaterCenters: featureCollection(theaterCenters),
      zones: featureCollection((scenario.exerciseZones ?? []).map(zone => polygonFeature(zone.ring, {
        id: zone.id,
        label: `${zone.code} · ${zone.label}`,
        tone: zone.tone
      }))),
      lanes: featureCollection(scenario.lanes.map(lane => lineFeature(lane.points, { id: lane.id, label: lane.label, throughput: lane.throughput }))),
      nodes: featureCollection(scenario.nodes.map(node => pointFeature(node.position, { id: node.id, label: node.label, type: node.type, side: node.side })))
    };
  }, [scenario, sim.scenarioId]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let loadTimeout = 0;

    void import("maplibre-gl").then(module => {
      if (cancelled || !containerRef.current) return;
      const map = new module.Map({
        container: containerRef.current,
        style: "https://tiles.openfreemap.org/styles/fiord",
        center: [122.5, 23.5],
        zoom: 4.3,
        minZoom: 1,
        maxZoom: 15,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        renderWorldCopies: true
      });
      mapRef.current = map;
      map.addControl(new module.NavigationControl({ showCompass: true, visualizePitch: false }), "bottom-right");
      map.addControl(new module.ScaleControl({ maxWidth: 120, unit: "nautical" }), "bottom-left");
      map.addControl(new module.AttributionControl({ compact: true }), "bottom-right");

      const handleZoom = () => setZoom(map.getZoom());
      const handleMoveEnd = () => {
        const currentZoom = map.getZoom();
        setContext(currentZoom < 2.6 ? "WORLD" : currentZoom >= 5.5 ? "TAIWAN" : "INDO PACIFIC");
      };
      map.on("zoom", handleZoom);
      map.on("moveend", handleMoveEnd);
      map.on("load", () => {
        if (cancelled) return;
        window.clearTimeout(loadTimeout);
        registerSymbolAtlas(map);
        [
          "theaters",
          "theater-centers",
          "zones",
          "lanes",
          "nodes",
          "units",
          "tracks",
          "uncertainty",
          "trails",
          "orbits",
          "routes",
          "sensors"
        ].forEach(id => addGeoJsonSource(map, id));

        map.addSource("satellite", {
          type: "raster",
          tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
          tileSize: 256,
          attribution: "Esri, Maxar, Earthstar Geographics, and the GIS User Community"
        });
        const firstBaseLabel = map.getStyle().layers.find(layer => layer.type === "symbol")?.id;
        map.addLayer(
          { id: "satellite-base", type: "raster", source: "satellite", layout: { visibility: "none" }, paint: { "raster-opacity": .92 } },
          firstBaseLabel
        );

        map.addLayer({
          id: "theater-fill",
          type: "fill",
          source: "theaters",
          maxzoom: 4.2,
          paint: {
            "fill-color": ["case", ["==", ["get", "active"], true], "#5B8FE8", "#77817E"],
            "fill-opacity": ["case", ["==", ["get", "active"], true], .10, ["==", ["get", "locked"], true], .018, .035]
          }
        });
        map.addLayer({
          id: "theater-outline",
          type: "line",
          source: "theaters",
          maxzoom: 4.2,
          paint: {
            "line-color": ["case", ["==", ["get", "active"], true], "#8DB5FA", "#788581"],
            "line-width": ["case", ["==", ["get", "active"], true], 2.2, 1],
            "line-opacity": ["case", ["==", ["get", "active"], true], .85, ["==", ["get", "locked"], true], .24, .42],
            "line-dasharray": [3, 2]
          }
        });
        map.addLayer({
          id: "theater-labels",
          type: "symbol",
          source: "theater-centers",
          maxzoom: 4.3,
          layout: {
            "text-field": ["get", "label"],
            "text-font": ["Noto Sans Bold"],
            "text-size": ["case", ["==", ["get", "active"], true], 15, 12],
            "text-letter-spacing": .08
          },
          paint: {
            "text-color": ["case", ["==", ["get", "active"], true], "#F3F0E7", "#A7B1AE"],
            "text-halo-color": "#0A1113",
            "text-halo-width": 2
          }
        });
        map.addLayer({
          id: "space-orbits",
          type: "line",
          source: "orbits",
          maxzoom: 4.8,
          paint: {
            "line-color": "#8DB5FA",
            "line-width": 1.2,
            "line-opacity": .48,
            "line-dasharray": [2, 2]
          }
        });
        map.addLayer({
          id: "space-icons",
          type: "symbol",
          source: "units",
          maxzoom: 5.5,
          filter: ["==", ["get", "domain"], "SPACE"],
          layout: {
            "icon-image": ["get", "icon"],
            "icon-size": ["case", ["==", ["get", "selected"], true], 1.32, 1.12],
            "icon-allow-overlap": true,
            "icon-rotate": ["get", "heading"],
            "icon-rotation-alignment": "map"
          }
        });
        map.addLayer({
          id: "space-labels",
          type: "symbol",
          source: "units",
          minzoom: 1.2,
          maxzoom: 4.8,
          filter: ["==", ["get", "domain"], "SPACE"],
          layout: {
            "text-field": ["get", "callsign"],
            "text-size": 11,
            "text-offset": [0, 1.75],
            "text-anchor": "top",
            "text-optional": true
          },
          paint: {
            "text-color": "#C8DBFF",
            "text-halo-color": "#0A1113",
            "text-halo-width": 2
          }
        });
        map.addLayer({
          id: "shipping-lanes",
          type: "line",
          source: "lanes",
          minzoom: 3.2,
          paint: {
            "line-color": "#7EBFD1",
            "line-opacity": .58,
            "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1, 8, 2.5],
            "line-dasharray": [3, 3]
          }
        });
        map.addLayer({
          id: "exercise-zones",
          type: "fill",
          source: "zones",
          minzoom: 3.5,
          paint: {
            "fill-color": ["get", "tone"],
            "fill-opacity": .10
          }
        });
        map.addLayer({
          id: "exercise-zone-outlines",
          type: "line",
          source: "zones",
          minzoom: 3.5,
          paint: {
            "line-color": ["get", "tone"],
            "line-opacity": .82,
            "line-width": 1.6,
            "line-dasharray": [4, 2]
          }
        });
        map.addLayer({
          id: "exercise-zone-labels",
          type: "symbol",
          source: "zones",
          minzoom: 4.1,
          layout: {
            "text-field": ["get", "label"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 4.1, 10, 7, 12],
            "text-letter-spacing": .04,
            "text-max-width": 12,
            "text-optional": true
          },
          paint: {
            "text-color": "#F3C77E",
            "text-halo-color": "#11191B",
            "text-halo-width": 2
          }
        });
        map.addLayer({
          id: "sensor-areas",
          type: "fill",
          source: "sensors",
          minzoom: 4,
          paint: {
            "fill-color": "#5B8FE8",
            "fill-opacity": .08,
            "fill-outline-color": "#8DB5FA"
          }
        });
        map.addLayer({
          id: "track-uncertainty",
          type: "fill",
          source: "uncertainty",
          minzoom: 4,
          paint: {
            "fill-color": "#F2A43C",
            "fill-opacity": ["case", ["==", ["get", "selected"], true], .16, .07],
            "fill-outline-color": "#F2A43C"
          }
        });
        map.addLayer({
          id: "entity-trails",
          type: "line",
          source: "trails",
          minzoom: 4.2,
          paint: {
            "line-color": ["case", ["==", ["get", "type"], "TRACK"], "#F2A43C", "#8DB5FA"],
            "line-opacity": ["case", ["==", ["get", "selected"], true], .8, .32],
            "line-width": ["case", ["==", ["get", "selected"], true], 2.4, 1.2]
          }
        });
        map.addLayer({
          id: "planned-routes",
          type: "line",
          source: "routes",
          minzoom: 3.8,
          paint: {
            "line-color": ["case", ["in", ["get", "type"], ["literal", ["EFFECT PACKAGE", "EXECUTED PACKAGE"]]], "#F2A43C", "#8DB5FA"],
            "line-opacity": .9,
            "line-width": 2.5,
            "line-dasharray": [2, 2]
          }
        });
        map.addLayer({
          id: "node-circles",
          type: "circle",
          source: "nodes",
          minzoom: 4,
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 4, 8, 7],
            "circle-color": ["match", ["get", "side"], "FRIENDLY", "#5B8FE8", "UNKNOWN", "#E86868", "#9AA6A2"],
            "circle-stroke-color": "#F3F0E7",
            "circle-stroke-width": 1.2
          }
        });
        map.addLayer({
          id: "node-labels",
          type: "symbol",
          source: "nodes",
          minzoom: 6,
          layout: {
            "text-field": ["get", "label"],
            "text-size": 12,
            "text-offset": [0, 1.25],
            "text-anchor": "top"
          },
          paint: {
            "text-color": "#F3F0E7",
            "text-halo-color": "#11191B",
            "text-halo-width": 2
          }
        });
        map.addLayer({
          id: "unit-formation-icons",
          type: "symbol",
          source: "units",
          minzoom: 2.6,
          maxzoom: 5.8,
          filter: ["==", ["get", "echelon"], "FORMATION"],
          layout: {
            "icon-image": ["get", "icon"],
            "icon-size": ["case", ["==", ["get", "selected"], true], 1.28, 1.10],
            "icon-allow-overlap": true,
            "icon-rotate": ["get", "heading"],
            "icon-rotation-alignment": "map"
          }
        });
        map.addLayer({
          id: "unit-formation-labels",
          type: "symbol",
          source: "units",
          minzoom: 3.2,
          maxzoom: 5.8,
          filter: ["==", ["get", "echelon"], "FORMATION"],
          layout: {
            "text-field": ["get", "callsign"],
            "text-size": 12,
            "text-offset": [0, 1.85],
            "text-anchor": "top",
            "text-optional": true
          },
          paint: {
            "text-color": "#F3F0E7",
            "text-halo-color": "#11191B",
            "text-halo-width": 2
          }
        });
        map.addLayer({
          id: "unit-facility-icons",
          type: "symbol",
          source: "units",
          minzoom: 3.5,
          filter: ["==", ["get", "echelon"], "FACILITY"],
          layout: {
            "icon-image": ["get", "icon"],
            "icon-size": ["case", ["==", ["get", "selected"], true], 1.22, 1.05],
            "icon-allow-overlap": true
          }
        });
        map.addLayer({
          id: "unit-platform-icons",
          type: "symbol",
          source: "units",
          minzoom: 5.8,
          filter: ["==", ["get", "echelon"], "PLATFORM"],
          layout: {
            "icon-image": ["get", "icon"],
            "icon-size": ["case", ["==", ["get", "selected"], true], 1.22, 1.04],
            "icon-allow-overlap": true,
            "icon-rotate": ["get", "heading"],
            "icon-rotation-alignment": "map"
          }
        });
        map.addLayer({
          id: "unit-labels",
          type: "symbol",
          source: "units",
          minzoom: 6.2,
          filter: ["!=", ["get", "echelon"], "FORMATION"],
          layout: {
            "text-field": ["get", "callsign"],
            "text-size": 12,
            "text-offset": [0, 1.65],
            "text-anchor": "top",
            "text-optional": true
          },
          paint: {
            "text-color": "#F3F0E7",
            "text-halo-color": "#11191B",
            "text-halo-width": 2
          }
        });
        map.addLayer({
          id: "track-icons",
          type: "symbol",
          source: "tracks",
          minzoom: 4,
          layout: {
            "icon-image": "track-unknown",
            "icon-size": ["case", ["==", ["get", "selected"], true], 1.24, 1.06],
            "icon-allow-overlap": true
          }
        });
        map.addLayer({
          id: "track-labels",
          type: "symbol",
          source: "tracks",
          minzoom: 4.8,
          layout: {
            "text-field": ["concat", ["get", "callsign"], "  ", ["to-string", ["get", "confidence"]], "%"],
            "text-size": 12,
            "text-offset": [0, 1.65],
            "text-anchor": "top",
            "text-optional": true
          },
          paint: {
            "text-color": "#F7D497",
            "text-halo-color": "#11191B",
            "text-halo-width": 2
          }
        });

        const unitClick = (event: MapLayerMouseEvent) => {
          const id = event.features?.[0]?.properties?.id;
          if (typeof id === "string") onSelectUnitRef.current(id);
        };
        const trackClick = (event: MapLayerMouseEvent) => {
          const id = event.features?.[0]?.properties?.id;
          if (typeof id === "string") onSelectTrackRef.current(id);
        };
        ["unit-formation-icons", "unit-facility-icons", "unit-platform-icons", "space-icons"].forEach(layerId => {
          map.on("click", layerId, unitClick);
          map.on("mouseenter", layerId, () => { map.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", layerId, () => { map.getCanvas().style.cursor = ""; });
        });
        map.on("click", "track-icons", trackClick);
        map.on("mouseenter", "track-icons", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "track-icons", () => { map.getCanvas().style.cursor = ""; });
        map.on("click", "exercise-zones", event => {
          const id = event.features?.[0]?.properties?.id;
          if (typeof id === "string") setSelectedZoneId(id);
        });
        map.on("mouseenter", "exercise-zones", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "exercise-zones", () => { map.getCanvas().style.cursor = ""; });

        setMapReady(true);
        setMapError("");
      });
      map.on("error", () => {
        if (!map.isStyleLoaded()) setMapError("The geographic basemap could not load. Check the connection and retry the map.");
      });
      map.on("idle", () => {
        if (map.isStyleLoaded()) {
          window.clearTimeout(loadTimeout);
          setMapError("");
        }
      });
      loadTimeout = window.setTimeout(() => {
        if (!map.isStyleLoaded()) setMapError("The geographic basemap is taking longer than expected to load.");
      }, 10000);
    }).catch(() => setMapError("The geographic map engine could not start."));

    return () => {
      cancelled = true;
      window.clearTimeout(loadTimeout);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    setSourceData(mapRef.current, "theaters", staticData.theaters);
    setSourceData(mapRef.current, "theater-centers", staticData.theaterCenters);
    setSourceData(mapRef.current, "zones", staticData.zones);
    setSourceData(mapRef.current, "lanes", staticData.lanes);
    setSourceData(mapRef.current, "nodes", staticData.nodes);
  }, [mapReady, staticData]);

  useEffect(() => {
    if (!mapReady) return;
    setSourceData(mapRef.current, "units", mapData.units);
    setSourceData(mapRef.current, "tracks", mapData.tracks);
    setSourceData(mapRef.current, "uncertainty", mapData.uncertainty);
    setSourceData(mapRef.current, "trails", mapData.trails);
    setSourceData(mapRef.current, "orbits", mapData.orbits);
    setSourceData(mapRef.current, "routes", mapData.routes);
    setSourceData(mapRef.current, "sensors", mapData.sensors);
  }, [mapData, mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    let frame = 0;
    let lastFrameAt = 0;

    const animateEntities = (time: number) => {
      const current = simRef.current;
      if (!current.paused && time - lastFrameAt >= 33) {
        lastFrameAt = time;
        const fraction = Math.min(.999, Math.max(0, (time - tickStartedAtRef.current) * current.speed / 1000));
        const currentSelectedUnitId = selectedUnitIdRef.current;
        const unitFeatures = current.units
          .filter(unit => layersRef.current.space || unit.domain !== "SPACE")
          .map(unit => {
            const pose = projectRoutePose(unit, fraction);
            return pointFeature(pose.position, {
              id: unit.id,
              callsign: unit.callsign,
              owner: unit.owner,
              affiliation: unit.affiliation,
              domain: unit.domain,
              echelon: unit.echelon,
              kind: unit.kind,
              heading: pose.heading,
              moving: !unit.stationary,
              selected: unit.id === currentSelectedUnitId,
              icon: iconName(unit.affiliation, unit.domain, unit.echelon)
            });
          });
        const trackFeatures = current.tracks.map(track => {
          const top = [...track.hypotheses].sort((a, b) => b.probability - a.probability)[0];
          return pointFeature(trackPosition(track, fraction), {
            id: track.id,
            callsign: track.callsign,
            domain: track.domain,
            confidence: top.probability,
            stage: track.stage,
            status: track.status,
            selected: track.id === current.selected && !currentSelectedUnitId
          });
        });
        setSourceData(mapRef.current, "units", featureCollection(unitFeatures));
        setSourceData(mapRef.current, "tracks", featureCollection(trackFeatures));
      }
      frame = window.requestAnimationFrame(animateEntities);
    };

    frame = window.requestAnimationFrame(animateEntities);
    return () => window.cancelAnimationFrame(frame);
  }, [mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const setLayout = (id: string, enabled: boolean) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visibility(enabled));
    };
    setLayout("shipping-lanes", layers.shipping);
    ["exercise-zones", "exercise-zone-outlines", "exercise-zone-labels"].forEach(id => setLayout(id, layers.threat));
    ["track-uncertainty", "track-icons", "track-labels"].forEach(id => setLayout(id, layers.intelligence));
    ["unit-formation-icons", "unit-formation-labels", "unit-platform-icons", "unit-facility-icons", "unit-labels"].forEach(id => setLayout(id, layers.units));
    ["space-orbits", "space-icons", "space-labels"].forEach(id => setLayout(id, layers.space));
    setLayout("sensor-areas", Boolean(activeSensorId));
    const hasSelectedOperation = sim.operations.some(operation => operation.targetId === sim.selected && operation.status !== "ABORTED");
    setLayout("planned-routes", layers.command || Boolean(planningEffectorId) || Boolean(selectedUnitId) || hasSelectedOperation);
    setLayout("entity-trails", layers.command || Boolean(selectedUnitId));
  }, [activeSensorId, layers, mapReady, planningEffectorId, selectedUnitId, sim.operations, sim.selected]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    if (map.getLayer("satellite-base")) map.setLayoutProperty("satellite-base", "visibility", mode === "SATELLITE" ? "visible" : "none");
  }, [mapReady, mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    map.easeTo({ padding: { top: 64, right: rightPanelOpen ? 400 : 24, bottom: timelineExpanded ? 236 : 76, left: 64 }, duration: 180 });
  }, [mapReady, rightPanelOpen, timelineExpanded]);

  const flyToContext = useCallback((target: MapContext) => {
    const map = mapRef.current;
    if (!map) return;
    setContext(target);
    if (target === "WORLD") {
      map.setProjection({ type: "globe" });
      map.easeTo({ center: [112, 18], zoom: 1.4, bearing: 0, pitch: 0, duration: 900 });
      return;
    }
    map.setProjection({ type: "mercator" });
    const bounds: [[number, number], [number, number]] = target === "TAIWAN"
      ? [[scenario.bounds[0], scenario.bounds[1]], [scenario.bounds[2], scenario.bounds[3]]]
      : [[108, 5], [150, 42]];
    map.fitBounds(bounds, {
      padding: { top: 82, right: rightPanelOpen ? 410 : 40, bottom: timelineExpanded ? 238 : 92, left: 72 },
      duration: target === "TAIWAN" ? 650 : 900
    });
  }, [rightPanelOpen, scenario.bounds, timelineExpanded]);

  const contextCopy = zoom < 2.6
    ? "World command"
    : zoom < 4.5
      ? "Regional command"
      : zoom < 7
        ? "Theater command"
        : zoom < 10
          ? "Operational control"
          : "Maven detail";

  const visibleUnits = sim.units.filter(unit => layers.units && (layers.space || unit.domain !== "SPACE"));

  return (
    <section className="mapViewport" aria-label="Interactive global operational map">
      <div ref={containerRef} className="mapSurface" />

      {!mapReady && !mapError && <div className="mapLoading" role="status"><span>Loading geographic operating picture</span></div>}
      {mapError && <div className="mapError" role="alert"><b>Map connection degraded</b><span>{mapError}</span><button onClick={() => window.location.reload()}>Retry map</button></div>}

      <div className="mapHudControls" aria-label="Map view controls">
        <div className="mapModeGroup" role="group" aria-label="Geographic scope">
          {(["WORLD", "INDO PACIFIC", "TAIWAN"] as MapContext[]).map(target => (
            <button key={target} aria-pressed={context === target} className={`mapModeButton ${context === target ? "active" : ""}`} onClick={() => flyToContext(target)}>{target === "INDO PACIFIC" ? "Theater" : target === "TAIWAN" ? "Strait" : "World"}</button>
          ))}
        </div>
        <div className="mapModeGroup" role="group" aria-label="Basemap">
          {(["VECTOR", "SATELLITE"] as MapMode[]).map(target => (
            <button key={target} aria-pressed={mode === target} className={`mapModeButton ${mode === target ? "active" : ""}`} onClick={() => setMode(target)}>{target === "VECTOR" ? "Vector" : "Satellite"}</button>
          ))}
        </div>
      </div>

      <div className="mapContextLabel">
        <span>{contextCopy}</span>
        <b>{context === "WORLD" ? "Global operating picture" : context === "TAIWAN" ? "Taiwan Strait" : "Indo Pacific"}</b>
        <small>Zoom {zoom.toFixed(1)} · {visibleUnits.length} reported entities</small>
      </div>

      {selectedZone && (
        <aside className="zoneReadout" aria-label={`${selectedZone.code} exercise area details`}>
          <header>
            <span className="mono">{selectedZone.code}</span>
            <button onClick={() => setSelectedZoneId(undefined)} aria-label="Close exercise area details">×</button>
          </header>
          <h3>{selectedZone.label}</h3>
          <p>{selectedZone.role}</p>
          <div>
            <span>Published vertices</span>
            {selectedZone.sourceCoordinates.map(coordinate => <code key={coordinate}>{coordinate}</code>)}
          </div>
          <small>{selectedZone.restriction}</small>
        </aside>
      )}

      <div className="mapLegend" aria-label="Map legend">
        <span className="mapLegendItem friendly"><i />Friendly</span>
        <span className="mapLegendItem ally"><i />Partner</span>
        <span className="mapLegendItem unknown"><i />Inferred track</span>
        <span className="mapLegendItem civilian"><i />Civilian</span>
      </div>

      <div className="srOnly" aria-live="polite">
        {selectedUnitId
          ? `${sim.units.find(unit => unit.id === selectedUnitId)?.callsign ?? "Unit"} selected`
          : `${sim.tracks.find(track => track.id === sim.selected)?.callsign ?? "Track"} selected`}
      </div>
      <ul className="srOnly" aria-label="Visible map entities">
        {visibleUnits.map(unit => <li key={unit.id}>{unit.callsign}, {unit.owner}, {unit.domain}, {unit.mission}</li>)}
        {layers.intelligence && sim.tracks.map(track => <li key={track.id}>{track.callsign}, inferred {track.domain} track, {track.status}</li>)}
      </ul>
    </section>
  );
}
