import * as THREE from 'three';

import Experience from '../experience';

export default class SintRobot {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.debug = this.experience.debug.ui;
    this.debugActive = this.experience.debug.active;
    this.time = this.experience.time;

    // 动画相关属性
    this.currentAction = null;
    this.actions = {};
    this.animationSpeed = 0.15;
    this.isPlaying = true;

    // 添加 AxesHelper
    this.scene.add(new THREE.AxesHelper(5));
    this.setModel();
  }

  setModel() {
    this.model = this.resources.items.sintRobot.scene;

    // 找到名为mask 的mesh 并设置其
    const maskMesh = this.model.getObjectByName('mask');
    if (maskMesh) {
      // 设置maskMesh 为低反射的standMaterial
      maskMesh.material = new THREE.MeshStandardMaterial({
        color: 0xFF_FF_FF,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true
      });
    }
    // 调整模型大小 & 位置
    this.model.scale.set(0.02, 0.02, 0.02);
    this.model.position.set(0, -2.81, 0);
    this.scene.add(this.model);

    // 设置动画
    this.animation = {};
    this.animation.mixer = new THREE.AnimationMixer(this.model);
    this.animation.actions = {};

    // 获取所有动画剪辑
    this.animation.animations = this.resources.items.sintRobot.animations;

    // 为每个动画创建动作
    for (const clip of this.animation.animations) {
      this.animation.actions[clip.name] = this.animation.mixer.clipAction(clip);
    }

    // 默认播放第一个动画
    if (this.animation.animations.length > 0) {
      this.currentAction =
        this.animation.actions[this.animation.animations[0].name];
      this.currentAction.play();
    }

    this.debuggerInit();
  }

  // 更新动画混合器
  update() {
    if (this.animation.mixer && this.isPlaying) {
      this.animation.mixer.update(
        this.animationSpeed * 0.005 * this.time.delta
      );
    }
  }

  // 播放指定动画
  playAnimation(name) {
    const newAction = this.animation.actions[name];
    if (newAction) {
      if (this.currentAction) {
        this.currentAction.fadeOut(0.5);
      }
      newAction.reset().fadeIn(0.5).play();
      this.currentAction = newAction;
    }
  }

  // 设置动画速度
  setAnimationSpeed(speed) {
    this.animationSpeed = speed;
  }

  // 播放/暂停动画
  toggleAnimation() {
    this.isPlaying = !this.isPlaying;
    this.animation.mixer.timeScale = this.isPlaying ? 1 : 0;
  }

  debuggerInit() {
    if (this.debugActive) {
      const animationFolder = this.debug.addFolder({
        title: 'Animation Control',
        expanded: false
      });

      // 添加动画选择控制
      if (this.animation.animations.length > 0) {
        const animationNames = this.animation.animations.map((clip) => {
          return { text: clip.name, value: clip.name };
        });
        console.log(animationNames);

        const animationState = { current: animationNames[0] };

        // 添加动画速度控制
        animationFolder
          .addBinding(this, 'animationSpeed', {
            label: 'Speed',
            min: 0,
            max: 2,
            step: 0.01
          })
          .on('change', () => this.setAnimationSpeed(this.animationSpeed));

        // 添加动画播放/暂停控制
        animationFolder
          .addBinding(this, 'isPlaying', {
            label: 'Playing'
          })
          .on('change', () => this.toggleAnimation());

        animationFolder
          .addBlade({
            view: 'list',
            label: 'Animation',
            options: animationNames,
            value: 'idle'
          })
          .on('change', (event) => {
            animationState.current = event.value; // 更新当前动画状态
            this.playAnimation(animationState.current);
          });
      }
    }
  }
}
