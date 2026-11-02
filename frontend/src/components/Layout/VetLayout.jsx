import React from 'react';
import { AppShell } from './AppShell';

export const VetLayout = ({ children }) => {
  return <AppShell roleOverride="VETERINARIAN">{children}</AppShell>;
};

export default VetLayout;
