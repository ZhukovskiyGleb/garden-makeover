import { WebGLRenderer as PixiRenderer, Container, Text, Graphics } from 'pixi.js';
import * as THREE from 'three';
import { Button } from './elements/button.js';
import { ObjectPicker, type ObjectItem } from './objectPicker.js';
import { MessagePopup } from './elements/messagePopup.js';
import { Injector } from '../core/injector.js';
import objectsData from '../config/objects.json';

const TIMER_PAD = 12;
const TIMER_RADIUS = 8;

export class UILayer {
  readonly stage = new Container();
  private pixiRenderer!: PixiRenderer;
  private _ready = false;
  private skipTimeButton!: Button;
  private plusButton!: Button;
  private objectPicker = new ObjectPicker();
  private messagePopup = new MessagePopup();
  private timerLabel!: Text;
  private timerBg!: Graphics;
  private timerContainer!: Container;
  private screenWidth: number = 0;
  private screenHeight: number = 0;
  private cellHighlightWorldPos: THREE.Vector3 | null = null;
  private cellHighlightRing: Graphics | null = null;

  private getPixelRatio(): number {
    return Math.min(window.devicePixelRatio || 1, 2);
  }

  async init(threeRenderer: THREE.WebGLRenderer): Promise<void> {
    const canvas = threeRenderer.domElement;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    this.screenWidth = w;
    this.screenHeight = h;

    this.stage.eventMode = 'static';

    this.pixiRenderer = new PixiRenderer();
    await this.pixiRenderer.init({
      canvas: canvas,
      context: threeRenderer.getContext() as WebGL2RenderingContext,
      width: w,
      height: h,
      resolution: 1,
      clearBeforeRender: false,
    });
    const accessibility = this.pixiRenderer.accessibility;
    if (accessibility) {
      accessibility.setAccessibilityEnabled(false);
      const hook = accessibility.hookDiv;
      if (hook?.parentNode) {
        hook.parentNode.removeChild(hook);
      }
    }

    this._ready = true;
    this.setupUI();
  }

  private setupUI(): void {
    this.timerContainer = new Container();
    this.timerLabel = new Text({
      text: '00:00',
      style: {
        fontFamily: 'sans-serif',
        fontSize: 36,
        fontWeight: 'bold',
        fill: '#ffffff',
        dropShadow: {
          color: '#000000',
          blur: 4,
          distance: 2,
          alpha: 0.8,
        },
      },
    });
    this.timerBg = new Graphics();
    this.timerLabel.x = TIMER_PAD;
    this.timerLabel.y = TIMER_PAD;
    this.timerContainer.addChild(this.timerBg, this.timerLabel);
    this.timerContainer.x = TIMER_PAD;
    this.timerContainer.y = TIMER_PAD;
    this.stage.addChild(this.timerContainer);
    this.updateTimerBg();

    const skipTimeX = this.screenWidth - 115;
    const skipTimeY = 10;
    this.skipTimeButton = new Button(this, './assets/images/skip_day.png', {
      x: skipTimeX,
      y: skipTimeY,
      scale: 0.4,
    });
    const plusX = this.screenWidth - 115;
    const plusY = this.screenHeight - 115;
    this.plusButton = new Button(this, './assets/images/plus.png', {
      x: plusX,
      y: plusY,
      scale: 0.4,
    });
  }

  highlightPlusButton(): void {
    this.plusButton.setTutorialHighlight(true);
  }

  unhighlightPlusButton(): void {
    this.plusButton.setTutorialHighlight(false);
  }

  highlightSkipTimeButton(): void {
    this.skipTimeButton.setTutorialHighlight(true);
  }

  unhighlightSkipTimeButton(): void {
    this.skipTimeButton.setTutorialHighlight(false);
  }

  private getObjectItems(): ObjectItem[] {
    const objects = objectsData.objects as Record<
      string,
      { image?: string; groundType?: number }
    >;
    return Object.entries(objects)
      .filter(
        ([, config]) =>
          config.image &&
          config.image.length > 0 &&
          config.groundType !== undefined,
      )
      .map(([name, config]) => ({
        name,
        image: config.image!,
        groundType: config.groundType!,
      }));
  }

  showObjectPicker(): void {
    const items = this.getObjectItems();
    this.objectPicker.show(this.stage, items, this.screenWidth, this.screenHeight);
  }

