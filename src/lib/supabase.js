import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// New image upload logic for the treat-images bucket
export const uploadTreatImage = async (file) => {
  try {
    // 1. Create a unique file name so images don't overwrite each other
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

    // 2. Upload to the 'treats' bucket
    const { error: uploadError } = await supabase.storage
      .from('treats')
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error details:", uploadError);
      return null;
    }

    // 3. Get the public URL to save into your database
    const { data } = supabase.storage
      .from('treats')
      .getPublicUrl(fileName);

    return data.publicUrl;

  } catch (error) {
    console.error('Unexpected error uploading image:', error);
    return null;
  }
};