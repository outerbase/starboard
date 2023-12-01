import { LitElement, html, type PropertyValueMap } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { map } from 'lit/directives/map.js'
import type { Queryd } from '../types'
import { TWStyles } from '../../tailwind'
import dbRowsForSource from '../lib/rows-for-source-id'
import classMapToClassName from '../lib/class-map-to-class-name'

function getTotalHeight(element: Element) {
    const styles = window.getComputedStyle(element)
    const height = element.getBoundingClientRect().height

    const marginTop = parseFloat(styles.marginTop)
    const marginBottom = parseFloat(styles.marginBottom)
    const paddingTop = parseFloat(styles.paddingTop)
    const paddingBottom = parseFloat(styles.paddingBottom)
    const borderTop = parseFloat(styles.borderTopWidth)
    const borderBottom = parseFloat(styles.borderBottomWidth)

    const totalHeight = height + marginTop + marginBottom + paddingTop + paddingBottom + borderTop + borderBottom

    return totalHeight
}

// ClassifiedElement deals primarily with ensuring that each Super Class's style
// is propogated to the DOM and therefore it's CSS is applied
export class ClassifiedElement extends LitElement {
    @property({ reflect: true, attribute: 'class', type: String })
    private _class = ''

    // classMap is a pairing of class(es) (a string) with a boolean expression
    // such that only the truthy values are rendered out and the rest are dropped
    // if a property used in such a boolean expression changes, this value is recomputed
    @state()
    protected get classMap() {
        return {}
    }

    protected override willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        super.willUpdate(_changedProperties)

        // ensure `_class` reflects our latest state
        this._class = classMapToClassName(this.classMap)
    }

    // this render() looks like it does next-to-nothing,
    // but our component itself is being rendered,
    // and it's appearance/style is provided by each component's `get _componentsInitialClassAttribute() {}` override
    // i.e. `table` vs `table-row-group` vs `table-cell` vs ...etc...
    render() {
        return html`<slot></slot>`
    }
}

@customElement('outerbase-table')
export class Table extends LitElement {
    @property({ type: Object })
    data?: Queryd

    render() {
        return html`<inner-table .data="${this.data}" auth-token="${import.meta.env.PUBLIC_AUTH_TOKEN}"></inner-table>`
    }
}

@customElement('inner-table')
export class InnerTable extends ClassifiedElement {
    static override styles = TWStyles // necessary, or *nothing* is styled

    @state()
    private _height?: number

    @state()
    private columnResizerEnabled = false

    @state()
    resizeObserver?: ResizeObserver

    override connectedCallback() {
        super.connectedCallback()

        // without this `setTimeout`, then a client-side-only Table updates properly but SSR'd tables do NOT
        setTimeout(() => (this.columnResizerEnabled = true), 0)

        this.resizeObserver = new ResizeObserver((_entries) => {
            this._height = getTotalHeight(_entries[0]?.target)
        })
        this.resizeObserver.observe(this)
    }

    override disconnectedCallback() {
        super.disconnectedCallback()
        this.resizeObserver?.disconnect()
    }

    @state()
    protected columns: Array<string> = []

    @state()
    protected rows: Array<Array<string>> = []

    // fetch data from Outerbase when `sourceId` changes
    @property({ type: String, attribute: 'source-id' })
    sourceId?: string

    @property({ type: String, attribute: 'auth-token' })
    authToken?: string

    @property({ type: Object })
    data?: Queryd

    protected override willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        super.willUpdate(_changedProperties)

        // when `data` changes, update `rows` and `columns`
        if (_changedProperties.has('data')) {
            if (this.data && this.data.items?.length > 0) {
                this.columns = Object.keys(this.data.items[0])
                this.rows = this.data.items.map((d) => Object.values(d))
            }
        }

