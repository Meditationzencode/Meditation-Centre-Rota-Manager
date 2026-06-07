// Barrel for all Server Actions, grouped by domain in sibling modules.
// Keeps the stable public import path `@/lib/actions` so components don't
// need to know which file an action lives in.
export { login, logout, sendMagicLink, requestPasswordReset, resetPassword } from './auth'
export { updateProfile } from './profile'
export { addUnavailability, removeUnavailability } from './availability'
export { signUpForSlot, cancelSignup } from './signups'
export { requestSwap, reviewSwap } from './swaps'
export { createSlot, updateSlot, deleteSlot, adminAssignVolunteer, adminRemoveVolunteer } from './slots'
export { createMember, updateMember, toggleMemberActive, deleteMember } from './members'
export { createTemplate, updateTemplate, deleteTemplate, generateSlots } from './templates'
