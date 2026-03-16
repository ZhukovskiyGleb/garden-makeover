import { Container, Sprite, Assets, Ticker } from 'pixi.js';
import * as THREE from 'three';
import { UILayer } from '../uiLayer.js';

const ICON_SCALE = 0.2;
const ANIM_DURATION = 0.5;

export class CollectIcon {
  private container: Container;
  private sprite: Sprite;
  private animating = false;
  private tickerHandle: (() => void) | null = null;

  constructor(uiLayer: UILayer) {
    this.sprite = new Sprite();
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.scale.set(ICON_SCALE, ICON_SCALE);
    this.sprite.eventMode = 'none';

    this.container = new Container();
    this.container.eventMode = 'none';
    this.container.addChild(this.sprite);
    uiLayer.stage.addChild(this.container);

    this.loadImage();
  }

  private async loadImage(): Promise<void> {
    try {
      const texture = await Assets.load('./assets/images/money.png');
      this.sprite.texture = texture;
    } catch (error) {
      console.error('Failed to load money.png:', error);
    }
  }

  updatePosition(
    worldPos: THREE.Vector3,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    uiLayer: UILayer,
  ): void {
    if (this.animating) return;
    const { x, y } = uiLayer.projectToScreen(worldPos, camera, renderer);
    this.container.x = x;
    this.container.y = y + 30;
  }

  animateTo(targetX: number, targetY: number, onComplete: () => void): void {
    if (this.animating) return;
    this.animating = true;
    const startX = this.container.x;
    const startY = this.container.y;
    let elapsed = 0;

    const tick = () => {
      elapsed += Ticker.shared.deltaMS / 1000;
      const t = Math.min(1, elapsed / ANIM_DURATION);
      const eased = 1 - (1 - t) * (1 - t);
      this.container.x = startX + (targetX - startX) * eased;
      this.container.y = startY + (targetY - startY) * eased;
      if (t >= 1) {
        Ticker.shared.remove(tick);
        this.tickerHandle = null;
        this.animating = false;
        onComplete();
      }
    };
    this.tickerHandle = tick;
    Ticker.shared.add(tick);
  }

  destroy(): void {
    if (this.tickerHandle) {
      Ticker.shared.remove(this.tickerHandle);
      this.tickerHandle = null;
    }
    this.container.destroy({ children: true });
  }
}
