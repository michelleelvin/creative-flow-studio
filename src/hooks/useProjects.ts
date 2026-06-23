import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      console.log("INCOMING PROJECTS:", data);  

      if (error) {
        console.error("Error fetching projects:", error.message);
        setProjects([]);
      } else {
        setProjects(data || []);
      }

      setLoading(false);
    };

    fetchProjects();
  }, []);

  return { projects, loading };
}