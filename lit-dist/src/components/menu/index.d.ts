import { type PropertyValueMap } from 'lit';
import { ClassifiedElement } from '../classified-element.js';
import { Theme, type HeaderMenuOptions } from '../../types.js';
export declare class Menu extends ClassifiedElement {
    protected get classMap(): {
        relative: boolean;
        'flex items-center justify-between gap-2': boolean;
        'font-medium select-none whitespace-nowrap': boolean;
        dark: boolean;
    };
    open: boolean;
    selection?: string;
    options: HeaderMenuOptions;
    protected activeOptions: HeaderMenuOptions;
    theme: Theme;
    withoutPadding: boolean;
    protected historyStack: Array<HeaderMenuOptions>;
    protected focused?: string;
    protected get menuPositionClasses(): string;
    private outsideClicker;
    private activeEvent;
    private close;
    protected willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void;
    protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void;
    protected onTrigger(event: Event): void;
    protected onItemClick(event: MouseEvent): void;
    protected onSelection(event: Event, value: string): void;
    protected onKeyDown(event: KeyboardEvent & {
        didCloseMenu: boolean;
    }): void;
    focus(): void;
    protected get listElement(): import("lit").TemplateResult<1> | null;
    protected render(): import("lit").TemplateResult<1>;
}
//# sourceMappingURL=index.d.ts.map