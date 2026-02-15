/**
 * API client with streaming support and real-time updates
 * PRODUCTION IMPLEMENTATION with Server-Sent Events
 */

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface VoiceProcessResponse {
  success: boolean
  transcribed_text?: string
  intent?: string
  response: string
  audio_url?: string
  processing_time: number
  confidence?: number
  safety_status?: string
  processing_steps?: any[]
  node_timings?: Record<string, number>
  error?: string
}

interface StreamEvent {
  type: 'start' | 'node_start' | 'node_complete' | 'complete' | 'error'
  node?: string
  progress?: number
  result?: VoiceProcessResponse
  error?: string
  timestamp: string
}

interface SystemStats {
  uptime: string
  total_requests: number
  active_connections: number
  recent_events: any[]
  ai_pipeline_stats: any
  event_counters?: Record<string, number>
  performance_metrics?: Record<string, any>
}

class ApiClient {
  private baseUrl: string
  private wsUrl: string
  
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    this.wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
  }

  private async fetchWithRetry(
    url: string, 
    options: RequestInit = {}, 
    retries: number = 3
  ): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        })
        
        if (response.ok) {
          return response
        }
        
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`Client error: ${response.status} ${response.statusText}`)
        }
        
        // Retry on server errors (5xx) or network issues
        if (i === retries - 1) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`)
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
        
      } catch (error) {
        if (i === retries - 1) {
          throw error
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
      }
    }
    
    throw new Error('Max retries exceeded')
  }

  // STREAMING IMPLEMENTATION
  async streamTextProcessing(
    text: string, 
    userId: string = 'anonymous',
    onEvent: (event: StreamEvent) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stream/stream-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          user_id: userId,
          language: 'hi'
        })
      })

      if (!response.ok) {
        throw new Error(`Streaming failed: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader')
      }

      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6))
              onEvent(eventData as StreamEvent)
            } catch (e) {
              console.warn('Failed to parse SSE data:', line)
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)
      onEvent({
        type: 'error',
        error: error instanceof Error ? error.message : 'Streaming failed',
        timestamp: new Date().toISOString()
      })
    }
  }

  async streamDemo(onEvent: (event: StreamEvent) => void): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stream/stream-demo`)
      
      if (!response.ok) {
        throw new Error(`Demo streaming failed: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader')
      }

      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6))
              onEvent(eventData as StreamEvent)
            } catch (e) {
              console.warn('Failed to parse demo SSE data:', line)
            }
          }
        }
      }
    } catch (error) {
      console.error('Demo streaming error:', error)
      onEvent({
        type: 'error',
        error: error instanceof Error ? error.message : 'Demo streaming failed',
        timestamp: new Date().toISOString()
      })
    }
  }

  async processText(text: string, userId: string = 'anonymous', language: string = 'hi'): Promise<VoiceProcessResponse> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/voice/process-text`, {
        method: 'POST',
        body: JSON.stringify({
          text: text.trim(),
          user_id: userId,
          language: language
        })
      })
      
      return await response.json()
    } catch (error) {
      console.error('Text processing error:', error)
      return {
        success: false,
        response: '',
        processing_time: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async processAudio(audioFile: File, userId: string = 'anonymous'): Promise<VoiceProcessResponse> {
    try {
      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('user_id', userId)
      
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/voice/process-audio`, {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData
      })
      
      return await response.json()
    } catch (error) {
      console.error('Audio processing error:', error)
      return {
        success: false,
        response: '',
        processing_time: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async getSystemStats(): Promise<SystemStats | null> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/admin/stats`)
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch system stats:', error)
      return null
    }
  }

  async getPipelineStatus(): Promise<any> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/admin/pipeline-status`)
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch pipeline status:', error)
      return null
    }
  }

  async triggerTestEvent(): Promise<boolean> {
    try {
      await this.fetchWithRetry(`${this.baseUrl}/api/admin/trigger-test-event`, {
        method: 'POST'
      })
      return true
    } catch (error) {
      console.error('Failed to trigger test event:', error)
      return false
    }
  }

  createWebSocket(path: string = '/ws/telemetry'): WebSocket {
    return new WebSocket(`${this.wsUrl}${path}`)
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      return response.ok
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export type { VoiceProcessResponse, SystemStats }