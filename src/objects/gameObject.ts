import * as THREE from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import objectsConfig from '../config/objects.json';
import { GRID_DIVISIONS } from '../config/config.js';
import { Injector } from '../core/injector.js';
import { ensureShadowMaterial } from '../utils/shadows.js';
import { CollectIcon } from '../ui/elements/collectIcon.js';

type ObjectKey = keyof typeof objectsConfig.objects;
type ElementKey = keyof typeof objectsConfig.elements;

const PLACE_ROTATION_DURATION = 1.2;

export type ObjectStatus = 'idle' | 'READY_FOR_COLLECT';

export class GameObject {
  readonly objectName: string;
  readonly gridPos: THREE.Vector2;
  mesh: THREE.Object3D;
  private mixer: THREE.AnimationMixer | null = null;
  private elementIndex = 0;
  private elementNames: string[];
  private allModels: Map<string, THREE.Object3D>;
  private allClips: THREE.AnimationClip[];
  private placeRotationProgress = 0;
  private placeRotationStartY = 0;
  status: ObjectStatus = 'idle';
  private collectIcon: CollectIcon | null = null;

  constructor(
    objectName: string,
    gridPos: THREE.Vector2,
    original: THREE.Object3D,
    allClips: THREE.AnimationClip[],
    allModels: Map<string, THREE.Object3D>,
  ) {
    this.objectName = objectName;
    this.gridPos = gridPos.clone();
    this.allClips = allClips;
    this.allModels = allModels;

    const objConfig = objectsConfig.objects[objectName as ObjectKey];
    this.elementNames = [...objConfig.elements];

    this.mesh = this.buildMesh(original, this.elementNames[0]);
    this.setupAnimation();
  }

