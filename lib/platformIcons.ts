import React from "react";
import { Terminal, Smartphone, Apple, Gamepad2, Monitor } from "lucide-react";

export type PlatformType =
  | "windows"
  | "linux"
  | "android"
  | "macos"
  | "steamdeck"
  | "fallback";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
  title?: string;
}

/**
 * Custom inline SVG for Windows since Lucide does not have a Windows icon.
 */
export function WindowsIcon({
  className = "w-4 h-4",
  ...props
}: IconProps) {
  return React.createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "currentColor",
      className,
      "aria-hidden": "true",
      ...props,
    },
    React.createElement("path", {
      d: "M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.951",
    })
  );
}

/**
 * Mapping from resolved platform type to corresponding icon component.
 */
export const PLATFORM_ICON_MAP: Record<
  PlatformType,
  React.ComponentType<any>
> = {
  windows: WindowsIcon,
  linux: Terminal,
  android: Smartphone,
  macos: Apple,
  steamdeck: Gamepad2,
  fallback: Monitor,
};

/**
 * Resolves a platform name string to a canonical PlatformType.
 */
export function getPlatformType(platform: string): PlatformType {
  if (!platform || typeof platform !== "string") {
    return "fallback";
  }

  const normalized = platform.trim().toLowerCase();

  // Steam Deck check before generic Linux check
  if (
    normalized.includes("steam deck") ||
    normalized.includes("steamdeck") ||
    normalized === "deck"
  ) {
    return "steamdeck";
  }

  if (normalized.includes("linux")) {
    return "linux";
  }

  if (normalized.includes("android")) {
    return "android";
  }

  if (
    normalized.includes("mac") ||
    normalized.includes("apple") ||
    normalized.includes("darwin") ||
    normalized.includes("os x")
  ) {
    return "macos";
  }

  if (
    normalized.includes("win") ||
    normalized === "pc" ||
    normalized.includes("dos")
  ) {
    return "windows";
  }

  return "fallback";
}

/**
 * Returns the icon component for a given platform name.
 */
export function getPlatformIconComponent(
  platform: string
): React.ComponentType<any> {
  const type = getPlatformType(platform);
  return PLATFORM_ICON_MAP[type];
}

export interface PlatformIconProps extends IconProps {
  platform: string;
  showTooltip?: boolean;
  title?: string;
}

/**
 * Renders the platform icon with tooltip (title) and aria-label matching the platform name.
 * Unknown platforms fall back to Monitor icon with their name as tooltip.
 */
export function PlatformIcon({
  platform,
  className = "w-4 h-4",
  showTooltip = true,
  title,
  ...props
}: PlatformIconProps) {
  const IconComponent = getPlatformIconComponent(platform);
  const tooltipText = title !== undefined ? title : platform;

  return React.createElement(IconComponent, {
    className,
    title: showTooltip ? tooltipText : undefined,
    "aria-label": tooltipText,
    ...props,
  });
}
