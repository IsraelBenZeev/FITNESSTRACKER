/** The meal type that fits the current hour (preselected in the add sheet) */
export function suggestedMeal(date = new Date()): string {
  const h = date.getHours()
  if (h >= 5 && h < 11) return 'ארוחת בוקר'
  if (h >= 11 && h < 16) return 'ארוחת צהריים'
  if (h >= 18 && h < 22) return 'ארוחת ערב'
  return 'חטיף'
}
