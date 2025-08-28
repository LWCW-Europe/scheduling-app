"use client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  ArrowTopRightOnSquareIcon,
  MapIcon,
} from "@heroicons/react/24/outline";
import { UserSelect } from "./user-select";
import { UserContext } from "./context";
import { Guest } from "@/db/guests";

export function MapModal() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="relative inline-flex items-center justify-center rounded-md p-1.5 bg-rose-400 text-white hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-rose-400"
        onClick={() => setOpen(true)}
      >
        <MapIcon className="h-5 w-5 stroke-2" aria-hidden="true" />
      </button>
      <Modal open={open} setOpen={setOpen}>
        <Image
          src="/map.png"
          alt="Map"
          className="w-full h-full"
          width={500}
          height={500}
        />
      </Modal>
    </div>
  );
}

export function CurrentUserModal(props: {
  guests: Guest[];
  hosts: string[];
  open: boolean;
  close: () => void;
  rsvp: () => void;
  sessionInfoDisplay?: React.ReactNode;
  rsvpd: boolean;
  zIndex?: string;
  portal?: boolean; // For nested modal contexts
}) {
  const { user: currentUser } = useContext(UserContext);
  const {
    guests,
    hosts,
    open,
    close,
    rsvp,
    sessionInfoDisplay,
    rsvpd,
    zIndex,
    portal,
  } = props;
  const isDisabled = hosts.includes(currentUser || "");
  const { user } = useContext(UserContext);
  const onClickHandler = () => {
    rsvp();
    close();
  };
  return (
    <Modal
      open={open}
      setOpen={close}
      hideClose={!!user}
      zIndex={zIndex}
      portal={portal}
    >
      {sessionInfoDisplay}
      {
        <div className="mt-2">
          <span className="text-gray-500">RSVPing as...</span>
          <UserSelect guests={guests} />
        </div>
      }
      {user && (
        <div className="relative inline-block group">
          <button
            type="button"
            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm disabled:bg-gray-400 px-4 py-2 bg-rose-400 text-base font-medium text-white hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400 sm:text-sm mt-4"
            onClick={onClickHandler}
            disabled={isDisabled}
          >
            {rsvpd ? "Un-RSVP" : "RSVP"}
          </button>
          {isDisabled && (
            <div className="absolute bottom-3/4 left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-sm text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              Cannot RSVP to your own event
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export function ExportScheduleModal() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="relative inline-flex items-center justify-center rounded-md p-1.5 bg-rose-400 text-white hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-rose-400"
        onClick={() => setOpen(true)}
      >
        <ArrowTopRightOnSquareIcon
          className="h-5 w-5 stroke-2"
          aria-hidden="true"
        />
      </button>
      <Modal open={open} setOpen={setOpen}>
        <h1 className="text-2xl font-bold">Export schedule</h1>
        <p className="mt-2">
          Add the schedule to an external calendar using any of the links below.
        </p>
        <div className="flex flex-col gap-4 mt-3 pl-4">
          <a
            href="https://calendar.google.com/calendar/u/0?cid=fo6ng9e5sji2mli6eisk5lctpk9eb8da@import.calendar.google.com"
            className="text-rose-400 hover:underline"
          >
            Google Calendar link
          </a>
          <a
            href="https://calendar.google.com/calendar/ical/fo6ng9e5sji2mli6eisk5lctpk9eb8da%40import.calendar.google.com/public/basic.ics"
            className="text-rose-400 hover:underline"
          >
            iCal link
          </a>
          <a
            href="https://calendar.google.com/calendar/embed?src=fo6ng9e5sji2mli6eisk5lctpk9eb8da%40import.calendar.google.com&ctz=Europe%2FBerlin"
            className="text-rose-400 hover:underline"
          >
            Public generic link
          </a>
        </div>
      </Modal>
    </div>
  );
}

export function ConfirmDeletionModal(props: {
  btnDisabled: boolean;
  confirm: () => Promise<void>;
  itemName: string;
}) {
  const { btnDisabled, confirm, itemName } = props;
  const [open, setOpen] = useState(false);

  const clickHandler = async () => {
    await confirm();
    setOpen(false);
  };
  return (
    <>
      <button
        type="submit"
        className="bg-white-400 text-red-900 font-semibold py-2 rounded shadow disabled:bg-gray-200 border-2 border-red-500 mx-auto px-12 hover:bg-rose-100 active:bg-rose-100"
        onClick={() => setOpen(true)}
        disabled={btnDisabled}
      >
        Delete
      </button>
      <Modal open={open} setOpen={setOpen} hideClose={true}>
        <p>Delete {itemName}?</p>
        <div className="mt-4">
          <button
            type="button"
            className="rounded-md border border-transparent shadow-sm px-6 py-2 bg-rose-400 font-medium text-white hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400"
            onClick={() => void clickHandler()}
          >
            Yes
          </button>
          <button
            type="button"
            className="ml-4 rounded-md border border-black shadow-sm px-6 py-2 bg-white font-medium text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
            onClick={() => setOpen(false)}
          >
            No
          </button>
        </div>
      </Modal>
    </>
  );
}

export function ConfirmationModal(props: {
  open: boolean;
  close: () => void;
  confirm: () => void;
  message: string;
  zIndex?: string;
  portal?: boolean; // For nested modal contexts
}) {
  const { open, close, confirm, message, zIndex, portal } = props;
  const clickHandler = () => {
    confirm();
    close();
  };
  return (
    <>
      <Modal
        open={open}
        setOpen={close}
        hideClose={true}
        zIndex={zIndex}
        portal={portal}
      >
        <p>{message}</p>
        <div className="mt-4">
          <button
            type="button"
            className="rounded-md border border-transparent shadow-sm px-6 py-2 bg-rose-400 font-medium text-white hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400"
            onClick={clickHandler}
          >
            Yes
          </button>
          <button
            type="button"
            className="ml-4 rounded-md border border-black shadow-sm px-6 py-2 bg-white font-medium text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
            onClick={close}
          >
            No
          </button>
        </div>
      </Modal>
    </>
  );
}

export function Modal(props: {
  open: boolean;
  setOpen: (value: boolean) => void;
  children: React.ReactNode;
  hideClose?: boolean;
  zIndex?: string;
  portal?: boolean; // Explicitly control portaling behavior
}) {
  const {
    open,
    setOpen,
    children,
    hideClose,
    zIndex = "z-10",
    portal = false,
  } = props;
  const fakeRef = useRef(null);

  const modalContent = (
    <div>
      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          initialFocus={fakeRef}
          className={`fixed inset-0 ${zIndex} overflow-y-auto`}
          onClose={() => setOpen(false)}
        >
          <button ref={fakeRef} className="hidden" />
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>
          <div className={`fixed inset-0 ${zIndex} w-full overflow-y-auto`}>
            <div className="flex min-h-full w-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative mb-10 transform overflow-visible rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  {children}
                  {!hideClose && (
                    <div className="mt-4">
                      <button
                        type="button"
                        className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-rose-400 text-base font-medium text-white hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400 sm:text-sm"
                        onClick={() => setOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );

  // If explicitly requested to portal (for nested modals), use a separate container
  if (portal && typeof document !== "undefined") {
    // Create or get a high-priority modal root
    let highPriorityModalRoot = document.getElementById(
      "high-priority-modal-root"
    );
    if (!highPriorityModalRoot) {
      highPriorityModalRoot = document.createElement("div");
      highPriorityModalRoot.id = "high-priority-modal-root";
      document.body.appendChild(highPriorityModalRoot);
    }
    return createPortal(modalContent, highPriorityModalRoot);
  }

  return modalContent;
}
