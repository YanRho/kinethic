"use client";

import { CSSProperties, ReactNode, createContext, useContext } from "react";

const ProfileThemeContext = createContext<CSSProperties | undefined>(undefined);

export function ProfileThemeProvider({
  style,
  children,
}: {
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <ProfileThemeContext.Provider value={style}>
      {children}
    </ProfileThemeContext.Provider>
  );
}

export function useProfileThemeStyle() {
  return useContext(ProfileThemeContext);
}
