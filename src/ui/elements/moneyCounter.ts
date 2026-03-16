import { Container, Text, Graphics, Sprite, Assets } from 'pixi.js';

const PAD = 12;
const RADIUS = 8;

export class MoneyCounter {
  readonly container: Container;
  private label: Text;
  private sprite: Sprite;
  private bg: Graphics;

  constructor(stage: Container) {
    this.sprite = new Sprite();
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.scale.set(0.2, 0.2);

    this.label = new Text({
      text: '150',
      style: {
        fontFamily: 'sans-serif',
        fontSize: 32,
        fontWeight: 'bold',
        fill: '#ffffff',
        dropShadow: {
          color: '#000000',
          blur: 2,
          distance: 1,
          alpha: 0.6,
        },
      },
    });
    this.label.anchor.set(0, 0.5);

    this.bg = new Graphics();

    this.container = new Container();
    this.container.addChild(this.bg, this.sprite, this.label);
    this.container.x = PAD;

    this.sprite.x = PAD + 16;
    this.sprite.y = PAD + 16;
    this.label.x = PAD + 40;
    this.label.y = PAD + 16;

    stage.addChild(this.container);
    this.loadIcon();
  }

  private async loadIcon(): Promise<void> {
    try {
      const texture = await Assets.load('./assets/images/money.png');
      this.sprite.texture = texture;
      this.updateBg();
    } catch (error) {
      console.error('Failed to load money.png:', error);
    }
  }

  setValue(money: number): void {
    this.label.text = `${money}`;
    this.updateBg();
  }

  resize(_screenWidth: number, screenHeight: number): void {
    this.container.y = screenHeight - 80;
  }

  getCollectTargetPosition(): { x: number; y: number } {
    return {
      x: this.container.x + PAD + 16,
      y: this.container.y + PAD + 16,
    };
  }

  private updateBg(): void {
    const iconW = this.sprite?.width ?? 32;
    const w = PAD + iconW + 8 + this.label.width + PAD;
    const h = Math.max(this.label.height, iconW) + PAD * 2;
    this.bg.clear();
    this.bg.roundRect(0, 0, w, h, RADIUS).fill({ color: 0x000000, alpha: 0.6 });
  }
}
