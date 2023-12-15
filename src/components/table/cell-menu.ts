import { html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

import { Menu } from '../menu'

@customElement('outerbase-td-menu')
export class CellMenu extends Menu {
    protected override get classMap() {
        return {
            'relative flex items-center justify-between': true,
            'px-cell-padding-x select-none': true,
        }
    }

    protected override render() {
        // @click shows/hides the menu
        // @dblclick prevents parent's dblclick
        // @keydown navigates the menu

        return html`
            <span
                class=${classMap({
                    'whitespace-nowrap text-ellipsis overflow-hidden max-w-[300px]': true,
                })}
                ><slot></slot
            ></span>
            <span
                id="trigger"
                class="relative"
                aria-haspopup="menu"
                tabIndex="0"
                @click=${this.onTrigger}
                @dblclick=${(e: MouseEvent) => e.stopPropagation()}
                @keydown=${this.onKeyDown}
            >
                <span class="font-bold hover:text-blue-500">{}</span>
                ${this.listElement}</span
            >
        `
    }
}
