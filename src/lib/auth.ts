import { useEffect, useState } from 'react'

const TOKEN_EXPIRY = 30 * 60 * 1000 // 30 minutes in milliseconds
const TOKEN_REFRESH_INTERVAL = 25 * 60 * 1000 // 25 minutes in milliseconds

interface AuthState {
    accessToken: string | null
    username: string | null
    password: string | null
    expiry: number | null
}

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>(() => {
        const storedToken = localStorage.getItem('access_token')
        const storedUsername = localStorage.getItem('username')
        const storedPassword = localStorage.getItem('password')
        const storedExpiry = localStorage.getItem('token_expiry')

        return {
            accessToken: storedToken,
            username: storedUsername,
            password: storedPassword,
            expiry: storedExpiry ? parseInt(storedExpiry) : null,
        }
    })

    const isTokenExpired = () => {
        if (!authState.expiry) return true
        return Date.now() >= authState.expiry
    }

    const refreshToken = async () => {
        if (!authState.username || !authState.password) {
            logout()
            return
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: authState.username,
                    password: authState.password,
                }),
            })

            if (!response.ok) {
                throw new Error('Token refresh failed')
            }

            const result = await response.json()
            const newExpiry = Date.now() + TOKEN_EXPIRY

            setAuthState({
                ...authState,
                accessToken: result.access_token,
                expiry: newExpiry,
            })

            localStorage.setItem('access_token', result.access_token)
            localStorage.setItem('token_expiry', newExpiry.toString())
        } catch (error) {
            console.error('Failed to refresh token:', error)
            logout()
        }
    }

    const login = async (username: string, password: string) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            })

            if (!response.ok) {
                throw new Error('Login failed')
            }

            const result = await response.json()
            const expiry = Date.now() + TOKEN_EXPIRY

            setAuthState({
                accessToken: result.access_token,
                username,
                password,
                expiry,
            })

            localStorage.setItem('access_token', result.access_token)
            localStorage.setItem('username', username)
            localStorage.setItem('password', password)
            localStorage.setItem('token_expiry', expiry.toString())

            return true
        } catch (error) {
            console.error('Login failed:', error)
            return false
        }
    }

    const logout = () => {
        setAuthState({
            accessToken: null,
            username: null,
            password: null,
            expiry: null,
        })

        localStorage.removeItem('access_token')
        localStorage.removeItem('username')
        localStorage.removeItem('password')
        localStorage.removeItem('token_expiry')
    }

    // Set up token refresh interval
    useEffect(() => {
        if (!authState.accessToken || !authState.username || !authState.password) return

        const interval = setInterval(() => {
            if (isTokenExpired()) {
                refreshToken()
            }
        }, TOKEN_REFRESH_INTERVAL)

        return () => clearInterval(interval)
    }, [authState.accessToken, authState.username, authState.password])

    return {
        isAuthenticated: !!authState.accessToken && !isTokenExpired(),
        accessToken: authState.accessToken,
        login,
        logout,
    }
}
