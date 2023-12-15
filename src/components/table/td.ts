import { customElement, property, state } from 'lit/decorators.js'
import { html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'

import { TWStyles } from '../../../tailwind'
import { MutableElement } from '../mutable-element'
import './cell-menu' // <outerbase-td-menu />
import { CellUpdateEvent, type MenuSelectionEvent } from '../../lib/events'
import type { CellMenu } from './cell-menu'

// tl;dr <td/>, table-cell
@customElement('outerbase-td')
export class TableData extends MutableElement {
    static override styles = TWStyles
    protected override get classMap() {
        return {
            'table-cell relative py-cell-padding-y': true,
            'border-theme-border dark:border-theme-border-dark': true,
            'bg-theme-cell dark:bg-theme-cell-dark text-theme-cell-text dark:text-theme-cell-text-dark': true,

            'bg-theme-cell-dirty dark:bg-theme-cell-dirty-dark':
                this.originalValue !== undefined && this.value !== this.originalValue && !this.isEditing, // dirty cells
            // 'max-w-xs': !this.maxWidth, // default max width, unless specified
            [this.maxWidth]: this.maxWidth?.length > 0, // specified max width, if any
            'border-r': this._drawRightBorder, // to avoid both a resize handler + a border
            'first:border-l': this.separateCells, // left/right borders when the `separate-cells` attribute is set
            'border-b': this.withBottomBorder, // bottom border when the `with-bototm-border` attribute is set
            'cursor-pointer': this.value !== undefined && !import.meta.env.SSR,
        }
    }

    // allows, for example, <outerbase-td max-width="max-w-xl" />
    @property({ type: String, attribute: 'max-width' })
    public maxWidth: string = ''

    // allows, for example, <outerbase-td separate-cells="true" />
    @property({ type: Boolean, attribute: 'separate-cells' })
    public separateCells: boolean = false

    // allows, for example, <outerbase-td bottom-border="true" />
    @property({ type: Boolean, attribute: 'bottom-border' })
    public withBottomBorder: boolean = false

    @property({ type: String, attribute: 'sort-by' })
    public sortBy?: string

    @property({ type: String, attribute: 'order-by' })
    public orderBy?: 'ascending' | 'descending'

    @property({ type: Boolean, attribute: 'blank' })
    public blank = false

    @property({ type: Boolean, attribute: 'odd' })
    protected isOdd?: boolean

    @property({ type: Boolean, attribute: 'draw-right-border' })
    private _drawRightBorder = false

    @state()
    protected options = [
        { label: 'Edit', value: 'edit' },
        { label: 'Edit as JSON', value: 'edit:json' },
        { label: 'Copy', value: 'copy' },
        { label: 'Clear', value: 'clear' },
        { label: 'Reset', value: 'reset' },
    ]

    protected onContextMenu(event: MouseEvent) {
        const menu = this.shadowRoot?.querySelector('outerbase-td-menu') as CellMenu | null
        if (menu) {
            event.preventDefault()
            menu.focus()
            menu.open = true
        }
    }

    public override connectedCallback(): void {
        super.connectedCallback()
        this.addEventListener('contextmenu', this.onContextMenu)
    }

    public override disconnectedCallback(): void {
        super.disconnectedCallback()
        this.removeEventListener('contextmenu', this.onContextMenu)
    }

    protected override render() {
        return this.isEditing
            ? html`<input .value=${this.value} @input=${this.onChange} @keydown=${this.onKeyDown} class=${classMap({
                  'z-10 absolute top-0 bottom-0 right-0 left-0 bg-blue-50 dark:bg-blue-950 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900':
                      true,
              })} @blur=${this.onBlur}></input>`
            : this.blank
              ? html`<slot></slot>`
              : html`<!-- providing a non-breaking whitespace to force the content to actually render and be clickable -->
                    <outerbase-td-menu .options=${this.options} @menu-selection=${this.onMenuSelection}
                        >${this.value || html`&nbsp;`}</outerbase-td-menu
                    >`
    }

    protected onMenuSelection(event: MenuSelectionEvent) {
        console.debug('onMenuSelection:', event.value)

        switch (event.value) {
            case 'edit':
                return (this.isEditing = true)
            case 'edit:json':
                return console.warn('TODO @johnny implement JSON editor')
            case 'copy':
                return navigator.clipboard.writeText(this.value ?? '')
            case 'clear':
                this.dispatchEvent(
                    new CellUpdateEvent({
                        position: this.position,
                        previousValue: this.value,
                        value: '',
                    })
                )
                return (this.value = '')
            case 'reset':
                this.dispatchEvent(
                    new CellUpdateEvent({
                        position: this.position,
                        previousValue: this.value,
                        value: this.originalValue,
                    })
                )
                return (this.value = this.originalValue)
        }
    }
}
