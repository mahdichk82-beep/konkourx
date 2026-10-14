import assert from 'node:assert/strict'
import test from 'node:test'
import { createModalFocusLifecycle } from './modal-focus.ts'

type KeydownListener = (event: KeyboardEvent) => void

const createFixture = () => {
  let keydownListener: KeydownListener | undefined
  const focusableElements: FakeElement[] = []
  const dialogs: FakeElement[] = []

  const document = {
    activeElement: null as FakeElement | null,
    body: { style: { overflow: 'clip' } },
    addEventListener(type: string, listener: KeydownListener) {
      if (type === 'keydown') keydownListener = listener
    },
    removeEventListener(type: string, listener: KeydownListener) {
      if (type === 'keydown' && keydownListener === listener) keydownListener = undefined
    },
    querySelectorAll() {
      return dialogs
    },
  }

  class FakeElement {
    ariaHidden: string | null = null
    private readonly children: FakeElement[]
    hidden = false
    isConnected = true

    constructor(children: FakeElement[] = []) {
      this.children = children
    }

    contains(element: FakeElement | null): boolean {
      return element === this || this.children.some((child) => child.contains(element))
    }

    focus() {
      document.activeElement = this
    }

    getAttribute(name: string) {
      return name === 'aria-hidden' ? this.ariaHidden : null
    }

    querySelectorAll() {
      return this.children
    }
  }

  const dispatchKey = (key: string, shiftKey = false) => {
    let prevented = false
    let stopped = false
    keydownListener?.({
      key,
      preventDefault: () => { prevented = true },
      shiftKey,
      stopPropagation: () => { stopped = true },
    } as KeyboardEvent)
    return { prevented, stopped }
  }

  return {
    dialogs,
    dispatchKey,
    document,
    focusableElements,
    hasKeydownListener: () => Boolean(keydownListener),
    makeElement: (children: FakeElement[] = []) => new FakeElement(children),
  }
}

test('contains keyboard focus, locks scrolling, and restores lifecycle state exactly', () => {
  const fixture = createFixture()
  const trigger = fixture.makeElement()
  const first = fixture.makeElement()
  const last = fixture.makeElement()
  const dialog = fixture.makeElement([first, last])
  fixture.document.activeElement = trigger
  fixture.dialogs.push(dialog)

  const cleanup = createModalFocusLifecycle({
    dialog: dialog as unknown as HTMLElement,
    document: fixture.document as unknown as Document,
    initialFocus: first as unknown as HTMLElement,
    onEscape: () => {},
  })

  assert.equal(fixture.document.body.style.overflow, 'hidden')
  assert.equal(fixture.document.activeElement, first)

  fixture.document.activeElement = last
  assert.equal(fixture.dispatchKey('Tab').prevented, true)
  assert.equal(fixture.document.activeElement, first)

  fixture.document.activeElement = first
  assert.equal(fixture.dispatchKey('Tab', true).prevented, true)
  assert.equal(fixture.document.activeElement, last)

  cleanup()
  cleanup()
  assert.equal(fixture.document.body.style.overflow, 'clip')
  assert.equal(fixture.document.activeElement, trigger)
  assert.equal(fixture.hasKeydownListener(), false)
})

test('returns escaped focus to the dialog in the requested tab direction', () => {
  const fixture = createFixture()
  const outside = fixture.makeElement()
  const first = fixture.makeElement()
  const last = fixture.makeElement()
  const dialog = fixture.makeElement([first, last])
  fixture.dialogs.push(dialog)
  const cleanup = createModalFocusLifecycle({
    dialog: dialog as unknown as HTMLElement,
    document: fixture.document as unknown as Document,
    initialFocus: first as unknown as HTMLElement,
    onEscape: () => {},
  })

  fixture.document.activeElement = outside
  fixture.dispatchKey('Tab')
  assert.equal(fixture.document.activeElement, first)

  fixture.document.activeElement = outside
  fixture.dispatchKey('Tab', true)
  assert.equal(fixture.document.activeElement, last)
  cleanup()
})

test('Escape closes only the topmost active dialog, including a portal dialog', () => {
  const fixture = createFixture()
  const close = fixture.makeElement()
  const composer = fixture.makeElement([close])
  const portalDialog = fixture.makeElement()
  fixture.dialogs.push(composer, portalDialog)
  let closeCount = 0
  const cleanup = createModalFocusLifecycle({
    dialog: composer as unknown as HTMLElement,
    document: fixture.document as unknown as Document,
    initialFocus: close as unknown as HTMLElement,
    onEscape: () => { closeCount += 1 },
  })

  const nestedEscape = fixture.dispatchKey('Escape')
  assert.equal(closeCount, 0)
  assert.equal(nestedEscape.prevented, false)

  fixture.dialogs.pop()
  const composerEscape = fixture.dispatchKey('Escape')
  assert.equal(closeCount, 1)
  assert.deepEqual(composerEscape, { prevented: true, stopped: true })
  cleanup()
})

test('cleanup does not focus a trigger that has been removed', () => {
  const fixture = createFixture()
  const trigger = fixture.makeElement()
  const close = fixture.makeElement()
  const dialog = fixture.makeElement([close])
  fixture.document.activeElement = trigger
  fixture.dialogs.push(dialog)
  const cleanup = createModalFocusLifecycle({
    dialog: dialog as unknown as HTMLElement,
    document: fixture.document as unknown as Document,
    initialFocus: close as unknown as HTMLElement,
    onEscape: () => {},
  })

  trigger.isConnected = false
  cleanup()
  assert.equal(fixture.document.activeElement, close)
})

test('Escape remains disabled while the composer cannot close', () => {
  const fixture = createFixture()
  const close = fixture.makeElement()
  const dialog = fixture.makeElement([close])
  fixture.dialogs.push(dialog)
  let closeCount = 0
  const cleanup = createModalFocusLifecycle({
    canEscape: () => false,
    dialog: dialog as unknown as HTMLElement,
    document: fixture.document as unknown as Document,
    initialFocus: close as unknown as HTMLElement,
    onEscape: () => { closeCount += 1 },
  })

  const escape = fixture.dispatchKey('Escape')
  assert.equal(closeCount, 0)
  assert.deepEqual(escape, { prevented: false, stopped: false })
  cleanup()
})
