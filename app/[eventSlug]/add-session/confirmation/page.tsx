import Link from "next/link";

export default async function Confirmation() {
  return (
    <div className="p-8 max-w-lg mx-auto flex flex-col">
      <h1 className="text-2xl font-bold">Session added</h1>
      <p className="text-gray-900 mt-4">
        Your session has been added successfully! You and any other hosts will
        receive an email confirming the details you specified.
      </p>
      <Link
        className="bg-rose-400 mt-8 text-white font-semibold py-2 px-4 rounded shadow hover:bg-rose-500 active:bg-rose-500 mx-auto px-12"
        href="/"
      >
        Back to schedule
      </Link>
    </div>
  );
}
