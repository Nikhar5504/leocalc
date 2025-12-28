import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rywkvyzaaivouuagffkt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5d2t2eXphYWl2b3V1YWdmZmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNjE2OTIsImV4cCI6MjA4MTgzNzY5Mn0.r9H2xf-1xqKTaXM_mrNpbKcf1VNeFjF3uDGW6pXa1jg'

export const supabase = createClient(supabaseUrl, supabaseKey)
