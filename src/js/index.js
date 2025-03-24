import '../css/global.css';
import '../scss/global.scss';
import initMouseMove from './mouseMove';

import Three from './experience';

document.addEventListener('DOMContentLoaded', () => {
  initMouseMove();
});

window.addEventListener('load', () => {
  const canvas = document.querySelector('#canvas');

  if (canvas) {
    new Three(document.querySelector('#canvas'));
  }
});
