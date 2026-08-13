import { useEffect, useRef } from 'react'
import useFocusTrap from '../../hooks/useFocusTrap.js'

export default function Modal({ onClose, labelledBy, variant = 'modal', children }) {
  const panelRef = useRef(null)

  useFocusTrap(panelRef)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  if (variant === 'sheet') {
    return (
      <div className="fixed inset-0 z-[200] flex items-end bg-black/55" onClick={onClose}>
        <div
          className="animate-sheet-in relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-rd-lg outline-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          tabIndex={-1}
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute right-2.5 top-2.5 z-10 grid size-[34px] place-items-center rounded-full bg-white/90 text-[22px] leading-none text-rd-text shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-colors hover:text-rd"
            type="button"
            onClick={onClose}
            aria-label="Tutup"
          >
            &times;
          </button>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/55 p-5" onClick={onClose}>
      <div
        className="animate-modal-in relative max-h-[calc(100vh-40px)] w-[min(560px,100%)] overflow-y-auto rounded-2xl bg-white shadow-rd-lg outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-2.5 top-2.5 z-10 grid size-[34px] place-items-center rounded-full bg-white/90 text-[22px] leading-none text-rd-text shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-colors hover:text-rd"
          type="button"
          onClick={onClose}
          aria-label="Tutup"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  )
}
