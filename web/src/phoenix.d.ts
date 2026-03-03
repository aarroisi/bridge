declare module "phoenix" {
  export class Socket {
    constructor(endPoint: string, opts?: Record<string, unknown>)
    connect(): void
    disconnect(): void
    channel(topic: string, chanParams?: Record<string, unknown>): Channel
  }

  export class Channel {
    join(): Push
    leave(): Push
    push(event: string, payload?: Record<string, unknown>): Push
    on(event: string, callback: (payload: Record<string, unknown>) => void): number
    off(event: string, ref?: number): void
    onMessage: (event: string, payload: unknown) => unknown
  }

  export class Push {
    receive(status: string, callback: (response: unknown) => void): Push
  }
}
