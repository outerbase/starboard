import { type TemplateResult } from 'lit'

export type Schema = { types: Record<string, 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null'> }
export type Columns = Array<string>
export type ColumnType = string | number | boolean | null
export type Row = Array<ColumnType>
export type Rows = Array<Row>
export type Data = { [key: string]: ColumnType | Data }

// API Response:
export type Queryd = {
    name: string
    query: string
    count: number
    rows: Rows
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
