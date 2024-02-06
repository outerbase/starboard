var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { customElement } from 'lit/decorators.js';
import { ClassifiedElement } from '../classified-element.js';
// tl;dr <thead/>, table-header-group
let THead = class THead extends ClassifiedElement {
    get classMap() {
        return { 'table-header-group sticky z-10 top-0': true };
    }
};
THead = __decorate([
    customElement('outerbase-thead')
], THead);
export { THead };
