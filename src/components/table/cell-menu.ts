import { html, type PropertyValues } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

import { Menu } from '../menu'

@customElement('outerbase-td-menu')
export class CellMenu extends Menu {
    protected override get classMap() {
        return {
            'relative flex items-center justify-between px-cell-padding-x gap-2': true,
            'select-none': !import.meta.env.SSR,
        }
    }

    @state()
    hasMenu = false

    protected firstUpdated(changedProperties: PropertyValues<this>): void {
        super.firstUpdated(changedProperties)

        // delay including menu for cases where JS isn't included / SSR-only
        setTimeout(() => {
            if (!this.hasMenu) this.hasMenu = true
        }, 0)
    }

    protected override render() {
        // @click shows/hides the menu
        // @dblclick prevents parent's dblclick
        // @keydown navigates the menu
        const trigger = this.hasMenu ? html`<span class="font-bold hover:text-blue-500">{}</span>` : null
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
                ${trigger} ${this.listElement}</span
            >
        `
    }
}
