import { type PropertyValueMap } from 'lit';
import { ColumnHiddenEvent, ColumnRemovedEvent } from '../../lib/events.js';
import { type Columns, type Schema, type HeaderMenuOptions, type RowAsRecord, type ColumnPlugin, Theme, type PluginWorkspaceInstallationId } from '../../types.js';
import { ClassifiedElement } from '../classified-element.js';
import './tbody.js';
import './td.js';
import './th.js';
import './thead.js';
import './tr.js';
import '../check-box.js';
export declare class Table extends ClassifiedElement {
    selectableRows: boolean;
    keyboardShortcuts: boolean;
    schema?: Schema;
    set data(rows: Array<RowAsRecord>);
    plugins?: Array<ColumnPlugin>;
    installedPlugins?: Record<string, PluginWorkspaceInstallationId | undefined>;
    protected rows: Array<RowAsRecord>;
    isNonInteractive: boolean;
    authToken?: string;
    columnOptions?: Array<HeaderMenuOptions>;
    outerBorder: boolean;
    hiddenColumnNames: Array<string>;
    deletedColumnNames: Array<string>;
    renamedColumns: Record<string, string>;
    theme: Theme;
    pluginAttributes: String;
    readonly: boolean;
    blankFill: boolean;
    columnWidthOffsets: Record<string, number | undefined>;
    private _height?;
    private resizeObserver?;
    protected columns: Columns;
    protected visibleColumns: Columns;
    protected updateVisibleColumns(): void;
    protected selectedRowUUIDs: Set<string>;
    protected removedRowUUIDs: Set<string>;
    protected closeLastMenu?: () => void;
    addNewRow(row?: Partial<RowAsRecord>): RowAsRecord;
    protected addNewColumn(name: string): void;
    toggleSelectedRow(uuid: string): void;
    clearSelection(): void;
    deleteSelectedRows(): void;
    resetParams(): void;
    protected _onColumnRemoved({ name }: ColumnRemovedEvent): void;
    protected _onColumnHidden({ name }: ColumnHiddenEvent): void;
    protected _onRowSelection(): void;
    protected widthForColumnType(name: string, offset?: number): number;
    protected onKeyDown_bound?: ({ shiftKey, key }: KeyboardEvent) => void;
    protected onKeyDown(event: KeyboardEvent): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected firstUpdated(_changedProperties: PropertyValueMap<this>): void;
    protected willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void;
    private _previousWidth;
    private _onColumnResizeStart;
    private _onColumnResized;
    private _onColumnPluginDeactivated;
    private setCssVariablesForPlugin;
    get distanceToLeftViewport(): number;
    protected renderRows(rows: Array<RowAsRecord>): import("lit").TemplateResult<1>;
    protected render(): import("lit").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'outerbase-table': Table;
    }
}
//# sourceMappingURL=index.d.ts.map