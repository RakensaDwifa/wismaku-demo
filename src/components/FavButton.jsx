import { useEffect, useState } from 'react'
import { isFavorite, toggleFavorite } from '../services/favorite.js'
import { getActiveUser } from '../services/member.js'
import { useLanguage } from '../i18n/useLanguage.js'

export default function FavButton({ hotelId, className = '' }) {
  const { t } = useLanguage()
  const [active, setActive] = useState(false)
  const [busy, setBusy] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    let live = true
    const syncUser = () => {
      if (live) setUser(getActiveUser())
    }
    syncUser()
    window.addEventListener('wismaku:session-changed', syncUser)
    return () => {
      live = false
      window.removeEventListener('wismaku:session-changed', syncUser)
    }
  }, [])

  useEffect(() => {
    let live = true
    isFavorite(hotelId, user)
      .then((v) => {
        if (live) setActive(Boolean(v))
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [hotelId, user])

  const onToggle = async () => {
    if (busy) return
    setBusy(true)
    try {
      const result = await toggleFavorite(hotelId, user)
      setActive(result.active)
    } catch {
      /* abaikan error */
    }
    setBusy(false)
  }

  return (
    <button
      className={`grid size-9 place-items-center rounded-full bg-white/92 text-gray-500 shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-[color,transform] duration-150 hover:scale-[1.06] hover:text-rd aria-pressed:text-rd ${className}`}
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? t('favorites.remove') : t('favorites.add')}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        {active ? (
          <path
            fill="currentColor"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        ) : (
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        )}
      </svg>
    </button>
  )
}
