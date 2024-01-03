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
} from './lib/events'

// copied from dashboard
export type TableColumnType = 'string' | 'integer' | 'enum' | 'uuid' | 'date' | 'dateonly'
export type TableColumn = {
    model?: 'column'
    // typeOfChange: TableColumnChangeType
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
}

export type Schema = {
    columns: Columns
}
export type Columns = Array<TableColumn>
export type ColumnType = string | number | boolean | null
export type RowAsArray = { id: string; values: Array<ColumnType> }
export type Rows = Array<RowAsArray>
export type RowAsRecord = { id: string; row: Record<string, ColumnType> }
export type Data = { [key: string]: ColumnType | Data }
// API Response:
export type Queryd = {
    name: string
    query: string
    count: number
    rows: Array<RowAsRecord>
}

// <td />:
export type Position = Record<'column' | 'row', number>
export type CellDetail = {
    label?: string
    position?: Position
    previousValue?: ColumnType
    value?: ColumnType
}

// <th />
export type HeaderMenuOptions = Array<{
    label: string | TemplateResult<1>
    value: string
    classes?: string
    icon?: string | null
}>
