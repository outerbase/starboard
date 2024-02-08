import { html, type TemplateResult } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { customElement, property, state } from 'lit/decorators.js'

import { MutableElement } from '../mutable-element.js'
import { CellUpdateEvent, type MenuSelectedEvent } from '../../lib/events.js'

import '../menu/cell-menu.js' // <outerbase-td-menu />
import type { CellMenu } from '../menu/cell-menu.js'
import { Theme, type ColumnPlugin, PluginEvent } from '../../types.js'
import { UnsafeHTMLDirective, unsafeHTML } from 'lit/directives/unsafe-html.js'
import type { DirectiveResult } from 'lit/async-directive.js'

type PluginActionEvent = CustomEvent<{ action: PluginEvent.onEdit | PluginEvent.onStopEdit | PluginEvent.onCancelEdit; value: any }>

// tl;dr <td/>, table-cell
@customElement('outerbase-td')
export class TableData extends MutableElement {
    protected override get classMap() {
        return {
            'table-cell relative': true,
            'px-cell-padding-x py-cell-padding-y ': !this.plugin && !this.blank,
            'px-5': this.blank,
            'border-theme-border dark:border-theme-border-dark': true,
            'bg-theme-cell dark:bg-theme-cell-dark text-theme-cell-text dark:text-theme-cell-text-dark': true,
            'focus:shadow-ringlet focus:rounded-[4px] focus:ring-1 focus:ring-black dark:focus:ring-white focus:outline-none':
                !this.isEditing && this.isInteractive,

            'bg-theme-cell-dirty dark:bg-theme-cell-dirty-dark': this.dirty && !this.hideDirt, // dirty cells
            [this.maxWidth]: this.maxWidth?.length > 0, // specified max width, if any
            'max-w-64': !this.maxWidth, // default max width, unless specified
            'border-r':
                this.isInteractive ||
                (this._drawRightBorder && this.separateCells && this.isLastColumn && this.outerBorder) || // include last column when outerBorder
                (this._drawRightBorder && this.separateCells && !this.isLastColumn), // internal cell walls
            'first:border-l': this.separateCells && this.outerBorder, // left/right borders when the `separate-cells` attribute is set
            'border-b': this.withBottomBorder, // bottom border when the `with-bottom-border` attribute is set
            'cursor-pointer': this.isInteractive,
        }
    }

    @property({ attribute: 'plugin-attributes', type: String })
    public pluginAttributes: String = ''

    // allows, for example, <outerbase-td max-width="max-w-xl" />
    @property({ type: String, attribute: 'max-width' })
    public maxWidth: string = ''

    // allows, for example, <outerbase-td separate-cells="true" />
    @property({ type: Boolean, attribute: 'separate-cells' })
    public separateCells: boolean = false

    // allows, for example, <outerbase-td bottom-border="true" />
    @property({ type: Boolean, attribute: 'bottom-border' })
    public withBottomBorder: boolean = false

    @property({ type: String, attribute: 'sort-by' })
    public sortBy?: string

    @property({ type: String, attribute: 'order-by' })
    public orderBy?: 'ascending' | 'descending'

    @property({ type: Boolean, attribute: 'blank' })
    public blank = false

    @property({ type: Boolean, attribute: 'odd' })
    protected isOdd?: boolean

    @property({ type: Boolean, attribute: 'draw-right-border' })
    private _drawRightBorder = false

    @property({ attribute: 'interactive', type: Boolean })
    isInteractive = false

    @property({ type: Boolean, attribute: 'menu' })
    private hasMenu = false

    @property({ type: Boolean, attribute: 'row-selector' })
    isRowSelector = false

    @property({ attribute: 'outer-border', type: Boolean })
    public outerBorder = false

    @property({ attribute: 'is-last-column', type: Boolean })
    protected isLastColumn = false

    @property({ attribute: 'is-last-row', type: Boolean })
    protected isLastRow = false

    @property({ attribute: 'left-distance-to-viewport', type: Number })
    protected leftDistanceToViewport = -1

    @property({ attribute: 'table-bounding-rect', type: String })
    protected tableBoundingRect: string | undefined // we skip having `JSON.parse` run by treating it as a string

    @property({ attribute: 'hide-dirt', type: Boolean })
    public hideDirt = false

    @property({ attribute: 'theme', type: String })
    public theme = Theme.light

    @property({ attribute: 'plugin', type: String })
    public plugin?: ColumnPlugin

    @state()
    protected options = [
        { label: 'Edit', value: 'edit' },
        { label: 'Copy', value: 'copy' },
        { label: 'Clear', value: 'clear' },
    ]

    @state()
    protected isDisplayingPluginEditor = false

    override tabIndex = 0

    protected onContextMenu(event: MouseEvent) {
        const menu = this.shadowRoot?.querySelector('outerbase-td-menu') as CellMenu | null
        if (menu) {
            event.preventDefault()
            menu.focus()
            menu.open = true
        }
    }

    protected onPluginEvent({ detail: { action, value } }: PluginActionEvent) {
        // TODO not `.toLowerCase()`? update the enum to match what is emitted?
        const eventName = action.toLowerCase()

        if (eventName === PluginEvent.onEdit) {
            this.isDisplayingPluginEditor = true
            // TODO add an event listener for clicks outside the plugin to stop editing?
        } else if (eventName === PluginEvent.onStopEdit) {
            this.isDisplayingPluginEditor = false
            // TODO update our value to match the one from the editor
        } else if (eventName === PluginEvent.onCancelEdit) {
            this.isDisplayingPluginEditor = false
        } else if (eventName === PluginEvent.updateCell) {
            this.value = value
            this.dispatchChangedEvent()
        }
    }

