import { Game } from './core/game.js';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas #game-canvas not found');

const game = new Game(canvas);

function loop(time: number): void {
  game.update(time);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function onResize(): void {
  game.resize();
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', () => {
  setTimeout(onResize, 100);
});
function scheduleResize(): void {
  requestAnimationFrame(() => {
    onResize();
    requestAnimationFrame(onResize);
  });
}
if (document.readyState === 'complete') {
  scheduleResize();
} else {
  window.addEventListener('load', scheduleResize);
}
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', onResize);
  window.visualViewport.addEventListener('scroll', onResize);
}
