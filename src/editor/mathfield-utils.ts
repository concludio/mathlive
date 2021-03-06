import { Style, ParseMode } from '../public/core';

import { ModelPrivate } from './model';
import { UndoManager } from './undo';
import { SelectorPrivate } from './commands';
import { MathfieldConfigPrivate } from './config';

export declare interface Mathfield {
    model: ModelPrivate;
    config: Required<MathfieldConfigPrivate>;

    undoManager: UndoManager;

    readOnly: boolean;

    dirty: boolean; // If true, need to be redrawn
    pasteInProgress: boolean;
    smartModeSuppressed: boolean;
    _resizeTimer: number; // Timer handle

    element: HTMLElement;
    originalContent: string;

    textarea: HTMLElement;
    field: HTMLElement;
    virtualKeyboardToggleDOMNode: HTMLElement;
    ariaLiveText: HTMLElement;
    accessibleNode: HTMLElement;
    popover: HTMLElement;
    keystrokeCaption: HTMLElement;
    virtualKeyboard: HTMLElement;

    keystrokeCaptionVisible: boolean;
    virtualKeyboardVisible: boolean;
    blurred: boolean;

    keystrokeBuffer: string;
    keystrokeBufferStates: any[]; // @revisit
    keystrokeBufferResetTimer: any; // @revisit

    suggestionIndex: number;

    mode: ParseMode;
    style: Style;

    keypressSound: HTMLAudioElement; // @revisit. Is this used? The sounds are in config, no?
    spacebarKeypressSound: HTMLAudioElement;
    returnKeypressSound: HTMLAudioElement;
    deleteKeypressSound: HTMLAudioElement;
    plonkSound: HTMLAudioElement;

    $perform(command: SelectorPrivate): boolean;
    $focus(): void;
    $select(): void;
    $selectedText(format: string): string;
    $text(format: string): string;
    $clearSelection(): void;
    $hasFocus(): boolean;
    $insert(s: string, options?): boolean;

    resetKeystrokeBuffer(): void;
    switchMode(mode: ParseMode, prefix?: string, suffix?: string): void;
    scrollIntoView(): void;
    groupIsSelected(): boolean;
}

export function on(el, selectors, listener, options?) {
    selectors = selectors.split(' ');
    for (const sel of selectors) {
        const m = sel.match(/(.*):(.*)/);
        if (m) {
            const options2 = options || {};
            if (m[2] === 'active') {
                options2.passive = false;
            } else {
                options2[m[2]] = true;
            }
            el.addEventListener(m[1], listener, options2);
        } else {
            el.addEventListener(sel, listener, options);
        }
    }
}

export function off(el, selectors, listener, options?) {
    selectors = selectors.split(' ');
    for (const sel of selectors) {
        const m = sel.match(/(.*):(.*)/);
        if (m) {
            const options2 = options || {};
            if (m[2] === 'active') {
                options2.passive = false;
            } else {
                options2[m[2]] = true;
            }
            el.removeEventListener(m[1], listener, options2);
        } else {
            el.removeEventListener(sel, listener, options);
        }
    }
}

export function getSharedElement(id: string, cls: string): HTMLElement {
    let result = document.getElementById(id);
    if (result) {
        result.setAttribute(
            'data-refcount',
            Number(
                parseInt(result.getAttribute('data-refcount')) + 1
            ).toString()
        );
    } else {
        result = document.createElement('div');
        result.setAttribute('aria-hidden', 'true');
        result.setAttribute('data-refcount', '1');
        result.className = cls;
        result.id = id;
        document.body.appendChild(result);
    }
    return result;
}

// @revisit: check the elements are correctly released
export function releaseSharedElement(el: HTMLElement): void {
    if (!el) return;
    const refcount = parseInt(el.getAttribute('data-refcount'));
    if (refcount <= 1) {
        el.remove();
    } else {
        el.setAttribute('data-refcount', Number(refcount - 1).toString());
    }
}

/**
 * Checks if the argument is a valid Mathfield.
 * After a Mathfield has been destroyed (for example by calling revertToOriginalContent()
 * the Mathfield is no longer valid. However, there may be some pending
 * operations invoked via requestAnimationFrame() for example, that would
 * need to ensure the mathfield is still valid by the time they're executed.
 */
export function isValidMathfield(mf) {
    return mf.element && mf.element.mathfield === mf;
}

/**
 * Utility function that returns the element which has the caret
 *
 */
function _findElementWithCaret(el) {
    if (
        el.classList.contains('ML__caret') ||
        el.classList.contains('ML__text-caret') ||
        el.classList.contains('ML__command-caret')
    ) {
        return el;
    }
    let result;
    for (const child of el.children) {
        result = result || _findElementWithCaret(child);
    }
    return result;
}

/**
 * Return the (x,y) client coordinates of the caret
 */
export function getCaretPosition(el) {
    const caret = _findElementWithCaret(el);
    if (caret) {
        const bounds = caret.getBoundingClientRect();
        const position = {
            x: bounds.right,
            y: bounds.bottom,
            height: bounds.height,
        };
        return position;
    }
    return null;
}
export function getSelectionBounds(el) {
    const selectedNodes = el.querySelectorAll('.ML__selected');
    if (selectedNodes && selectedNodes.length > 0) {
        const selectionRect = {
            top: Infinity,
            bottom: -Infinity,
            left: Infinity,
            right: -Infinity,
        };
        // Calculate the union of the bounds of all the selected spans
        selectedNodes.forEach((node) => {
            const bounds = node.getBoundingClientRect();
            if (bounds.left < selectionRect.left) {
                selectionRect.left = bounds.left;
            }
            if (bounds.right > selectionRect.right) {
                selectionRect.right = bounds.right;
            }
            if (bounds.bottom > selectionRect.bottom) {
                selectionRect.bottom = bounds.bottom;
            }
            if (bounds.top < selectionRect.top) {
                selectionRect.top = bounds.top;
            }
        });
        const fieldRect = el.getBoundingClientRect();
        const w = selectionRect.right - selectionRect.left;
        const h = selectionRect.bottom - selectionRect.top;
        selectionRect.left = Math.ceil(
            selectionRect.left - fieldRect.left + el.scrollLeft
        );
        selectionRect.right = selectionRect.left + w;
        selectionRect.top = Math.ceil(selectionRect.top - fieldRect.top);
        selectionRect.bottom = selectionRect.top + h;
        return selectionRect;
    }
    return null;
}
