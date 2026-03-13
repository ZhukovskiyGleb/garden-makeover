import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Raycaster } from 'three';
import { WORLD_SCALE } from '../config/config.js';
import { GridManager } from '../systems/grid.js';
import { DragControls } from '../systems/controls.js';
import { ObjectManager } from '../objects/objectManager.js';
import { getLightingConfig, getSunPosition } from '../systems/lighting.js';
import { Tutorial } from './tutorial.js';
import { UILayer } from '../ui/uiLayer.js';
import { Injector } from './injector.js';
import { setupSceneForShadows } from '../utils/shadows.js';

const TIME_SPEED = 60;
const CAMERA_MOVE_DURATION = 0.7;

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private cameraTarget = new THREE.Vector3(0, 0, 0);
  private cameraOffset: THREE.Vector3;
  private gridManager = new GridManager();
  private objectManager = new ObjectManager();
  private ambientLight!: THREE.AmbientLight;
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private pointLight!: THREE.PointLight;
  private lastGameHour = -1;
  private gameTimeMs: number;
  private lastRealTime: number;
  private uiLayer!: UILayer;
  private dragControls!: DragControls;
  private buildModeObjectName: string | null = null;
  private buildModeGroundType: number | null = null;
  private raycaster = new Raycaster();
  private mouse = new THREE.Vector2();
  private pointerDownOnPicker = false;
  private ignoreNextCanvasClick = false;
  private tutorial!: Tutorial;
  private cameraTargetStart: THREE.Vector3 | null = null;
  private cameraTargetDestination: THREE.Vector3 | null = null;
  private cameraAnimStartTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a2f1a);

    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const aspect = w / h;

    this.camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 100);
    this.camera.position.set(15, 15, 15);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      stencil: true,
    });
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0x1a2f1a);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.cameraOffset = this.camera.position.clone().sub(this.cameraTarget);

    Injector.game = this;
    Injector.grid = this.gridManager;
    Injector.objects = this.objectManager;
    Injector.scene = this.scene;
    Injector.camera = this.camera;
    Injector.renderer = this.renderer;

    this.setupLights();
    this.gridManager.setup(this.scene);
    this.setupGround();
    this.dragControls = new DragControls(
      canvas,
      this.camera,
      this.cameraTarget,
      this.cameraOffset,
    );
    this.dragControls.setOnClick((x, y) => this.onCanvasClick(x, y));
    this.dragControls.setOnDragStart(() => {
      this.cameraTargetStart = null;
      this.cameraTargetDestination = null;
    });
    this.gameTimeMs = Date.now();
    this.lastRealTime = Date.now();
    this.setupUI();
  }

  private async setupUI(): Promise<void> {
    await this.objectManager.load();

    this.uiLayer = new UILayer();
    await this.uiLayer.init(this.renderer);
    Injector.ui = this.uiLayer;

    this.tutorial = new Tutorial();
    Injector.tutorial = this.tutorial;

    this.uiLayer.wireInjectorEvents();
    this.setupPointer();
    this.tutorial.start();

    this.objectManager.placeDefaults();
  }

  moveCameraToGrid(col: number, row: number): void {
    const worldPos = this.gridManager.gridToWorld(col, row);
    this.cameraTargetStart = this.cameraTarget.clone();
    this.cameraTargetDestination = worldPos.clone();
    this.cameraAnimStartTime = this.clock.getElapsedTime();
  }

  private setupPointer(): void {
    const canvas = this.renderer.domElement;
    canvas.addEventListener(
      'pointerdown',
      () => {
        if (this.uiLayer?.isObjectPickerVisible) {
          this.pointerDownOnPicker = true;
        }
      },
      { capture: true },
    );
  }

  getTutorial(): Tutorial {
    return this.tutorial;
  }

  onObjectSelected(name: string, groundType: number): void {
    this.uiLayer.hideObjectPicker();
    this.buildModeObjectName = name;
    this.buildModeGroundType = groundType;
    this.gridManager.enterBuildMode(groundType);
  }

  onObjectPickerClosed(): void {
    this.ignoreNextCanvasClick = true;
  }

  private onCanvasClick(clientX: number, clientY: number): void {
    const wasOnPicker = this.pointerDownOnPicker;
    const shouldIgnore = this.ignoreNextCanvasClick;
    this.pointerDownOnPicker = false;
    this.ignoreNextCanvasClick = false;
    if (wasOnPicker || shouldIgnore) return;

    if (
      !this.buildModeObjectName ||
      this.buildModeGroundType === null ||
      !this.gridManager.isInBuildMode()
    ) {
      return;
    }
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const tileMeshes = this.gridManager.getTileMeshes();
    const hits = this.raycaster.intersectObjects(tileMeshes);
    if (hits.length === 0) return;
    const hit = hits[0];
    const gridPos = this.gridManager.worldToGrid(hit.point);
    if (!gridPos) return;
    const col = Math.round(gridPos.x);
    const row = Math.round(gridPos.y);
    Injector.tutorial.onMapClicked(col, row);
    const cellValue = this.gridManager.getCellValue(col, row);
    if (cellValue !== this.buildModeGroundType) return;
    this.placeObject(this.buildModeObjectName, new THREE.Vector2(col, row));
    this.buildModeObjectName = null;
    this.buildModeGroundType = null;
    this.gridManager.exitBuildMode();
  }

  private updateCameraAnimation(): void {
    if (!this.cameraTargetDestination || !this.cameraTargetStart) return;
    const elapsed = this.clock.getElapsedTime() - this.cameraAnimStartTime;
    const t = Math.min(1, elapsed / CAMERA_MOVE_DURATION);
    const smoothT = t * t * (3 - 2 * t);
    this.cameraTarget.lerpVectors(
      this.cameraTargetStart,
      this.cameraTargetDestination,
      smoothT,
    );
    this.camera.position.copy(this.cameraTarget).add(this.cameraOffset);
    this.camera.lookAt(this.cameraTarget);
    if (t >= 1) {
      this.cameraTarget.copy(this.cameraTargetDestination);
      this.cameraTargetStart = null;
      this.cameraTargetDestination = null;
    }
  }

  skipTime(): void {
    const SKIP_TIME_MS = 60 * 60 * 1000;
    this.gameTimeMs += SKIP_TIME_MS;
    const currentHour = new Date(this.gameTimeMs).getHours();
    this.applyLighting(currentHour);
    this.objectManager.update(60);
  }

  private setupLights(): void {
    this.ambientLight = new THREE.AmbientLight(0x6080a0, 0.4);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffdd88, 1.4);
    this.dirLight.position.set(5, 12, 6);
    this.dirLight.target.position.set(0, 0, 0);
    this.scene.add(this.dirLight.target);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 50;
    this.dirLight.shadow.camera.left = -12;
    this.dirLight.shadow.camera.right = 12;
    this.dirLight.shadow.camera.top = 12;
    this.dirLight.shadow.camera.bottom = -12;
    this.dirLight.shadow.bias = -0.0001;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d5c3d, 0.7);
    this.scene.add(this.hemiLight);

    this.pointLight = new THREE.PointLight(0xffffff, 0.4, 30, 1.2);
    this.pointLight.position.set(2, 5, 2);
    this.scene.add(this.pointLight);
    this.applyLighting(new Date(this.gameTimeMs).getHours());
  }

  private applyLighting(hour: number): void {
    this.lastGameHour = hour;
    const lighting = getLightingConfig(hour);
    this.ambientLight.intensity = lighting.ambientIntensity;
    this.ambientLight.color.copy(lighting.ambientColor);
    this.dirLight.position.copy(getSunPosition(hour));
    this.dirLight.intensity = lighting.dirIntensity;
    this.dirLight.color.copy(lighting.dirColor);
    this.hemiLight.intensity = lighting.hemiIntensity;
    this.hemiLight.color.copy(lighting.hemiSkyColor);
    this.hemiLight.groundColor.copy(lighting.hemiGroundColor);
    this.pointLight.intensity = lighting.pointIntensity;
    this.pointLight.color.copy(lighting.pointColor);
    this.scene.background = lighting.bgColor;
    this.renderer.setClearColor(lighting.bgColor);
  }

  private setupGround(): void {
    const loader = new GLTFLoader();
    loader.load('./assets/gltf/ground2.glb', (ground) => {
      ground.scene.scale.setScalar(WORLD_SCALE);
      const box = new THREE.Box3().setFromObject(ground.scene);
      const center = box.getCenter(new THREE.Vector3());
      ground.scene.position.sub(center);
      ground.scene.position.y -= box.min.y - 1.5;
      ground.scene.position.x = 0;
      setupSceneForShadows(ground.scene);
      this.scene.add(ground.scene);
    });
  }

  placeObject(name: string, gridPos: THREE.Vector2) {
    console.log('placeObject', name, gridPos);
    return this.objectManager.place(name, gridPos);
  }

  update(_time: number): void {
    const dt = this.clock.getDelta();
    this.objectManager.update(dt);
    this.updateCameraAnimation();

    const now = Date.now();
    const realDelta = now - this.lastRealTime;
    this.lastRealTime = now;
    this.gameTimeMs += realDelta * TIME_SPEED;

    const currentHour = new Date(this.gameTimeMs).getHours();
    if (currentHour !== this.lastGameHour) {
      this.applyLighting(currentHour);
    }

    if (this.uiLayer && this.uiLayer.ready) {
      this.uiLayer.render(this.renderer, this.scene, this.camera, this.gameTimeMs);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  resize(): void {
    const canvas = this.renderer.domElement;
    const parent = canvas.parentElement;
    const w = parent ? parent.clientWidth : window.innerWidth;
    const h = parent ? parent.clientHeight : window.innerHeight;
    if (w <= 0 || h <= 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    if (this.uiLayer && this.uiLayer.ready) {
      this.uiLayer.resize(w, h);
    }
  }
}
