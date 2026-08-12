import { useEffect, useRef } from 'react'
import useFocusTrap from '../../hooks/useFocusTrap.js'

export default function Modal({ onClose, labelledBy, children }) {
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="hotel-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="Tutup">
          &times;
        </button>
        {children}
      </div>
    </div>
  )
}
