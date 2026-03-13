import * as THREE from 'three';
import gridDefaultData from '../config/grid.json';
import { GRID_SIZE, GRID_DIVISIONS, GRID_CELL_SIZE, GRID_HALF, GRID_OFFSET } from '../config/config.js';

const gridData: number[][] = gridDefaultData.map(row => [...row]);

export class GridManager {
  private tiles: (THREE.Mesh | null)[][] = [];
  private darkCell = new THREE.MeshBasicMaterial({ color: 0x1a3a1a, transparent: true, opacity: 0.0 });
  private lightCell = new THREE.MeshBasicMaterial({ color: 0x2d5a2d, transparent: true, opacity: 0.0 });
  private greyCell = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.0 });
  private blueCell = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.5 });
  private buildGroundType: number | null = null;

  setup(scene: THREE.Scene): void {
    const grid = new THREE.GridHelper(GRID_SIZE, GRID_DIVISIONS, 0x446644, 0x334433);
    grid.position.set(GRID_OFFSET, 0, GRID_OFFSET);
    scene.add(grid);

    const cellGeo = new THREE.PlaneGeometry(GRID_CELL_SIZE, GRID_CELL_SIZE);

    for (let row = 0; row < GRID_DIVISIONS; row++) {
      this.tiles[row] = [];
      for (let col = 0; col < GRID_DIVISIONS; col++) {
        const tile = new THREE.Mesh(cellGeo, this.darkCell);
        tile.rotation.x = -Math.PI / 2;
        tile.position.copy(this.gridToWorld(col, row));
        this.applyTileState(tile, row, col, gridData[row][col]);
        scene.add(tile);
        this.tiles[row][col] = tile;
      }
    }
  }

  gridToWorld(col: number, row: number): THREE.Vector3 {
    return new THREE.Vector3(
      -GRID_HALF + GRID_CELL_SIZE * col + GRID_CELL_SIZE / 2 + GRID_OFFSET,
      0.0,
      -GRID_HALF + GRID_CELL_SIZE * row + GRID_CELL_SIZE / 2 + GRID_OFFSET,
    );
  }

  updateCells(col: number, row: number, cells: number[][]): void {
    for (let i = 0; i < cells.length; i++) {
      for (let j = 0; j < cells[i].length; j++) {
        const gridRow = row + i;
        const gridCol = col + j;
        if (gridRow >= 0 && gridRow < GRID_DIVISIONS && gridCol >= 0 && gridCol < GRID_DIVISIONS) {
          gridData[gridRow][gridCol] = cells[i][j];
        }
      }
    }
    this.refresh();
  }

  private refresh(): void {
    for (let row = 0; row < GRID_DIVISIONS; row++) {
      for (let col = 0; col < GRID_DIVISIONS; col++) {
        const tile = this.tiles[row]?.[col];
        if (tile) {
          this.applyTileState(tile, row, col, gridData[row][col]);
        }
      }
    }
  }

  enterBuildMode(groundType: number): void {
    this.buildGroundType = groundType;
    this.refresh();
  }

  exitBuildMode(): void {
    this.buildGroundType = null;
    this.refresh();
  }

  isInBuildMode(): boolean {
    return this.buildGroundType !== null;
  }

  getCellValue(col: number, row: number): number {
    if (row >= 0 && row < GRID_DIVISIONS && col >= 0 && col < GRID_DIVISIONS) {
      return gridData[row][col];
    }
    return -1;
  }

  worldToGrid(pos: THREE.Vector3): THREE.Vector2 | null {
    const col = Math.floor((pos.x + GRID_HALF - GRID_OFFSET) / GRID_CELL_SIZE);
    const row = Math.floor((pos.z + GRID_HALF - GRID_OFFSET) / GRID_CELL_SIZE);
    if (col >= 0 && col < GRID_DIVISIONS && row >= 0 && row < GRID_DIVISIONS) {
      return new THREE.Vector2(col, row);
    }
    return null;
  }

  getTiles(): (THREE.Mesh | null)[][] {
    return this.tiles;
  }

  getTileMeshes(): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    for (const row of this.tiles) {
      for (const tile of row) {
        if (tile) meshes.push(tile);
      }
    }
    return meshes;
  }

  private applyTileState(tile: THREE.Mesh, row: number, col: number, value: number): void {
    if (this.buildGroundType !== null) {
      tile.visible = value === this.buildGroundType;
      tile.material = this.blueCell;
      return;
    }
    tile.visible = value !== 0;
    if (value === 2) {
      tile.material = this.greyCell;
    } else {
      tile.material = (row + col) % 2 === 0 ? this.lightCell : this.darkCell;
    }
  }
}
