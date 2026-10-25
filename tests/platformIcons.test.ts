import { describe, it, expect } from "vitest";
import React from "react";
import { Terminal, Smartphone, Apple, Gamepad2, Monitor } from "lucide-react";
import {
  getPlatformType,
  getPlatformIconComponent,
  WindowsIcon,
  PlatformIcon,
} from "../lib/platformIcons";

describe("lib/platformIcons", () => {
  describe("getPlatformType", () => {
    it("identifies Linux platforms", () => {
      expect(getPlatformType("Linux")).toBe("linux");
      expect(getPlatformType("GNU/Linux")).toBe("linux");
      expect(getPlatformType("linux x86_64")).toBe("linux");
    });

    it("identifies Android platforms", () => {
      expect(getPlatformType("Android")).toBe("android");
      expect(getPlatformType("android arm64")).toBe("android");
    });

    it("identifies macOS platforms", () => {
      expect(getPlatformType("macOS")).toBe("macos");
      expect(getPlatformType("Mac OS X")).toBe("macos");
      expect(getPlatformType("mac")).toBe("macos");
      expect(getPlatformType("Apple Silicon")).toBe("macos");
    });

    it("identifies Steam Deck platforms", () => {
      expect(getPlatformType("Steam Deck")).toBe("steamdeck");
      expect(getPlatformType("steamdeck")).toBe("steamdeck");
      expect(getPlatformType("Deck")).toBe("steamdeck");
    });

    it("identifies Windows platforms", () => {
      expect(getPlatformType("Windows")).toBe("windows");
      expect(getPlatformType("win32")).toBe("windows");
      expect(getPlatformType("Win64")).toBe("windows");
      expect(getPlatformType("Windows 10/11")).toBe("windows");
      expect(getPlatformType("PC")).toBe("windows");
    });

    it("falls back to generic platform for unknown platforms", () => {
      expect(getPlatformType("Nintendo Switch")).toBe("fallback");
      expect(getPlatformType("Web")).toBe("fallback");
      expect(getPlatformType("PlayStation Vita")).toBe("fallback");
      expect(getPlatformType("Raspberry Pi")).toBe("fallback");
      expect(getPlatformType("")).toBe("fallback");
    });
  });

  describe("getPlatformIconComponent", () => {
    it("returns Terminal for Linux", () => {
      expect(getPlatformIconComponent("Linux")).toBe(Terminal);
    });

    it("returns Smartphone for Android", () => {
      expect(getPlatformIconComponent("Android")).toBe(Smartphone);
    });

    it("returns Apple for macOS", () => {
      expect(getPlatformIconComponent("macOS")).toBe(Apple);
    });

    it("returns Gamepad2 for Steam Deck", () => {
      expect(getPlatformIconComponent("Steam Deck")).toBe(Gamepad2);
    });

    it("returns WindowsIcon for Windows", () => {
      expect(getPlatformIconComponent("Windows")).toBe(WindowsIcon);
    });

    it("returns Monitor for unknown platforms", () => {
      expect(getPlatformIconComponent("Web")).toBe(Monitor);
      expect(getPlatformIconComponent("Switch")).toBe(Monitor);
      expect(getPlatformIconComponent("UnknownOS")).toBe(Monitor);
    });
  });

  describe("PlatformIcon component", () => {
    it("creates an element with platform name as tooltip and aria-label", () => {
      const element = PlatformIcon({ platform: "Linux" });
      expect(element).toBeDefined();
      expect(element.props.title).toBe("Linux");
      expect(element.props["aria-label"]).toBe("Linux");
      expect(element.type).toBe(Terminal);
    });

    it("creates Windows icon element for Windows", () => {
      const element = PlatformIcon({ platform: "Windows" });
      expect(element.type).toBe(WindowsIcon);
      expect(element.props.title).toBe("Windows");
      expect(element.props["aria-label"]).toBe("Windows");
    });

    it("creates Monitor fallback element for unknown platform with its name as tooltip", () => {
      const element = PlatformIcon({ platform: "Wii U" });
      expect(element.type).toBe(Monitor);
      expect(element.props.title).toBe("Wii U");
      expect(element.props["aria-label"]).toBe("Wii U");
    });
  });
});
