import { source, target, MIGRATE_USER_ID } from './config'

const BATCH_SIZE = 50

async function migrate() {
	console.log('--- Migrating body_stats ---')

	const { data, error } = await source
		.from('body_stats')
		.select('*')
		.eq('user_id', MIGRATE_USER_ID)
		.order('date')

	if (error) {
		console.error('Failed to fetch from source:', error.message)
		process.exit(1)
	}

	console.log(`Fetched ${data.length} rows from FitnessTracker`)

	let inserted = 0
	for (let i = 0; i < data.length; i += BATCH_SIZE) {
		const batch = data.slice(i, i + BATCH_SIZE)

		const { error: insertError } = await target
			.from('body_stats')
			.upsert(batch, { onConflict: 'id' })

		if (insertError) {
			console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, insertError.message)
			process.exit(1)
		}

		inserted += batch.length
		console.log(`  Inserted ${inserted}/${data.length}`)
	}

	console.log(`Done! ${inserted} rows migrated to BodyBuddy.`)
}

migrate()
