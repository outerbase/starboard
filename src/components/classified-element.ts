// ClassifiedElement provides the `classMap` delegate for determining which classes to apply to the component

import { LitElement, html, type PropertyValueMap } from 'lit'
import { property } from 'lit/decorators.js'

import classMapToClassName from '../lib/class-map-to-class-name.js'

// is propogated to the DOM and therefore it's CSS is applied
export class ClassifiedElement extends LitElement {
    // classMap is a pairing of class(es) (a string) with a boolean expression
    // such that only the truthy values are rendered out and the rest are dropped
    // if a property used in such a boolean expression changes, this value is recomputed
    protected get classMap() {
        return {}
    }

    @property({ reflect: true, attribute: 'class', type: String })
    private _class = ''

    protected override willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        super.willUpdate(_changedProperties)

        // ensure `_class` reflects our latest state
        this._class = classMapToClassName(this.classMap)
        this._class // no-op line suppress the "hint" warning us that this is unused :eyeroll:
    }

    // this render() looks like it does next-to-nothing,
    // but our component itself is being rendered,
    // and it's appearance/style is provided by each component's `get _componentsInitialClassAttribute() {}` override
    // i.e. `table` vs `table-row-group` vs `table-cell` vs ...etc...
    protected override render() {
        return html`<slot></slot>`
    }
}