    protected onKeyDown(event: KeyboardEvent): void {
        super.onKeyDown(event)

        const { code } = event

        // toggle menu on 'Space' key, unless typing input
        if (code === 'Space' && !this.isEditing) {
            event.preventDefault()
            const menu = this.shadowRoot?.querySelector('outerbase-td-menu') as CellMenu | null
            if (menu) {
                if (menu.open) {
                    menu.open = false
                } else {
                    menu.focus()
                    menu.open = true
                }
            }
        }

        // close menu on 'Escape' key
        if (code === 'Escape') {
            event.preventDefault()
            const menu = this.shadowRoot?.querySelector('outerbase-td-menu') as CellMenu | null
            if (menu && menu.open) {
                menu.open = false
            }
        }

        if (code === 'Enter') {
            // toggle row checkbox
            function findNestedElement(node: HTMLElement, tagName: string): HTMLElement | null {
                if (node.tagName === tagName.toUpperCase()) {
                    return node
                }
                if (node.children) {
                    for (let child of node.children) {
                        const found = findNestedElement(child as HTMLElement, tagName)
                        if (found) {
                            return found
                        }
                    }
                }
                return null
            }

            // Then, get all nodes assigned to the slot
            const slot = this.shadowRoot?.querySelector('slot')
            const nodes = slot?.assignedNodes({ flatten: true })
            const checkBox = Array.from(nodes ?? []).reduce(
                (found: HTMLElement | null, node) => found || findNestedElement(node as HTMLElement, 'check-box'),
                null
            ) as HTMLInputElement | null
            if (checkBox) checkBox.checked = !checkBox.checked
        }
    }

    public override connectedCallback(): void {
        super.connectedCallback()
        this.addEventListener('contextmenu', this.onContextMenu)
        // @ts-ignore insists on `Event` instead of `PluginActionEvent`
        this.addEventListener('custom-change', this.onPluginEvent)
        this.addEventListener('keydown', this.onKeyDown)
    }

    public override disconnectedCallback(): void {
        super.disconnectedCallback()
        this.removeEventListener('contextmenu', this.onContextMenu)
        // @ts-ignore insists on `Event` instead of `PluginActionEvent`
        this.removeEventListener('custom-change', this.onPluginEvent)
        this.removeEventListener('keydown', this.onKeyDown)
    }

    protected override render() {
        const value = this.value === null ? null : typeof this.value === 'object' ? JSON.stringify(this.value) : this.value
        const contentWrapperClass = classMap({ 'font-normal': true, dark: this.theme == Theme.dark })

        let cellContents: TemplateResult<1>
        let cellEditorContents: DirectiveResult<typeof UnsafeHTMLDirective> | undefined

        if (this.plugin) {
            const { config, tagName } = this.plugin
            const pluginAsString = unsafeHTML(
                `<${tagName} cellvalue=${value} configuration=${config} ${this.pluginAttributes}></${tagName}>`
            )
            cellContents = html`${pluginAsString}`

            if (this.isDisplayingPluginEditor) {
                cellEditorContents = unsafeHTML(
                    `<${tagName.replace('outerbase-plugin-cell', 'outerbase-plugin-editor')} cellvalue=${value} configuration=${config} ${
                        this.pluginAttributes
                    }></${tagName}>`
                )
            }
        } else {
            cellContents = html`${value || html`<span class="italic text-neutral-400 dark:text-neutral-500">NULL</span>`}`
        }

        return this.isEditing
            ? // &nbsp; prevents the row from collapsing (in height) when there is only 1 column
              html`<span class=${contentWrapperClass}>&nbsp;<input .value=${value ?? ''} @input=${this.onChange} class=${classMap({
                  'z-10 absolute top-0 bottom-0 right-0 left-0': true,
                  'bg-blue-50 dark:bg-blue-950 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700': true,
                  'px-3 font-normal': true,
              })} @blur=${this.onBlur}></input></span>`
            : this.blank
              ? html`<slot></slot>`
              : html`<!-- providing a non-breaking whitespace to force the content to actually render and be clickable -->
                    <outerbase-td-menu
                        theme=${this.theme}
                        left-distance-to-viewport=${this.leftDistanceToViewport}
                        table-bounding-rect=${this.tableBoundingRect}
                        .options=${this.dirty
                            ? [
                                  ...this.options,
                                  {
                                      label: html`Revert to
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
                    >`
    }

    protected onMenuSelection(event: MenuSelectedEvent) {
        switch (event.value) {
            case 'edit':
                return (this.isEditing = true)
            case 'edit:json':
                return console.warn('TODO @johnny implement JSON editor')
            case 'copy':
                return navigator.clipboard.writeText(this.value ?? '')
            case 'clear':
                this.dispatchEvent(
                    new CellUpdateEvent({
                        position: this.position,
                        previousValue: this.value,
                        value: '',
                    })
                )
                return (this.value = '')
            case 'reset':
                this.dispatchEvent(
                    new CellUpdateEvent({
                        position: this.position,
                        previousValue: this.value,
                        value: this.originalValue,
                    })
                )
                return (this.value = this.originalValue)
        }
    }
}
