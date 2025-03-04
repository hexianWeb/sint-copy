export default [
  {
    name: 'environmentMapTexture',
    type: 'cubeTexture',
    path: [
      'textures/environmentMap/px.jpg',
      'textures/environmentMap/nx.jpg',
      'textures/environmentMap/py.jpg',
      'textures/environmentMap/ny.jpg',
      'textures/environmentMap/pz.jpg',
      'textures/environmentMap/nz.jpg'
    ]
  },
  {
    name: 'sintRobot',
    type: 'gltfModel',
    path: './sint/robot2.glb'
  },
  {
    name: 'environmentMap',
    type: 'hdrTexture',
    path: './sint/texture/Atelier_hdr_512.hdr'
  }
];
