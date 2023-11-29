// Response from Outerbase API
export type Queryd = {
    name: string
    query: string
    count: number
    items: Rows
}

// an Array of Objects where each Object is a Row from a Database
export type Rows = Array<Record<string, string>>
