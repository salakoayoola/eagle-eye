import { useQuery } from "@tanstack/react-query";
import { listDirectory, type CopyPartyListing } from "@/lib/copyparty";

export function useFiles(path: string) {
  return useQuery<CopyPartyListing>({
    queryKey: ["files", path],
    queryFn: () => listDirectory(path),
  });
}
