import {
  Container,
  Graphics,
  Text,
  Rectangle,
} from 'pixi.js';
import { TextButton } from './textButton.js';

const PANEL_RADIUS = 16;
const BACKDROP_ALPHA = 0.7;
const SCREEN_MARGIN = 24;
const PANEL_PAD = 24;
const BUTTON_WIDTH = 80;
const BUTTON_HEIGHT = 36;

export class MessagePopup {
  private overlay: Container | null = null;
  private tutorialOkRing: Graphics | null = null;
  private okBtnCenter = { x: 0, y: 0 };
  private okBtnRadius = 0;

  show(
    stage: Container,
    text: string,
    screenWidth: number,
    screenHeight: number,
    onOk?: () => void,
    highlightOkButton = false,
  ): void {
    this.hide();

    const overlay = new Container();
    overlay.eventMode = 'static';

    const backdrop = new Graphics();
    backdrop.rect(0, 0, screenWidth, screenHeight).fill({
      color: 0x000000,
      alpha: BACKDROP_ALPHA,
    });
    backdrop.hitArea = new Rectangle(0, 0, screenWidth, screenHeight);
    backdrop.eventMode = 'static';
    overlay.addChild(backdrop);

    const label = new Text({
      text,
      style: {
        fontFamily: 'sans-serif',
        fontSize: 28,
        fontWeight: '600',
        fill: '#ffffff',
        wordWrap: true,
        wordWrapWidth: 300,
        align: 'center',
      },
    });
    label.anchor.set(0.5, 0.5);

    const panelW = Math.min(320, screenWidth - SCREEN_MARGIN * 2);
    const panelH = label.height + PANEL_PAD * 2 + (onOk ? BUTTON_HEIGHT + 16 : PANEL_PAD);

    const panel = new Graphics();
    panel.roundRect(0, 0, panelW, panelH, PANEL_RADIUS).fill({
      color: 0x1e3c1e,
      alpha: 0.98,
    });
    panel.stroke({
      width: 2,
      color: 0xffffff,
      alpha: 0.2,
    });
    panel.x = (screenWidth - panelW) / 2;
    panel.y = (screenHeight - panelH) / 2;
    panel.hitArea = new Rectangle(0, 0, panelW, panelH);
    panel.eventMode = 'static';
    overlay.addChild(panel);

    label.x = panel.x + panelW / 2;
    label.y = panel.y + PANEL_PAD + label.height / 2;
    overlay.addChild(label);

    if (onOk) {
      const okBtnX = (screenWidth - BUTTON_WIDTH) / 2;
      const okBtnY = panel.y + panelH - PANEL_PAD - BUTTON_HEIGHT;
      const okBtn = new TextButton(
        okBtnX,
        okBtnY,
        BUTTON_WIDTH,
        BUTTON_HEIGHT,
        'OK',
        1,
        onOk,
      );
      overlay.addChild(okBtn);
      if (highlightOkButton) {
        this.okBtnCenter = { x: okBtnX + BUTTON_WIDTH / 2, y: okBtnY + BUTTON_HEIGHT / 2 };
        this.okBtnRadius = Math.max(BUTTON_WIDTH, BUTTON_HEIGHT) / 2 + 8;
        this.tutorialOkRing = new Graphics();
        this.tutorialOkRing.eventMode = 'none';
        overlay.addChild(this.tutorialOkRing);
      }
    }

    stage.addChild(overlay);
    this.overlay = overlay;
  }

  updateTutorialHighlight(): void {
    const pulse = Math.sin(Date.now() / 80) * 0.5 + 0.5;
    if (!this.tutorialOkRing) return;
    const r = this.okBtnRadius + pulse * 8;
    this.tutorialOkRing.clear();
    this.tutorialOkRing.circle(this.okBtnCenter.x, this.okBtnCenter.y, r);
    this.tutorialOkRing.stroke({
      width: 4,
      color: 0xffff00,
      alpha: 0.5 + pulse * 0.3,
    });
  }

  hide(): void {
    if (this.overlay?.parent) {
      this.overlay.parent.removeChild(this.overlay);
      this.overlay.destroy({ children: true });
    }
    this.overlay = null;
    this.tutorialOkRing = null;
  }

  get isVisible(): boolean {
    return this.overlay !== null;
  }
}
