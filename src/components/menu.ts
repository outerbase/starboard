import { html, type PropertyValueMap } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import { property, state } from 'lit/decorators.js'

import { TWStyles } from '../../tailwind'
import { MenuSelectionEvent } from '../lib/events'
import { CaretDown } from '../lib/icons/caret-down'
import { ClassifiedElement } from './classified-element'
import classMapToClassName from '../lib/class-map-to-class-name'

export class Menu extends ClassifiedElement {
    static override styles = TWStyles
    protected override get classMap() {
        return {}
    }

    @property({ type: Boolean, attribute: 'open' })
    public open = false

    @property({ type: String, attribute: 'selection' })
    public selection?: string

    @property({ type: Array, attribute: 'options' })
    public options: Array<Record<'label' | 'value' | 'classes', string>> = []

    @state()
    protected focused?: string

    // for closing menus when an ousside click occurs
    private outsideClicker: ((event: MouseEvent) => void) | undefined
    private activeEvent: MouseEvent | undefined

    protected override willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        super.willUpdate(_changedProperties)

        // when the menu is being opened
        if (_changedProperties.has('open') && this.open) {
            this.setAttribute('aria-expanded', '')
            this.outsideClicker = (event: MouseEvent) => {
                if (event !== this.activeEvent) {
                    this.open = false
                    delete this.activeEvent
                    if (this.outsideClicker) document.removeEventListener('click', this.outsideClicker)
                }
            }
            document.addEventListener('click', this.outsideClicker)
        }
        // when the menu is being closed
        else if (_changedProperties.has('open') && !this.open) {
            this.removeAttribute('aria-expanded')
            if (this.outsideClicker) {
                delete this.activeEvent
                document.removeEventListener('click', this.outsideClicker)
            }
        }
    }

    protected override updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        super.updated(_changedProperties)

        // when closing
        if (_changedProperties.has('open') && !this.open) {
            this.focused = undefined
        }
    }

    protected onTrigger(event: MouseEvent) {
        this.open = !this.open
        this.activeEvent = event
    }

    protected onItemClick(event: MouseEvent) {
        const el = event.target as HTMLUListElement
        const value = el.getAttribute('data-value')
        if (!value) throw new Error("onItemClick didn't recover a selection value")
        this.onSelection(value)
    }

    protected onSelection(value: string) {
        const selectionEvent = new MenuSelectionEvent(value)
        this.selection = value
        this.dispatchEvent(selectionEvent)
    }

    protected onKeyDown(event: KeyboardEvent) {
        const { code } = event

        if (code === 'Escape') {
            this.open = false
        } else if (code === 'Space' || code === 'Enter') {
            event.preventDefault()
            this.open = !this.open

            if (!this.open && this.focused) this.onSelection(this.focused)
        } else if (code === 'ArrowDown' || code === 'ArrowRight') {
            event.preventDefault()
            if (!this.focused) this.focused = this.options[0]?.value
            else {
                const idx = this.options.findIndex(({ value }, _idx) => value === this.focused)
                if (idx > -1 && idx < this.options.length - 1) this.focused = this.options[idx + 1].value
                else if (idx === this.options.length - 1) this.focused = this.options[0].value
            }
        } else if (code === 'ArrowUp' || code === 'ArrowLeft') {
            event.preventDefault()
            if (!this.focused) this.focused = this.options[this.options.length - 1]?.value
            else {
                const idx = this.options.findIndex(({ value }, _idx) => value === this.focused)
                if (idx > 0) this.focused = this.options[idx - 1].value
                else if (idx === 0) this.focused = this.options[this.options.length - 1].value
            }
        } else if (code === 'Tab') {
            // prevent tabbing focus away from an open menu
            if (this.open) event.preventDefault()
        }
    }

    public override focus() {
        const trigger = this.shadowRoot?.querySelector('#trigger') as HTMLElement | null
        trigger?.focus()
    }

    protected get listElement() {
        return this.open
            ? html` <ul
                  class="absolute top-6 -left-44 -right-2 z-20 bg-white dark:bg-black shadow-lg border rounded-lg overflow-hidden"
                  role="menu"
              >
                  ${repeat(
                      this.options,
                      ({ label }) => label,
                      ({ label, value, classes }) =>
                          html`<li
                              @click=${this.onItemClick}
                              data-value=${value}
                              class=${classMapToClassName({
                                  [classes]: !!classes,
                                  'text-ellipsis overflow-hidden': true,
                                  'cursor-pointer py-2 px-3 border-b last:border-b-0 hover:bg-neutral-200 dark:hover:bg-neutral-800': true,
                                  'bg-neutral-200 dark:bg-neutral-800': this.focused === value,
                              })}
                              role="menuitem"
                              ?selected=${this.selection === value}
                          >
                              ${label}
                          </li>`
                  )}
              </ul>`
            : null
    }

    protected override render() {
        // @click shows/hides the menu
        // @dblclick prevents parent's dblclick
        // @keydown navigates the menu

        return html`
            <slot></slot>
            <span
                id="trigger"
                class="relative hover:bg-neutral-100 dark:hover:bg-neutral-900 active:border-neutral-200 dark:active:border-neutral-800 p-0.5 rounded-full border border-transparent"
                aria-haspopup="menu"
                tabIndex="0"
                @click=${this.onTrigger}
                @dblclick=${(e: MouseEvent) => e.stopPropagation()}
                @keydown=${this.onKeyDown}
                >${CaretDown(16)}${this.listElement}</span
            >
        `
    }
}
