import { useEffect, useRef, type ReactNode } from 'react'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previouslyFocused = document.activeElement

    // Focus the first input/select, falling back to the modal container.
    // Skips the close button (first in DOM order) by looking past buttons.
    const allFocusable = getFocusableElements(modalRef.current)
    const firstInput = allFocusable.find(
      (el) => el.tagName !== 'BUTTON',
    )
    const target = firstInput ?? allFocusable[0] ?? modalRef.current
    target?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const elements = getFocusableElements(modalRef.current)

      if (elements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = elements[0]
      const lastElement = elements[elements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus()
      }
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={className ? `modal-box ${className}` : 'modal-box'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            &times;
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return []
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => !element.hasAttribute('disabled'))
}