  private buildMesh(original: THREE.Object3D, elementName: string): THREE.Object3D {
    const elementConfig = objectsConfig.elements[elementName as ElementKey];
    const col = Math.round(this.gridPos.x);
    const row = Math.round(this.gridPos.y);

    if (elementConfig?.cells) {
      Injector.grid.updateCells(col, row, elementConfig.cells);
    }

    const mesh = skeletonClone(original);
    mesh.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        const mat = obj.material;
        obj.material = Array.isArray(mat)
          ? mat.map((m) => ensureShadowMaterial(m))
          : ensureShadowMaterial(mat);
      }
    });
    const worldPos = Injector.grid.gridToWorld(col, row);
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);

    if (elementConfig) {
      worldPos.x += size.x / 2 + elementConfig.x;
      worldPos.y += elementConfig.y;
      worldPos.z += size.z / 2 + elementConfig.z;
    }
    const s = elementConfig && 'scale' in elementConfig ? (elementConfig as Record<string, unknown>).scale as number : 1;
    mesh.scale.multiplyScalar(s);
    mesh.position.copy(worldPos);
    const objConfig = objectsConfig.objects[this.objectName as ObjectKey];
    if ('rotation' in objConfig) {
      const rot = (objConfig as { rotation: string }).rotation;
      if (rot && rot.length > 0) {
        if (rot === 'half') {
          mesh.rotateY(Math.PI / 2);
        } else {
          this.placeRotationStartY =
            rot === 'random' ? Math.random() * Math.PI * 2 : 0;
          mesh.rotation.y = this.placeRotationStartY;
          this.placeRotationProgress = 0.001;
        }
      }
    }
    Injector.scene.add(mesh);
    return mesh;
  }

  private setupAnimation(): void {
    this.mixer = null;
    const objConfig = objectsConfig.objects[this.objectName as ObjectKey];
    if ('animate' in objConfig && typeof objConfig.animate === 'string') {
      const clip = this.allClips.find(c => c.name === objConfig.animate);
      if (clip) {
        this.mixer = new THREE.AnimationMixer(this.mesh);
        const action = this.mixer.clipAction(clip.clone());
        action.play();
        action.time = Math.random() * clip.duration;
      }
    }
  }

  upgradeToNextStage(): boolean {
    if (this.elementIndex >= this.elementNames.length - 1) return false;
    this.elementIndex++;
    const oldMesh = this.mesh;
    const newElement = this.elementNames[this.elementIndex];
    const original = this.allModels.get(newElement);
    if (!original) return false;
    this.mesh = this.buildMesh(original, newElement);
    Injector.scene.remove(oldMesh);
    this.setupAnimation();
    return true;
  }

  isFullyUpgradedOrSingle(): boolean {
    return this.elementIndex >= this.elementNames.length - 1;
  }

  hasPriceOrEarn(): boolean {
    const objConfig = objectsConfig.objects[this.objectName as ObjectKey] as Record<string, unknown>;
    return 'price' in objConfig || 'earn' in objConfig;
  }

  occupiesCell(col: number, row: number): boolean {
    const elementName = this.elementNames[this.elementIndex];
    const elementConfig = objectsConfig.elements[elementName as ElementKey];
    if (!elementConfig?.cells) return false;
    const cells = elementConfig.cells as number[][];
    const objCol = Math.round(this.gridPos.x);
    const objRow = Math.round(this.gridPos.y);
    const relCol = col - objCol;
    const relRow = row - objRow;
    return relRow >= 0 && relRow < cells.length &&
           relCol >= 0 && relCol < (cells[0]?.length ?? 0);
  }

  private getCellsShape(): number[][] {
    const elementName = this.elementNames[this.elementIndex];
    const elementConfig = objectsConfig.elements[elementName as ElementKey];
    const cells = (elementConfig?.cells as number[][]) ?? [[0]];
    return cells.map(row => row.map(() => 2));
  }

  resetCellsToGround(): void {
    const col = Math.round(this.gridPos.x);
    const row = Math.round(this.gridPos.y);
    Injector.grid.updateCells(col, row, this.getCellsShape());
  }

  checkReadyForCollect(): void {
    const objConfig = objectsConfig.objects[this.objectName as ObjectKey] as Record<string, unknown>;
    const hasPriceOrEarn = 'price' in objConfig || 'earn' in objConfig;
    if (this.isFullyUpgradedOrSingle() && hasPriceOrEarn) {
      this.status = 'READY_FOR_COLLECT';
      this.createCollectIcon();
    }
  }

  private createCollectIcon(): void {
    this.removeCollectIcon();
    if (!Injector.ui?.ready) return;
    this.collectIcon = new CollectIcon(Injector.ui);
  }

  private removeCollectIcon(): void {
    if (this.collectIcon) {
      this.collectIcon.destroy();
      this.collectIcon = null;
    }
  }

  collect(screenX?: number, screenY?: number): boolean {
    if (this.status !== 'READY_FOR_COLLECT' || !this.collectIcon) return false;
    const objConfig = objectsConfig.objects[this.objectName as ObjectKey] as Record<string, unknown>;
    const earn = (objConfig.earn as number) ?? 0;
    const price = (objConfig.price as number) ?? 0;

    const target = Injector.ui?.getMoneyCounterCollectTarget() ?? { x: 0, y: 0 };
    const onComplete = () => {
      this.removeCollectIcon();
      Injector.game.addMoney(earn > 0 ? earn : price * 2);
    };

    if (earn > 0) {
      this.status = 'idle';
      this.collectIcon.animateTo(target.x, target.y, onComplete);
      return true;
    }
    if (price > 0) {
      if (screenX !== undefined && screenY !== undefined) {
        Injector.ui?.showSmokeEffect(screenX, screenY);
      }
      this.resetCellsToGround();
      Injector.scene.remove(this.mesh);
      Injector.objects.removeObject(this);
      this.collectIcon.animateTo(target.x, target.y, onComplete);
      return true;
    }
    return false;
  }

  update(delta: number): void {
    if (this.mixer) {
      this.mixer.update(delta);
    }

    if (this.status === 'READY_FOR_COLLECT' && this.collectIcon && Injector.ui?.ready && Injector.camera && Injector.renderer) {
      const worldPos = this.mesh.getWorldPosition(new THREE.Vector3());
      worldPos.y += 1.5;
      this.collectIcon.updatePosition(worldPos, Injector.camera, Injector.renderer, Injector.ui);
    }

    if (this.placeRotationProgress > 0) {
      this.placeRotationProgress += delta / PLACE_ROTATION_DURATION;
      const t = Math.min(1, this.placeRotationProgress);
      const eased = 1 - (1 - t) * (1 - t);
      this.mesh.rotation.y = this.placeRotationStartY + eased * Math.PI * 2;
      if (t >= 1) this.placeRotationProgress = 0;
    }
  }

  static validate(
    objectName: string,
    gridPos: THREE.Vector2,
    models: Map<string, THREE.Object3D>,
  ): { original: THREE.Object3D } | null {
    const objConfig = objectsConfig.objects[objectName as ObjectKey];
    if (!objConfig) return null;

    const elementName = objConfig.elements[0];
    const original = models.get(elementName);
    if (!original) return null;

    const col = Math.round(gridPos.x);
    const row = Math.round(gridPos.y);
    const elementConfig = objectsConfig.elements[elementName as ElementKey];

    if (elementConfig?.cells) {
      for (const cellRow of elementConfig.cells) {
        for (let i = 0; i < cellRow.length; i++) {
          const gridCol = col + i;
          const gridRow = row + elementConfig.cells.indexOf(cellRow);
          if (gridCol < 0 || gridCol >= GRID_DIVISIONS || gridRow < 0 || gridRow >= GRID_DIVISIONS) {
            return null;
          }
        }
      }
    }

    return { original };
  }
}
