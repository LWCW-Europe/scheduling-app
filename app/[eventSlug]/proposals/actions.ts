"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getRepositories } from "@/db/container";

export async function createProposal(formData: FormData) {
  const eventId = formData.get("event") as string;
  const eventSlug = formData.get("eventSlug") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const hostIds = formData.getAll("hosts") as string[];
  const durationMinutes =
    parseInt(formData.get("durationMinutes") as string) || undefined;

  if (!title) {
    return { error: "Title is required" };
  }

  if (!eventId) {
    return { error: "Event is required" };
  }

  try {
    await getRepositories().sessionProposals.create({
      eventId,
      title,
      description: description || undefined,
      hostIds,
      durationMinutes,
    });
    revalidatePath(`/${eventSlug}/proposals`);
  } catch (error) {
    console.error("Error creating proposal:", error);
    return { error: "Failed to create proposal" };
  }
  redirect(`/${eventSlug}/proposals`);
}

export async function updateProposal(id: string, formData: FormData) {
  const eventSlug = formData.get("eventSlug") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const hostIds = formData.getAll("hosts") as string[];
  const durationMinutesRaw = formData.get("durationMinutes") as string;
  const durationMinutes = durationMinutesRaw
    ? parseInt(durationMinutesRaw) || null
    : null;

  if (!title) {
    return { error: "Title is required" };
  }

  try {
    await getRepositories().sessionProposals.update(id, {
      title,
      description: description || undefined,
      hostIds,
      durationMinutes,
    });
    revalidatePath(`/${eventSlug}/proposals`);
  } catch (error) {
    console.error("Error updating proposal:", error);
    return { error: "Failed to update proposal" };
  }
  redirect(`/${eventSlug}/proposals`);
}

export async function deleteProposal(id: string, eventSlug: string) {
  try {
    await getRepositories().sessionProposals.delete(id);
    revalidatePath(`/${eventSlug}/proposals`);
  } catch (error) {
    console.error("Error deleting proposal:", error);
    return { error: "Failed to delete proposal" };
  }
  redirect(`/${eventSlug}/proposals`);
}
