import { supabase } from "../lib/supabase";

import type {
  TimelineRecord,
  CreateTimelineRecord,
} from "../types/timeline";

export async function getTimeline(
  childId: string
): Promise<TimelineRecord[]> {
  const { data, error } = await supabase
    .from("care_timeline")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar linha do tempo:", error);
    throw error;
  }

  return (data || []) as TimelineRecord[];
}

export async function createTimelineRecord(
  payload: CreateTimelineRecord
): Promise<TimelineRecord> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("Erro ao obter usuário:", authError);
    throw authError;
  }

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("care_timeline")
    .insert({
      user_id: user.id,
      child_id: payload.child_id,
      author_name: payload.author_name || null,
      author_role: payload.author_role || "Responsável",
      event_type: payload.event_type,
      mood: payload.mood || null,
      sleep_quality: payload.sleep_quality || null,
      description: payload.description,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Erro ao criar registro na linha do tempo:", error);
    throw error;
  }

  return data as TimelineRecord;
}

export async function deleteTimelineRecord(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("care_timeline")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao excluir registro da linha do tempo:", error);
    throw error;
  }
}