import { customElement } from 'lit/decorators.js'

import { Menu } from '../menu.js'

@customElement('outerbase-th-menu')
export class ColumnMenu extends Menu {
    protected override get classMap() {
        return {
            'relative flex items-center justify-between font-mono': true,
        }
    }
}
