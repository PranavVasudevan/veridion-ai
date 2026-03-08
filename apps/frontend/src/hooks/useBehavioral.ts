import { useEffect } from "react";
import { useBehavioralStore } from "../state/behavioral.store";
export function useBehavioral() {

  const {
    scores,
    adaptiveRisk,
    wallet,
    trades,
    history,
    isLoading,
    fetchAll,
  } = useBehavioralStore();

  useEffect(() => {
    console.log('fetchAll firing');
    fetchAll();
  }, [fetchAll]);

  return {
    scores,
    adaptiveRisk,
    wallet,
    trades,
    history,
    isLoading,
  };
}