/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import { useRealtimeSensor } from "../hooks/useRealtimeSensor";

const RealtimeContext = createContext(null);

export const RealtimeProvider = ({ children }) => {
  const realtime = useRealtimeSensor();
  return (
    <RealtimeContext.Provider value={realtime}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtimeContext = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtimeContext must be used within RealtimeProvider");
  }
  return context;
};
