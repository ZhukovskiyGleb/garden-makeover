import {
  Container,
  Graphics,
  Sprite,
  Assets,
  Rectangle,
} from 'pixi.js';
import type { ObjectItem } from '../objectPicker';

export class PickerPlate extends Container {
  constructor(
    item: ObjectItem,
    x: number,
    y: number,
    itemSize: number,
    onSelect: (item: ObjectItem) => void,
  ) {
    super();
    this.x = x;
    this.y = y;
    this.hitArea = new Rectangle(0, 0, itemSize, itemSize);
    this.eventMode = 'static';
    this.cursor = 'pointer';

    const radius = Math.max(4, Math.floor(12 * (itemSize / 120)));
    const bg = new Graphics();
    bg.roundRect(0, 0, itemSize, itemSize, radius).fill({
      color: 0xffffff,
      alpha: 0.1,
    });
    bg.stroke({ width: 2, color: 0xffffff, alpha: 0.2 });
    this.addChild(bg);

    const sprite = new Sprite();
    sprite.anchor.set(0.5, 0.5);
    sprite.x = itemSize / 2;
    sprite.y = itemSize / 2;
    sprite.scale.set(0.6 * (itemSize / 120));
    this.addChild(sprite);

    this.on('pointertap', () => onSelect(item));

    this.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(0, 0, itemSize, itemSize, radius).fill({
        color: 0xffffff,
        alpha: 0.2,
      });
      bg.stroke({ width: 2, color: 0xffffff, alpha: 0.3 });
    });
    this.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(0, 0, itemSize, itemSize, radius).fill({
        color: 0xffffff,
        alpha: 0.1,
      });
      bg.stroke({ width: 2, color: 0xffffff, alpha: 0.2 });
    });

    const imgPath = item.image.startsWith('/') ? '.' + item.image : item.image;
    Assets.load(imgPath)
      .then((tex) => {
        sprite.texture = tex;
      })
      .catch(() => {});
  }
}
