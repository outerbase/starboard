import { html, nothing, type PropertyValueMap } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { repeat } from 'lit/directives/repeat.js'

import arrayToObject from '../../lib/array-to-object.js'
import {
    ColumnAddedEvent,
    ColumnHiddenEvent,
    ColumnPluginDeactivatedEvent,
    ColumnRemovedEvent,
    MenuOpenEvent,
    ResizeEvent,
    RowAddedEvent,
    RowRemovedEvent,
    RowSelectedEvent,
} from '../../lib/events.js'
import {
    ColumnStatus,
    DBType,
    Theme,
    type ColumnPlugin,
    type Columns,
    type HeaderMenuOptions,
    type PluginWorkspaceInstallationId,
    type RowAsRecord,
    type Schema,
    type TableColumn,
} from '../../types.js'
import { ClassifiedElement } from '../classified-element.js'

// import subcomponents
import { styleMap } from 'lit/directives/style-map.js'
import throttle from 'lodash-es/throttle.js'
import '../check-box.js'
import '../widgets/add-column.js'
import './tbody.js'
import './td.js'
import './th.js'
import './thead.js'
import './tr.js'

const SCROLL_THROTTLE_MS = 10
const SCROLL_BUFFER_SIZE = 30

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
    public installedPlugins?: Record<string, PluginWorkspaceInstallationId | undefined>

    @state()
    protected rows: Array<RowAsRecord> = []

    @state()
    private newRows: Array<RowAsRecord> = []

    @state()
    private existingRows: Array<RowAsRecord> = []

    @property({ attribute: 'non-interactive', type: Boolean })
    public isNonInteractive = false

    @property({ attribute: 'auth-token', type: String })
    public authToken?: string

    @property({ attribute: 'column-options', type: Array })
    public columnOptions?: Array<HeaderMenuOptions>

    @property({ attribute: 'outer-border', type: Boolean })
    public outerBorder = false

    // TODO @johnny make this a Set
    @property({ attribute: 'hidden-columns', type: Array })
    public hiddenColumnNames: Array<string> = []

    @property({ attribute: 'deleted-columns', type: Array })
    public deletedColumnNames: Array<string> = []

    @property({ attribute: 'renamed-columns', type: Object })
    public renamedColumnNames: Record<string, string | undefined> = {}

    @property({ attribute: 'theme', type: String })
    public theme = Theme.light

    @property({ attribute: 'plugin-attributes', type: String })
    public pluginAttributes: String = ''

    @property({ attribute: 'read-only', type: Boolean })
    public readonly = false

    @property({ attribute: 'blank-fill', type: Boolean })
    public blankFill = false

    @property({ attribute: 'column-width-offsets', type: Object })
    public columnWidthOffsets: Record<string, number | undefined> = {}

    @property({ attribute: 'addable-columns', type: Boolean })
    public addableColumns = false

    @state()
    public allRowsSelected = false

    @state()
    private _height?: number

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

    @state()
    columnTypes?: Record<string, string | number | boolean | undefined>

    constructor() {
        super()
        this.onScroll = throttle(this.onScroll.bind(this), SCROLL_THROTTLE_MS) // Debounce the onScroll method
        // this.onScroll = debounce(this.onScroll.bind(this), 1)
    }

    protected closeLastMenu?: () => void
    protected fromIdToRowMap: Record<string, RowAsRecord | undefined> = {}

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
        return _row
    }

    protected addNewColumn(name: string) {
        const column: TableColumn = {
            is_nullable: false,
            name,
            position: this.columns.length,
            model: 'column',
            type: DBType.TEXT,
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

    public deleteSelectedRows() {
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

    // TODO @johnny 'Select All' is firing this once for each row instead of just once
    protected _onRowSelection() {
        const selectedRows: Array<RowAsRecord> = []
        this.selectedRowUUIDs.forEach((_id) => {
            const row = this.fromIdToRowMap[_id]
            if (row) selectedRows.push(row)
        })

        this.dispatchEvent(new RowSelectedEvent(selectedRows))
    }

    protected widthForColumnType(name: string, offset = 0) {
        const columnType = this.visibleColumns.find(({ name: _name }) => name === _name)?.type?.toUpperCase() as DBType
        if (
            [
                DBType.BIGINT,
                DBType.DECIMAL,
                DBType.DECIMAL,
                DBType.DOUBLE_PRECISION,
                DBType.INTEGER,
                DBType.NUMERIC,
                DBType.REAL,
                DBType.SMALLINT,
                DBType.INT,
            ].includes(columnType)
        )
            return 150 + offset
        if ([DBType.CHAR, DBType.TEXT, DBType.VARCHAR, DBType.VARYING].includes(columnType)) return 200 + offset
        if ([DBType.TIME, DBType.DATE, DBType.TIMESTAMP].includes(columnType)) return 110 + offset
        if ([DBType.TIME_WITH_TIME_ZONE, DBType.DATETIME, DBType.TIMESTAMP_WITH_TIME_ZONE].includes(columnType)) return 200 + offset
        if ([DBType.JSON, DBType.JSONB].includes(columnType)) return 200 + offset
        if ([DBType.UUID].includes(columnType)) return 300 + offset

        return 200 + offset
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
            this.deleteSelectedRows()
        }
    }

    public override connectedCallback(): void {
        super.connectedCallback()

        // wait for the DOM to contain the #scroller
        setTimeout(() => {
            // then add PASSIVE event listeners
            const scroller = this.shadowRoot?.querySelector('#scroller')
            scroller?.addEventListener('scroll', this.onScroll, { passive: true })
            scroller?.addEventListener('scrollend', this.onScroll, { passive: true })
        }, 0)
    }

    public override disconnectedCallback() {
        super.disconnectedCallback()

        // remove event listeners
        this.querySelector('#scroller')?.removeEventListener('scroll', this.onScroll)
        this.querySelector('#scroller')?.removeEventListener('scrollend', this.onScroll)

        if (this.onKeyDown_bound) {
            document.removeEventListener('keydown', this.onKeyDown_bound)
        }
    }

    protected override firstUpdated(_changedProperties: PropertyValueMap<this>): void {
        if (this.keyboardShortcuts) {
            this.onKeyDown_bound = this.onKeyDown.bind(this)
            document.addEventListener('keydown', this.onKeyDown_bound)
        }

        // set table width
        const table = this.shadowRoot?.getElementById('table')
        if (!table) throw new Error('Unexpectedly missing a table')
        this._previousWidth = table.clientWidth
        table.style.width = `${this._previousWidth}px`

        this.updateVisibleRows(0)
    }

    protected override willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        super.willUpdate(_changedProperties)

        // identify columns from the schema
        if (_changedProperties.has('schema')) {
            if (this.schema) {
                this.columns = this.schema.columns
                this.columnTypes = arrayToObject(this.columns, 'name', 'type')
                this.updateVisibleColumns()
            }
        }

        if (_changedProperties.has('theme')) {
            this.setCssVariablesForPlugin(this.theme)
        }

        if (_changedProperties.has('selectedRowUUIDs')) {
            // disqualify 0 === 0
            if (this.rows.length === 0) return

            if (this.selectedRowUUIDs.size !== this.rows.length && this.allRowsSelected) {
                this.allRowsSelected = false
            } else if (this.selectedRowUUIDs.size === this.rows.length && !this.allRowsSelected) {
                this.allRowsSelected = true
            }
        }

        if (_changedProperties.has('rows')) {
            const m: Record<string, RowAsRecord | undefined> = {}
            this.rows.forEach((r) => {
                m[r.id] = r
            })
            this.fromIdToRowMap = m

            this.updateTableView() // updates this.visibleRows
            this.newRows = this.rows.filter(({ isNew }) => isNew)
        }

        if (_changedProperties.has('visibleRows')) {
            this.existingRows = this.visibleRows.filter(({ isNew }) => !isNew)
        }
    }

    /////
    // dynamically adjust the table's width when columns are being resized
    // this variable is utilized while updating widths on('mousemove')
    private _previousWidth = 0
    private _onColumnResizeStart() {
        const table = this.shadowRoot?.getElementById('table')
        if (!table) throw new Error('Unexpectedly missing a table')

        this._previousWidth = table.clientWidth
    }

    private _onColumnResized({ delta }: ResizeEvent) {
        const table = this.shadowRoot?.getElementById('table')
        if (!table) throw new Error('Unexpectedly missing a table')

        table.style.width = `${this._previousWidth + delta}px`
    }

    private _onColumnPluginDeactivated({ column }: ColumnPluginDeactivatedEvent) {
        if (this.installedPlugins) {
            delete this.installedPlugins[column]
            this.requestUpdate('installedPlugins')
        }
    }

    private setCssVariablesForPlugin(theme: Theme) {
        if (typeof document === 'undefined') return

        if (theme === Theme.dark) {
            document.documentElement.style.setProperty('--ob-background-color', '#0A0A0A')
            document.documentElement.style.setProperty('--ob-text-color', '#D4D4D4')
            document.documentElement.style.setProperty('--ob-border-color', '#262626')
            document.documentElement.style.setProperty('--ob-null-text-color', '#959497')
        } else {
            document.documentElement.style.setProperty('--ob-background-color', '#FAFAFA')
            document.documentElement.style.setProperty('--ob-text-color', '#525252')
            document.documentElement.style.setProperty('--ob-border-color', '#E5E5E5')
            document.documentElement.style.setProperty('--ob-null-text-color', '#D0D0D0')
        }

        document.documentElement.style.setProperty('--ob-font-family', '"Inter", sans-serif')
        document.documentElement.style.setProperty('--ob-cell-font-family', "'input-mono', monospace")
    }

    protected renderRows(rows: Array<RowAsRecord>) {
        return html`${repeat(
            rows,
            ({ id }) => id,
            ({ id, values, originalValues, isNew }, rowIndex) => {
                return !this.removedRowUUIDs.has(id)
                    ? html`<outerbase-tr .selected=${this.selectedRowUUIDs.has(id)} ?new=${isNew} @on-selection=${this._onRowSelection}>
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
                                    ?outer-border=${this.outerBorder}
                                    ?blank=${true}
                                    ?is-last-row=${rowIndex === this.rows.length - 1}
                                    ?is-last-column=${false}
                                    ?row-selector="${true}"
                                    ?read-only=${true}
                                    ?interactive=${true}
                                    width="42px"
                                >
                                    <div class="absolute top-0 bottom-0 right-0 left-0 flex items-center justify-center h-full">
                                        <check-box
                                            ?checked="${this.selectedRowUUIDs.has(id)}"
                                            @toggle-check="${() => this.toggleSelectedRow(id)}"
                                            theme=${this.theme}
                                        />
                                    </div>
                                </outerbase-td>`
                              : null}

                          <!-- render a TableCell for each column of data in the current row -->
                          ${repeat(
                              this.visibleColumns,
                              ({ name }) => name, // use the column name as the unique identifier for each entry in this row
                              ({ name }, idx) => {
                                  const installedPlugin = this.plugins?.find(
                                      ({ pluginWorkspaceId }) => pluginWorkspaceId === this.installedPlugins?.[name]?.plugin_workspace_id
                                  )
                                  const defaultPlugin = this.plugins?.find(
                                      ({ id }) => id === this.installedPlugins?.[name]?.plugin_installation_id
                                  )
                                  const plugin = installedPlugin ?? defaultPlugin

                                  return html`
                                      <!-- TODO @johnny remove separate-cells and instead rely on css variables to suppress borders -->
                                      <!-- TODO @caleb & johnny move plugins to support the new installedPlugins variable -->
                                      <outerbase-td
                                          .position=${{ row: id, column: name }}
                                          .value=${values[name]}
                                          .originalValue=${originalValues[name]}
                                          width="${this.widthForColumnType(name, this.columnWidthOffsets[name])}px"
                                          theme=${this.theme}
                                          type=${this.columnTypes?.[name]}
                                          .plugin=${plugin}
                                          plugin-attributes=${this.installedPlugins?.[name]?.supportingAttributes ?? ''}
                                          ?separate-cells=${true}
                                          ?draw-right-border=${true}
                                          ?bottom-border=${true}
                                          ?outer-border=${this.outerBorder}
                                          ?is-last-row=${rowIndex === this.rows.length - 1}
                                          ?is-last-column=${idx === this.visibleColumns.length - 1}
                                          ?menu=${!this.isNonInteractive && !this.readonly}
                                          ?selectable-text=${this.isNonInteractive}
                                          ?interactive=${!this.isNonInteractive}
                                          ?hide-dirt=${isNew}
                                          ?read-only=${this.readonly}
                                      >
                                      </outerbase-td>
                                  `
                              }
                          )}
                          ${this.blankFill
                              ? html`<outerbase-td ?outer-border=${false} ?read-only=${true} ?separate-cells=${false} ?bottom-border=${true} ?interactive=${false} ?menu=${false} ?blank=${true}></<outerbase-td>`
                              : ''}
                      </outerbase-tr>`
                    : null
            }
        )}`
    }

    private updateVisibleRows(scrollTop: number): void {
        this.visibleStartIndex = Math.max(Math.floor(scrollTop / this.rowHeight) - SCROLL_BUFFER_SIZE, 0)
        const possiblyVisibleEndIndex = this.visibleStartIndex + this.numberOfVisibleRows() + 2 * SCROLL_BUFFER_SIZE // 2x because we need to re-add it to the start index
        this.visibleEndIndex = possiblyVisibleEndIndex < this.rows.length ? possiblyVisibleEndIndex : this.rows.length
        this.visibleRows = this.rows.slice(Math.max(0, this.visibleStartIndex), this.visibleEndIndex)
    }

    private numberOfVisibleRows(): number {
        const scrollContainer = this.shadowRoot!.querySelector('.scroll-container') as HTMLElement
        return Math.ceil(scrollContainer.clientHeight / this.rowHeight)
    }

    private onScroll(event: Event): void {
        this.updateTableView(event)
    }

    private updateTableView(event?: Event): void {
        const scrollTop = (event?.target as HTMLElement)?.scrollTop ?? this.shadowRoot?.querySelector('#scroller')?.scrollTop
        if (scrollTop >= 0) {
            this.updateVisibleRows(scrollTop)
        }
    }

    private readonly rowHeight: number = 38 // Adjust based on your row height
    @state() private visibleRows: Array<RowAsRecord> = []
    @state() private visibleEndIndex = 0
    @state() private visibleStartIndex = 0

    protected override render() {
        const tableContainerClasses = {
            dark: this.theme == Theme.dark,
            'absolute bottom-0 left-0 right-0 top-0 overflow-auto overscroll-none scroll-container': true,
        }
        const tableClasses = {
            'table table-fixed bg-theme-table dark:bg-theme-table-dark': true,
            'text-theme-text dark:text-theme-text-dark text-sm': true,
            'min-w-full': true,
            relative: true,
        }

        const selectAllCheckbox =
            this.rows.length > 0
                ? html`<check-box
                      theme=${this.theme}
                      ?checked=${this.allRowsSelected}
                      @click=${(event: MouseEvent) => {
                          event.preventDefault()
                      }}
                      @toggle-check=${() => {
                          const everyRowIsChecked = this.rows.length === this.selectedRowUUIDs.size

                          if (everyRowIsChecked) {
                              this.selectedRowUUIDs = new Set()
                              this.allRowsSelected = false
                          } else {
                              this.selectedRowUUIDs = new Set(this.rows.map(({ id }) => id))
                              this.allRowsSelected = true
                          }

                          //   dispatch event that row selection changed
                          this._onRowSelection()
                      }}
                  />`
                : ''

        return html`<div id="scroller" class=${classMap(tableContainerClasses)}>
            <div
                id="table"
                class=${classMap(tableClasses)}
                @menuopen=${(event: MenuOpenEvent) => {
                    // this special case is when the same menu is opened after being closed
                    // without this the menu is immediately closed on subsequent triggers
                    if (this.closeLastMenu === event.close) return

                    // remember this menu and close it when a subsequent one is opened
                    this.closeLastMenu?.()
                    this.closeLastMenu = event.close
                }}
            >
                <outerbase-thead>
                    <outerbase-tr header>
                        <!-- first column of (optional) checkboxes -->
                        ${this.selectableRows
                            ? html`<outerbase-th
                              table-height=${ifDefined(this._height)}
                              theme=${this.theme}
                              width="42px"
                              .value=${null}
                              .originalValue=${null}
                              ?separate-cells=${true}
                              ?outer-border=${this.outerBorder}
                              ?is-last=${0 === this.visibleColumns.length}
                              ?blank=${true}
                              ?read-only=${this.readonly}
                          /><div class="absolute top-0 bottom-0 right-0 left-0 flex items-center justify-center h-full">
                          ${selectAllCheckbox}
                      </div></outerbase-th>`
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
                                    table-height=${ifDefined(this._height)}
                                    theme=${this.theme}
                                    value="${this.renamedColumnNames[name] ?? name}"
                                    original-value="${name}"
                                    width="${this.widthForColumnType(name, this.columnWidthOffsets[name])}px"
                                    ?separate-cells=${true}
                                    ?outer-border=${this.outerBorder}
                                    ?menu=${!this.isNonInteractive && !this.readonly}
                                    ?with-resizer=${!this.isNonInteractive}
                                    ?is-last=${idx === this.visibleColumns.length - 1}
                                    ?removable=${true}
                                    ?interactive=${!this.isNonInteractive}
                                    @column-hidden=${this._onColumnHidden}
                                    @column-removed=${this._onColumnRemoved}
                                    @column-plugin-deactivated=${this._onColumnPluginDeactivated}
                                    @resize-start=${this._onColumnResizeStart}
                                    @resize=${this._onColumnResized}
                                    ?read-only=${this.readonly}
                                >
                                </outerbase-th>`
                            }
                        )}
                        ${this.blankFill
                            ? html`<outerbase-th ?outer-border=${
                                  this.outerBorder
                              } ?read-only=${true} fill .value=${null} .originalValue=${null}>
                            ${
                                this.isNonInteractive || !this.addableColumns
                                    ? ''
                                    : html`<span class="flex items-center absolute top-0 left-2 bottom-0 right-0">
                                          <outerbase-add-column-trigger></outerbase-add-column-trigger>
                                      </span>`
                            }
                            </<outerbase-th>`
                            : ''}
                    </outerbase-tr>
                </outerbase-thead>

                <outerbase-rowgroup>
                    <div
                        class="bg-yellow-50"
                        style=${styleMap({ height: `${Math.max(this.visibleStartIndex * this.rowHeight, 0)}px` })}
                    ></div>

                    <!-- render a TableRow element for each row of data -->
                    ${this.renderRows(this.newRows)} ${this.renderRows(this.existingRows)}

                    <div
                        class="bg-yellow-50"
                        style=${styleMap({ height: `${Math.max((this.rows.length - this.visibleEndIndex) * this.rowHeight, 0)}px` })}
                    ></div>
                </outerbase-rowgroup>
            </div>
        </div>`
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'outerbase-table': Table
    }
}
