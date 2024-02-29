import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { Theme } from '../../types.js'
import { Menu } from './index.js'

@customElement('outerbase-td-menu')
export class CellMenu extends Menu {
    @property({ attribute: 'left-distance-to-viewport', type: Number })
    public leftDistanceToViewport = -1

    @property({ attribute: 'menu', type: Boolean })
    public hasMenu = false

    // JOHNNY this is unused
    @property({ attribute: 'selectable-text', type: Boolean })
    public selectableText = false

    protected override get menuPositionClasses() {
        const isRenderingInBrowser = typeof window !== 'undefined'
        if (!isRenderingInBrowser) return ''

        // TODO @johnny dynamically determine the size of the menu instead
        const HEIGHT_OF_MENU = 134
        const WIDTH_OF_MENU = 72
        const { left, bottom } = this.getBoundingClientRect()
        const distanceToViewportBottom = window.innerHeight - bottom
        const hasLeftRoom = left - this.leftDistanceToViewport + this.clientWidth >= WIDTH_OF_MENU
        const hasBottomRoom = distanceToViewportBottom - HEIGHT_OF_MENU > 0

        // TODO update this to use the bottom of the table rather than the bottom of the page
        // possibly using table-bounding-rect ?

        // position based on available space
        if (hasLeftRoom && hasBottomRoom) return 'right-0 top-8'
        else if (hasLeftRoom && !hasBottomRoom) return 'right-0 bottom-7'
        else if (!hasLeftRoom && hasBottomRoom) return 'left-0 top-8'
        else return 'left-0 bottom-7'
    }

    protected override render() {
        const darkClass = classMap({ dark: this.theme == Theme.dark })

        // @click shows/hides the menu
        // @dblclick prevents parent's dblclick
        // @keydown navigates the menu

        // TODO @johnny add `tabindex` to #trigger to restore keyboard nav to the cell menu
        // it needs to be conditional whether the menu is open or not or else double tabbing occurs on the table
        return html`
            <span
                class=${classMap({
                    'whitespace-nowrap text-ellipsis': true,
                    'overflow-hidden w-full focus:z-[1] ': true,
                })}
                ><slot></slot
            ></span>
            <span
                id="trigger"
                aria-haspopup="menu"
                class=${darkClass}
                @click=${this.onTrigger}
                @dblclick=${(e: MouseEvent) => e.stopPropagation()}
                @keydown=${this.onKeyDown}
            >
                ${this.listElement}</span
            >
        `
    }
}
