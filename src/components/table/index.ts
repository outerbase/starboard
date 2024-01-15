import { customElement, property, state } from 'lit/decorators.js'
import { html, nothing, type PropertyValueMap } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import { repeat } from 'lit/directives/repeat.js'

import {
    ColumnAddedEvent,
    ColumnHiddenEvent,
    ColumnRemovedEvent,
    ResizeEvent,
    ResizeStartEvent,
    RowAddedEvent,
    RowRemovedEvent,
    RowSelectedEvent,
    RowUpdatedEvent,
} from '../../lib/events.js'
import type { Columns, Schema, HeaderMenuOptions, RowAsRecord } from '../../types.js'
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

    // TODO @johnny determine if we need this for third-party usage (because Dashboard doesn't)
    // protected override get classMap() {
    //     return {
    //         'overflow-scroll overscroll-contain': true,
    //     }
    // }

    // STATE
    @property({ type: Boolean, attribute: 'selectable-rows' })
    public selectableRows = false

    @property({ type: String, attribute: 'keyboard-shortcuts' })
    public keyboardShortcuts: boolean = false

    // TODO use or remove this property
    @property({ type: String, attribute: 'source-id' })
    public sourceId?: string

    @property({ type: Object, attribute: 'schema' })
    public schema?: Schema

    @property({ attribute: 'rows', type: Array })
    public rows: Array<RowAsRecord> = []

    @property({ type: Boolean, attribute: 'non-interactive' })
    public isNonInteractive = false

    @property({ type: String, attribute: 'auth-token' })
    public authToken?: string

    @property({ type: Array, attribute: 'column-options' })
    public columnOptions?: Array<HeaderMenuOptions>

    @property({ attribute: 'outter-border', type: Boolean })
    public outterBorder = false

    // TODO @johnny make this a Set
    @property({ attribute: 'hidden-columns', type: Array })
    public hiddenColumnNames: Array<string> = []

    @property({ attribute: 'deleted-columns', type: Array })
    public deletedColumnNames: Array<string> = []

    @property({ attribute: 'renamed-columns', type: Object })
    public renamedColumns: Record<string, string> = {}

    @state()
    private _height?: number

    @state()
    private resizeObserver?: ResizeObserver

    @state()
    protected columns: Columns = []

    @state()
    protected visibleColumns: Columns = []
    protected updateVisibleColumns() {
        this.visibleColumns = this.columns.filter(
            ({ name }) => this.hiddenColumnNames.indexOf(name) === -1 && this.deletedColumnNames.indexOf(name) === -1
        )
    }
    @state()
    protected selectedRowUUIDs: Set<string> = new Set()

    @state()
    protected removedRowUUIDs: Set<string> = new Set()

    // METHODS (public)
    public addNewRow(row?: Partial<RowAsRecord>) {
        const _row: RowAsRecord = {
            id: row?.id ?? self.crypto.randomUUID(),
            values: row?.values ?? {},
            originalValues: row?.originalValues ?? {},
            isNew: row?.isNew ?? true,
        }

        this.rows.push(_row)
        this.requestUpdate('rows')
        this.dispatchEvent(new RowAddedEvent(_row))
    }

    public toggleSelectedRow(uuid: string) {
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

    // clear data changes
    public discardChanges() {
        this.clearSelection() // rows
        this.deletedColumnNames = []
    }

    // clear param settings
    public resetParams() {
        this.clearSelection()
        this.hiddenColumnNames = []
    }

    // METHODS (private)
    protected _onColumnRemoved({ name }: ColumnRemovedEvent) {
        // remove the column named `name` from columns collection
        this.deletedColumnNames.push(name)
        this.requestUpdate('columns')
        this.updateVisibleColumns()
    }

    protected _onColumnHidden({ name }: ColumnHiddenEvent) {
        this.hiddenColumnNames.push(name)
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

    // KEYBOARD SHORTCUTS
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
            this.addNewRow()
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

    // LIFECYCLE HOOKS
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

    // this variable is incremented in `willUpdate` when our parent provies a new `rows` array
    // it's purpose is to force all of the fields to be reset, i.e. on discard changes we want to forget changes to `value`
    // this is accomplished by involving it in the `key` property of the `repeat` call in `render()`
    private _version = 0
    protected override willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        super.willUpdate(_changedProperties)

        // when the row collection changes, reset selected/removed
        if (_changedProperties.has('rows')) {
            this._version += 1
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
                    //
                })
            }
        }
    }

    private _previousWidth = 0
    // this variable is utilized while updating widths on('mousemove')
    private _onColumnResizeStart(_event: ResizeStartEvent) {
        const table = this.shadowRoot?.getElementById('table')
        if (!table) throw new Error('Unexpectedly missing a table')

        this._previousWidth = table.clientWidth
    }

    private _onColumnResized({ delta }: ResizeEvent) {
        const table = this.shadowRoot?.getElementById('table')
        if (!table) throw new Error('Unexpectedly missing a table')

        table.style.width = `${this._previousWidth + delta}px`
    }

    protected override render() {
        // WARNING `overflow-hidden` breaks the stickyness of the header
        // 'overflow-hidden' is necessary to prevent the ColumnResizer from going beyond the table.
        // because the Resizer stays in place as you scroll down the page
        // while the rest of the table scrolls out of view

        return html`<div
            id="table"
            class="table bg-theme-table dark:bg-theme-table-dark text-theme-text dark:text-theme-text-dark font-mono text-sm"
        >
            <outerbase-thead>
                <outerbase-tr header>
                    <!-- first column of (optional) checkboxes -->
                    ${this.selectableRows
                        ? html`<outerbase-th
                              table-height=${ifDefined(this._height)}
                              ?separate-cells=${true}
                              ?outter-border=${this.outterBorder}
                              ?is-last=${0 === this.visibleColumns.length}
                              ?blank=${true}
                          /></outerbase-th>`
                        : null}
                    ${repeat(
                        this.visibleColumns,
                        ({ name }, _idx) => `${this._version}:${name}`,
                        ({ name }, idx) => {
                            // omit column resizer on the last column because it's sort-of awkward
                            return html`<outerbase-th
                                @column-hidden=${this._onColumnHidden}
                                @column-removed=${this._onColumnRemoved}
                                @resize-start=${this._onColumnResizeStart}
                                @resize=${this._onColumnResized}
                                table-height=${ifDefined(this._height)}
                                ?separate-cells=${true}
                                ?outter-border=${this.outterBorder}
                                ?menu=${!this.isNonInteractive}
                                ?with-resizer=${!this.isNonInteractive}
                                ?is-last=${idx === this.visibleColumns.length - 1}
                                ?removable=${true}
                                ?interactive=${!this.isNonInteractive}
                                name="${this.renamedColumns[name] ?? name}"
                                original-value="${name}"
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
                    ({ id }) => `${this._version}:${id}`,
                    ({ id, values, originalValues, isNew }, rowIndex) => {
                        return !this.removedRowUUIDs.has(id)
                            ? html`<outerbase-tr
                                  .selected=${this.selectedRowUUIDs.has(id)}
                                  ?new=${isNew}
                                  @on-selection=${this._onRowSelection}
                              >
                                  <!-- checkmark cell -->
                                  ${this.selectableRows
                                      ? html`<outerbase-td
                                            ?separate-cells=${true}
                                            ?draw-right-border=${true}
                                            ?bottom-border=${true}
                                            ?outter-border=${this.outterBorder}
                                            ?blank=${true}
                                            ?is-last-row=${rowIndex === this.rows.length - 1}
                                            ?is-last-column=${false}
                                            ?interactive=${!this.isNonInteractive}
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
                                                    @click="${() => this.toggleSelectedRow(id)}"
                                                    tabindex="0"
                                                />
                                            </div>
                                        </outerbase-td>`
                                      : null}

                                  <!-- render a TableCell for each column of data in the current row -->
                                  ${repeat(
                                      this.visibleColumns,
                                      ({ name }) => `${this._version}:${name}`, // use the column name as the unique identifier for each entry in this row
                                      ({ name }, idx) => html`
                                          <!-- TODO @johnny remove separate-cells and instead rely on css variables to suppress borders -->
                                          <outerbase-td
                                              ?separate-cells=${true}
                                              ?draw-right-border=${true}
                                              ?bottom-border=${true}
                                              ?outter-border=${this.outterBorder}
                                              ?is-last-row=${rowIndex === this.rows.length - 1}
                                              ?is-last-column=${idx === this.visibleColumns.length - 1}
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
