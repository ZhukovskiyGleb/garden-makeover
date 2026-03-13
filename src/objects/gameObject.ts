import * as THREE from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import objectsConfig from '../config/objects.json';
import { GRID_DIVISIONS } from '../config/config.js';
import { Injector } from '../core/injector.js';
import { ensureShadowMaterial } from '../utils/shadows.js';
import { TimerBadge } from '../ui/elements/timerBadge.js';

type ObjectKey = keyof typeof objectsConfig.objects;
type ElementKey = keyof typeof objectsConfig.elements;

const UPGRADE_DURATION = 60;
const PLACE_ROTATION_DURATION = 1.2;

export class GameObject {
  readonly objectName: string;
  readonly gridPos: THREE.Vector2;
  mesh: THREE.Object3D;
  private mixer: THREE.AnimationMixer | null = null;
  private elementIndex = 0;
  private elementNames: string[];
  private allModels: Map<string, THREE.Object3D>;
  private allClips: THREE.AnimationClip[];
  private upgradeTimer = 0;
  private upgrading = false;
  private timerBadge: TimerBadge | null = null;
  private placeRotationProgress = 0;
  private placeRotationStartY = 0;

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

    if (this.elementNames.length > 1) {
      this.startUpgradeTimer();
    }
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

  private startUpgradeTimer(): void {
    this.upgrading = true;
    this.upgradeTimer = UPGRADE_DURATION - 5 + Math.ceil(Math.random() * 10);
    this.createTimerBadge();
  }

  private createTimerBadge(): void {
    this.removeTimerBadge();
    if (!Injector.ui?.ready) return;
    this.timerBadge = new TimerBadge(Injector.ui);
    this.timerBadge.setText(`${Math.ceil(this.upgradeTimer)}`);
  }

  private removeTimerBadge(): void {
    if (this.timerBadge) {
      this.timerBadge.destroy();
      this.timerBadge = null;
    }
  }

  private updateBadgePosition(): void {
    if (!this.timerBadge || !Injector.ui?.ready || !Injector.renderer || !Injector.camera) return;
    const col = Math.round(this.gridPos.x);
    const row = Math.round(this.gridPos.y);
    const cellCenter = Injector.grid.gridToWorld(col, row);
    cellCenter.y = -0.2;
    this.timerBadge.updatePosition(cellCenter, Injector.camera, Injector.renderer, Injector.ui);
  }

  update(delta: number): void {
    if (this.mixer) {
      this.mixer.update(delta);
    }

    if (this.placeRotationProgress > 0) {
      this.placeRotationProgress += delta / PLACE_ROTATION_DURATION;
      const t = Math.min(1, this.placeRotationProgress);
      const eased = 1 - (1 - t) * (1 - t);
      this.mesh.rotation.y = this.placeRotationStartY + eased * Math.PI * 2;
      if (t >= 1) this.placeRotationProgress = 0;
    }

    if (this.upgrading) {
      this.upgradeTimer -= delta;
      this.updateBadgePosition();

      if (this.upgradeTimer <= 0) {
        this.elementIndex = (this.elementIndex + 1) % this.elementNames.length;
        const oldMesh = this.mesh;
        const newElement = this.elementNames[this.elementIndex];
        const original = this.allModels.get(newElement);
        if (original) {
          this.mesh = this.buildMesh(original, newElement);
          Injector.scene.remove(oldMesh);
          this.setupAnimation();
        }

        if (this.elementIndex === this.elementNames.length - 1) {
          this.removeTimerBadge();
          this.upgrading = false;
        } else {
          this.startUpgradeTimer();
        }
      } else {
        this.timerBadge?.setText(`${Math.ceil(this.upgradeTimer)}`);
      }
    }
  }

  skipTime(seconds: number): void {
    if (this.upgrading) {
      this.upgradeTimer -= seconds;
      const fullSkips = Math.floor(this.upgradeTimer / UPGRADE_DURATION);
      for (let i = 0; i < fullSkips; i++) {
        this.elementIndex = (this.elementIndex + 1) % this.elementNames.length;
      }
      if (fullSkips > 0) {
        const oldMesh = this.mesh;
        const newElement = this.elementNames[this.elementIndex];
        const original = this.allModels.get(newElement);
        if (original) {
          this.mesh = this.buildMesh(original, newElement);
          Injector.scene.remove(oldMesh);
          this.setupAnimation();
        }
      }
      if (this.upgradeTimer <= 0) {
        this.removeTimerBadge();
        this.upgrading = false;
      } else {
        this.startUpgradeTimer();
      }
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
