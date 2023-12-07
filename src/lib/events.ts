import type { CellDetail, Data } from '../types'
type ColumnAttributes = { name: string; data: Data }
type RowAttributes = { index: number; data: Data }
class BubblyEvent extends Event {
    constructor(name: string) {
        super(name, { bubbles: true, composed: true })
    }
}

// CELLS
export class CellUpdateEvent extends BubblyEvent {
    public detail: CellDetail

    constructor(detail: CellDetail) {
        super('cell-updated')
        this.detail = detail
    }
}

// COLUMNS
export class ColumnEvent extends BubblyEvent {
    public data: Data
    public name: string

    constructor(type: string, { data, name }: ColumnAttributes) {
        super(type)
        this.name = name
        this.data = data
    }
}

export class ColumnAddedEvent extends ColumnEvent {
    constructor(attr: ColumnAttributes) {
        super('column-added', attr)
    }
}

export class ColumnRemovedEvent extends ColumnEvent {
    constructor(attr: ColumnAttributes) {
        super('column-removed', attr)
    }
}

export class ColumnUpdatedEvent extends ColumnEvent {
    constructor(attr: ColumnAttributes) {
        super('column-updated', attr)
    }
}

// ROWS
export class RowEvent extends BubblyEvent {
    public data: Data
    public index: number

    constructor(type: string, { data, index }: RowAttributes) {
        super(type)
        this.index = index
        this.data = data
    }
}

export class RowAddedEvent extends RowEvent {
    constructor(attr: RowAttributes) {
        super('row-added', attr)
    }
}

export class RowRemovedEvent extends RowEvent {
    constructor(attr: RowAttributes) {
        super('row-removed', attr)
    }
}

export class RowUpdatedEvent extends RowEvent {
    constructor(attr: RowAttributes) {
        super('row-updated', attr)
    }
}
