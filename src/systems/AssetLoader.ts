import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class AssetLoader {
  private gltfLoader: GLTFLoader = new GLTFLoader();

  /**
   * Memuat model 3D Black-Box Drone / Terminal menggunakan GLTFLoader standar
   * Menggunakan embedded Data-URI GLTF 2.0 yang valid & ringan (0 byte di disk)
   */
  public async loadTacticalArtifactModel(): Promise<THREE.Group> {
    // Embedded minimal GLTF 2.0 dengan mesh piramida/octahedron berputar untuk Black-Box Core
    const positions = new Float32Array([
      0, 0.35, 0,  -0.25, 0, 0.25,   0.25, 0, 0.25,
      0, 0.35, 0,   0.25, 0, 0.25,   0.25, 0, -0.25,
      0, 0.35, 0,   0.25, 0, -0.25, -0.25, 0, -0.25,
      0, 0.35, 0,  -0.25, 0, -0.25, -0.25, 0, 0.25
    ]);

    const uint8 = new Uint8Array(positions.buffer);
    let binaryStr = '';
    for (let i = 0; i < uint8.byteLength; i++) {
      binaryStr += String.fromCharCode(uint8[i]);
    }
    const base64Buf = btoa(binaryStr);

    const gltfJson = {
      asset: { version: '2.0', generator: 'OperationBlackVeil-ProceduralGLTF' },
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0, name: 'BlackBoxCore' }],
      meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
      materials: [
        {
          pbrMetallicRoughness: {
            baseColorFactor: [0.0, 0.9, 1.0, 1.0],
            metallicFactor: 0.8,
            roughnessFactor: 0.2
          },
          emissiveFactor: [0.0, 0.45, 0.6]
        }
      ],
      buffers: [
        {
          uri: `data:application/octet-stream;base64,${base64Buf}`,
          byteLength: positions.byteLength
        }
      ],
      bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.byteLength, target: 34962 }],
      accessors: [
        {
          bufferView: 0,
          componentType: 5126,
          count: 12,
          type: 'VEC3',
          max: [0.25, 0.35, 0.25],
          min: [-0.25, 0.0, -0.25]
        }
      ]
    };

    const dataUri =
      'data:model/gltf+json;charset=utf-8,' + encodeURIComponent(JSON.stringify(gltfJson));

    return new Promise((resolve) => {
      this.gltfLoader.load(
        dataUri,
        (gltf) => {
          resolve(gltf.scene);
        },
        undefined,
        () => {
          // Fallback aman jika gagal parse
          const fallbackGroup = new THREE.Group();
          const mesh = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.25, 0),
            new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x005577 })
          );
          fallbackGroup.add(mesh);
          resolve(fallbackGroup);
        }
      );
    });
  }

  public static createIndustrialTexture(
    baseHex: string,
    lineHex: string,
    repeatX: number,
    repeatY: number
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, 256, 256);

      // Tambah bintik grain beton/logam
      for (let i = 0; i < 1200; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
      }

      // Garis panel arsitektur industrial
      ctx.strokeStyle = lineHex;
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, 248, 248);

      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 128);
      ctx.lineTo(256, 128);
      ctx.moveTo(128, 0);
      ctx.lineTo(128, 256);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    return texture;
  }
}