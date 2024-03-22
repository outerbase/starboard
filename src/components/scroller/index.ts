import { css, html, type PropertyValueMap } from 'lit'
import { customElement } from 'lit/decorators/custom-element.js'
import { property } from 'lit/decorators/property.js'
import { state } from 'lit/decorators/state.js'
import { classMap } from 'lit/directives/class-map.js'
import { createRef, ref, type Ref } from 'lit/directives/ref.js'
import { styleMap } from 'lit/directives/style-map.js'
import throttle from 'lodash-es/throttle'
import { Theme } from '../../types'
import { ClassifiedElement } from '../classified-element'

@customElement('outerbase-scrollable')
export class ScrollableElement extends ClassifiedElement {
    static override styles = [
        ...ClassifiedElement.styles,
        css`
            /* Hide scrollbar for Chrome, Safari and Opera */
            ::-webkit-scrollbar {
                display: none; /* for Chrome, Safari, and Opera */
            }

            /* Hide scrollbar for IE, Edge, and Firefox */
            :host {
                -ms-overflow-style: none; /* for Internet Explorer and Edge */
                scrollbar-width: none; /* for Firefox */
            }
        `,
    ]

    @property()
    public onScroll?: () => void

    @property({ attribute: 'threshold', type: Number })
    public threshold = 0

    @property() public scroller: Ref<HTMLDivElement> = createRef()
    @property() public rightScrollZone: Ref<HTMLDivElement> = createRef()
    @property() public rightScrollHandle: Ref<HTMLDivElement> = createRef()
    @property() public bottomScrollZone: Ref<HTMLDivElement> = createRef()
    @property() public bottomScrollHandle: Ref<HTMLDivElement> = createRef()

    @state() protected isDragging = false

    protected startX = 0
    protected startY = 0
    protected scrollStartX = 0
    protected scrollStartY = 0
    protected previousScrollPosition?: number

    constructor() {
        super()
        this._onScroll = this._onScroll ? throttle(this._onScroll, 100).bind(this) : this._onScroll.bind(this)
        this.onScrollHandles = this.onScrollHandles.bind(this)
    }

    connectedCallback(): void {
        super.connectedCallback()

        // set initial scroller values
        setTimeout(this.onScrollHandles, 0)

        // attach horizontal scroll handle mouse events
        setTimeout(() => {
            this.bottomScrollHandle.value?.addEventListener('mousedown', (mouseDownEvent: MouseEvent) => {
                mouseDownEvent.preventDefault() // Prevent text selection/dragging behavior

                this.startX = mouseDownEvent.pageX // Starting X position of the mouse
                this.scrollStartX = this.scroller.value?.scrollLeft ?? 0 // Starting scroll position
                // document.body.classList.add('user-select-none') // Optional: Disable text selection during drag

                const onMouseMove = (mouseMoveEvent: MouseEvent) => {
                    const deltaX = mouseMoveEvent.pageX - this.startX // Calculate mouse movement
                    const scrollWidth = this.scroller.value?.scrollWidth ?? 0
                    const scrollWidthCoEfficient = (this.scroller.value?.clientWidth ?? 0) / scrollWidth
                    if (this.scroller.value) this.scroller.value.scrollLeft = this.scrollStartX + deltaX / scrollWidthCoEfficient
                }

                const onMouseUp = (_event: MouseEvent) => {
                    document.removeEventListener('mousemove', onMouseMove)
                    document.removeEventListener('mouseup', onMouseUp)

                    // document.body.classList.remove('user-select-none') // Re-enable text selection after dragging
                }

                document.addEventListener('mouseup', onMouseUp)
                document.addEventListener('mousemove', onMouseMove)
            })
        }, 0)

        // attach vertical scroll handle mouse events
        setTimeout(() => {
            this.rightScrollHandle.value?.addEventListener('mousedown', (mouseDownEvent: MouseEvent) => {
                mouseDownEvent.preventDefault() // Prevent text selection/dragging behavior

                this.startY = mouseDownEvent.pageY // Starting X position of the mouse
                this.scrollStartY = this.scroller.value?.scrollTop ?? 0 // Starting scroll position
                // document.body.classList.add('user-select-none') // Optional: Disable text selection during drag
                // this.rightScrollHandle.value?.classList.add('scrollbar-active') // Optional: Show scrollbar thumb as active

                const onMouseMove = (mouseMoveEvent: MouseEvent) => {
                    mouseMoveEvent.preventDefault()
                    const deltaY = mouseMoveEvent.pageY - this.startY // Calculate mouse movement
                    const scrollHeight = this.scroller.value?.scrollHeight ?? 0
                    const scrollHeightCoEfficient = (this.scroller.value?.clientHeight ?? 0) / scrollHeight
                    if (this.scroller.value) this.scroller.value.scrollTop = this.scrollStartY + deltaY / scrollHeightCoEfficient
                }

                const onMouseUp = (_event: MouseEvent) => {
                    document.removeEventListener('mousemove', onMouseMove)
                    document.removeEventListener('mouseup', onMouseUp)

                    // document.body.classList.remove('user-select-none') // Re-enable text selection after dragging
                    // this.rightScrollHandle.value?.classList.remove('scrollbar-active') // Optional: Show scrollbar thumb as active
                }

                document.addEventListener('mouseup', onMouseUp)
                document.addEventListener('mousemove', onMouseMove)
            })
        }, 0)

        // attach scroller handles
        setTimeout(() => {
            this.scroller.value?.addEventListener('scroll', this.onScrollHandles)
        }, 0)
    }

    disconnectedCallback(): void {
        super.disconnectedCallback()

        // remove event listeners
        this.scroller.value?.removeEventListener('scroll', this.onScrollHandles)
    }

