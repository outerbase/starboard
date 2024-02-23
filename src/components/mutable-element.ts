import type { PropertyValueMap, PropertyValues } from 'lit'
import { isEqual } from 'lodash-es'

import { Theme, type Position, type Serializable } from '../types.js'
import { CellUpdateEvent } from '../lib/events.js'
import { property, state } from 'lit/decorators.js'
import { ClassifiedElement } from './classified-element.js'
import { eventTargetIsPlugin } from '../lib/event-target-is-plugin.js'

export class MutableElement extends ClassifiedElement {
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

    @state()
    public isEditing = false

    public override connectedCallback() {
        super.connectedCallback()
        if (this.isInteractive) this.addEventListener('dblclick', this.onDoubleClick)
    }

    public override disconnectedCallback() {
        super.disconnectedCallback()
        if (this.isInteractive) this.removeEventListener('dblclick', this.onDoubleClick)
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

    protected override firstUpdated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        super.firstUpdated(changedProperties)

        // set initial `originalValue`
        // this is done here instead of, say, connectedCallback() because of a quirk with SSR
        if (this.originalValue === undefined && this.originalValue !== this.value) {
            this.originalValue = this.value
        }
    }

    protected override willUpdate(changedProperties: PropertyValues<this>) {
        super.willUpdate(changedProperties)

        console.log('willUpdate', Array.from(changedProperties.keys()))
        // TODO @johnny why is this function firing once for every cell when toggling isEditing and prolly any other property?
        // should be a (small?) perf improvement to resolve that

        // console.log(`changedProperties.has('value')`, changedProperties.has('value'))
        // console.log(`this.isEditing === false`, this.isEditing === false)
        // dispatch changes when the user stops editing
        // if (changedProperties.has('value') && this.isEditing === false) {
        // handle clear, reset, paste
        if (changedProperties.has('value') && this.isEditing === false) {
            // skip initialization round
            if (this.originalValue === undefined) return

            console.log('dispatchChangedEvent')
            this.dispatchChangedEvent()
        }

        // handle user input but not on each keystroke
        if (changedProperties.has('isEditing') && this.isEditing === false) {
            if (this.originalValue === undefined) return
            console.log('dispatchChangedEvent')
            this.dispatchChangedEvent()
        }
    }

    protected onKeyDown(event: KeyboardEvent & { didCloseMenu: boolean }) {
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

    protected onDoubleClick(event: MouseEvent) {
        if (this.isEditing) return // allow double-clicking to select text while editing

        if (!eventTargetIsPlugin(event)) {
            this.isEditing = true
            setTimeout(() => {
                const input = this.shadowRoot?.querySelector('input')

                if (input) {
                    input.readOnly = this.readonly
                    input.focus()

                    // set cursor to end if writable
                    if (!this.readonly) input.setSelectionRange(input.value.length, input.value.length)
                }
            }, 0)
        }
    }

    protected onChange(event: Event) {
        const { value } = event.target as HTMLInputElement
        this.value = value
    }

    protected dispatchChangedEvent() {
        this.dispatchEvent(
            new CellUpdateEvent({
                position: this.position,
                previousValue: this.originalValue as string | undefined, // TODO @johnny remove this cast / handle types better
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
