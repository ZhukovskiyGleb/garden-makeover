import * as THREE from 'three';

export class Injector {
  static game: import('./game.js').Game = null!;
  static tutorial: import('./tutorial.js').Tutorial = null!;
  static ui: import('../ui/uiLayer.js').UILayer = null!;
  static grid: import('../systems/grid.js').GridManager = null!;
  static objects: import('../objects/objectManager.js').ObjectManager = null!;
  static scene: THREE.Scene = null!;
  static camera: THREE.PerspectiveCamera = null!;
  static renderer: THREE.WebGLRenderer = null!;
}
