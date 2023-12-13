import { customElement, property } from 'lit/decorators.js'
import { html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'

import { TWStyles } from '../../../tailwind'
import { MutableElement } from '../mutable-element'

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
            'cursor-pointer': this.value !== undefined,
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

    @property({ type: Boolean, attribute: 'odd' })
    protected isOdd?: boolean

    @property({ type: Boolean, attribute: 'no-text' })
    protected suppressNbsp = false

    @property({ type: Boolean, attribute: 'draw-right-border' })
    private _drawRightBorder = false

    protected override render() {
        return this.isEditing
            ? html`<input .value=${this.value} @input=${this.onChange} @keydown=${this.onKeyDown} class=${classMap({
                  'z-10 absolute top-0 bottom-0 right-0 left-0 bg-blue-50 dark:bg-blue-950 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900':
                      true,
              })} @blur=${this.onBlur}></input>`
            : html`<div
                  class=${classMap({
                      'whitespace-nowrap text-ellipsis overflow-hidden max-w-[400px]': true,
                      'min-w-[200px]': (this.value?.length ?? 0) > 0,
                  })}
              >
                  <!-- providing a non-breaking whitespace to force the content to actually render and be clickable -->
                  <span class="px-cell-padding-x">${this.suppressNbsp ? null : this.value || html`&nbsp;`}</span>
                  <slot></slot>
              </div>`
    }
}
