var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { isEqual } from 'lodash-es';
import { Theme } from '../types.js';
import { CellUpdateEvent } from '../lib/events.js';
import { property, state } from 'lit/decorators.js';
import { ClassifiedElement } from './classified-element.js';
import { eventTargetIsPlugin } from '../lib/event-target-is-plugin.js';
export class MutableElement extends ClassifiedElement {
    constructor() {
        super(...arguments);
        // the cell's row's uuid and column name
        this.position = { column: '', row: '' }; // TODO let this be undefined?
        this.readonly = false;
        this.isInteractive = false;
        this.outerBorder = false;
        this.theme = Theme.light;
        // allows, for example, <outerbase-td separate-cells="true" />
        this.separateCells = false;
        this.isEditing = false;
    }
    get dirty() {
        return this.originalValue !== undefined && !isEqual(this.value, this.originalValue);
    }
    connectedCallback() {
        super.connectedCallback();
        if (this.isInteractive)
            this.addEventListener('dblclick', this.onDoubleClick);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.isInteractive)
            this.removeEventListener('dblclick', this.onDoubleClick);
    }
    updated(changedProps) {
        super.updated(changedProps);
        if (changedProps.has('isEditing') && this.isEditing) {
            // focus and select text
            const input = this.shadowRoot?.querySelector('input');
            if (input) {
                input.select();
            }
        }
    }
    willUpdate(changedProperties) {
        super.willUpdate(changedProperties);
        // set initial `originalValue`
        // this is done here instead of, say, connectedCallback() because of a quirk with SSR
        if (changedProperties.has('value') && this.originalValue === undefined && this.originalValue !== this.value) {
            this.originalValue = this.value;
        }
        // dispatch changes when the user stops editing
        if (changedProperties.get('isEditing') === true && this.isEditing === false) {
            this.dispatchChangedEvent();
        }
    }
    onKeyDown(event) {
        // WARNING: the input's onBlur will NOT called
        if (event.code === 'Escape') {
            event.stopPropagation();
            event.preventDefault();
            // abort changes
            this.isEditing = false;
            this.focus();
        }
        if (event.code === 'Enter' && this.isEditing && event.target instanceof HTMLElement) {
            const target = event.target;
            // without this setTimeout, something sets `isEditing` back and re-renders immediately, negating the effect entirely
            setTimeout(() => {
                this.isEditing = false;
                this.focus();
                // wait until the prev commands have processed
                setTimeout(() => {
                    this.moveFocusToNextRow(target);
                }, 0);
            });
        }
        if (event.code === 'Enter' && !this.isEditing && !this.readonly) {
            if (event.target instanceof HTMLElement && !this.isEditing) {
                this.isEditing = true;
            }
        }
    }
    onDoubleClick(event) {
        if (!eventTargetIsPlugin(event)) {
            this.isEditing = true;
            setTimeout(() => {
                const input = this.shadowRoot?.querySelector('input');
                if (input) {
                    input.readOnly = this.readonly;
                    input.focus();
                    // set cursor to end if writable
                    if (!this.readonly)
                        input.setSelectionRange(input.value.length, input.value.length);
                }
            }, 0);
        }
    }
    onChange(event) {
        const { value } = event.target;
        this.value = value;
    }
    dispatchChangedEvent() {
        this.dispatchEvent(new CellUpdateEvent({
            position: this.position,
            previousValue: this.originalValue, // TODO @johnny remove this cast / handle types better
            value: this.value,
            label: this.label,
        }));
    }
    onBlur() {
        this.isEditing = false;
    }
    moveFocusToNextRow(target) {
        const parent = target?.parentElement;
        const index = Array.from(parent?.children ?? []).indexOf(target); // Find the index of the current element among its siblings
        const parentSibling = parent ? parent.nextElementSibling : null; // Get the parent's next sibling
        if (parentSibling && parentSibling.children.length > index) {
            var nthChild = parentSibling.children[index]; // Find the nth child of the parent's sibling
            if (nthChild) {
                nthChild.focus(); // Set focus on the nth child
            }
        }
    }
    moveFocusToPreviousRow(target) {
        const parent = target?.parentElement;
        const index = Array.from(parent?.children ?? []).indexOf(target); // Find the index of the current element among its siblings
        const parentSibling = parent ? parent.previousElementSibling : null; // Get the parent's next sibling
        if (parentSibling && parentSibling.children.length > index) {
            var nthChild = parentSibling.children[index]; // Find the nth child of the parent's sibling
            if (nthChild) {
                nthChild.focus(); // Set focus on the nth child
            }
        }
    }
}
__decorate([
    property({ type: String })
], MutableElement.prototype, "value", void 0);
__decorate([
    property({ type: String })
], MutableElement.prototype, "dirty", null);
__decorate([
    property({ type: Object, attribute: 'position' })
], MutableElement.prototype, "position", void 0);
__decorate([
    property({ type: String })
], MutableElement.prototype, "label", void 0);
__decorate([
    property({ attribute: 'original-value', type: String })
], MutableElement.prototype, "originalValue", void 0);
__decorate([
    property({ attribute: 'read-only', type: Boolean })
], MutableElement.prototype, "readonly", void 0);
__decorate([
    property({ type: String, attribute: 'width' })
], MutableElement.prototype, "width", void 0);
__decorate([
    property({ attribute: 'interactive', type: Boolean })
], MutableElement.prototype, "isInteractive", void 0);
__decorate([
    property({ attribute: 'outer-border', type: Boolean })
], MutableElement.prototype, "outerBorder", void 0);
__decorate([
    property({ attribute: 'theme', type: Number })
], MutableElement.prototype, "theme", void 0);
__decorate([
    property({ type: Boolean, attribute: 'separate-cells' })
], MutableElement.prototype, "separateCells", void 0);
__decorate([
    state()
], MutableElement.prototype, "isEditing", void 0);
