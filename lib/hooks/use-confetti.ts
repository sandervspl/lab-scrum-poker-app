import confetti from 'canvas-confetti';

import { randomInRange } from '../room-utils';

export function useConfetti() {
  // Confetti functions
  function launchConfetti() {
    confetti({
      angle: randomInRange(55, 125),
      spread: randomInRange(50, 70),
      particleCount: randomInRange(50, 100),
      origin: { y: 0.6 },
    });
  }

  async function shootConfetti() {
    launchConfetti();
    await new Promise((resolve) => setTimeout(resolve, 300));
    launchConfetti();
    await new Promise((resolve) => setTimeout(resolve, 300));
    launchConfetti();
  }

  return { launchConfetti, shootConfetti };
}
