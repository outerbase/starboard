import { customElement } from 'lit/decorators.js'
import { ClassifiedElement } from '../classified-element.js'

// tl;dr <tbody/>, table-row-group
@customElement('outerbase-rowgroup')
export class TBody extends ClassifiedElement {
    protected override get classMap() {
        return { 'table-row-group h-[500px]': true }
    }
}
