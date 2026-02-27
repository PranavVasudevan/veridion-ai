import { prisma } from '../../infrastructure/prisma/client';
import { Prisma } from '@prisma/client';

export const userService = {
    /**
     * Get the full user profile including financial details.
     */
    async getProfile(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });

        if (!user) return null;

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt.toISOString(),
            profile: user.profile
                ? {
                    annualIncome: user.profile.annualIncome?.toNumber() ?? null,
                    totalSavings: user.profile.totalSavings?.toNumber() ?? null,
                    totalDebt: user.profile.totalDebt?.toNumber() ?? null,
                    monthlyExpenses: user.profile.monthlyExpenses?.toNumber() ?? null,
                    riskTolerance: user.profile.riskTolerance?.toNumber() ?? null,
                    investmentGoal: user.profile.investmentGoal,
                    investmentHorizon: user.profile.investmentHorizon,
                    occupation: user.profile.occupation,
                    country: user.profile.country,
                    dateOfBirth: user.profile.dateOfBirth
                        ? user.profile.dateOfBirth.toISOString().split('T')[0]
                        : null,
                }
                : null,
        };
    },

    /**
     * Update user name and/or financial profile.
     * Creates the UserProfile if it doesn't exist yet.
     */
    async updateProfile(
        userId: number,
        data: {
            name?: string;
            annualIncome?: number;
            totalSavings?: number;
            totalDebt?: number;
            monthlyExpenses?: number;
            riskTolerance?: number;
            investmentGoal?: string;
            investmentHorizon?: number;
            occupation?: string;
            country?: string;
            dateOfBirth?: string;
        },
    ) {
        // Update user-level fields (name)
        if (data.name !== undefined) {
            await prisma.user.update({
                where: { id: userId },
                data: { name: data.name },
            });
        }

        // Build profile upsert data
        const profileData: any = { updatedAt: new Date() };
        if (data.annualIncome !== undefined) profileData.annualIncome = new Prisma.Decimal(data.annualIncome);
        if (data.totalSavings !== undefined) profileData.totalSavings = new Prisma.Decimal(data.totalSavings);
        if (data.totalDebt !== undefined) profileData.totalDebt = new Prisma.Decimal(data.totalDebt);
        if (data.monthlyExpenses !== undefined) profileData.monthlyExpenses = new Prisma.Decimal(data.monthlyExpenses);
        if (data.riskTolerance !== undefined) profileData.riskTolerance = new Prisma.Decimal(data.riskTolerance);
        if (data.investmentGoal !== undefined) profileData.investmentGoal = data.investmentGoal;
        if (data.investmentHorizon !== undefined) profileData.investmentHorizon = data.investmentHorizon;
        if (data.occupation !== undefined) profileData.occupation = data.occupation;
        if (data.country !== undefined) profileData.country = data.country;
        if (data.dateOfBirth !== undefined) profileData.dateOfBirth = new Date(data.dateOfBirth);

        // Upsert: create if not exists, update if exists
        await prisma.userProfile.upsert({
            where: { userId },
            create: { userId, ...profileData },
            update: profileData,
        });

        return this.getProfile(userId);
    },
};
