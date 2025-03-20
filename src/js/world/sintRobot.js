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
    this.renderer = this.experience.renderer.instance;
    this.time = this.experience.time;
    this.camera = this.experience.camera.instance;

    // 动画相关属性
    this.currentAction = null;
    this.actions = {};
    this.animationSpeed = 0.15;
    this.isPlaying = true;

    // Parallax 效果相关属性
    this.parallax = {
      factor: 0.1,
      lerp: 0.1,
      initialCameraPosition: this.camera.position.clone(),
      targetCameraPosition: this.camera.position.clone()
    };

    this.setModel();
  }

  setModel() {
    this.model = this.resources.items.sintRobot.scene;

    // 找到名为mask 的mesh 并设置其材质
    this.maskMesh = this.model.getObjectByName('mask');
    
    if (this.maskMesh) {
      this.maskMesh.material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.226,
        metalness: 0.5,
        transparent: true,
        opacity: 0.65,
      });
    }

    // 调整模型大小 & 位置
    this.model.scale.set(0.02, 0.02, 0.02);
    this.model.position.set(0, -2.81, 0);
    this.scene.add(this.model);

    // 设置动画
    this.animation = {
      mixer: new THREE.AnimationMixer(this.model),
      actions: {},
      animations: this.resources.items.sintRobot.animations
    };

    // 为每个动画创建动作
    this.animation.animations.forEach(clip => {
      this.animation.actions[clip.name] = this.animation.mixer.clipAction(clip);
    });

    // 默认播放第一个动画
    if (this.animation.animations.length > 0) {
      this.currentAction = this.animation.actions[this.animation.animations[0].name];
      this.currentAction.play();
    }

    this.debuggerInit();
  }

  update() {
    if (this.animation.mixer && this.isPlaying) {
      this.animation.mixer.update(this.animationSpeed * 0.005 * this.time.delta);
    }
    if (this.maskMesh) {
      this.maskMesh.material.envMapRotation = new THREE.Euler(
        // 0 + this.time.elapsed * 0.003,
        0,
        // 0 + this.time.elapsed * 0.002,
        0,
        0
      );
      this.maskMesh.material.needsUpdate = true;
    }
    this.updateCameraPosition();
  }

  updateCameraPosition() {
    const { x, y } = this.mouse.normalizedMouse;

    // 创建一个视点目标，也随鼠标移动但幅度更小
    const lookAtTarget = new THREE.Vector3(
      this.scene.position.x + x * this.parallax.factor * 0.25,
      this.scene.position.y + y * this.parallax.factor * 0.15,
      this.scene.position.z
    );

    // 如果是第一次更新，初始化当前目标点
    if (!this.currentLookAtTarget) {
      this.currentLookAtTarget = lookAtTarget.clone();
    }

    // 平滑插值过渡到新的目标点
    this.currentLookAtTarget.lerp(lookAtTarget, 0.07);

    // 相机平滑过渡看向这个动态目标点
    this.camera.lookAt(this.currentLookAtTarget);
  }

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

  setAnimationSpeed(speed) {
    this.animationSpeed = speed;
  }

  toggleAnimation() {
    this.isPlaying = !this.isPlaying;
    this.animation.mixer.timeScale = this.isPlaying ? 1 : 0;
  }

  debuggerInit() {
    if (this.debugActive) {
      this.initAnimationDebugPanel();
      this.initParallaxDebugPanel();
    }
  }

  initAnimationDebugPanel() {
    const animationFolder = this.debug.addFolder({
      title: 'Animation Control',
      expanded: false
    });

    if (this.animation.animations.length > 0) {
      const animationNames = this.animation.animations.map(clip => ({
        text: clip.name,
        value: clip.name
      }));

      const animationState = { current: animationNames[0] };

      animationFolder
        .addBinding(this, 'animationSpeed', {
          label: 'Speed',
          min: 0,
          max: 2,
          step: 0.01
        })
        .on('change', () => this.setAnimationSpeed(this.animationSpeed));

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
        .on('change', event => {
          animationState.current = event.value;
          this.playAnimation(animationState.current);
        });
    }
  }

  initParallaxDebugPanel() {
    const parallaxFolder = this.debug.addFolder({
      title: 'Parallax Effect',
      expanded: false
    });

    parallaxFolder
      .addBinding(this.parallax, 'factor', {
        label: 'Parallax Factor',
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', () => this.updateCameraPosition());

    parallaxFolder.addBinding(this.parallax, 'lerp', {
      label: 'Parallax Smoothness',
      min: 0.01,
      max: 1,
      step: 0.01
    });

    parallaxFolder
      .addBinding(this.parallax.initialCameraPosition, 'x', {
        label: 'Initial Camera X',
        min: -10,
        max: 10,
        step: 0.1
      })
      .on('change', () => {
        this.camera.position.x = this.parallax.initialCameraPosition.x;
        this.parallax.targetCameraPosition.x = this.parallax.initialCameraPosition.x;
      });

    parallaxFolder
      .addBinding(this.parallax.initialCameraPosition, 'y', {
        label: 'Initial Camera Y',
        min: -10,
        max: 10,
        step: 0.1
      })
      .on('change', () => {
        this.camera.position.y = this.parallax.initialCameraPosition.y;
        this.parallax.targetCameraPosition.y = this.parallax.initialCameraPosition.y;
      });

    parallaxFolder
      .addBinding(this.parallax.initialCameraPosition, 'z', {
        label: 'Initial Camera Z',
        min: 0,
        max: 20,
        step: 0.1
      })
      .on('change', () => {
        this.camera.position.z = this.parallax.initialCameraPosition.z;
        this.parallax.targetCameraPosition.z = this.parallax.initialCameraPosition.z;
      });
  }
}
