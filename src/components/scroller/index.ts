import { css, html } from 'lit'
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

    @property({ attribute: 'theme', type: String })
    public theme = Theme.light

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
        this.updateScrollbarDimensions = this.updateScrollbarDimensions.bind(this)
    }

    connectedCallback(): void {
        super.connectedCallback()

        // add event listeners
        window.addEventListener('resize', this.updateScrollbarDimensions)

        // attach horizontal scroll handle mouse events
        setTimeout(() => {
            this.bottomScrollHandle.value?.addEventListener('mousedown', (e) => {
                e.preventDefault() // Prevent text selection/dragging behavior

                this.startX = e.pageX // Starting X position of the mouse
                this.scrollStartX = this.scroller.value?.scrollLeft ?? 0 // Starting scroll position
                // document.body.classList.add('user-select-none') // Optional: Disable text selection during drag

                const onMouseMove = (e: MouseEvent) => {
                    const deltaX = e.pageX - this.startX // Calculate mouse movement
                    const scrollWidth = this.scroller.value?.scrollWidth ?? 0
                    const scrollWidthCoEfficient = (this.scroller.value?.clientWidth ?? 0) / scrollWidth
                    if (this.scroller.value) this.scroller.value.scrollLeft = this.scrollStartX + deltaX / scrollWidthCoEfficient
                }

                const onMouseUp = (e: MouseEvent) => {
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
            this.rightScrollHandle.value?.addEventListener('mousedown', (e) => {
                e.preventDefault() // Prevent text selection/dragging behavior

                this.startY = e.pageY // Starting X position of the mouse
                this.scrollStartY = this.scroller.value?.scrollTop ?? 0 // Starting scroll position
                // document.body.classList.add('user-select-none') // Optional: Disable text selection during drag
                // this.rightScrollHandle.value?.classList.add('scrollbar-active') // Optional: Show scrollbar thumb as active

                const onMouseMove = (e: MouseEvent) => {
                    const deltaY = e.pageY - this.startY // Calculate mouse movement
                    const scrollHeight = this.scroller.value?.scrollHeight ?? 0
                    const scrollHeightCoEfficient = (this.scroller.value?.clientHeight ?? 0) / scrollHeight
                    if (this.scroller.value) this.scroller.value.scrollTop = this.scrollStartY + deltaY / scrollHeightCoEfficient
                }

                const onMouseUp = (e: MouseEvent) => {
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
        window.removeEventListener('resize', this.updateScrollbarDimensions)
        this.scroller.value?.removeEventListener('scroll', this.onScrollHandles)
    }

    // maintains the appearance of our scrollers (horizontal + vertical)
    private onScrollHandles(_event: Event) {
        // vertical
        const scrollTop = this.scroller.value?.scrollTop ?? 0
        const scrollHeight = this.scroller.value?.scrollHeight ?? 0
        this.verticalScrollProgress = scrollTop / scrollHeight
        const scrollHeightCoEfficient = (this.scroller.value?.clientHeight ?? 0) / scrollHeight
        const verticalScrollHandleHeight =
            scrollHeightCoEfficient === 1 ? 0 : (this.scroller.value?.clientHeight ?? 0) * scrollHeightCoEfficient // 0 when nothing to scroll
        this.verticalScrollSize = `${verticalScrollHandleHeight}px`
        this.verticalScrollPosition = `${this.verticalScrollProgress * (this.scroller.value?.clientHeight ?? 0)}px`

        // horizontal
        const scrollWidth = this.scroller.value?.scrollWidth ?? 0
        const scrollLeft = this.scroller.value?.scrollLeft ?? 0
        this.horizontalScrollProgress = scrollLeft / scrollWidth
        const scrollWidthCoEfficient = (this.scroller.value?.clientWidth ?? 0) / scrollWidth
        const horizontalScrollHandleWidth =
            scrollWidthCoEfficient === 1 ? 0 : (this.scroller.value?.clientWidth ?? 0) * scrollWidthCoEfficient // 0 when nothing to scroll
        this.horizontalScrollSize = `${horizontalScrollHandleWidth}px`
        this.horizontalScrollPosition = `${this.horizontalScrollProgress * (this.scroller.value?.clientWidth ?? 0)}px`
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

    updateScrollbarDimensions() {
        if (!this.scroller.value) return

        const containerWidth = this.bottomScrollHandle.value?.offsetWidth ?? 0 // Visible width
        const scrollWidth = this.bottomScrollHandle.value?.scrollWidth ?? 0 // Total scrollable content width
        const scrollbarWidth = (containerWidth / scrollWidth) * 100 // Percentage of visible width to total width

        if (this.bottomScrollHandle.value) this.bottomScrollHandle.value.style.width = `${scrollbarWidth}%` // Set thumb width as a percentage of its parent
    }

    @state() verticalScrollPosition? = '0px'
    @state() horizontalScrollPosition? = '0px'
    @state() verticalScrollSize? = '0px'
    @state() horizontalScrollSize? = '0px'

    protected horizontalScrollProgress = 0
    protected verticalScrollProgress = 0

    protected override render() {
        const scrollableClasses = {
            dark: this.theme == Theme.dark,
            'absolute bottom-3 left-0 right-3 top-0 overflow-auto overscroll-none': true,
        }

        const handleClasses = {
            'w-full rounded-md': true,
            'bg-neutral-300 dark:bg-neutral-800': true,
            'hover:bg-neutral-400 dark:hover:bg-neutral-700': true,
            'active:bg-neutral-400 dark:active:bg-neutral-700': true,
        }

        const scrollEndClasses = {
            'absolute right-0 bottom-0': true,
            'bg-neutral-200 dark:bg-neutral-900': true,
            'transition-opacity duration-300': true,
            'opacity-0 hover:opacity-100': true,
        }

        const verticalHandleStyles = { transform: `translateY(${this.verticalScrollPosition})`, height: this.verticalScrollSize }
        const horizontalHandleStyles = { transform: `translateX(${this.horizontalScrollPosition})`, width: this.horizontalScrollSize }

        return html`<!-- aloha bruddah -->
            <div class=${classMap({ ...scrollEndClasses, 'top-0 w-3': true })} ${ref(this.rightScrollZone)}>
                <div style=${styleMap(verticalHandleStyles)} class="${classMap(handleClasses)}" ${ref(this.rightScrollHandle)}></div>
            </div>

            <div class=${classMap({ ...scrollEndClasses, 'left-0': true })} ${ref(this.bottomScrollZone)}>
                <div
                    style=${styleMap(horizontalHandleStyles)}
                    class="${classMap({ ...handleClasses, 'h-3': true })}"
                    ${ref(this.bottomScrollHandle)}
                ></div>
            </div>

            <div class=${classMap(scrollableClasses)} @scroll=${this._onScroll} @scrollend=${this._onScroll} ${ref(this.scroller)}>
                <slot></slot>
            </div>`
    }
}
