import { html, type PropertyValues } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import { customElement, property, state } from 'lit/decorators.js'

// import subcomponents
import '../column-resizer'
import { TWStyles } from '../../../tailwind'
import { MutableElement } from '../mutable-element'
import { classMap } from 'lit/directives/class-map.js'
import { ColumnRemovedEvent, ColumnRenameEvent, ColumnUpdatedEvent, MenuSelectionEvent } from '../../lib/events'
import './column-menu' // <outerbase-th-menu />
import type { ColumnMenu } from './column-menu'

// tl;dr <th/>, table-cell
@customElement('outerbase-th')
export class TH extends MutableElement {
    static styles = TWStyles
    protected override get classMap() {
        return {
            'table-cell relative whitespace-nowrap h-[38px]': true, // h-[38px] was added to preserve the height when toggling to <input />
            'bg-yellow-100 dark:bg-yellow-900': this.dirty,
            'first:border-l border-b border-t border-theme-border dark:border-theme-border-dark': true,
            'px-cell-padding-x py-cell-padding-y': true,
            'bg-theme-column dark:bg-theme-column-dark': true,
            'select-none': this.hasMenu,
            // prevent double borders
            'first:border-l': this.withResizer, // omit regular border
            'border-l': !this.withResizer, // use regular border
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

    @state()
    hasMenu = false

    @state()
    options = [
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

    protected firstUpdated(changedProperties: PropertyValues<this>): void {
        super.firstUpdated(changedProperties)

        // delay including menu for cases where JS isn't included / SSR-only
        setTimeout(() => {
            if (!this.hasMenu) this.hasMenu = true
        }, 0)
    }

    protected override render() {
        if (this.blank) {
            // an element to preserve the right-border
            return html`
                <div class="absolute top-0 bottom-0 right-0 left-0 border-r border-theme-border dark:border-theme-border-dark"></div>
            `
        } else {
            const body = this.isEditing
                ? html`<input .value=${this.value} @input=${this.onChange} @keydown=${this.onKeyDown} class=${classMap({
                      'z-10 absolute top-0 bottom-0 right-0 left-0 bg-blue-50 dark:bg-blue-950 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900':
                          true,
                  })} @blur=${this.onBlur}></input>`
                : this.hasMenu
                  ? html`<outerbase-th-menu .options=${this.options} @menu-selection=${this.onMenuSelection}
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

    protected dispatchChangedEvent() {
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

    protected onMenuSelection(event: MenuSelectionEvent) {
        event.stopPropagation()
        let dispatchColumnUpdateEvent = false

        switch (event.value) {
            case 'hide':
                return this.removeColumn()
            case 'rename':
                return (this.isEditing = true)
            case 'delete':
                return this.removeColumn()
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
