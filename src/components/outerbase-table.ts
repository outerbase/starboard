import { customElement, property } from 'lit/decorators.js'
import { LitElement, html, css, adoptStyles, type PropertyValueMap } from 'lit'
import { map } from 'lit/directives/map.js'
import type { Queryd } from '../types'
import { TWStyles } from '../../tailwind'
import dbRowsForSource from '../lib/rows-for-source-id'
import classMapToClassName from '../lib/class-map-to-class-name'

// ClassifiedElement deals primarily with ensuring that each Super Class's style
// is propogated to the DOM and therefore it's CSS is applied
export class ClassifiedElement extends LitElement {
    // uncommenting the following line causes a copy of TWStyles
    // to be included for every instance that extends ClassifiedElement
    // ...but it also resolves style flickering when SSR is enabled :|
    // static override styles = [TWStyles]

    override connectedCallback() {
        super.connectedCallback()

        // NOTE Astro's SSR fails to include these styles during SSR,
        //      but they appear client-side during hydration
        adoptStyles(this.shadowRoot, [TWStyles])
    }

    // `classes` are additive to our internal `class` attribute
    // if `class` is specified it will not be reflected in the DOM (except for a momentary initial render)
    @property({ type: String })
    classes: string = ''

    // _class() is overriden by each subclass to specify the classes it craves
    // each subclass should call `super._class` to include the classest returned here
    @property({ type: String, attribute: 'false' })
    protected get _class() {
        // return the `classes` attribute, if any
        // otherwise no particular styling is desired here
        return this.classes
    }

    // here we hack our CSS classes into the HTML `class` attribute
    // a user of our components can set additional classes via `<foo classes="text-red-500" .../>`
    // but they cannot specify a replacement `class`, i.e. `<foo class="text-red-500"/>` as it will be replaced
    // with this, each subcomponent of ClassifiedElement can override `get _class(){}` to specify it's own styles (classes)
    @property({ reflect: true, attribute: 'class', type: String })
    className = this._class

    // reset `className` when any of the dependencies in `_class` change
    // since `className` is associated with the attribute `class`, this updates the DOM element to specify these classes
    // and consequently causes the underlying styles (to those CSS classes) to be applied
    protected willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        super.willUpdate(_changedProperties)

        // update `className` if `_class` has changed
        if (this.className !== this._class) {
            this.className = this._class
        }
    }

    // this render() looks like it does next-to-nothing,
    // but our component itself is being rendered,
    // and it's appearance/style is provided by each component's `get _class() {}` override
    // i.e. `table` vs `table-row-group` vs `table-cell` vs ...etc...
    render() {
        return html`<slot></slot>`
    }
}

@customElement('outerbase-table')
export class Table extends ClassifiedElement {
    override connectedCallback() {
        super.connectedCallback()

        this.resizeObserver = new ResizeObserver((_entries) => {
        })

        this.resizeObserver.observe(this)
    }

    override disconnectedCallback() {
        super.disconnectedCallback()
        resizeObserver.disconnect()
    }

    protected columns: Array<string> = []
    protected rows: Array<Array<string>> = []

    // style `<outerbase-table />
    protected override get _class() {
        // TODO dynamically add/remove `select-none` when columns are being resized
        return `${super._class} table w-full text-theme-primary bg-theme-secondary`
    }

    // fetch data from Outerbase when `sourceId` changes
    @property({ type: String, attribute: 'source-id' })
    sourceId?: string

    @property({ type: String, attribute: 'auth-token' })
    authToken?: string

    @property({ type: Object, attribute: 'db-query' })
    data?: Queryd

    @property({ attribute: false })
    resizeObserver: ResizeObserver

    protected willUpdate(_changedProperties: PropertyValueMap<this> | Map<PropertyKey, unknown>): void {
        super.willUpdate(_changedProperties)

        // when `data` changes, update `rows` and `columns`
        if (_changedProperties.has('data')) {
            if (this.data && this.data.items?.length > 0) {
                this.columns = Object.keys(this.data.items[0])
                this.rows = this.data.items.map((d) => Object.values(d))
            } else {
                console.warn('this.data: ', this.data)
            }
        }

        // Note: if both `data` and `source-id` are passed to `<outerbase-component />`
        //       then it will initially render with the provided data but immediately fetch data for the provided `source-id`
        if (_changedProperties.has('sourceId')) {
            const previousSourceId = _changedProperties.get('sourceId')
            if (this.sourceId && this.sourceId !== previousSourceId) {
                console.info(`sourceId changed from ${previousSourceId} to ${this.sourceId}`)
                console.info(`fetching data for ${this.sourceId}`)
                dbRowsForSource(this.sourceId).then((data) => {
                    this.data = data
                })
            }
        }
    }

