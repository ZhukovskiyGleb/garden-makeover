import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { WORLD_SCALE } from '../config/config.js';
import { GameObject } from './gameObject.js';

export class ObjectManager {
  private models = new Map<string, THREE.Object3D>();
  private allClips: THREE.AnimationClip[] = [];
  private placed: GameObject[] = [];

  load(): Promise<void> {
    return new Promise((resolve) => {
      const loader = new GLTFLoader();
      loader.load('./assets/gltf/objects2.glb', (gltf) => {
        const children = [...gltf.scene.children];
        for (const child of children) {
          child.scale.multiplyScalar(WORLD_SCALE);
          this.models.set(child.name, child);
        }
        this.allClips = gltf.animations;
        console.log('Loaded objects:', [...this.models.keys()]);
        console.log('Loaded animations:', this.allClips.map(c => c.name));
        resolve();
      });
    });
  }

  getModelNames(): string[] {
    return [...this.models.keys()];
  }

  place(objectName: string, gridPos: THREE.Vector2): GameObject | null {
    const validated = GameObject.validate(objectName, gridPos, this.models);
    if (!validated) return null;

    const gameObject = new GameObject(
      objectName,
      gridPos,
      validated.original,
      this.allClips,
      this.models,
    );
    this.placed.push(gameObject);
    return gameObject;
  }

  update(delta: number): void {
    for (const obj of this.placed) {
      obj.update(delta);
    }
  }

  skipTime(seconds: number): void {
    for (const obj of this.placed) {
      obj.skipTime(seconds);
    }
  }

  getPlaced(): readonly GameObject[] {
    return this.placed;
  }

  placeDefaults(): void {
    this.place('fence', new THREE.Vector2(7, 5));
    this.place('ground', new THREE.Vector2(0, 5));
    this.place('ground', new THREE.Vector2(2, 5));
    this.place('chicken', new THREE.Vector2(7, 1));
    this.place('chicken', new THREE.Vector2(1, 4));
    this.place('chicken', new THREE.Vector2(2, 1));
  }
}
