import { customElement, property, state } from 'lit/decorators.js'
import { html, nothing, type PropertyValueMap } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import { repeat } from 'lit/directives/repeat.js'

import {
    ColumnAddedEvent,
    ColumnHiddenEvent,
    ColumnPluginActivatedEvent,
    ColumnPluginDeactivatedEvent,
    ColumnRemovedEvent,
    ResizeEvent,
    ResizeStartEvent,
    RowAddedEvent,
    RowRemovedEvent,
    RowSelectedEvent,
    RowUpdatedEvent,
} from '../../lib/events.js'
import {
    type Columns,
    type Schema,
    type HeaderMenuOptions,
    type RowAsRecord,
    type TableColumn,
    type ColumnPlugin,
    ColumnStatus,
    Theme,
    type PluginWorkspaceInstallationId,
} from '../../types.js'
import { heightOfElement } from '../../lib/height-of-element.js'
import { ClassifiedElement } from '../classified-element.js'

// import subcomponents
import './tbody.js'
import './td.js'
import './th.js'
import './thead.js'
import './tr.js'
import { classMap } from 'lit/directives/class-map.js'

@customElement('outerbase-table')
export class Table extends ClassifiedElement {
    // STATE
    @property({ type: Boolean, attribute: 'selectable-rows' })
    public selectableRows = false

    @property({ attribute: 'keyboard-shortcuts', type: Boolean })
    public keyboardShortcuts: boolean = false

    @property({ attribute: 'schema', type: Object })
    public schema?: Schema

    @property({ attribute: 'data', type: Array })
    set data(rows: Array<RowAsRecord>) {
        this.rows = rows
    }

    @property({ attribute: 'plugins', type: Array })
    public plugins?: Array<ColumnPlugin>

    @property({ attribute: 'installed-plugins', type: Array })
    public installedPlugins: Record<string, PluginWorkspaceInstallationId | undefined> = {}

    @state()
    protected rows: Array<RowAsRecord> = []

    @property({ attribute: 'non-interactive', type: Boolean })
    public isNonInteractive = false

    @property({ attribute: 'auth-token', type: String })
    public authToken?: string

    @property({ attribute: 'column-options', type: Array })
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

    @property({ attribute: 'theme', type: String })
    public theme = Theme.light

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
            ({ name, status }) =>
                status !== ColumnStatus.deleted &&
                this.hiddenColumnNames.indexOf(name) === -1 &&
                this.deletedColumnNames.indexOf(name) === -1
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

