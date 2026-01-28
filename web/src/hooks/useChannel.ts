import { useEffect, useRef, useState } from 'react'
import { Socket, Channel } from 'phoenix'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/socket'

let socket: Socket | null = null

function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem('auth_token')
    socket = new Socket(WS_URL, {
      params: { token },
    })
    socket.connect()
  }
  return socket
}

export function useChannel(
  topic: string,
  onMessage?: (event: string, payload: any) => void
): Channel | null {
  const [channel, setChannel] = useState<Channel | null>(null)
  const channelRef = useRef<Channel | null>(null)

  useEffect(() => {
    if (!topic) return

    const sock = getSocket()
    const ch = sock.channel(topic, {})

    ch.join()
      .receive('ok', () => {
        console.log(`Joined ${topic} successfully`)
        channelRef.current = ch
        setChannel(ch)
      })
      .receive('error', (resp) => {
        console.error(`Unable to join ${topic}`, resp)
      })

    if (onMessage) {
      ch.onMessage = (event, payload) => {
        onMessage(event, payload)
        return payload
      }
    }

    return () => {
      ch.leave()
      channelRef.current = null
      setChannel(null)
    }
  }, [topic])

  return channel
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
