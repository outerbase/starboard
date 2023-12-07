import type { Queryd, Columns, Rows, Schema } from '../../types'
import { RowSelectedEvent } from '../../lib/events'

import { customElement, property, state } from 'lit/decorators.js'
import { html, type PropertyValueMap } from 'lit'
import { heightOfElement } from '../../lib/height-of-element'
import dbRowsForSource from '../../lib/rows-for-source-id'
import { ClassifiedElement } from '../classified-element'
import { ifDefined } from 'lit/directives/if-defined.js'
import { TWStyles } from '../../../tailwind'
import { map } from 'lit/directives/map.js'

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

    @state()
    protected columns: Columns = []

    @state()
    protected rows: Rows = []

    @property({ type: Object, attribute: 'data' })
    data?: Queryd

    // fetch data from Outerbase when `sourceId` changes
    @property({ type: String, attribute: 'source-id' })
    sourceId?: string

    @property({ type: String, attribute: 'auth-token' })
    authToken?: string

    @property({ type: Boolean, attribute: 'selectable-rows' })
    selectableRows = false

    @property({ type: Array, attribute: 'selected-rows' })
    selectedRows: Array<boolean> = new Array<boolean>(this.rows.length).fill(true)

    @property({ type: Object })
    schema?: Schema

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

    override willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        super.willUpdate(_changedProperties)

        // when `data` changes, update `rows` and `columns`
        if (_changedProperties.has('data')) {
            if (this.data && this.data.rows?.length > 0) {
                this.columns = this.data.rows?.[0] ? Object.keys(this.data.rows?.[0]) : []
                this.rows = this.data.rows.map((row) => Object.values(row))
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

        // // reset selected rows when rows collection changes; this may be undesirable since it would unselect everything if the owner of the component were to provide an updated rows array because a single attribute changed
        // if (_changedProperties.has('rows')) {
        //     this.selectedRows = new Array<boolean>(this.rows.length).fill(false)
        // }
    }

    toggleSelected(idx: number) {
        // ensure selectedRows has been
        if (this.selectedRows.length !== this.rows.length) {
            this.selectedRows = new Array<boolean>(this.rows.length).fill(false)
        }

        this.selectedRows = this.selectedRows.map((row, _idx) => (idx === _idx ? !row : row))
        this.dispatchEvent(
            new RowSelectedEvent({
                index: idx,
                row: this.rows[idx],
            })
        )
    }

    onColumnResizeStart(_event: Event) {
        document.body.classList.add('select-none')
    }

    onColumnResizeEnd(_event: Event) {
        document.body.classList.remove('select-none')
    }

    render() {
        // WARNING `overflow-hidden` breaks the stickyness of the header
        // 'overflow-hidden' is necessary to prevent the ColumnResizer from going beyond the table.
        // because the Resizer stays in place as you scroll down the page
        // while the rest of the table scrolls out of view

        return html`<div class="table table-fixed w-full bg-theme-page dark:bg-theme-page-dark text-theme-text dark:text-theme-text-dark">
            <outerbase-thead>
                <outerbase-tr header>
                    <!-- first column of (optional) checkboxes -->
                    ${this.selectableRows
                        ? html`<outerbase-th
                              @resize-start=${this.onColumnResizeStart}
                              @resize-end=${this.onColumnResizeEnd}
                              table-height=${ifDefined(this._height)}
                              ?with-resizer=${this.columnResizerEnabled}
                              ?is-last=${0 < this.columns.length}
                              >Selected
                          </outerbase-th>`
                        : null}
                    <!-- render an TableHeader for each column -->
                    ${map(this.columns, (k, idx) => {
                        // omit column resizer on the last column because it's sort-of awkward
                        return html`<outerbase-th
                            @resize-start=${this.onColumnResizeStart}
                            @resize-end=${this.onColumnResizeEnd}
                            table-height=${ifDefined(this._height)}
                            ?with-resizer=${this.columnResizerEnabled}
                            ?is-last=${idx === this.columns.length - 1}
                        >
                            ${k}
                        </outerbase-th>`
                    })}
                </outerbase-tr>
            </outerbase-thead>

            <outerbase-rowgroup>
                <!-- render a TableRow element for each row of data -->
                ${map(
                    this.rows,
                    (rowValues, rowIdx) =>
                        html`<outerbase-tr .selected=${this.selectedRows[rowIdx]}>
                            ${this.selectableRows
                                ? html`<outerbase-td
                                      ?separate-cells=${true}
                                      ?draw-right-border=${!this.columnResizerEnabled}
                                      ?bottom-border=${true}
                                      .position=${{
                                          row: -1,
                                          column: -1,
                                      }} // TODO ??? I think this is set in the TD so it shouldn't even be declared here?
                                      .type=${null}
                                  >
                                      <input
                                          type="checkbox"
                                          ?checked="${this.selectedRows[rowIdx]}"
                                          @change="${() => this.toggleSelected(rowIdx)}"
                                      />
                                  </outerbase-td>`
                                : null}
                            <!-- render a TableCell for each column of data in the current row -->
                            ${map(
                                rowValues,
                                (value, colIdx) => html`
                                    <outerbase-td
                                        ?separate-cells=${true}
                                        ?draw-right-border=${colIdx === rowValues.length - 1 || !this.columnResizerEnabled}
                                        ?bottom-border=${true}
                                        .value=${value}
                                        .position=${{ row: rowIdx, column: colIdx }}
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
