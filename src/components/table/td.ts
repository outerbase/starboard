import { customElement, property, state } from 'lit/decorators.js'
import { ClassifiedElement } from '../classified-element'
import { html } from 'lit'

// tl;dr <td/>, table-cell
@customElement('outerbase-td')
export class TableData extends ClassifiedElement {
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
            'select-text': !this._columnIsResizing,
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

    override connectedCallback() {
        super.connectedCallback()

        const onColumnResizeEnd = (event: Event) => {
            document.removeEventListener('column-resize-end', onColumnResizeEnd)
            this._columnIsResizing = false
        }

        const onColumnResizeStart = (event: Event) => {
            document.addEventListener('column-resize-end', onColumnResizeEnd)
            this._columnIsResizing = true
        }

        document.addEventListener('column-resize-start', onColumnResizeStart)
    }

    render() {
        return html`<slot></slot>`
    }
}
