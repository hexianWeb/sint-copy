import * as THREE from 'three';

import Experience from '../experience';

export default class SintRobot {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.mouse = this.experience.iMouse;
    this.debug = this.experience.debug.ui;
    this.debugActive = this.experience.debug.active;
    this.time = this.experience.time;
    this.camera = this.experience.camera.instance;

    // 动画相关属性
    this.currentAction = null;
    this.actions = {};
    this.animationSpeed = 0.15;
    this.isPlaying = true;

    // Parallax 效果相关属性
    this.parallaxFactor = 0.1;
    this.parallaxLerp = 0.1;
    this.initialCameraPosition = this.camera.position.clone();
    this.targetCameraPosition = this.camera.position.clone();

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
        roughness: 0.226,
        metalness: 0.5,
        transparent: true,
        opacity: 0.65
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
    // 更新相机位置以创造 parallax 效果
    this.updateCameraPosition();
  }

  updateCameraPosition() {
    const { x, y } = this.mouse.normalizedMouse;

    // 更新相机位置
    this.targetCameraPosition.x =
      this.initialCameraPosition.x + x * this.parallaxFactor;
    this.targetCameraPosition.y =
      this.initialCameraPosition.y + y * this.parallaxFactor * 0.25;

    // 平滑过渡到目标位置
    this.camera.position.lerp(this.targetCameraPosition, this.parallaxLerp);

    // 创建一个视点目标，也随鼠标移动但幅度更小
    const lookAtTarget = new THREE.Vector3(
      this.scene.position.x + x * this.parallaxFactor * 0.05,
      this.scene.position.y + y * this.parallaxFactor * 0.015,
      this.scene.position.z
    );

    // 相机看向这个动态目标点
    this.camera.lookAt(lookAtTarget);
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
      const parallaxFolder = this.debug.addFolder({
        title: 'Parallax Effect',
        expanded: false
      });

      parallaxFolder
        .addBinding(this, 'parallaxFactor', {
          label: 'Parallax Factor',
          min: 0,
          max: 1,
          step: 0.01
        })
        .on('change', () => this.updateCameraPosition());

      parallaxFolder.addBinding(this, 'parallaxLerp', {
        label: 'Parallax Smoothness',
        min: 0.01,
        max: 1,
        step: 0.01
      });

      parallaxFolder
        .addBinding(this.initialCameraPosition, 'x', {
          label: 'Initial Camera X',
          min: -10,
          max: 10,
          step: 0.1
        })
        .on('change', () => {
          this.camera.position.x = this.initialCameraPosition.x;
          this.targetCameraPosition.x = this.initialCameraPosition.x;
        });

      parallaxFolder
        .addBinding(this.initialCameraPosition, 'y', {
          label: 'Initial Camera Y',
          min: -10,
          max: 10,
          step: 0.1
        })
        .on('change', () => {
          this.camera.position.y = this.initialCameraPosition.y;
          this.targetCameraPosition.y = this.initialCameraPosition.y;
        });

      parallaxFolder
        .addBinding(this.initialCameraPosition, 'z', {
          label: 'Initial Camera Z',
          min: 0,
          max: 20,
          step: 0.1
        })
        .on('change', () => {
          this.camera.position.z = this.initialCameraPosition.z;
          this.targetCameraPosition.z = this.initialCameraPosition.z;
        });
    }
  }
}
