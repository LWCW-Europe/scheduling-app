"use server";

import { revalidatePath } from "next/cache";
import {
  createSessionProposal,
  updateSessionProposal,
  deleteSessionProposal,
  searchSessionProposals,
  type NewProposalInput,
} from "@/db/sessionProposals";

export async function createProposal(formData: FormData) {
  const eventSlug = formData.get("eventSlug") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const hosts = formData.get("hosts") as string;
  const durationMinutes =
    parseInt(formData.get("durationMinutes") as string) || 60;
  const userId = formData.get("userId") as string;

  if (!title) {
    return { error: "Title is required" };
  }

  if (!eventSlug) {
    return { error: "Event slug is required" };
  }

  try {
    const proposal: NewProposalInput = {
      eventSlug,
      title,
      description,
      hosts,
      durationMinutes,
    };

    const result = await createSessionProposal(proposal, userId);
    revalidatePath(`/${eventSlug}/activities`);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating proposal:", error);
    return { error: "Failed to create proposal" };
  }
}

export async function updateProposal(id: string, formData: FormData) {
  const eventSlug = formData.get("eventSlug") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const hosts = formData.get("hosts") as string;
  const durationMinutes =
    parseInt(formData.get("durationMinutes") as string) || 60;
  const userId = formData.get("userId") as string;

  if (!title) {
    return { error: "Title is required" };
  }

  try {
    const patch: Partial<NewProposalInput> = {
      title,
      description,
      hosts,
      durationMinutes,
    };

    const result = await updateSessionProposal(id, patch, userId);
    revalidatePath(`/${eventSlug}/activities`);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating proposal:", error);
    return { error: "Failed to update proposal" };
  }
}

export async function deleteProposal(id: string, eventSlug: string) {
  try {
    const result = await deleteSessionProposal(id);
    revalidatePath(`/${eventSlug}/activities`);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error deleting proposal:", error);
    return { error: "Failed to delete proposal" };
  }
}

export async function searchProposals(eventSlug: string, query: string) {
  try {
    const results = await searchSessionProposals(eventSlug, query);
    return { success: true, data: results };
  } catch (error) {
    console.error("Error searching proposals:", error);
    return { error: "Failed to search proposals" };
  }
}
