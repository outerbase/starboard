import { html, type PropertyValueMap, type PropertyValues } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import { customElement, property, state } from 'lit/decorators.js'

// import subcomponents
import '../column-resizer-element.js'
import { MutableElement } from '../mutable-element.js'
import { classMap } from 'lit/directives/class-map.js'
import {
    ColumnHiddenEvent,
    ColumnPluginActivatedEvent,
    ColumnPluginDeactivatedEvent,
    ColumnRemovedEvent,
    ColumnRenameEvent,
    ColumnUpdatedEvent,
    MenuSelectedEvent,
    ResizeEvent,
} from '../../lib/events.js'
import '../menu/column-menu.js' // <outerbase-th-menu />
import type { ColumnMenu } from '../menu/column-menu.js'
import type { HeaderMenuOptions, ColumnPlugin, PluginWorkspaceInstallationId } from '../../types.js'
import { Theme } from '../../types.js'
import { CaretRight } from '../../lib/icons/caret-right.js'

// tl;dr <th/>, table-cell
@customElement('outerbase-th')
export class TH extends MutableElement {
    protected override get classMap() {
        return {
            'table-cell relative whitespace-nowrap h-[38px]': true, // h-[38px] was added to preserve the height when toggling to <input />
            'border-b border-theme-border dark:border-theme-border-dark': true,
            'first:border-l border-t': this.outerBorder,
            'px-cell-padding-x py-cell-padding-y': true,
            'bg-theme-column dark:bg-theme-column-dark': !this.dirty,
            'bg-theme-cell-dirty dark:bg-theme-cell-dirty-dark': this.dirty,
            'select-none': this.hasMenu, // this is really about handling SSR without hydration; TODO use a better flag?
            // prevent double borders
            'border-r':
                (!this.withResizer && this.isLastColumn && this.outerBorder) ||
                (!this.withResizer && this.separateCells && !this.isLastColumn),
            'cursor-pointer': this.isInteractive,
            dark: this.theme == Theme.dark,
        }
    }

    @property({ attribute: 'table-height', type: Number })
    public tableHeight?: number

    @property({ attribute: 'with-resizer', type: Boolean })
    public withResizer = false

    @property({ attribute: 'outer-border', type: Boolean })
    public outerBorder = false

    @property({ attribute: 'name', type: String })
    public override value = ''

    @property({ attribute: 'plugins', type: Array })
    public plugins?: Array<ColumnPlugin>

    @property({ attribute: 'installed-plugins', type: Object })
    public installedPlugins: Record<string, PluginWorkspaceInstallationId | undefined> = {}

    @property({ type: Boolean, attribute: 'blank' })
    public blank = false

    @property({ attribute: 'is-last', type: Boolean })
    protected isLastColumn = false

    // allows, for example, <outerbase-td separate-cells="true" />
    @property({ type: Boolean, attribute: 'separate-cells' })
    public separateCells: boolean = false

    @property({ attribute: 'menu', type: Boolean })
    hasMenu = false

    @property({ attribute: 'options', type: Array })
    options: HeaderMenuOptions = [
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
    ]

    @state()
    private _previousWidth = 0

    @state()
    protected _options: HeaderMenuOptions = []

    @state()
    protected _pluginOptions: HeaderMenuOptions = []

    @property({ attribute: 'left-distance-to-viewport', type: Number })
    protected distanceToLeftViewport = -1

    @property({ attribute: 'theme', type: Number })
    public theme = Theme.light

    public override connectedCallback(): void {
        super.connectedCallback()
        this.addEventListener('contextmenu', this.onContextMenu)
    }

