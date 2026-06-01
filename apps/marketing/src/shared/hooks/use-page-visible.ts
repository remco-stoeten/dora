'use client'

import { useEffect, useState } from 'react'

function getPageVisible() {
    return document.visibilityState === 'visible' && document.hasFocus()
}

export function usePageVisible() {
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        const update = () => setVisible(getPageVisible())

        update()
        document.addEventListener('visibilitychange', update)
        window.addEventListener('focus', update)
        window.addEventListener('blur', update)

        return () => {
            document.removeEventListener('visibilitychange', update)
            window.removeEventListener('focus', update)
            window.removeEventListener('blur', update)
        }
    }, [])

    return visible
}
