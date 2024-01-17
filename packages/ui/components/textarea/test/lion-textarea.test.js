import { aTimeout, expect, fixture as _fixture } from '@open-wc/testing';
import { html } from 'lit/static-html.js';
import sinon from 'sinon';
import { getFormControlMembers } from '@lion/ui/form-core-test-helpers.js';

import '@lion/ui/define/lion-textarea.js';

/**
 * @typedef {import('../src/LionTextarea.js').LionTextarea} LionTextarea
 * @typedef {import('lit').TemplateResult} TemplateResult
 */

const fixture = /** @type {(arg: TemplateResult|string) => Promise<LionTextarea>} */ (_fixture);

const isFirefox = (() => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.indexOf('firefox') !== -1 && ua.indexOf('safari') === -1 && ua.indexOf('chrome') === -1;
})();

function hasBrowserResizeSupport() {
  const textarea = document.createElement('textarea');
  return textarea.style.resize !== undefined;
}

describe('<lion-textarea>', () => {
  it(`can be used with the following declaration
  ~~~
  <lion-textarea></lion-textarea>
  ~~~`, async () => {
    const el = await fixture(`<lion-textarea></lion-textarea>`);
    expect(el.querySelector('textarea')?.nodeName).to.equal('TEXTAREA');
  });

  it('has .rows=2 and .maxRows=6', async () => {
    const el = await fixture(`<lion-textarea></lion-textarea>`);
    expect(el.rows).to.equal(2);
    expect(el.maxRows).to.equal(6);
  });

  it('has .readOnly=false .rows=2 and rows="2" by default', async () => {
    const el = await fixture(`<lion-textarea>foo</lion-textarea>`);
    const { _inputNode } = getFormControlMembers(el);

    expect(el.rows).to.equal(2);
    expect(el.getAttribute('rows')).to.be.equal('2');
    // @ts-ignore
    expect(_inputNode.rows).to.equal(2);
    expect(_inputNode.getAttribute('rows')).to.be.equal('2');
    expect(el.readOnly).to.be.false;
    expect(_inputNode.hasAttribute('readonly')).to.be.false;
  });

  it('sync rows down to the native textarea', async () => {
    const el = await fixture(`<lion-textarea rows="8">foo</lion-textarea>`);
    const { _inputNode } = getFormControlMembers(el);
    expect(el.rows).to.equal(8);
    expect(el.getAttribute('rows')).to.be.equal('8');
    // @ts-ignore
    expect(_inputNode.rows).to.equal(8);
    expect(_inputNode.getAttribute('rows')).to.be.equal('8');
  });

  it('sync readOnly to the native textarea', async () => {
    const el = await fixture(`<lion-textarea readonly>foo</lion-textarea>`);
    expect(el.readOnly).to.be.true;
    expect(el.querySelector('textarea')?.readOnly).to.be.true;
  });

  it('disables user resize behavior', async () => {
    if (!hasBrowserResizeSupport()) {
      return;
    }

    const el = await fixture(`<lion-textarea></lion-textarea>`);
    const { _inputNode } = getFormControlMembers(el);
    const computedStyle = window.getComputedStyle(_inputNode);
    expect(computedStyle.resize).to.equal('none');
  });

  it('supports initial modelValue', async () => {
    const el = await fixture(
      html`<lion-textarea .modelValue="${'From value attribute'}"></lion-textarea>`,
    );
    expect(el.querySelector('textarea')?.value).to.equal('From value attribute');
  });

  it('adjusts height based on content', async () => {
    const el = await fixture(`<lion-textarea></lion-textarea>`);
    const initialHeight = el.offsetHeight;
    el.modelValue = 'batman\nand\nrobin\nand\ncatwoman';
    await el.updateComplete;
    const hightWith5TextLines = el.offsetHeight;
    expect(hightWith5TextLines > initialHeight).to.equal(true);

    el.modelValue = 'batman';
    await el.updateComplete;
    const hightWith1Line = el.offsetHeight;
    expect(hightWith1Line < hightWith5TextLines).to.equal(true);
  });

  // To be fixed in  https://dev.azure.com/INGCDaaS/IngOne/_workitems/edit/4096171
  it.skip(`starts growing when content is bigger than "rows"
    'and stops growing after property "maxRows" is reached`, async () => {
    const el = await fixture(`<lion-textarea></lion-textarea>`);
    return [1, 2, 3, 4, 5, 6, 7, 8].reduce(async (heightPromise, i) => {
      const oldHeight = await heightPromise;
      el.modelValue += '\n';
      await el.updateComplete;
      const newHeight = el.offsetHeight;

      if (i > el.maxRows) {
        // stop growing
        expect(newHeight).to.equal(oldHeight);
      } else if (i > el.rows) {
        // growing normally
        expect(newHeight >= oldHeight).to.equal(true);
      }

      return Promise.resolve(newHeight);
    }, Promise.resolve(0));
  });

  // TODO: make test simpler => no reduce please (also update autosize npm dependency to latest version)
  // To be fixed in  https://dev.azure.com/INGCDaaS/IngOne/_workitems/edit/4096171
  it.skip('stops growing after property "maxRows" is reached when there was an initial value', async () => {
    const el = await fixture(html`<lion-textarea .modelValue="${'1\n2\n3'}"></lion-textarea>`);

    return [4, 5, 6, 7, 8].reduce(async (heightPromise, i) => {
      const oldHeight = await heightPromise;
      el.modelValue += `\n`;
      await el.updateComplete;
      const newHeight = el.offsetHeight;

      if (i > el.maxRows) {
        // stop growing
        // TODO: fails on Firefox => fix it
        if (!isFirefox) {
          expect(newHeight).to.equal(oldHeight);
        }
      } else if (i > el.rows) {
        // growing normally
        expect(newHeight >= oldHeight).to.equal(true);
      }

      return Promise.resolve(newHeight);
    }, Promise.resolve(0));
  });

  it('stops shrinking after property "rows" is reached', async () => {
    const el = await fixture(html`<lion-textarea rows="1" max-rows="3"></lion-textarea>`);
    expect(el.scrollHeight).to.be.equal(el.clientHeight);
    const oneRowHeight = el.clientHeight;

    el.rows = 3;
    el.resizeTextarea();
    await el.updateComplete;
    expect(oneRowHeight).to.be.below(el.clientHeight).and.to.be.below(el.scrollHeight);
  });

  it('has an attribute that can be used to set the placeholder text of the textarea', async () => {
    const el = await fixture(`<lion-textarea placeholder="text"></lion-textarea>`);
    const { _inputNode } = getFormControlMembers(el);
    expect(el.getAttribute('placeholder')).to.equal('text');
    expect(_inputNode.getAttribute('placeholder')).to.equal('text');

    el.placeholder = 'foo';
    await el.updateComplete;
    expect(el.getAttribute('placeholder')).to.equal('foo');
    expect(_inputNode.getAttribute('placeholder')).to.equal('foo');
  });

  it('fires resize textarea when a visibility change has been detected', async () => {
    const el = await fixture(`
      <div style="display: none">
        <lion-textarea placeholder="text"></lion-textarea>
      </div>
    `);
    const textArea = /** @type {LionTextarea} */ (el.firstElementChild);
    await textArea.updateComplete;

    const resizeSpy = sinon.spy(textArea, 'resizeTextarea');
    el.style.display = 'block';
    await aTimeout(20);
    expect(resizeSpy.calledOnce).to.be.true;
  });

  it('is accessible', async () => {
    const el = await fixture(`<lion-textarea label="Label"></lion-textarea>`);
    await expect(el).to.be.accessible();
  });

  it('is accessible when disabled', async () => {
    const el = await fixture(`<lion-textarea label="Label" disabled></lion-textarea>`);
    await expect(el).to.be.accessible();
  });
});
