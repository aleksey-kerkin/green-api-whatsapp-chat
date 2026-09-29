import { useState, type FormEvent } from 'react'
import { parsePhone, type PhoneOk } from '../model/phone'
import styles from './NewChatDialog.module.css'

type Props = {
  onClose: () => void
  onCreate: (phone: PhoneOk) => void
}

export function NewChatDialog({ onClose, onCreate }: Props) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = parsePhone(phone)
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }
    onCreate(parsed)
  }

  return (
    <div className={styles.overlay}>
      <form className={styles.dialog} onSubmit={onSubmit}>
        <h2>Новый чат</h2>
        <label className={styles.label}>
          Номер телефона
          <input
            className={styles.input}
            aria-label="Номер телефона"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value)
              setError('')
            }}
          />
        </label>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <div className={styles.actions}>
          <button type="button" onClick={onClose}>Отмена</button>
          <button type="submit">Создать чат</button>
        </div>
      </form>
    </div>
  )
}
