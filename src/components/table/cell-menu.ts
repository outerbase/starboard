import { html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { customElement, property } from 'lit/decorators.js'
import { Menu } from '../menu.js'

@customElement('outerbase-td-menu')
export class CellMenu extends Menu {
    protected override get classMap() {
        return {
            'relative flex items-center justify-between px-cell-padding-x gap-2 font-mono font-bold': true,
            'whitespace-nowrap w-full': true,
            'select-none': !this.selectableText,
        }
    }

    @property({ attribute: 'left-distance-to-viewport', type: Number })
    protected leftDistanceToViewport = -1

    // @property({ attribute: 'table-bounding-rect', type: Object })
    // protected tableBoundingRect: DOMRect | undefined

    protected override get menuPositionClasses() {
        const isRenderingInBrowser = typeof window !== 'undefined'
        if (!isRenderingInBrowser) return ''

        const HEIGHT_OF_MENU = 135
        const WIDTH_OF_MENU = 255
        const { left, bottom } = this.getBoundingClientRect()
        const distanceToViewportBottom = window.innerHeight - bottom
        const hasLeftRoom = left - this.leftDistanceToViewport + this.clientWidth >= WIDTH_OF_MENU
        const hasBottomRoom = distanceToViewportBottom - HEIGHT_OF_MENU > 0

        // TODO update this to use the bottom of the table rather than the bottom of the page
        // possibly using table-bounding-rect ?

        // position based on available space
        if (hasLeftRoom && hasBottomRoom) return 'right-0 top-7'
        else if (hasLeftRoom && !hasBottomRoom) return 'right-0 bottom-7'
        else if (!hasLeftRoom && hasBottomRoom) return 'left-0 top-7'
        else return 'left-0 bottom-7'
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
