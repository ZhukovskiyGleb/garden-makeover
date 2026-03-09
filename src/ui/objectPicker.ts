import {
  Container,
  Graphics,
  Text,
  Rectangle,
} from 'pixi.js';
import { PickerPlate } from './elements/pickerPlate';
import { TextButton } from './elements/textButton';

const PANEL_PAD = 24;
const ITEM_GAP = 16;
const ITEMS_PER_ROW = 3;
const PANEL_RADIUS = 16;
const BACKDROP_ALPHA = 0.7;
const SCREEN_MARGIN = 24;
const TITLE_HEIGHT = 40;
const CLOSE_BUTTON_HEIGHT = 40;

export interface ObjectItem {
  name: string;
  image: string;
  groundType: number;
}

export class ObjectPicker {
  private overlay: Container | null = null;
  private stage: Container | null = null;
  private items: ObjectItem[] = [];
  private screenWidth = 0;
  private screenHeight = 0;
  private onSelect: ((name: string, groundType: number) => void) | null = null;
  private onClose: (() => void) | null = null;
  private platesByItemName = new Map<string, Container>();
  private tutorialHighlightPlate: Container | null = null;
  private tutorialRing: Graphics | null = null;

  show(
    stage: Container,
    items: ObjectItem[],
    screenWidth: number,
    screenHeight: number,
  ): void {
    this.hide();
    this.stage = stage;
    this.items = items;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.buildOverlay();
  }

  resize(screenWidth: number, screenHeight: number): void {
    if (!this.overlay || this.items.length === 0) return;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.buildOverlay();
  }

  private buildOverlay(): void {
    if (!this.stage || this.items.length === 0) return;

    if (this.overlay?.parent) {
      this.overlay.parent.removeChild(this.overlay);
      this.overlay.destroy({ children: true });
    }
    this.platesByItemName.clear();
    this.tutorialHighlightPlate = null;
    this.tutorialRing = null;

    const { screenWidth, screenHeight, items } = this;
    const maxPanelW = screenWidth - SCREEN_MARGIN * 2;
    const maxPanelH = screenHeight - SCREEN_MARGIN * 2;

    const rows = Math.ceil(items.length / ITEMS_PER_ROW);
    const contentW = ITEMS_PER_ROW * 120 + (ITEMS_PER_ROW - 1) * ITEM_GAP;
    const contentH = rows * 120 + (rows - 1) * ITEM_GAP + TITLE_HEIGHT;
    const basePanelW = contentW + PANEL_PAD * 2;
    const basePanelH = contentH + PANEL_PAD * 2;

    const scale = Math.min(
      1,
      maxPanelW / basePanelW,
      maxPanelH / basePanelH,
    );
    const itemSize = Math.floor(120 * scale);
    const panelWidth = Math.min(basePanelW * scale, maxPanelW);
    const panelHeight = Math.min(basePanelH * scale, maxPanelH);

    const overlay = new Container();
    overlay.eventMode = 'static';

    const backdrop = new Graphics();
    backdrop.rect(0, 0, screenWidth, screenHeight).fill({
      color: 0x000000,
      alpha: BACKDROP_ALPHA,
    });
    backdrop.hitArea = new Rectangle(0, 0, screenWidth, screenHeight);
    backdrop.eventMode = 'static';
    backdrop.on('pointertap', () => this.close());
    overlay.addChild(backdrop);

    const panel = new Graphics();
    panel.roundRect(0, 0, panelWidth, panelHeight, PANEL_RADIUS).fill({
      color: 0x1e3c1e,
      alpha: 0.98,
    });
    panel.stroke({
      width: 2,
      color: 0xffffff,
      alpha: 0.2,
    });
    panel.x = (screenWidth - panelWidth) / 2;
    panel.y = (screenHeight - panelHeight) / 2;
    panel.hitArea = new Rectangle(0, 0, panelWidth, panelHeight);
    panel.eventMode = 'static';
    overlay.addChild(panel);

    const gap = Math.floor(ITEM_GAP * scale);
    const titleH = Math.floor(TITLE_HEIGHT * scale);
    const titleSize = Math.max(14, Math.floor(24 * scale));
    const title = new Text({
      text: 'Select item to build',
      style: {
        fontFamily: 'sans-serif',
        fontSize: titleSize,
        fontWeight: 'bold',
        fill: '#ffffff',
      },
    });
    title.anchor.set(0.5, 0.5);
    title.x = panel.x + panelWidth / 2;
    title.y = panel.y + titleH / 2;
    overlay.addChild(title);

    const gridWidth = ITEMS_PER_ROW * itemSize + (ITEMS_PER_ROW - 1) * gap;
    const gridHeight = rows * itemSize + (rows - 1) * gap;
    const closeBtnH = Math.floor(CLOSE_BUTTON_HEIGHT * scale);
    const contentWidth = panelWidth - PANEL_PAD * 2;
    const contentHeight = panelHeight - PANEL_PAD * 2 - titleH;
    const offsetX = Math.max(0, (contentWidth - gridWidth) / 2);
    const offsetY = Math.max(0, (contentHeight - gridHeight) / 2);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const col = i % ITEMS_PER_ROW;
      const row = Math.floor(i / ITEMS_PER_ROW);
      const x = panel.x + PANEL_PAD + offsetX + col * (itemSize + gap);
      const y = panel.y + PANEL_PAD + titleH + offsetY + row * (itemSize + gap);

      const plate = new PickerPlate(
        item,
        x,
        y,
        itemSize,
        (name, groundType) => this.onSelect?.(name, groundType),
        () => this.close(),
      );
      this.platesByItemName.set(item.name, plate);
      overlay.addChild(plate);
    }

