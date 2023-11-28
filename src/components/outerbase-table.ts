import { customElement, property, state } from 'lit/decorators.js'
import { LitElement, html, css, type PropertyValueMap } from 'lit'
import { TWStyles } from '../../tailwind' // this may show an import error until you run the serve once and generate the file
import { map } from 'lit/directives/map.js'

type Tabular = Array<Record<string, string>>

function classMapToClassName(classObj: Record<string, boolean>) {
    return Object.entries(classObj)
        .map(([c, isActive]) => (isActive ? c : false))
        .filter(Boolean)
        .join(' ')
}

export class ClassifiedElement extends LitElement {
    static styles = [css``, TWStyles]

    // `classes` allows the consumer of these components to pass in _additional_ classes
    // while specifying `class` would replace our styles entirely
    @property({ type: String })
    classes: string = ''

    @property({ type: String, attribute: 'false' })
    protected get _class() {
        return this.classes
    }

    // assign classes to the component itself
    // since `attribute: 'class'`, this will effectively apply the classes to our component
    @property({ reflect: true, attribute: 'class', type: String })
    className = this._class

    // reset `className` when any of the dependencies in `_class` change
    protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        super.updated(_changedProperties)

        // update `className` if `_class` has changed
        if (this.className !== this._class) {
            this.className = this._class
        }
    }

    render() {
        return html`<slot></slot>`
    }
}

@customElement('outerbase-table')
export class OuterbaseTable extends ClassifiedElement {
    protected get _class() {
        return `${super._class} table w-full text-theme-primary bg-theme-secondary`
    }

    // source-id identifies and authenticates fetching the data to be displayed
    @property({ type: String, attribute: 'source-id' })
    set sourceId(sourceId: string) {
        const previousSourceId = this.sourceId
        if (previousSourceId !== sourceId) {
            this.data = OuterbaseTable.dataForSourceId(sourceId)
            // Notify LitElement that the property has changed
            this.requestUpdate('sourceId', sourceId)
        }
    }

    @property({ type: Array })
    set data(data: Tabular) {
        // update columns and rows
        this.columns = data?.length > 0 ? Object.keys(data[0]) : []
        this.rows = data.length > 0 ? data.map((d) => Object.values(d)) : []

        // Notify LitElement that the property has changed
        this.requestUpdate('columns', this.columns)
        this.requestUpdate('rows', this.rows)
    }

    // fetch and return data from Outerbase with the provided `sourceId`
    protected static dataForSourceId(sourceId: string) {
        // TODO fetch data from Outerbase
        return [{ column: 'foo' }, { column: 'bar' }]
    }

    protected columns: Array<string> = []
    protected rows: Array<Array<string>> = []

    render() {
        return html`
            <outerbase-thead classes="font-bold">
                <outerbase-tr header>
                    ${map(
                        this.columns,
                        (
                            k,
                            idx // omit column resizer on the last column because... it's awkward.
                        ) => {
                            const withResizer = (this.columns?.length ?? 0) - 1 !== idx
                            return html`<outerbase-th ?with-resizer="${withResizer}" classes="">${k}</outerbase-th>`
                        }
                    )}
                </outerbase-tr>
            </outerbase-thead>

            <outerbase-rowgroup classes="font-light">
                ${map(
                    this.rows,
                    (row, idx) =>
                        html`<outerbase-tr>
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

@customElement('outerbase-rowgroup')
export class RG extends ClassifiedElement {
    protected get _class() {
        return `${super._class} table-row-group`
    }
}

@customElement('outerbase-th')
export class TTH extends ClassifiedElement {
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

@customElement('outerbase-thead')
export class TTHead extends ClassifiedElement {
    protected get _class() {
        return `${super._class} table-header-group font-bold sticky top-0`
    }
}

@customElement('outerbase-tr')
export class TTR extends ClassifiedElement {
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

@customElement('outerbase-td')
export class TTD extends ClassifiedElement {
    @property({ type: String, attribute: 'max-width' })
    maxWidth: string = ''

    @property({ type: Boolean, attribute: 'separate-cells' })
    separateCells: boolean = false

    @property({ type: Boolean, attribute: 'bottom-border' })
    withBottomBorder: boolean = false

    protected get _class() {
        return classMapToClassName({
            [super._class]: true,
            'max-w-xs': !this.maxWidth, // default max width
            [this.maxWidth]: this.maxWidth?.length > 0, // specified max width
            'border-r first:border-l': this.separateCells,
            'border-b': this.withBottomBorder,
            'table-cell p-1.5 text-ellipsis whitespace-nowrap overflow-hidden': true,
        })
    }
}
