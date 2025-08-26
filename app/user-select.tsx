"use client";
import { Guest } from "@/db/guests";
import { useContext } from "react";
import { SelectHosts } from "./[eventSlug]/session-form";
import { UserContext } from "./context";

export function UserSelect({
  guests,
  showOnlyWhenUserSet,
}: {
  guests: Guest[];
  showOnlyWhenUserSet?: boolean;
}) {
  const { user: currentUser, setUser } = useContext(UserContext);

  return (
    (!showOnlyWhenUserSet || currentUser) && (
      <SelectHosts
        id="user-selection"
        guests={guests}
        hosts={guests.filter((guest) => guest.ID === currentUser)}
        setHosts={(hosts) => {
          setUser?.(hosts?.at(-1)?.ID || null);
        }}
        selectMany={false}
      />
    )
  );
}
