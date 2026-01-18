
import { createClient } from '@supabase/supabase-js';

// Specific credentials provided by user
const supabaseUrl = 'https://rkoyjaoovymhsqpvtowr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrb3lqYW9vdnltaHNxcHZ0b3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzE1NzQsImV4cCI6MjA4MzA0NzU3NH0.rKhjyXcFijIpRSKWWWZYwFmgi3z5sYrAbOK0oXBO5IE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
