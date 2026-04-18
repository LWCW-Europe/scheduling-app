import { renderSessionForm } from "../session-form-page";

export default async function EditSession(props: {
  params: Promise<{ eventSlug: string }>;
}) {
  return renderSessionForm(props);
}
