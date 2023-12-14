import { customElement, property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { html, type PropertyValueMap } from 'lit'
import { map } from 'lit/directives/map.js'

import { ColumnAddedEvent, ColumnRemovedEvent, RowAddedEvent, RowRemovedEvent, RowSelectionEvent, RowUpdatedEvent } from '../../lib/events'
import type { Queryd, Columns, Rows, Schema } from '../../types'
import { heightOfElement } from '../../lib/height-of-element'
import dbRowsForSource from '../../lib/rows-for-source-id'
import { ClassifiedElement } from '../classified-element'
import { TWStyles } from '../../../tailwind'

// import subcomponents
import './tbody'
import './td'
import './th'
import './thead'
import './tr'
import { repeat } from 'lit/directives/repeat.js'

@customElement('outerbase-table')
export class Table extends ClassifiedElement {
    static override styles = TWStyles // necessary, or *nothing* is styled

    @property({ type: Object, attribute: 'data' })
    public data?: Queryd

    @property({ type: Boolean, attribute: 'selectable-rows' })
    public selectableRows = false

    @property({ type: String, attribute: 'keyboard-shortcuts' })
    public keyboardShortcuts: boolean = false

    @property({ type: Object, attribute: 'schema' })
    public schema?: Schema

    // fetch data from Outerbase when `sourceId` changes
    @property({ type: String, attribute: 'source-id' })
    protected sourceId?: string

    @property({ type: String, attribute: 'auth-token' })
    protected authToken?: string

    @state()
    private _height?: number

    @state()
    private columnResizerEnabled = false

    @state()
    private resizeObserver?: ResizeObserver

    @state()
    protected columns: Columns = []

    @state()
    protected rows: Rows = []

    @state()
    protected selectedRowIndices: Set<number> = new Set<number>()

    @state()
    protected removedRowIndices: Set<number> = new Set<number>()

    @state()
    protected dirtyRowIndices: Set<number> = new Set()

    public toggleSelected(idx: number) {
        const _set = this.selectedRowIndices
        if (_set.has(idx)) _set.delete(idx)
        else _set.add(idx)
        this.requestUpdate('selectedRowIndices')
    }

    public clearSelection() {
        this.selectedRowIndices = new Set()
        this.removedRowIndices = new Set()

        this.shadowRoot?.querySelectorAll<HTMLInputElement>('.row-select-checkbox').forEach((checkbox) => {
            checkbox.checked = false
            checkbox.dispatchEvent(new Event('change'))
        })
    }

    protected onColumnResizeStart(_event: Event) {
        document.body.classList.add('select-none')
    }

    protected onColumnResizeEnd(_event: Event) {
        document.body.classList.remove('select-none')
    }

    private onColumnRemoved({ name }: ColumnRemovedEvent) {
        // TODO @johnny this event isn't propogating when using SSR w/Hydration

        // find the index of the column and remove it
        let index: number = -1
        this.columns = this.columns.filter((_name, idx) => {
            if (name === _name) {
                index = idx
                return false
            }
            return true
        })

        if (index === -1) throw new Error(`Could not find/delete column named: ${name}`)

        // remove that index from every row as well
        this.rows = this.rows.map((row) => row.filter((_value, idx) => index !== idx))
    }

    protected onKeyDown_bound?: ({ shiftKey, key }: KeyboardEvent) => void
    protected onKeyDown({ shiftKey, key }: KeyboardEvent) {
        if (!shiftKey) return

        // create column
        if (key === 'C') {
            const defaultName = `Column ${Date.now()}`
            const name = prompt('Choose a unique name for this column', defaultName) || defaultName
            this.columns = [...this.columns, name]
            this.rows.map((row) => row.push(''))
            this.dispatchEvent(new ColumnAddedEvent({ name }))
        }

        // create row
        if (key === 'R') {
            const row = new Array(this.columns.length).fill('')
            this.rows = [...this.rows, row]
            this.dispatchEvent(new RowAddedEvent({ index: this.rows.length, row }))
        }

        // TODO remove this; only added for illustration purposes
        if (key === '?') {
            const row = new Array(this.columns.length).fill('')
            this.rows = [row, ...this.rows]
            this.dispatchEvent(new RowAddedEvent({ index: 0, row }))
        }

        // delete selection
        if (key === 'D') {
            this.selectedRowIndices.forEach((index) => this.removedRowIndices.add(index))
            this.dispatchEvent(new RowRemovedEvent(Array.from(this.selectedRowIndices).map((index) => ({ index, row: this.rows[index] }))))
            this.selectedRowIndices = new Set()
            this.requestUpdate('removedRowIndices')
        }
    }

    protected onRowSelection() {
        this.dispatchEvent(new RowSelectionEvent(Array.from(this.selectedRowIndices).map((index) => ({ index, row: this.rows[index] }))))
    }

    public override connectedCallback() {
        super.connectedCallback()
        // without this `setTimeout`, then a client-side-only Table updates properly but SSR'd tables do NOT
        setTimeout(() => (this.columnResizerEnabled = true), 0)

        this.resizeObserver = new ResizeObserver((_entries) => {
            this._height = heightOfElement(_entries[0]?.target)
        })
        this.resizeObserver.observe(this)
    }

    public override disconnectedCallback() {
        super.disconnectedCallback()
        this.resizeObserver?.disconnect()

        if (this.onKeyDown_bound) {
            document.removeEventListener('keydown', this.onKeyDown_bound)
        }
    }

    protected override firstUpdated(_changedProperties: PropertyValueMap<this>): void {
        if (this.keyboardShortcuts) {
            this.onKeyDown_bound = this.onKeyDown.bind(this)
            document.addEventListener('keydown', this.onKeyDown_bound)
        }
    }

    protected override willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        super.willUpdate(_changedProperties)

        // when `data` changes, update `rows` and `columns`
        if (_changedProperties.has('data')) {
            if (this.data && this.data.rows?.length > 0) {
                this.columns = this.data.rows?.[0] ? Object.keys(this.data.rows?.[0]) : []
                this.rows = this.data.rows.map((row) => Object.values(row))
                this.dirtyRowIndices = new Set()
                this.selectedRowIndices = new Set()
                this.removedRowIndices = new Set()
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

    protected override render() {
        // WARNING `overflow-hidden` breaks the stickyness of the header
        // 'overflow-hidden' is necessary to prevent the ColumnResizer from going beyond the table.
        // because the Resizer stays in place as you scroll down the page
        // while the rest of the table scrolls out of view

        // WARNING!!! `table-auto` breaks the column resizer, while `table-fixed w-full` sort-of allows it but the table is stuck

        // this commented out version "resolves" the cells changing width with toggling between editing and viewing
        // return html`<div class="table table-fixed w-full bg-theme-page dark:bg-theme-page-dark text-theme-text dark:text-theme-text-dark">
        return html`<div
            class="table table-fixed bg-theme-table dark:bg-theme-table-dark text-theme-text dark:text-theme-text-dark font-mono text-sm"
        >
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
                          /></outerbase-th>`
                        : null}

                    <!-- render an TableHeader for each column -->
                    <!-- TODO this isn't yielding anything when SSR w/o hydration -->
                    ${repeat(
                        this.columns,
                        (name, _idx) => name,
                        (k, idx) => {
                            // omit column resizer on the last column because it's sort-of awkward
                            return html`<outerbase-th
                                @column-removed=${this.onColumnRemoved}
                                @resize-start=${this.onColumnResizeStart}
                                @resize-end=${this.onColumnResizeEnd}
                                table-height=${ifDefined(this._height)}
                                ?with-resizer=${this.columnResizerEnabled}
                                ?is-last=${idx === this.columns.length - 1}
                                ?removable=${true}
                                name="${k}"
                            >
                            </outerbase-th>`
                        }
                    )}
                </outerbase-tr>
            </outerbase-thead>

            <outerbase-rowgroup>
                <!-- render a TableRow element for each row of data -->
                ${map(this.rows, (rowValues, rowIdx) =>
                    !this.removedRowIndices.has(rowIdx)
                        ? html`<outerbase-tr
                              .selected=${this.selectedRowIndices.has(rowIdx)}
                              ?dirty=${this.dirtyRowIndices.has(rowIdx)}
                              @on-selection=${this.onRowSelection}
                          >
                              ${this.selectableRows
                                  ? html`<outerbase-td
                                        ?separate-cells=${true}
                                        ?draw-right-border=${true}
                                        ?bottom-border=${true}
                                        .position=${{
                                            row: -1,
                                            column: -1,
                                        }}
                                        .type=${null}
                                        ?no-text=${true}
                                    >
                                        <!-- intentionally @click instead of @change because otherwise we end up in an infinite loop reacting to changes -->
                                        <div class="absolute top-0 bottom-0 right-0 left-0 flex items-center justify-center h-full">
                                            <input
                                                class="row-select-checkbox h-4 w-4 mr-[1px] block"
                                                type="checkbox"
                                                ?checked="${this.selectedRowIndices.has(rowIdx)}"
                                                @click="${() => this.toggleSelected(rowIdx)}"
                                            />
                                        </div>
                                    </outerbase-td>`
                                  : null}
                              <!-- render a TableCell for each column of data in the current row -->
                              ${repeat(
                                  rowValues,
                                  (_row, idx) => this.columns[idx], // use the column name as the unique identifier for each entry in this row
                                  (value, colIdx) => html`
                                      <outerbase-td
                                          ?separate-cells=${true}
                                          ?draw-right-border=${true}
                                          ?bottom-border=${true}
                                          .value=${value}
                                          .position=${{ row: rowIdx, column: colIdx }}
                                          @cell-updated=${() => this.dispatchEvent(new RowUpdatedEvent({ index: rowIdx, row: rowValues }))}
                                      >
                                      </outerbase-td>
                                  `
                              )}
                          </outerbase-tr>`
                        : null
                )}
            </outerbase-rowgroup>
        </div>`
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'outerbase-table': Table
    }
}
