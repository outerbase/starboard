import { customElement, property, state } from 'lit/decorators.js'
import type { PropertyValueMap } from 'lit'

import { ClassifiedElement } from '../classified-element'

// tl;dr <tr/>, table-row
@customElement('outerbase-tr')
export class TableRow extends ClassifiedElement {
    protected override get classMap() {
        return {
            'table-row': true,

            // when a header
            'text-theme-column-text dark:text-theme-column-text-dark': this.isHeaderRow,

            // when not a header AND not selected
            'odd:bg-theme-row-odd dark:odd:bg-theme-row-odd-dark even:bg-theme-row-even dark:even:bg-theme-row-even-dark hover:bg-theme-row-hover dark:hover:bg-theme-row-hover-dark':
                !this.isHeaderRow && !this.selected,

            // when selected
            'bg-theme-row-selected dark:bg-theme-row-selected-dark hover:bg-theme-row-selected-hover dark:hover:bg-theme-row-selected-hover-dark':
                this.selected,
        }
    }

    @property({ type: Boolean, attribute: 'selected' })
    public selected: boolean = false

    @property({ type: Boolean, attribute: 'header', reflect: true })
    protected isHeaderRow: boolean = false

    @state()
    private hasRenderedOnce = false
    protected override willUpdate(_changedProperties: PropertyValueMap<this>): void {
        super.willUpdate(_changedProperties)
        if (_changedProperties.has('selected') && this.hasRenderedOnce) this.dispatchEvent(new Event('on-selection'))
        if (!this.hasRenderedOnce) this.hasRenderedOnce = true
    }
}