    const closeBtnW = Math.min(120, screenWidth - SCREEN_MARGIN * 2);
    const closeBtn = new TextButton(
      (screenWidth - closeBtnW) / 2,
      screenHeight - SCREEN_MARGIN - closeBtnH,
      closeBtnW,
      closeBtnH,
      'CLOSE',
      scale,
      () => this.close(),
    );
    overlay.addChild(closeBtn);

    this.stage.addChild(overlay);
    this.overlay = overlay;
  }

  private close(): void {
    this.onClose?.();
    this.hide();
  }

  hide(): void {
    if (this.overlay?.parent) {
      this.overlay.parent.removeChild(this.overlay);
      this.overlay.destroy({ children: true });
    }
    this.overlay = null;
    this.stage = null;
    this.items = [];
    this.platesByItemName.clear();
    this.tutorialHighlightPlate = null;
    this.tutorialRing = null;
  }

  setOnSelect(callback: (name: string, groundType: number) => void): void {
    this.onSelect = callback;
  }

  setOnClose(callback: () => void): void {
    this.onClose = callback;
  }

  get isVisible(): boolean {
    return this.overlay !== null;
  }

  highlightTile(itemName: string): void {
    this.unhighlightTile();
    const plate = this.platesByItemName.get(itemName);
    if (!plate) return;
    this.tutorialHighlightPlate = plate;
    this.tutorialRing = new Graphics();
    this.tutorialRing.eventMode = 'none';
    plate.addChildAt(this.tutorialRing, 0);
    this.updateTutorialRing(0);
  }

  unhighlightTile(): void {
    if (this.tutorialHighlightPlate && this.tutorialRing) {
      this.tutorialHighlightPlate.removeChild(this.tutorialRing);
      this.tutorialRing.destroy();
    }
    this.tutorialHighlightPlate = null;
    this.tutorialRing = null;
  }

  updateTutorialHighlight(timeMs: number): void {
    if (this.tutorialRing) {
      const pulse = Math.sin(timeMs / 400) * 0.5 + 0.5;
      this.updateTutorialRing(pulse);
    }
  }

  private updateTutorialRing(pulse: number): void {
    if (!this.tutorialRing || !this.tutorialHighlightPlate) return;
    const rect = this.tutorialHighlightPlate.hitArea as Rectangle;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const r = Math.min(rect.width, rect.height) / 2 + pulse * 8;
    this.tutorialRing.clear();
    this.tutorialRing.circle(cx, cy, r);
    this.tutorialRing.stroke({
      width: 4,
      color: 0xffff00,
      alpha: 0.5 + pulse * 0.3,
    });
  }
}
