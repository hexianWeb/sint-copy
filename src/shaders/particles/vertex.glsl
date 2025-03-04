uniform float pixelRatio;
uniform float time;
uniform float size;
uniform float speed;
uniform float opacity;
uniform vec3 color;
uniform bool sizeAttenuation;

attribute vec3 noise;
attribute float particleSpeed;
attribute float particleSize;

varying vec3 vColor;
varying float vOpacity;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  modelPosition.y += sin(time * speed * particleSpeed + modelPosition.x * noise.x * 100.0) * 0.2;
  modelPosition.z += cos(time * speed * particleSpeed + modelPosition.x * noise.y * 100.0) * 0.2;
  modelPosition.x += cos(time * speed * particleSpeed + modelPosition.x * noise.z * 100.0) * 0.2;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectionPostion = projectionMatrix * viewPosition;

  gl_Position = projectionPostion;

  // 正交相机下粒子大小处理
  if (isOrthographic) {
    gl_PointSize = size * particleSize * 8.0 * pixelRatio; // 正交相机下使用较小的乘数
  } else {
    gl_PointSize = size * particleSize * 25.0 * pixelRatio;

    // 只在透视相机且启用大小衰减时应用距离衰减
    if (sizeAttenuation) {
      gl_PointSize *= (1.0 / - viewPosition.z);
    }
  }

  vColor = color;
  vOpacity = opacity;
}