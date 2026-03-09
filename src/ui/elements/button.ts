import { Container, Sprite, Assets, Rectangle, Graphics } from 'pixi.js';
import { UILayer } from '../uiLayer.js';

const BUTTON_PADDING = 10;
const CLICK_SCALE_BOOST = 1.15;
const HIGHLIGHT_ALPHA = 0.8;
const NORMAL_ALPHA = 1;
const TUTORIAL_RING_RADIUS = 55;

export interface ButtonConfig {
  x?: number;
  y?: number;
  scale?: number;
}

export class Button {
  private container: Container;
  private sprite: Sprite;
  private onClickCallback: (() => void) | null = null;
  private imagePath: string;
  private posX: number = 0;
  private posY: number = 0;
  private buttonScale: number = 1;
  private isHighlighted: boolean = false;
  private isClicked: boolean = false;
  private clickTimeout: ReturnType<typeof setTimeout> | null = null;
  private tutorialRing: Graphics | null = null;
  private tutorialHighlightActive = false;

  constructor(uiLayer: UILayer, imagePath: string, config?: ButtonConfig) {
    this.imagePath = imagePath;
    this.posX = config?.x ?? 0;
    this.posY = config?.y ?? 0;
    this.buttonScale = config?.scale ?? 1;

    this.sprite = new Sprite();
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.eventMode = 'none';
    this.sprite.scale.set(this.buttonScale, this.buttonScale);
    this.sprite.alpha = NORMAL_ALPHA;

    this.container = new Container();
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';
    this.container.on('pointertap', () => {
      this.setClicked();
      if (this.onClickCallback) {
        this.onClickCallback();
      }
    });
    this.container.addChild(this.sprite);
    uiLayer.stage.addChild(this.container);

    this.tutorialRing = new Graphics();
    this.tutorialRing.eventMode = 'none';
    this.container.addChildAt(this.tutorialRing, 0);

    this.loadImage();
  }

  private async loadImage(): Promise<void> {
    try {
      const texture = await Assets.load(this.imagePath);
      this.sprite.texture = texture;
      
      if (this.sprite.width > 0 && this.sprite.height > 0) {
        const bounds = this.sprite.getLocalBounds();
        this.container.hitArea = new Rectangle(
          bounds.x,
          bounds.y,
          bounds.width,
          bounds.height
        );
      }
      
      this.positionButton();
    } catch (error) {
      console.error(`Failed to load image ${this.imagePath}:`, error);
    }
  }

  private setHighlighted(highlighted: boolean): void {
    this.isHighlighted = highlighted;
    this.updateVisualState();
  }

  private setClicked(): void {
    this.isClicked = true;
    this.updateVisualState();

    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
    }
    this.clickTimeout = setTimeout(() => {
      this.resetClickState();
    }, 150);
  }

  private resetClickState(): void {
    this.isClicked = false;
    this.updateVisualState();
  }

  private updateVisualState(): void {
    let newScale = this.buttonScale;
    let newAlpha = NORMAL_ALPHA;

    if (this.isClicked) {
      newScale = this.buttonScale * CLICK_SCALE_BOOST;
      newAlpha = HIGHLIGHT_ALPHA;
    } else if (this.isHighlighted) {
      newAlpha = HIGHLIGHT_ALPHA;
    }

    this.sprite.scale.set(newScale, newScale);
    this.sprite.alpha = newAlpha;
  }

  setOnClick(callback: () => void): void {
    this.onClickCallback = callback;
  }

  setWarning(highlighted: boolean): void {
    this.setHighlighted(highlighted);
  }

  setTutorialHighlight(active: boolean): void {
    this.tutorialHighlightActive = active;
    this.updateTutorialRing(0);
  }

  updateTutorialHighlight(timeMs: number): void {
    if (this.tutorialHighlightActive && this.tutorialRing) {
      const pulse = Math.sin(timeMs / 400) * 0.5 + 0.5;
      this.updateTutorialRing(pulse);
    }
  }

  private updateTutorialRing(pulse: number): void {
    if (!this.tutorialRing) return;
    this.tutorialRing.visible = this.tutorialHighlightActive;
    if (!this.tutorialHighlightActive) return;
    this.tutorialRing.clear();
    const r = TUTORIAL_RING_RADIUS + pulse * 8;
    this.tutorialRing.circle(0, 0, r);
    this.tutorialRing.stroke({
      width: 4,
      color: 0xffff00,
      alpha: 0.5 + pulse * 0.3,
    });
  }

  setPosition(x: number, y: number): void {
    this.posX = x;
    this.posY = y;
    this.positionButton();
  }

  setScale(scale: number): void {
    this.buttonScale = scale;
    this.sprite.scale.set(this.buttonScale, this.buttonScale);
  }

  private positionButton(): void {
    const w = this.sprite.width || 0;
    const h = this.sprite.height || 0;
    this.container.x = this.posX + w / 2;
    this.container.y = this.posY + h / 2;
  }

  resize(screenWidth: number): void {
    if (this.sprite.texture) {
      this.posX = screenWidth - this.sprite.width - BUTTON_PADDING;
      this.posY = BUTTON_PADDING;
      this.positionButton();
    }
  }
}
