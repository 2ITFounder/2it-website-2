"use client"

import { useMemo } from "react"
import { useMutation, useQuery, type QueryClient } from "@tanstack/react-query"
import type { ExpenseUser } from "./types"
import { apiGetExpenseUsers, apiUpdateExpenseUser, extractErrorMessage } from "./expenses.api"

type Params = {
  qc: QueryClient
  setUserError: (value: string | null) => void
}

export function useExpenseUsers({ qc, setUserError }: Params) {
  const usersQuery = useQuery<ExpenseUser[], Error>({
    queryKey: ["expense-users"],
    queryFn: ({ signal }) => apiGetExpenseUsers(signal),
  })

  const allUsers = usersQuery.data ?? []
  const includedUsers = useMemo(
    () => allUsers.filter((u) => u.include_in_expenses),
    [allUsers]
  )

  const updateUserMutation = useMutation({
    mutationFn: async (payload: { userId: string; includeInExpenses: boolean }) => {
      setUserError(null)
      return apiUpdateExpenseUser(payload.userId, payload.includeInExpenses)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["expense-users"] })
    },
    onError: (err: unknown) => setUserError(extractErrorMessage(err) ?? "Errore aggiornamento utente"),
  })

  return { usersQuery, allUsers, includedUsers, updateUserMutation }
}
