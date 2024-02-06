import { type PropertyValueMap } from 'lit';
import type { TH } from './table/th.js';
import { ClassifiedElement } from './classified-element.js';
export declare class ColumnResizer extends ClassifiedElement {
    static styles: import("lit").CSSResult;
    protected height?: number;
    protected column?: TH;
    private xPosition?;
    private width?;
    private _mouseDown;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void;
    protected render(): import("lit").TemplateResult<1>;
}
//# sourceMappingURL=column-resizer.d.ts.map