"use client";
import type { Guest } from "@/db/repositories/interfaces";
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
        hosts={guests.filter((guest) => guest.id === currentUser)}
        setHosts={(hosts) => {
          setUser?.(hosts?.at(-1)?.id || null);
        }}
        selectMany={false}
      />
    )
  );
}
