import { supabase } from "./supabase";

export async function testConnection() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .limit(1);

  console.log("Data:", data);
  console.log("Error:", error);
}