# STARBOARD

![](https://cdn.theasc.com/Spaceballs-Eagle-5.jpg)

## TailwindCSS with LitElement

> ⚠️ When adding a previously unused TW class the page will reload the component before the updated Tailwind files are available. You'll need to either save the file a second time (to trigger a refresh) or explicitly reload the page.

### Example usage of TailwindCSS in a LitElement component

```ts
import { TWStyles } from '../../tailwind'
export class OuterbaseTable extends LitElement {
    static styles = TWStyles
}
customElements.define('outerbase-table', OuterbaseTable)
```

### // TODO Variables

Next step is to update `tailwind.config.mjs` to use variables instead of explicitly values.

#### Example

```
{ "table-header-text-color": "#000" }
```

⬇️ ⬇️ ⬇️

```
{ "table-header-text-color": "var(--table-header-text-color") }
```

-   `class="table-header-text-color"` will reflect that variable at runtime
-   This allows the host of `<outerbase-table />` to customize those variables
-   Starboard will receive those variables as a message from Dashboard and update them via the following example

```
root.style.setProperty('--table-header-text-color', 'green');
```
