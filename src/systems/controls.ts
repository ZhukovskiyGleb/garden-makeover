import * as THREE from 'three';

const DRAG_THRESHOLD = 5;

export class DragControls {
  private isDragging = false;
  private dragStart = new THREE.Vector2();
  private dragCameraStart = new THREE.Vector3();
  private camRight = new THREE.Vector3();
  private camForward = new THREE.Vector3();
  wasDragged = false;
  private onClickCallback: ((x: number, y: number) => void) | null = null;
  private onDragStartCallback: (() => void) | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private camera: THREE.PerspectiveCamera,
    private cameraTarget: THREE.Vector3,
    private cameraOffset: THREE.Vector3,
  ) {
    this.bind();
  }

  setOnClick(callback: (x: number, y: number) => void): void {
    this.onClickCallback = callback;
  }

  setOnDragStart(callback: () => void): void {
    this.onDragStartCallback = callback;
  }

  private bind(): void {
    const DRAG_SPEED = 0.01;

    const getPointer = (e: PointerEvent): THREE.Vector2 => {
      return new THREE.Vector2(e.clientX, e.clientY);
    };

    const updateCameraAxes = () => {
      this.camera.getWorldDirection(new THREE.Vector3());
      this.camRight.setFromMatrixColumn(this.camera.matrixWorld, 0).setY(0).normalize();
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      this.camForward.copy(forward).setY(0).normalize();
    };

    const onStart = (e: PointerEvent) => {
      this.isDragging = true;
      this.wasDragged = false;
      this.dragStart.copy(getPointer(e));
      this.dragCameraStart.copy(this.cameraTarget);
      this.onDragStartCallback?.();
      updateCameraAxes();
    };

    const onMove = (e: PointerEvent) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const pointer = getPointer(e);
      const dist = pointer.distanceTo(this.dragStart);
      if (dist > DRAG_THRESHOLD) this.wasDragged = true;
      const dx = (pointer.x - this.dragStart.x) * DRAG_SPEED;
      const dy = (pointer.y - this.dragStart.y) * DRAG_SPEED;

      this.cameraTarget.copy(this.dragCameraStart)
        .addScaledVector(this.camRight, -dx)
        .addScaledVector(this.camForward, dy);

      this.camera.position.copy(this.cameraTarget).add(this.cameraOffset);
      this.camera.lookAt(this.cameraTarget);
    };

    const onEnd = (e?: PointerEvent) => {
      if (!this.wasDragged && e && this.onClickCallback) {
        this.onClickCallback(e.clientX, e.clientY);
      }
      this.isDragging = false;
    };

    this.canvas.addEventListener('pointerdown', (e) => onStart(e), { passive: false });
    this.canvas.addEventListener('pointermove', (e) => onMove(e), { passive: false });
    this.canvas.addEventListener('pointerup', (e) => onEnd(e));
    this.canvas.addEventListener('pointerleave', () => onEnd());
    this.canvas.addEventListener('pointercancel', () => onEnd());
  }
}