        this.rows = [...this.rows, _row]
        this.dispatchEvent(new RowAddedEvent(_row))
    }

    protected addNewColumn(name: string) {
        const column: TableColumn = {
            is_nullable: false,
            name,
            position: this.columns.length,
            model: 'column',
            type: 'string',
            unique: false,
            primaryKey: false,
            autoIncrement: false,
            status: ColumnStatus.created,
        }

        this.columns = [...this.columns, column]
        this.rows = this.rows.map((row) => ({ ...row, values: { ...row.values, [name]: '' } }))
        this.dispatchEvent(new ColumnAddedEvent({ name })) // JOHNNY pass the other data along too?
        this.updateVisibleColumns()
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
    protected onKeyDown(event: KeyboardEvent) {
        const actualTarget = event.composedPath()[0]
        const validTrigger = actualTarget instanceof HTMLElement && actualTarget.tagName !== 'INPUT' && actualTarget.tagName !== 'TEXTAREA'
        if (!validTrigger) return

        const { shiftKey, key } = event
        if (!shiftKey) return

        // create column
        if (key === 'C') {
            const defaultName = `Column ${Date.now()}`
            const name = prompt('Choose a unique name for this column', defaultName) || defaultName
            this.addNewColumn(name)
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
    protected override willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        super.willUpdate(_changedProperties)

        // identify columns from the schema
        if (_changedProperties.has('schema')) {
            if (this.schema) {
                this.columns = this.schema.columns
                this.updateVisibleColumns()
            }
        }
    }

    /////
    // dynamically adjust the table's width when columns are being resized
    private _previousWidth = 0
    // this variable is utilized while updating widths on('mousemove')
    private _onColumnResizeStart(_event: ResizeStartEvent) {
        const table = this.shadowRoot?.getElementById('table')
        if (!table) throw new Error('Unexpectedly missing a table')

        this._previousWidth = table.clientWidth
    }

    private _onColumnPluginDeactivated({ column }: ColumnPluginDeactivatedEvent) {
        delete this.installedPlugins[column]
        this.requestUpdate('installedPlugins')
    }

    private _onColumnResized({ delta }: ResizeEvent) {
        const table = this.shadowRoot?.getElementById('table')
        if (!table) throw new Error('Unexpectedly missing a table')

        table.style.width = `${this._previousWidth + delta}px`
    }

    // TODO @johnny this does not get update if the page containing the table changes
    // This is problematic when deciding which direction to render a column menu
    // An example is toggling the navigaiton menu (where there's a list of tables, queries, etc)
    // Only once you switch tabs does the reference to `distanceToLeftViewport` get recomputed.

    get distanceToLeftViewport() {
        if (typeof window === 'undefined') return -1
        return this.getBoundingClientRect().left
    }

    protected override render() {
        const tableBoundingRect = typeof window !== 'undefined' ? JSON.stringify(this.getBoundingClientRect()) : null
        // WARNING `overflow-hidden` breaks the stickyness of the header
        // 'overflow-hidden' is necessary to prevent the ColumnResizer from going beyond the table.
        // because the Resizer stays in place as you scroll down the page
        // while the rest of the table scrolls out of view

        const tableContainerClasses = { dark: this.theme == Theme.dark }
        const tableClasses = {
            'table bg-theme-table dark:bg-theme-table-dark': true,
            'text-theme-text dark:text-theme-text-dark text-sm font-mono': true,
        }

        return html`<span class=${classMap(tableContainerClasses)}
            ><div id="table" class=${classMap(tableClasses)}>
                <outerbase-thead>
                    <outerbase-tr header>
                        <!-- first column of (optional) checkboxes -->
                        ${this.selectableRows
                            ? html`<outerbase-th
                              table-height=${ifDefined(this._height)}
                              theme=${this.theme}
                              ?separate-cells=${true}
                              ?outter-border=${this.outterBorder}
                              ?is-last=${0 === this.visibleColumns.length}
                              ?blank=${true}
                          /></outerbase-th>`
                            : null}
                        ${repeat(
                            this.visibleColumns,
                            ({ name }, _idx) => name,
                            ({ name }, idx) => {
                                // omit column resizer on the last column because it's sort-of awkward
                                return html`<outerbase-th
                                    .options=${this.columnOptions || nothing}
                                    .plugins="${this.plugins}"
                                    installed-plugins=${JSON.stringify(this.installedPlugins)}
                                    .plugin=${this.plugins?.find(
                                        ({ pluginWorkspaceId }) => pluginWorkspaceId === this.installedPlugins[name]?.plugin_workspace_id
                                    )}
                                    table-height=${ifDefined(this._height)}
                                    theme=${this.theme}
                                    name="${this.renamedColumns[name] ?? name}"
                                    original-value="${name}"
                                    left-distance-to-viewport=${this.distanceToLeftViewport}
                                    ?separate-cells=${true}
                                    ?outter-border=${this.outterBorder}
                                    ?menu=${!this.isNonInteractive}
                                    ?with-resizer=${!this.isNonInteractive}
                                    ?is-last=${idx === this.visibleColumns.length - 1}
                                    ?removable=${true}
                                    ?interactive=${!this.isNonInteractive}
                                    @column-hidden=${this._onColumnHidden}
                                    @column-removed=${this._onColumnRemoved}
                                    @resize-start=${this._onColumnResizeStart}
                                    @column-plugin-deactivated=${this._onColumnPluginDeactivated}
                                    @resize=${this._onColumnResized}
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
                                                .position=${{
                                                    row: id,
                                                    column: '__selected', // our own; not expected to exist in DB
                                                }}
                                                .type=${null}
                                                theme=${this.theme}
                                                ?separate-cells=${true}
                                                ?draw-right-border=${true}
                                                ?bottom-border=${true}
                                                ?outter-border=${this.outterBorder}
                                                ?blank=${true}
                                                ?is-last-row=${rowIndex === this.rows.length - 1}
                                                ?is-last-column=${false}
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
                                          ({ name }) => name, // use the column name as the unique identifier for each entry in this row
                                          ({ name }, idx) => html`
                                              <!-- TODO @johnny remove separate-cells and instead rely on css variables to suppress borders -->
                                              <!-- TODO @caleb & johnny move plugins to support the new installedPlugins variable -->
                                              <outerbase-td
                                                  .position=${{ row: id, column: name }}
                                                  value=${values[name] ?? ''}
                                                  original-value=${originalValues[name]}
                                                  left-distance-to-viewport=${this.distanceToLeftViewport}
                                                  table-bounding-rect="${tableBoundingRect}"
                                                  theme=${this.theme}
                                                  .plugin=${this.plugins?.find(
                                                      ({ pluginWorkspaceId }) =>
                                                          pluginWorkspaceId === this.installedPlugins[name]?.plugin_workspace_id
                                                  )}
                                                  ?separate-cells=${true}
                                                  ?draw-right-border=${true}
                                                  ?bottom-border=${true}
                                                  ?outter-border=${this.outterBorder}
                                                  ?is-last-row=${rowIndex === this.rows.length - 1}
                                                  ?is-last-column=${idx === this.visibleColumns.length - 1}
                                                  ?menu=${!this.isNonInteractive}
                                                  ?selectable-text=${this.isNonInteractive}
                                                  ?interactive=${!this.isNonInteractive}
                                                  ?hide-dirt=${isNew}
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
            </div>
        </span>`
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'outerbase-table': Table
    }
}
