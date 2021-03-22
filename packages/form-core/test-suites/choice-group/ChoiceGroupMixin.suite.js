import { LitElement } from '@lion/core';
import { LionInput } from '@lion/input';
import sinon from 'sinon';
import '@lion/fieldset/define';
import { FormGroupMixin, Required } from '@lion/form-core';
import { expect, html, fixture, unsafeStatic } from '@open-wc/testing';
import { ChoiceGroupMixin } from '../../src/choice-group/ChoiceGroupMixin.js';
import { ChoiceInputMixin } from '../../src/choice-group/ChoiceInputMixin.js';

class ChoiceInputFoo extends ChoiceInputMixin(LionInput) {}
customElements.define('choice-input-foo', ChoiceInputFoo);
class ChoiceInputBar extends ChoiceInputMixin(LionInput) {
  _syncNameToParentFormGroup() {
    // Always sync, without conditions
    // @ts-expect-error
    this.name = this._parentFormGroup.name;
  }
}
customElements.define('choice-input-bar', ChoiceInputBar);
class ChoiceInput extends ChoiceInputMixin(LionInput) {}
customElements.define('choice-input', ChoiceInput);
class ChoiceInputGroup extends ChoiceGroupMixin(FormGroupMixin(LitElement)) {}
customElements.define('choice-input-group', ChoiceInputGroup);

/**
 * @param {{ parentTagString?:string, childTagString?: string, choiceType?: string}} [config]
 */
