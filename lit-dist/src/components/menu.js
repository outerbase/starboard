var __decorate =
    (this && this.__decorate) ||
    function (decorators, target, key, desc) {
        var c = arguments.length,
            r = c < 3 ? target : desc === null ? (desc = Object.getOwnPropertyDescriptor(target, key)) : desc,
            d
        if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function') r = Reflect.decorate(decorators, target, key, desc)
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if ((d = decorators[i])) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
        return c > 3 && r && Object.defineProperty(target, key, r), r
    }
import { html } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import { property, state } from 'lit/decorators.js'
import { TWStyles } from '../../tailwind/index.js'
import { MenuSelectedEvent } from '../lib/events.js'
import { CaretDown } from '../lib/icons/caret-down.js'
import { ClassifiedElement } from './classified-element.js'
import classMapToClassName from '../lib/class-map-to-class-name.js'
import { Theme } from '../types.js'
import { classMap } from 'lit/directives/class-map.js'
export class Menu extends ClassifiedElement {
    constructor() {
        super(...arguments)
        this.open = false
        this.options = []
        this.theme = Theme.light
    }
    get classMap() {
        return {
            'relative flex items-center justify-between gap-2': true,
            'font-medium select-none whitespace-nowrap': true,
            dark: this.theme == Theme.dark,
        }
    }
    // this function is intended to be overriden in a subclass
    // and not accessed otherwise
    get menuPositionClasses() {
        return ''
    }
    willUpdate(_changedProperties) {
        super.willUpdate(_changedProperties)
        // when the menu is being opened
        if (_changedProperties.has('open') && this.open) {
            this.setAttribute('aria-expanded', '')
            this.outsideClicker = (event) => {
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
    updated(_changedProperties) {
        super.updated(_changedProperties)
        // when closing
        if (_changedProperties.has('open') && !this.open) {
            this.focused = undefined
        }
    }
    onTrigger(event) {
        this.open = !this.open
        this.activeEvent = event
    }
    onItemClick(event) {
        const el = event.target
        const value = el.getAttribute('data-value')
        if (!value) throw new Error("onItemClick didn't recover a selection value")
        this.onSelection(value)
    }
    onSelection(value) {
        const selectionEvent = new MenuSelectedEvent(value)
        this.selection = value
        this.dispatchEvent(selectionEvent)
    }
    onKeyDown(event) {
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
    focus() {
        const trigger = this.shadowRoot?.querySelector('#trigger')
        trigger?.focus()
    }
    get listElement() {
        if (!this.open) return null
        const classes = {
            [this.menuPositionClasses]: true,
            'absolute z-20 max-w-56 overflow-hidden': true,
            'text-base': true,
            'bg-white dark:bg-black shadow-lg': true,
            'rounded-2xl p-1': true,
            'duration-150 ease-bounce': true,
        }
        return html`<ul class=${classMap(classes)} role="menu">
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
                            'rounded-xl px-4 py-3': true,
                            'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700': true,
                            'bg-neutral-100 dark:bg-neutral-700': this.focused === value,
                        })}
                        role="menuitem"
                        ?selected=${this.selection === value}
                    >
                        ${label}
                    </li>`
            )}
        </ul>`
    }
    render() {
        // @click shows/hides the menu
        // @dblclick prevents parent's dblclick
        // @keydown navigates the menu
        const outerClasses = {
            'relative -mr-1 cursor-pointer': true,
            dark: this.theme == Theme.dark,
        }
        const innerClasses = {
            'border border-transparent': true,
            'hover:bg-neutral-100 dark:hover:bg-neutral-900 active:border-neutral-200 dark:active:border-neutral-800': true,
            'p-0.5 rounded-md': true,
        }
        return html`
            <slot></slot>
            <div
                id="trigger"
                class=${classMap(outerClasses)}
                aria-haspopup="menu"
                tabindex="0"
                @click=${this.onTrigger}
                @dblclick=${(e) => e.stopPropagation()}
                @keydown=${this.onKeyDown}
            >
                <div class=${classMap(innerClasses)}>${CaretDown(16)}</div>
                ${this.listElement}
            </div>
        `
    }
}
Menu.styles = TWStyles
__decorate([property({ type: Boolean, attribute: 'open' })], Menu.prototype, 'open', void 0)
__decorate([property({ type: String, attribute: 'selection' })], Menu.prototype, 'selection', void 0)
__decorate([property({ type: Array, attribute: 'options' })], Menu.prototype, 'options', void 0)
__decorate([property({ attribute: 'theme', type: String })], Menu.prototype, 'theme', void 0)
__decorate([state()], Menu.prototype, 'focused', void 0)
