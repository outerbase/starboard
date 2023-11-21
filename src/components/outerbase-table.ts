import { LitElement, html, css } from 'lit'
import { TWStyles } from '../../tailwind'
import { customElement } from 'lit/decorators.js'

@customElement('outerbase-table')
export class OuterbaseTable extends LitElement {
    static styles = [css``, TWStyles]
    render() {
        return html`
            <p class="text-theme-primary bg-theme-secondary">
                What did one snowman say to the other snowman?
            </p>
        `
    }
}
