import { customElement, property } from 'lit/decorators.js'

import { Menu } from '../menu.js'

@customElement('outerbase-th-menu')
export class ColumnMenu extends Menu {
    @property({ attribute: 'left-distance-to-viewport', type: Number })
    protected leftDistanceToViewport = -1

    protected override get classMap() {
        return {
            ...super.classMap,
        }
    }

    protected override get menuPositionClasses() {
        const isRenderingInBrowser = typeof window !== 'undefined'
        if (!isRenderingInBrowser) return ''

        const HEIGHT_OF_MENU = 234
        const WIDTH_OF_MENU = 142
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
}
