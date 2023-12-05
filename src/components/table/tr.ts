import { customElement, property } from 'lit/decorators.js'
import { ClassifiedElement } from '../classified-element'

// tl;dr <tr/>, table-row
@customElement('outerbase-tr')
export class TableRow extends ClassifiedElement {
    protected override get classMap() {
        return {
            'table-row odd:bg-theme-row-odd dark:odd:bg-theme-row-odd-dark even:bg-theme-row-even dark:even:bg-theme-row-even-dark': true,
            'bg-theme-column text-theme-column-text dark:text-theme-column-text-dark backdrop-blur-sm': this.isHeaderRow,
            'hover:bg-theme-hover dark:hover:bg-theme-hover-dark': !this.isHeaderRow,
        }
    }

    @property({ type: Boolean, attribute: 'header', reflect: true })
    isHeaderRow: boolean = false
}
