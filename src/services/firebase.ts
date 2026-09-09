/**
 * DEPRECATED - Firebase SDK has been completely migrated to Supabase Auth & PostgreSQL.
 * This stub forwards all auth methods to supabaseService for backwards compatibility.
 */
import { supabaseService } from './supabaseService';

export const firebaseService = supabaseService;
export default supabaseService;
