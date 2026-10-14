const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

type ModalFocusLifecycleOptions = {
  canEscape?(): boolean
  dialog: HTMLElement
  document: Document
  initialFocus: HTMLElement
  onEscape(): void
}

const isActiveDialog = (dialog: HTMLElement) => (
  dialog.isConnected
  && !dialog.hidden
  && dialog.getAttribute('aria-hidden') !== 'true'
)

const topmostDialog = (document: Document): HTMLElement | null => {
  const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]'))
    .filter(isActiveDialog)
  return dialogs.at(-1) ?? null
}

const focusableElements = (dialog: HTMLElement): HTMLElement[] => (
  Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
    .filter((element) => element.isConnected && element.getAttribute('aria-hidden') !== 'true')
)

const canReceiveFocus = (element: Element | null): element is HTMLElement => (
  Boolean(element && element.isConnected && 'focus' in element && typeof element.focus === 'function')
)

export const createModalFocusLifecycle = ({
  canEscape = () => true,
  dialog,
  document,
  initialFocus,
  onEscape,
}: ModalFocusLifecycleOptions): (() => void) => {
  const previousOverflow = document.body.style.overflow
  const previousFocus = document.activeElement
  let cleanedUp = false

  const handleKeydown = (event: KeyboardEvent) => {
    if (topmostDialog(document) !== dialog) return

    if (event.key === 'Escape') {
      if (!canEscape()) return
      event.preventDefault()
      event.stopPropagation()
      onEscape()
      return
    }

    if (event.key !== 'Tab') return

    const focusable = focusableElements(dialog)
    if (focusable.length === 0) {
      event.preventDefault()
      dialog.focus()
      return
    }

    const first = focusable[0]!
    const last = focusable.at(-1)!
    const active = document.activeElement
    if (!dialog.contains(active) || (event.shiftKey && active === first) || (!event.shiftKey && active === last)) {
      event.preventDefault()
      ;(event.shiftKey ? last : first).focus()
    }
  }

  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', handleKeydown)
  initialFocus.focus()

  return () => {
    if (cleanedUp) return
    cleanedUp = true
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = previousOverflow
    if (canReceiveFocus(previousFocus)) previousFocus.focus()
  }
}
