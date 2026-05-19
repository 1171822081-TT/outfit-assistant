import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNetworkStatus } from './useNetworkStatus'

describe('useNetworkStatus', () => {
  let listeners: Record<string, EventListenerOrEventListenerObject>

  beforeEach(() => {
    listeners = {}
    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      listeners[event] = handler as EventListenerOrEventListenerObject
    })
    vi.spyOn(window, 'removeEventListener').mockImplementation((event) => {
      delete listeners[event]
    })
  })

  it('returns initial online state from navigator.onLine', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current.isOnline).toBe(true)
    expect(result.current.wasOffline).toBe(false)
  })

  it('returns initial offline state', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current.isOnline).toBe(false)
    expect(result.current.wasOffline).toBe(false)
  })

  it('detects transition from offline to online and sets wasOffline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current.isOnline).toBe(false)

    act(() => {
      const handler = listeners['online'] as EventListener
      handler({} as Event)
    })

    expect(result.current.isOnline).toBe(true)
    expect(result.current.wasOffline).toBe(true)
  })

  it('detects transition from online to offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current.isOnline).toBe(true)

    act(() => {
      const handler = listeners['offline'] as EventListener
      handler({} as Event)
    })

    expect(result.current.isOnline).toBe(false)
  })

  it('clearWasOffline resets wasOffline flag', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      const handler = listeners['online'] as EventListener
      handler({} as Event)
    })

    expect(result.current.wasOffline).toBe(true)

    act(() => {
      result.current.clearWasOffline()
    })

    expect(result.current.wasOffline).toBe(false)
  })
})
