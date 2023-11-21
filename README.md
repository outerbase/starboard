# STARBOARD

![](https://cdn.theasc.com/Spaceballs-Eagle-5.jpg)

## TailwindCSS + LitElement

> When adding a previously unused Tailwind class, the page may reload before those styles are properly available. Refresh the page to manifest your changes.

### TailwindCSS in LitElement (or any Web Component)

```ts
import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators.js'
import { TWStyles } from '../../tailwind' // <-- /tailwind/index.js

@customElement('outerbase-table')
export class OuterbaseTable extends LitElement {
    static styles = TWStyles
    render = () => html`<p>succinct example</p>`
}
```

### Themes

Themes may override default styles via CSS or JavaScript

#### CSS

##### Inline

```html
<style>
    :root {
        --primary-color: white;
        --secondary-color: black;
    }
</style>
```

##### External

```html
<link rel="stylesheet" type="text/css" href="theme.css" />
```

#### Programmaticaly

```html
<script>
    /* themes may also be set dynamically/programatically */
    document.documentElement.style.setProperty('--success-color', 'lime')
</script>
```
