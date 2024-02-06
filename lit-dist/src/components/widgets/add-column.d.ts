import { type TemplateResult } from 'lit';
import { ClassifiedElement } from '../classified-element';
import '../menu/input-menu.js';
export declare class AddColumnElement extends ClassifiedElement {
    protected get classMap(): {
        'inline-block p-3.5 w-40': boolean;
        'text-xs': boolean;
        'bg-neutral-50 dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50': boolean;
        'rounded-lg border border-neutral-400 dark:border-neutral-600': boolean;
    };
    static labelClasses: {
        'font-medium': boolean;
    };
    static inputClasses: {
        'focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-50 focus:outline-none ': boolean;
        'px-2 py-1.5': boolean;
        'bg-neutral-50 dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50': boolean;
        'placeholder-neutral-400 dark:placeholder-neutral-600': boolean;
        'rounded-md border border-neutral-400 dark:border-neutral-600': boolean;
    };
    static buttonClasses: {
        'bg-neutral-950 dark:bg-neutral-50 hover:bg-neutral-800 hover:dark:bg-neutral-200': boolean;
        'text-neutral-50 dark:text-neutral-950': boolean;
        'px-5 py-1.5 rounded-md': boolean;
    };
    protected columnName: string;
    protected columnType: string;
    protected errorMessage: TemplateResult<1> | undefined;
    protected onChange(event: InputEvent): void;
    protected onSubmit(event: Event): void;
    render(): TemplateResult<1>;
}
//# sourceMappingURL=add-column.d.ts.map