import { source, target, TARGET_USER_ID, SOURCE_USER_IDS } from './config'
import { writeFileSync } from 'fs'
import { randomUUID } from 'crypto'

const BATCH_SIZE = 50

interface LogEntry {
	source_id: string
	target_id: number
	date: string
	meal_name: string
	food_items: string
}

async function migrate() {
	console.log('--- Migrating nutrition_log → nutrition_entries ---')

	const { data, error } = await source
		.from('nutrition_log')
		.select('*')
		.in('user_id', SOURCE_USER_IDS)
		.order('date')
		.order('time')

	if (error) {
		console.error('Failed to fetch from source:', error.message)
		process.exit(1)
	}

	console.log(`Fetched ${data.length} rows from FitnessTracker`)

	// Generate group_ids: same date+meal_name → same group_id
	const groupMap = new Map<string, string>()
	const getGroupId = (date: string, mealName: string) => {
		const key = `${date}::${mealName}`
		if (!groupMap.has(key)) groupMap.set(key, randomUUID())
		return groupMap.get(key)!
	}

	const logRows: LogEntry[] = []
	let inserted = 0

	for (let i = 0; i < data.length; i += BATCH_SIZE) {
		const batch = data.slice(i, i + BATCH_SIZE)

		const mapped = batch.map((row) => {
			const foodName = row.notes
				? `${row.food_items} (${row.notes})`
				: row.food_items

			return {
				user_id: TARGET_USER_ID,
				food_item_id: null,
				food_name: foodName,
				calories: row.calories != null ? Math.round(Number(row.calories)) : null,
				protein: row.protein_g != null ? Math.round(Number(row.protein_g)) : null,
				carbs: row.carbs_g != null ? Math.round(Number(row.carbs_g)) : null,
				fat: row.fat_g != null ? Math.round(Number(row.fat_g)) : null,
				date: row.date,
				group_id: row.meal_name ? getGroupId(row.date, row.meal_name) : null,
				group_name: row.meal_name || null,
				portion_size: null,
				portion_unit: 'g',
				source: 'fitnesstracker',
				_source_id: row.id,
			}
		})

		const toInsert = mapped.map(({ _source_id, ...rest }) => rest)

		const { data: insertedRows, error: insertError } = await target
			.from('nutrition_entries')
			.insert(toInsert)
			.select('id')

		if (insertError) {
			console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, insertError.message)
			process.exit(1)
		}

		if (insertedRows) {
			insertedRows.forEach((row, idx) => {
				logRows.push({
					source_id: mapped[idx]._source_id,
					target_id: row.id,
					date: batch[idx].date,
					meal_name: batch[idx].meal_name || '',
					food_items: batch[idx].food_items || '',
				})
			})
		}

		inserted += batch.length
		console.log(`  Inserted ${inserted}/${data.length}`)
	}

	const log = {
		migrated_at: new Date().toISOString(),
		table: 'nutrition_log → nutrition_entries',
		total: logRows.length,
		rows: logRows,
	}

	writeFileSync('migration/logs/nutrition_log.json', JSON.stringify(log, null, 2), 'utf-8')
	console.log(`Done! ${inserted} rows migrated. Log saved to migration/logs/nutrition_log.json`)
}

migrate()
