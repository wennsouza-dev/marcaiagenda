
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = 'https://vrykofagjtlkdwtdkksu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyeWtvZmFnanRsa2R3dGRra3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMDY2MDIsImV4cCI6MjA4MTU4MjYwMn0.5U6PUQSdhal1SnozPgYroBp83ki3fyg_dPDSobSFOJQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
