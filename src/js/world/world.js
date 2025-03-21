import * as THREE from 'three';

import FlyLine from '../components/fly-line.js';
import ParticleSystem from '../components/geometry-particles.js';
import Experience from '../experience.js';
import Environment from './environment.js';
import SintRobot from './sintRobot.js';

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.sizes = this.experience.sizes;
    this.resources.on('ready', () => {
      // sintRobot
      this.sintRobot = new SintRobot();
      // Environment
      this.environment = new Environment();
    });

    // 创建一个平面几何体，宽高与视口大小相同
    const planeGeometry = new THREE.PlaneGeometry(
      2 * this.sizes.aspect,
      2,
      1,
      1
    );
    // 创建基础材质
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF_FF_FF,
      wireframe: true
    });
    // 创建平面网格
    this.plane = new THREE.Mesh(planeGeometry, planeMaterial);

    // 克隆一个平面让其置于 -0.5 z
    const clonedPlane = this.plane.clone();
    clonedPlane.position.set(0, 0, -0.5);
    this.scene.add(clonedPlane);

    this.plane.position.set(0, 0, 0.5);

    // 将平面添加到场景中
    this.scene.add(this.plane);

    // 创建粒子系统
    this.geometryParticles = new ParticleSystem([this.plane, clonedPlane]);

    // 隐藏原始平面
    this.plane.visible = false;
    clonedPlane.visible = false;

    // 创建飞线
    const startPoint = new THREE.Vector3(-1, 0, -0.5);
    const endPoint = new THREE.Vector3(1, 0, -0.5);
    // 可选控制点，如果不提供会自动生成
    const controlPoint = new THREE.Vector3(0, -0.8, 2);

    // 创建飞线实例
    this.flyLine = new FlyLine(startPoint, endPoint, controlPoint, {
      lineWidth: 0.02,
      lineColor: '#fff',
      lineOpacity: 0.5,
      pointSize: 0.15,
      pointColor: '#ffffff',
      pointSpeed: 1.5
    });
  }

  update() {
    if (this.sintRobot) {
      this.sintRobot.update();
    }
    if (this.geometryParticles) {
      this.geometryParticles.update();
    }
    if (this.flyLine) {
      this.flyLine.update();
    }
  }
}
