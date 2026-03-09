import { Injector } from './injector.js';

export type TutorialStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export class Tutorial {
  private currentStep: TutorialStep | null = null;

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

  private skipDayClickCount = 0;

  startStep7(): void {
    this.currentStep = 7;
    this.skipDayClickCount = 0;
    Injector.ui.highlightSkipTimeButton();
  }

  startStep8(): void {
    this.currentStep = 8;
    Injector.ui.showMessagePopup('good luck have fun', () => {
      Injector.ui.hideMessagePopup();
      this.currentStep = null;
    });
  }

  private startNextStep(completedStep: TutorialStep): void {
    if (completedStep === 1) this.startStep2();
    else if (completedStep === 2) this.startStep3();
    else if (completedStep === 3) this.startStep4();
    else if (completedStep === 4) this.startStep5();
    else if (completedStep === 5) this.startStep6();
    else if (completedStep === 6) this.startStep7();
    else if (completedStep === 7) this.startStep8();
  }

  onSkipTimeClicked(): void {
    if (this.currentStep === 7) {
      this.skipDayClickCount++;
      if (this.skipDayClickCount >= 3) {
        Injector.ui.unhighlightSkipTimeButton();
        this.currentStep = null;
        this.startNextStep(7);
      }
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

  onMapClicked(_col: number, _row: number): void {
    if (this.currentStep === 3 || this.currentStep === 6) {
      Injector.ui.unhighlightCell();
      const step = this.currentStep;
      this.currentStep = null;
      this.startNextStep(step!);
    }
  }

  reset(): void {
    this.currentStep = null;
    Injector.ui.unhighlightPlusButton();
    Injector.ui.unhighlightSkipTimeButton();
    Injector.ui.unhighlightPickerTile();
    Injector.ui.unhighlightCell();
    Injector.ui.hideMessagePopup();
  }
}
