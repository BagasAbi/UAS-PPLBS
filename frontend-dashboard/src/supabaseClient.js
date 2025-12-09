import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sqeprcowwnbivpnkdumu.supabase.co';
const supabaseAnonKey = 'sb_publishable_6dEf_QNOwMWNoA-969FalA_BFeqz884';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);