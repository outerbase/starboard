# STARBOARD

![](https://cdn.theasc.com/Spaceballs-Eagle-5.jpg)

## TailwindCSS + LitElement

> When adding a previously unused Tailwind class, the page may reload before those styles are properly available. Refresh the page to manifest your changes.

### TailwindCSS in LitElement (or any Web Component)

```ts
import { customElement } from 'lit/decorators.js'
import { LitElement, html, css } from 'lit'
import { TWStyles } from '../../tailwind' // <-- /tailwind/index.js

@customElement('succinct-example')
export class SuccinctExample extends LitElement {
    static styles = TWStyles
    render = () => html`<p class="text-theme-success">succinct example</p>`
}
```

### Themes

Themes may override default styles via CSS or JavaScript.

#### Inline CSS

```html
<style>
    :root {
        --primary-color: white;
        --secondary-color: black;
    }
</style>
```

#### External CSS

```html
<link rel="stylesheet" type="text/css" href="theme.css" />
```

#### Dynamically

```html
<script>
    document.documentElement.style.setProperty('--success-color', 'lime')
</script>
```
