const INDIA_OFFSET_MS = 5.5 * 60 * 60 * 1000

function shiftToIndia(date: Date) {
    return new Date(date.getTime() + INDIA_OFFSET_MS)
}

export function getIndiaDateKey(input: Date | string = new Date()) {
    const date = typeof input === "string" ? new Date(input) : input
    const shifted = shiftToIndia(date)
    const year = shifted.getUTCFullYear()
    const month = String(shifted.getUTCMonth() + 1).padStart(2, "0")
    const day = String(shifted.getUTCDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
}

export function getIndiaDayBounds(input: Date | string = new Date()) {
    const date = typeof input === "string" ? new Date(input) : input
    const shifted = shiftToIndia(date)
    const year = shifted.getUTCFullYear()
    const month = shifted.getUTCMonth()
    const day = shifted.getUTCDate()

    const start = new Date(Date.UTC(year, month, day) - INDIA_OFFSET_MS)
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

    return { start, end }
}
