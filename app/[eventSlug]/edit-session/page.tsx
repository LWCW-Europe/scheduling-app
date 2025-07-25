import { renderSessionForm } from "../session-form-page";

export default async function EditSession(props: {
  params: { eventSlug: string };
}) {
  return renderSessionForm(props);
}
