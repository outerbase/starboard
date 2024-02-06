import { type PropertyValueMap } from 'lit';
import { ClassifiedElement } from './classified-element.js';
import { Theme } from '../types.js';
export declare class Menu extends ClassifiedElement {
    static styles: import("lit").CSSResult;
    protected get classMap(): {
        'relative flex items-center justify-between gap-2': boolean;
        'font-medium select-none whitespace-nowrap': boolean;
        dark: boolean;
    };
    open: boolean;
    selection?: string;
    options: Array<Record<'label' | 'value' | 'classes', string>>;
    theme: Theme;
    protected focused?: string;
    protected get menuPositionClasses(): string;
    private outsideClicker;
    private activeEvent;
    protected willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void;
    protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void;
    protected onTrigger(event: MouseEvent): void;
    protected onItemClick(event: MouseEvent): void;
    protected onSelection(value: string): void;
    protected onKeyDown(event: KeyboardEvent): void;
    focus(): void;
    protected get listElement(): import("lit").TemplateResult<1> | null;
    protected render(): import("lit").TemplateResult<1>;
}
//# sourceMappingURL=menu.d.ts.map