    render() {
        return html`
            <outerbase-thead>
                <outerbase-tr header>
                    <!-- render an TableHeader for each column -->
                    ${map(
                        this.columns,
                        (
                            k,
                            idx // omit column resizer on the last column because... it's awkward.
                        ) => {
                            const withResizer = (this.columns?.length ?? 0) - 1 !== idx
                            return html`<outerbase-th ?with-resizer="${withResizer}">${k}</outerbase-th>`
                        }
                    )}
                </outerbase-tr>
            </outerbase-thead>

            <outerbase-rowgroup>
                <!-- render a TableRow element for each row of data -->
                ${map(
                    this.rows,
                    (row) =>
                        html`<outerbase-tr>
                            <!-- render a TableCell for each column of data in the curernt row -->
                            <!-- NOTE: the Array.isArray(etc) is jsut temporary to render stubbed data more better -->
                            ${map(
                                row,
                                (value) => html`
                                    <outerbase-td ?separate-cells=${true} ?bottom-border=${true}
                                        >${Array.isArray(value) ? value.join(', ') : value}</outerbase-td
                                    >
                                `
                            )}
                        </outerbase-tr>`
                )}
            </outerbase-rowgroup>
        `
    }
}

// tl;dr <tbody/>, table-row-group
@customElement('outerbase-rowgroup')
export class TBody extends ClassifiedElement {
    protected get _class() {
        return `${super._class} table-row-group`
    }
}

// tl;dr <th/>, table-cell
@customElement('outerbase-th')
export class TH extends ClassifiedElement {
    @property({ attribute: 'with-resizer', type: Boolean })
    withResizer: boolean = false

    protected override get _class() {
        return classMapToClassName({
            [super._class]: true,
            'table-cell relative first:border-l border-b border-r border-t whitespace-nowrap p-1.5': true,
            'shadow-sm': !this.withResizer,
        })
    }

    override render() {
        return html`<slot></slot><column-resizer .column=${this}></column-resizer>`
    }
}

// tl;dr <thead/>, table-header-group
@customElement('outerbase-thead')
export class THead extends ClassifiedElement {
    protected get _class() {
        return `${super._class} table-header-group font-bold sticky top-0`
    }
}

// tl;dr <tr/>, table-row
@customElement('outerbase-tr')
export class TableRow extends ClassifiedElement {
    @property({ type: Boolean, attribute: 'header', reflect: true })
    isHeaderRow: boolean = false

    protected get _class() {
        return classMapToClassName({
            [super._class]: true,
            'table-row': true,
            'bg-white/80 border-b-neutral-200 backdrop-blur-sm': this.isHeaderRow,
            'hover:bg-neutral-300/10': !this.isHeaderRow,
        })
    }
}

// tl;dr <td/>, table-cell
@customElement('outerbase-td')
export class TableData extends ClassifiedElement {
    // allows, for example, <outerbase-td max-width="max-w-xl" />
    @property({ type: String, attribute: 'max-width' })
    maxWidth: string = ''

    // allows, for example, <outerbase-td separate-cells="true" />
    @property({ type: Boolean, attribute: 'separate-cells' })
    separateCells: boolean = false

    // allows, for example, <outerbase-td bottom-border="true" />
    @property({ type: Boolean, attribute: 'bottom-border' })
    withBottomBorder: boolean = false

    // dynamically determines the CSS classes that get set on the `class` attribute
    // i.e. <outerbase-td class="___" />
    protected get _class() {
        return classMapToClassName({
            [super._class]: true, // classes set by `ClassifiedElement`
            'max-w-xs': !this.maxWidth, // default max width, unless specified
            [this.maxWidth]: this.maxWidth?.length > 0, // specified max width, if any
            'border-r first:border-l': this.separateCells, // left/right borders when the `separate-cells` attribute is set
            'border-b': this.withBottomBorder, // bottom border when the `with-bototm-border` attribute is set
            'table-cell p-1.5 text-ellipsis whitespace-nowrap overflow-hidden': true, // the baseline styles for our <td/>
        })
    }
}

@customElement('column-resizer')
export class ColumnResizer extends ClassifiedElement {
    protected override get _class() {
        // TODO remove `h-8` and rely on dynamically using the Table's height
        // TODO ask GPT if there is a CSS-only way to do this instead of using an ResizeObserver
        return 'top-0 h-8 absolute right-[3px] h-[100px] hover:right-0 z-10 w-[1px] hover:w-1.5 active:w-1.5 cursor-col-resize bg-neutral-200 hover:bg-blue-300 active:bg-blue-500'
    }

    @property()
    column: typeof TH

    private xPosition: number
    private width: number

    override connectedCallback() {
        super.connectedCallback()
        this.addEventListener('mousedown', this._mouseDown)
    }

    override disconnectedCallback() {
        super.disconnectedCallback()
        this.removeEventListener('mousedown', this._mouseDown)
    }

    private _mouseDown(e: Event) {
        const _mouseMove = (e: Event) => {
            const dx = e.clientX - this.xPosition
            this.column.style.width = `${this.width + dx}px`
        }

        const _mouseUp = (e: Event) => {
            document.removeEventListener('mouseup', _mouseUp)
            document.removeEventListener('mousemove', _mouseMove)
        }

        document.addEventListener('mousemove', _mouseMove)
        document.addEventListener('mouseup', _mouseUp)

        this.xPosition = e.clientX
        this.width = parseInt(window.getComputedStyle(this.column).width, 10)
    }
}
