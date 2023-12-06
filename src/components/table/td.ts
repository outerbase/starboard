import { customElement, property, state } from 'lit/decorators.js'
import { ClassifiedElement } from '../classified-element'
import { html, type PropertyValues } from 'lit'
import { TWStyles } from '../../../tailwind'
import { classMap } from 'lit/directives/class-map.js'
import { CellUpdateEvent, type Position } from '../../lib/events'

// tl;dr <td/>, table-cell
@customElement('outerbase-td')
export class TableData extends ClassifiedElement {
    static override styles = TWStyles
    protected override get classMap() {
        return {
            'border-neutral-100 dark:border-neutral-900': true,
            'bg-theme-cell dark:bg-theme-cell-dark text-theme-cell-text dark:text-theme-cell-text-dark': true,
            'max-w-xs': !this.maxWidth, // default max width, unless specified
            [this.maxWidth]: this.maxWidth?.length > 0, // specified max width, if any
            'border-r': this._drawRightBorder, // to avoid both a resize handler + a border
            'first:border-l': this.separateCells, // left/right borders when the `separate-cells` attribute is set
            'border-b': this.withBottomBorder, // bottom border when the `with-bototm-border` attribute is set
            'table-cell text-ellipsis whitespace-nowrap overflow-hidden': true, // the baseline styles for our <td/>
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

    get inputClasses() {
        return {
            'w-full bg-blue-50 dark:bg-blue-950 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900': true,
            'px-cell-padding-x py-cell-padding-y': true,
        }
    }

    onKeyDown(event: KeyboardEvent) {
        if (event.code === 'Escape') {
            // abort changes
            this.value = this.originalValue
            delete this.originalValue
            this.isEditing = false
            // TODO trigger blur?
        }

        if (event.code === 'Enter' || event.code === 'Tab') {
            // commit changes
            // TODO change `originalValue` to be this new value? or leave it as the very first value?
            this.isEditing = false
            this.dispatchEvent(
                new Event('cell-data-change', {
                    // TODO include details about what changed
                    bubbles: true,
                    composed: true,
                })
            )
            // TODO trigger blur?
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

    protected onDoubleClick() {
        this.isEditing = true
    }

    protected onChange(event: Event) {
        const { value } = event.target as HTMLInputElement
        this.value = value
    }

    protected dispatchChangedEvent() {
        if (this.value !== this.originalValue) {
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
    }

    // focus and select text
    // stop editing onblur
    override updated(changedProps: PropertyValues<this>) {
        super.updated(changedProps)

        if (changedProps.has('isEditing')) {
            if (this.isEditing) {
                const input = this.shadowRoot?.querySelector('input')
                if (input) {
                    input.select()

                    const onBlur = () => {
                        this.isEditing = false
                        this.dispatchChangedEvent()
                        input.removeEventListener('blur', onBlur)
                    }

                    // TODO @johnny this listener isn't (explicitly) removed if the user presses `Enter`
                    //              because that removes the element from the DOM before a `blur` can occur
                    //              ...it's unclear to me whether this is a leak or resolved by the DOM element being removed
                    input.addEventListener('blur', onBlur)
                }
            } else {
                // when editing has stopped
                this.dispatchChangedEvent()
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

    render() {
        return this.isEditing
            ? html`<input .value=${this.value} @input=${this.onChange} @keydown=${this.onKeyDown} class=${classMap(
                  this.inputClasses
              )}></input>`
            : html`<div
                  @dblclick="${this.onDoubleClick}"
                  class=${classMap({
                      'px-cell-padding-x py-cell-padding-y': true,
                      'bg-yellow-50 dark:bg-yellow-950': this.value !== this.originalValue, // dirty cells
                  })}
              >
                  ${this.value}
              </div>`
    }
}
