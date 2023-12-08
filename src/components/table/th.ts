import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { ClassifiedElement } from '../classified-element'
import { ifDefined } from 'lit/directives/if-defined.js'

// import subcomponents
import '../column-resizer'
import { TWStyles } from '../../../tailwind'
import { ColumnRemovedEvent } from '../../lib/events'

// tl;dr <th/>, table-cell
@customElement('outerbase-th')
export class TH extends ClassifiedElement {
    static styles = TWStyles

    protected override get classMap() {
        return {
            'table-cell h-full relative whitespace-nowrap': true,
            'first:border-l border-b border-t border-theme-border dark:border-theme-border-dark': true,
            'px-cell-padding-x py-cell-padding-y pr-2': true,
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

    @property({ attribute: 'name', type: String })
    name = ''

    removeColumn() {
        this.dispatchEvent(
            new ColumnRemovedEvent({
                name: this.name,
            })
        )
    }

    render() {
        const deleteBtn = this.name
            ? html`<span class="text-red-800 hover:text-red-700 active:text-red-600 cursor-pointer" @click=${this.removeColumn}>[x]</span>`
            : null

        const body = html`<span class="flex items-center justify-between">${this.name} ${deleteBtn}</span>`

        // TODO `delete` is appearing when SSR w/o hydration; it shouldn't since there's no JS available to click it
        return this.withResizer
            ? html`<slot></slot>
                  ${body}
                  <column-resizer .column=${this} height="${ifDefined(this.tableHeight)}"></column-resizer>`
            : html`<slot></slot>${body}`
    }
}
