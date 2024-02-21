import { customElement, property } from 'lit/decorators.js'
import { html, type PropertyValueMap } from 'lit'

import type { TH } from './table/th.js'
import { ClassifiedElement } from './classified-element.js'
import { ResizeEndEvent, ResizeEvent, ResizeStartEvent } from '../lib/events.js'
import { Theme } from '../types.js'
import { classMap } from 'lit/directives/class-map.js'

@customElement('column-resizer')
export class ColumnResizer extends ClassifiedElement {
    @property({ type: Number, attribute: 'height' })
    public height?: number

    // this successfully sets/receives `column` when `.column={...}` is passed
    // but it's unclear whether updates to `.column` are reflected
    // the docs explicitly say it won't be observed, but it has been tested to definitely work on the initial render
    @property({ type: Object })
    public column?: TH

    @property({ attribute: 'theme', type: Number })
    public theme = Theme.light

    private xPosition?: number
    private width?: number

    private _mouseDown(e: MouseEvent) {
        if (!this.column) throw new Error('`column` is unset; aborting')

        this.dispatchEvent(new ResizeStartEvent(this.column.value))

        let dx: number

        const _mouseMove = (e: MouseEvent) => {
            if (!this.column) throw new Error('`column` is unset; aborting')
            if (!this.xPosition) throw new Error('`xPosition` is unset; aborting')
            if (!this.width) throw new Error('`width` is unset; aborting')

            dx = e.clientX - this.xPosition
            this.dispatchEvent(new ResizeEvent(this.column.value, dx))
        }

        const _mouseUp = (_e: Event) => {
            document.removeEventListener('mouseup', _mouseUp)
            document.removeEventListener('mousemove', _mouseMove)

            if (!this.column) throw new Error('`column` is unset; aborting')

            this.dispatchEvent(new ResizeEndEvent(this.column.value, dx))
        }

        document.addEventListener('mousemove', _mouseMove)
        document.addEventListener('mouseup', _mouseUp)

        this.xPosition = e.clientX
        this.width = parseInt(window.getComputedStyle(this.column).width, 10)
    }

    public override connectedCallback() {
        super.connectedCallback()
        this.addEventListener('mousedown', this._mouseDown)
    }

    public override disconnectedCallback() {
        super.disconnectedCallback()
        this.removeEventListener('mousedown', this._mouseDown)
    }

    protected override willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        super.willUpdate(_changedProperties)

        if (_changedProperties.has('height')) {
            // document.documentElement.style.setProperty('--table-height', `${this.height}px`)
        }
    }

    protected override render() {
        const classes = classMap({
            'absolute z-10 top-0 bottom-0 -right-[7px] w-4': true,
            'flex justify-center': true,
            'cursor-col-resize group': true,
            dark: this.theme === Theme.dark,
        })

        // the reason for nested div's here is to increase the click/draggable area while preserving a smaller visual element
        return html`
            <div class=${classes}>
                <div
                    class="h-full ml-[1px] w-[1px] group-hover:w-1 group-active:w-1 bg-theme-border dark:bg-theme-border-dark group-hover:bg-blue-400 group-active:bg-blue-500 dark:group-hover:bg-blue-900 dark:group-active:bg-blue-800"
                ></div>
            </div>
        `
    }
}
