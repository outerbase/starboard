import type { PropertyValues } from 'lit'

import type { Position } from '../types.js'
import { CellUpdateEvent } from '../lib/events.js'
import { property, state } from 'lit/decorators.js'
import { ClassifiedElement } from './classified-element.js'

export class MutableElement extends ClassifiedElement {
    // current value
    @property({ type: String })
    public value?: string

    @property({ type: String })
    public get dirty() {
        return this.originalValue !== undefined && this.value !== this.originalValue
    }

    // the cell's row's uuid and column name
    @property({ type: Object, attribute: 'position' })
    public position: Position = { column: '', row: '' } // TODO let this be undefined?

    @property({ type: String })
    public label?: string

    @property()
    public originalValue?: string

    private valueBeforeEdit?: string

    @state()
    public isEditing = false

    public override connectedCallback() {
        super.connectedCallback()
        this.addEventListener('dblclick', this.onDoubleClick)
    }

    public override disconnectedCallback() {
        super.disconnectedCallback()
        this.removeEventListener('dblclick', this.onDoubleClick)
    }

    protected override updated(changedProps: PropertyValues<this>) {
        super.updated(changedProps)

        if (changedProps.has('isEditing') && this.isEditing) {
            // focus and select text
            const input = this.shadowRoot?.querySelector('input')
            if (input) {
                input.select()
            }
        }
    }

    protected override willUpdate(changedProperties: PropertyValues<this>) {
        super.willUpdate(changedProperties)

        // set initial `originalValue`
        // this is done here instead of, say, connectedCallback() because of a quirk with SSR
        if (changedProperties.has('value') && this.originalValue === undefined) {
            this.originalValue = this.value
        }

        // when editing starts, track it's initial value
        if (changedProperties.has('isEditing') && this.isEditing) {
            this.valueBeforeEdit = this.value
        }

        // after initial load, after editing, when the value has been changed
        // isEditing is `undefined` on the initial run -> therefore we ignore that round
        if (changedProperties.get('isEditing') && !this.isEditing && this.value !== this.valueBeforeEdit) {
            if (this.valueBeforeEdit !== this.value) {
                this.dispatchChangedEvent()
            }
            delete this.valueBeforeEdit
        }
    }

    protected onKeyDown(event: KeyboardEvent) {
        // WARNING: the input's onBlur will NOT called

        if (event.code === 'Escape') {
            // abort changes
            this.isEditing = false
            this.value = this.originalValue
        }

        if (event.code === 'Enter' || event.code === 'Tab') {
            // commit changes [by doing nothing]
            this.isEditing = false
        }
    }

    protected onDoubleClick() {
        if (this.value === undefined) return
        this.isEditing = true
    }

    protected onChange(event: Event) {
        const { value } = event.target as HTMLInputElement
        this.value = value
    }

    protected dispatchChangedEvent() {
        this.dispatchEvent(
            new CellUpdateEvent({
                position: this.position,
                previousValue: this.valueBeforeEdit ?? this.originalValue,
                value: this.value,
                label: this.label,
            })
        )
    }

    protected onBlur() {
        this.isEditing = false
    }
}
