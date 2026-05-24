import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qswcbscnlelrqjafibmq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzd2Nic2NubGVscnFqYWZpYm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTI0NTAsImV4cCI6MjA5NTE4ODQ1MH0._1hDAIHAK22leW2LZVJUoLnxMHYro7HF_v4OybyEGsA";

export const supabase = createClient(supabaseUrl, supabaseKey);