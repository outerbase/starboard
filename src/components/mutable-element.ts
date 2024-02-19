import type { PropertyValues } from 'lit'

import type { Position } from '../types.js'
import { CellUpdateEvent } from '../lib/events.js'
import { property, state } from 'lit/decorators.js'
import { ClassifiedElement } from './classified-element.js'
import eventTargetIsPlugin from '../lib/event-target-is-plugin.js'

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

    @property({ attribute: 'original-value', type: String })
    public originalValue?: string

    @property({ attribute: 'read-only', type: Boolean })
    public readonly = false

    @state()
    public isEditing = false

    private previousValue?: string

    public override connectedCallback() {
        super.connectedCallback()
        if (!this.readonly) this.addEventListener('dblclick', this.onDoubleClick)
    }

    public override disconnectedCallback() {
        super.disconnectedCallback()
        if (!this.readonly) this.removeEventListener('dblclick', this.onDoubleClick)
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

        if (changedProperties.get('value') && this.previousValue !== this.value) {
            this.previousValue = this.value
            this.dispatchChangedEvent()
        }
    }

    protected onKeyDown(event: KeyboardEvent) {
        // WARNING: the input's onBlur will NOT called

        if (event.code === 'Escape') {
            event.stopPropagation()
            event.preventDefault()

            // abort changes
            this.isEditing = false
            this.focus()
            // disabling restoring the original value
            // this.value = this.originalValue
        }

        if (event.code === 'Enter' && this.isEditing) {
            // without this setTimeout, something sets `isEditing` back and re-renders immediately, negating the effect entirely
            setTimeout(() => {
                this.isEditing = false
                this.focus()
            }, 0)
        }

        if (event.code === 'Enter' && !this.isEditing && !this.readonly) {
            this.isEditing = true
        }
    }

    protected onDoubleClick(event: MouseEvent) {
        if (!eventTargetIsPlugin(event)) this.isEditing = true
    }

    protected onChange(event: Event) {
        const { value } = event.target as HTMLInputElement
        this.value = value
    }

    protected dispatchChangedEvent() {
        this.dispatchEvent(
            new CellUpdateEvent({
                position: this.position,
                previousValue: this.originalValue,
                value: this.value,
                label: this.label,
            })
        )
    }

    protected onBlur() {
        this.isEditing = false
    }
}
