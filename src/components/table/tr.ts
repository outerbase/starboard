import { customElement, property } from 'lit/decorators.js'
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
            'odd:bg-theme-row-odd dark:odd:bg-theme-row-odd-dark even:bg-theme-row-even dark:even:bg-theme-row-even-dark hover:bg-theme-hover dark:hover:bg-theme-hover-dark':
                !this.isHeaderRow && !this.selected && !this.dirty,

            // when selected
            'bg-theme-row-selected dark:bg-theme-row-selected-dark hover:bg-theme-row-selected-hover dark:hover:bg-theme-row-selected-hover-dark':
                this.selected,

            // when dirty
            'bg-yellow-50 dark:bg-yellow-950 hover:bg-yellow-100 hover:dark:bg-yellow-900': this.dirty,
        }
    }

    @property({ type: Boolean, attribute: 'header', reflect: true })
    isHeaderRow: boolean = false

    @property({ type: Boolean, attribute: 'selected' })
    selected: boolean = false

    @property({ type: Boolean, attribute: 'dirty' })
    dirty = false
}
