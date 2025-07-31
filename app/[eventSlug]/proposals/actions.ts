"use server";

import { revalidatePath } from "next/cache";
import {
  createSessionProposal,
  updateSessionProposal,
  deleteSessionProposal,
  type NewProposalInput,
} from "@/db/sessionProposals";

export async function createProposal(formData: FormData) {
  const event = formData.get("event") as string;
  const eventSlug = formData.get("eventSlug") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const hosts = formData.getAll("hosts") as string[];
  const durationMinutes =
    parseInt(formData.get("durationMinutes") as string) || null;

  if (!title) {
    return { error: "Title is required" };
  }

  if (!event) {
    return { error: "Event is required" };
  }

  try {
    const proposal: NewProposalInput = {
      event,
      title,
      description,
      hosts,
      durationMinutes,
    };

    const result = await createSessionProposal(proposal);
    revalidatePath(`/${eventSlug}/proposals`);
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
  const hosts = formData.getAll("hosts") as string[];
  const durationMinutes =
    parseInt(formData.get("durationMinutes") as string) || null;

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

    const result = await updateSessionProposal(id, patch);
    revalidatePath(`/${eventSlug}/proposals`);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating proposal:", error);
    return { error: "Failed to update proposal" };
  }
}

export async function deleteProposal(id: string, eventSlug: string) {
  try {
    await deleteSessionProposal(id);
    revalidatePath(`/${eventSlug}/proposals`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting proposal:", error);
    return { error: "Failed to delete proposal" };
  }
}
