import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { ClassifiedElement } from '../classified-element'
import { ifDefined } from 'lit/directives/if-defined.js'

// tl;dr <th/>, table-cell
@customElement('outerbase-th')
export class TH extends ClassifiedElement {
    protected override get classMap() {
        return {
            // 'select-text': true, // allow text selection, but need to only apply this while a column is NOT resizing
            'shadow-sm table-cell relative first:border-l border-b last:border-r border-t whitespace-nowrap p-1.5': true,
            // prevent double borders
            'first:border-l': this.withResizer, // omit regular border
            'border-l': !this.withResizer, // use regular border
        }
    }

    @property({ attribute: 'table-height', type: Number })
    tableHeight?: number

    @property({ attribute: 'with-resizer', type: Boolean })
    withResizer = false

    render() {
        return this.withResizer
            ? html`<slot></slot><column-resizer .column=${this} height="${ifDefined(this.tableHeight)}"></column-resizer>`
            : html`<slot></slot>`
    }
}
