import * as THREE from 'three';

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
    ambientIntensity = 0.35 + t * 0.5;
    ambientColor = new THREE.Color(0x806040).lerp(new THREE.Color(0x6080a0), t);
    dirIntensity = 0.5 + t * 0.7;
    dirColor = new THREE.Color(0xffdd99).lerp(new THREE.Color(0xffffff), t);
    hemiSkyColor = new THREE.Color(0x88aacc).lerp(new THREE.Color(0xaaccff), t);
    hemiGroundColor = new THREE.Color(0x2a4030).lerp(new THREE.Color(0x3a5040), t);
    hemiIntensity = 0.4 + t * 0.5;
    pointIntensity = 0.2 + t * 0.4;
    pointColor = new THREE.Color(0xffeedd).lerp(new THREE.Color(0xffffff), t);
    bgColor = new THREE.Color(0x1a1a10).lerp(new THREE.Color(0x1a2f1a), t);
  } else if (hour >= 8 && hour < 17) {
    ambientIntensity = 0.85;
    ambientColor = new THREE.Color(0x6080a0);
    dirIntensity = 1.2;
    dirColor = new THREE.Color(0xffffff);
    hemiSkyColor = new THREE.Color(0xb8d4f0);
    hemiGroundColor = new THREE.Color(0x4a6040);
    hemiIntensity = 0.9;
    pointIntensity = 0.6;
    pointColor = new THREE.Color(0xffffff);
    bgColor = new THREE.Color(0x1a2f1a);
  } else if (hour >= 17 && hour < 20) {
    const t = (hour - 17) / 3;
    ambientIntensity = 0.85 - t * 0.4;
    ambientColor = new THREE.Color(0x6080a0).lerp(new THREE.Color(0x806050), t);
    dirIntensity = 1.2 - t * 0.6;
    dirColor = new THREE.Color(0xffffff).lerp(new THREE.Color(0xffaa66), t);
    hemiSkyColor = new THREE.Color(0xb8d4f0).lerp(new THREE.Color(0xe8b080), t);
    hemiGroundColor = new THREE.Color(0x4a6040).lerp(new THREE.Color(0x504030), t);
    hemiIntensity = 0.9 - t * 0.4;
    pointIntensity = 0.6 - t * 0.3;
    pointColor = new THREE.Color(0xffffff).lerp(new THREE.Color(0xffcc99), t);
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
