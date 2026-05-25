"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchInvestmentProfile,
  fetchStrategyCatalog,
  fetchStrategyJourney,
  fetchStrategyRecommendations,
  selectStrategy,
  updateInvestmentProfile,
  updateJourneyStep,
} from "@/lib/apiClient";
import type {
  InvestmentStrategy,
  JourneyStepStatus,
  StrategyCatalogItem,
  StrategyRecommendations,
  UserInvestmentProfile,
  UserInvestmentProfileUpdate,
  UserStrategyJourney,
} from "@/app/types/strategy";
import {
  formValuesToUpdate,
  type StrategyFormValues,
} from "@/lib/strategyProfileForm";

type UseStrategyJourneyOptions = {
  enabled?: boolean;
};

export function useStrategyJourney(
  accessToken: string | undefined,
  options: UseStrategyJourneyOptions = {},
) {
  const { enabled = true } = options;

  const [catalog, setCatalog] = useState<StrategyCatalogItem[]>([]);
  const [profile, setProfile] = useState<UserInvestmentProfile | null>(null);
  const [journey, setJourney] = useState<UserStrategyJourney | null>(null);
  const [recommendations, setRecommendations] =
    useState<StrategyRecommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const [catalogData, profileData] = await Promise.all([
        fetchStrategyCatalog(accessToken),
        fetchInvestmentProfile(accessToken),
      ]);
      setCatalog(catalogData);
      setProfile(profileData);

      if (profileData?.primaryStrategy) {
        const [journeyData, recs] = await Promise.all([
          fetchStrategyJourney(accessToken, profileData.primaryStrategy).catch(
            () => null,
          ),
          fetchStrategyRecommendations(
            accessToken,
            profileData.primaryStrategy,
          ).catch(() => null),
        ]);
        setJourney(journeyData);
        setRecommendations(recs);
      } else {
        setJourney(null);
        setRecommendations(null);
      }
    } catch {
      setError("Strategy journey is not available yet.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProfile = useCallback(
    async (update: UserInvestmentProfileUpdate) => {
      if (!accessToken) return null;
      const next = await updateInvestmentProfile(accessToken, update);
      setProfile(next);
      return next;
    },
    [accessToken],
  );

  const chooseStrategy = useCallback(
    async (strategy: InvestmentStrategy) => {
      if (!accessToken) return null;
      const result = await selectStrategy(accessToken, strategy);
      setProfile(result.profile);
      setJourney(result.journey);
      return result;
    },
    [accessToken],
  );

  const completeOnboarding = useCallback(
    async (update: UserInvestmentProfileUpdate) => {
      if (!accessToken) return null;
      const next = await updateInvestmentProfile(accessToken, {
        ...update,
        completeOnboarding: true,
      });
      setProfile(next);
      if (next.primaryStrategy) {
        const [journeyData, recs] = await Promise.all([
          fetchStrategyJourney(accessToken, next.primaryStrategy).catch(
            () => null,
          ),
          fetchStrategyRecommendations(
            accessToken,
            next.primaryStrategy,
          ).catch(() => null),
        ]);
        setJourney(journeyData);
        setRecommendations(recs);
      }
      return next;
    },
    [accessToken],
  );

  const markStep = useCallback(
    async (
      stepId: string,
      status: JourneyStepStatus,
      metadata?: Record<string, unknown>,
    ) => {
      if (!accessToken || !profile?.primaryStrategy) return null;
      const next = await updateJourneyStep(
        accessToken,
        profile.primaryStrategy,
        stepId,
        { status, metadata },
      );
      setJourney(next);
      return next;
    },
    [accessToken, profile?.primaryStrategy],
  );

  const refreshRecommendations = useCallback(async () => {
    if (!accessToken || !profile?.primaryStrategy) return;
    const recs = await fetchStrategyRecommendations(
      accessToken,
      profile.primaryStrategy,
    );
    setRecommendations(recs);
  }, [accessToken, profile?.primaryStrategy]);

  const saveStrategySettings = useCallback(
    async (values: StrategyFormValues) => {
      if (!accessToken || !values.primaryStrategy) return null;

      const update = formValuesToUpdate(values);
      const strategyChanged =
        profile?.primaryStrategy != null &&
        profile.primaryStrategy !== values.primaryStrategy;

      if (strategyChanged || !profile?.primaryStrategy) {
        await selectStrategy(accessToken, values.primaryStrategy);
      }

      const next = await updateInvestmentProfile(accessToken, update);
      setProfile(next);

      const [journeyData, recs] = await Promise.all([
        fetchStrategyJourney(accessToken, values.primaryStrategy).catch(
          () => null,
        ),
        fetchStrategyRecommendations(
          accessToken,
          values.primaryStrategy,
        ).catch(() => null),
      ]);
      setJourney(journeyData);
      setRecommendations(recs);

      return next;
    },
    [accessToken, profile?.primaryStrategy],
  );

  const needsOnboarding = !profile?.onboardingCompletedAt;

  return {
    catalog,
    profile,
    journey,
    recommendations,
    loading,
    error,
    needsOnboarding,
    refetch: load,
    saveProfile,
    chooseStrategy,
    completeOnboarding,
    markStep,
    refreshRecommendations,
    saveStrategySettings,
  };
}
