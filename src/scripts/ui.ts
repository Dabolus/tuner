import { Locale, WorkerResponse } from './utils';

// Workaround because otherwise TypeScript
// will use setTimeout from @types/node that is
// slightly different from browsers implementation
declare function setTimeout(
  callback: (...args: any[]) => void,
  ms: number,
): number;

export class UI {
  public ready: Promise<void>;
  private supportedLanguages = ['en', 'it'];
  private dialects = {
    english: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    romance: [
      'Do',
      'Do#',
      'Re',
      'Re#',
      'Mi',
      'Fa',
      'Fa#',
      'Sol',
      'Sol#',
      'La',
      'La#',
      'Si',
    ],
  };
  private loading: HTMLDivElement = document.querySelector('#loading');
  private infoMessage: HTMLHeadingElement = document.querySelector(
    '#info-message',
  );
  private equalizerLoader: HTMLDivElement = document.querySelector(
    '#equalizer-loader',
  );
  private frequency: HTMLHeadingElement = document.querySelector('#frequency');
  private note: HTMLHeadingElement = document.querySelector('#note');
  private needle: SVGElement = document.querySelector('#needle');
  private start: HTMLButtonElement = document.querySelector('#start');
  private localeStrings: Locale;
  private currentShownAction?: HTMLElement = this.equalizerLoader;
  private startListener: EventListener;
  private resetTimeout: number;
  [key: string]: any;

  constructor() {
    const userLang = navigator.language.substring(0, 2);
    this.ready = import(`./locales/${
      this.supportedLanguages.includes(userLang) ? userLang : 'en'
    }`).then(module => (this.localeStrings = module.default));
  }

  public onStart(fn: EventListener) {
    this.start.removeEventListener('click', this.startListener);
    this.startListener = fn;
    this.start.addEventListener('click', this.startListener);
  }

  public async localize(key: string, ...params: any[]) {
    await this.ready;
    return typeof this.localeStrings[key] === 'function'
      ? this.localeStrings[key](params)
      : this.localeStrings[key];
  }

  public async setLoadingMessage(
    messageKey = 'loading',
    ...messageParams: any[]
  ) {
    this.infoMessage.textContent = await this.localize(
      messageKey,
      messageParams,
    );
  }

  public async showLoading(
    action: string | false = 'equalizerLoader',
    messageKey = 'loading',
    ...messageParams: any[]
  ) {
    if (
      this.currentShownAction &&
      action &&
      this.currentShownAction !== this[action]
    ) {
      this.currentShownAction.hidden = true;
    }
    if (action) {
      this[action].hidden = false;
    }
    this.currentShownAction = action ? this[action] : undefined;
    await this.setLoadingMessage(messageKey, messageParams);
    this.loading.classList.remove('hidden');
  }

  public hideLoading() {
    this.loading.classList.add('hidden');
  }

  public updateFrequency(data: WorkerResponse) {
    if (!data) {
      if (this.resetTimeout) {
        return;
      }
      this.resetTimeout = setTimeout(() => {
        this.frequency.textContent = '---.- Hz';
        this.note.textContent = '--';
        this.needle.style.transform = 'rotateZ(50deg)';
        this.resetTimeout = 0;
      }, 3000);
    } else {
      if (this.resetTimeout) {
        clearTimeout(this.resetTimeout);
        this.resetTimeout = 0;
      }
      this.frequency.textContent = `${data.frequency
        .toFixed(1)
        .padStart(5, ' ')} Hz`;
      this.note.textContent = `${this.dialects.english[data.index]}`;
      this.needle.style.transform = `rotateZ(${data.centsAngle}deg)`;
    }
  }
}
