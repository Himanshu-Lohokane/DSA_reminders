import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Simple auth check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer admin123') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting GFG migration...');

    // Add gfg_username column to users table if it doesn't exist
    try {
      await db.execute(sql`
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'gfg_username') THEN
                ALTER TABLE users ADD COLUMN gfg_username VARCHAR(255);
            END IF;
        END $$;
      `);
      console.log('✅ Added gfg_username column to users table');
    } catch (error) {
      console.error('❌ Error adding gfg_username column:', error);
    }

    // Add platform column to daily_stats table if it doesn't exist
    try {
      await db.execute(sql`
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_stats' AND column_name = 'platform') THEN
                ALTER TABLE daily_stats ADD COLUMN platform VARCHAR(32) DEFAULT 'leetcode' NOT NULL;
            END IF;
        END $$;
      `);
      console.log('✅ Added platform column to daily_stats table');
    } catch (error) {
      console.error('❌ Error adding platform column:', error);
    }

    // Update existing daily_stats records to have platform = 'leetcode'
    try {
      await db.execute(sql`UPDATE daily_stats SET platform = 'leetcode' WHERE platform IS NULL OR platform = ''`);
      console.log('✅ Updated existing daily_stats records with platform = leetcode');
    } catch (error) {
      console.error('❌ Error updating existing records:', error);
    }

    // Drop old unique index if it exists
    try {
      await db.execute(sql`DROP INDEX IF EXISTS user_date_idx`);
      console.log('✅ Dropped old user_date_idx index');
    } catch (error) {
      console.error('❌ Error dropping old index:', error);
    }

    // Create new unique index for (user_id, platform, date)
    try {
      await db.execute(sql`
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'user_platform_date_idx') THEN
                CREATE UNIQUE INDEX user_platform_date_idx ON daily_stats(user_id, platform, date);
            END IF;
        END $$;
      `);
      console.log('✅ Created user_platform_date_idx index');
    } catch (error) {
      console.error('❌ Error creating new index:', error);
    }

    // Create platform index
    try {
      await db.execute(sql`
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'platform_idx') THEN
                CREATE INDEX platform_idx ON daily_stats(platform);
            END IF;
        END $$;
      `);
      console.log('✅ Created platform_idx index');
    } catch (error) {
      console.error('❌ Error creating platform index:', error);
    }

    // Verify the migration
    const userColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'gfg_username'
    `);

    const dailyStatsColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'daily_stats' AND column_name = 'platform'
    `);

    const indexes = await db.execute(sql`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename IN ('users', 'daily_stats') AND indexname LIKE '%platform%'
    `);

    console.log('✅ GFG migration completed successfully');

    return NextResponse.json({
      message: 'GFG migration completed successfully',
      userColumns: userColumns.rows,
      dailyStatsColumns: dailyStatsColumns.rows,
      indexes: indexes.rows,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}