var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { CellUpdateEvent } from '../lib/events.js';
import { property, state } from 'lit/decorators.js';
import { ClassifiedElement } from './classified-element.js';
export class MutableElement extends ClassifiedElement {
    constructor() {
        super(...arguments);
        // the cell's row's uuid and column name
        this.position = { column: '', row: '' }; // TODO let this be undefined?
        this.readonly = false;
        this.isEditing = false;
    }
    get dirty() {
        return this.originalValue !== undefined && this.value !== this.originalValue;
    }
    connectedCallback() {
        super.connectedCallback();
        if (!this.readonly)
            this.addEventListener('dblclick', this.onDoubleClick);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        if (!this.readonly)
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
        if (changedProperties.has('value') && this.originalValue === undefined) {
            this.originalValue = this.value;
        }
        // when editing starts, track it's initial value
        if (changedProperties.has('isEditing') && this.isEditing) {
            this.valueBeforeEdit = this.value;
        }
        // after initial load, after editing, when the value has been changed
        // isEditing is `undefined` on the initial run -> therefore we ignore that round
        if (changedProperties.get('isEditing') && !this.isEditing && this.value !== this.valueBeforeEdit) {
            if (this.valueBeforeEdit !== this.value) {
                this.dispatchChangedEvent();
            }
            delete this.valueBeforeEdit;
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
            // disabling restoring the original value
            // this.value = this.originalValue
        }
        if (event.code === 'Enter' && this.isEditing) {
            // without this setTimeout, something sets `isEditing` back and re-renders immediately, negating the effect entirely
            setTimeout(() => {
                this.isEditing = false;
                this.focus();
            }, 0);
        }
        if (event.code === 'Enter' && !this.isEditing && !this.readonly) {
            this.isEditing = true;
        }
    }
    onDoubleClick() {
        this.isEditing = true;
    }
    onChange(event) {
        const { value } = event.target;
        this.value = value;
    }
    dispatchChangedEvent() {
        this.dispatchEvent(new CellUpdateEvent({
            position: this.position,
            previousValue: this.valueBeforeEdit ?? this.originalValue,
            value: this.value,
            label: this.label,
        }));
    }
    onBlur() {
        this.isEditing = false;
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
    state()
], MutableElement.prototype, "isEditing", void 0);
