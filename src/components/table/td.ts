import { html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { customElement, property, state } from 'lit/decorators.js'

import { TWStyles } from '../../../tailwind/index.js'
import { MutableElement } from '../mutable-element.js'
import { CellUpdateEvent, type MenuSelectedEvent } from '../../lib/events.js'

import './cell-menu.js' // <outerbase-td-menu />
import type { CellMenu } from './cell-menu.js'

// tl;dr <td/>, table-cell
@customElement('outerbase-td')
export class TableData extends MutableElement {
    static override styles = TWStyles
    protected override get classMap() {
        return {
            'table-cell relative py-cell-padding-y ': true,
            'border-theme-border dark:border-theme-border-dark': true,
            'bg-theme-cell dark:bg-theme-cell-dark text-theme-cell-text dark:text-theme-cell-text-dark': true,
            'focus:ring-2 focus:ring-black dark:focus:ring-white focus:z-10 focus:outline-none': !this.isEditing,

            'bg-theme-cell-dirty dark:bg-theme-cell-dirty-dark':
                this.originalValue !== undefined && this.value !== this.originalValue && !this.isEditing, // dirty cells
            [this.maxWidth]: this.maxWidth?.length > 0, // specified max width, if any
            'max-w-64': !this.maxWidth, // default max width, unless specified
            'border-r':
                this.isInteractive ||
                (this._drawRightBorder && this.separateCells && this.isLastColumn && this.outterBorder) || // include last column when outterBorder
                (this._drawRightBorder && this.separateCells && !this.isLastColumn), // internal cell walls
            'first:border-l': this.separateCells && this.outterBorder, // left/right borders when the `separate-cells` attribute is set
            'border-b': this.withBottomBorder && ((this.isLastRow && this.outterBorder) || !this.isLastRow), // bottom border when the `with-bottom-border` attribute is set
            'cursor-pointer': this.isInteractive,
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

    @property({ attribute: 'interactive', type: Boolean })
    isInteractive = false

    @property({ type: Boolean, attribute: 'menu' })
    private hasMenu = false

    @property({ type: Boolean, attribute: 'row-selector' })
    isRowSelector = false

    @property({ attribute: 'outter-border', type: Boolean })
    public outterBorder = false

    @property({ attribute: 'is-last-column', type: Boolean })
    protected isLastColumn = false

    @property({ attribute: 'is-last-row', type: Boolean })
    protected isLastRow = false

    @property({ attribute: 'left-distance-to-viewport', type: Number })
    protected leftDistanceToViewport = -1

    @property({ attribute: 'table-bounding-rect', type: String })
    protected tableBoundingRect: string | undefined // we skip having `JSON.parse` run by treating it as a string

    @state()
    protected options = [
        { label: 'Edit', value: 'edit' },
        // { label: 'Edit as JSON', value: 'edit:json' },
        { label: 'Copy', value: 'copy' },
        { label: 'Clear', value: 'clear' },
    ]

    override tabIndex = 0

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
            ? // &nbsp; prevents the row from collapsing (in height) when there is only 1 column
              html`&nbsp;<input .value=${this.value} @input=${this.onChange} @keydown=${this.onKeyDown} class=${classMap({
                  'z-10 absolute top-0 bottom-0 right-0 left-0': true,
                  'bg-blue-50 dark:bg-blue-950 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700': true,
                  'font-mono px-3': true,
              })} @blur=${this.onBlur}></input>`
            : this.blank
              ? html`<slot></slot>`
              : html`<!-- providing a non-breaking whitespace to force the content to actually render and be clickable -->
                    <outerbase-td-menu
                        ?menu=${this.hasMenu}
                        ?selectable-text=${!this.isInteractive}
                        .options=${this.dirty
                            ? [
                                  ...this.options,
                                  {
                                      label: html`Revert to
                                          <span class="pointer-events-none italic whitespace-nowrap">${this.originalValue}</span>`,
                                      value: 'reset',
                                  },
                              ]
                            : this.options}
                        @menu-selection=${this.onMenuSelection}
                        left-distance-to-viewport=${this.leftDistanceToViewport}
                        table-bounding-rect=${this.tableBoundingRect}
                        ><span class="font-normal"
                            >${this.value || html`<span class="italic text-neutral-400 dark:text-neutral-500">NULL</span>`}</span
                        ></outerbase-td-menu
                    >`
    }

    protected onMenuSelection(event: MenuSelectedEvent) {
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