    protected willUpdate(changedProperties: PropertyValueMap<this>): void {
        if (changedProperties.has('hasHoveringCursor')) {
            // ensure scrollers appear on initial appearance
            if (this.hasHoveringCursor) this.onScrollHandles()
        }
    }

    // maintains the appearance of our scrollers (horizontal + vertical)
    private onScrollHandles(_event?: Event) {
        // vertical
        const scrollTop = this.scroller.value?.scrollTop ?? 0
        const scrollHeight = this.scroller.value?.scrollHeight ?? 0
        this.verticalScrollProgress = scrollTop / scrollHeight
        const scrollHeightCoEfficient = (this.scroller.value?.clientHeight ?? 0) / scrollHeight
        const verticalScrollHandleHeight =
            scrollHeightCoEfficient === 1 ? 0 : (this.scroller.value?.clientHeight ?? 0) * scrollHeightCoEfficient // 0 when nothing to scroll
        this.verticalScrollSize = verticalScrollHandleHeight
        this.verticalScrollPosition = this.verticalScrollProgress * (this.scroller.value?.clientHeight ?? 0)

        // horizontal
        const scrollWidth = this.scroller.value?.scrollWidth ?? 0
        const scrollLeft = this.scroller.value?.scrollLeft ?? 0
        this.horizontalScrollProgress = scrollLeft / scrollWidth
        const scrollWidthCoEfficient = (this.scroller.value?.clientWidth ?? 0) / scrollWidth
        const horizontalScrollHandleWidth =
            scrollWidthCoEfficient === 1 ? 0 : (this.scroller.value?.clientWidth ?? 0) * scrollWidthCoEfficient // 0 when nothing to scroll
        this.horizontalScrollSize = horizontalScrollHandleWidth
        this.horizontalScrollPosition = this.horizontalScrollProgress * (this.scroller.value?.clientWidth ?? 0)
    }

    // trigger `onScroll` when scrolling distance >= threshold (for the sake of optimizing performance)
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

    private onClickVerticalScroller(event: MouseEvent) {
        if (this.scroller.value) {
            const clickedAtCoef = (event.clientY - this.getBoundingClientRect().top) / this.scroller.value?.clientHeight
            this.scroller.value.scrollTop = clickedAtCoef * (this.scroller.value?.scrollHeight ?? 0) - this.verticalScrollSize
        }
    }

    private onClickHorizontalScroller(event: MouseEvent) {
        if (this.scroller.value) {
            const clickedAtCoef = (event.clientX - this.getBoundingClientRect().left) / this.scroller.value?.clientWidth
            this.scroller.value.scrollLeft = clickedAtCoef * (this.scroller.value?.scrollWidth ?? 0) - this.horizontalScrollSize
        }
    }

    @state() verticalScrollPosition = 0
    @state() horizontalScrollPosition = 0
    @state() verticalScrollSize = 0
    @state() horizontalScrollSize = 0
    @state() hasHoveringCursor = false

    protected horizontalScrollProgress = 0
    protected verticalScrollProgress = 0
    private pendingMouseLeave?: NodeJS.Timeout

    protected override render() {
        const scrollableClasses = {
            dark: this.theme == Theme.dark,
            'absolute bottom-0 left-0 right-0 top-0 overflow-auto overscroll-none': true,
        }

        const handleClasses = {
            'w-full rounded-md': true,
            'bg-neutral-200/60 dark:bg-neutral-700/50': true,
            'hover:bg-neutral-300 dark:hover:bg-neutral-700': true,
            'active:bg-neutral-300 dark:active:bg-neutral-700': true,
        }

        const scrollEndClasses = {
            'z-50 absolute right-0 bottom-0': true,
            'transition-opacity duration-300': true,
            // 'opacity-0 group-hover:opacity-100': true,
            'opacity-0': !this.hasHoveringCursor,
            'opacity-100': this.hasHoveringCursor,
        }

        const verticalHandleStyles = { transform: `translateY(${this.verticalScrollPosition}px)`, height: `${this.verticalScrollSize}px` }
        const horizontalHandleStyles = {
            transform: `translateX(${this.horizontalScrollPosition}px)`,
            width: `${this.horizontalScrollSize}px`,
        }

        return html`<!-- aloha bruddah -->
            <div
                // class="group"
                @mouseleave=${() => {
                    this.pendingMouseLeave = setTimeout(() => (this.hasHoveringCursor = false), 1000)
                }}
                @mouseenter=${() => {
                    this.hasHoveringCursor = true
                    clearTimeout(this.pendingMouseLeave)
                    delete this.pendingMouseLeave
                }}
            >
                <div
                    class=${classMap({ ...scrollEndClasses, 'top-0 w-1.5': true })}
                    ${ref(this.rightScrollZone)}
                    @click=${this.onClickVerticalScroller}
                >
                    <div style=${styleMap(verticalHandleStyles)} class="${classMap(handleClasses)}" ${ref(this.rightScrollHandle)}></div>
                </div>

                <div
                    class=${classMap({ ...scrollEndClasses, 'left-0': true })}
                    ${ref(this.bottomScrollZone)}
                    @click="${this.onClickHorizontalScroller}"
                >
                    <div
                        style=${styleMap(horizontalHandleStyles)}
                        class="${classMap({ ...handleClasses, 'h-1.5': true })}"
                        ${ref(this.bottomScrollHandle)}
                    ></div>
                </div>

                <div class=${classMap(scrollableClasses)} @scroll=${this._onScroll} @scrollend=${this._onScroll} ${ref(this.scroller)}>
                    <slot></slot>
                </div>
            </div>`
    }
}
