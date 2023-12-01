export function heightOfElement(element: Element) {
    const styles = window.getComputedStyle(element)
    const height = element.getBoundingClientRect().height

    const marginTop = parseFloat(styles.marginTop)
    const marginBottom = parseFloat(styles.marginBottom)
    const paddingTop = parseFloat(styles.paddingTop)
    const paddingBottom = parseFloat(styles.paddingBottom)
    const borderTop = parseFloat(styles.borderTopWidth)
    const borderBottom = parseFloat(styles.borderBottomWidth)

    const totalHeight = height + marginTop + marginBottom + paddingTop + paddingBottom + borderTop + borderBottom

    return totalHeight
}
