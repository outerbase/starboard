var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { customElement, property, state } from 'lit/decorators.js';
import { MutableElement } from '../mutable-element.js';
import { CellUpdateEvent } from '../../lib/events.js';
import '../menu/cell-menu.js'; // <outerbase-td-menu />
import { Theme, PluginEvent } from '../../types.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
// tl;dr <td/>, table-cell
let TableData = class TableData extends MutableElement {
    constructor() {
        super(...arguments);
        this.pluginAttributes = '';
        // allows, for example, <outerbase-td max-width="max-w-xl" />
        this.maxWidth = '';
        // allows, for example, <outerbase-td separate-cells="true" />
        this.separateCells = false;
        // allows, for example, <outerbase-td bottom-border="true" />
        this.withBottomBorder = false;
        this.blank = false;
        this._drawRightBorder = false;
        this.isInteractive = false;
        this.hasMenu = false;
        this.isRowSelector = false;
        this.outterBorder = false;
        this.isLastColumn = false;
        this.isLastRow = false;
        this.leftDistanceToViewport = -1;
        this.hideDirt = false;
        this.theme = Theme.light;
        this.options = [
            { label: 'Edit', value: 'edit' },
            { label: 'Copy', value: 'copy' },
            { label: 'Clear', value: 'clear' },
        ];
        this.isDisplayingPluginEditor = false;
    }
    get classMap() {
        return {
            'table-cell relative': true,
            'px-cell-padding-x py-cell-padding-y ': !this.plugin && !this.blank,
            'px-5 py-cell-padding-y': this.blank,
            'border-theme-border dark:border-theme-border-dark': true,
            'bg-theme-cell dark:bg-theme-cell-dark text-theme-cell-text dark:text-theme-cell-text-dark': true,
            'focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none': !this.isEditing && this.isInteractive,
            'bg-theme-cell-dirty dark:bg-theme-cell-dirty-dark': this.dirty && !this.hideDirt, // dirty cells
            [this.maxWidth]: this.maxWidth?.length > 0, // specified max width, if any
            'max-w-64': !this.maxWidth, // default max width, unless specified
            'border-r': this.isInteractive ||
                (this._drawRightBorder && this.separateCells && this.isLastColumn && this.outterBorder) || // include last column when outterBorder
                (this._drawRightBorder && this.separateCells && !this.isLastColumn), // internal cell walls
            'first:border-l': this.separateCells && this.outterBorder, // left/right borders when the `separate-cells` attribute is set
            'border-b': this.withBottomBorder, // bottom border when the `with-bottom-border` attribute is set
            'cursor-pointer': this.isInteractive,
        };
    }
    onContextMenu(event) {
        const menu = this.shadowRoot?.querySelector('outerbase-td-menu');
        if (menu) {
            event.preventDefault();
            menu.focus();
            menu.open = true;
        }
    }
    onPluginEvent({ detail: { action, value } }) {
        // TODO not `.toLowerCase()`? update the enum to match what is emitted?
        const eventName = action.toLowerCase();
        if (eventName === PluginEvent.onEdit) {
            this.isDisplayingPluginEditor = true;
            // TODO add an event listener for clicks outside the plugin to stop editing?
        }
        else if (eventName === PluginEvent.onStopEdit) {
            this.isDisplayingPluginEditor = false;
            // TODO update our value to match the one from the editor
        }
        else if (eventName === PluginEvent.onCancelEdit) {
            this.isDisplayingPluginEditor = false;
        }
        else if (eventName === PluginEvent.updateCell) {
            this.value = value;
            this.dispatchChangedEvent();
        }
    }
    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('contextmenu', this.onContextMenu);
        // @ts-ignore insists on `Event` instead of `PluginActionEvent`
        this.addEventListener('custom-change', this.onPluginEvent);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('contextmenu', this.onContextMenu);
        // @ts-ignore insists on `Event` instead of `PluginActionEvent`
        this.removeEventListener('custom-change', this.onPluginEvent);
    }
    render() {
        const contentWrapperClass = classMap({ 'font-normal': true, dark: this.theme == Theme.dark });
        let cellContents;
        let cellEditorContents;
        if (this.plugin) {
            const { config, tagName } = this.plugin;
            const pluginAsString = unsafeHTML(`<${tagName} cellvalue=${this.value} configuration=${config} ${this.pluginAttributes}></${tagName}>`);
            cellContents = html `${pluginAsString}`;
            if (this.isDisplayingPluginEditor) {
                cellEditorContents = unsafeHTML(`<${tagName.replace('outerbase-plugin-cell', 'outerbase-plugin-editor')} cellvalue=${this.value} configuration=${config} ${this.pluginAttributes}></${tagName}>`);
            }
        }
        else {
            cellContents = html `${this.value || html `<span class="italic text-neutral-400 dark:text-neutral-500">NULL</span>`}`;
        }
        return this.isEditing
            ? // &nbsp; prevents the row from collapsing (in height) when there is only 1 column
                html `<span class=${contentWrapperClass}>&nbsp;<input .value=${this.value} @input=${this.onChange} @keydown=${this.onKeyDown} class=${classMap({
                    'z-10 absolute top-0 bottom-0 right-0 left-0': true,
                    'bg-blue-50 dark:bg-blue-950 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700': true,
                    'px-3 font-normal': true,
                })} @blur=${this.onBlur}></input></span>`
            : this.blank
                ? html `<slot></slot>`
                : html `<!-- providing a non-breaking whitespace to force the content to actually render and be clickable -->
                    <outerbase-td-menu
                        theme=${this.theme}
                        left-distance-to-viewport=${this.leftDistanceToViewport}
                        table-bounding-rect=${this.tableBoundingRect}
                        .options=${this.dirty
                    ? [
                        ...this.options,
                        {
                            label: html `Revert to
                                          <span class="pointer-events-none italic whitespace-nowrap">${this.originalValue}</span>`,
                            value: 'reset',
                        },
                    ]
                    : this.options}
                        ?without-padding=${!!this.plugin}
                        ?menu=${this.hasMenu}
                        ?selectable-text=${!this.isInteractive}
                        @menu-selection=${this.onMenuSelection}
                        ><span class=${contentWrapperClass}>${cellContents}</span
                        ><span class="absolute top-8">${cellEditorContents}</span></outerbase-td-menu
                    >`;
    }
    onMenuSelection(event) {
        switch (event.value) {
            case 'edit':
                return (this.isEditing = true);
            case 'edit:json':
                return console.warn('TODO @johnny implement JSON editor');
            case 'copy':
                return navigator.clipboard.writeText(this.value ?? '');
            case 'clear':
                this.dispatchEvent(new CellUpdateEvent({
                    position: this.position,
                    previousValue: this.value,
                    value: '',
                }));
                return (this.value = '');
            case 'reset':
                this.dispatchEvent(new CellUpdateEvent({
                    position: this.position,
                    previousValue: this.value,
                    value: this.originalValue,
                }));
                return (this.value = this.originalValue);
        }
    }
};
__decorate([
    property({ attribute: 'plugin-attributes', type: String })
], TableData.prototype, "pluginAttributes", void 0);
__decorate([
    property({ type: String, attribute: 'max-width' })
], TableData.prototype, "maxWidth", void 0);
__decorate([
    property({ type: Boolean, attribute: 'separate-cells' })
], TableData.prototype, "separateCells", void 0);
__decorate([
    property({ type: Boolean, attribute: 'bottom-border' })
], TableData.prototype, "withBottomBorder", void 0);
__decorate([
    property({ type: String, attribute: 'sort-by' })
], TableData.prototype, "sortBy", void 0);
__decorate([
    property({ type: String, attribute: 'order-by' })
], TableData.prototype, "orderBy", void 0);
__decorate([
    property({ type: Boolean, attribute: 'blank' })
], TableData.prototype, "blank", void 0);
__decorate([
    property({ type: Boolean, attribute: 'odd' })
], TableData.prototype, "isOdd", void 0);
__decorate([
    property({ type: Boolean, attribute: 'draw-right-border' })
], TableData.prototype, "_drawRightBorder", void 0);
__decorate([
    property({ attribute: 'interactive', type: Boolean })
], TableData.prototype, "isInteractive", void 0);
__decorate([
    property({ type: Boolean, attribute: 'menu' })
], TableData.prototype, "hasMenu", void 0);
__decorate([
    property({ type: Boolean, attribute: 'row-selector' })
], TableData.prototype, "isRowSelector", void 0);
__decorate([
    property({ attribute: 'outer-border', type: Boolean })
], TableData.prototype, "outterBorder", void 0);
__decorate([
    property({ attribute: 'is-last-column', type: Boolean })
], TableData.prototype, "isLastColumn", void 0);
__decorate([
    property({ attribute: 'is-last-row', type: Boolean })
], TableData.prototype, "isLastRow", void 0);
__decorate([
    property({ attribute: 'left-distance-to-viewport', type: Number })
], TableData.prototype, "leftDistanceToViewport", void 0);
__decorate([
    property({ attribute: 'table-bounding-rect', type: String })
], TableData.prototype, "tableBoundingRect", void 0);
__decorate([
    property({ attribute: 'hide-dirt', type: Boolean })
], TableData.prototype, "hideDirt", void 0);
__decorate([
    property({ attribute: 'theme', type: String })
], TableData.prototype, "theme", void 0);
__decorate([
    property({ attribute: 'plugin', type: String })
], TableData.prototype, "plugin", void 0);
__decorate([
    state()
], TableData.prototype, "options", void 0);
__decorate([
    state()
], TableData.prototype, "isDisplayingPluginEditor", void 0);
TableData = __decorate([
    customElement('outerbase-td')
], TableData);
export { TableData };
