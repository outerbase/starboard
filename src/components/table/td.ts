import type { Position } from '../../types'

import { customElement, property, state } from 'lit/decorators.js'
import { ClassifiedElement } from '../classified-element'
import { html, type PropertyValues } from 'lit'
import { TWStyles } from '../../../tailwind'
import { classMap } from 'lit/directives/class-map.js'
import { CellUpdateEvent } from '../../lib/events'

// tl;dr <td/>, table-cell
@customElement('outerbase-td')
export class TableData extends ClassifiedElement {
    static override styles = TWStyles
    protected override get classMap() {
        return {
            'table-cell px-cell-padding-x py-cell-padding-y relative': true,
            'border-theme-border dark:border-theme-border-dark': true,
            'bg-theme-cell dark:bg-theme-cell-dark text-theme-cell-text dark:text-theme-cell-text-dark': true,

            'bg-yellow-100 bg-theme-cell-dirty dark:bg-theme-cell-dirty-dark':
                this.originalValue !== undefined && this.value !== this.originalValue && !this.isEditing, // dirty cells
            // 'max-w-xs': !this.maxWidth, // default max width, unless specified
            [this.maxWidth]: this.maxWidth?.length > 0, // specified max width, if any
            'border-r': this._drawRightBorder, // to avoid both a resize handler + a border
            'first:border-l': this.separateCells, // left/right borders when the `separate-cells` attribute is set
            'border-b': this.withBottomBorder, // bottom border when the `with-bototm-border` attribute is set
            'cursor-pointer': this.value !== undefined,
        }
    }

    // allows, for example, <outerbase-td max-width="max-w-xl" />
    @property({ type: String, attribute: 'max-width' })
    maxWidth: string = ''

    // allows, for example, <outerbase-td separate-cells="true" />
    @property({ type: Boolean, attribute: 'separate-cells' })
    separateCells: boolean = false

    // allows, for example, <outerbase-td bottom-border="true" />
    @property({ type: Boolean, attribute: 'bottom-border' })
    withBottomBorder: boolean = false

    @property({ type: Boolean, attribute: 'draw-right-border' })
    private _drawRightBorder = false

    @property({ type: String, attribute: 'sort-by' })
    protected sortBy?: string

    @property({ type: String, attribute: 'order-by' })
    protected orderBy?: 'ascending' | 'descending'

    @property({ type: Boolean, attribute: 'odd' })
    protected isOdd?: boolean

    @property({ type: Boolean, attribute: 'no-text' })
    protected suppressNbsp = false

    onKeyDown(event: KeyboardEvent) {
        // WARNING: the input's onBlur will NOT called

        if (event.code === 'Escape') {
            // abort changes
            this.value = this.originalValue
            delete this.originalValue

            this.isEditing = false
            this.dispatchChangedEvent()
        }

        if (event.code === 'Enter' || event.code === 'Tab') {
            // commit changes [by doing nothing]
            this.isEditing = false
            this.dispatchChangedEvent()
        }
    }

    // this cell's _current_ value
    @property({ type: String })
    value?: string

    // the cell's row & column index
    @property({ type: Object })
    position?: Position

    @state()
    originalValue?: string

    @state()
    isEditing = false

    override updated(changedProps: PropertyValues<this>) {
        super.updated(changedProps)

        if (changedProps.has('isEditing') && this.isEditing) {
            // focus and select text
            const input = this.shadowRoot?.querySelector('input')
            if (input) {
                input.select()
            }
        }
    }

    override willUpdate(changedProperties: PropertyValues<this>) {
        super.willUpdate(changedProperties)

        // set initial `originalValue`
        // this is done here instead of, say, connectedCallback() because of a quirk with SSR
        if (changedProperties.has('value') && this.originalValue === undefined) {
            this.originalValue = this.value
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

    protected dispatchChangedEvent(forced?: boolean) {
        if (!this.position) {
            console.debug('cell-updated event not fired due to missing position')
            return
        }

        this.dispatchEvent(
            new CellUpdateEvent({
                position: this.position,
                previousValue: this.originalValue,
                value: this.value,
            })
        )
    }

    protected onBlur() {
        this.isEditing = false
        this.dispatchChangedEvent()
    }

    render() {
        return this.isEditing
            ? html`<input .value=${this.value} @input=${this.onChange} @keydown=${this.onKeyDown} class=${classMap({
                  'w-full bg-blue-50 dark:bg-blue-950 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900': true,
              })} @blur=${this.onBlur}></input>`
            : html`<div
                  @dblclick="${this.onDoubleClick}"
                  class=${classMap({
                      'whitespace-nowrap text-ellipsis overflow-hidden': true,
                      'min-w-[200px]': (this.value?.length ?? 0) > 0, // prevent the first column (checkbox) from being asburdly wide; should do something more explicit instead
                      //   'pr-2': !((this.value?.length ?? 0) > 0), // ditto
                  })}
              >
                  <!-- providing a non-breaking whitespace to force the content to actually render and be clickable -->
                  ${this.suppressNbsp ? null : this.value || html`&nbsp;`}
                  <slot></slot>
              </div>`
    }
}
