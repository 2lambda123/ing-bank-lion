// eslint-disable-next-line max-classes-per-file
import { LitElement, html, css, nothing } from '@lion/core';

/**
 * @typedef {import('../src/LionCombobox.js').LionCombobox} LionCombobox
 */

/**
 * Renders the wrapper containing the textbox that triggers the listbox with filtered options.
 * Optionally, shows 'chips' that indicate the selection.
 * Should be considered an internal/protected web component to be used in conjunction with
 * LionCombobox
 *
 */
export class LionComboboxSelectionDisplay extends LitElement {
  static get properties() {
    return {
      comboboxElement: Object,
      /**
       * Can be used to visually indicate the next
       */
      // TODO: make this index or el
      removeChipOnNextBackspace: Boolean,

      selectedElements: Array,
    };
  }

  static get styles() {
    // TODO: share input-group css?
    return css`
      :host {
        display: flex;
      }
      .combobox__selection {
        flex: none;
      }
      .combobox__input {
        display: block;
      }
      .selection-chip {
        border-radius: 4px;
        background-color: #eee;
        padding: 4px;
        font-size: 10px;
      }
      .selection-chip--highlighted {
        background-color: #ccc;
      }
      ::slotted([slot='_textbox']) {
        outline: none;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: none;
        border-bottom: 1px solid;
      }
    `;
  }

  /**
   * @configure FocusMixin
   */
  get _inputNode() {
    return this.comboboxElement._inputNode;
  }

  _computeSelectedElements() {
    // TODO: checkedElements ...?
    const { formElements, checkedIndex } = /** @type {LionCombobox} */ (this.comboboxElement);
    const checkedIndexes = Array.isArray(checkedIndex) ? checkedIndex : [checkedIndex];
    return formElements.filter((_, i) => checkedIndexes.includes(i));
  }

  get multipleChoice() {
    return this.comboboxElement?.multipleChoice;
  }

  constructor() {
    super();

    /** @type {EventListener} */
    this.__textboxOnKeyup = this.__textboxOnKeyup.bind(this);
    /** @type {EventListener} */
    this.__restoreBackspace = this.__restoreBackspace.bind(this);
  }

  /**
   * @param {import('lit-element').PropertyValues } changedProperties
   */
  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);

    if (this.multipleChoice) {
      this._inputNode.addEventListener('keyup', this.__textboxOnKeyup);
      this._inputNode.addEventListener('focusout', this.__restoreBackspace);
    }
  }

  /**
   * @param {import('lit-element').PropertyValues } changedProperties
   */
  onComboboxElementUpdated(changedProperties) {
    if (changedProperties.has('modelValue')) {
      this.selectedElements = this._computeSelectedElements();
    }
  }

  /**
   * Whenever selectedElements are updated, makes sure that latest added elements
   * are shown latest, and deleted elements respect existing order of chips.
   */
  __reorderChips() {
    const { selectedElements } = this;
    if (this.__prevSelectedEls) {
      const addedEls = selectedElements.filter(e => !this.__prevSelectedEls.includes(e));
      const deletedEls = this.__prevSelectedEls.filter(e => !selectedElements.includes(e));
      if (addedEls.length) {
        this.selectedElements = [...this.__prevSelectedEls, ...addedEls];
      } else if (deletedEls.length) {
        deletedEls.forEach(delEl => {
          this.__prevSelectedEls.splice(this.__prevSelectedEls.indexOf(delEl), 1);
        });
        this.selectedElements = this.__prevSelectedEls;
      }
    }
    this.__prevSelectedEls = this.selectedElements;
  }

  // eslint-disable-next-line class-methods-use-this
  /**
   * @param {import("@lion/listbox").LionOption} option
   * @param {boolean} highlight
   */
  // eslint-disable-next-line class-methods-use-this
  _selectedElementTemplate(option, highlight) {
    return html`
      <span class="selection-chip ${highlight ? 'selection-chip--highlighted' : ''}">
        ${option.value}
      </span>
    `;
  }

  _selectedElementsTemplate() {
    if (!this.multipleChoice) {
      return nothing;
    }
    return html`
      <div class="combobox__selection">
        ${this.selectedElements.map((option, i) => {
          const highlight = Boolean(
            this.removeChipOnNextBackspace && i === this.selectedElements.length - 1,
          );
          return this._selectedElementTemplate(option, highlight);
        })}
      </div>
    `;
  }

  render() {
    return html` ${this._selectedElementsTemplate()} `;
  }

  /**
   * @param {{ key: string; }} ev
   */
  __textboxOnKeyup(ev) {
    // Why we handle here and not in LionComboboxInvoker:
    // All selectedElements state truth should be kept here and should not go back
    // and forth.
    if (ev.key === 'Backspace') {
      if (!this._inputNode.value) {
        if (this.removeChipOnNextBackspace) {
          this.selectedElements[this.selectedElements.length - 1].checked = false;
        }
        this.removeChipOnNextBackspace = true;
      }
    } else {
      this.removeChipOnNextBackspace = false;
    }

    // TODO: move to LionCombobox
    if (ev.key === 'Escape') {
      this._inputNode.value = '';
    }
  }

  __restoreBackspace() {
    this.removeChipOnNextBackspace = false;
  }
}
customElements.define('lion-combobox-selection-display', LionComboboxSelectionDisplay);
