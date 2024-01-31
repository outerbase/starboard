import { type TemplateResult } from 'lit'

export {
    CellUpdateEvent,
    ColumnAddedEvent,
    ColumnEvent,
    ColumnRemovedEvent,
    ColumnRenameEvent,
    ColumnSelectedEvent,
    ColumnUpdatedEvent,
    MenuSelectedEvent,
    RowAddedEvent,
    RowRemovedEvent,
    RowSelectedEvent,
    RowUpdatedEvent,
    RowsEvent,
} from './lib/events.js'

// copied from dashboard
export type TableColumnType = 'string' | 'integer' | 'enum' | 'uuid' | 'date' | 'dateonly'
export enum ColumnStatus {
    created,
    updated,
    deleted,
}
export type TableColumn = {
    model?: 'column'
    type: TableColumnType
    name: string
    position: number
    default?: string // has `::type` appended / casting quirks
    defaultValue?: string
    comment?: string
    // plugins: Array<PluginInstallationModel>
    is_nullable: boolean
    unique: boolean
    primaryKey: boolean
    autoIncrement: boolean

    status: ColumnStatus | undefined
}

export type Schema = {
    columns: Columns
}
export type Columns = Array<TableColumn>
export type ColumnType = string | number | boolean | null | undefined
export type RowAsRecord = {
    id: string
    values: Record<string, ColumnType>
    originalValues: Record<string, ColumnType>
    isNew: boolean
}
export type Data = { [key: string]: ColumnType | Data }
// API Response:
export type Queryd = {
    name: string
    query: string
    count: number
    rows: Array<RowAsRecord>
}

// <td />:
export type Position = { column: string; row: string } // column name, row uuid
export type CellDetail = {
    position: Position
    label?: string
    previousValue: ColumnType
    value: ColumnType
}

// <th />
export type HeaderMenuOptions = Array<{
    label: string | TemplateResult<1>
    value: string
    classes?: string
    icon?: string | null
    options?: HeaderMenuOptions // sub menu
}>

export enum Theme {
    'light',
    'dark',
}

export type ColumnPlugin = {
    columnName: string
    config: string
    displayName: string
    metadata: string
    id: string
    pluginWorkspaceId: string
    tagName: string
    isDefault: boolean
}

export type PluginWorkspaceInstallationId = {
    plugin_workspace_id: string
    plugin_installation_id: string
}

export enum PluginEvent {
    onEdit = 'onedit',
    onStopEdit = 'onstopedit',
    onCancelEdit = 'oncanceledit',
    onSave = 'onsave',
    updateCell = 'updatecell',
    updateRow = 'updaterow',
    createRow = 'createrow',
    deleteRow = 'deleterow',
    getNextPage = 'getnextpage',
    getPreviousPage = 'getpreviouspage',

    configurePlugin = 'configure_plugin',
    installPlugin = 'install_plugin',
    ephemeralPluginInstall = 'ephemeral_install_plugin',
    uninstallPlugin = 'uninstall_plugin',
    sortColumn = 'sort_column',
    hideColumn = 'hide_column',
    deleteColumn = 'delete_column',
    createColumn = 'create_column',
    updateColumn = 'update_column',

    createIndex = 'create_index',
    updateIndex = 'update_index',
    deleteIndex = 'delete_index',
    pageNext = 'page_next',

    // DEPRECATED: Use `updateCell` instead
    cellValue = 'cellvalue',
}
