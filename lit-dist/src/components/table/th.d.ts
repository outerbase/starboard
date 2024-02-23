import { type PropertyValueMap, type PropertyValues } from 'lit';
import '../column-resizer-element.js';
import { MutableElement } from '../mutable-element.js';
import { MenuSelectedEvent } from '../../lib/events.js';
import '../menu/column-menu.js';
import type { HeaderMenuOptions, ColumnPlugin, PluginWorkspaceInstallationId } from '../../types.js';
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
    readonly: boolean;
    tableHeight?: number;
    withResizer: boolean;
    value: string;
    originalValue?: string;
    plugins?: Array<ColumnPlugin>;
    installedPlugins: Record<string, PluginWorkspaceInstallationId | undefined>;
    protected isLastColumn: boolean;
    hasMenu: boolean;
    options: HeaderMenuOptions;
    protected distanceToLeftViewport: number;
    private _previousWidth;
    protected _options: HeaderMenuOptions;
    protected _pluginOptions: HeaderMenuOptions;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void;
    protected willUpdate(changedProperties: PropertyValues<this>): void;
    protected render(): import("lit").TemplateResult<1>;
    protected dispatchChangedEvent(): void;
    protected removeColumn(): void;
    protected hideColumn(): void;
    protected onMenuSelection(event: MenuSelectedEvent): string | boolean | void;
    protected onContextMenu(event: MouseEvent): void;
}
//# sourceMappingURL=th.d.ts.map