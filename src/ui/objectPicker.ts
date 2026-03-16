import {
  Container,
  Graphics,
  Text,
  Rectangle,
} from 'pixi.js';
import { PickerPlate } from './elements/pickerPlate.js';
import { TextButton } from './elements/textButton.js';
import { Injector } from '../core/injector.js';

const PANEL_PAD = 24;
const ITEM_GAP = 16;
const ITEMS_PER_ROW = 3;
const PANEL_RADIUS = 16;
const BACKDROP_ALPHA = 0.7;
const SCREEN_MARGIN = 24;
const TITLE_HEIGHT = 56;
const INFO_HEIGHT = 180;
const CLOSE_BUTTON_HEIGHT = 52;
const CLOSE_BUTTON_WIDTH = 160;
const BUY_BUTTON_WIDTH = 140;
const BUY_BUTTON_HEIGHT = 48;
const BUTTON_FONT_SCALE = 1.5;

export interface ObjectItem {
  name: string;
  image: string;
  groundType: number;
  price: number;
  earn: number;
}

export class ObjectPicker {
  private overlay: Container | null = null;
  private stage: Container | null = null;
  private items: ObjectItem[] = [];
  private screenWidth = 0;
  private screenHeight = 0;
  private selectedItem: ObjectItem | null = null;
  private userMoney = 0;
  private onSelect: ((name: string, groundType: number) => void) | null = null;
  private onClose: (() => void) | null = null;
  private platesByItemName = new Map<string, Container>();
  private tutorialHighlightPlate: Container | null = null;
  private tutorialRing: Graphics | null = null;
  private infoContainer: Container | null = null;
  private buyButton: TextButton | null = null;
  private tutorialBuyRing: Graphics | null = null;
  private tutorialBuyRingCenter = { x: 0, y: 0 };
  private tutorialBuyRingRadius = 0;

  show(
    stage: Container,
    items: ObjectItem[],
    screenWidth: number,
    screenHeight: number,
    money: number,
  ): void {
    this.hide();
    this.stage = stage;
    this.items = items;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.userMoney = money;
    this.selectedItem = null;
    this.buildOverlay();
  }

  setMoney(money: number): void {
    this.userMoney = money;
    this.updateBuyButton();
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
    this.infoContainer = null;
    this.buyButton = null;
    this.tutorialBuyRing = null;

    const { screenWidth, screenHeight, items } = this;
    const maxPanelW = screenWidth - SCREEN_MARGIN * 2;
    const maxPanelH = screenHeight - SCREEN_MARGIN * 2;

    const rows = Math.ceil(items.length / ITEMS_PER_ROW);
    const itemSize = 120;
    const gap = ITEM_GAP;
    const contentW = ITEMS_PER_ROW * itemSize + (ITEMS_PER_ROW - 1) * gap;
    const contentH = rows * itemSize + (rows - 1) * gap + TITLE_HEIGHT + INFO_HEIGHT;
    const basePanelW = contentW + PANEL_PAD * 2;
    const basePanelH = contentH + PANEL_PAD * 2;

    const scale = Math.min(
      1,
      maxPanelW / basePanelW,
      maxPanelH / basePanelH,
    );
    const scaledItemSize = Math.floor(itemSize * scale);
    const scaledGap = Math.floor(gap * scale);
    const titleH = Math.floor(TITLE_HEIGHT * scale);
    const titleSize = Math.max(24, Math.floor(36 * scale));
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
    backdrop.on('pointertap', () => {
      const step = Injector.tutorial?.getCurrentStep();
      if (step === 2 || step === 5) return;
      this.close();
    });
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

    const gridWidth = ITEMS_PER_ROW * scaledItemSize + (ITEMS_PER_ROW - 1) * scaledGap;
    const gridHeight = rows * scaledItemSize + (rows - 1) * scaledGap;
    const contentWidth = panelWidth - PANEL_PAD * 2;
    const offsetX = Math.max(0, (contentWidth - gridWidth) / 2);
    const offsetY = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const col = i % ITEMS_PER_ROW;
      const row = Math.floor(i / ITEMS_PER_ROW);
      const x = panel.x + PANEL_PAD + offsetX + col * (scaledItemSize + scaledGap);
      const y = panel.y + PANEL_PAD + titleH + offsetY + row * (scaledItemSize + scaledGap);

      const plate = new PickerPlate(
        item,
        x,
        y,
        scaledItemSize,
        (selected) => this.onTileSelected(selected),
      );
      this.platesByItemName.set(item.name, plate);
      overlay.addChild(plate);
    }

    const infoContainer = new Container();
    infoContainer.x = panel.x + PANEL_PAD;
    infoContainer.y = panel.y + PANEL_PAD + titleH + gridHeight + scaledGap;
    infoContainer.visible = false;
    this.infoContainer = infoContainer;
    overlay.addChild(infoContainer);

    const closeBtnH = Math.floor(CLOSE_BUTTON_HEIGHT * Math.max(scale, 1));
    const closeBtnW = Math.min(CLOSE_BUTTON_WIDTH, screenWidth - SCREEN_MARGIN * 2);
    const closeBtn = new TextButton(
      (screenWidth - closeBtnW) / 2,
      screenHeight - SCREEN_MARGIN - closeBtnH,
      closeBtnW,
      closeBtnH,
      'CLOSE',
      BUTTON_FONT_SCALE,
      () => {
        const step = Injector.tutorial?.getCurrentStep();
        if (step === 2 || step === 5) return;
        this.close();
      },
    );
    overlay.addChild(closeBtn);

