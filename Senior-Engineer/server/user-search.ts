// Public user search - returns only non-sensitive information
export function getPublicUserInfo(user: any) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    organization: user.organization,
    profilePicture: user.profilePicture,
    role: user.role,
    createdAt: user.createdAt,
  };
}
