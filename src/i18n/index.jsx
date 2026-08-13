import { useCallback, useEffect, useMemo, useState } from 'react'
import { id } from './id.js'
import { en } from './en.js'
import { LanguageContext } from './context.js'

const dicts = { id, en }
const STORAGE_KEY = 'wismaku.lang'

function resolve(obj, key) {
  return key.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), obj)
}

function readStoredLang() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'id'
  } catch {
    return 'id'
  }
}

function writeStoredLang(lang) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    return
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readStoredLang)

  useEffect(() => {
    writeStoredLang(lang)
  }, [lang])

  const t = useCallback(
    (key, vars) => {
      let text = resolve(dicts[lang], key)
      if (text == null) text = resolve(dicts.id, key)
      if (text == null) return key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replaceAll(`{{${k}}}`, String(v))
        }
      }
      return text
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