export function runChoiceGroupMixinSuite({ parentTagString, childTagString, choiceType } = {}) {
  const cfg = {
    parentTagString: parentTagString || 'choice-input-group',
    childTagString: childTagString || 'choice-input',
    childTagStringFoo: 'choice-input-foo',
    childTagStringBar: 'choice-input-bar',
    choiceType: choiceType || 'single',
  };

  const parentTag = unsafeStatic(cfg.parentTagString);
  const childTag = unsafeStatic(cfg.childTagString);
  const childTagFoo = unsafeStatic(cfg.childTagStringFoo);
  const childTagBar = unsafeStatic(cfg.childTagStringBar);

  describe(`ChoiceGroupMixin: ${cfg.parentTagString}`, () => {
    if (cfg.choiceType === 'single') {
      it('has a single modelValue representing the currently checked radio value', async () => {
        const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
          <${parentTag} name="gender[]">
            <${childTag} .choiceValue=${'male'}></${childTag}>
            <${childTag} .choiceValue=${'female'} checked></${childTag}>
            <${childTag} .choiceValue=${'other'}></${childTag}>
          </${parentTag}>
        `));
        expect(el.modelValue).to.equal('female');
        el.formElements[0].checked = true;
        expect(el.modelValue).to.equal('male');
        el.formElements[2].checked = true;
        expect(el.modelValue).to.equal('other');
      });

      it('has a single formattedValue representing the currently checked radio value', async () => {
        const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
          <${parentTag} name="gender">
            <${childTag} .choiceValue=${'male'}></${childTag}>
            <${childTag} .choiceValue=${'female'} checked></${childTag}>
            <${childTag} .choiceValue=${'other'}></${childTag}>
          </${parentTag}>
        `));
        expect(el.formattedValue).to.equal('female');
        el.formElements[0].checked = true;
        expect(el.formattedValue).to.equal('male');
        el.formElements[2].checked = true;
        expect(el.formattedValue).to.equal('other');
      });
    }

    it('throws if a child element without a modelValue like { value: "foo", checked: false } tries to register', async () => {
      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag} name="gender[]">
          <${childTag} .choiceValue=${'male'}></${childTag}>
          <${childTag} .choiceValue=${'female'} checked></${childTag}>
          <${childTag} .choiceValue=${'other'}></${childTag}>
        </${parentTag}>
      `));
      const invalidChild = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${childTag} .modelValue=${'Lara'}></${childTag}>
      `));

      expect(() => {
        el.addFormElement(invalidChild);
      }).to.throw(
        `The ${cfg.parentTagString} name="gender[]" does not allow to register ${cfg.childTagString} with .modelValue="Lara" - The modelValue should represent an Object { value: "foo", checked: false }`,
      );
    });

    it('automatically sets the name property of child fields to its own name', async () => {
      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag} name="gender[]">
          <${childTag} .choiceValue=${'female'} checked></${childTag}>
          <${childTag} .choiceValue=${'other'}></${childTag}>
        </${parentTag}>
      `));

      expect(el.formElements[0].name).to.equal('gender[]');
      expect(el.formElements[1].name).to.equal('gender[]');

      const validChild = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${childTag} .choiceValue=${'male'}></${childTag}>
      `));
      el.appendChild(validChild);

      expect(el.formElements[2].name).to.equal('gender[]');
    });

    it('automatically updates the name property of child fields to its own name', async () => {
      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag} name="gender[]">
          <${childTag}></${childTag}>
          <${childTag}></${childTag}>
        </${parentTag}>
      `));

      expect(el.formElements[0].name).to.equal('gender[]');
      expect(el.formElements[1].name).to.equal('gender[]');

      el.name = 'gender2[]';

      await el.updateComplete;

      expect(el.formElements[0].name).to.equal('gender2[]');
      expect(el.formElements[1].name).to.equal('gender2[]');
    });

    it('prevents updating the name property of a child if it is different from its parent', async () => {
      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag} name="gender[]">
          <${childTag}></${childTag}>
          <${childTag}></${childTag}>
        </${parentTag}>
      `));

      expect(el.formElements[0].name).to.equal('gender[]');
      expect(el.formElements[1].name).to.equal('gender[]');

      el.formElements[0].name = 'gender2[]';

      await el.formElements[0].updateComplete;
      expect(el.formElements[0].name).to.equal('gender[]');
    });

    it('allows updating the name property of a child if parent tagName does not include childTagname', async () => {
      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag} name="gender[]">
          <${childTagFoo}></${childTagFoo}>
          <${childTagFoo}></${childTagFoo}>
        </${parentTag}>
      `));

      expect(el.formElements[0].name).to.equal('gender[]');
      expect(el.formElements[1].name).to.equal('gender[]');

      el.formElements[0].name = 'gender2[]';

      await el.formElements[0].updateComplete;
      expect(el.formElements[0].name).to.equal('gender2[]');
    });

    it('allows setting the condition for syncing the name property of a child to parent', async () => {
      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag} name="gender[]">
          <${childTagBar}></${childTagBar}>
          <${childTagBar}></${childTagBar}>
        </${parentTag}>
      `));

      expect(el.formElements[0].name).to.equal('gender[]');
      expect(el.formElements[1].name).to.equal('gender[]');

      el.formElements[0].name = 'gender2[]';

      await el.formElements[0].updateComplete;
      expect(el.formElements[0].name).to.equal('gender[]');
    });

    it('adjusts the name of a child element if it has a different name than the group', async () => {
      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag} name="gender[]">
          <${childTag} .choiceValue=${'female'} checked></${childTag}>
          <${childTag} .choiceValue=${'other'}></${childTag}>
        </${parentTag}>
      `));

      const invalidChild = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${childTag} name="foo" .choiceValue=${'male'}></${childTag}>
      `));
      el.addFormElement(invalidChild);
      await invalidChild.updateComplete;
      expect(invalidChild.name).to.equal('gender[]');
    });

    it('can set initial modelValue on creation', async () => {
      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag} name="gender[]" .modelValue=${'other'}>
          <${childTag} .choiceValue=${'male'}></${childTag}>
          <${childTag} .choiceValue=${'female'}></${childTag}>
          <${childTag} .choiceValue=${'other'}></${childTag}>
        </${parentTag}>
      `));

      if (cfg.choiceType === 'single') {
        expect(el.modelValue).to.equal('other');
      } else {
        expect(el.modelValue).to.deep.equal(['other']);
      }
      expect(el.formElements[2].checked).to.be.true;
    });

    it('can set initial serializedValue on creation', async () => {
      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag} name="gender[]" .serializedValue=${'other'}>
          <${childTag} .choiceValue=${'male'}></${childTag}>
          <${childTag} .choiceValue=${'female'}></${childTag}>
          <${childTag} .choiceValue=${'other'}></${childTag}>
        </${parentTag}>
      `));

      if (cfg.choiceType === 'single') {
        expect(el.serializedValue).to.equal('other');
      } else {
        expect(el.serializedValue).to.deep.equal(['other']);
      }
      expect(el.formElements[2].checked).to.be.true;
    });

    it('can set initial formattedValue on creation', async () => {
      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag} name="gender[]" .formattedValue=${'other'}>
          <${childTag} .choiceValue=${'male'}></${childTag}>
          <${childTag} .choiceValue=${'female'}></${childTag}>
          <${childTag} .choiceValue=${'other'}></${childTag}>
        </${parentTag}>
      `));

      if (cfg.choiceType === 'single') {
        expect(el.formattedValue).to.equal('other');
      } else {
        expect(el.formattedValue).to.deep.equal(['other']);
      }
      expect(el.formElements[2].checked).to.be.true;
    });

    it('can handle complex data via choiceValue', async () => {
      const date = new Date(2018, 11, 24, 10, 33, 30, 0);

      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag} name="data[]">
          <${childTag} .choiceValue=${{ some: 'data' }}></${childTag}>
          <${childTag} .choiceValue=${date} checked></${childTag}>
        </${parentTag}>
      `));

      if (cfg.choiceType === 'single') {
        expect(el.modelValue).to.equal(date);
        el.formElements[0].checked = true;
        expect(el.modelValue).to.deep.equal({ some: 'data' });
      } else {
        expect(el.modelValue).to.deep.equal([date]);
        el.formElements[0].checked = true;
        expect(el.modelValue).to.deep.equal([{ some: 'data' }, date]);
      }
    });

    it('can handle 0 and empty string as valid values', async () => {
      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag} name="data[]">
          <${childTag} .choiceValue=${0} checked></${childTag}>
          <${childTag} .choiceValue=${''}></${childTag}>
        </${parentTag}>
      `));

      if (cfg.choiceType === 'single') {
        expect(el.modelValue).to.equal(0);
        el.formElements[1].checked = true;
        expect(el.modelValue).to.equal('');
      } else {
        expect(el.modelValue).to.deep.equal([0]);
        el.formElements[1].checked = true;
        expect(el.modelValue).to.deep.equal([0, '']);
      }
    });

    it('can check a choice by supplying an available modelValue', async () => {
      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag} name="gender[]">
          <${childTag}
            .modelValue="${{ value: 'male', checked: false }}"
          ></${childTag}>
          <${childTag}
            .modelValue="${{ value: 'female', checked: true }}"
          ></${childTag}>
          <${childTag}
            .modelValue="${{ value: 'other', checked: false }}"
          ></${childTag}>
        </${parentTag}>
      `));

      if (cfg.choiceType === 'single') {
        expect(el.modelValue).to.equal('female');
      } else {
        expect(el.modelValue).to.deep.equal(['female']);
      }
      el.modelValue = 'other';
      expect(el.formElements[2].checked).to.be.true;
    });

    it('can check a choice by supplying an available modelValue even if this modelValue is an array or object', async () => {
      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag} name="gender[]">
          <${childTag}
            .modelValue="${{ value: { v: 'male' }, checked: false }}"
          ></${childTag}>
          <${childTag}
            .modelValue="${{ value: { v: 'female' }, checked: true }}"
          ></${childTag}>
          <${childTag}
            .modelValue="${{ value: { v: 'other' }, checked: false }}"
          ></${childTag}>
        </${parentTag}>
      `));

      if (cfg.choiceType === 'single') {
        expect(el.modelValue).to.eql({ v: 'female' });
      } else {
        expect(el.modelValue).to.deep.equal([{ v: 'female' }]);
      }

      if (cfg.choiceType === 'single') {
        el.modelValue = { v: 'other' };
      } else {
        el.modelValue = [{ v: 'other' }];
      }
      expect(el.formElements[2].checked).to.be.true;
    });

    it('expect child nodes to only fire one model-value-changed event per instance', async () => {
      let counter = 0;
      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag}
          name="gender[]"
          @model-value-changed=${() => {
            counter += 1;
          }}
        >
          <${childTag} .choiceValue=${'male'}></${childTag}>
          <${childTag}
            .modelValue=${{ value: 'female', checked: true }}
          ></${childTag}>
          <${childTag} .choiceValue=${'other'}></${childTag}>
        </${parentTag}>
      `));

      counter = 0; // reset after setup which may result in different results

      el.formElements[0].checked = true;
      expect(counter).to.equal(1); // male becomes checked

      // not changed values trigger no event
      el.formElements[0].checked = true;
      expect(counter).to.equal(1);

      el.formElements[2].checked = true;
      expect(counter).to.equal(2); // other becomes checked

      if (cfg.choiceType === 'single') {
        // not found values trigger no event
        el.modelValue = 'foo';
        expect(counter).to.equal(2);

        el.modelValue = 'male';
        expect(counter).to.equal(3); // male becomes checked, other becomes unchecked
      }

      if (choiceType === 'multiple') {
        // not found values trigger no event
        el.modelValue = ['foo', 'male', 'female', 'other'];
        expect(counter).to.equal(2);

        el.modelValue = ['female', 'other'];
        expect(counter).to.equal(3); // male becomes unchecked
      }
    });

    it('can be required', async () => {
      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag} name="gender[]" .validators=${[new Required()]}>
          <${childTag} .choiceValue=${'male'}></${childTag}>
          <${childTag}
            .choiceValue=${{ subObject: 'satisfies required' }}
          ></${childTag}>
        </${parentTag}>
      `));
      expect(el.hasFeedbackFor).to.include('error');
      expect(el.validationStates.error).to.exist;
      expect(el.validationStates.error.Required).to.exist;

      el.formElements[0].checked = true;
      expect(el.hasFeedbackFor).not.to.include('error');
      expect(el.validationStates.error).to.exist;
      expect(el.validationStates.error.Required).to.not.exist;

      el.formElements[1].checked = true;
      expect(el.hasFeedbackFor).not.to.include('error');
      expect(el.validationStates.error).to.exist;
      expect(el.validationStates.error.Required).to.not.exist;
    });

    it('returns serialized value', async () => {
      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag} name="gender[]">
          <${childTag} .choiceValue=${'male'}></${childTag}>
          <${childTag} .choiceValue=${'female'}></${childTag}>
        </${parentTag}>
      `));
      el.formElements[0].checked = true;
      if (cfg.choiceType === 'single') {
        expect(el.serializedValue).to.deep.equal('male');
      } else {
        expect(el.serializedValue).to.deep.equal(['male']);
      }
    });

    it('returns serialized value on unchecked state', async () => {
      const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
        <${parentTag} name="gender[]">
          <${childTag} .choiceValue=${'male'}></${childTag}>
          <${childTag} .choiceValue=${'female'}></${childTag}>
        </${parentTag}>
      `));

      if (cfg.choiceType === 'single') {
        expect(el.serializedValue).to.deep.equal('');
      } else {
        expect(el.serializedValue).to.deep.equal([]);
      }
    });

    describe('serializers', () => {
      it('should call the serializer provided by user', async () => {
        const serializerSpy = sinon.spy(() => `foo`);

        const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
          <${parentTag} name="gender[]" .serializer=${serializerSpy}>
            <${childTag} .choiceValue=${'male'}></${childTag}>
            <${childTag} .choiceValue=${'female'}></${childTag}>
          </${parentTag}>
        `));

        await el.updateComplete;
        el.formElements[0].checked = true;
        expect(el.serializedValue).to.equal('foo');
        expect(serializerSpy.called).to.equal(true);
      });
    });

    describe('multipleChoice', () => {
      it('has a single modelValue representing all currently checked values', async () => {
        const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
          <${parentTag} multiple-choice name="gender[]">
            <${childTag} .choiceValue=${'male'}></${childTag}>
            <${childTag} .choiceValue=${'female'} checked></${childTag}>
            <${childTag} .choiceValue=${'other'}></${childTag}>
          </${parentTag}>
        `));

        expect(el.modelValue).to.eql(['female']);
        el.formElements[0].checked = true;
        expect(el.modelValue).to.eql(['male', 'female']);
        el.formElements[2].checked = true;
        expect(el.modelValue).to.eql(['male', 'female', 'other']);
      });

      it('has a single serializedValue representing all currently checked values', async () => {
        const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
          <${parentTag} multiple-choice name="gender[]">
            <${childTag} .choiceValue=${'male'}></${childTag}>
            <${childTag} .choiceValue=${'female'} checked></${childTag}>
            <${childTag} .choiceValue=${'other'}></${childTag}>
          </${parentTag}>
        `));

        expect(el.serializedValue).to.eql(['female']);
        el.formElements[0].checked = true;
        expect(el.serializedValue).to.eql(['male', 'female']);
        el.formElements[2].checked = true;
        expect(el.serializedValue).to.eql(['male', 'female', 'other']);
      });

      it('has a single formattedValue representing all currently checked values', async () => {
        const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
          <${parentTag} multiple-choice name="gender[]">
            <${childTag} .choiceValue=${'male'}></${childTag}>
            <${childTag} .choiceValue=${'female'} checked></${childTag}>
            <${childTag} .choiceValue=${'other'}></${childTag}>
          </${parentTag}>
        `));

        expect(el.formattedValue).to.eql(['female']);
        el.formElements[0].checked = true;
        expect(el.formattedValue).to.eql(['male', 'female']);
        el.formElements[2].checked = true;
        expect(el.formattedValue).to.eql(['male', 'female', 'other']);
      });

      it('can check multiple checkboxes by setting the modelValue', async () => {
        const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
          <${parentTag} multiple-choice name="gender[]">
            <${childTag} .choiceValue=${'male'}></${childTag}>
            <${childTag} .choiceValue=${'female'}></${childTag}>
            <${childTag} .choiceValue=${'other'}></${childTag}>
          </${parentTag}>
        `));

        el.modelValue = ['male', 'other'];
        expect(el.modelValue).to.eql(['male', 'other']);
        expect(el.formElements[0].checked).to.be.true;
        expect(el.formElements[2].checked).to.be.true;
      });

      it('unchecks non-matching checkboxes when setting the modelValue', async () => {
        const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
          <${parentTag} multiple-choice name="gender[]">
            <${childTag} .choiceValue=${'male'} checked></${childTag}>
            <${childTag} .choiceValue=${'female'}></${childTag}>
            <${childTag} .choiceValue=${'other'} checked></${childTag}>
          </${parentTag}>
        `));

        expect(el.modelValue).to.eql(['male', 'other']);
        expect(el.formElements[0].checked).to.be.true;
        expect(el.formElements[2].checked).to.be.true;

        el.modelValue = ['female'];
        expect(el.formElements[0].checked).to.be.false;
        expect(el.formElements[1].checked).to.be.true;
        expect(el.formElements[2].checked).to.be.false;
      });
    });

    describe('Integration with a parent form/fieldset', () => {
      it('will serialize all children with their serializedValue', async () => {
        const el = /** @type {ChoiceInputGroup} */ (await fixture(html`
          <lion-fieldset>
            <${parentTag} name="gender[]">
              <${childTag} .choiceValue=${'male'} checked disabled></${childTag}>
              <${childTag} .choiceValue=${'female'} checked></${childTag}>
              <${childTag} .choiceValue=${'other'}></${childTag}>
            </${parentTag}>
          </lion-fieldset>
        `));

        if (cfg.choiceType === 'single') {
          expect(el.serializedValue).to.deep.equal({ 'gender[]': ['female'] });
        } else {
          expect(el.serializedValue).to.deep.equal({ 'gender[]': [['female']] });
        }
      });
    });
  });
}
