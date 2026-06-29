import { createClient } from '@supabase/supabase-js'

// ============================================
// FitnessTracker (SOURCE) — project: hzkbcguhupmdyfyzasex
// ============================================
const SOURCE_URL = 'https://hzkbcguhupmdyfyzasex.supabase.co'
const SOURCE_ANON_KEY =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6a2JjZ3VodXBtZHlmeXphc2V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5OTg1ODUsImV4cCI6MjA5MTU3NDU4NX0.-G70xxk6JfyOSss2nz5jCYqBsyUpwlJskys-jZqz8Pg'

// ============================================
// BodyBuddy (TARGET) — project: arxscyvqikyjupszspym
// ============================================
const TARGET_URL = 'https://arxscyvqikyjupszspym.supabase.co'
const TARGET_ANON_KEY =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyeHNjeXZxaWt5anVwc3pzcHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMjg2NzksImV4cCI6MjA4MjYwNDY3OX0.c0GOJevloMvwtt39S6ZBLHK319uG2E2F8TDXOww6-cA'

export const source = createClient(SOURCE_URL, SOURCE_ANON_KEY)
export const target = createClient(TARGET_URL, TARGET_ANON_KEY)

// user_id mapping (FitnessTracker → BodyBuddy)
export const TARGET_USER_ID = 'f2290863-2572-4006-8fb7-4e15d612eb17'
export const SOURCE_USER_IDS = [
	'abed08d4-1cf1-492d-b22b-9be21e0a6bb6',
	'9a24d9b0-097c-441d-afb4-58577346f02c',
]
