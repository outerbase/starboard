import { html, type PropertyValueMap } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import { customElement, property, state } from 'lit/decorators.js'

import { TWStyles } from '../../../tailwind'
import { MenuSelectionEvent } from '../../lib/events'
import { CaretDown } from '../../lib/icons/caret-down'
import { ClassifiedElement } from '../classified-element'
import classMapToClassName from '../../lib/class-map-to-class-name'

@customElement('outerbase-th-menu')
export class ColumnMenu extends ClassifiedElement {
    static styles = TWStyles
    protected override get classMap() {
        return {
            'relative flex items-center justify-between': true,
        }
    }

    @property({ type: Boolean, attribute: 'open' })
    open = false

    @property({ type: String, attribute: 'selection' })
    selection?: string

    @property({ type: Array, attribute: 'options' })
    options: Array<Record<'label' | 'value' | 'classes', string>> = []

    @state()
    focused?: string

    protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        super.updated(_changedProperties)

        // when closing
        if (_changedProperties.has('open') && !this.open) {
            this.focused = undefined
        }
    }

    onTrigger(_event: MouseEvent) {
        this.open = !this.open
    }

    onItemClick(event: MouseEvent) {
        const el = event.target as HTMLUListElement
        const value = el.getAttribute('data-value')
        if (!value) throw new Error("onItemClick didn't recover a selection value")
        this.onSelection(value)
    }

    onSelection(value: string) {
        const selectionEvent = new MenuSelectionEvent(value)
        this.selection = value
        this.dispatchEvent(selectionEvent)
    }

    private onKeyDown(event: KeyboardEvent) {
        const { code } = event

        if (code === 'Escape') {
            return (this.open = false)
        }

        if (code === 'Space' || code === 'Enter') {
            event.preventDefault()
            this.open = !this.open

            if (!this.open && this.focused) this.onSelection(this.focused)
        }

        if (code === 'ArrowDown' || code === 'ArrowRight') {
            event.preventDefault()
            if (!this.focused) this.focused = this.options[0]?.value
            else {
                const idx = this.options.findIndex(({ value }, _idx) => value === this.focused)
                if (idx > -1 && idx < this.options.length - 1) this.focused = this.options[idx + 1].value
                else if (idx === this.options.length - 1) this.focused = this.options[0].value
            }
        }

        if (code === 'ArrowUp' || code === 'ArrowLeft') {
            event.preventDefault()
            if (!this.focused) this.focused = this.options[this.options.length - 1]?.value
            else {
                const idx = this.options.findIndex(({ value }, _idx) => value === this.focused)
                if (idx > 0) this.focused = this.options[idx - 1].value
                else if (idx === 0) this.focused = this.options[this.options.length - 1].value
            }
        }

        // prevent tabbing focus away from an open menu
        if (code === 'Tab') {
            if (this.open) event.preventDefault()
        }
    }

    protected override render() {
        const menu = this.open
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
                                  [classes]: true,
                                  'cursor-pointer py-2 px-3 border-b last:border-b-0 hover:bg-neutral-200 dark:hover:bg-neutral-800': true,
                                  'bg-neutral-200': this.focused === value,
                              })}
                              role="menuitem"
                              ?selected=${this.selection === value}
                          >
                              ${label}
                          </li>`
                  )}
              </ul>`
            : null

        // @dblclick here is to prevent the parent's dblclick from being triggered
        const trigger = html`<span
            @click=${this.onTrigger}
            @dblclick=${(e: MouseEvent) => e.stopPropagation()}
            @keydown=${this.onKeyDown}
            class="relative hover:bg-blue-50 dark:hover:bg-blue-950 active:border-blue-100 dark:active:border-blue-900 p-0.5 rounded-full border border-transparent"
            aria-haspopup="menu"
            tabIndex="0"
            >${CaretDown(16)}${menu}</span
        >`

        return html`
            <slot></slot>
            ${trigger}
        `
    }
}
