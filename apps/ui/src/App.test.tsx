import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Capability map slice", () => {
  it("renders hierarchy sections", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Analytics" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Activities" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
  });

  it("updates detail panel when selecting a function", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Deduplicate imported activities/i }));

    expect(screen.getByRole("heading", { name: "Deduplicate imported activities" })).toBeInTheDocument();
    expect(screen.getByText("Activities / Strava Import")).toBeInTheDocument();
  });

  it("shows linked test cases for selected function", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Calculate FTP estimate/i }));

    expect(screen.getByRole("table", { name: "Associated test cases" })).toBeInTheDocument();
    expect(screen.getByText("Valid FTP estimate payload")).toBeInTheDocument();
    expect(screen.getByText("Missing power curve")).toBeInTheDocument();
  });

  it("handles missing optional fields without crashing", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Show FTP trend chart/i }));

    expect(screen.getByText("No long description provided yet.")).toBeInTheDocument();
    expect(screen.getByText("No known risks recorded.")).toBeInTheDocument();
  });
});
