import { html, type PropertyValues, type TemplateResult } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { customElement, property, state } from 'lit/decorators.js'

import { MutableElement } from '../mutable-element.js'
import { type MenuSelectedEvent } from '../../lib/events.js'

import '../menu/cell-menu.js' // <outerbase-td-menu />
import type { CellMenu } from '../menu/cell-menu.js'
import { Theme, type ColumnPlugin, PluginEvent } from '../../types.js'
import { UnsafeHTMLDirective, unsafeHTML } from 'lit/directives/unsafe-html.js'
import type { DirectiveResult } from 'lit/async-directive.js'
import { eventTargetIsPlugin, eventTargetIsPluginEditor } from '../../lib/event-target-is-plugin.js'

type PluginActionEvent = CustomEvent<{ action: PluginEvent.onEdit | PluginEvent.onStopEdit | PluginEvent.onCancelEdit; value: any }>

const isAlphanumericOrSpecial = (key: string): boolean => {
    // Regular expression to match alphanumeric characters and specified special characters
    // const regex = /^[a-zA-Z0-9`~!@#\$%\^&\*\+\?\(\)\[\],<\.>]+$/
    return /^[a-zA-Z0-9 \.,]+$/.test(key)
}

// tl;dr <td/>, table-cell
@customElement('outerbase-td')
export class TableData extends MutableElement {
    protected override get classMap() {
        return {
            'table-cell relative focus:z-10': true,
            'px-cell-padding-x py-cell-padding-y ': !this.plugin && !this.blank,
            'px-5': this.blank,
            'border-theme-border dark:border-theme-border-dark': true,
            'bg-theme-cell dark:bg-theme-cell-dark text-theme-cell-text dark:text-theme-cell-text-dark': true,
            'focus:shadow-ringlet dark:focus:shadow-ringlet-dark focus:rounded-[4px] focus:ring-1 focus:ring-black dark:focus:ring-neutral-300 focus:outline-none':
                !this.isEditing && this.isInteractive,
            'bg-theme-cell-dirty dark:bg-theme-cell-dirty-dark': this.dirty && !this.hideDirt, // dirty cells
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
        { label: 'Paste', value: 'paste' },
        { label: 'Clear', value: 'clear' },
    ]

    @state()
    protected isDisplayingPluginEditor = false

    protected willUpdate(changedProperties: PropertyValues<this>): void {
        super.willUpdate(changedProperties)
        if (changedProperties.has('isInteractive') && this.isInteractive === true && !this.blank) {
            // prevent blank rows from being selectable; i.e. the first row that is used just for padding
            this.tabIndex = 0
        }

        if (changedProperties.has('readonly')) {
            if (this.readonly) {
                this.options = [{ label: 'Copy', value: 'copy' }]
            } else {
                this.options = [
                    { label: 'Edit', value: 'edit' },
                    { label: 'Copy', value: 'copy' },
                    { label: 'Paste', value: 'paste' },
                    { label: 'Clear', value: 'clear' },
                ]
            }
        }
    }

    protected onContextMenu(event: MouseEvent) {
        const isPlugin = eventTargetIsPluginEditor(event)
        if (isPlugin) return

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
        }
    }

    protected async onKeyDown(event: KeyboardEvent): Promise<void> {
        // ignore events being fired from a Plugin
        if (eventTargetIsPlugin(event)) return

        super.onKeyDown(event)
        const { code } = event

        let target = event.target
        if (target instanceof HTMLElement && !this.isEditing) {
            // handle events from a <check-box />
            if (target.tagName.toLowerCase() === 'check-box') {
                const parent = target.parentElement?.parentElement?.parentElement

                if (code === 'ArrowDown') {
                    event.preventDefault()
                    ;(parent?.nextElementSibling?.querySelector('check-box') as HTMLElement | undefined)?.focus()
                } else if (code === 'ArrowUp') {
                    event.preventDefault()
                    ;(parent?.previousElementSibling?.querySelector('check-box') as HTMLElement | undefined)?.focus()
                } else if (code === 'ArrowRight') {
                    ;(target.parentElement?.parentElement?.nextElementSibling as HTMLElement | undefined)?.focus()
                }
                return
            }

            // begin editing if keys are ASCII-ish
            const isInputTriggering = event.key.length === 1 && isAlphanumericOrSpecial(event.key)
            const noMetaKeys = !(event.metaKey || event.shiftKey)
            if (isInputTriggering && noMetaKeys) {
                event.preventDefault()

                // toggle editing mode
                this.isEditing = true

                // append this character
                this.value += event.key

                // set the cursor input to the end
                setTimeout(() => {
                    const input = this.shadowRoot?.querySelector('input')
                    input?.focus()
                    input?.setSelectionRange(input.value.length, input.value.length)
                }, 0)

                return
            }

            // navigating around the table
            if (code === 'ArrowRight') {
                event.preventDefault()
                ;(target?.nextElementSibling as HTMLElement)?.focus()
            } else if (code === 'ArrowLeft') {
                event.preventDefault()
                const checkbox = target?.previousElementSibling?.querySelector('check-box') as HTMLElement | undefined
                if (checkbox) checkbox.focus()
                else (target?.previousElementSibling as HTMLElement | undefined)?.focus()
            } else if (code === 'ArrowDown') {
                event.preventDefault()
                if (event.target instanceof HTMLElement && !this.isEditing) {
                    this.moveFocusToNextRow(event.target)
                }
            } else if (code === 'ArrowUp') {
                event.preventDefault()
                if (event.target instanceof HTMLElement && !this.isEditing) {
                    this.moveFocusToPreviousRow(event.target)
                }
            }

            // copy/paste focused cells
            if (code === 'KeyC') {
                event.preventDefault()
                navigator.clipboard.writeText(this.value ?? '')
            }

            if (code === 'KeyV') {
                event.preventDefault()
                this.value = await navigator.clipboard.readText()
            }

            if (code === 'Backspace' || code === 'Delete') {
                this.value = undefined
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
                `<${tagName} cellvalue='${value}' configuration='${config}' ${this.pluginAttributes}></${tagName}>`
            )
            cellContents = html`${pluginAsString}`

            if (this.isDisplayingPluginEditor) {
                cellEditorContents = unsafeHTML(
                    `<${tagName.replace(
                        'outerbase-plugin-cell',
                        'outerbase-plugin-editor'
                    )} cellvalue='${value}' configuration='${config}' ${this.pluginAttributes}></${tagName}>`
                )
            }
        } else {
            cellContents = html`${value || html`<span class="italic text-neutral-400 dark:text-neutral-500">NULL</span>`}`
        }

        return this.isEditing
            ? // &nbsp; prevents the row from collapsing (in height) when there is only 1 column
              html`<span class=${contentWrapperClass}>&nbsp;<input .value=${value ?? ''} @input=${this.onChange} class=${classMap({
                  'z-20 absolute top-0 bottom-0 right-0 left-0': true,
                  'bg-blue-50 dark:bg-blue-950 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700': true,
                  'px-3 font-normal focus:rounded-[4px]': true,
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
                                          <span class="pointer-events-none italic whitespace-nowrap"
                                              >${this.originalValue ?? 'NULL'}</span
                                          >`,
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

    protected async onMenuSelection(event: MenuSelectedEvent) {
        switch (event.value) {
            case 'edit':
                return (this.isEditing = true)
            case 'copy':
                return navigator.clipboard.writeText(this.value ?? '')
            case 'paste':
                this.value = await navigator.clipboard.readText()
                return
            case 'clear':
                return (this.value = '')
            case 'reset':
                return (this.value = this.originalValue)
        }
    }
}
