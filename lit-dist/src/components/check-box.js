var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CustomCheckbox_1;
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { CheckMark } from '../lib/icons/check-mark.js';
import { TWStyles } from '../../tailwind/index.js';
import { Theme } from '../types.js';
let CustomCheckbox = CustomCheckbox_1 = class CustomCheckbox extends LitElement {
    constructor() {
        super(...arguments);
        this.checked = false;
        this.theme = Theme.light;
        this.tabIndex = 0;
        this._class = 'focus:shadow-ringlet dark:focus:shadow-ringlet-dark focus:rounded-md focus:ring-1 focus:ring-black dark:focus:ring-neutral-300 focus:outline-none';
    }
    toggleCheckbox() {
        this.checked = !this.checked;
    }
    onKeyDown({ code }) {
        if (code === 'Enter' || code === 'Space') {
            this.checked = !this.checked;
        }
    }
    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('keydown', this.onKeyDown);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('keydown', this.onKeyDown);
    }
    render() {
        return html `
            <div class="flex items-center cursor-pointer" @click="${this.toggleCheckbox}">
                ${this.checked ? CustomCheckbox_1.checkedTemplate : CustomCheckbox_1.uncheckedTemplate}
                <input type="checkbox" ?checked="${this.checked}" @change="${this.toggleCheckbox}" class="hidden" />
            </div>
        `;
    }
};
CustomCheckbox.styles = TWStyles;
CustomCheckbox.checkedTemplate = html `<span
        class="bg-black dark:bg-white text-white dark:text-black flex items-center justify-center w-4 h-4 p-0.5 rounded-md"
        >${CheckMark(16)}</span
    >`;
CustomCheckbox.uncheckedTemplate = html `<span class="w-4 h-4 border border-neutral-500 rounded-md"></span>`;
__decorate([
    property({ type: Boolean })
], CustomCheckbox.prototype, "checked", void 0);
__decorate([
    property({ type: String })
], CustomCheckbox.prototype, "theme", void 0);
__decorate([
    property({ attribute: 'class', type: String, reflect: true })
], CustomCheckbox.prototype, "_class", void 0);
CustomCheckbox = CustomCheckbox_1 = __decorate([
    customElement('check-box')
], CustomCheckbox);
export { CustomCheckbox };
