import { customElement, property, state } from 'lit/decorators.js'
import { LitElement, html, type PropertyValueMap } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import { map } from 'lit/directives/map.js'
import { heightOfElement } from '../../lib/height-of-element'
import dbRowsForSource from '../../lib/rows-for-source-id'
import { ClassifiedElement } from '../classified-element'
import { TWStyles } from '../../../tailwind'
import type { Queryd } from '../../types'

@customElement('outerbase-table')
export class Table extends LitElement {
    @property({ type: Object })
    data?: Queryd

    render() {
        return html`<inner-table .data="${this.data}" auth-token="${import.meta.env.PUBLIC_AUTH_TOKEN}"></inner-table>`
    }
}

@customElement('inner-table')
class InnerTable extends ClassifiedElement {
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
            this._height = heightOfElement(_entries[0]?.target)
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
