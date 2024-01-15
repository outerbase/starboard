import { html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { customElement, property } from 'lit/decorators.js'

import { Menu } from '../menu.js'

@customElement('outerbase-td-menu')
export class CellMenu extends Menu {
    protected override get classMap() {
        return {
            'relative flex items-center justify-between px-cell-padding-x gap-2 font-mono font-bold': true,
            'select-none': !this.selectableText,
        }
    }

    @property({ attribute: 'menu', type: Boolean })
    hasMenu = false

    @property({ attribute: 'selectable-text', type: Boolean })
    selectableText = false

    protected override render() {
        // @click shows/hides the menu
        // @dblclick prevents parent's dblclick
        // @keydown navigates the menu
        // const trigger = this.hasMenu ? html`<span class="font-bold focus:z-10">{}</span>` : null
        return html`
            <span
                class=${classMap({
                    'whitespace-nowrap text-ellipsis overflow-hidden font-mono w-full': true,
                    'focus:z-10': true,
                })}
                ><slot></slot
            ></span>
            <span
                id="trigger"
                class="relative"
                aria-haspopup="menu"
                @click=${this.onTrigger}
                @dblclick=${(e: MouseEvent) => e.stopPropagation()}
                @keydown=${this.onKeyDown}
            >
                ${this.listElement}</span
            >
        `
    }
}
