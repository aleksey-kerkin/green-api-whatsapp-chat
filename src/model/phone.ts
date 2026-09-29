export type PhoneOk = { ok: true; phone: string; chatId: string; title: string }
export type PhoneFail = { ok: false; error: string }

export function parsePhone(input: string): PhoneOk | PhoneFail {
  let digits = input.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`
  }
  if (digits.length < 10 || digits.length > 15) {
    return { ok: false, error: 'Введите номер с кодом страны: от 10 до 15 цифр' }
  }
  return {
    ok: true,
    phone: digits,
    chatId: `${digits}@c.us`,
    title: `+${digits}`,
  }
}
