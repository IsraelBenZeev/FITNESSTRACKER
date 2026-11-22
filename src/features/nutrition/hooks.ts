import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useBodyBuddyAuth } from '../../lib/BodyBuddyAuthContext'
import { useToast } from '../../shared/context/ToastContext'
import * as api from './api'
import { groupEntries, sumMacros } from './foodMath'
import type { CartItem, Food } from './types'
import { useGoals } from '../../lib/useGoals'
import { todayLocal } from '../../lib/date'

/** All BodyBuddy queries live under ['bb', ...] so a sign-in/out refreshes them together */
export const bbKeys = {
  all: ['bb'] as const,
  entries: (uid: string | undefined, from: string | null, to: string | null) => ['bb', 'entries', uid, from, to] as const,
  dates: (uid: string | undefined) => ['bb', 'entry-dates', uid] as const,
  myFoods: (uid: string | undefined) => ['bb', 'my-foods', uid] as const,
  recent: (uid: string | undefined) => ['bb', 'recent-foods', uid] as const,
  meals: (uid: string | undefined) => ['bb', 'saved-meals', uid] as const,
  catalog: (uid: string | undefined) => ['bb', 'catalog', uid] as const,
}

export function useBbUserId() {
  const { bbUser } = useBodyBuddyAuth()
  return bbUser?.id
}

/** Entries in a date range (inclusive), grouped into meals */
export function useMealGroups(from: string | null, to: string | null, enabled = true) {
  const uid = useBbUserId()
  const q = useQuery({
    queryKey: bbKeys.entries(uid, from, to),
    enabled: !!uid && enabled,
    queryFn: () => api.fetchEntries(uid!, from, to),
  })
  const groups = useMemo(() => groupEntries(q.data ?? []), [q.data])
  return { groups, entries: q.data ?? [], loading: q.isLoading, error: q.error ? (q.error as Error).message : null }
}

export function useEntryDates() {
  const uid = useBbUserId()
  return useQuery({ queryKey: bbKeys.dates(uid), enabled: !!uid, staleTime: 5 * 60 * 1000, queryFn: () => api.fetchEntryDates(uid!) })
}

export function useCatalog(enabled: boolean) {
  const uid = useBbUserId()
  return useQuery({ queryKey: bbKeys.catalog(uid), enabled: !!uid && enabled, staleTime: 30 * 60 * 1000, queryFn: api.fetchCatalog })
}

export function useMyFoods(enabled: boolean) {
  const uid = useBbUserId()
  return useQuery({ queryKey: bbKeys.myFoods(uid), enabled: !!uid && enabled, staleTime: 5 * 60 * 1000, queryFn: () => api.fetchMyFoods(uid!) })
}

export function useRecentFoods(enabled: boolean) {
  const uid = useBbUserId()
  return useQuery({ queryKey: bbKeys.recent(uid), enabled: !!uid && enabled, staleTime: 60 * 1000, queryFn: () => api.fetchRecentFoods(uid!) })
}

export function useSavedMeals(enabled: boolean) {
  const uid = useBbUserId()
  return useQuery({ queryKey: bbKeys.meals(uid), enabled: !!uid && enabled, staleTime: 5 * 60 * 1000, queryFn: () => api.fetchSavedMeals(uid!) })
}

function useBbMutation<T>(fn: (uid: string, arg: T) => Promise<unknown>, messages: { ok?: string; fail: string }) {
  const uid = useBbUserId()
  const qc = useQueryClient()
  const { showSuccess, showError } = useToast()
  return useMutation({
    mutationFn: (arg: T) => {
      if (!uid) throw new Error('לא מחובר ל-BodyBuddy')
      return fn(uid, arg)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bbKeys.all })
      if (messages.ok) showSuccess(messages.ok)
    },
    onError: () => showError(messages.fail),
  })
}

export function useAddMealEntries() {
  return useBbMutation(
    (uid, a: { items: CartItem[]; date: string; groupName: string; createdAt: string; groupId?: string }) =>
      api.addMeal(uid, a.items, { date: a.date, groupName: a.groupName, createdAt: a.createdAt, groupId: a.groupId }),
    { ok: 'הארוחה נוספה', fail: 'שגיאה בהוספת הארוחה' },
  )
}

export function useAddSingleFood() {
  return useBbMutation(
    (uid, a: { item: CartItem; date: string; createdAt: string }) => api.addSingleFood(uid, a.item, { date: a.date, createdAt: a.createdAt }),
    { ok: 'המאכל נוסף בהצלחה', fail: 'שגיאה בהוספה ליומן' },
  )
}

export function useDeleteEntry() {
  return useBbMutation((uid, id: string) => api.deleteEntry(uid, id), { ok: 'הפריט נמחק', fail: 'שגיאה במחיקה' })
}

export function useDeleteGroup() {
  return useBbMutation((uid, groupId: string) => api.deleteGroup(uid, groupId), { ok: 'הארוחה נמחקה', fail: 'שגיאה במחיקת הארוחה' })
}

export function useCreateFood() {
  return useBbMutation((uid, input: api.NewFoodInput) => api.createFoodItem(uid, input), { ok: 'המאכל נשמר במאכלים שלי', fail: 'שגיאה ביצירת המאכל' })
}

export function useSaveCatalogFood() {
  return useBbMutation((uid, foodId: string) => api.saveCatalogFood(uid, foodId), { ok: 'נוסף למאכלים שלי', fail: 'שגיאה בשמירה' })
}

export function useCreateSavedMeal() {
  return useBbMutation((uid, a: { name: string; items: CartItem[] }) => api.createSavedMeal(uid, a.name, a.items), {
    ok: 'הארוחה נשמרה בארוחות השמורות',
    fail: 'שגיאה בשמירת הארוחה',
  })
}

export function useDeleteMyFood() {
  return useBbMutation((uid, food: Food) => api.deleteMyFood(uid, food), { ok: 'המאכל נמחק מהרשימה', fail: 'שגיאה במחיקת המאכל' })
}

export function useDeleteSavedMeal() {
  return useBbMutation((uid, mealId: string) => api.deleteSavedMeal(uid, mealId), { ok: 'הארוחה נמחקה מהרשימה', fail: 'שגיאה במחיקת הארוחה' })
}

export function useUpdateMealItems() {
  return useBbMutation((_uid, a: { mealId: string; changes: api.MealItemsChanges }) => api.updateMealItems(a.mealId, a.changes), { fail: 'שגיאה בעדכון הארוחה' })
}

/** Today's goals and what was already eaten today — what the summary card's "what's left" uses */
export function useDayProgress() {
  const { goalCalories, goalProtein } = useGoals()
  const today = todayLocal()
  const { entries } = useMealGroups(today, today)
  const consumed = useMemo(() => sumMacros(entries), [entries])
  return { goals: { calories: goalCalories, protein: goalProtein }, consumed }
}
