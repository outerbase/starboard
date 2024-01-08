import { customElement, property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { html, nothing, type PropertyValueMap } from 'lit'
import { repeat } from 'lit/directives/repeat.js'

import {
    ColumnAddedEvent,
    ColumnHiddenEvent,
    ColumnRemovedEvent,
    RowAddedEvent,
    RowRemovedEvent,
    RowSelectedEvent,
    RowUpdatedEvent,
} from '../../lib/events.js'
import type { Queryd, Columns, Schema, HeaderMenuOptions, RowAsRecord } from '../../types.js'
import { heightOfElement } from '../../lib/height-of-element.js'
import dbRowsForSource from '../../lib/rows-for-source-id.js'
import { ClassifiedElement } from '../classified-element.js'
import { TWStyles } from '../../../tailwind/index.js'

// import subcomponents
import './tbody.js'
import './td.js'
import './th.js'
import './thead.js'
import './tr.js'

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

    @property({ type: Boolean, attribute: 'non-interactive' })
    public isNonInteractive = false

    // fetch data from Outerbase when `sourceId` changes
    @property({ type: String, attribute: 'source-id' })
    protected sourceId?: string

    @property({ type: String, attribute: 'auth-token' })
    protected authToken?: string

    @property({ type: Array, attribute: 'column-options' })
    protected columnOptions?: Array<HeaderMenuOptions>

    @state()
    private _height?: number

    @state()
    private resizeObserver?: ResizeObserver

    @state()
    protected columns: Columns = []

    // TODO @johnny make this a Set
    @property({ attribute: 'hidden-columns', type: Array })
    private _hiddenColumnNames: Array<string> = []

    @property({ attribute: 'deleted-columns', type: Array })
    public _deletedColumnNames: Array<string> = []

    @state()
    protected visibleColumns: Columns = []
    protected updateVisibleColumns() {
        this.visibleColumns = this.columns.filter(
            ({ name }) => this._hiddenColumnNames.indexOf(name) === -1 && this._deletedColumnNames.indexOf(name) === -1
        )
    }

    @property({ attribute: 'rows', type: Array })
    public rows: Array<RowAsRecord> = []

    @state()
    protected selectedRowUUIDs: Set<string> = new Set()

    @state()
    protected removedRowUUIDs: Set<string> = new Set()

    public toggleSelected(uuid: string) {
        const _set = this.selectedRowUUIDs
        if (_set.has(uuid)) _set.delete(uuid)
        else _set.add(uuid)
        this.requestUpdate('selectedRowUUIDs')
    }

    public clearSelection() {
        this.selectedRowUUIDs = new Set()
        this.removedRowUUIDs = new Set()

        this.shadowRoot?.querySelectorAll<HTMLInputElement>('.row-select-checkbox').forEach((checkbox) => {
            checkbox.checked = false
            checkbox.dispatchEvent(new Event('change'))
        })
    }

    // remove data changes
    public discardChanges() {
        this.clearSelection() // rows
        this._deletedColumnNames = []
    }

    // remove param settings
    public resetParams() {
        this.clearSelection()
        this._hiddenColumnNames = []
    }

    private _onColumnRemoved({ name }: ColumnRemovedEvent) {
        // remove the column named `name` from columns collection
        this._deletedColumnNames.push(name)
        this.requestUpdate('columns')
        this.updateVisibleColumns()
    }

    private _onColumnHidden({ name }: ColumnHiddenEvent) {
        this._hiddenColumnNames.push(name)
        this.requestUpdate('columns')
        this.updateVisibleColumns()
    }

    protected _onRowSelection() {
        const selectedRows: Array<RowAsRecord> = []
        this.selectedRowUUIDs.forEach((_id) => {
            const row = this.rows.find(({ id }) => _id === id)
            if (row) selectedRows.push(row)
        })

        this.dispatchEvent(new RowSelectedEvent(selectedRows))
    }

    protected onKeyDown_bound?: ({ shiftKey, key }: KeyboardEvent) => void
    protected onKeyDown({ shiftKey, key }: KeyboardEvent) {
        if (!shiftKey) return

        // create column
        if (key === 'C') {
            const defaultName = `Column ${Date.now()}`
            const name = prompt('Choose a unique name for this column', defaultName) || defaultName
            this.columns = [
                ...this.columns,
                {
                    is_nullable: false,
                    name,
                    position: this.columns.length,
                    model: 'column',
                    type: 'string',
                    unique: false,
                    primaryKey: false,
                    autoIncrement: false,
                },
            ]
            this.rows = this.rows.map((row) => ({ ...row, values: { ...row.values, [name]: '' } }))
            this.dispatchEvent(new ColumnAddedEvent({ name }))
        }

        // create row
        if (key === 'R') {
            const id = self.crypto.randomUUID()
            const row: RowAsRecord = { id, values: {}, originalValues: {}, isNew: true }
            this.rows = [...this.rows, row]
            this.dispatchEvent(new RowAddedEvent(row))
        }

        // delete selection
        if (key === 'D') {
            this.selectedRowUUIDs.forEach((uuid) => this.removedRowUUIDs.add(uuid))

            const removedRows: Array<RowAsRecord> = []
            this.selectedRowUUIDs.forEach((_id) => {
                const row = this.rows.find(({ id }) => _id === id)
                if (row) removedRows.push(row)
            })

            this.dispatchEvent(new RowRemovedEvent(removedRows))
            this.selectedRowUUIDs = new Set()
            this.requestUpdate('removedRowUUIDs')
        }
    }

    public override connectedCallback() {
        super.connectedCallback()

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

        // when the row collection changes, reset selected/removed
        // WARNING @johnny we probably don't want this to happen but instead to remove ones that are missing from the rows collection
        if (_changedProperties.has('rows')) {
            if (this.rows && this.rows.length > 0) {
                this.selectedRowUUIDs = new Set()
                this.removedRowUUIDs = new Set()
            }
        }

        // identify columns from the schema
        if (_changedProperties.has('schema')) {
            if (this.schema) {
                this.columns = this.schema.columns
                this.updateVisibleColumns()
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
                              table-height=${ifDefined(this._height)}
                              ?is-last=${0 < this.visibleColumns.length}
                              ?blank=${true}
                          /></outerbase-th>`
                        : null}

                    <!-- render an TableHeader for each column -->
                    <!-- TODO this isn't yielding anything when SSR w/o hydration -->
                    ${repeat(
                        this.visibleColumns,
                        ({ name }, _idx) => name,
                        ({ name }, idx) => {
                            // omit column resizer on the last column because it's sort-of awkward
                            return html`<outerbase-th
                                @column-hidden=${this._onColumnHidden}
                                @column-removed=${this._onColumnRemoved}
                                table-height=${ifDefined(this._height)}
                                ?menu=${!this.isNonInteractive}
                                ?with-resizer=${!this.isNonInteractive}
                                ?is-last=${idx === this.visibleColumns.length - 1}
                                ?removable=${true}
                                ?interactive=${!this.isNonInteractive}
                                name="${name}"
                                .options=${this.columnOptions || nothing}
                            >
                            </outerbase-th>`
                        }
                    )}
                </outerbase-tr>
            </outerbase-thead>

            <outerbase-rowgroup>
                <!-- render a TableRow element for each row of data -->
                ${repeat(
                    this.rows,
                    ({ id }) => id,
                    ({ id, values, originalValues, isNew }) => {
                        return !this.removedRowUUIDs.has(id)
                            ? html`<outerbase-tr
                                  .selected=${this.selectedRowUUIDs.has(id)}
                                  ?dirty=${isNew}
                                  @on-selection=${this._onRowSelection}
                              >
                                  <!-- checkmark cell -->
                                  ${this.selectableRows
                                      ? html`<outerbase-td
                                            ?separate-cells=${true}
                                            ?draw-right-border=${true}
                                            ?bottom-border=${true}
                                            ?blank=${true}
                                            .position=${{
                                                row: id,
                                                column: '__selected', // our own; not expected to exist in DB
                                            }}
                                            .type=${null}
                                            ?row-selector="${true}"
                                        >
                                            <!-- intentionally @click instead of @change because otherwise we end up in an infinite loop reacting to changes -->
                                            <div class="absolute top-0 bottom-0 right-0 left-0 flex items-center justify-center h-full">
                                                <input
                                                    class="row-select-checkbox h-4 w-4 mr-[1px] block focus:z-10 "
                                                    type="checkbox"
                                                    ?checked="${this.selectedRowUUIDs.has(id)}"
                                                    @click="${() => this.toggleSelected(id)}"
                                                    tabindex="0"
                                                />
                                            </div>
                                        </outerbase-td>`
                                      : null}

                                  <!-- render a TableCell for each column of data in the current row -->
                                  ${repeat(
                                      this.visibleColumns,
                                      ({ name }) => name, // use the column name as the unique identifier for each entry in this row
                                      ({ name }) => html`
                                          <!-- TODO @johnny remove separate-cells and instead rely on css variables to suppress borders -->
                                          <outerbase-td
                                              ?separate-cells=${true}
                                              ?draw-right-border=${true}
                                              ?bottom-border=${true}
                                              ?menu=${!this.isNonInteractive}
                                              ?selectable-text=${this.isNonInteractive}
                                              ?interactive=${!this.isNonInteractive}
                                              value=${values[name] ?? ''}
                                              originalValue=${originalValues[name]}
                                              .position=${{ row: id, column: name }}
                                              @cell-updated=${() => {
                                                  this.dispatchEvent(new RowUpdatedEvent({ id, values, originalValues, isNew }))
                                              }}
                                          >
                                          </outerbase-td>
                                      `
                                  )}
                              </outerbase-tr>`
                            : null
                    }
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
