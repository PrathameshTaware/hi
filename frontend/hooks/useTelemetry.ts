/**
 * React Hook for WebSocket Telemetry
 * Connects to backend telemetry feed and manages events
 */

import { useEffect, useState, useCallback, useRef } from 'react'

export interface TelemetryEvent {
    type: string
    payload: any
    timestamp: string
}

export interface UseTelemetryOptions {
    autoConnect?: boolean
    reconnectInterval?: number
    maxReconnectAttempts?: number
}

export function useTelemetry(options: UseTelemetryOptions = {}) {
    const {
        autoConnect = true,
        reconnectInterval = 3000,
        maxReconnectAttempts = 5
    } = options

    const [events, setEvents] = useState<TelemetryEvent[]>([])
    const [connected, setConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const wsRef = useRef<WebSocket | null>(null)
    const reconnectAttemptsRef = useRef(0)
    const reconnectTimeoutRef = useRef<number>()

    const connect = useCallback(() => {
        try {
            // Next.js injects NEXT_PUBLIC_ env vars at build time
            const wsUrl = typeof window !== 'undefined'
                ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
                : 'ws://localhost:8000'
            const ws = new WebSocket(`${wsUrl}/ws/telemetry`)

            ws.onopen = () => {
                console.log('✅ Telemetry WebSocket connected')
                setConnected(true)
                setError(null)
                reconnectAttemptsRef.current = 0
            }

            ws.onclose = () => {
                console.log('❌ Telemetry WebSocket disconnected')
                setConnected(false)
                wsRef.current = null

                // Attempt reconnection
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current++
                    console.log(`🔄 Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`)

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect()
                    }, reconnectInterval)
                } else {
                    setError('Max reconnection attempts reached')
                }
            }

            ws.onerror = (event) => {
                console.error('WebSocket error:', event)
                setError('WebSocket connection error')
            }

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data) as TelemetryEvent

                    // Ignore heartbeat messages
                    if (data.type === 'heartbeat') return

                    setEvents(prev => {
                        // Keep only last 100 events to prevent memory issues
                        const newEvents = [...prev, data]
                        return newEvents.slice(-100)
                    })
                } catch (err) {
                    console.error('Failed to parse telemetry event:', err)
                }
            }

            wsRef.current = ws
        } catch (err) {
            console.error('Failed to create WebSocket:', err)
            setError('Failed to connect to telemetry service')
        }
    }, [reconnectInterval, maxReconnectAttempts])

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
        }

        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }

        setConnected(false)
    }, [])

    const clearEvents = useCallback(() => {
        setEvents([])
    }, [])

    useEffect(() => {
        if (autoConnect) {
            connect()
        }

        return () => {
            disconnect()
        }
    }, [autoConnect, connect, disconnect])

    return {
        events,
        connected,
        error,
        connect,
        disconnect,
        clearEvents
    }
}
