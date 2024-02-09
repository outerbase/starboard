var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { customElement, property, state } from 'lit/decorators.js';
// import subcomponents
import '../column-resizer-element.js';
import { MutableElement } from '../mutable-element.js';
import { classMap } from 'lit/directives/class-map.js';
import { ColumnHiddenEvent, ColumnPluginActivatedEvent, ColumnPluginDeactivatedEvent, ColumnRemovedEvent, ColumnRenameEvent, ColumnUpdatedEvent, } from '../../lib/events.js';
import '../menu/column-menu.js'; // <outerbase-th-menu />
import { Theme } from '../../types.js';
import { CaretRight } from '../../lib/icons/caret-right.js';
// tl;dr <th/>, table-cell
let TH = class TH extends MutableElement {
    constructor() {
        super(...arguments);
        this.withResizer = false;
        this.outerBorder = false;
        this.value = '';
        this.installedPlugins = {};
        this.blank = false;
        this.isLastColumn = false;
        // allows, for example, <outerbase-td separate-cells="true" />
        this.separateCells = false;
        this.hasMenu = false;
        this.isInteractive = false;
        this.options = [
            {
                label: 'Sort A-Z',
                value: 'sort:alphabetical:ascending',
            },
            {
                label: 'Sort Z-A',
                value: 'sort:alphabetical:descending',
            },
            {
                label: 'Hide Column',
                value: 'hide',
            },
            {
                label: 'Rename Column',
                value: 'rename',
            },
            {
                label: 'Delete Column',
                value: 'delete',
                classes: 'text-red-600',
            },
        ];
        this._options = [];
        this._pluginOptions = [];
        this.distanceToLeftViewport = -1;
        this.theme = Theme.light;
    }
    get classMap() {
        return {
            'table-cell relative whitespace-nowrap h-[38px]': true, // h-[38px] was added to preserve the height when toggling to <input />
            'border-b border-theme-border dark:border-theme-border-dark': true,
            'first:border-l border-t': this.outerBorder,
            'px-cell-padding-x py-cell-padding-y': true,
            'bg-theme-column dark:bg-theme-column-dark': !this.dirty,
            'bg-theme-cell-dirty dark:bg-theme-cell-dirty-dark': this.dirty,
            'select-none': this.hasMenu, // this is really about handling SSR without hydration; TODO use a better flag?
            // prevent double borders
            'border-r': (!this.withResizer && this.isLastColumn && this.outerBorder) ||
                (!this.withResizer && this.separateCells && !this.isLastColumn),
            'cursor-pointer': this.isInteractive,
            dark: this.theme == Theme.dark,
        };
    }
    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('contextmenu', this.onContextMenu);
    }
    disconnectedCallback() {
        super.disconnectedCallback;
        this.removeEventListener('contextmenu', this.onContextMenu);
    }
    willUpdate(_changedProperties) {
        super.willUpdate(_changedProperties);
        if (_changedProperties.has('plugins')) {
            const withoutDefault = this.plugins?.filter((p) => !p.isDefault) ?? [];
            this._pluginOptions =
                withoutDefault.map((plugin) => ({
                    label: plugin.displayName,
                    value: plugin.tagName,
                })) ?? [];
        }
    }
    firstUpdated(_changedProperties) {
        const width = parseInt(window.getComputedStyle(this).width, 10);
        this.style.width = `${width}px`;
    }
    render() {
        const name = this.originalValue ?? this.value;
        const hasPlugin = typeof this.installedPlugins?.[name] !== 'undefined' && !this.installedPlugins?.[name]?.isDefaultPlugin;
        const options = this.dirty
            ? [
                ...this.options,
                {
                    label: html `Revert to <span class="pointer-events-none italic whitespace-nowrap">${this.originalValue}</span>`,
                    value: 'reset',
                },
            ]
            : [...this.options];
        if (this._pluginOptions.length > 0) {
            options.splice(2, 0, hasPlugin
                ? {
                    label: html `<span class="italic">Remove Plugin</span> `,
                    value: 'uninstall-column-plugin',
                }
                : {
                    label: html `<div class="flex items-center justify-between">Plugins ${CaretRight(16)}</div>`,
                    value: 'plugins',
                    options: this._pluginOptions,
                });
        }
        const blankElementClasses = {
            'absolute top-0 bottom-0 right-0 left-0': true,
            dark: this.theme == Theme.dark,
        };
        const resultContainerClasses = {
            dark: this.theme == Theme.dark,
        };
        if (this.blank) {
            // an element to preserve the right-border
            return html `<div class=${classMap(blankElementClasses)}></div> `;
        }
        else {
            const body = this.isEditing
                ? html `<input .value=${this.value} @input=${this.onChange} @keydown=${this.onKeyDown} class=${classMap({
                    'z-10 absolute top-0 bottom-0 right-0 left-0': true,
                    'bg-blue-50 dark:bg-blue-950 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900': true,
                    'px-cell-padding-x font-normal': true,
                })} @blur=${this.onBlur}></input>`
                : this.hasMenu
                    ? html `<outerbase-th-menu
                        theme=${this.theme}
                        .options=${options}
                        @menu-selection=${this.onMenuSelection}
                        left-distance-to-viewport=${this.distanceToLeftViewport}
                        ><span class="font-normal">${this.value}</span></outerbase-th-menu
                    >`
                    : html `<span class="font-normal">${this.value}</span>`;
            return this.withResizer
                ? html `<span class=${classMap(resultContainerClasses)}
                      ><slot></slot>
                      ${body}
                      <column-resizer .column=${this} height="${ifDefined(this.tableHeight)}" theme=${this.theme}></column-resizer
                  ></span>`
                : html `<span class=${classMap(resultContainerClasses)}><slot></slot>${body}</span>`;
        }
    }
    dispatchChangedEvent() {
        if (!this.originalValue)
            throw new Error('missing OG value');
        this.dispatchEvent(new ColumnRenameEvent({
            name: this.originalValue,
            data: { name: this.value },
        }));
    }
    removeColumn() {
        if (!this.originalValue)
            throw new Error('missing OG value');
        this.dispatchEvent(new ColumnRemovedEvent({
            name: this.originalValue,
        }));
    }
    hideColumn() {
        if (!this.originalValue)
            throw new Error('missing OG value');
        this.dispatchEvent(new ColumnHiddenEvent({
            name: this.originalValue,
        }));
    }
    onMenuSelection(event) {
        event.stopPropagation();
        let dispatchColumnUpdateEvent = false;
        const columnName = this.originalValue ?? this.value;
        // handle (potential) plugin selection
        const plugin = this.plugins?.find(({ tagName }) => event.value === tagName);
        if (plugin) {
            return this.dispatchEvent(new ColumnPluginActivatedEvent(columnName, { ...plugin, columnName: this.value }));
        }
        // look for the 'none' plugin and delete installed column plugin as a result when chosen
        if (event.value === 'uninstall-column-plugin') {
            // starboard can immediately update it's state
            // dashboard will also receive this event
            const name = this.originalValue ?? this.value;
            const installedPlugin = this.installedPlugins[name];
            if (!installedPlugin)
                throw new Error(`Attempting to uninstall a non-existent plugin: ${name}`);
            this.dispatchEvent(new ColumnPluginDeactivatedEvent(columnName, installedPlugin));
        }
        switch (event.value) {
            case 'hide':
                return this.hideColumn();
            case 'rename':
                return (this.isEditing = true);
            case 'delete':
                return this.removeColumn();
            case 'reset':
                this.dispatchEvent(new ColumnRenameEvent({
                    name: this.originalValue ?? '',
                    data: { value: this.value },
                }));
                return (this.value = this.originalValue ?? '');
            default:
                // intentionally let other (e.g. sorting) events pass-through to parent
                dispatchColumnUpdateEvent = true;
        }
        if (dispatchColumnUpdateEvent) {
            this.dispatchEvent(new ColumnUpdatedEvent({
                name: this.originalValue ?? this.value,
                data: { action: event.value },
            }));
        }
    }
    onContextMenu(event) {
        const menu = this.shadowRoot?.querySelector('outerbase-th-menu');
        if (menu) {
            event.preventDefault();
            menu.focus();
            menu.open = true;
        }
    }
};
__decorate([
    property({ attribute: 'table-height', type: Number })
], TH.prototype, "tableHeight", void 0);
__decorate([
    property({ attribute: 'with-resizer', type: Boolean })
], TH.prototype, "withResizer", void 0);
__decorate([
    property({ attribute: 'outer-border', type: Boolean })
], TH.prototype, "outerBorder", void 0);
__decorate([
    property({ attribute: 'name', type: String })
], TH.prototype, "value", void 0);
__decorate([
    property({ attribute: 'plugins', type: Array })
], TH.prototype, "plugins", void 0);
__decorate([
    property({ attribute: 'installed-plugins', type: Object })
], TH.prototype, "installedPlugins", void 0);
__decorate([
    property({ type: Boolean, attribute: 'blank' })
], TH.prototype, "blank", void 0);
__decorate([
    property({ attribute: 'is-last', type: Boolean })
], TH.prototype, "isLastColumn", void 0);
__decorate([
    property({ type: Boolean, attribute: 'separate-cells' })
], TH.prototype, "separateCells", void 0);
__decorate([
    property({ attribute: 'menu', type: Boolean })
], TH.prototype, "hasMenu", void 0);
__decorate([
    property({ attribute: 'interactive', type: Boolean })
], TH.prototype, "isInteractive", void 0);
__decorate([
    property({ attribute: 'options', type: Array })
], TH.prototype, "options", void 0);
__decorate([
    state()
], TH.prototype, "_options", void 0);
__decorate([
    state()
], TH.prototype, "_pluginOptions", void 0);
__decorate([
    property({ attribute: 'left-distance-to-viewport', type: Number })
], TH.prototype, "distanceToLeftViewport", void 0);
__decorate([
    property({ attribute: 'theme', type: String })
], TH.prototype, "theme", void 0);
TH = __decorate([
    customElement('outerbase-th')
], TH);
export { TH };
