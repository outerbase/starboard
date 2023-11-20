import { signal } from '@preact/signals'
import { h } from 'preact'
import type { PropsWithChildren, Ref } from 'preact/compat'

import { useEffect, useRef, useCallback, useMemo } from 'preact/hooks'
import classNames from '../lib/class-names'

export type ObTableProps = {
    data: Array<Record<string, string | Array<string>>>
    tableClassName?: string
    fillWidth?: boolean
}

export const ObTable = ({
    data,
    tableClassName,
    fillWidth = true,
}: ObTableProps) => {
    const ref = useRef<HTMLTableElement>(null)
    const height = signal(0)
    const selectableText = signal(true)
    const cellSeparators = signal(true)

    // convert JSON object to columns+rows
    const columns = useMemo(
        () => (data?.length > 0 ? Object.keys(data[0]) : []),
        [data]
    )
    const rows = useMemo(
        () => (data.length > 0 ? data.map((d) => Object.values(d)) : []),
        []
    )

    // update column width <Resizer /> when the table's size is changed
    useEffect(() => {
        const resizeObserver = new ResizeObserver((_entries) => {
            if (!ref.current) return
            height.value = ref.current.offsetHeight
        })

        if (ref.current) resizeObserver.observe(ref.current)
        return () => resizeObserver.disconnect()
    }, [])

    // disable 'cellSeparators' when JS is loaded
    // this is necessary because without JS our column-resizer is absent
    useEffect(() => {
        cellSeparators.value = false
    }, [])

    const THEAD = useCallback(({ children }: PropsWithChildren) => {
        return <thead className="sticky top-0">{children}</thead>
    }, [])

    const THEAD_TR = useCallback(
        ({ children }: PropsWithChildren) => (
            <tr className="bg-white/80 border-b-neutral-200 backdrop-blur-sm">
                {children}
            </tr>
        ),
        []
    )

    const TH = useCallback(
        ({
            className,
            withResizer = true,
            children,
        }: PropsWithChildren<{
            className?: string
            withResizer?: boolean
        }>) => {
            const ref = useRef<HTMLTableCellElement>(null)
            return (
                <th
                    ref={ref}
                    className={classNames(
                        className,
                        'border-b',
                        cellSeparators.value && !withResizer
                            ? 'border-r shadow-sm'
                            : null,
                        'relative whitespace-nowrap p-1.5'
                    )}
                >
                    {children}
                    {withResizer && (
                        <Resizer height={`${height}px`} columnRef={ref} />
                    )}
                </th>
            )
        },
        [height]
    )

    const TR = useCallback(
        ({ children }: PropsWithChildren) => (
            <tr className="hover:bg-neutral-300/10">{children}</tr>
        ),
        []
    )

    const TD = useCallback(
        ({
            children,
            maxWidthClass,
            includeBottomBorder = true,
        }: PropsWithChildren<{
            maxWidthClass?: string
            includeBottomBorder?: boolean
        }>) => (
            <td
                className={classNames(
                    maxWidthClass ? maxWidthClass : 'max-w-xs',
                    cellSeparators.value ? 'border-r' : null,
                    includeBottomBorder ? 'border-b' : null,
                    'p-1.5 text-ellipsis whitespace-nowrap overflow-hidden'
                )}
            >
                {/* the section <span /> wrapper is to prevent whitespace from being highlight/selected */}
                <span
                    className={selectableText.value ? 'select-text' : undefined}
                >
                    {children}
                </span>
            </td>
        ),
        []
    )

    const Resizer = ({
        height,
        columnRef,
    }: {
        height: string
        columnRef: Ref<HTMLTableCellElement> | null
    }) => {
        const xPositionSignal = signal(0)
        const widthSignal = signal(0)

        const onMouseDown: h.JSX.MouseEventHandler<HTMLDivElement> =
            useCallback(({ clientX }) => {
                const column = columnRef?.current
                if (!column) return

                // prevent highlighting text while resizing
                selectableText.value = false

                // set initial `x` and `w`
                xPositionSignal.value = clientX
                widthSignal.value = parseInt(
                    window.getComputedStyle(column).width,
                    10
                )

                // attach mousemove + mouseup listener
                const onMouseMove = ({ clientX }: MouseEvent) => {
                    const column = columnRef?.current
                    if (!column) return

                    const dx = clientX - xPositionSignal.value
                    column.style.width = `${widthSignal.value + dx}px`
                }

                const onMouseUp = () => {
                    // restore text seleciton
                    selectableText.value = true
                    document.removeEventListener('mousemove', onMouseMove)
                    document.removeEventListener('mouseup', onMouseUp)
                }

                document.addEventListener('mousemove', onMouseMove)
                document.addEventListener('mouseup', onMouseUp)
            }, [])

        return (
            <div
                // the fancy usage of right-* and hover:right-* is to maintain the center of the handle as the width growth; without this it grows in one direction
                className="absolute top-0 right-[3px] hover:right-0 z-10 w-[1px] hover:w-1.5 active:w-1.5 cursor-col-resize bg-neutral-200 hover:bg-blue-300 active:bg-blue-500"
                style={{ height }}
                onMouseDown={onMouseDown}
            />
        )
    }

    return (
        <table
            ref={ref}
            className={classNames(
                tableClassName,
                fillWidth ? 'w-full' : null,
                'select-none border-separate border-spacing-0 text-left'
            )}
        >
            <THEAD>
                <THEAD_TR>
                    {columns.map((k, idx) => (
                        // omit column resizer on the last column because... it's awkward.
                        <TH withResizer={columns.length - 1 !== idx}>{k}</TH>
                    ))}
                </THEAD_TR>
            </THEAD>

            <tbody>
                {rows.map((row, idx) => (
                    <TR>
                        {row.map((value) => (
                            // omit bottom border on the last row
                            <TD includeBottomBorder={rows.length - 1 !== idx}>
                                {Array.isArray(value)
                                    ? value.join(', ')
                                    : value}
                            </TD>
                        ))}
                    </TR>
                ))}
            </tbody>
        </table>
    )
}
