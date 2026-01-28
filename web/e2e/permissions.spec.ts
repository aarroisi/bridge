import { test, expect } from "@playwright/test";
import { registerTestUser } from "./helpers/auth";

test.describe("Permissions", () => {
  test.describe("Owner permissions", () => {
    test.beforeEach(async ({ page }) => {
      // Register creates an owner
      await registerTestUser(page);
    });

    test("owner should see workspace members button in sidebar", async ({
      page,
    }) => {
      // The workspace members button should be visible for owners
      const membersButton = page.locator('button[title="Workspace Members"]');
      await expect(membersButton).toBeVisible();
    });

    test("owner can access workspace members page", async ({ page }) => {
      // Click on workspace members button
      const membersButton = page.locator('button[title="Workspace Members"]');
      await membersButton.click();

      // Should navigate to members page
      await page.waitForURL(/\/members/);

      // Should see the page header
      await expect(
        page.getByRole("heading", { name: "Workspace Members" }),
      ).toBeVisible();

      // Should see invite button
      await expect(
        page.getByRole("button", { name: /invite member/i }),
      ).toBeVisible();
    });

    test("owner should see themselves in members list with owner role", async ({
      page,
    }) => {
      // Navigate to members page
      await page.locator('button[title="Workspace Members"]').click();
      await page.waitForURL(/\/members/);

      // Should see (you) indicator
      await expect(page.getByText("(you)")).toBeVisible();

      // Should see Owner badge
      await expect(page.locator("span", { hasText: "Owner" })).toBeVisible();
    });

    test("owner can open invite member modal", async ({ page }) => {
      // Navigate to members page
      await page.locator('button[title="Workspace Members"]').click();
      await page.waitForURL(/\/members/);

      // Click invite button
      await page.getByRole("button", { name: /invite member/i }).click();

      // Modal should be visible
      await expect(
        page.getByRole("heading", { name: "Invite New Member" }),
      ).toBeVisible();

      // Should have name, email, password, role fields
      await expect(page.getByLabel("Name")).toBeVisible();
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Password")).toBeVisible();
      await expect(page.getByLabel("Role")).toBeVisible();
    });

    test("owner can invite a new member", async ({ page }) => {
      // Navigate to members page
      await page.locator('button[title="Workspace Members"]').click();
      await page.waitForURL(/\/members/);

      // Click invite button
      await page.getByRole("button", { name: /invite member/i }).click();

      // Fill in the form
      const timestamp = Date.now();
      await page.getByLabel("Name").click();
      await page.keyboard.insertText(`New Member ${timestamp}`);

      await page.getByLabel("Email").click();
      await page.keyboard.insertText(`member${timestamp}@example.com`);

      await page.getByLabel("Password").click();
      await page.keyboard.insertText("password123");

      // Select member role
      await page.getByLabel("Role").selectOption("member");

      // Submit
      await page.getByRole("button", { name: "Invite", exact: true }).click();

      // Modal should close
      await expect(
        page.getByRole("heading", { name: "Invite New Member" }),
      ).not.toBeVisible();

      // New member should appear in list
      await expect(page.getByText(`New Member ${timestamp}`)).toBeVisible();

      // Should see success toast
      await expect(page.getByText("Member invited successfully")).toBeVisible();
    });
  });

  test.describe("Role display", () => {
    test("role badge shows correct colors", async ({ page }) => {
      await registerTestUser(page);

      // Navigate to members page
      await page.locator('button[title="Workspace Members"]').click();
      await page.waitForURL(/\/members/);

      // Owner badge should have purple styling
      const ownerBadge = page.locator("span", { hasText: "Owner" });
      await expect(ownerBadge).toHaveClass(/purple/);
    });
  });
});
