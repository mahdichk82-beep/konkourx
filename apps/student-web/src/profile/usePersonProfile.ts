import { useCallback, useEffect, useState } from 'react'
import { authClient, type PersonProfile, type PersonProfileInput } from '../auth/auth-client.ts'

const loadErrorMessage = 'اطلاعات شخصی دریافت نشد. اتصال خود را بررسی و دوباره تلاش کنید.'

export function usePersonProfile() {
  const [profile, setProfile] = useState<PersonProfile | null>()
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setProfile(await authClient.getPersonProfile())
    } catch {
      setError(loadErrorMessage)
    }
  }, [])

  useEffect(() => {
    let active = true
    void authClient.getPersonProfile()
      .then((value) => { if (active) setProfile(value) })
      .catch(() => { if (active) setError(loadErrorMessage) })
    return () => { active = false }
  }, [])

  const save = useCallback(async (input: PersonProfileInput) => {
    const updated = await authClient.updatePersonProfile(input)
    setProfile(updated)
    return updated
  }, [])

  return { error, load, profile, save }
}
