import type { TH } from './table/th'

import { customElement, property } from 'lit/decorators.js'
import { html, type PropertyValueMap } from 'lit'
import { TWStyles } from '../../tailwind'
import { ClassifiedElement } from './classified-element'

@customElement('column-resizer')
export class ColumnResizer extends ClassifiedElement {
    static override styles = TWStyles

    @property({ type: Number, attribute: 'height' })
    protected height?: number

    // this successfully sets/receives `column` when `.column={...}` is passed
    // but it's unclear whether updates to `.column` are reflected
    // the docs explicitly say it won't be observed, but it has been tested to definitely work on the initial render
    @property({ type: Object })
    column?: TH

    private xPosition?: number
    private width?: number

    override connectedCallback() {
        super.connectedCallback()
        this.addEventListener('mousedown', this._mouseDown)
    }

    override disconnectedCallback() {
        super.disconnectedCallback()
        this.removeEventListener('mousedown', this._mouseDown)
    }

    protected override willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        super.willUpdate(_changedProperties)

        if (_changedProperties.has('height')) {
            // document.documentElement.style.setProperty('--table-height', `${this.height}px`)
        }
    }

    private _mouseDown(e: MouseEvent) {
        if (!this.column) throw new Error('`column` is unset; aborting')

        this.dispatchEvent(
            new Event('resize-start', {
                bubbles: true,
                composed: true,
            })
        )

        const _mouseMove = (e: MouseEvent) => {
            if (!this.column) throw new Error('`column` is unset; aborting')
            if (!this.xPosition) throw new Error('`xPosition` is unset; aborting')
            if (!this.width) throw new Error('`width` is unset; aborting')

            const dx = e.clientX - this.xPosition
            this.column.style.width = `${this.width + dx}px`
        }

        const _mouseUp = (e: Event) => {
            document.removeEventListener('mouseup', _mouseUp)
            document.removeEventListener('mousemove', _mouseMove)

            this.dispatchEvent(
                new Event('resize-end', {
                    bubbles: true,
                    composed: true,
                })
            )
        }

        document.addEventListener('mousemove', _mouseMove)
        document.addEventListener('mouseup', _mouseUp)

        this.xPosition = e.clientX
        this.width = parseInt(window.getComputedStyle(this.column).width, 10)
    }

    render() {
        // the reason for nested div's here is to increase the click/draggable area while preserving a smaller visual element
        return html`
            <div class="z-10 absolute top-0 bottom-0 -right-[7px] cursor-col-resize w-4 group flex justify-center">
                <div
                    class="h-full ml-[1px] w-[1px] group-hover:w-1 group-active:w-1 bg-theme-border dark:bg-theme-border-dark group-hover:bg-blue-400 group-active:bg-blue-500 dark:group-hover:bg-blue-900 dark:group-active:bg-blue-800"
                ></div>
            </div>
        `
    }
}
