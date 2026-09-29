import { useState, type FormEvent } from 'react'
import { getSettings, getStateInstance, GreenApiError, queueReady } from '../api/greenApi'
import type { Credentials } from '../model/types'
import styles from './LoginScreen.module.css'

type Props = {
  onSuccess: (credentials: Credentials, stateInstance: string, queueReady: boolean) => void
}

function validUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function LoginScreen({ onSuccess }: Props) {
  const [apiUrl, setApiUrl] = useState('https://api.green-api.com')
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const credentials = {
      apiUrl: apiUrl.trim(),
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    }
    if (!credentials.apiUrl) {
      setError('Укажите адрес API')
      return
    }
    if (!credentials.idInstance || !credentials.apiTokenInstance) {
      setError('Укажите адрес API, idInstance и токен')
      return
    }
    if (!validUrl(credentials.apiUrl)) {
      setError('Адрес API должен быть полным http(s) URL')
      return
    }
    setPending(true)
    setError('')
    try {
      const stateInstance = await getStateInstance(credentials)
      let ready = false
      try {
        ready = queueReady(await getSettings(credentials))
      } catch {
        ready = false
      }
      onSuccess(credentials, stateInstance, ready)
    } catch (caught) {
      const message = caught instanceof GreenApiError && caught.status
        ? `Ошибка API: ${caught.status}`
        : 'Не удалось выполнить запрос. Проверьте сеть или что браузер не блокирует обращение к API.'
      setError(message)
      setPending(false)
    }
  }

  return (
    <main className={styles.screen}>
      <form className={styles.card} onSubmit={onSubmit}>
        <h1>Вход в GREEN-API</h1>
        <label className={styles.label}>
          apiUrl
          <input className={styles.input} aria-label="apiUrl" value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} />
        </label>
        <label className={styles.label}>
          idInstance
          <input className={styles.input} aria-label="idInstance" value={idInstance} onChange={(event) => setIdInstance(event.target.value)} />
        </label>
        <label className={styles.label}>
          apiTokenInstance
          <input className={styles.input} aria-label="apiTokenInstance" type="password" value={apiTokenInstance} onChange={(event) => setApiTokenInstance(event.target.value)} />
        </label>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <button className={styles.button} type="submit" disabled={pending}>Войти</button>
      </form>
    </main>
  )
}
