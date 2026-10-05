export type PersonNameFields = {
  firstName: string | null
  lastName: string | null
  preferredName: string | null
}

const usableName = (value: string | null | undefined): string | null => {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

export const derivePersonDisplayName = (
  profile: PersonNameFields | null,
): string | null => {
  if (!profile) return null

  const preferredName = usableName(profile.preferredName)
  if (preferredName) return preferredName

  const firstName = usableName(profile.firstName)
  const lastName = usableName(profile.lastName)
  if (firstName && lastName) return `${firstName} ${lastName}`

  return firstName ?? lastName
}
