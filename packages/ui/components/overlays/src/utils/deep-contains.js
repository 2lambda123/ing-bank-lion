/**
 * Whether first element contains the second element, also goes through shadow roots
 * @param {HTMLElement|ShadowRoot} el
 * @param {HTMLElement|ShadowRoot} targetEl
 * @returns {boolean}
 */
export function deepContains(el, targetEl) {
  let containsTarget = el.contains(targetEl);
  if (containsTarget) {
    return true;
  }

  /**
   * @description A `Typescript` `type guard` for `HTMLSlotElement`
   * @param {HTMLElement | HTMLSlotElement} htmlElement
   * @returns {htmlElement is HTMLSlotElement}
   */
  function isSlot(htmlElement) {
    return htmlElement.tagName === 'SLOT';
  }

  /**
   * @description Returns a slot projection or it returns `null` if `htmlElement` is not an `HTMLSlotElement`
   * @example
   * Let's say this is a custom element declared as follows:
   * ```
   * <custom-element>
   *   shadowRoot
   *     <div id="dialog-wrapper">
   *       <div id="dialog-header">Header</div>
   *       <div id="dialog-content">
   *         <slot name="content"></slot>
   *       </div>
   *     </div>
   *   <!-- Light DOM -->
   *   <div id="my-slot-content" slot="content">my content</div>
   * </custom-element>
   * ```
   * Then for `div#dialog-wrapper` which is defined in the ShadowDom the function returns `div#my-slot-content` which is defined in the LightDom
   * @param {HTMLElement | HTMLSlotElement} htmlElement
   * @returns {HTMLElement | null}
   * */
  function getSlotProjection(htmlElement) {
    return isSlot(htmlElement)
      ? /** @type {HTMLElement}  */ (htmlElement.assignedElements()[0])
      : null;
  }

  /** @param {HTMLElement|ShadowRoot} elem */
  function checkChildren(elem) {
    for (let i = 0; i < elem.children.length; i += 1) {
      const child = /** @type {HTMLElement}  */ (elem.children[i]);
      const slotProjectionElement = getSlotProjection(child);
      if (
        (child.shadowRoot && deepContains(child.shadowRoot, targetEl)) ||
        (slotProjectionElement && deepContains(slotProjectionElement, targetEl))
      ) {
        containsTarget = true;
        break;
      }
      if (child.children.length > 0) {
        checkChildren(child);
      }
    }
  }

  // If element is not shadowRoot itself
  if (el instanceof HTMLElement && el.shadowRoot) {
    containsTarget = deepContains(el.shadowRoot, targetEl);
    if (containsTarget) {
      return true;
    }
  }
  checkChildren(el);
  return containsTarget;
}
