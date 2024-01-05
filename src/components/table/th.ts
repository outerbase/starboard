import { html } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import { customElement, property } from 'lit/decorators.js'

// import subcomponents
import '../column-resizer.js'
import { TWStyles } from '../../../tailwind/index.js'
import { MutableElement } from '../mutable-element.js'
import { classMap } from 'lit/directives/class-map.js'
import { ColumnHiddenEvent, ColumnRemovedEvent, ColumnRenameEvent, ColumnUpdatedEvent, MenuSelectedEvent } from '../../lib/events.js'
import './column-menu.js' // <outerbase-th-menu />
import type { ColumnMenu } from './column-menu.js'
import type { HeaderMenuOptions } from '../../types.js'

// tl;dr <th/>, table-cell
@customElement('outerbase-th')
export class TH extends MutableElement {
    static override styles = TWStyles
    protected override get classMap() {
        return {
            'table-cell relative whitespace-nowrap h-[38px]': true, // h-[38px] was added to preserve the height when toggling to <input />
            'first:border-l border-b border-t border-theme-border dark:border-theme-border-dark': true,
            'px-cell-padding-x py-cell-padding-y': true,
            'bg-theme-column dark:bg-theme-column-dark': true,
            'bg-yellow-100 dark:bg-yellow-900': this.dirty,
            'select-none': this.hasMenu, // this is really about handling SSR without hydration; TODO use a better flag?
            // prevent double borders
            'border-r': !this.withResizer, // use regular border
            'cursor-pointer': this.isInteractive,
        }
    }

    @property({ attribute: 'table-height', type: Number })
    public tableHeight?: number

    @property({ attribute: 'with-resizer', type: Boolean })
    public withResizer = false

    @property({ attribute: 'name', type: String })
    public override value = ''

    @property({ type: Boolean, attribute: 'blank' })
    public blank = false

    @property({ attribute: 'is-last', type: Boolean })
    protected isLastColumn = false

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

    public override connectedCallback(): void {
        super.connectedCallback()
        this.addEventListener('contextmenu', this.onContextMenu)
    }

    public override disconnectedCallback(): void {
        super.disconnectedCallback
        this.removeEventListener('contextmenu', this.onContextMenu)
    }

    protected override render() {
        const optionsWithRevert = this.options ? [...this.options] : []
        optionsWithRevert.splice(-1, 0, {
            label: html`Revert to <span class="pointer-events-none italic whitespace-nowrap">${this.originalValue}</span>`,
            value: 'reset',
        })

        if (this.blank) {
            // an element to preserve the right-border
            return html` <div class="absolute top-0 bottom-0 right-0 left-0"></div> `
        } else {
            const body = this.isEditing
                ? html`<input .value=${this.value} @input=${this.onChange} @keydown=${this.onKeyDown} class=${classMap({
                      'z-10 absolute top-0 bottom-0 right-0 left-0 bg-blue-50 dark:bg-blue-950 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900':
                          true,
                  })} @blur=${this.onBlur}></input>`
                : this.hasMenu
                  ? html`<outerbase-th-menu
                        .options=${this.dirty ? optionsWithRevert : this.options}
                        @menu-selection=${this.onMenuSelection}
                        >${this.value}</outerbase-th-menu
                    >`
                  : html`<span>${this.value}</span>`

            return this.withResizer
                ? html`<slot></slot>
                      ${body}
                      <column-resizer .column=${this} height="${ifDefined(this.tableHeight)}"></column-resizer>`
                : html`<slot></slot>${body}`
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
                        name: this.label ?? '',
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
