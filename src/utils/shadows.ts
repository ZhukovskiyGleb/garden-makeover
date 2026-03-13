import * as THREE from 'three';

export function ensureShadowMaterial(mat: THREE.Material): THREE.Material {
  if (mat instanceof THREE.MeshBasicMaterial) {
    return new THREE.MeshLambertMaterial({
      color: mat.color.clone(),
      transparent: mat.transparent,
      opacity: mat.opacity,
      map: mat.map,
    });
  }
  return mat;
}

export function setupSceneForShadows(scene: THREE.Object3D): void {
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.receiveShadow = true;
      obj.castShadow = true;
      if (obj.geometry) obj.geometry.computeVertexNormals();
      const oldMat = obj.material;
      if (Array.isArray(oldMat)) {
        obj.material = oldMat.map((m) => ensureShadowMaterial(m));
      } else {
        obj.material = ensureShadowMaterial(oldMat);
      }
    }
  });
}
