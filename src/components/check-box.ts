import { LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { CheckMark } from '../lib/icons/check-mark.js'
import { TWStyles } from '../../tailwind/index.js'
import { Theme } from '../types.js'
import { classMap } from 'lit/directives/class-map.js'

@customElement('check-box')
export class CustomCheckbox extends LitElement {
    static styles = TWStyles
    static checkedTemplate = html`<span
        class="bg-black dark:bg-white text-white dark:text-black flex items-center justify-center w-4 h-4 p-0.5 rounded-md"
        >${CheckMark(16)}</span
    >`
    static uncheckedTemplate = html`<span class="w-4 h-4 border border-neutral-500 rounded-md"></span>`

    @property({ type: Boolean }) checked = false
    @property({ type: String }) theme = Theme.light

    toggleCheckbox() {
        this.checked = !this.checked
    }

    render() {
        const classes = classMap({
            'flex items-center cursor-pointer': true,
            dark: this.theme == Theme.dark,
        })
        return html`
            <div class=${classes} @click="${this.toggleCheckbox}">
                ${this.checked ? CustomCheckbox.checkedTemplate : CustomCheckbox.uncheckedTemplate}
                <input type="checkbox" ?checked="${this.checked}" @change="${this.toggleCheckbox}" class="hidden" />
            </div>
        `
    }
}
