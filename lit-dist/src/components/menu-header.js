import { Menu } from './menu';
export class HeaderMenu extends Menu {
    get menuPositionClasses() {
        const isRenderingInBrowser = typeof window !== 'undefined';
        return '';
        // if (isRenderingInBrowser) {
        //     const position = this.getBoundingClientRect?.()
        //     const right = position?.right ?? -1
        //     const top = position?.top ?? -1
        //     const isRightSide = right > window?.innerWidth / 2
        //     const isTopSide = top < window?.innerHeight / 2
        //     const isLeftSide = !isRightSide
        //     const isBottomSide = !isTopSide
        //     // console.log('position.left', position.left)
        //     // console.log('position.right', position.right)
        //     // console.log('position.width', position.width)
        //     // console.log('this.clientWidth', this.clientWidth)
        //     // if there is room to the left
        //     if (position.left > 200) {
        //         return 'top-6 -left-44 -right-2'
        //     } else {
        //         return 'top-6 -right-44 -left-2'
        //     }
        // } else return 'top-6 -left-2 -right-44'
    }
}
