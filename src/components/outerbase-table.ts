import { customElement, property } from 'lit/decorators.js'
import { LitElement, html, css, type PropertyValueMap } from 'lit'
import { TWStyles } from '../../tailwind' // this may show an import error until you run the serve once and generate the file
import { map } from 'lit/directives/map.js'

// an Array of Objects, where each Object is a Row from a Database
type Tabular = Array<Record<string, string>>

// takes in an Object of the form `{ 'class1 class2': true, 'class3': false }`
// where the Boolean true/false is determined at runtime
// based on conditions set in each Subclass's `_class()` method
//
// inspired by (but different than) Lit's [classMap](https://lit.dev/docs/templates/directives/#classmap) feature
function classMapToClassName(classObj: Record<string, boolean>) {
    return Object.entries(classObj)
        .map(([c, isActive]) => (isActive ? c : false))
        .filter(Boolean)
        .join(' ')
}

// ClassifiedElement deals primarily with ensuring that each Super Class's style
// is propogated to the DOM and therefore it's CSS is applied
export class ClassifiedElement extends LitElement {
    // include CSS for all the Tailwind classes present in our code
    static styles = [css``, TWStyles]

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
    static override styles = [css``, ...super.styles]

    // style `<outerbase-table />
    protected get _class() {
        return `${super._class} table w-full text-theme-primary bg-theme-secondary`
    }

    // source-id identifies and authenticates fetching the data from Outerbase
    @property({ type: String, attribute: 'source-id' })
    set sourceId(sourceId: string) {
        const previousSourceId = this.sourceId
        if (previousSourceId !== sourceId) {
            this.data = Table.dataForSourceId(sourceId)
            // Notify LitElement that the property has changed
            // Note: this might be automatic and unnecessary? TBD.
            this.requestUpdate('sourceId', sourceId)
        }
    }

    // data is an Array of Objects whose key/value map to each DB column's value
    @property({ type: Array })
    set data(data: Tabular) {
        // extract columns and rows into their own collections
        this.columns = data?.length > 0 ? Object.keys(data[0]) : []
        this.rows = data.length > 0 ? data.map((d) => Object.values(d)) : []

        // Notify LitElement that the property has changed
        // TBD if this is necessary or automatic
        this.requestUpdate('columns', this.columns)
        this.requestUpdate('rows', this.rows)
    }

    // fetch and return data from Outerbase with the provided `sourceId`
    // TODO implement this
    protected static dataForSourceId(sourceId: string) {
        // TODO fetch data from Outerbase
        return [{ column: 'foo' }, { column: 'bar' }]
    }

    protected columns: Array<string> = []
    protected rows: Array<Array<string>> = []

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
                    (row, idx) =>
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

    protected get _class() {
        return classMapToClassName({
            [super._class]: true,
            'table-cell relative first:border-l border-b border-r border-t whitespace-nowrap p-1.5': true,
            'shadow-sm': !this.withResizer,
        })
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
