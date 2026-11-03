import type { Request, Response } from "express";
import { expect, it, vi } from "vitest";
import { handleError } from "../src/middleware/errors";

it("delegates a late error without attempting to write a second response", () => {
  const error = new Error("stream interrupted");
  const status = vi.fn();
  const json = vi.fn();
  const next = vi.fn();
  const response = { headersSent: true, status, json } as unknown as Response;

  handleError(error, {} as Request, response, next);

  expect(next).toHaveBeenCalledExactlyOnceWith(error);
  expect(status).not.toHaveBeenCalled();
  expect(json).not.toHaveBeenCalled();
});

it("preserves the existing error response before headers are sent", () => {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const next = vi.fn();
  const response = { headersSent: false, status } as unknown as Response;
  const error = Object.assign(new Error("Studio not found"), { status: 404 });

  handleError(error, {} as Request, response, next);

  expect(status).toHaveBeenCalledExactlyOnceWith(404);
  expect(json).toHaveBeenCalledExactlyOnceWith({ message: "Studio not found" });
  expect(next).not.toHaveBeenCalled();
});
