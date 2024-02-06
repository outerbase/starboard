export { CellUpdateEvent, ColumnAddedEvent, ColumnEvent, ColumnRemovedEvent, ColumnRenameEvent, ColumnSelectedEvent, ColumnUpdatedEvent, MenuSelectedEvent, RowAddedEvent, RowRemovedEvent, RowSelectedEvent, RowUpdatedEvent, RowsEvent, } from './lib/events.js';
export var ColumnStatus;
(function (ColumnStatus) {
    ColumnStatus[ColumnStatus["created"] = 0] = "created";
    ColumnStatus[ColumnStatus["updated"] = 1] = "updated";
    ColumnStatus[ColumnStatus["deleted"] = 2] = "deleted";
})(ColumnStatus || (ColumnStatus = {}));
export var Theme;
(function (Theme) {
    Theme[Theme["light"] = 0] = "light";
    Theme[Theme["dark"] = 1] = "dark";
})(Theme || (Theme = {}));
export var PluginEvent;
(function (PluginEvent) {
    PluginEvent["onEdit"] = "onedit";
    PluginEvent["onStopEdit"] = "onstopedit";
    PluginEvent["onCancelEdit"] = "oncanceledit";
    PluginEvent["onSave"] = "onsave";
    PluginEvent["updateCell"] = "updatecell";
    PluginEvent["updateRow"] = "updaterow";
    PluginEvent["createRow"] = "createrow";
    PluginEvent["deleteRow"] = "deleterow";
    PluginEvent["getNextPage"] = "getnextpage";
    PluginEvent["getPreviousPage"] = "getpreviouspage";
    PluginEvent["configurePlugin"] = "configure_plugin";
    PluginEvent["installPlugin"] = "install_plugin";
    PluginEvent["ephemeralPluginInstall"] = "ephemeral_install_plugin";
    PluginEvent["uninstallPlugin"] = "uninstall_plugin";
    PluginEvent["sortColumn"] = "sort_column";
    PluginEvent["hideColumn"] = "hide_column";
    PluginEvent["deleteColumn"] = "delete_column";
    PluginEvent["createColumn"] = "create_column";
    PluginEvent["updateColumn"] = "update_column";
    PluginEvent["createIndex"] = "create_index";
    PluginEvent["updateIndex"] = "update_index";
    PluginEvent["deleteIndex"] = "delete_index";
    PluginEvent["pageNext"] = "page_next";
    // DEPRECATED: Use `updateCell` instead
    PluginEvent["cellValue"] = "cellvalue";
})(PluginEvent || (PluginEvent = {}));
