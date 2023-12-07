type ColumnType = string | number | boolean | null
type Blob = {
    [key: string]: ColumnType | Blob
}
export type Position = Record<'column' | 'row', number>
export type CellDetail = {
    position: Position
    previousValue: ColumnType
    value: ColumnType
}

class BubblyEvent extends Event {
    constructor(name: string) {
        super(name, { bubbles: true, composed: true })
    }
}

export class CellUpdateEvent extends BubblyEvent {
    public detail: CellDetail

    constructor(detail: CellDetail) {
        super('cell-updated')
        this.detail = detail
    }
}

export class ColumnAddedEvent extends BubblyEvent {
    public blob: Blob

    constructor(blob: Blob) {
        super('column-added')
        this.blob = blob
    }
}

export class ColumnRemovedEvent extends BubblyEvent {
    public name: string
    public blob: Blob

    constructor({ name, blob }: { name: string; blob: Blob }) {
        super('column-removed')
        this.name = name
        this.blob = blob
    }
}

export class ColumnUpdatedEvent extends BubblyEvent {
    public name: string
    public blob: Blob

    constructor({ name, blob }: { name: string; blob: Blob }) {
        super('column-updated')
        this.name = name
        this.blob = blob
    }
}

export class RowAddedEvent extends BubblyEvent {
    public blob: Blob

    constructor(blob: Blob) {
        super('row-added')
        this.blob = blob
    }
}

export class RowRemovedEvent extends BubblyEvent {
    public blob: Blob

    constructor(blob: Blob) {
        super('row-removed')
        this.blob = blob
    }
}

export class RowUpdatedEvent extends BubblyEvent {
    public name: string
    public blob: Blob

    constructor({ name, blob }: { name: string; blob: Blob }) {
        super('row-updated')
        this.name = name
        this.blob = blob
    }
}
