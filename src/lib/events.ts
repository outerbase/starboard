import type { CellDetail, Data, Row } from '../types.js'

type ColumnAttributes = { name: string; data?: Data }
type RowAttributes = { index: number; row: Row }
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
    public data?: Data
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

export class ColumnRenameEvent extends ColumnEvent {
    constructor(attr: ColumnAttributes) {
        super('column-renamed', attr)
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
export class RowsEvent extends BubblyEvent {
    public rows: RowAttributes | Array<RowAttributes>

    constructor(type: string, rows: RowAttributes | Array<RowAttributes>) {
        super(type)
        this.rows = rows
    }
}

export class RowAddedEvent extends RowsEvent {
    constructor(attr: RowAttributes) {
        super('row-added', attr)
    }
}

export class RowUpdatedEvent extends RowsEvent {
    constructor(attrs: RowAttributes) {
        super('row-updated', attrs)
    }
}

export class RowRemovedEvent extends RowsEvent {
    constructor(attrs: Array<RowAttributes>) {
        super('row-removed', attrs)
    }
}

export class RowSelectionEvent extends RowsEvent {
    constructor(attrs: Array<RowAttributes>) {
        super('row-selected', attrs)
    }
}

//  MENUS

export class MenuSelectionEvent extends BubblyEvent {
    value: string

    constructor(value: string) {
        super('menu-selection')
        this.value = value
    }
}
