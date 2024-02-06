var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { customElement, property } from 'lit/decorators.js';
import { Menu } from '../menu.js';
import { Theme } from '../../types.js';
let CellMenu = class CellMenu extends Menu {
    constructor() {
        super(...arguments);
        this.leftDistanceToViewport = -1;
        this.hasMenu = false;
        this.public = false;
    }
    get menuPositionClasses() {
        const isRenderingInBrowser = typeof window !== 'undefined';
        if (!isRenderingInBrowser)
            return '';
        // TODO @johnny dynamically determine the size of the menu instead
        const HEIGHT_OF_MENU = 134;
        const WIDTH_OF_MENU = 72;
        const { left, bottom } = this.getBoundingClientRect();
        const distanceToViewportBottom = window.innerHeight - bottom;
        const hasLeftRoom = left - this.leftDistanceToViewport + this.clientWidth >= WIDTH_OF_MENU;
        const hasBottomRoom = distanceToViewportBottom - HEIGHT_OF_MENU > 0;
        // TODO update this to use the bottom of the table rather than the bottom of the page
        // possibly using table-bounding-rect ?
        // position based on available space
        if (hasLeftRoom && hasBottomRoom)
            return 'right-0 top-8';
        else if (hasLeftRoom && !hasBottomRoom)
            return 'right-0 bottom-7';
        else if (!hasLeftRoom && hasBottomRoom)
            return 'left-0 top-8';
        else
            return 'left-0 bottom-7';
    }
    render() {
        const darkClass = classMap({ dark: this.theme == Theme.dark });
        // @click shows/hides the menu
        // @dblclick prevents parent's dblclick
        // @keydown navigates the menu
        // const trigger = this.hasMenu ? html`<span class="font-bold focus:z-10">{}</span>` : null
        return html `
            <span
                class=${classMap({
            'whitespace-nowrap text-ellipsis': true,
            'overflow-hidden w-full focus:z-10 ': true,
        })}
                ><slot></slot
            ></span>
            <span
                id="trigger"
                aria-haspopup="menu"
                tabIndex="0"
                class=${darkClass}
                @click=${this.onTrigger}
                @dblclick=${(e) => e.stopPropagation()}
                @keydown=${this.onKeyDown}
            >
                ${this.listElement}</span
            >
        `;
    }
};
__decorate([
    property({ attribute: 'left-distance-to-viewport', type: Number })
], CellMenu.prototype, "leftDistanceToViewport", void 0);
__decorate([
    property({ attribute: 'menu', type: Boolean })
], CellMenu.prototype, "hasMenu", void 0);
__decorate([
    property({ attribute: 'selectable-text', type: Boolean })
], CellMenu.prototype, "public", void 0);
CellMenu = __decorate([
    customElement('outerbase-td-menu')
], CellMenu);
export { CellMenu };
