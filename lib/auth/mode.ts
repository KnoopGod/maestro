export function isMultiUserMode() {
  return (
    process.env.MULTI_USER_MODE === 'true' ||
    process.env.NEXT_PUBLIC_MULTI_USER_MODE === 'true'
  )
}
