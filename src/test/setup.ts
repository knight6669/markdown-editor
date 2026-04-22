import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'
import { resetImageAssetRuntimeStateForTests } from '../lib/image-assets'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
})

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
})

Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
  writable: true,
  value: () => {},
})

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  writable: true,
  value: () => {},
})

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  writable: true,
  value() {
    return {
      x: 0,
      y: 0,
      width: 1200,
      height: 800,
      top: 0,
      left: 0,
      right: 1200,
      bottom: 800,
      toJSON() {
        return null
      },
    }
  },
})

Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
  writable: true,
  value() {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      toJSON() {
        return null
      },
    }
  },
})

Object.defineProperty(Range.prototype, 'getClientRects', {
  writable: true,
  value() {
    return {
      length: 0,
      item() {
        return null
      },
      [Symbol.iterator]: function* iterator() {
        yield* []
      },
    }
  },
})

beforeEach(() => {
  resetImageAssetRuntimeStateForTests()
  window.localStorage.clear()
})
