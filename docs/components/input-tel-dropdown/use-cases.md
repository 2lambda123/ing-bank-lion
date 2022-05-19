# Input Tel Dropdown >> Use Cases ||20

```js script
import { html } from '@mdjs/mdjs-preview';
import { ref, createRef } from '@lion/core';
import { loadDefaultFeedbackMessages } from '@lion/validate-messages';
import { PhoneUtilManager } from '@lion/input-tel';
import '@lion/input-tel-dropdown/define';
import '../../../docs/fundamentals/systems/form/assets/h-output.js';
```

## Input Tel Dropdown

When `.allowedRegions` is not configured, all regions/countries will be available in the dropdown
list. Once a region is chosen, its country/dial code will be adjusted with that of the new locale.

```js preview-story
export const InputTelDropdown = () => html`
  <lion-input-tel-dropdown
    label="Select region via dropdown"
    help-text="Shows all regions by default"
    name="phoneNumber"
  ></lion-input-tel-dropdown>
  <h-output
    .show="${['modelValue', 'activeRegion']}"
    .readyPromise="${PhoneUtilManager.loadComplete}"
  ></h-output>
`;
```

## Allowed regions

When `.allowedRegions` is configured, only those regions/countries will be available in the dropdown
list.

```js preview-story
export const allowedRegions = () => html`
  <lion-input-tel-dropdown
    label="Select region via dropdown"
    help-text="With region code 'NL'"
    .modelValue=${'+31612345678'}
    name="phoneNumber"
    .allowedRegions=${['NL', 'DE', 'GB']}
  ></lion-input-tel-dropdown>
  <h-output
    .show="${['modelValue', 'activeRegion']}"
    .readyPromise="${PhoneUtilManager.loadComplete}"
  ></h-output>
`;
```

## Preferred regions

When `.preferredRegions` is configured, they will show up on top of the dropdown list to enhance user experience.

The labels the `optgroup`s can be set with `all-countries-label` &  `preferred-countries-label` attributes.

```js preview-story
export const preferredRegionCodes = () => html`
  <lion-input-tel-dropdown
    label="Select region via dropdown"
    help-text="Preferred regions show on top"
    .modelValue=${'+31612345678'}
    name="phoneNumber"
    .allowedRegions=${['BE', 'CA', 'DE', 'GB', 'NL', 'US']}
    .preferredRegions=${['DE', 'NL']}
  ></lion-input-tel-dropdown>
  <h-output
    .show="${['modelValue', 'activeRegion']}"
    .readyPromise="${PhoneUtilManager.loadComplete}"
  ></h-output>
`;
```
