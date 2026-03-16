import {
  Container,
  Graphics,
  Text,
  Rectangle,
} from 'pixi.js';

export class TextButton extends Container {
  private bg: Graphics;
  private radius: number;
  private w: number;
  private h: number;
  private bgColor = 0xffffff;

  constructor(
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    scale: number,
    onClick: () => void,
  ) {
    super();
    this.x = x;
    this.y = y;
    this.hitArea = new Rectangle(0, 0, w, h);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.w = w;
    this.h = h;

    this.radius = Math.max(4, Math.floor(8 * scale));
    this.bg = new Graphics();
    this.bg.roundRect(0, 0, w, h, this.radius).fill({
      color: this.bgColor,
      alpha: 0.15,
    });
    this.bg.stroke({ width: 2, color: 0xffffff, alpha: 0.3 });
    this.addChild(this.bg);

    const label = new Text({
      text,
      style: {
        fontFamily: 'sans-serif',
        fontSize: Math.max(18, Math.floor(18 * scale)),
        fontWeight: 'bold',
        fill: '#ffffff',
      },
    });
    label.anchor.set(0.5, 0.5);
    label.x = w / 2;
    label.y = h / 2;
    this.addChild(label);

    this.on('pointertap', onClick);
    this.on('pointerenter', () => this.setHover(true));
    this.on('pointerleave', () => this.setHover(false));
  }

  private setHover(hovered: boolean): void {
    this.updateBg(hovered ? 0.25 : 0.15, hovered ? 0.4 : 0.3);
  }

  private updateBg(alpha: number, strokeAlpha: number): void {
    this.bg.clear();
    this.bg.roundRect(0, 0, this.w, this.h, this.radius).fill({
      color: this.bgColor,
      alpha,
    });
    this.bg.stroke({ width: 2, color: 0xffffff, alpha: strokeAlpha });
  }

  setColor(color: number): void {
    this.bgColor = color;
    this.updateBg(0.15, 0.3);
  }
}
