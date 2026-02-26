import api from './api';
import { isDemoMode, sleep } from '../utils';
import { demoDecisionLog, demoRiskExplanation } from '../utils/demoData';
import type { DecisionLogEntry, ExplainabilityData } from '../types';

export const explainabilityService = {
    getDecisionLog: async (): Promise<DecisionLogEntry[]> => {
        if (isDemoMode()) { await sleep(300); return demoDecisionLog; }
        const { data } = await api.get<DecisionLogEntry[]>('/explainability/decision-log');
        return data;
    },
    getRiskExplanation: async (): Promise<ExplainabilityData> => {
        if (isDemoMode()) { await sleep(250); return demoRiskExplanation; }
        const { data } = await api.get<ExplainabilityData>('/explainability/risk');
        return data;
    },
    getAllocationExplanation: async (runId: number): Promise<ExplainabilityData> => {
        if (isDemoMode()) { await sleep(250); return { ...demoRiskExplanation, summary: `Explanation for optimization run #${runId}` }; }
        const { data } = await api.get<ExplainabilityData>(`/explainability/allocation/${runId}`);
        return data;
    },
};
