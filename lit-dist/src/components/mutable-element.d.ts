import type { PropertyValues } from 'lit';
import { Theme, type Position, type Serializable } from '../types.js';
import { ClassifiedElement } from './classified-element.js';
export declare class MutableElement extends ClassifiedElement {
    protected get classMap(): {
        'cursor-pointer': boolean;
        dark: boolean;
    };
    value?: Serializable;
    get dirty(): boolean;
    position: Position;
    label?: string;
    originalValue?: Serializable;
    readonly: boolean;
    width?: string;
    isInteractive: boolean;
    outerBorder: boolean;
    theme: Theme;
    separateCells: boolean;
    blank: boolean;
    type?: string;
    isEditing: boolean;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected updated(changedProps: PropertyValues<this>): void;
    protected willUpdate(changedProperties: PropertyValues<this>): void;
    protected onKeyDown(event: KeyboardEvent & {
        didCloseMenu?: boolean;
    }): void;
    protected onDoubleClick(event: MouseEvent): void;
    protected onChange(event: Event): void;
    protected dispatchChangedEvent(): void;
    protected onBlur(): void;
    protected moveFocusToNextRow(target: HTMLElement): void;
    protected moveFocusToPreviousRow(target: HTMLElement): void;
}
//# sourceMappingURL=mutable-element.d.ts.map