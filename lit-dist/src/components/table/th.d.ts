import { type PropertyValueMap, type PropertyValues } from 'lit';
import '../column-resizer-element.js';
import { MutableElement } from '../mutable-element.js';
import { MenuSelectedEvent } from '../../lib/events.js';
import '../menu/column-menu.js';
import type { HeaderMenuOptions, ColumnPlugin, PluginWorkspaceInstallationId } from '../../types.js';
import { Theme } from '../../types.js';
export declare class TH extends MutableElement {
    protected get classMap(): {
        'table-cell relative whitespace-nowrap h-[38px]': boolean;
        'border-b border-theme-border dark:border-theme-border-dark': boolean;
        'first:border-l border-t': boolean;
        'px-cell-padding-x py-cell-padding-y': boolean;
        'bg-theme-column dark:bg-theme-column-dark': boolean;
        'bg-theme-cell-dirty dark:bg-theme-cell-dirty-dark': boolean;
        'select-none': boolean;
        'border-r': boolean;
        'cursor-pointer': boolean;
        dark: boolean;
    };
    tableHeight?: number;
    withResizer: boolean;
    outerBorder: boolean;
    value: string;
    plugins?: Array<ColumnPlugin>;
    installedPlugins: Record<string, PluginWorkspaceInstallationId | undefined>;
    blank: boolean;
    protected isLastColumn: boolean;
    separateCells: boolean;
    hasMenu: boolean;
    isInteractive: boolean;
    options: HeaderMenuOptions;
    protected _options: HeaderMenuOptions;
    protected _pluginOptions: HeaderMenuOptions;
    protected distanceToLeftViewport: number;
    theme: Theme;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected willUpdate(_changedProperties: PropertyValues<this>): void;
    private width;
    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void;
    protected render(): import("lit").TemplateResult<1>;
    protected dispatchChangedEvent(): void;
    protected removeColumn(): void;
    protected hideColumn(): void;
    protected onMenuSelection(event: MenuSelectedEvent): string | boolean | void;
    protected onContextMenu(event: MouseEvent): void;
}
//# sourceMappingURL=th.d.ts.map