import { Container, Graphics, Text } from 'pixi.js';
import * as THREE from 'three';
import { UILayer } from '../uiLayer.js';

const BADGE_PAD_X = 6;
const BADGE_PAD_Y = 4;
const BADGE_RADIUS = 4;

export class TimerBadge {
  private container: Container;
  private bg: Graphics;
  private label: Text;

  constructor(uiLayer: UILayer) {
    this.label = new Text({
      text: '',
      style: {
        fontFamily: 'sans-serif',
        fontSize: 14,
        fontWeight: 'bold',
        fill: '#ffffff',
        dropShadow: {
          color: '#000000',
          blur: 2,
          distance: 1,
          alpha: 0.8,
        },
      },
    });
    this.label.anchor.set(0.5, 0.5);

    this.bg = new Graphics();

    this.container = new Container();
    this.container.addChild(this.bg, this.label);
    uiLayer.stage.addChild(this.container);
  }

  setText(value: string): void {
    this.label.text = value;
    this.drawBg();
  }

  private drawBg(): void {
    const w = this.label.width + BADGE_PAD_X * 2;
    const h = this.label.height + BADGE_PAD_Y * 2;
    this.bg.clear();
    this.bg
      .roundRect(-w / 2, -h / 2, w, h, BADGE_RADIUS)
      .fill({ color: 0x000000, alpha: 0.6 });
  }

  updatePosition(
    worldPos: THREE.Vector3,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    uiLayer: UILayer,
  ): void {
    const { x, y } = uiLayer.projectToScreen(worldPos, camera, renderer);
    this.container.x = x;
    this.container.y = y;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
