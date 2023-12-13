# STARBOARD

![](https://cdn.theasc.com/Spaceballs-Eagle-5.jpg)

## Publishing

Before some arbitrary other module can import these LitElement component(s), they should be compiled down to JS. This is accomplished via the `pnpm build:lit` command defined in _package.json_. This script will automatically run when packing/publishing per the [`prepack` script](https://docs.npmjs.com/cli/v10/using-npm/scripts).

## Developing locally

```
pnpm dev
```

## Importing into another project

From this repo

```
pnpm --global link
```

From the other repo

```
pnpm --global starboard
```

This will allow you to, for example, transform it into a React component:

```ts
import * as React from 'react'
import { createComponent } from '@lit/react'
import { Table } from 'starboard'

export const OuterbaseTable = createComponent({
    tagName: 'outerbase-table',
    elementClass: Table,
    react: React,

    events: {
        onCellUpdated: 'row-updated',

        onRowAdded: 'row-added',
        onRowUpdated: 'row-updated',
        onRowSelected: 'row-selected',
        onRowRemoved: 'row-removed',

        onColumnAdded: 'column-added',
        onColumnUpdated: 'column-updated',
        onColumnRemoved: 'column-removed',
    },
})
```

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
