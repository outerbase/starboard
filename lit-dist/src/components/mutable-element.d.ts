import type { PropertyValues } from 'lit';
import type { Position } from '../types.js';
import { ClassifiedElement } from './classified-element.js';
export declare class MutableElement extends ClassifiedElement {
    value?: string;
    get dirty(): boolean;
    position: Position;
    label?: string;
    originalValue?: string;
    readonly: boolean;
    width?: string;
    isInteractive: boolean;
    isEditing: boolean;
    private previousValue?;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected updated(changedProps: PropertyValues<this>): void;
    protected willUpdate(changedProperties: PropertyValues<this>): void;
    protected onKeyDown(event: KeyboardEvent): void;
    protected onDoubleClick(event: MouseEvent): void;
    protected onChange(event: Event): void;
    protected dispatchChangedEvent(): void;
    protected onBlur(): void;
    protected moveFocusToNextRow(target: HTMLElement): void;
    protected moveFocusToPreviousRow(target: HTMLElement): void;
}
//# sourceMappingURL=mutable-element.d.ts.map