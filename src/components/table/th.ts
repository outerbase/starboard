import { html, type PropertyValueMap } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import { customElement, property, state } from 'lit/decorators.js'

// import subcomponents
import '../column-resizer.js'
import { TWStyles } from '../../../tailwind/index.js'
import { MutableElement } from '../mutable-element.js'
import { classMap } from 'lit/directives/class-map.js'
import { ColumnHiddenEvent, ColumnRemovedEvent, ColumnRenameEvent, ColumnUpdatedEvent, MenuSelectedEvent } from '../../lib/events.js'
import './column-menu.js' // <outerbase-th-menu />
import type { ColumnMenu } from './column-menu.js'
import type { HeaderMenuOptions } from '../../types.js'
import { Theme } from '../../types.js'

// tl;dr <th/>, table-cell
@customElement('outerbase-th')
export class TH extends MutableElement {
    static override styles = TWStyles
    protected override get classMap() {
        return {
            'table-cell relative whitespace-nowrap h-[38px]': true, // h-[38px] was added to preserve the height when toggling to <input />
            'border-b border-theme-border dark:border-theme-border-dark': true,
            'first:border-l border-t': this.outterBorder,
            'px-cell-padding-x py-cell-padding-y': true,
            'bg-theme-column dark:bg-theme-column-dark': !this.dirty,
            'bg-theme-cell-dirty dark:bg-theme-cell-dirty-dark': this.dirty,
            'select-none': this.hasMenu, // this is really about handling SSR without hydration; TODO use a better flag?
            // prevent double borders
            'border-r':
                (!this.withResizer && this.isLastColumn && this.outterBorder) ||
                (!this.withResizer && this.separateCells && !this.isLastColumn),
            'cursor-pointer': this.isInteractive,
            dark: this.theme == Theme.dark,
        }
    }

    @property({ attribute: 'table-height', type: Number })
    public tableHeight?: number

    @property({ attribute: 'with-resizer', type: Boolean })
    public withResizer = false

    @property({ attribute: 'outter-border', type: Boolean })
    public outterBorder = false

    @property({ attribute: 'name', type: String })
    public override value = ''

    @property({ type: Boolean, attribute: 'blank' })
    public blank = false

    @property({ attribute: 'is-last', type: Boolean })
    protected isLastColumn = false

    // allows, for example, <outerbase-td separate-cells="true" />
    @property({ type: Boolean, attribute: 'separate-cells' })
    public separateCells: boolean = false

    @property({ attribute: 'menu', type: Boolean })
    hasMenu = false

    @property({ attribute: 'interactive', type: Boolean })
    isInteractive = false

    @property({ attribute: 'options', type: Array })
    options?: HeaderMenuOptions = [
        {
            label: 'Sort A-Z',
            value: 'sort:alphabetical:ascending',
        },
        {
            label: 'Sort Z-A',
            value: 'sort:alphabetical:descending',
        },
        // TODO @johnny implement nested menus to support this
        // {
        //     label: 'Plugins',
        //     value: 'plugins',
        //     // value: html`<div class="bg-yellow-50 w-8 h-8>submenu</div>`,
        // },
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

    @property({ attribute: 'left-distance-to-viewport', type: Number })
    protected distanceToLeftViewport = -1

    @property({ attribute: 'theme', type: String })
    public theme = Theme.light

    public override connectedCallback(): void {
        super.connectedCallback()
        this.addEventListener('contextmenu', this.onContextMenu)
    }

    public override disconnectedCallback(): void {
        super.disconnectedCallback
        this.removeEventListener('contextmenu', this.onContextMenu)
    }

    @state()
    private width: number = -1
    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        this.width = parseInt(window.getComputedStyle(this).width, 10)
        this.style.width = `${this.width}px`
    }

    protected override render() {
        const optionsWithRevert = this.options ? [...this.options] : []
        optionsWithRevert.splice(-1, 0, {
            label: html`Revert to <span class="pointer-events-none italic whitespace-nowrap">${this.originalValue}</span>`,
            value: 'reset',
        })

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
                      'bg-blue-50 dark:bg-blue-950 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900': true,
                      'px-cell-padding-x font-mono': true,
                  })} @blur=${this.onBlur}></input>`
                : this.hasMenu
                  ? html`<outerbase-th-menu
                        class="font-mono"
                        theme=${this.theme}
                        .options=${this.dirty ? optionsWithRevert : this.options}
                        @menu-selection=${this.onMenuSelection}
                        left-distance-to-viewport=${this.distanceToLeftViewport}
                        ><span class="font-mono">${this.value}</span></outerbase-th-menu
                    >`
                  : html`<span class="font-mono">${this.value}</span>`

            return this.withResizer
                ? html`<span class=${classMap(resultContainerClasses)}
                      ><slot></slot>
                      ${body}
                      <column-resizer .column=${this} height="${ifDefined(this.tableHeight)}"></column-resizer
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
