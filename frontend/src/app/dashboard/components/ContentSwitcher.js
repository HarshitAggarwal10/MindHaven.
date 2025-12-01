"use client";

import React from "react";
import ActivitiesSection from "./sections/ActivitiesSection";
import DiarySection from "./sections/DiarySection";
import MoodSection from "./sections/MoodSection";
import CommunitySection from "./sections/CommunitySection";
import TherapySection from "./sections/TherapySection";
import CampsSection from "./sections/CampsSection";
import CompanionSection from "./sections/CompanionSection";
import HabitsSection from "./sections/HabitsSection";
import ArtSection from "./sections/ArtSection";
import MeditationSection from "./sections/MeditationSection";

/**
 * Simple mapping — returns the appropriate section component.
 * Each section is already styled and animated.
 */
export default function ContentSwitcher({ selected }) {
  switch (selected) {
    case "diary": return <DiarySection />;
    case "mood": return <MoodSection />;
    case "community": return <CommunitySection />;
    case "therapy": return <TherapySection />;
    case "camps": return <CampsSection />;
    case "companion": return <CompanionSection />;
    case "habits": return <HabitsSection />;
    case "art": return <ArtSection />;
    case "meditation": return <MeditationSection />;
    case "activities":
    default:
      return <ActivitiesSection />;
  }
}
