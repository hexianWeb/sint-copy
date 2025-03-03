import * as THREE from 'three';

import Experience from '../experience.js';

export default class Environment {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.debug = this.experience.debug.ui;
    this.debugActive = this.experience.debug.active;

    // Setup
    this.setLights();
    this.debuggerInit();
  }

  setLights() {
    // 第一个方向光源
    this.directionalLight1 = new THREE.DirectionalLight();
    this.directionalLight1.position.set(1, 2, 2);
    this.directionalLight1.color.setRGB(0.95, 0.95, 0.95);
    this.directionalLight1.intensity = 3;
    this.scene.add(this.directionalLight1);

    // 第二个方向光源
    this.directionalLight2 = new THREE.DirectionalLight();
    this.directionalLight2.position.set(-1, 3, 1);
    this.directionalLight2.color.setRGB(0.45, 0.36, 0.22);
    this.directionalLight2.intensity = 4.1;
    this.scene.add(this.directionalLight2);

    // 环境光
    this.ambientLight = new THREE.AmbientLight();
    this.ambientLight.color.setRGB(
      0.309_468_922_806_742_8,
      0,
      0.964_686_247_893_661_2
    );
    this.ambientLight.intensity = 2;
    this.scene.add(this.ambientLight);
  }

  updateDirectionalLight1Position() {
    this.directionalLight1.position.copy(this.light1Position);
  }

  updateDirectionalLight1Color() {
    this.directionalLight1.color.copy(this.light1Color);
  }

  updateDirectionalLight1Intensity() {
    this.directionalLight1.intensity = this.light1Intensity;
  }

  updateDirectionalLight2Position() {
    this.directionalLight2.position.copy(this.light2Position);
  }

  updateDirectionalLight2Color() {
    this.directionalLight2.color.copy(this.light2Color);
  }

  updateDirectionalLight2Intensity() {
    this.directionalLight2.intensity = this.light2Intensity;
  }

  updateAmbientLightColor() {
    this.ambientLight.color.copy(this.ambientColor);
  }

  updateAmbientLightIntensity() {
    this.ambientLight.intensity = this.ambientIntensity;
  }

  debuggerInit() {
    if (this.debugActive) {
      const lightsFolder = this.debug.addFolder({
        title: 'Lights',
        expanded: false
      });

      // 第一个方向光源的调试控制
      const light1Folder = lightsFolder.addFolder({
        title: 'Directional Light 1',
        expanded: false
      });

      this.light1Position = this.directionalLight1.position.clone();
      this.light1Color = this.directionalLight1.color.clone();
      this.light1Intensity = this.directionalLight1.intensity;

      light1Folder
        .addBinding(this, 'light1Position', {
          label: 'Position'
        })
        .on('change', this.updateDirectionalLight1Position.bind(this));

      light1Folder
        .addBinding(this, 'light1Color', {
          label: 'Color',
          view: 'color',
          color: { type: 'float' }
        })
        .on('change', this.updateDirectionalLight1Color.bind(this));

      light1Folder
        .addBinding(this, 'light1Intensity', {
          label: 'Intensity',
          min: 0,
          max: 10,
          step: 0.1
        })
        .on('change', this.updateDirectionalLight1Intensity.bind(this));

      // 第二个方向光源的调试控制
      const light2Folder = lightsFolder.addFolder({
        title: 'Directional Light 2',
        expanded: false
      });

      this.light2Position = this.directionalLight2.position.clone();
      this.light2Color = this.directionalLight2.color.clone();
      this.light2Intensity = this.directionalLight2.intensity;

      light2Folder
        .addBinding(this, 'light2Position', {
          label: 'Position'
        })
        .on('change', this.updateDirectionalLight2Position.bind(this));

      light2Folder
        .addBinding(this, 'light2Color', {
          label: 'Color',
          view: 'color',
          color: { type: 'float' }
        })
        .on('change', this.updateDirectionalLight2Color.bind(this));

      light2Folder
        .addBinding(this, 'light2Intensity', {
          label: 'Intensity',
          min: 0,
          max: 10,
          step: 0.1
        })
        .on('change', this.updateDirectionalLight2Intensity.bind(this));

      // 环境光的调试控制
      const ambientFolder = lightsFolder.addFolder({
        title: 'Ambient Light',
        expanded: false
      });

      this.ambientColor = this.ambientLight.color.clone();
      this.ambientIntensity = this.ambientLight.intensity;

      ambientFolder
        .addBinding(this, 'ambientColor', {
          label: 'Color',
          view: 'color'
        })
        .on('change', this.updateAmbientLightColor.bind(this));

      ambientFolder
        .addBinding(this, 'ambientIntensity', {
          label: 'Intensity',
          min: 0,
          max: 10,
          step: 0.1
        })
        .on('change', this.updateAmbientLightIntensity.bind(this));
    }
  }
}
