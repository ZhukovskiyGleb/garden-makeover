import * as THREE from 'three';

const SUN_RADIUS = 18;
const SUN_NOON_ELEVATION = 0.85;

export function getSunPosition(hour: number): THREE.Vector3 {
  const h = ((hour - 6) / 12) * Math.PI;
  const elevation =
    hour >= 6 && hour < 18
      ? Math.sin(h) * SUN_NOON_ELEVATION + 0.15
      : -0.3;
  const x = Math.cos(h) * SUN_RADIUS * Math.cos(elevation);
  const z = Math.sin(h) * SUN_RADIUS * Math.cos(elevation);
  const y = Math.sin(elevation) * SUN_RADIUS;
  return new THREE.Vector3(x, Math.max(y, 0.5), z);
}

export interface LightingConfig {
  ambientIntensity: number;
  ambientColor: THREE.Color;
  dirIntensity: number;
  dirColor: THREE.Color;
  hemiSkyColor: THREE.Color;
  hemiGroundColor: THREE.Color;
  hemiIntensity: number;
  pointIntensity: number;
  pointColor: THREE.Color;
  bgColor: THREE.Color;
}

export function getLightingConfig(hour: number): LightingConfig {
  let ambientIntensity: number;
  let ambientColor: THREE.Color;
  let dirIntensity: number;
  let dirColor: THREE.Color;
  let hemiSkyColor: THREE.Color;
  let hemiGroundColor: THREE.Color;
  let hemiIntensity: number;
  let pointIntensity: number;
  let pointColor: THREE.Color;
  let bgColor: THREE.Color;

  if (hour >= 6 && hour < 8) {
    const t = (hour - 6) / 2;
    ambientIntensity = 0.35 + t * 0.35;
    ambientColor = new THREE.Color(0x806040).lerp(new THREE.Color(0x808060), t);
    dirIntensity = 0.5 + t * 1.0;
    dirColor = new THREE.Color(0xffaa66).lerp(new THREE.Color(0xffdd88), t);
    hemiSkyColor = new THREE.Color(0x88aacc).lerp(new THREE.Color(0x87ceeb), t);
    hemiGroundColor = new THREE.Color(0x2a4030).lerp(new THREE.Color(0x3d5c3d), t);
    hemiIntensity = 0.4 + t * 0.45;
    pointIntensity = 0.2 + t * 0.3;
    pointColor = new THREE.Color(0xffeedd).lerp(new THREE.Color(0xffeedd), t);
    bgColor = new THREE.Color(0x1a1a10).lerp(new THREE.Color(0x1a2f1a), t);
  } else if (hour >= 8 && hour < 17) {
    ambientIntensity = 0.5;
    ambientColor = new THREE.Color(0x808060);
    dirIntensity = 1.5;
    dirColor = new THREE.Color(0xffdd88);
    hemiSkyColor = new THREE.Color(0x87ceeb);
    hemiGroundColor = new THREE.Color(0x3d5c3d);
    hemiIntensity = 0.75;
    pointIntensity = 0.4;
    pointColor = new THREE.Color(0xffeedd);
    bgColor = new THREE.Color(0x1a2f1a);
  } else if (hour >= 17 && hour < 20) {
    const t = (hour - 17) / 3;
    ambientIntensity = 0.5 - t * 0.2;
    ambientColor = new THREE.Color(0x808060).lerp(new THREE.Color(0x806050), t);
    dirIntensity = 1.5 - t * 0.9;
    dirColor = new THREE.Color(0xffdd88).lerp(new THREE.Color(0xffaa66), t);
    hemiSkyColor = new THREE.Color(0x87ceeb).lerp(new THREE.Color(0xe8b080), t);
    hemiGroundColor = new THREE.Color(0x3d5c3d).lerp(new THREE.Color(0x504030), t);
    hemiIntensity = 0.75 - t * 0.35;
    pointIntensity = 0.4 - t * 0.2;
    pointColor = new THREE.Color(0xffeedd).lerp(new THREE.Color(0xffcc99), t);
    bgColor = new THREE.Color(0x1a2f1a).lerp(new THREE.Color(0x1a1810), t);
  } else if (hour >= 20 || hour < 5) {
    ambientIntensity = 0.35;
    ambientColor = new THREE.Color(0x403050);
    dirIntensity = 0.3;
    dirColor = new THREE.Color(0x8866bb);
    hemiSkyColor = new THREE.Color(0x404060);
    hemiGroundColor = new THREE.Color(0x201820);
    hemiIntensity = 0.4;
    pointIntensity = 0.15;
    pointColor = new THREE.Color(0xaaaacc);
    bgColor = new THREE.Color(0x1a1525);
  } else {
    const t = (hour - 5) / 1;
    ambientIntensity = 0.35 + t * 0.15;
    ambientColor = new THREE.Color(0x403050).lerp(new THREE.Color(0x806040), t);
    dirIntensity = 0.3 + t * 0.25;
    dirColor = new THREE.Color(0x8866bb).lerp(new THREE.Color(0xffcc88), t);
    hemiSkyColor = new THREE.Color(0x404060).lerp(new THREE.Color(0x88aacc), t);
    hemiGroundColor = new THREE.Color(0x201820).lerp(new THREE.Color(0x2a4030), t);
    hemiIntensity = 0.4 + t * 0.2;
    pointIntensity = 0.15 + t * 0.2;
    pointColor = new THREE.Color(0xaaaacc).lerp(new THREE.Color(0xffeedd), t);
    bgColor = new THREE.Color(0x1a1525).lerp(new THREE.Color(0x1a1a10), t);
  }

  return {
    ambientIntensity,
    ambientColor,
    dirIntensity,
    dirColor,
    hemiSkyColor,
    hemiGroundColor,
    hemiIntensity,
    pointIntensity,
    pointColor,
    bgColor,
  };
}
