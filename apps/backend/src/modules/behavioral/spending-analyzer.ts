import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../infrastructure/prisma/client';
import { logger } from '../../infrastructure/logger/logger';

function n(v: any): number {
    if (v == null) return 0;
    return typeof v === 'number' ? v : v.toNumber ? v.toNumber() : Number(v);
}

function stdDev(arr: number[]): number {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((s, x) => s + x, 0) / arr.length;
    const variance = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / (arr.length - 1);
    return Math.sqrt(variance);
}

export interface SpendingAnalysis {
    monthlyBurnRate: number;
    savingsRate: number;
    expenseVolatility: number;
    categoryBreakdown: { category: string; amount: number; percentage: number }[];
    monthlyTrend: { month: string; income: number; expenses: number; savings: number }[];
    anomalies: { month: string; amount: number; deviation: number }[];
    calculatedAt: string;
}

export async function analyzeSpending(userId: number, months = 6): Promise<SpendingAnalysis> {
    // --- 1. Monthly cashflow summaries ----------------------------------------
    const summaries = await prisma.monthlyCashflowSummary.findMany({
        where: { userId },
        orderBy: { month: 'desc' },
        take: months,
    });

    const expenses = summaries.map(s => n(s.totalExpenses));
    const incomes = summaries.map(s => n(s.totalIncome));
    const savings = summaries.map(s => n(s.netSavings));

    const avgExpenses = expenses.length ? expenses.reduce((a, b) => a + b, 0) / expenses.length : 0;
    const avgIncome = incomes.length ? incomes.reduce((a, b) => a + b, 0) / incomes.length : 0;

    // --- 2. Core metrics -------------------------------------------------------
    const monthlyBurnRate = avgExpenses;

    const validSavingsRates = summaries
        .filter(s => n(s.totalIncome) > 0)
        .map(s => n(s.netSavings) / n(s.totalIncome));
    const savingsRate = validSavingsRates.length
        ? validSavingsRates.reduce((a, b) => a + b, 0) / validSavingsRates.length
        : 0;

    const expenseVolatility = avgExpenses > 0 ? stdDev(expenses) / avgExpenses : 0;

    // --- 3. Category breakdown from Transaction table -------------------------
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const txns = await prisma.transaction.findMany({
        where: {
            userId,
            transactionDate: { gte: cutoff },
            transactionType: { not: 'income' },
        },
    });

    const catMap: Record<string, number> = {};
    let totalCatExpenses = 0;
    for (const t of txns) {
        const cat = t.category || 'Uncategorized';
        const amt = Math.abs(n(t.amount));
        catMap[cat] = (catMap[cat] ?? 0) + amt;
        totalCatExpenses += amt;
    }

    const categoryBreakdown = Object.entries(catMap)
        .map(([category, amount]) => ({
            category,
            amount: parseFloat(amount.toFixed(2)),
            percentage: totalCatExpenses > 0 ? parseFloat(((amount / totalCatExpenses) * 100).toFixed(2)) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

    // --- 4. Monthly trend (chronological order) --------------------------------
    const monthlyTrend = [...summaries].reverse().map(s => ({
        month: s.month.toISOString().substring(0, 7),
        income: parseFloat(n(s.totalIncome).toFixed(2)),
        expenses: parseFloat(n(s.totalExpenses).toFixed(2)),
        savings: parseFloat(n(s.netSavings).toFixed(2)),
    }));

    // --- 5. Anomaly detection --------------------------------------------------
    const expMean = avgExpenses;
    const expStd = stdDev(expenses);
    const threshold = expMean + 1.5 * expStd;

    const anomalies = summaries
        .filter(s => n(s.totalExpenses) > threshold)
        .map(s => ({
            month: s.month.toISOString().substring(0, 7),
            amount: parseFloat(n(s.totalExpenses).toFixed(2)),
            deviation: parseFloat(((n(s.totalExpenses) - expMean) / (expStd || 1)).toFixed(2)),
        }));

    // --- 6. Persist to SpendingMetric ------------------------------------------
    try {
        await prisma.spendingMetric.create({
            data: {
                userId,
                monthlyBurnRate: new Decimal(monthlyBurnRate.toFixed(4)),
                savingsRate: new Decimal(savingsRate.toFixed(4)),
                expenseVolatility: new Decimal(expenseVolatility.toFixed(4)),
            },
        });
    } catch (err) {
        logger.warn(`Failed to persist SpendingMetric for user ${userId}: ${err}`);
    }

    return {
        monthlyBurnRate: parseFloat(monthlyBurnRate.toFixed(2)),
        savingsRate: parseFloat(savingsRate.toFixed(4)),
        expenseVolatility: parseFloat(expenseVolatility.toFixed(4)),
        categoryBreakdown,
        monthlyTrend,
        anomalies,
        calculatedAt: new Date().toISOString(),
    };
}
