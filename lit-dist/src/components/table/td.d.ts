import { type PropertyValues, type TemplateResult } from 'lit';
import { MutableElement } from '../mutable-element.js';
import { type MenuSelectedEvent } from '../../lib/events.js';
import '../menu/cell-menu.js';
import { type ColumnPlugin, PluginEvent } from '../../types.js';
type PluginActionEvent = CustomEvent<{
    action: PluginEvent.onEdit | PluginEvent.onStopEdit | PluginEvent.onCancelEdit;
    value: any;
}>;
export declare class TableData extends MutableElement {
    protected get classMap(): {
        'table-cell relative focus:z-[1] group-hover:bg-theme-row-hover dark:group-hover:bg-theme-row-hover-dark': boolean;
        'px-cell-padding-x py-cell-padding-y ': boolean;
        'px-5': boolean;
        'border-theme-border dark:border-theme-border-dark': boolean;
        'bg-theme-cell dark:bg-theme-cell-dark text-theme-cell-text dark:text-theme-cell-text-dark': boolean;
        'focus:shadow-ringlet dark:focus:shadow-ringlet-dark focus:rounded-[4px] focus:ring-1 focus:ring-black dark:focus:ring-neutral-300 focus:outline-none': boolean;
        'bg-theme-cell-dirty dark:bg-theme-cell-dirty-dark': boolean;
        'border-r': boolean;
        'first:border-l': boolean;
        'border-b': boolean;
        'cursor-pointer': boolean;
        dark: boolean;
    };
    pluginAttributes: String;
    withBottomBorder: boolean;
    isOdd?: boolean;
    _drawRightBorder: boolean;
    hasMenu: boolean;
    isRowSelector: boolean;
    isLastColumn: boolean;
    isLastRow: boolean;
    leftDistanceToViewport: number;
    tableBoundingRect: string | undefined;
    hideDirt: boolean;
    plugin?: ColumnPlugin;
    protected options: {
        label: string;
        value: string;
    }[];
    protected isDisplayingPluginEditor: boolean;
    protected willUpdate(changedProperties: PropertyValues<this>): void;
    protected onContextMenu(event: MouseEvent): void;
    protected onPluginEvent({ detail: { action, value } }: PluginActionEvent): void;
    protected onKeyDown(event: KeyboardEvent): Promise<void>;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected render(): TemplateResult<1>;
    protected onMenuSelection(event: MenuSelectedEvent): Promise<string | number | bigint | boolean | void | Date | import("../../types.js").SerializableArray | import("../../types.js").SerializableRecord | null>;
}
export {};
//# sourceMappingURL=td.d.ts.map