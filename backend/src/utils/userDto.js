export function userDto(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    pendingEmail: user.pendingEmail || null,
    isAdmin: Boolean(user.isAdmin),
  };
}
