import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Get Supabase credentials from environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({
        error: 'Missing Supabase credentials',
        timestamp: new Date().toISOString()
      });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Perform a simple query to keep the connection alive
    // Using a lightweight query on user_profiles table with estimated count
    const { count, error } = await supabase
      .from('user_profiles')
      .select('*', { count: 'estimated', head: true });

    if (error) {
      console.error('Heartbeat query error:', error);
      return res.status(500).json({
        error: 'Database query failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Success response
    return res.status(200).json({
      status: 'ok',
      message: 'Heartbeat successful',
      timestamp: new Date().toISOString(),
      recordCount: count ?? 0
    });

  } catch (error) {
    console.error('Heartbeat error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
