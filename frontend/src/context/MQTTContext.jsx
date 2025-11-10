/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from "react";
import { useMQTT } from "../hooks/useMQTT.js";

const MQTTContext = createContext(null);

export const MQTTProvider = ({ children }) => {
  const mqtt = useMQTT();
  return <MQTTContext.Provider value={mqtt}>{children}</MQTTContext.Provider>;
};

export const useMQTTContext = () => {
  const context = useContext(MQTTContext);
  if (!context) {
    throw new Error("useMQTTContext must be used within an MQTTProvider");
  }
  return context;
};
