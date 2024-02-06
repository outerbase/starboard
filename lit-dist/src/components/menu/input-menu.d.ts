import { Menu } from './index.js';
export declare class InputMenu extends Menu {
    protected _classMap: {};
    protected value: string;
    protected get menuPositionClasses(): string;
    onMenuSelection(event: Event): void;
    protected onKeyDown(event: KeyboardEvent): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected willUpdate(_changedProperties: Map<PropertyKey, unknown>): void;
    protected render(): import("lit").TemplateResult<1>;
}
//# sourceMappingURL=input-menu.d.ts.map