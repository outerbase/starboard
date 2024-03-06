# STARBOARD

![](https://cdn.theasc.com/Spaceballs-Eagle-5.jpg)

## Publishing to NPM

-   increment the version in `package.json` to be greater-than the last version published to npm
-   run the following command, completing the 2fa challenge, etc

```sh
npm publish --access restricted
```

## Developing locally

```
pnpm dev
```

## Developing inside of Dashboard

From Dashboard, run the following

```
pnpm link ../path/to/starboard
```

### `pnpm link` quirks

This feature has been unreliable. Follow the following steps for the best chance of success. The following commands are in the context of Dashboard.

-   `pnpm remove starboard` // to ensure any other version is unreferenced
-   `pnpm link ../path/to/starboard/repo` // to ensure Dashboard is seeing local changes

If you suspect that your changes aren't being applied, throw in an `alert` or `debugger` and verify they are before spinning your wheels further.

## Building for local Dashboard

The results of building are observed by any other projects whom `pnpm link ...`'d to this project

```
# one-time
pnpm build:lit

# continuously on changes
pnpm build:lit:watch
```

## Usage in React

```ts
import * as React from 'react'
import { createComponent } from '@lit/react'
import { Table } from 'starboard'

export const OuterbaseTable = createComponent({
    tagName: 'outerbase-table',
    elementClass: Table,
    react: React,

    events: {
        onCellUpdated: 'cell-updated' as EventName<CellUpdateEvent>,
        // etc...
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
