var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { customElement, property } from 'lit/decorators.js';
import { Menu } from '../menu.js';
let ColumnMenu = class ColumnMenu extends Menu {
    constructor() {
        super(...arguments);
        this.leftDistanceToViewport = -1;
    }
    get menuPositionClasses() {
        const isRenderingInBrowser = typeof window !== 'undefined';
        if (!isRenderingInBrowser)
            return '';
        const HEIGHT_OF_MENU = 234;
        const WIDTH_OF_MENU = 142;
        const { left, bottom } = this.getBoundingClientRect();
        const distanceToViewportBottom = window.innerHeight - bottom;
        const hasLeftRoom = left - this.leftDistanceToViewport + this.clientWidth >= WIDTH_OF_MENU;
        const hasBottomRoom = distanceToViewportBottom - HEIGHT_OF_MENU > 0;
        // TODO update this to use the bottom of the table rather than the bottom of the page
        // possibly using table-bounding-rect ?
        // position based on available space
        if (hasLeftRoom && hasBottomRoom)
            return 'right-0 top-7';
        else if (hasLeftRoom && !hasBottomRoom)
            return 'right-0 bottom-7';
        else if (!hasLeftRoom && hasBottomRoom)
            return 'left-0 top-7';
        else
            return 'left-0 bottom-7';
    }
};
__decorate([
    property({ attribute: 'left-distance-to-viewport', type: Number })
], ColumnMenu.prototype, "leftDistanceToViewport", void 0);
ColumnMenu = __decorate([
    customElement('outerbase-th-menu')
], ColumnMenu);
export { ColumnMenu };
