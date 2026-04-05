import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listDrives,
  mountDrive,
  ejectDrive,
  type Drive,
} from "@/lib/companion";

export function useDrives() {
  return useQuery<Drive[]>({
    queryKey: ["drives"],
    queryFn: listDrives,
    refetchInterval: 10_000, // Poll every 10s for drive changes
  });
}

export function useMountDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (device: string) => mountDrive(device),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drives"] });
    },
  });
}

export function useEjectDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (device: string) => ejectDrive(device),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drives"] });
    },
  });
}
