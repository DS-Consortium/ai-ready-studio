import { supabaseAdmin } from './supabase.js';

export interface SchemaStatus {
  ok: boolean;
  missingTables: string[];
  expectedTables: string[];
  foundTables: string[];
  checkedAt: string;
  error?: string;
}

const REQUIRED_TABLES = [
  'device_tokens',
  'credit_transactions',
  'seminar_bookings',
  'readiness_scores',
  'referral_codes',
  'referral_history',
  'video_records',
  'videos',
  'votes',
  'video_series',
  'knowledge_videos',
  'events',
  'discount_codes',
  'prize_draws',
  'prize_draw_entries',
  'rewards',
  'user_roles',
  'client_error_reports',
];

export async function verifyDatabaseSchema(): Promise<SchemaStatus> {
  try {
    const { data, error } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_schema,table_name')
      .eq('table_schema', 'public');

    if (error) {
      throw error;
    }

    const foundTables = Array.isArray(data)
      ? (data as Array<{ table_name: string }>).map((row) => row.table_name)
      : [];

    const missingTables = REQUIRED_TABLES.filter((table) => !foundTables.includes(table));

    return {
      ok: missingTables.length === 0,
      missingTables,
      expectedTables: REQUIRED_TABLES,
      foundTables,
      checkedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      ok: false,
      missingTables: REQUIRED_TABLES,
      expectedTables: REQUIRED_TABLES,
      foundTables: [],
      checkedAt: new Date().toISOString(),
      error: error?.message || 'Unknown schema validation error',
    };
  }
}