        // Note: if both `data` and `source-id` are passed to `<outerbase-component />`
        //       then it will initially render with the provided data but immediately fetch data for the provided `source-id`
        if (_changedProperties.has('sourceId')) {
            if (!this.authToken) throw new Error('Unable to fetch data without `auth-token`')

            const previousSourceId = _changedProperties.get('sourceId')
            if (this.sourceId && this.sourceId !== previousSourceId) {
                console.debug(`sourceId changed from ${previousSourceId} to ${this.sourceId}; fetching new data`)
                dbRowsForSource(this.sourceId, this.authToken).then((data) => {
                    this.data = data
                })
            }
        }
    }

    render() {
        // 'overflow-hidden' is necessary to prevent the ColumnResizer from going beyond the table.
        // It's unclear (so far) why this is happening; the height is correct
        // Looks like it may have something to do with the header being `sticky`
        // as I'm observing that the Resizer stays in place as you scroll down the page
        // while the rest of the table scrolls out of view

        return html`<div
            class="overflow-hidden table table-fixed w-full select-none text-theme-primary bg-theme-secondary dark:text-theme-secondary dark:bg-theme-primary"
        >
            <outerbase-thead>
                <outerbase-tr header>
                    <!-- render an TableHeader for each column -->
                    ${map(this.columns, (k, idx) => {
                        // omit column resizer on the last column because it's sort-of awkward
                        return html`<outerbase-th
                            table-height=${ifDefined(this._height)}
                            ?with-resizer=${this.columnResizerEnabled && idx !== this.columns.length - 1}
                            >${k}</outerbase-th
                        >`
                    })}
                </outerbase-tr>
            </outerbase-thead>

            <outerbase-rowgroup>
                <!-- render a TableRow element for each row of data -->
                ${map(
                    this.rows,
                    (row) =>
                        html`<outerbase-tr>
                            <!-- render a TableCell for each column of data in the curernt row -->
                            <!-- NOTE: the Array.isArray(etc) is jsut temporary to render stubbed data more better (spaceballs demo data) -->
                            ${map(
                                row,
                                (value, idx) => html`
                                    <outerbase-td
                                        ?separate-cells=${true}
                                        ?draw-right-border=${idx === row.length - 1 || !this.columnResizerEnabled}
                                        ?bottom-border=${true}
                                        >${Array.isArray(value) ? value.join(', ') : value}</outerbase-td
                                    >
                                `
                            )}
                        </outerbase-tr>`
                )}
            </outerbase-rowgroup>
        </div> `
    }
}

// tl;dr <tbody/>, table-row-group
@customElement('outerbase-rowgroup')
export class TBody extends ClassifiedElement {
    protected get classMap() {
        return { 'table-row-group': true }
    }
}

// tl;dr <th/>, table-cell
@customElement('outerbase-th')
export class TH extends ClassifiedElement {
    protected override get classMap() {
        return {
            // 'select-text': true, // allow text selection, but need to only apply this while a column is NOT resizing
            'shadow-sm table-cell relative first:border-l border-b last:border-r border-t whitespace-nowrap p-1.5': true,
            // prevent double borders
            'first:border-l': this.withResizer, // omit regular border
            'border-l': !this.withResizer, // use regular border
        }
    }

    @property({ attribute: 'table-height', type: Number })
    tableHeight?: number

    @property({ attribute: 'with-resizer', type: Boolean })
    withResizer = false

    render() {
        return this.withResizer
            ? html`<slot></slot><column-resizer .column=${this} height="${ifDefined(this.tableHeight)}"></column-resizer>`
            : html`<slot></slot>`
    }
}

// tl;dr <thead/>, table-header-group
@customElement('outerbase-thead')
export class THead extends ClassifiedElement {
    protected override get classMap() {
        return { 'table-header-group font-bold sticky top-0': true }
    }
}

// tl;dr <tr/>, table-row
@customElement('outerbase-tr')
export class TableRow extends ClassifiedElement {
    protected override get classMap() {
        return {
            'table-row': true,
            'bg-white/80 border-b-neutral-200 backdrop-blur-sm': this.isHeaderRow,
            'hover:bg-neutral-300/10': !this.isHeaderRow,
        }
    }

    @property({ type: Boolean, attribute: 'header', reflect: true })
    isHeaderRow: boolean = false
}

// tl;dr <td/>, table-cell
@customElement('outerbase-td')
export class TableData extends ClassifiedElement {
    protected override get classMap() {
        return {
            'max-w-xs': !this.maxWidth, // default max width, unless specified
            [this.maxWidth]: this.maxWidth?.length > 0, // specified max width, if any
            'border-r': this._drawRightBorder, // to avoid both a resize handler + a border
            'first:border-l': this.separateCells, // left/right borders when the `separate-cells` attribute is set
            'border-b': this.withBottomBorder, // bottom border when the `with-bototm-border` attribute is set
            'table-cell p-1.5 text-ellipsis whitespace-nowrap overflow-hidden': true, // the baseline styles for our <td/>
            'select-text': !this._columnIsResizing,
        }
    }

    // allows, for example, <outerbase-td max-width="max-w-xl" />
    @property({ type: String, attribute: 'max-width' })
    maxWidth: string = ''

    // allows, for example, <outerbase-td separate-cells="true" />
    @property({ type: Boolean, attribute: 'separate-cells' })
    separateCells: boolean = false

    // allows, for example, <outerbase-td bottom-border="true" />
    @property({ type: Boolean, attribute: 'bottom-border' })
    withBottomBorder: boolean = false

    @property({ type: Boolean, attribute: 'draw-right-border' })
    private _drawRightBorder = false

    @state()
    private _columnIsResizing = false

    override connectedCallback() {
        super.connectedCallback()

        const onColumnResizeEnd = (event: Event) => {
            document.removeEventListener('column-resize-end', onColumnResizeEnd)
            this._columnIsResizing = false
        }

        const onColumnResizeStart = (event: Event) => {
            document.addEventListener('column-resize-end', onColumnResizeEnd)
            this._columnIsResizing = true
        }

        document.addEventListener('column-resize-start', onColumnResizeStart)
    }

    render() {
        return html`<slot></slot>`
    }
}

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
