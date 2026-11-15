import React from 'react';
import { AppShell } from './AppShell';

export const MainLayout = ({ children }) => {
  return <AppShell>{children}</AppShell>;
};

export default MainLayout;
