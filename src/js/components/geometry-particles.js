import * as THREE from 'three';

import fragmentShader from '../../shaders/particles/fragment.glsl';
import vertexShader from '../../shaders/particles/vertex.glsl';
import Experience from '../experience.js';

export default class GeometryParticles {
  constructor(sourceMeshes) {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.debug = this.experience.debug;
    this.debugActive = this.experience.debug.active;
    this.time = this.experience.time;
    this.camera = this.experience.camera;

    // 存储源几何体
    this.sourceMeshes = sourceMeshes || [];

    // 初始化参数
    this.parameters = {
      count: 230,
      color: '#ffffff',
      size: 3.8, // 降低默认大小
      speed: 0.27,
      opacity: 1,
      sizeAttenuation: false // 添加控制是否根据距离衰减大小的参数
    };

    // 设置材质、几何体和粒子系统
    this.setGeometry();
    this.setMaterial();
    this.setPoints();

    // 设置调试面板
    if (this.debugActive) {
      this.setDebug();
    }
  }

  setGeometry() {
    // 确保有源几何体可用
    if (this.sourceMeshes.length === 0) {
      console.warn('没有提供源几何体进行采样');
      return;
    }

    // 创建粒子几何体
    this.geometry = new THREE.BufferGeometry();

    // 位置数组
    const positions = new Float32Array(this.parameters.count * 3);
    // 噪声数组（用于动画）
    const noises = new Float32Array(this.parameters.count * 3);
    // 随机速度数组
    const speeds = new Float32Array(this.parameters.count);
    // 随机大小数组
    const sizes = new Float32Array(this.parameters.count);

    // 从源几何体中采样点
    for (let index = 0; index < this.parameters.count; index++) {
      // 随机选择一个源几何体
      const meshIndex = Math.floor(Math.random() * this.sourceMeshes.length);
      const mesh = this.sourceMeshes[meshIndex];

      // 获取源几何体的顶点
      const sourcePositions = mesh.geometry.attributes.position.array;
      const vertexCount = sourcePositions.length / 3;

      // 随机选择一个顶点
      const randomVertexIndex = Math.floor(Math.random() * vertexCount);

      // 获取顶点位置
      const x = sourcePositions[randomVertexIndex * 3];
      const y = sourcePositions[randomVertexIndex * 3 + 1];
      const z = sourcePositions[randomVertexIndex * 3 + 2];

      // 应用网格变换
      const position = new THREE.Vector3(x, y, z);
      position.applyMatrix4(mesh.matrixWorld);

      // 设置位置
      positions[index * 3] = position.x;
      positions[index * 3 + 1] = position.y;
      positions[index * 3 + 2] = position.z;

      // 随机噪声值（从0.3, 0.6, 0.9中选择）
      const noiseValues = [0.3, 0.6, 0.9];
      noises[index * 3] = noiseValues[Math.floor(Math.random() * 3)];
      noises[index * 3 + 1] = noiseValues[Math.floor(Math.random() * 3)];
      noises[index * 3 + 2] = noiseValues[Math.floor(Math.random() * 3)];

      // 随机速度值（0.5到1.5之间）
      speeds[index] = 0.5 + Math.random();
      // 随机大小值（0.3到1.0之间）
      sizes[index] = 0.3 + Math.random() * 0.7;
    }

    // 设置几何体属性
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    this.geometry.setAttribute('noise', new THREE.BufferAttribute(noises, 3));
    this.geometry.setAttribute(
      'particleSpeed',
      new THREE.BufferAttribute(speeds, 1)
    );
    this.geometry.setAttribute(
      'particleSize',
      new THREE.BufferAttribute(sizes, 1)
    );
  }

  setMaterial() {
    // 判断是否为正交相机
    const isOrthographic =
      this.camera.instance instanceof THREE.OrthographicCamera;

    // 创建着色器材质
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        pixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        time: { value: 0 },
        size: { value: this.parameters.size },
        speed: { value: this.parameters.speed },
        opacity: { value: this.parameters.opacity },
        color: { value: new THREE.Color(this.parameters.color) },
        isOrthographic: { value: isOrthographic },
        sizeAttenuation: { value: this.parameters.sizeAttenuation }
      }
    });
  }

  setPoints() {
    // 创建粒子系统
    if (this.geometry) {
      this.points = new THREE.Points(this.geometry, this.material);
      this.scene.add(this.points);
    }
  }

  setDebug() {
    const particlesFolder = this.debug.ui.addFolder({
      title: '粒子系统',
      expanded: true
    });

    // 颜色控制
    particlesFolder
      .addBinding(this.parameters, 'color', {
        view: 'color',
        label: '粒子颜色'
      })
      .on('change', () => {
        this.material.uniforms.color.value.set(this.parameters.color);
      });

    // 大小控制
    particlesFolder
      .addBinding(this.parameters, 'size', {
        min: 0.1,
        max: 5,
        step: 0.1,
        label: '粒子大小'
      })
      .on('change', () => {
        this.material.uniforms.size.value = this.parameters.size;
      });

    // 速度控制
    particlesFolder
      .addBinding(this.parameters, 'speed', {
        min: 0.1,
        max: 5,
        step: 0.1,
        label: '动画速度'
      })
      .on('change', () => {
        this.material.uniforms.speed.value = this.parameters.speed;
      });

    // 不透明度控制
    particlesFolder
      .addBinding(this.parameters, 'opacity', {
        min: 0.1,
        max: 1,
        step: 0.1,
        label: '不透明度'
      })
      .on('change', () => {
        this.material.uniforms.opacity.value = this.parameters.opacity;
      });

    // 大小衰减控制
    particlesFolder
      .addBinding(this.parameters, 'sizeAttenuation', {
        label: '大小随距离衰减'
      })
      .on('change', () => {
        this.material.uniforms.sizeAttenuation.value =
          this.parameters.sizeAttenuation;
      });

    // 粒子数量控制（需要重新生成粒子）
    particlesFolder
      .addBinding(this.parameters, 'count', {
        min: 50,
        max: 500,
        step: 10,
        label: '粒子数量'
      })
      .on('change', () => {
        // 移除旧的粒子系统
        if (this.points) {
          this.scene.remove(this.points);
        }

        // 重新创建几何体和粒子系统
        this.setGeometry();
        this.setPoints();
      });
  }

  update() {
    // 更新时间uniform
    if (this.material) {
      this.material.uniforms.time.value = this.time.elapsed * 0.001;
    }
  }
}
