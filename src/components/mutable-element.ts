import type { PropertyValues } from 'lit'
import { isEqual } from 'lodash-es'

import { Theme, type Position, type Serializable } from '../types.js'
import { CellUpdateEvent } from '../lib/events.js'
import { property, state } from 'lit/decorators.js'
import { ClassifiedElement } from './classified-element.js'
import { eventTargetIsPlugin } from '../lib/event-target-is-plugin.js'

const NUMBER_TYPES = [
    'Integer',
    'SmallInt',
    'BigInt',
    'Decimal',
    'Numeric',
    'Float',
    'Real',
    'Double Precision',
    'TinyInt',
    'MediumInt',
    'Serial',
    'BigSerial',
].map((s) => s.toLowerCase())
const BOOLEAN_TYPES = ['Boolean', 'Bit'].map((s) => s.toLowerCase())
const JSON_TYPES = ['JSON', 'JSONB'].map((s) => s.toLowerCase())

export class MutableElement extends ClassifiedElement {
    protected override get classMap() {
        return {
            ...super.classMap,
            'cursor-pointer': this.isInteractive && !this.readonly,
            dark: this.theme == Theme.dark,
        }
    }

    // current value
    @property({ type: String })
    public value?: Serializable

    @property({ type: String })
    public get dirty() {
        return this.originalValue !== undefined && !isEqual(this.value, this.originalValue)
    }

    // the cell's row's uuid and column name
    @property({ type: Object, attribute: 'position' })
    public position: Position = { column: '', row: '' } // TODO let this be undefined?

    @property({ type: String })
    public label?: string

    @property({ attribute: 'original-value', type: String })
    public originalValue?: Serializable

    @property({ attribute: 'read-only', type: Boolean })
    public readonly = false

    @property({ type: String, attribute: 'width' })
    public width?: string

    @property({ attribute: 'interactive', type: Boolean })
    public isInteractive = false

    @property({ attribute: 'outer-border', type: Boolean })
    public outerBorder = false

    @property({ attribute: 'theme', type: Number })
    public theme = Theme.light

    // allows, for example, <outerbase-td separate-cells="true" />
    @property({ type: Boolean, attribute: 'separate-cells' })
    public separateCells: boolean = false

    @property({ type: Boolean, attribute: 'blank' })
    public blank = false

    @property({ attribute: 'type', type: String })
    public type?: string

    @state()
    public isEditing = false

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
        if (changedProperties.has('value') && this.originalValue === undefined && this.originalValue !== this.value) {
            this.originalValue = this.value
        }

        // TODO @johnny why is this function firing once for every cell when toggling isEditing and prolly any other property?
        // shoudl be a (small?) perf improvement to resolve that

        // dispatch changes when the user stops editing
        if (changedProperties.get('isEditing') === true && this.isEditing === false && !isEqual(this.value, this.originalValue)) {
            // ensure the value has actually changed to prevent superfluous events
            // note: for changedProperties.get('value') is undefined for some reason so this still fires if the value is the same before/after isEditing changed
            if (this.value !== changedProperties.get('value')) {
                this.dispatchChangedEvent()
            }
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
    }

    protected onChange(event: Event) {
        const { value } = event.target as HTMLInputElement
        this.value = value
    }

    protected dispatchChangedEvent() {
        // convert strings to their proper value-types; json, boolean, number, and null
        const v = this.value
        const t = this.type?.toLowerCase()
        let typedValued: Serializable

        if (t && typeof v === 'string') {
            if (NUMBER_TYPES.includes(t)) typedValued = parseInt(v, 10)
            if (JSON_TYPES.includes(t)) typedValued = JSON.parse(v)
            if (BOOLEAN_TYPES.includes(t)) typedValued = v.toLowerCase().trim() === 'true'
            // TODO convert `''` to `NULL`?
        }

        this.dispatchEvent(
            new CellUpdateEvent({
                position: this.position,
                previousValue: this.originalValue as string | undefined, // TODO @johnny remove this cast / handle types better
                value: typedValued ?? this.value,
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
