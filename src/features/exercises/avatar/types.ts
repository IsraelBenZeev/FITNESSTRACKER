/** BodyBuddy-Client/src/types/bodtPart.ts */
export type BodyPart =
  | 'neck'
  | 'shoulders'
  | 'chest'
  | 'upper arms'
  | 'lower arms'
  | 'waist'
  | 'upper legs'
  | 'lower legs'
  | 'glutes'
  | 'general'
  | 'cardio'
  | 'back'

export type Gender = 'male' | 'female'
export type AvatarSide = 'front' | 'back'

export interface ArtPath { d: string; fill?: string; fillRule?: string; clipRule?: string }
export interface AvatarArt { general: ArtPath[]; parts: { part: string; paths: ArtPath[] }[] }
export type AvatarSet = Record<Gender, Record<AvatarSide, AvatarArt>>

export const partsBodyHebrew: Record<BodyPart, string> = {
  neck: 'צוואר',
  chest: 'חזה',
  shoulders: 'כתפיים',
  'upper arms': 'ידיים',
  'lower arms': 'אמות',
  waist: 'בטן',
  'upper legs': 'רגל',
  'lower legs': 'שוק',
  glutes: 'ישבן',
  back: 'גב',
  general: 'כללי',
  cardio: 'אירובי',
}

/** Which avatar areas a target muscle lights up (bodtPart.ts targetMuscleToBodyParts) */
export const targetMuscleToBodyParts: Record<string, BodyPart[]> = {
  abductors: ['upper legs'], abs: ['waist'], adductors: ['upper legs'], biceps: ['upper arms'], calves: ['lower legs'],
  'cardiovascular system': [], chest: ['chest'], delts: ['shoulders'], forearms: ['lower arms'], 'front delts': ['shoulders'],
  glutes: ['glutes'], hamstrings: ['upper legs'], lats: ['back'], 'levator scapulae': ['neck'], 'neck extensors': ['neck'],
  'neck flexors': ['neck'], pectorals: ['chest'], quads: ['upper legs'], quadriceps: ['upper legs'], 'rear delts': ['shoulders'],
  'serratus anterior': ['chest'], shoulders: ['shoulders'], 'side delts': ['shoulders'], spine: ['back'], traps: ['back'],
  triceps: ['upper arms'], 'upper back': ['back'], cardio: ['cardio'],
}

export const BACK_BODY_MUSCLES = new Set([
  'glutes', 'hamstrings', 'lats', 'upper back', 'traps', 'spine', 'levator scapulae', 'rear delts', 'neck extensors', 'triceps', 'calves',
])

export const FRONT_BODY_MUSCLES = new Set([
  'abs', 'pectorals', 'serratus anterior', 'quads', 'quadriceps', 'biceps', 'chest', 'front delts', 'side delts', 'neck flexors',
])
