"use client";

import { ReactNode } from "react";

export function ResponsiveTableWrapper({
  children,
  mobileCards,
}: {
  children: ReactNode;
  mobileCards: ReactNode;
}) {
  return (
    <>
      <div className="hidden md:block">{children}</div>
      <div className="md:hidden space-y-3">{mobileCards}</div>
    </>
  );
}
