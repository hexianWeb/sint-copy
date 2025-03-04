import * as THREE from 'three';

import Experience from '../experience.js';

export default class FlyLine {
  constructor(startPoint, endPoint, controlPoint, options = {}) {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.time = this.experience.time;
    this.debug = this.experience.debug;
    this.debugActive = this.experience.debug.active;

    // 设置点位置
    this.startPoint =
      startPoint instanceof THREE.Vector3
        ? startPoint
        : new THREE.Vector3(startPoint.x, startPoint.y, startPoint.z);

    this.endPoint =
      endPoint instanceof THREE.Vector3
        ? endPoint
        : new THREE.Vector3(endPoint.x, endPoint.y, endPoint.z);

    // 如果没有提供控制点，自动生成一个
    if (controlPoint) {
      this.controlPoint =
        controlPoint instanceof THREE.Vector3
          ? controlPoint
          : new THREE.Vector3(controlPoint.x, controlPoint.y, controlPoint.z);
    } else {
      // 计算起点和终点的中点
      const midPoint = new THREE.Vector3()
        .addVectors(this.startPoint, this.endPoint)
        .multiplyScalar(0.5);
      // 向上偏移一定距离作为控制点
      const distance = this.startPoint.distanceTo(this.endPoint);
      midPoint.y += distance * 0.5;
      this.controlPoint = midPoint;
    }

    // 设置参数
    this.parameters = {
      lineWidth: options.lineWidth || 0.02,
      lineColor: options.lineColor || '#ffffff',
      lineOpacity: options.lineOpacity || 0.5,
      pointSize: options.pointSize || 0.1,
      pointColor: options.pointColor || '#ffffff',
      pointOpacity: options.pointOpacity || 1,
      pointSpeed: options.pointSpeed || 1,
      curveSegments: options.curveSegments || 50,
      dashLength: options.dashLength || 0, // 虚线长度，0表示实线
      dashGap: options.dashGap || 0, // 虚线间隔，0表示实线
      dashAnimationSpeed: options.dashAnimationSpeed || 0 // 虚线动画速度，0表示不动
    };

    // 创建曲线和移动点
    this.createCurve();
    this.createLine();
    this.createMovingPoint();

    // 设置调试面板
    if (this.debugActive) {
      this.setDebug();
    }
  }

  createCurve() {
    // 创建二阶贝塞尔曲线
    this.curve = new THREE.QuadraticBezierCurve3(
      this.startPoint,
      this.controlPoint,
      this.endPoint
    );

    // 计算曲线上的点
    this.curvePoints = this.curve.getPoints(this.parameters.curveSegments);
  }

