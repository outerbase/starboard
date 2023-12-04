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
    column: TH | undefined

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
            document.documentElement.style.setProperty('--table-height', `${this.height}px`)
        }
    }

    private _mouseDown(e: MouseEvent) {
        if (!this.column) throw new Error('`column` is unset; aborting')

        document.dispatchEvent(new Event('column-resize-start'))

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
            document.dispatchEvent(new Event('column-resize-end'))
        }

        document.addEventListener('mousemove', _mouseMove)
        document.addEventListener('mouseup', _mouseUp)

        this.xPosition = e.clientX
        this.width = parseInt(window.getComputedStyle(this.column).width, 10)
    }

    render() {
        return html`
            <div class="absolute top-0 -right-[2px] hover:right-0 cursor-col-resize z-10 w-1 group">
                <div
                    class="h-[var(--table-height)] w-[1px] group-hover:w-1.5 group-active:w-1.5 bg-neutral-200 group-hover:bg-blue-300 group-active:bg-blue-500"
                ></div>
            </div>
        `
    }
}
