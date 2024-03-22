import type { PropertyValues } from 'lit'
import { property, state } from 'lit/decorators.js'
import { isEqual } from 'lodash-es'

import { CellUpdateEvent } from '../lib/events.js'
import { type Position, type Serializable } from '../types.js'
import { ClassifiedElement } from './classified-element.js'

export const NUMBER_TYPES = [
    'Int',
    'Integer',
    'SmallInt',
    'BigInt',
    'Decimal',
    // 'Numeric', // API appears to deliver these as strings
    'Float',
    'Real',
    'Double Precision',
    'TinyInt',
    'MediumInt',
    'Serial',
    'BigSerial',
].map((s) => s.toLowerCase())
export const BOOLEAN_TYPES = ['Boolean', 'Bit'].map((s) => s.toLowerCase())
export const JSON_TYPES = ['JSON', 'JSONB', 'ARRAY'].map((s) => s.toLowerCase())
export class MutableElement extends ClassifiedElement {
    protected override classMap() {
        return {
            'cursor-pointer': this.isInteractive && !this.readonly,
            ...super.classMap(),
        }
    }

    // current value
    protected _value?: Serializable
    @property({ attribute: 'value', type: String })
    get value(): Serializable {
        return this._value
    }

    set value(newValue: Serializable) {
        const oldValue = this._value
        // convert strings to their proper value-types; json, boolean, number, and null
        this._value = this.convertToType(newValue) ?? newValue
        this.requestUpdate('value', oldValue)
    }

    protected _originalValue?: Serializable
    @property({ attribute: 'original-value', type: String })
    get originalValue(): Serializable {
        return this._originalValue
    }

    set originalValue(newValue: Serializable) {
        const oldValue = this._originalValue
        // convert strings to their proper value-types; json, boolean, number, and null
        this._originalValue = this.convertToType(newValue) ?? newValue
        this.requestUpdate('originalValue', oldValue)
    }

    @property({ type: String })
    public get dirty() {
        return !isEqual(this.value, this.originalValue)
    }

    // the cell's row's uuid and column name
    @property({ type: Object, attribute: 'position' })
    public position: Position = { column: '', row: '' } // TODO let this be undefined?

    @property({ type: String })
    public label?: string

    @property({ attribute: 'read-only', type: Boolean })
    public readonly = false

    @property({ type: String, attribute: 'width' })
    public width?: string

    @property({ attribute: 'interactive', type: Boolean })
    public isInteractive = false

    @property({ attribute: 'outer-border', type: Boolean })
    public outerBorder = false

    // allows, for example, <outerbase-td separate-cells="true" />
    @property({ type: Boolean, attribute: 'separate-cells' })
    public separateCells: boolean = false

    @property({ type: Boolean, attribute: 'blank' })
    public blank = false

    private _type?: string
    @property({ attribute: 'type', type: String })
    public get type(): string | undefined {
        return this._type
    }
    public set type(newValue: string) {
        this._type = newValue?.toLowerCase()
    }

    @state()
    public isEditing = false

    protected convertToType(newValue: Serializable) {
        // convert strings to their proper value-types; json, boolean, number, and null
        const v = newValue
        const t = this.type

        if (t && typeof v === 'string') {
            if (NUMBER_TYPES.includes(t)) return parseInt(v, 10)
            if (JSON_TYPES.includes(t)) return JSON.parse(v)
            if (BOOLEAN_TYPES.includes(t)) return v.toLowerCase().trim() === 'true'
            if (v === '') return null
        }
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

        // dispatch changes when the user stops editing
        if (
            (changedProperties.has('value') && changedProperties.get('value') !== undefined && this.isEditing === false) ||
            (changedProperties.get('isEditing') === true && this.isEditing === false)
        ) {
            this.dispatchChangedEvent()
        }

        if (changedProperties.has('type')) {
            const oldValue = this.value
            this._value = this.convertToType(this.value) ?? this._value
            this.requestUpdate('value', oldValue)

            const oldOriginalValue = this.originalValue
            this._originalValue = this.convertToType(this.originalValue) ?? this.originalValue
            this.requestUpdate('originalValue', oldOriginalValue)
        }
    }

    protected onKeyDown(event: KeyboardEvent & { didCloseMenu?: boolean }) {
        // WARNING: the input's onBlur will NOT called
        if (event.code === 'Escape') {
            event.stopPropagation()
            event.preventDefault()

            // abort changes
            this.isEditing = false
            this.focus()
        }

        if (event.code === 'Enter' && this.isEditing && event.target instanceof HTMLElement) {
            const target = event.target

            // without this setTimeout, something sets `isEditing` back and re-renders immediately, negating the effect entirely
            setTimeout(() => {
                this.isEditing = false
                this.focus()

                // wait until the prev commands have processed
                setTimeout(() => {
                    this.moveFocusToNextRow(target)
                }, 0)
            })
        }

        if (event.code === 'Enter' && !this.isEditing && !this.readonly) {
            if (event.target instanceof HTMLElement && !this.isEditing) {
                if (!event.didCloseMenu) this.isEditing = true
            }
        }

        // set the value to `true` or `false` on `t` or `f`
        if (this.type && BOOLEAN_TYPES.includes(this.type)) {
            if (event.code === 'KeyT') {
                this._value = true
                this.requestUpdate('value')
                return
            } else if (event.code === 'KeyF') {
                this._value = false
                this.requestUpdate('value')
                return
            }
        }
    }

    protected onChange(event: Event) {
        const { value } = event.target as HTMLInputElement
        if (value === '') this.value = null
        else this.value = value
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

    protected moveFocusToNextRow(target: HTMLElement) {
        const parent = target?.parentElement
        const index = Array.from(parent?.children ?? []).indexOf(target) // Find the index of the current element among its siblings
        const parentSibling = parent ? parent.nextElementSibling : null // Get the parent's next sibling
        if (parentSibling && parentSibling.children.length > index) {
            var nthChild = parentSibling.children[index] as HTMLElement | undefined // Find the nth child of the parent's sibling
            if (nthChild) {
                nthChild.focus() // Set focus on the nth child
            }
        }
    }

    protected moveFocusToPreviousRow(target: HTMLElement) {
        const parent = target?.parentElement
        const index = Array.from(parent?.children ?? []).indexOf(target) // Find the index of the current element among its siblings
        const parentSibling = parent ? parent.previousElementSibling : null // Get the parent's next sibling
        if (parentSibling && parentSibling.children.length > index) {
            var nthChild = parentSibling.children[index] as HTMLElement | undefined // Find the nth child of the parent's sibling
            if (nthChild) {
                nthChild.focus() // Set focus on the nth child
            }
        }
    }
}
