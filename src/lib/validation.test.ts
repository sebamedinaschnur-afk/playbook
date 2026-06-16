import { describe, it, expect } from "vitest";
import { SchoolCodeSchema, SignupSchema } from "./validation";

describe("SchoolCodeSchema", () => {
  it("trims and uppercases the code", () => {
    const r = SchoolCodeSchema.safeParse({ accessCode: "  canes26 " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.accessCode).toBe("CANES26");
  });

  it("rejects an empty / whitespace-only code", () => {
    expect(SchoolCodeSchema.safeParse({ accessCode: "" }).success).toBe(false);
    expect(SchoolCodeSchema.safeParse({ accessCode: "   " }).success).toBe(false);
  });
});

describe("SignupSchema", () => {
  it("normalises email and treats a blank access code as none (individual path)", () => {
    const r = SignupSchema.safeParse({
      email: "Jordan@Miami.EDU",
      password: "playbook123",
      accessCode: "",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("jordan@miami.edu");
      expect(r.data.accessCode).toBeUndefined();
    }
  });

  it("uppercases a provided access code (school path)", () => {
    const r = SignupSchema.safeParse({
      email: "a@b.com",
      password: "playbook123",
      accessCode: "canes26",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.accessCode).toBe("CANES26");
  });

  it("rejects a too-short password", () => {
    const r = SignupSchema.safeParse({ email: "a@b.com", password: "short" });
    expect(r.success).toBe(false);
  });
});
