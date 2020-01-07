import { css, html, LitElement, render } from '@lion/core';

/** @typedef {import('lit-html').TemplateResult} TemplateResult */

export class SbActionLogger extends LitElement {
  static get properties() {
    return {
      title: { type: String, reflect: true },
      __logCounter: { type: Number },
    };
  }

  static get styles() {
    return css`
      :host {
        --sb-action-logger-title-color: black;
        --sb-action-logger-text-color: black;
        --sb-action-logger-cue-color-primary: #3f51b5;
        --sb-action-logger-cue-color-secondary: #c5cae9;
        --sb-action-logger-cue-duration: 1000ms;

        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        display: block;
      }

      .header__info {
        color: var(--sb-action-logger-title-color);
        display: flex;
        align-items: center;
        padding: 16px;
        font-size: 16px;
      }

      .header__clear {
        margin-left: 16px;
        border-radius: 0px;
        background-color: rgba(0, 0, 0, 0.05);
        border: none;
        cursor: pointer;
        padding: 8px;
      }

      .header__clear:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }

      .header__title {
        margin: 0;
        font-weight: bold;
        flex-grow: 1;
      }

      .header__log-cue {
        position: relative;
        height: 3px;
        background-color: var(--sb-action-logger-cue-color-secondary);
        overflow: hidden;
      }

      .header__log-cue-overlay {
        position: absolute;
        height: 3px;
        width: 50px;
        left: -50px;
        background-color: var(--sb-action-logger-cue-color-primary);
      }

      .header__log-cue-overlay--slide {
        animation: slidethrough var(--sb-action-logger-cue-duration) ease-in;
      }

      @keyframes slidethrough {
        from {
          left: -50px;
          width: 50px;
        }

        to {
          left: 100%;
          width: 500px;
        }
      }

      .logger {
        overflow-y: auto;
        max-height: 110px;
      }

      .logger__log {
        padding: 16px;
      }

      .logger__log:not(:last-child) {
        border-bottom: 1px solid lightgrey;
      }

      .logger__log code {
        color: var(--sb-action-logger-text-color);
        white-space: pre-wrap; /* css-3 */
        white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
        white-space: -pre-wrap; /* Opera 4-6 */
        white-space: -o-pre-wrap; /* Opera 7 */
        word-wrap: break-word; /* Internet Explorer 5.5+ */
      }
    `;
  }

  constructor() {
    super();
    this.title = 'Action Logger';
    this.__logCounter = 0;
  }

  /**
   * Renders the passed content as a node, and appends it to the logger
   * Only supports simple values, will be interpreted to a String
   * E.g. an Object will become '[object Object]'
   *
   * @param {} content Content to be logged to the action logger
   */
  log(content) {
    const loggerEl = this.shadowRoot.querySelector('.logger');
    const offlineRenderContainer = document.createElement('div');
    render(this._logTemplate(content), offlineRenderContainer);
    // TODO: Feature, combine duplicate consecutive logs as 1 dom element and add a counter for dupes
    loggerEl.appendChild(offlineRenderContainer.firstElementChild);
    this.__logCounter += 1;
    this.__animateCue();
    loggerEl.scrollTo({ top: loggerEl.scrollHeight, behavior: 'smooth' });
  }

  /**
   * Protected getter that returns the template of a single log
   *
   * @return {TemplateResult} TemplateResult that uses the content passed to create a log
   */
  // eslint-disable-next-line class-methods-use-this
  _logTemplate(content) {
    return html`
      <div class="logger__log">
        <code>${content}</code>
      </div>
    `;
  }

  __animateCue() {
    const cueEl = this.shadowRoot.querySelector('.header__log-cue-overlay');
    cueEl.classList.remove('header__log-cue-overlay--slide');
    // This triggers browser to stop batching changes because it has to evaluate something.
    // eslint-disable-next-line no-void
    void this.offsetWidth;
    // So that when we arrive here, the browser sees this adding as an actual 'change'
    // and this means the animation gets refired.
    cueEl.classList.add('header__log-cue-overlay--slide');
  }

  __clearLogs() {
    const loggerEl = this.shadowRoot.querySelector('.logger');
    loggerEl.innerHTML = '';
    this.__logCounter = 0;
  }

  render() {
    return html`
      <div class="header">
        <div class="header__info">
          <p class="header__title">${this.title}</p>
          <div class="header__counter">${this.__logCounter}</div>
          <button class="header__clear" @click=${this.__clearLogs}>Clear</button>
        </div>
        <div class="header__log-cue">
          <div class="header__log-cue-overlay"></div>
        </div>
      </div>
      <div class="logger"></div>
    `;
  }
}
