import { customElement } from 'lit/decorators.js'
import { ClassifiedElement } from '../classified-element.js'

// tl;dr <thead/>, table-header-group
@customElement('outerbase-thead')
export class THead extends ClassifiedElement {
    protected override get classMap() {
        return { 'table-header-group font-bold sticky z-10 top-0': true }
    }
}
