import { renderSessionForm } from "../session-form-page";

export default async function AddSession(props: {
  params: Promise<{ eventSlug: string }>;
}) {
  return renderSessionForm(props);
}