  wireInjectorEvents(): void {
    this.skipTimeButton.setOnClick(() => {
      Injector.tutorial.onSkipTimeClicked();
      Injector.game.skipTime();
    });
    this.plusButton.setOnClick(() => {
      this.showObjectPicker();
      Injector.tutorial.onPlusButtonClicked();
    });
    this.objectPicker.setOnSelect((name, groundType) => {
      Injector.tutorial.onObjectSelected(name);
      Injector.game.onObjectSelected(name, groundType);
    });
    this.objectPicker.setOnClose(() => {
      Injector.game.onObjectPickerClosed();
    });
  }

  highlightPickerTile(itemName: string): void {
    this.objectPicker.highlightTile(itemName);
  }

  unhighlightPickerTile(): void {
    this.objectPicker.unhighlightTile();
  }

  hideObjectPicker(): void {
    this.objectPicker.hide();
  }

  get isObjectPickerVisible(): boolean {
    return this.objectPicker.isVisible;
  }

  showMessagePopup(text: string, onOk: () => void): void {
    this.messagePopup.show(this.stage, text, this.screenWidth, this.screenHeight, onOk);
  }

  hideMessagePopup(): void {
    this.messagePopup.hide();
  }

  setGameTime(gameTimeMs: number): void {
    if (!this._ready || !this.timerLabel) return;
    const date = new Date(gameTimeMs);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    this.timerLabel.text = `${h}:${m}`;
    this.updateTimerBg();
  }

  private updateTimerBg(): void {
    if (!this.timerBg || !this.timerLabel) return;
    const w = this.timerLabel.width + TIMER_PAD * 2;
    const h = this.timerLabel.height + TIMER_PAD * 2;
    this.timerBg.clear();
    this.timerBg.roundRect(0, 0, w, h, TIMER_RADIUS).fill({ color: 0x000000, alpha: 0.6 });
  }

  get ready(): boolean {
    return this._ready;
  }

  render(
    threeRenderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    gameTimeMs?: number,
  ): void {
    if (gameTimeMs !== undefined) {
      this.setGameTime(gameTimeMs);
      this.plusButton.updateTutorialHighlight(gameTimeMs);
      this.skipTimeButton.updateTutorialHighlight(gameTimeMs);
      this.objectPicker.updateTutorialHighlight(gameTimeMs);
      this.updateCellHighlight(camera, threeRenderer, gameTimeMs);
    }
    threeRenderer.resetState();
    threeRenderer.render(scene, camera);

    if (this._ready) {
      this.pixiRenderer.resetState();
      this.pixiRenderer.render({ container: this.stage });
    }
  }

  resize(w: number, h: number): void {
    if (!this._ready) return;
    this.screenWidth = w;
    this.screenHeight = h;
    this.pixiRenderer.resize(w, h, this.getPixelRatio());
    this.skipTimeButton.setPosition(w - 115, 10);
    this.plusButton.setPosition(w - 115, h - 115);
    if (this.objectPicker.isVisible) {
      this.objectPicker.resize(w, h);
    }
  }

  highlightCellAtWorld(worldPos: THREE.Vector3): void {
    this.cellHighlightWorldPos = worldPos.clone();
    if (!this.cellHighlightRing) {
      this.cellHighlightRing = new Graphics();
      this.cellHighlightRing.eventMode = 'none';
      this.stage.addChild(this.cellHighlightRing);
    }
  }

  unhighlightCell(): void {
    this.cellHighlightWorldPos = null;
    if (this.cellHighlightRing) {
      this.cellHighlightRing.clear();
    }
  }

  private updateCellHighlight(
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    gameTimeMs: number,
  ): void {
    if (!this.cellHighlightRing || !this.cellHighlightWorldPos) return;
    const screen = this.projectToScreen(
      this.cellHighlightWorldPos,
      camera,
      renderer,
    );
    const pulse = Math.sin(gameTimeMs / 400) * 0.5 + 0.5;
    const r = 40 + pulse * 8;
    this.cellHighlightRing.clear();
    this.cellHighlightRing.circle(screen.x, screen.y, r);
    this.cellHighlightRing.stroke({
      width: 4,
      color: 0xffff00,
      alpha: 0.5 + pulse * 0.3,
    });
  }

  projectToScreen(
    worldPos: THREE.Vector3,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
  ): { x: number; y: number } {
    const ndc = worldPos.clone().project(camera);
    const el = renderer.domElement;
    return {
      x: (ndc.x * 0.5 + 0.5) * el.clientWidth,
      y: (-ndc.y * 0.5 + 0.5) * el.clientHeight,
    };
  }
}
