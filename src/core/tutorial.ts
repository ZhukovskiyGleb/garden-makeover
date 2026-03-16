import { Injector } from './injector.js';

export type TutorialStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

const STEP10_TIMER_MS = 60 * 1000;

export class Tutorial {
  private currentStep: TutorialStep | null = null;
  private skipDayClickCount = 0;
  private step10Timer: ReturnType<typeof setTimeout> | null = null;

  getCurrentStep(): TutorialStep | null {
    return this.currentStep;
  }

  isActive(): boolean {
    return this.currentStep !== null;
  }

  start(): void {
    this.startStep1();
  }

  startStep1(): void {
    this.currentStep = 1;
    Injector.ui.highlightPlusButton();
  }

  startStep2(): void {
    this.currentStep = 2;
    Injector.ui.highlightPickerTile('cow');
  }

  startStep3(): void {
    this.currentStep = 3;
    Injector.game.moveCameraToGrid(8, 6);
    Injector.ui.highlightCellAtWorld(Injector.grid.gridToWorld(8, 6));
  }

  startStep4(): void {
    this.currentStep = 4;
    Injector.ui.highlightPlusButton();
  }

  startStep5(): void {
    this.currentStep = 5;
    Injector.ui.highlightPickerTile('corn');
  }

  startStep6(): void {
    this.currentStep = 6;
    Injector.game.moveCameraToGrid(3, 5);
    Injector.ui.highlightCellAtWorld(Injector.grid.gridToWorld(3, 5));
  }

  startStep7(): void {
    this.currentStep = 7;
    this.skipDayClickCount = 0;
    Injector.ui.highlightSkipTimeButton();
  }

  startStep8(): void {
    this.currentStep = 8;
    Injector.game.moveCameraToGrid(7, 1);
    Injector.ui.highlightCellAtWorld(Injector.grid.gridToWorld(7, 1));
  }

  startStep9(): void {
    this.currentStep = 9;
    Injector.ui.showMessagePopup('Earn money by collecting objects, buy new objects and expand your farm!\n Try to earn 100 coins!', () => {
      Injector.ui.hideMessagePopup();
      this.currentStep = null;
      this.startNextStep(9);
    });
  }

  startStep10(): void {
    this.currentStep = 10;
    this.clearStep10Timer();
    this.step10Timer = setTimeout(() => this.completeStep10(), STEP10_TIMER_MS);
  }

  completeStep10(): void {
    if (this.currentStep !== 10) return;
    this.clearStep10Timer();
    this.currentStep = null;
    Injector.ui.showMessagePopup('DOWNLOAD THE GAME');
  }

  private clearStep10Timer(): void {
    if (this.step10Timer) {
      clearTimeout(this.step10Timer);
      this.step10Timer = null;
    }
  }

  private startNextStep(completedStep: TutorialStep): void {
    if (completedStep === 1) this.startStep2();
    else if (completedStep === 2) this.startStep3();
    else if (completedStep === 3) this.startStep4();
    else if (completedStep === 4) this.startStep5();
    else if (completedStep === 5) this.startStep6();
    else if (completedStep === 6) this.startStep7();
    else if (completedStep === 7) this.startStep8();
    else if (completedStep === 8) this.startStep9();
    else if (completedStep === 9) this.startStep10();
  }

  onSkipTimeClicked(): void {
    if (this.currentStep === 7) {
      this.skipDayClickCount++;
    }
  }

  onDayEndPopupOkClicked(): void {
    if (this.currentStep === 7) {
      Injector.ui.unhighlightSkipTimeButton();
      this.currentStep = null;
      this.startNextStep(7);
    }
  }

  onPlusButtonClicked(): void {
    if (this.currentStep === 1 || this.currentStep === 4) {
      Injector.ui.unhighlightPlusButton();
      const step = this.currentStep;
      this.currentStep = null;
      this.startNextStep(step!);
    }
  }

  onObjectSelected(name: string): void {
    if (this.currentStep === 2 && name === 'cow') {
      Injector.ui.unhighlightPickerTile();
      this.currentStep = null;
      this.startNextStep(2);
    } else if (this.currentStep === 5 && name === 'corn') {
      Injector.ui.unhighlightPickerTile();
      this.currentStep = null;
      this.startNextStep(5);
    }
  }

  onObjectPlaced(name: string, _col: number, _row: number): void {
    if (this.currentStep === 3 && name === 'cow') {
      Injector.ui.unhighlightCell();
      this.currentStep = null;
      this.startNextStep(3);
    } else if (this.currentStep === 6 && name === 'corn') {
      Injector.ui.unhighlightCell();
      this.currentStep = null;
      this.startNextStep(6);
    }
  }

  onMapClicked(col: number, row: number): void {
    if (this.currentStep === 8 && col === 7 && row === 1) {
      Injector.ui.unhighlightCell();
      this.currentStep = null;
      this.startNextStep(8);
    }
  }

  reset(): void {
    this.currentStep = null;
    this.clearStep10Timer();
    Injector.ui.unhighlightPlusButton();
    Injector.ui.unhighlightSkipTimeButton();
    Injector.ui.unhighlightPickerTile();
    Injector.ui.unhighlightCell();
    Injector.ui.hideMessagePopup();
  }
}
