import { LitElement, html } from 'lit'
import { TWStyles } from '../../tailwind'
import { customElement } from 'lit/decorators.js'

@customElement('outerbase-table')
export class OuterbaseTable extends LitElement {
    static styles = TWStyles
    render() {
        return html` <p class="text-yellow-400">This text is yellow.</p> `
    }
}
