import { type PropertyValueMap } from 'lit';
import type { TH } from './table/th.js';
import { ClassifiedElement } from './classified-element.js';
import { Theme } from '../types.js';
export declare class ColumnResizer extends ClassifiedElement {
    height?: number;
    column?: TH;
    theme: Theme;
    private xPosition?;
    private width?;
    private _mouseDown;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void;
    protected render(): import("lit").TemplateResult<1>;
}
//# sourceMappingURL=column-resizer-element.d.ts.map