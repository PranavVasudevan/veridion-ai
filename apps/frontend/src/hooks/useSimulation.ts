import { useState, useCallback } from 'react';
import { montecarloService, StressTestParams } from '../services/montecarlo.service';
import type { StressTestResult } from '../types';

export function useSimulation() {
    const [results, setResults] = useState<StressTestResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runSimulation = useCallback(async (params: StressTestParams) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await montecarloService.runStressTest(params);
            setResults(data);
        } catch (err: any) {
            const message =
                err?.response?.data?.error?.message ??
                err?.response?.data?.message ??
                'Failed to run simulation';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { results, isLoading, error, runSimulation };
}
