import { css, html } from 'lit'
import { customElement } from 'lit/decorators/custom-element.js'
import { property } from 'lit/decorators/property.js'
import { state } from 'lit/decorators/state.js'
import { classMap } from 'lit/directives/class-map.js'
import { createRef, ref, type Ref } from 'lit/directives/ref.js'
import throttle from 'lodash-es/throttle'
import { Theme } from '../../types'
import { ClassifiedElement } from '../classified-element'

@customElement('outerbase-scrollable')
export class ScrollableElement extends ClassifiedElement {
    static override styles = [
        ...ClassifiedElement.styles,
        css`
            :host {
                --z-scroll-bar: 3;
                --scroll-bar-background-color: var(--color-neutral-200);
                --scroll-bar-background-color-dark: var(--color-neutral-900);
                --scroll-bar-inactive-color: var(--color-neutral-300);
                --scroll-bar-inactive-color-dark: var(--color-neutral-800);
                --scroll-bar-active-color: var(--color-neutral-400);
                --scroll-bar-active-color-dark: var(--color-neutral-700);
            }

            #outer-container:hover #scrollbar-bottom {
                opacity: 1;
            }

            #scrollbar-bottom {
                opacity: 0;
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 10px;
                background-color: var(--scroll-bar-background-color);
                z-index: var(--z-scroll-bar);
                transition: opacity 0.3s;
                border-radius: 6px;
            }

            .dark ~ #scrollbar-bottom {
                background-color: var(--scroll-bar-background-color-dark);
            }

            #scrollbar-bottom-thumb {
                position: absolute;
                left: 0;
                width: 50px;
                height: 10px;
                background-color: var(--scroll-bar-inactive-color);
                border-radius: 6px;
                cursor: pointer;
            }

            .dark ~ #scrollbar-bottom > #scrollbar-bottom-thumb {
                background-color: var(--scroll-bar-inactive-color-dark);
            }

            #scrollbar-bottom-thumb:hover {
                background-color: var(--scroll-bar-active-color);
            }

            .dark ~ #scrollbar-bottom > #scrollbar-bottom-thumb:hover {
                background-color: var(--scroll-bar-active-color-dark) !important;
            }

            .scrollbar-active {
                opacity: 1;
                background-color: var(--scroll-bar-active-color) !important;
            }

            .dark ~ #scrollbar-bottom > .scrollbar-active {
                background-color: var(--scroll-bar-active-color-dark) !important;
            }
        `,
    ]

    @property({ attribute: 'theme', type: String })
    public theme = Theme.light

    @property()
    public onScroll?: () => void

    @property({ attribute: 'threshold', type: Number })
    public threshold = 0

    @property() public scroller: Ref<HTMLDivElement> = createRef()
    @property() public bottom: Ref<HTMLDivElement> = createRef()

    @state() protected isDragging = false

    protected bottomHandle: Ref<HTMLDivElement> = createRef()
    protected startX = 0
    protected scrollStartX = 0
    protected previousScrollPosition?: number

    constructor() {
        super()
        this._onScroll = this._onScroll ? throttle(this._onScroll, 100).bind(this) : this._onScroll.bind(this)
        this.updateScrollbarDimensions = this.updateScrollbarDimensions.bind(this)
    }

    connectedCallback(): void {
        super.connectedCallback()
        // add event listeners
        window.addEventListener('resize', this.updateScrollbarDimensions)

        setTimeout(() => {
            this.bottomHandle.value?.addEventListener('mousedown', (e) => {
                console.debug('mousedown')

                this.isDragging = true
                this.startX = e.pageX // Starting X position of the mouse
                this.scrollStartX = this.scroller.value?.scrollLeft ?? 0 // Starting scroll position
                document.body.classList.add('user-select-none') // Optional: Disable text selection during drag

                this.bottomHandle.value?.classList.add('scrollbar-active') // Optional: Show scrollbar thumb as active

                e.preventDefault() // Prevent text selection/dragging behavior

                const mouseMover = (e: MouseEvent) => {
                    console.debug('mousemove')

                    if (!this.isDragging) return
                    const deltaX = e.pageX - this.startX // Calculate mouse movement
                    const thumbWidthPercent = this.scroller.value ? this.scroller.value?.clientWidth / this.scroller.value?.scrollWidth : 0
                    const scrollX = this.scrollStartX + deltaX / thumbWidthPercent
                    if (this.scroller.value) this.scroller.value.scrollLeft = scrollX
                }

                const mouseUp = (e: MouseEvent) => {
                    console.debug('mouseup')

                    document.removeEventListener('mousemove', mouseMover)
                    document.removeEventListener('mouseup', mouseUp)

                    this.isDragging = false
                    document.body.classList.remove('user-select-none') // Re-enable text selection after dragging
                    this.bottomHandle.value?.classList.remove('scrollbar-active') // Optional: Show scrollbar thumb as active
                }

                document.addEventListener('mouseup', mouseUp)
                document.addEventListener('mousemove', mouseMover)
            })
        }, 0)
    }

    disconnectedCallback(): void {
        super.disconnectedCallback()

        // remove event listeners
        window.removeEventListener('resize', this.updateScrollbarDimensions)
    }

    // trigger `onScroll` when scrolling distance >= threshold
    // for the sake of optimizing performance
    private _onScroll(_event: Event) {
        const previous = this.previousScrollPosition ?? 0
        const current = this.scroller.value?.scrollTop ?? 0
        const difference = Math.abs(previous - current)

        if (difference > this.threshold) {
            this.previousScrollPosition = current
            if (typeof this.onScroll === 'function') {
                this.onScroll()
            }
        }
    }

    updateScrollbarDimensions() {
        if (!this.scroller.value) return
        if (this.bottom.value) {
            this.bottom.value.style.left = `${this.bottomHandle.value?.offsetLeft}px` // Set scrollbar position to match the code container
            this.bottom.value.style.width = `${this.bottomHandle.value?.offsetWidth}px` // Set scrollbar width to match the code container
        }

        const containerWidth = this.bottomHandle.value?.offsetWidth ?? 0 // Visible width
        const scrollWidth = this.bottomHandle.value?.scrollWidth ?? 0 // Total scrollable content width
        const scrollbarWidth = (containerWidth / scrollWidth) * 100 // Percentage of visible width to total width
        if (this.bottomHandle.value) this.bottomHandle.value.style.width = `${scrollbarWidth}%` // Set thumb width as a percentage of its parent
    }

    protected override render() {
        const scrollableClasses = {
            dark: this.theme == Theme.dark,
            'h-full absolute bottom-0 left-0 right-0 top-0 overflow-auto overscroll-none': true,
        }

        return html`<div class=${classMap(scrollableClasses)} @scroll=${this._onScroll} @scrollend=${this._onScroll} ${ref(this.scroller)}>
            <slot></slot>
            <div id="scrollbar-bottom" ${ref(this.bottom)}>
                <div id="scrollbar-bottom-thumb" ${ref(this.bottomHandle)}></div>
            </div>
        </div>`
    }
}
