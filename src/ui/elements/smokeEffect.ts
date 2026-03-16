import { Container, Sprite, Assets, Ticker } from 'pixi.js';

const SMOKE_SCALE = 0.4;
const SMOKE_DURATION = 0.8;
const ROTATION_SPEED = Math.PI * 2;

export class SmokeEffect {
  private container: Container;
  private sprite: Sprite;
  private tickerHandle: (() => void) | null = null;

  constructor(stage: Container, x: number, y: number) {
    this.sprite = new Sprite();
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.scale.set(SMOKE_SCALE, SMOKE_SCALE);
    this.sprite.eventMode = 'none';

    this.container = new Container();
    this.container.eventMode = 'none';
    this.container.x = x;
    this.container.y = y;
    this.container.addChild(this.sprite);
    stage.addChild(this.container);

    this.loadAndAnimate();
  }

  private async loadAndAnimate(): Promise<void> {
    try {
      const texture = await Assets.load('./assets/images/smoke.png');
      this.sprite.texture = texture;
      this.startAnimation();
    } catch (error) {
      console.error('Failed to load smoke.png:', error);
      this.destroy();
    }
  }

  private startAnimation(): void {
    const startAlpha = 1;
    let elapsed = 0;

    const tick = () => {
      elapsed += Ticker.shared.deltaMS / 1000;
      const t = Math.min(1, elapsed / SMOKE_DURATION);
      this.sprite.rotation += (Ticker.shared.deltaMS / 1000) * ROTATION_SPEED;
      this.sprite.alpha = startAlpha * (1 - t);
      if (t >= 1) {
        Ticker.shared.remove(tick);
        this.tickerHandle = null;
        this.destroy();
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
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true });
  }
}