  createLine() {
    // 创建曲线几何体
    this.lineGeometry = new THREE.BufferGeometry().setFromPoints(
      this.curvePoints
    );

    // 为每个顶点添加透明度属性
    const alphas = new Float32Array(this.curvePoints.length);
    for (let index = 0; index < this.curvePoints.length; index++) {
      // 计算当前点在曲线上的位置 (0-1)
      const t = index / (this.curvePoints.length - 1);

      // 起点和终点透明，中间半透明
      // 使用平滑的正弦曲线进行过渡
      alphas[index] = Math.sin(t * Math.PI) * this.parameters.lineOpacity;
    }
    this.lineGeometry.setAttribute(
      'alpha',
      new THREE.BufferAttribute(alphas, 1)
    );

    // 创建着色器材质
    this.lineMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;

        void main() {
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;

        void main() {
          gl_FragColor = vec4(color, vAlpha);

          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      uniforms: {
        color: { value: new THREE.Color(this.parameters.lineColor) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    // 创建线条
    this.line = new THREE.Line(this.lineGeometry, this.lineMaterial);
    this.line.frustumCulled = false; // 防止被视锥体裁剪
    this.scene.add(this.line);
  }

  createMovingPoint() {
    // 创建点的几何体
    this.pointGeometry = new THREE.BufferGeometry();
    this.pointGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(3), 3)
    );

    // 创建点的材质
    this.pointMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float size;
        uniform float pixelRatio;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * 25.0 * pixelRatio;
          gl_PointSize *= (1.0 / - mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;

        void main() {
          float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
          float strength = 0.05 / distanceToCenter - 0.1;

          gl_FragColor = vec4(color, strength * opacity);

          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      uniforms: {
        size: { value: this.parameters.pointSize },
        color: { value: new THREE.Color(this.parameters.pointColor) },
        opacity: { value: this.parameters.pointOpacity },
        pixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    // 创建点
    this.point = new THREE.Points(this.pointGeometry, this.pointMaterial);
    this.point.frustumCulled = false; // 防止被视锥体裁剪
    this.scene.add(this.point);

    // 初始化点的位置
    this.pointProgress = 0;
    this.updatePointPosition();
  }

  updatePointPosition() {
    // 根据当前进度获取曲线上的点
    const position = this.curve.getPoint(this.pointProgress);

    // 更新点的位置
    this.pointGeometry.attributes.position.array[0] = position.x;
    this.pointGeometry.attributes.position.array[1] = position.y;
    this.pointGeometry.attributes.position.array[2] = position.z;
    this.pointGeometry.attributes.position.needsUpdate = true;
  }

  setDebug() {
    const flyLineFolder = this.debug.ui.addFolder({
      title: '飞线',
      expanded: false
    });

    // 线条宽度
    flyLineFolder
      .addBinding(this.parameters, 'lineWidth', {
        min: 0.001,
        max: 0.1,
        step: 0.001,
        label: '线条宽度'
      })
      .on('change', () => {
        this.line.material.linewidth = this.parameters.lineWidth;
      });

    // 线条颜色
    flyLineFolder
      .addBinding(this.parameters, 'lineColor', {
        view: 'color',
        label: '线条颜色'
      })
      .on('change', () => {
        this.lineMaterial.uniforms.color.value.set(this.parameters.lineColor);
      });

    // 线条透明度
    flyLineFolder
      .addBinding(this.parameters, 'lineOpacity', {
        min: 0,
        max: 1,
        step: 0.01,
        label: '线条透明度'
      })
      .on('change', () => {
        // 更新透明度
        const alphas = this.lineGeometry.attributes.alpha.array;
        for (let index = 0; index < this.curvePoints.length; index++) {
          const t = index / (this.curvePoints.length - 1);
          alphas[index] = Math.sin(t * Math.PI) * this.parameters.lineOpacity;
        }
        this.lineGeometry.attributes.alpha.needsUpdate = true;
      });

    // 点大小
    flyLineFolder
      .addBinding(this.parameters, 'pointSize', {
        min: 0.01,
        max: 1,
        step: 0.01,
        label: '点大小'
      })
      .on('change', () => {
        this.pointMaterial.uniforms.size.value = this.parameters.pointSize;
      });

    // 点颜色
    flyLineFolder
      .addBinding(this.parameters, 'pointColor', {
        view: 'color',
        label: '点颜色'
      })
      .on('change', () => {
        this.pointMaterial.uniforms.color.value.set(this.parameters.pointColor);
      });

    // 点透明度
    flyLineFolder
      .addBinding(this.parameters, 'pointOpacity', {
        min: 0,
        max: 1,
        step: 0.01,
        label: '点透明度'
      })
      .on('change', () => {
        this.pointMaterial.uniforms.opacity.value =
          this.parameters.pointOpacity;
      });

    // 点速度
    flyLineFolder.addBinding(this.parameters, 'pointSpeed', {
      min: 0.1,
      max: 5,
      step: 0.1,
      label: '点速度'
    });
  }

  update() {
    // 更新点的位置
    this.pointProgress += 0.005 * this.parameters.pointSpeed;

    // 当点到达终点时，重置到起点
    if (this.pointProgress > 1) {
      this.pointProgress = 0;
    }

    this.updatePointPosition();
  }

  // 销毁方法，清理资源
  destroy() {
    this.scene.remove(this.line);
    this.scene.remove(this.point);

    this.lineGeometry.dispose();
    this.lineMaterial.dispose();
    this.pointGeometry.dispose();
    this.pointMaterial.dispose();
  }
}
