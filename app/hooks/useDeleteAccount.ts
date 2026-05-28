"use client";

import { useCallback, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { apiFetch } from "@/lib/apiClient";

export function useDeleteAccount() {
  const { data: session } = useSession();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteAccount = useCallback(async () => {
    if (!session?.accessToken) {
      setDeleteError("Sign in to delete your account.");
      return false;
    }

    setDeleteError(null);
    setDeleting(true);

    try {
      const res = await apiFetch("/account", {
        method: "DELETE",
        accessToken: session.accessToken,
      });

      if (!res.ok) {
        throw new Error("Could not delete your account.");
      }

      await signOut({ callbackUrl: "/" });
      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not delete your account. Please try again.";
      setDeleteError(message);
      return false;
    } finally {
      setDeleting(false);
    }
  }, [session?.accessToken]);

  const clearDeleteError = useCallback(() => {
    setDeleteError(null);
  }, []);

  return { deleteAccount, deleting, deleteError, clearDeleteError };
}