    this.stage.addChild(overlay);
    this.overlay = overlay;

    if (this.selectedItem) {
      this.buildInfoSection();
    }
  }

  private onTileSelected(item: ObjectItem): void {
    this.selectedItem = item;
    this.buildInfoSection();
  }

  private buildInfoSection(): void {
    if (!this.infoContainer || !this.overlay || !this.selectedItem) return;

    if (this.tutorialBuyRing?.parent) {
      this.tutorialBuyRing.parent.removeChild(this.tutorialBuyRing);
      this.tutorialBuyRing.destroy();
    }
    this.tutorialBuyRing = null;
    if (this.buyButton?.parent) {
      this.buyButton.parent.removeChild(this.buyButton);
      this.buyButton = null;
    }
    this.infoContainer.removeChildren();
    this.infoContainer.visible = true;

    const item = this.selectedItem;

    const textSize = 24;
    const nameText = new Text({
      text: item.name.charAt(0).toUpperCase() + item.name.slice(1),
      style: {
        fontFamily: 'sans-serif',
        fontSize: textSize,
        fontWeight: 'bold',
        fill: '#ffffff',
      },
    });
    nameText.y = 0;
    this.infoContainer.addChild(nameText);

    const priceText = new Text({
      text: `Price: ${item.price}`,
      style: {
        fontFamily: 'sans-serif',
        fontSize: textSize,
        fill: '#cccccc',
      },
    });
    priceText.y = 28;
    this.infoContainer.addChild(priceText);

    const earnText = new Text({
      text: item.earn > 0
        ? `Earn each day: ${item.earn}`
        : `Earn when grow: ${item.price * 2}`,
      style: {
        fontFamily: 'sans-serif',
        fontSize: textSize,
        fill: '#aaffaa',
      },
    });
    earnText.y = 50;
    this.infoContainer.addChild(earnText);

    const buyBtnW = BUY_BUTTON_WIDTH;
    const buyBtnH = BUY_BUTTON_HEIGHT;
    const step = Injector.tutorial?.getCurrentStep();
    const canBuyInTutorial =
      step !== 2 && step !== 5 ||
      (step === 2 && item.name === 'cow') ||
      (step === 5 && item.name === 'corn');
    const canAfford = item.price <= this.userMoney && canBuyInTutorial;
    const buyBtnX = (this.screenWidth - buyBtnW) / 2;
    const buyBtnY = this.infoContainer.y + 90;
    const buyBtn = new TextButton(
      buyBtnX,
      buyBtnY,
      buyBtnW,
      buyBtnH,
      `BUY ${item.price}`,
      BUTTON_FONT_SCALE,
      () => this.onBuyClicked(),
    );
    this.styleBuyButton(buyBtn, canAfford);
    this.buyButton = buyBtn;
    const shouldHighlightBuy =
      (step === 2 && item.name === 'cow') || (step === 5 && item.name === 'corn');
    if (shouldHighlightBuy) {
      this.tutorialBuyRing = new Graphics();
      this.tutorialBuyRing.eventMode = 'none';
      this.tutorialBuyRingCenter = {
        x: buyBtnX + buyBtnW / 2,
        y: buyBtnY + buyBtnH / 2,
      };
      this.tutorialBuyRingRadius = Math.max(buyBtnW, buyBtnH) / 2 + 8;
      this.overlay.addChild(this.tutorialBuyRing);
    }
    this.overlay.addChild(buyBtn);
  }

  private styleBuyButton(btn: TextButton, canAfford: boolean): void {
    const color = canAfford ? 0x22aa22 : 0xaa2222;
    btn.setColor(color);
  }

  private updateBuyButton(): void {
    if (!this.buyButton || !this.selectedItem) return;
    const step = Injector.tutorial?.getCurrentStep();
    const canBuyInTutorial =
      step !== 2 && step !== 5 ||
      (step === 2 && this.selectedItem.name === 'cow') ||
      (step === 5 && this.selectedItem.name === 'corn');
    const canAfford = this.selectedItem.price <= this.userMoney && canBuyInTutorial;
    this.buyButton.setColor(canAfford ? 0x22aa22 : 0xaa2222);
  }

  private onBuyClicked(): void {
    if (!this.selectedItem || this.selectedItem.price > this.userMoney) return;
    const { name, groundType, price } = this.selectedItem;
    const step = Injector.tutorial?.getCurrentStep();
    if (step === 2 && name !== 'cow') return;
    if (step === 5 && name !== 'corn') return;
    Injector.game.addMoney(-price);
    this.onSelect?.(name, groundType);
    this.close();
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
    this.infoContainer = null;
    this.buyButton = null;
    this.tutorialBuyRing = null;
    this.selectedItem = null;
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
    const pulse = Math.sin(timeMs / 4000) * 0.5 + 0.5;
    if (this.tutorialRing) {
      this.updateTutorialRing(pulse);
    }
    if (this.tutorialBuyRing) {
      this.updateTutorialBuyRing(pulse);
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

  private updateTutorialBuyRing(pulse: number): void {
    if (!this.tutorialBuyRing) return;
    const r = this.tutorialBuyRingRadius + pulse * 8;
    this.tutorialBuyRing.clear();
    this.tutorialBuyRing.circle(
      this.tutorialBuyRingCenter.x,
      this.tutorialBuyRingCenter.y,
      r,
    );
    this.tutorialBuyRing.stroke({
      width: 4,
      color: 0xffff00,
      alpha: 0.5 + pulse * 0.3,
    });
  }
}
