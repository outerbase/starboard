import { Menu } from './index.js';
export declare class InputMenu extends Menu {
    protected _classMap: {
        'focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-50 focus:outline-none ': boolean;
        'px-2 py-1.5': boolean;
        'bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400': boolean;
        'placeholder-neutral-400 dark:placeholder-neutral-600': boolean;
        'rounded-md border border-neutral-400 dark:border-neutral-600': boolean;
    };
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