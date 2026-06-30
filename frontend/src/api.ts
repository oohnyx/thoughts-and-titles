import type { Item } from "./types"

// this is the base URL of our Flask backend
// every API call will start with this

const BASE_URL = "http://127.0.0.1:5000"

type ApiItem = Omit<Item, "description" | "review"> & {
    description: string | null
    review: string | null
}

function normalizeItem(item: ApiItem): Item {
    return {
        ...item,
        description: item.description ?? "",
        review: item.review ?? "",
    }
}

// GET ALL ITEMS

export async function fetchItems() {
    const response = await fetch(`${BASE_URL}/items`)
    // fetch() sends an HTTP request and returns a "promise"
    // "await" pauses here until the response comes back — like waiting for a reply text

    if (!response.ok) throw new Error("Failed to fetch items")
    // response.ok is true if the status code is 200-299 (success)
    // if something went wrong, throw an error to stop execution

    const data: ApiItem[] = await response.json()
    return data.map(normalizeItem)
    // .json() reads the response body and converts it from JSON text into a JS object
}

// GET ONE ITEM BY ID

export async function fetchItem(id: number) {
    const response = await fetch(`${BASE_URL}/items/${id}`)
    if (!response.ok) throw new Error("Item not found!")
    const data: ApiItem = await response.json()
    return normalizeItem(data)
}

// POST A NEW ITEM

export async function createItem(data:{
    title: string
    type: Item["type"]
    description: string
}) {
    const response = await fetch (`${BASE_URL}/items`, {
        method: "POST",                             // tell Flask this is a POST request
        headers: {
            "Content-Type": "application/json"      // tell Flask you are sending JSON
        },
        body: JSON.stringify(data),
    })

    if (!response.ok) throw new Error("Failed to create new item.")
    const created: ApiItem = await response.json()
    return normalizeItem(created)
}

// PUT (update) AN ITEM

export async function updateItem(id: number, data: {
    status?: Item["status"]     // the ? means this field is optional
    rating?: number | null
    description?: string
    review?: string
}) {
    const response = await fetch (`${BASE_URL}/items/${id}`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json" 
        },
        body: JSON.stringify(data),
    })

    if (!response.ok) throw new Error("Failed to update item")
    const updated: ApiItem = await response.json()
    return normalizeItem(updated)
}

// DELETE AN ITEM

export async function deleteItem(id: number) {
    const response = await fetch (`${BASE_URL}/items/${id}`, {
        method: "DELETE",
    })

    if (!response.ok) throw new Error("Failed to delete item")
    return response.json()
}
