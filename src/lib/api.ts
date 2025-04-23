const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const AUTH_STORAGE_KEY = import.meta.env.VITE_AUTH_STORAGE_KEY

export interface ApiOptions extends RequestInit {
    signal?: AbortSignal
    responseType?: 'blob' | 'json' | 'text'
}

export async function apiFetch(url: string, options: ApiOptions = {}) {
    const token = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!token) {
        throw new Error('No access token found')
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    })

    if (response.status === 401) {
        // Clear auth data
        localStorage.removeItem(AUTH_STORAGE_KEY)
        localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY)

        // Redirect to login
        window.location.href = '/sign-in'
        throw new Error('Session expired. Please login again.')
    }

    if (!response.ok) {
        throw new Error('API request failed')
    }

    return response.json()
}
