import Link from "next/link";

export default function DeletionConfirmation(props: {
  params: { eventSlug: string };
}) {
  const { eventSlug } = props.params;
  return (
    <div className="p-8 max-w-lg mx-auto flex flex-col">
      <h1 className="text-2xl font-bold">Session deleted</h1>
      <p className="text-gray-900 mt-4">
        Your session has been deleted successfully.
      </p>
      <Link
        className="bg-rose-400 text-white font-semibold py-2 px-4 rounded shadow hover:bg-rose-500 active:bg-rose-500 w-fit px-12"
        href={`/${eventSlug}`}
      >
        Back to schedule
      </Link>
    </div>
  );
}
