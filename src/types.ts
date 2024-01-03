import { type TemplateResult } from 'lit'

export {
    CellUpdateEvent,
    ColumnAddedEvent,
    ColumnEvent,
    ColumnRemovedEvent,
    ColumnRenameEvent,
    ColumnSelectedEvent,
    ColumnUpdatedEvent,
    MenuSelectionEvent,
    RowAddedEvent,
    RowRemovedEvent,
    RowSelectionEvent,
    RowUpdatedEvent,
    RowsEvent,
} from './lib/events'

export type Schema = { types: Record<string, 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null'> }
export type Columns = Array<string>
export type ColumnType = string | number | boolean | null
export type Row = { id: string; values: Array<ColumnType> }
export type Rows = Array<Row>
export type Data = { [key: string]: ColumnType | Data }
export type DecoratedRow = { id: string; row: Record<string, ColumnType> }
// API Response:
export type Queryd = {
    name: string
    query: string
    count: number
    rows: Array<DecoratedRow>
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
