import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { ClassifiedElement } from '../classified-element'
import { ifDefined } from 'lit/directives/if-defined.js'

// import subcomponents
import '../column-resizer'

// tl;dr <th/>, table-cell
@customElement('outerbase-th')
export class TH extends ClassifiedElement {
    protected override get classMap() {
        return {
            'table-cell h-full relative whitespace-nowrap': true,
            'first:border-l border-b last:border-r border-t border-neutral-100 dark:border-neutral-900': true,
            'px-cell-padding-x py-cell-padding-y': true,
            'bg-theme-column dark:bg-theme-column-dark': true,
            // prevent double borders
            'first:border-l': this.withResizer, // omit regular border
            'border-l': !this.withResizer, // use regular border
        }
    }

    @property({ attribute: 'table-height', type: Number })
    tableHeight?: number

    @property({ attribute: 'with-resizer', type: Boolean })
    withResizer = false

    @property({ attribute: 'is-last', type: Boolean })
    isLastColumn = false

    render() {
        return this.withResizer && !this.isLastColumn
            ? html`<slot></slot><column-resizer .column=${this} height="${ifDefined(this.tableHeight)}"></column-resizer>`
            : html`<slot></slot>`
    }
}
