import { customElement, property } from 'lit/decorators.js'
import { ClassifiedElement } from '../classified-element'

// tl;dr <tr/>, table-row
@customElement('outerbase-tr')
export class TableRow extends ClassifiedElement {
    protected override get classMap() {
        return {
            'table-row': true,
            'bg-white/80 border-b-neutral-200 backdrop-blur-sm': this.isHeaderRow,
            'hover:bg-neutral-300/10': !this.isHeaderRow,
        }
    }

    @property({ type: Boolean, attribute: 'header', reflect: true })
    isHeaderRow: boolean = false
}
