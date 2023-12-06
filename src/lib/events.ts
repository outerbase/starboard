type ColumnType = string | number | boolean | null
export type Position = Record<'column' | 'row', number>
export type Detail = {
    position: Position
    previousValue: ColumnType
    value: ColumnType
}

export class CellUpdateEvent extends Event {
    public detail: Detail

    constructor(detail: Detail) {
        super('cell-updated', { bubbles: true, composed: true })
        this.detail = detail
    }
}
