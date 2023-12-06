import { customElement, property, state } from 'lit/decorators.js'
import { html, type PropertyValueMap } from 'lit'
import { heightOfElement } from '../../lib/height-of-element'
import dbRowsForSource from '../../lib/rows-for-source-id'
import { ClassifiedElement } from '../classified-element'
import { ifDefined } from 'lit/directives/if-defined.js'
import { TWStyles } from '../../../tailwind'
import { map } from 'lit/directives/map.js'
import type { Queryd } from '../../types'

// import subcomponents
import './tbody'
import './td'
import './th'
import './thead'
import './tr'

@customElement('outerbase-table')
export class Table extends ClassifiedElement {
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
        // WARNING `overflow-hidden` breaks the stickyness of the header
        // 'overflow-hidden' is necessary to prevent the ColumnResizer from going beyond the table.
        // because the Resizer stays in place as you scroll down the page
        // while the rest of the table scrolls out of view

        return html`<div
            class="table table-fixed w-full select-none bg-theme-page dark:bg-theme-page-dark text-theme-text dark:text-theme-text-dark"
        >
            <outerbase-thead>
                <outerbase-tr header>
                    <!-- render an TableHeader for each column -->
                    ${map(this.columns, (k, idx) => {
                        // omit column resizer on the last column because it's sort-of awkward
                        return html`<outerbase-th
                            table-height=${ifDefined(this._height)}
                            ?with-resizer=${this.columnResizerEnabled}
                            ?is-last=${idx === this.columns.length - 1}
                            >${k}
                        </outerbase-th>`
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
                                        .value=${value}
                                    >
                                    </outerbase-td>
                                `
                            )}
                        </outerbase-tr>`
                )}
            </outerbase-rowgroup>
        </div> `
    }
}
