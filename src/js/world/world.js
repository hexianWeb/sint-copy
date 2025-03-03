import * as THREE from 'three';

import Experience from '../experience.js';
import Environment from './environment.js';
import SintRobot from './sintRobot.js';

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    this.resources.on('ready', () => {
      // sintRobot
      this.sintRobot = new SintRobot();
      // Environment
      this.environment = new Environment();
    });
  }

  update() {
    if (this.sintRobot) {
      this.sintRobot.update();
    }
  }
}
