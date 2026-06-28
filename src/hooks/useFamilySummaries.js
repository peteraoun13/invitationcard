import { useEffect, useState } from "react";
import { subscribeFamilySummaries } from "../services/backend";

export function useFamilySummaries() {
  const [families, setFamilies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    return subscribeFamilySummaries(
      (nextFamilies) => {
        setFamilies(nextFamilies);
        setIsLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setIsLoading(false);
      },
    );
  }, []);

  return {
    families,
    isLoading,
    error,
  };
}
