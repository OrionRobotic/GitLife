import { useContext } from "react";
import { GoalsContext } from "@/context/GoalsContext";

export const useGoals = () => {
  const context = useContext(GoalsContext);
  if (context === undefined) {
    throw new Error("useGoals must be used within a GoalsProvider");
  }
  return context;
};
