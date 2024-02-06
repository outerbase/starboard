import type { CellDetail, Data, RowAsRecord, ColumnPlugin, PluginWorkspaceInstallationId } from '../types.js';
type ColumnAttributes = {
    name: string;
    data?: Data;
};
declare class BubblyEvent extends Event {
    constructor(name: string);
}
export declare class CellUpdateEvent extends BubblyEvent {
    detail: CellDetail;
    constructor(detail: CellDetail);
}
export declare class ColumnEvent extends BubblyEvent {
    data?: Data;
    name: string;
    constructor(type: string, { data, name }: ColumnAttributes);
}
export declare class ColumnPluginEvent extends BubblyEvent {
    plugin: ColumnPlugin;
    constructor(type: string, plugin: ColumnPlugin);
}
export declare class ColumnAddedEvent extends ColumnEvent {
    constructor(attr: ColumnAttributes);
}
export declare class ColumnRenameEvent extends ColumnEvent {
    constructor(attr: ColumnAttributes);
}
export declare class ColumnRemovedEvent extends ColumnEvent {
    constructor(attr: ColumnAttributes);
}
export declare class ColumnHiddenEvent extends ColumnEvent {
    constructor(attr: ColumnAttributes);
}
export declare class ColumnPluginActivatedEvent extends ColumnPluginEvent {
    column: string;
    constructor(column: string, plugin: ColumnPlugin);
}
export declare class ColumnPluginDeactivatedEvent extends BubblyEvent {
    installation: PluginWorkspaceInstallationId;
    column: string;
    constructor(column: string, installation: PluginWorkspaceInstallationId);
}
export declare class ColumnUpdatedEvent extends ColumnEvent {
    constructor(attr: ColumnAttributes);
}
export declare class ColumnSelectedEvent extends ColumnEvent {
    constructor(attr: ColumnAttributes);
}
export declare class RowsEvent extends BubblyEvent {
    rows: Array<RowAsRecord>;
    constructor(type: string, rows: Array<RowAsRecord>);
}
export declare class RowAddedEvent extends RowsEvent {
    constructor(row: RowAsRecord);
}
export declare class RowUpdatedEvent extends RowsEvent {
    constructor(row: RowAsRecord);
}
export declare class RowRemovedEvent extends RowsEvent {
    constructor(rows: Array<RowAsRecord>);
}
export declare class RowSelectedEvent extends RowsEvent {
    constructor(rows: Array<RowAsRecord>);
}
export declare class MenuSelectedEvent extends BubblyEvent {
    value: string;
    constructor(value: string);
}
export declare class ResizeStartEvent extends BubblyEvent {
    constructor();
}
export declare class ResizeEndEvent extends BubblyEvent {
    delta: number;
    constructor(delta: number);
}
export declare class ResizeEvent extends BubblyEvent {
    delta: number;
    constructor(delta: number);
}
export {};
//# sourceMappingURL=events.d.ts.map