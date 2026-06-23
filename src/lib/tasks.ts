import { supabase } from "./supabase";

export async function getTasks() {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log("AUTH UID:", user?.id);
    if (authError || !user?.email) {
      console.error("AUTH ERROR:", authError);
      return [];
    }

    console.log("AUTH USER:", user.email);

    const { data: appUser, error: userError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("email", user.email)
      .single();

    if (userError || !appUser) {
      console.error("USER LOOKUP ERROR:", userError);
      return [];
    }

    console.log("APP USER:", JSON.stringify(appUser, null, 2));

    const { data: tasks, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("assignee_id", appUser.id)
      .order("created_at", { ascending: false });

    if (taskError) {
      console.error("TASK ERROR:", taskError);
      return [];
    }

    console.log("TASKS FOUND:", JSON.stringify(tasks, null, 2));

    return tasks || [];
  } catch (err) {
    console.error("GET TASKS FAILED:", err);
    return [];
  }
}