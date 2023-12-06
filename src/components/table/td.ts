import { customElement, property, state } from 'lit/decorators.js'
import { ClassifiedElement } from '../classified-element'
import { html } from 'lit'
import { TWStyles } from '../../../tailwind'
import { classMap } from 'lit/directives/class-map.js'

// tl;dr <td/>, table-cell
@customElement('outerbase-td')
export class TableData extends ClassifiedElement {
    static override styles = TWStyles
    protected override get classMap() {
        return {
            'border-neutral-100 dark:border-neutral-900': true,
            'px-cell-padding-x py-cell-padding-y-sm': true,
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

    @property({ type: String, attribute: 'odd' })
    protected isOdd?: string

    @property({ type: String, attribute: 'even' })
    @state()
    private _columnIsResizing = false

    // WARNING these don't recompute!
    internalContainerClassMap = { 'select-text block': !this._columnIsResizing, 'bg-red-500': this.value !== this.originalValue }
    inputClassMap = {
        'bg-black w-full bg-green-50 dark:bg-green-950': true,
    }

    override connectedCallback() {
        super.connectedCallback()

        this.originalValue = this.value

        const onColumnResizeEnd = (event: Event) => {
            document.removeEventListener('column-resize-end', onColumnResizeEnd)
            this._columnIsResizing = false
        }

        const onColumnResizeStart = (event: Event) => {
            document.addEventListener('column-resize-end', onColumnResizeEnd)
            this._columnIsResizing = true
        }

        document.addEventListener('column-resize-start', onColumnResizeStart)

        // TODO remove this event listener?
        this.addEventListener('keydown', (event: KeyboardEvent) => {
            // abort changes
            if (event.code === 'Escape') {
                this.value = this.originalValue
                delete this.originalValue
                this.isEditing = false
            }

            // commit changes
            if (event.code === 'Enter' || event.code === 'Tab') {
                // TODO change `originalValue` to be this new value? or leave it as the OG?
                // TODO propogate this change via a bubbling event

                this.isEditing = false
            }
        })
    }

    @state()
    originalValue?: string

    @property({ type: String })
    value?: string

    @state()
    isEditing = false

    protected onDoubleClick() {
        this.isEditing = true
    }

    protected onChange(event: Event) {
        const { value } = event.target as HTMLInputElement
        this.value = value
    }

    // focus and select text
    // stop editing onblur
    updated(changedProps: Map<string, string>) {
        if (changedProps.has('isEditing')) {
            if (this.isEditing) {
                const input = this.shadowRoot?.querySelector('input')
                if (input) {
                    input.select()

                    // TODO remove this event listener
                    input.addEventListener('blur', () => {
                        this.isEditing = false
                    })
                }
            }
        }
    }

    render() {
        // this wrapper <span/> improves the UX when selection text (instead of it selecting blank space below the slot)
        return this.isEditing
            ? html`<input .value="${this.value}" @input="${this.onChange}" @dblclick="${this.onDoubleClick}" class=${classMap(
                  this.inputClassMap
              )}></input>`
            : html`<div
                  @dblclick="${this.onDoubleClick}"
                  class=${classMap({
                      'select-text': !this._columnIsResizing,
                      'select-none': this._columnIsResizing,
                      'bg-yellow-50': this.value !== this.originalValue,
                  })}
              >
                  ${this.value}
              </div>`
    }
}
