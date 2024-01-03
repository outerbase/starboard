import type { CellDetail, ColumnType, Data, RowAsRecord } from '../types.js'

type ColumnAttributes = { name: string; data?: Data }
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

// TODO not implemented
export class ColumnSelectedEvent extends ColumnEvent {
    constructor(attr: ColumnAttributes) {
        super('column-selected', attr)
    }
}

// ROWS
export class RowsEvent extends BubblyEvent {
    public rows: RowAsRecord | Array<RowAsRecord>

    constructor(type: string, rows: RowAsRecord | Array<RowAsRecord>) {
        super(type)
        this.rows = rows
    }
}

export class RowAddedEvent extends RowsEvent {
    constructor(attr: RowAsRecord) {
        super('row-added', attr)
    }
}

export class RowUpdatedEvent extends RowsEvent {
    constructor(attrs: RowAsRecord) {
        super('row-updated', attrs)
    }
}

export class RowRemovedEvent extends RowsEvent {
    constructor(attrs: Array<RowAsRecord>) {
        super('row-removed', attrs)
    }
}

export class RowSelectedEvent extends RowsEvent {
    constructor(attrs: Array<RowAsRecord>) {
        super('row-selected', attrs)
    }
}

//  MENUS

export class MenuSelectedEvent extends BubblyEvent {
    value: string

    constructor(value: string) {
        super('menu-selection')
        this.value = value
    }
}

export class ResizeStartEvent extends BubblyEvent {
    constructor() {
        super('resize-start')
    }
}

export class ResizeEndEvent extends BubblyEvent {
    constructor() {
        super('resize-end')
    }
}
