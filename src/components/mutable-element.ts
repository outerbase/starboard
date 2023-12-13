import type { Position } from '../types'
import type { PropertyValues } from 'lit'
import { CellUpdateEvent } from '../lib/events'
import { property, state } from 'lit/decorators.js'
import { ClassifiedElement } from './classified-element'

export class MutableElement extends ClassifiedElement {
    // current value
    @property({ type: String })
    public value?: string

    @property({ type: String })
    public dirty = false

    // the cell's row & column index
    @property({ type: Object })
    public position?: Position

    @property({ type: String })
    public label?: string

    @state()
    public originalValue?: string

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
    }

    protected onKeyDown(event: KeyboardEvent) {
        // WARNING: the input's onBlur will NOT called

        if (event.code === 'Escape') {
            // abort changes
            this.isEditing = false
            this.dirty = false
            this.value = this.originalValue
            delete this.originalValue

            this.dispatchChangedEvent()
        }

        if (event.code === 'Enter' || event.code === 'Tab') {
            // commit changes [by doing nothing]
            this.isEditing = false
            this.dirty = this.value !== this.originalValue

            this.dispatchChangedEvent()
        }
    }

    protected onDoubleClick() {
        if (this.value === undefined) return
        this.isEditing = true
    }

    protected onChange(event: Event) {
        const { value } = event.target as HTMLInputElement
        this.value = value
        this.dirty = this.value !== this.originalValue
    }

    protected dispatchChangedEvent() {
        this.dispatchEvent(
            new CellUpdateEvent({
                position: this.position,
                // TODO @johnny clarify whether this should be the OG value or previous keystroke
                previousValue: this.originalValue,
                value: this.value,
                label: this.label,
            })
        )
    }

    protected onBlur() {
        this.isEditing = false
        this.dispatchChangedEvent()
    }
}
