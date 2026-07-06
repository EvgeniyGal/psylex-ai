"use client";

import { createContext, useContext } from "react";
import type { ParticipantFlowStepId } from "@/lib/participant-flow";

const ParticipantFlowProgressContext = createContext<ParticipantFlowStepId>(0);

type ParticipantFlowProgressProviderProps = {
  maxReachedStep: ParticipantFlowStepId;
  children: React.ReactNode;
};

export function ParticipantFlowProgressProvider({
  maxReachedStep,
  children,
}: ParticipantFlowProgressProviderProps) {
  return (
    <ParticipantFlowProgressContext.Provider value={maxReachedStep}>
      {children}
    </ParticipantFlowProgressContext.Provider>
  );
}

export function useParticipantFlowProgress() {
  return useContext(ParticipantFlowProgressContext);
}
