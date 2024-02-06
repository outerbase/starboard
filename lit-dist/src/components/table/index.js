var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { customElement, property, state } from 'lit/decorators.js';
import { css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { ColumnAddedEvent, RowAddedEvent, RowRemovedEvent, RowSelectedEvent, RowUpdatedEvent, } from '../../lib/events.js';
import { ColumnStatus, Theme, } from '../../types.js';
import { heightOfElement } from '../../lib/height-of-element.js';
import { ClassifiedElement } from '../classified-element.js';
// import subcomponents
import './tbody.js';
import './td.js';
import './th.js';
import './thead.js';
import './tr.js';
import { classMap } from 'lit/directives/class-map.js';
import { TWStyles } from '../../../tailwind/index.js';
let Table = class Table extends ClassifiedElement {
    constructor() {
        super(...arguments);
        // STATE
        this.selectableRows = false;
        this.keyboardShortcuts = false;
        this.rows = [];
        this.isNonInteractive = false;
        this.outterBorder = false;
        // TODO @johnny make this a Set
        this.hiddenColumnNames = [];
        this.deletedColumnNames = [];
        this.renamedColumns = {};
        this.theme = Theme.light;
        this.pluginAttributes = '';
        this.columns = [];
        this.visibleColumns = [];
        this.selectedRowUUIDs = new Set();
        this.removedRowUUIDs = new Set();
        /////
        // dynamically adjust the table's width when columns are being resized
        this._previousWidth = 0;
    }
    set data(rows) {
        this.rows = rows;
    }
    updateVisibleColumns() {
        this.visibleColumns = this.columns.filter(({ name, status }) => status !== ColumnStatus.deleted &&
            this.hiddenColumnNames.indexOf(name) === -1 &&
            this.deletedColumnNames.indexOf(name) === -1);
    }
    // METHODS (public)
    addNewRow(row) {
        const _row = {
            id: row?.id ?? self.crypto.randomUUID(),
            values: row?.values ?? {},
            originalValues: row?.originalValues ?? {},
            isNew: row?.isNew ?? true,
        };
        this.rows = [...this.rows, _row];
        this.dispatchEvent(new RowAddedEvent(_row));
    }
    addNewColumn(name) {
        const column = {
            is_nullable: false,
            name,
            position: this.columns.length,
            model: 'column',
            type: 'string',
            unique: false,
            primaryKey: false,
            autoIncrement: false,
            status: ColumnStatus.created,
        };
        this.columns = [...this.columns, column];
        this.rows = this.rows.map((row) => ({ ...row, values: { ...row.values, [name]: '' } }));
        this.dispatchEvent(new ColumnAddedEvent({ name })); // JOHNNY pass the other data along too?
        this.updateVisibleColumns();
    }
    toggleSelectedRow(uuid) {
        const _set = this.selectedRowUUIDs;
        if (_set.has(uuid))
            _set.delete(uuid);
        else
            _set.add(uuid);
        this.requestUpdate('selectedRowUUIDs');
    }
    clearSelection() {
        this.selectedRowUUIDs = new Set();
        this.removedRowUUIDs = new Set();
        this.shadowRoot?.querySelectorAll('.row-select-checkbox').forEach((checkbox) => {
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change'));
        });
    }
    // clear param settings
    resetParams() {
        this.clearSelection();
        this.hiddenColumnNames = [];
    }
    // METHODS (private)
    _onColumnRemoved({ name }) {
        // remove the column named `name` from columns collection
        this.deletedColumnNames.push(name);
        this.requestUpdate('columns');
        this.updateVisibleColumns();
    }
    _onColumnHidden({ name }) {
        this.hiddenColumnNames.push(name);
        this.requestUpdate('columns');
        this.updateVisibleColumns();
    }
    _onRowSelection() {
        const selectedRows = [];
        this.selectedRowUUIDs.forEach((_id) => {
            const row = this.rows.find(({ id }) => _id === id);
            if (row)
                selectedRows.push(row);
        });
        this.dispatchEvent(new RowSelectedEvent(selectedRows));
    }
    onKeyDown(event) {
        const actualTarget = event.composedPath()[0];
        const validTrigger = actualTarget instanceof HTMLElement && actualTarget.tagName !== 'INPUT' && actualTarget.tagName !== 'TEXTAREA';
        if (!validTrigger)
            return;
        const { shiftKey, key } = event;
        if (!shiftKey)
            return;
        // create column
        if (key === 'C') {
            const defaultName = `Column ${Date.now()}`;
            const name = prompt('Choose a unique name for this column', defaultName) || defaultName;
            this.addNewColumn(name);
        }
        // create row
        if (key === 'R') {
            this.addNewRow();
        }
        // delete selection
        if (key === 'D') {
            this.selectedRowUUIDs.forEach((uuid) => this.removedRowUUIDs.add(uuid));
            const removedRows = [];
            this.selectedRowUUIDs.forEach((_id) => {
                const row = this.rows.find(({ id }) => _id === id);
                if (row)
                    removedRows.push(row);
            });
            this.dispatchEvent(new RowRemovedEvent(removedRows));
            this.selectedRowUUIDs = new Set();
            this.requestUpdate('removedRowUUIDs');
        }
    }
    // LIFECYCLE HOOKS
    connectedCallback() {
        super.connectedCallback();
        this.resizeObserver = new ResizeObserver((_entries) => {
            this._height = heightOfElement(_entries[0]?.target);
        });
        this.resizeObserver.observe(this);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.resizeObserver?.disconnect();
        if (this.onKeyDown_bound) {
            document.removeEventListener('keydown', this.onKeyDown_bound);
        }
    }
    firstUpdated(_changedProperties) {
        if (this.keyboardShortcuts) {
            this.onKeyDown_bound = this.onKeyDown.bind(this);
            document.addEventListener('keydown', this.onKeyDown_bound);
        }
    }
    // this variable is incremented in `willUpdate` when our parent provies a new `rows` array
    // it's purpose is to force all of the fields to be reset, i.e. on discard changes we want to forget changes to `value`
    // this is accomplished by involving it in the `key` property of the `repeat` call in `render()`
    willUpdate(_changedProperties) {
        super.willUpdate(_changedProperties);
        // identify columns from the schema
        if (_changedProperties.has('schema')) {
            if (this.schema) {
                this.columns = this.schema.columns;
                this.updateVisibleColumns();
            }
        }
        if (_changedProperties.has('theme')) {
            this.setCssVariablesForPlugin(this.theme);
        }
    }
    // this variable is utilized while updating widths on('mousemove')
    _onColumnResizeStart(_event) {
        const table = this.shadowRoot?.getElementById('table');
        if (!table)
            throw new Error('Unexpectedly missing a table');
        this._previousWidth = table.clientWidth;
    }
    _onColumnPluginDeactivated({ column }) {
        if (this.installedPlugins) {
            delete this.installedPlugins[column];
            this.requestUpdate('installedPlugins');
        }
    }
    _onColumnResized({ delta }) {
        const table = this.shadowRoot?.getElementById('table');
        if (!table)
            throw new Error('Unexpectedly missing a table');
        table.style.width = `${this._previousWidth + delta}px`;
    }
    setCssVariablesForPlugin(theme) {
        if (typeof document === 'undefined')
            return;
        if (theme === Theme.dark) {
            document.documentElement.style.setProperty('--ob-background-color', '#0A0A0A');
            document.documentElement.style.setProperty('--ob-text-color', '#D4D4D4');
            document.documentElement.style.setProperty('--ob-border-color', '#262626');
            document.documentElement.style.setProperty('--ob-null-text-color', '#959497');
        }
        else {
            document.documentElement.style.setProperty('--ob-background-color', '#FAFAFA');
            document.documentElement.style.setProperty('--ob-text-color', '#525252');
            document.documentElement.style.setProperty('--ob-border-color', '#E5E5E5');
            document.documentElement.style.setProperty('--ob-null-text-color', '#D0D0D0');
        }
        document.documentElement.style.setProperty('--ob-font-family', '"Inter", sans-serif');
        document.documentElement.style.setProperty('--ob-cell-font-family', "'input-mono', monospace");
    }
    // TODO @johnny this does not get update if the page containing the table changes
    // This is problematic when deciding which direction to render a column menu
    // An example is toggling the navigaiton menu (where there's a list of tables, queries, etc)
    // Only once you switch tabs does the reference to `distanceToLeftViewport` get recomputed.
    get distanceToLeftViewport() {
        if (typeof window === 'undefined')
            return -1;
        return this.getBoundingClientRect().left;
    }
    renderRows(rows) {
        const tableBoundingRect = typeof window !== 'undefined' ? JSON.stringify(this.getBoundingClientRect()) : null;
        return html `${repeat(rows, ({ id }) => id, ({ id, values, originalValues, isNew }, rowIndex) => {
            return !this.removedRowUUIDs.has(id)
                ? html `<outerbase-tr .selected=${this.selectedRowUUIDs.has(id)} ?new=${isNew} @on-selection=${this._onRowSelection}>
                          <!-- checkmark cell -->
                          ${this.selectableRows
                    ? html `<outerbase-td
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
                                            class="row-select-checkbox h-4 w-4 focus:z-10 rounded-[4px] border border-neutral-500 grid place-content-center cursor-pointer before:rounded-sm before:shadow-checkbox"
                                            type="checkbox"
                                            ?checked="${this.selectedRowUUIDs.has(id)}"
                                            @click="${() => this.toggleSelectedRow(id)}"
                                            tabindex="0"
                                        />
                                    </div>
                                </outerbase-td>`
                    : null}

                          <!-- render a TableCell for each column of data in the current row -->
                          ${repeat(this.visibleColumns, ({ name }) => name, // use the column name as the unique identifier for each entry in this row
                ({ name }, idx) => {
                    const installedPlugin = this.plugins?.find(({ pluginWorkspaceId }) => pluginWorkspaceId === this.installedPlugins?.[name]?.plugin_workspace_id);
                    const defaultPlugin = this.plugins?.find(({ id }) => id === this.installedPlugins?.[name]?.plugin_installation_id);
                    const plugin = installedPlugin ?? defaultPlugin;
                    return html `
                                      <!-- TODO @johnny remove separate-cells and instead rely on css variables to suppress borders -->
                                      <!-- TODO @caleb & johnny move plugins to support the new installedPlugins variable -->
                                      <outerbase-td
                                          .position=${{ row: id, column: name }}
                                          value=${values[name] ?? ''}
                                          original-value=${originalValues[name]}
                                          left-distance-to-viewport=${this.distanceToLeftViewport}
                                          table-bounding-rect="${tableBoundingRect}"
                                          theme=${this.theme}
                                          .plugin=${plugin}
                                          plugin-attributes=${this.installedPlugins?.[name]?.supportingAttributes ?? ''}
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
                        this.dispatchEvent(new RowUpdatedEvent({ id, values, originalValues, isNew }));
                    }}
                                      >
                                      </outerbase-td>
                                  `;
                })}
                      </outerbase-tr>`
                : null;
        })}`;
    }
    render() {
        const tableContainerClasses = { dark: this.theme == Theme.dark };
        const tableClasses = {
            'table bg-theme-table dark:bg-theme-table-dark': true,
            'text-theme-text dark:text-theme-text-dark text-sm font-mono': true,
        };
        return html `<span class=${classMap(tableContainerClasses)}
            ><div id="table" class=${classMap(tableClasses)}>
                <outerbase-thead>
                    <outerbase-tr header>
                        <!-- first column of (optional) checkboxes -->
                        ${this.selectableRows
            ? html `<outerbase-th
                              table-height=${ifDefined(this._height)}
                              theme=${this.theme}
                              ?separate-cells=${true}
                              ?outter-border=${this.outterBorder}
                              ?is-last=${0 === this.visibleColumns.length}
                              ?blank=${true}
                          /></outerbase-th>`
            : null}
                        ${repeat(this.visibleColumns, ({ name }, _idx) => name, ({ name }, idx) => {
            // omit column resizer on the last column because it's sort-of awkward
            return html `<outerbase-th
                                    .options=${this.columnOptions || nothing}
                                    .plugins="${this.plugins}"
                                    installed-plugins=${JSON.stringify(this.installedPlugins)}
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
                                </outerbase-th>`;
        })}
                    </outerbase-tr>
                </outerbase-thead>

                <outerbase-rowgroup>
                    <!-- render a TableRow element for each row of data -->
                    ${this.renderRows(this.rows.filter(({ isNew }) => isNew))} ${this.renderRows(this.rows.filter(({ isNew }) => !isNew))}
                </outerbase-rowgroup>
            </div>
        </span>`;
    }
};
Table.styles = [
    TWStyles,
    // custom checkbox/checkmark styles
    css `
            input[type='checkbox'] {
                appearance: none;
            }

            input[type='checkbox']::before {
                content: '';
                width: 0.65em;
                height: 0.65em;
                transform: scale(0);
                // transition: 120ms transform ease-in-out;
            }

            input[type='checkbox']:checked::before {
                transform: scale(1);
            }
        `,
];
__decorate([
    property({ type: Boolean, attribute: 'selectable-rows' })
], Table.prototype, "selectableRows", void 0);
__decorate([
    property({ attribute: 'keyboard-shortcuts', type: Boolean })
], Table.prototype, "keyboardShortcuts", void 0);
__decorate([
    property({ attribute: 'schema', type: Object })
], Table.prototype, "schema", void 0);
__decorate([
    property({ attribute: 'data', type: Array })
], Table.prototype, "data", null);
__decorate([
    property({ attribute: 'plugins', type: Array })
], Table.prototype, "plugins", void 0);
__decorate([
    property({ attribute: 'installed-plugins', type: Array })
], Table.prototype, "installedPlugins", void 0);
__decorate([
    state()
], Table.prototype, "rows", void 0);
__decorate([
    property({ attribute: 'non-interactive', type: Boolean })
], Table.prototype, "isNonInteractive", void 0);
__decorate([
    property({ attribute: 'auth-token', type: String })
], Table.prototype, "authToken", void 0);
__decorate([
    property({ attribute: 'column-options', type: Array })
], Table.prototype, "columnOptions", void 0);
__decorate([
    property({ attribute: 'outter-border', type: Boolean })
], Table.prototype, "outterBorder", void 0);
__decorate([
    property({ attribute: 'hidden-columns', type: Array })
], Table.prototype, "hiddenColumnNames", void 0);
__decorate([
    property({ attribute: 'deleted-columns', type: Array })
], Table.prototype, "deletedColumnNames", void 0);
__decorate([
    property({ attribute: 'renamed-columns', type: Object })
], Table.prototype, "renamedColumns", void 0);
__decorate([
    property({ attribute: 'theme', type: String })
], Table.prototype, "theme", void 0);
__decorate([
    property({ attribute: 'plugin-attributes', type: String })
], Table.prototype, "pluginAttributes", void 0);
__decorate([
    state()
], Table.prototype, "_height", void 0);
__decorate([
    state()
], Table.prototype, "resizeObserver", void 0);
__decorate([
    state()
], Table.prototype, "columns", void 0);
__decorate([
    state()
], Table.prototype, "visibleColumns", void 0);
__decorate([
    state()
], Table.prototype, "selectedRowUUIDs", void 0);
__decorate([
    state()
], Table.prototype, "removedRowUUIDs", void 0);
Table = __decorate([
    customElement('outerbase-table')
], Table);
export { Table };
