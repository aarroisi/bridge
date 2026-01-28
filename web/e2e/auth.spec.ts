import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should load login page", async ({ page }) => {
    await page.goto("/login");

    // Check for login form elements
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("should show register page", async ({ page }) => {
    await page.goto("/register");

    await expect(page.getByLabel("Workspace Name")).toBeVisible();
    await expect(page.getByLabel("Your Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create workspace/i }),
    ).toBeVisible();
  });
});
