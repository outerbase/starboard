import { type TemplateResult } from 'lit';
export { CellUpdateEvent, ColumnAddedEvent, ColumnEvent, ColumnRemovedEvent, ColumnRenameEvent, ColumnSelectedEvent, ColumnUpdatedEvent, MenuSelectedEvent, RowAddedEvent, RowRemovedEvent, RowSelectedEvent, RowUpdatedEvent, RowsEvent, } from './lib/events.js';
export type TableColumnType = 'string' | 'integer' | 'enum' | 'uuid' | 'date' | 'dateonly';
export declare enum ColumnStatus {
    created = 0,
    updated = 1,
    deleted = 2
}
export declare enum DBType {
    REAL = "REAL",
    INTEGER = "INTEGER",
    INT = "INT",
    TEXT = "TEXT",
    JSON = "JSON",
    SMALLINT = "SMALLINT",
    BIGINT = "BIGINT",
    DECIMAL = "DECIMAL",
    NUMERIC = "NUMERIC",
    DOUBLE_PRECISION = "DOUBLE PRECISION",
    SERIAL = "SERIAL",
    BIGSERIAL = "BIGSERIAL",
    MONEY = "MONEY",
    CHAR = "CHAR",
    VARCHAR = "VARCHAR",
    BYTEA = "BYTEA",
    TIMESTAMP = "TIMESTAMP",
    TIMESTAMP_WITH_TIME_ZONE = "TIMESTAMP WITH TIME ZONE",
    DATE = "DATE",
    DATETIME = "DATETIME",
    TIME = "TIME",
    TIME_WITH_TIME_ZONE = "TIME WITH TIME ZONE",
    INTERVAL = "INTERVAL",
    BOOLEAN = "BOOLEAN",
    ENUM = "ENUM",
    POINT = "POINT",
    LINE = "LINE",
    LSEG = "LSEG",
    BOX = "BOX",
    PATH = "PATH",
    POLYGON = "POLYGON",
    CIRCLE = "CIRCLE",
    CIDR = "CIDR",
    INET = "INET",
    MACADDR = "MACADDR",
    MACADDR8 = "MACADDR8",
    JSONB = "JSONB",
    UUID = "UUID",
    XML = "XML",
    TSVECTOR = "TSVECTOR",
    TSQUERY = "TSQUERY",
    VARYING = "CHARACTER VARYING"
}
export type TableColumn = {
    model?: 'column';
    type?: string;
    name: string;
    position: number;
    default?: string;
    defaultValue?: string;
    comment?: string;
    is_nullable: boolean;
    unique: boolean;
    primaryKey: boolean;
    autoIncrement: boolean;
    status: ColumnStatus | undefined;
};
export type Schema = {
    columns: Columns;
};
export type Columns = Array<TableColumn>;
export type ColumnType = string | number | boolean | null | undefined;
export type RowAsRecord = {
    id: string;
    values: Record<string, ColumnType>;
    originalValues: Record<string, ColumnType>;
    isNew: boolean;
};
export type Data = {
    [key: string]: ColumnType | Data;
};
export type Queryd = {
    name: string;
    query: string;
    count: number;
    rows: Array<RowAsRecord>;
};
export type Position = {
    column: string;
    row: string;
};
export type CellDetail = {
    position: Position;
    label?: string;
    previousValue: ColumnType;
    value: ColumnType;
};
export type HeaderMenuOptions = Array<{
    label: string | TemplateResult<1>;
    value: string;
    classes?: string;
    icon?: string | null;
    options?: HeaderMenuOptions;
}>;
export declare enum Theme {
    'light' = 0,
    'dark' = 1
}
export type ColumnPlugin = {
    columnName: string;
    config: string;
    displayName: string;
    metadata: string;
    id: string;
    pluginWorkspaceId: string;
    tagName: string;
    isDefault: boolean;
};
export type PluginWorkspaceInstallationId = {
    plugin_workspace_id: string;
    plugin_installation_id: string;
    isDefaultPlugin?: boolean;
    supportingAttributes: string;
};
export declare enum PluginEvent {
    onEdit = "onedit",
    onStopEdit = "onstopedit",
    onCancelEdit = "oncanceledit",
    onSave = "onsave",
    updateCell = "updatecell",
    updateRow = "updaterow",
    createRow = "createrow",
    deleteRow = "deleterow",
    getNextPage = "getnextpage",
    getPreviousPage = "getpreviouspage",
    configurePlugin = "configure_plugin",
    installPlugin = "install_plugin",
    ephemeralPluginInstall = "ephemeral_install_plugin",
    uninstallPlugin = "uninstall_plugin",
    sortColumn = "sort_column",
    hideColumn = "hide_column",
    deleteColumn = "delete_column",
    createColumn = "create_column",
    updateColumn = "update_column",
    createIndex = "create_index",
    updateIndex = "update_index",
    deleteIndex = "delete_index",
    pageNext = "page_next",
    cellValue = "cellvalue"
}
//# sourceMappingURL=types.d.ts.map