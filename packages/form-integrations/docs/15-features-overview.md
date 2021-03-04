[//]: # 'AUTO INSERT HEADER PREPUBLISH'

# Features Overview

This is a meta package to show interaction between various form elements.
For usage and installation please see the appropriate packages.

```js script
import { html } from '@lion/core';
import '@lion/button/define';
import '@lion/checkbox-group/define';
import '@lion/combobox/define';
import '@lion/fieldset/define';
import '@lion/form/define';
import '@lion/input-amount/define';
import '@lion/input-date/define';
import '@lion/input-datepicker/define';
import '@lion/input-email/define';
import '@lion/input-iban/define';
import '@lion/input-range/define';
import '@lion/input-stepper/define';
import '@lion/input/define';
import '@lion/listbox/define';
import '@lion/radio-group/define';
import '@lion/select/define';
import '@lion/select-rich/define';
import '@lion/switch/define';
import '@lion/textarea/define';
import { MinLength, Required } from '@lion/form-core';
import { loadDefaultFeedbackMessages } from '@lion/validate-messages';

loadDefaultFeedbackMessages();

export default {
  title: 'Forms/Features Overview',
};
```

## Umbrella Form

```js story
export const main = () => {
  Required.getMessage = () => 'Please enter a value';
  return html`
    <lion-form>
      <form>
        <lion-fieldset name="full_name">
          <lion-input
            name="first_name"
            label="First Name"
            .validators="${[new Required()]}"
          ></lion-input>
          <lion-input
            name="last_name"
            label="Last Name"
            .validators="${[new Required()]}"
          ></lion-input>
        </lion-fieldset>
        <lion-input-date
          name="date"
          label="Date of application"
          .modelValue="${new Date('2000-12-12')}"
          .validators="${[new Required()]}"
        ></lion-input-date>
        <lion-input-datepicker
          name="datepicker"
          label="Date to be picked"
          .modelValue="${new Date('2020-12-12')}"
          .validators="${[new Required()]}"
        ></lion-input-datepicker>
        <lion-textarea
          name="bio"
          label="Biography"
          .validators="${[new Required(), new MinLength(10)]}"
          help-text="Please enter at least 10 characters"
        ></lion-textarea>
        <lion-input-amount name="money" label="Money"></lion-input-amount>
        <lion-input-iban name="iban" label="Iban"></lion-input-iban>
        <lion-input-email name="email" label="Email"></lion-input-email>
        <lion-checkbox-group
          label="What do you like?"
          name="checkers"
          .validators="${[new Required()]}"
        >
          <lion-checkbox .choiceValue=${'foo'} label="I like foo"></lion-checkbox>
          <lion-checkbox .choiceValue=${'bar'} label="I like bar"></lion-checkbox>
          <lion-checkbox .choiceValue=${'baz'} label="I like baz"></lion-checkbox>
        </lion-checkbox-group>
        <lion-radio-group
          name="dinosaurs"
          label="Favorite dinosaur"
          .validators="${[new Required()]}"
        >
          <lion-radio .choiceValue=${'allosaurus'} label="allosaurus"></lion-radio>
          <lion-radio .choiceValue=${'brontosaurus'} label="brontosaurus"></lion-radio>
          <lion-radio .choiceValue=${'diplodocus'} label="diplodocus"></lion-radio>
        </lion-radio-group>
        <lion-listbox name="favoriteFruit" label="Favorite fruit">
          <lion-option .choiceValue=${'Apple'}>Apple</lion-option>
          <lion-option checked .choiceValue=${'Banana'}>Banana</lion-option>
          <lion-option .choiceValue=${'Mango'}>Mango</lion-option>
        </lion-listbox>
        <lion-combobox
          .validators="${[new Required()]}"
          name="favoriteMovie"
          label="Favorite movie"
          autocomplete="both"
        >
          <lion-option checked .choiceValue=${'Rocky'}>Rocky</lion-option>
          <lion-option .choiceValue=${'Rocky II'}>Rocky II</lion-option>
          <lion-option .choiceValue=${'Rocky III'}>Rocky III</lion-option>
          <lion-option .choiceValue=${'Rocky IV'}>Rocky IV</lion-option>
          <lion-option .choiceValue=${'Rocky V'}>Rocky V</lion-option>
          <lion-option .choiceValue=${'Rocky Balboa'}>Rocky Balboa</lion-option>
        </lion-combobox>
        <lion-select-rich name="favoriteColor" label="Favorite color">
          <lion-option .choiceValue=${'red'}>Red</lion-option>
          <lion-option .choiceValue=${'hotpink'} checked>Hotpink</lion-option>
          <lion-option .choiceValue=${'teal'}>Teal</lion-option>
        </lion-select-rich>
        <lion-select label="Lyrics" name="lyrics" .validators="${[new Required()]}">
          <select slot="input">
            <option value="1">Fire up that loud</option>
            <option value="2">Another round of shots...</option>
            <option value="3">Drop down for what?</option>
          </select>
        </lion-select>
        <lion-input-range
          name="range"
          min="1"
          max="5"
          .modelValue="${2.3}"
          unit="%"
          step="0.1"
          label="Input range"
        ></lion-input-range>
        <lion-checkbox-group
          .mulipleChoice="${false}"
          name="terms"
          .validators="${[new Required()]}"
        >
          <lion-checkbox label="I blindly accept all terms and conditions"></lion-checkbox>
        </lion-checkbox-group>
        <lion-switch name="notifications" label="Notifications"></lion-switch>
        <lion-input-stepper max="5" min="0" name="rsvp">
          <label slot="label">RSVP</label>
          <div slot="help-text">Max. 5 guests</div>
        </lion-input-stepper>
        <lion-textarea name="comments" label="Comments"></lion-textarea>
        <div class="buttons">
          <lion-button raised>Submit</lion-button>
          <lion-button
            type="button"
            raised
            @click=${ev => ev.currentTarget.parentElement.parentElement.parentElement.resetGroup()}
            >Reset</lion-button
          >
        </div>
      </form>
    </lion-form>
  `;
};
```

## Submitting a form

To submit a form, use a regular button (or `LionButton`) with `type="submit"` (which is default) somewhere inside the native `<form>`.

Then, add a `submit` handler on the `lion-form`.

You can use this event to do your own (pre-)submit logic, like getting the serialized form data and sending it to a backend API.

Another example is checking if the form has errors, and focusing the first field with an error.

To fire a submit from JavaScript, select the `lion-form` element and call `.submit()`.

```js preview-story
export const formSubmit = () => {
  const submitHandler = ev => {
    if (ev.target.hasFeedbackFor.includes('error')) {
      const firstFormElWithError = ev.target.formElements.find(el =>
        el.hasFeedbackFor.includes('error'),
      );
      firstFormElWithError.focus();
      return;
    }
    const formData = ev.target.serializedValue;
    fetch('/api/foo/', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  };

  const submitViaJS = ev => {
    // Call submit on the lion-form element, in your own code you should use
    // a selector that's not dependent on DOM structure like this one.
    ev.target.previousElementSibling.submit();
  };

  return html`
    <lion-form @submit=${submitHandler}>
      <form @submit=${ev => ev.preventDefault()}>
        <lion-input
          name="first_name"
          label="First Name"
          .validators="${[new Required()]}"
        ></lion-input>
        <lion-input
          name="last_name"
          label="Last Name"
          .validators="${[new Required()]}"
        ></lion-input>
        <div style="display:flex">
          <lion-button raised>Submit</lion-button>
          <lion-button
            type="button"
            raised
            @click=${ev => ev.currentTarget.parentElement.parentElement.parentElement.resetGroup()}
            >Reset</lion-button
          >
        </div>
      </form>
    </lion-form>
    <button @click=${submitViaJS}>Explicit submit via JavaScript</button>
  `;
};
```
