import { type TemplateResult } from 'lit';
import { MutableElement } from '../mutable-element.js';
import { type MenuSelectedEvent } from '../../lib/events.js';
import '../menu/cell-menu.js';
import { Theme, type ColumnPlugin, PluginEvent } from '../../types.js';
type PluginActionEvent = CustomEvent<{
    action: PluginEvent.onEdit | PluginEvent.onStopEdit | PluginEvent.onCancelEdit;
    value: any;
}>;
export declare class TableData extends MutableElement {
    protected get classMap(): {
        [x: string]: boolean;
        'table-cell relative': boolean;
        'px-cell-padding-x py-cell-padding-y ': boolean;
        'px-5': boolean;
        'border-theme-border dark:border-theme-border-dark': boolean;
        'bg-theme-cell dark:bg-theme-cell-dark text-theme-cell-text dark:text-theme-cell-text-dark': boolean;
        'focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none': boolean;
        'bg-theme-cell-dirty dark:bg-theme-cell-dirty-dark': boolean;
        'max-w-64': boolean;
        'border-r': boolean;
        'first:border-l': boolean;
        'border-b': boolean;
        'cursor-pointer': boolean;
    };
    pluginAttributes: String;
    maxWidth: string;
    separateCells: boolean;
    withBottomBorder: boolean;
    sortBy?: string;
    orderBy?: 'ascending' | 'descending';
    blank: boolean;
    protected isOdd?: boolean;
    private _drawRightBorder;
    isInteractive: boolean;
    private hasMenu;
    isRowSelector: boolean;
    outerBorder: boolean;
    protected isLastColumn: boolean;
    protected isLastRow: boolean;
    protected leftDistanceToViewport: number;
    protected tableBoundingRect: string | undefined;
    hideDirt: boolean;
    theme: Theme;
    plugin?: ColumnPlugin;
    protected options: {
        label: string;
        value: string;
    }[];
    protected isDisplayingPluginEditor: boolean;
    tabIndex: number;
    protected onContextMenu(event: MouseEvent): void;
    protected onPluginEvent({ detail: { action, value } }: PluginActionEvent): void;
    protected onKeyDown(event: KeyboardEvent): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected render(): TemplateResult<1>;
    protected onMenuSelection(event: MenuSelectedEvent): string | true | void | Promise<void>;
}
export {};
//# sourceMappingURL=td.d.ts.map