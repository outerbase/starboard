import { LitElement, html } from 'lit'
import { TWStyles } from '../../tailwind'

export class OuterbaseTable extends LitElement {
    static styles = TWStyles
    render() {
        return html` <p class="text-yellow-400">This text is yellow.</p> `
    }
}

customElements.define('outerbase-table', OuterbaseTable)