    public override disconnectedCallback(): void {
        super.disconnectedCallback
        this.removeEventListener('contextmenu', this.onContextMenu)
    }

    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        if (this.width && this.style) {
            this.style.minWidth = this.width
            this.style.maxWidth = this.width
        }
    }

    protected override willUpdate(_changedProperties: PropertyValues<this>) {
        super.willUpdate(_changedProperties)

        if (_changedProperties.has('plugins')) {
            const withoutDefault = this.plugins?.filter((p) => !p.isDefault) ?? []
            this._pluginOptions =
                withoutDefault.map((plugin) => ({
                    label: plugin.displayName,
                    value: plugin.tagName,
                })) ?? []
        }

        if (_changedProperties.has('width') && this.style) {
            if (this.width) {
                this.style.width = this.width
            }
        }

        if (_changedProperties.has('width')) {
            if (this.width && this.style) {
                this.style.minWidth = this.width
                this.style.maxWidth = this.width
            }
        }
    }

    protected override render() {
        const name = this.originalValue ?? this.value
        const hasPlugin = typeof this.installedPlugins?.[name] !== 'undefined' && !this.installedPlugins?.[name]?.isDefaultPlugin
        const options = this.dirty
            ? [
                  ...this.options,
                  {
                      label: html`Revert to <span class="pointer-events-none italic whitespace-nowrap">${this.originalValue}</span>`,
                      value: 'reset',
                  },
              ]
            : [...this.options]

        if (this._pluginOptions.length > 0) {
            options.splice(
                2,
                0,
                hasPlugin
                    ? {
                          label: html`<span class="">Remove Plugin</span> `,
                          value: 'uninstall-column-plugin',
                      }
                    : {
                          label: html`<div class="flex items-center justify-between">Plugins ${CaretRight(16)}</div>`,
                          value: 'plugins',
                          options: this._pluginOptions,
                      }
            )
        }

        const blankElementClasses = {
            'absolute top-0 bottom-0 right-0 left-0': true,
            dark: this.theme == Theme.dark,
        }
        const resultContainerClasses = {
            dark: this.theme == Theme.dark,
        }

        if (this.blank) {
            // an element to preserve the right-border
            return html`<div class=${classMap(blankElementClasses)}></div> `
        } else {
            const body = this.isEditing
                ? html`<input .value=${this.value} @input=${this.onChange} @keydown=${this.onKeyDown} class=${classMap({
                      'z-10 absolute top-0 bottom-0 right-0 left-0': true,
                      'bg-blue-50 dark:bg-blue-950 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700': true,
                      'px-cell-padding-x font-normal': true,
                  })} @blur=${this.onBlur}></input>`
                : this.hasMenu
                  ? html`<outerbase-th-menu
                        theme=${this.theme}
                        .options=${options}
                        @menu-selection=${this.onMenuSelection}
                        left-distance-to-viewport=${this.distanceToLeftViewport}
                        ><span class="font-normal">${this.value}</span></outerbase-th-menu
                    >`
                  : html`<span class="font-normal">${this.value}</span>`

            return this.withResizer
                ? html`<span class=${classMap(resultContainerClasses)}
                      ><slot></slot>
                      ${body}
                      <column-resizer
                          .column=${this}
                          height="${ifDefined(this.tableHeight)}"
                          theme=${this.theme}
                          @resize-start=${() => {
                              // remove the suffix `px` from width and convert to a number
                              // JOHNNY probably revert to storing the number??
                              this._previousWidth = this.width ? +this.width.slice(0, -2) : 0
                          }}
                          @resize=${({ delta }: ResizeEvent) => {
                              this.width = `${this._previousWidth + delta}px`
                              this.style.width = this.width
                          }}
                      ></column-resizer
                  ></span>`
                : html`<span class=${classMap(resultContainerClasses)}><slot></slot>${body}</span>`
        }
    }

    protected override dispatchChangedEvent() {
        if (!this.originalValue) throw new Error('missing OG value')

        this.dispatchEvent(
            new ColumnRenameEvent({
                name: this.originalValue,
                data: { name: this.value },
            })
        )
    }

    protected removeColumn() {
        if (!this.originalValue) throw new Error('missing OG value')

        this.dispatchEvent(
            new ColumnRemovedEvent({
                name: this.originalValue,
            })
        )
    }

    protected hideColumn() {
        if (!this.originalValue) throw new Error('missing OG value')

        this.dispatchEvent(
            new ColumnHiddenEvent({
                name: this.originalValue,
            })
        )
    }

    protected onMenuSelection(event: MenuSelectedEvent) {
        event.stopPropagation()
        let dispatchColumnUpdateEvent = false

        const columnName = this.originalValue ?? this.value

        // handle (potential) plugin selection
        const plugin = this.plugins?.find(({ tagName }) => event.value === tagName)
        if (plugin) {
            return this.dispatchEvent(new ColumnPluginActivatedEvent(columnName, { ...plugin, columnName: this.value }))
        }

        // look for the 'none' plugin and delete installed column plugin as a result when chosen
        if (event.value === 'uninstall-column-plugin') {
            // starboard can immediately update it's state
            // dashboard will also receive this event

            const name = this.originalValue ?? this.value
            const installedPlugin = this.installedPlugins[name]
            if (!installedPlugin) throw new Error(`Attempting to uninstall a non-existent plugin: ${name}`)

            this.dispatchEvent(new ColumnPluginDeactivatedEvent(columnName, installedPlugin))
        }

        switch (event.value) {
            case 'hide':
                return this.hideColumn()
            case 'rename':
                return (this.isEditing = true)
            case 'delete':
                return this.removeColumn()
            case 'reset':
                this.dispatchEvent(
                    new ColumnRenameEvent({
                        name: this.originalValue ?? '',
                        data: { value: this.value },
                    })
                )
                return (this.value = this.originalValue ?? '')
            default:
                // intentionally let other (e.g. sorting) events pass-through to parent
                dispatchColumnUpdateEvent = true
        }

        if (dispatchColumnUpdateEvent) {
            this.dispatchEvent(
                new ColumnUpdatedEvent({
                    name: this.originalValue ?? this.value,
                    data: { action: event.value },
                })
            )
        }
    }

    protected onContextMenu(event: MouseEvent) {
        const menu = this.shadowRoot?.querySelector('outerbase-th-menu') as ColumnMenu | null
        if (menu) {
            event.preventDefault()
            menu.focus()
            menu.open = true
        }
    }
}
