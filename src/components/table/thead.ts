import { customElement } from 'lit/decorators.js'
import { ClassifiedElement } from '../classified-element'

// tl;dr <thead/>, table-header-group
@customElement('outerbase-thead')
export class THead extends ClassifiedElement {
    // // failed try at a shadow under the header
    // static styles = css`
    //     :host::after {
    //         content: '';
    //         display: block;
    //         width: 400%;
    //         height: 12px;
    //         // overflow: hidden;
    //         box-shadow: 0 4px 2px -2px gray;
    //     }
    // `

    protected override get classMap() {
        return { 'table-header-group font-bold sticky top-0': true }
    }
}
