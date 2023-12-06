import { customElement, property } from 'lit/decorators.js'
import { html, type PropertyValueMap } from 'lit'
import { TWStyles } from '../../tailwind'
import { ClassifiedElement } from './classified-element'
import type { TH } from './table/th'

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
        // removed full-height because it causes issues when using a `sticky` header
        // class="h-[var(--table-height)] w-[1px] group-hover:w-1.5 group-active:w-1.5 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-blue-50 group-active:bg-blue-100 dark:group-hover:bg-blue-950 dark:group-active:bg-blue-900"

        // the reason for nested div's here is to increase the click/draggable area while preserving a smaller visual element
        return html`
            <div class="absolute flex justify-center h-full top-0 right-0 cursor-col-resize z-10 w-2 group">
                <div
                    class="h-full w-[1px]  group-hover:w-1 group-active:w-1 bg-neutral-300 dark:bg-neutral-800 group-hover:bg-blue-50 group-active:bg-blue-100 dark:group-hover:bg-blue-950 dark:group-active:bg-blue-900"
                ></div>
            </div>
        `
    }
}
