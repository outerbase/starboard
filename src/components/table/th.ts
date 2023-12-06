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
            // 'select-text': true, // allow text selection, but need to only apply this while a column is NOT resizing
            'first:border-l border-b last:border-r border-t border-neutral-100 dark:border-neutral-900': true,
            'table-cell h-full relative px-cell-padding-x py-cell-padding-y whitespace-nowrap px-theme-cell-padding py-1 bg-theme-column dark:bg-theme-column-dark':
                true,
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
