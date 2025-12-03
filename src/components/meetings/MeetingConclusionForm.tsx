"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

type MeetingConclusion = Tables<'meeting_conclusions'>;

interface MeetingConclusionFormProps {
  meetingId: string;
  onSave: () => void;
  onClose: () => void;
}

export default function MeetingConclusionForm({ meetingId, onSave, onClose }: MeetingConclusionFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [conclusionNotes, setConclusionNotes] = useState("");

  // Fetch existing conclusion
  const { data: existingConclusion, isLoading } = useQuery({
    queryKey: ["meeting-conclusion", meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_conclusions")
        .select("*")
        .eq("meeting_id", meetingId)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
      return data;
    },
    enabled: !!meetingId,
  });

  useEffect(() => {
    if (existingConclusion) {
      setConclusionNotes(existingConclusion.conclusion_notes);
    } else {
      setConclusionNotes("");
    }
  }, [existingConclusion]);

  const upsertConclusionMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User ID not found");
      const payload = {
        meeting_id: meetingId,
        conclusion_notes: conclusionNotes,
        recorded_by: user.id,
      };

      if (existingConclusion) {
        // Update existing
        const { error } = await supabase.from("meeting_conclusions").update({
          conclusion_notes: conclusionNotes,
          updated_at: new Date().toISOString(),
        }).eq("id", existingConclusion.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from("meeting_conclusions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-conclusion", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] }); // Invalidate main meetings list to show conclusion status
      toast.success("Meeting conclusion saved successfully!");
      onSave();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save conclusion");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conclusionNotes.trim()) {
      toast.error("Conclusion notes cannot be empty.");
      return;
    }
    upsertConclusionMutation.mutate();
  };

  if (isLoading) {
    return <p>Loading conclusion...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="conclusionNotes">Meeting Conclusion Notes *</Label>
        <Textarea
          id="conclusionNotes"
          value={conclusionNotes}
          onChange={(e) => setConclusionNotes(e.target.value)}
          rows={8}
          placeholder="Summarize key discussions, decisions, and action items."
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={upsertConclusionMutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={!conclusionNotes.trim() || upsertConclusionMutation.isPending}>
          {upsertConclusionMutation.isPending ? "Saving..." : (existingConclusion ? "Update Conclusion" : "Add Conclusion")}
        </Button>
      </div>
    </form>
  );
}