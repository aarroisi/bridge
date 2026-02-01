import { Page } from "@playwright/test";

export async function loginAsTestUser(page: Page) {
  // Navigate to login
  await page.goto("/login");

  // Use test credentials (you may need to create this user in your DB)
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("password123");

  // Submit login
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for redirect to home/authenticated page
  await page.waitForURL(/\/(home|projects|docs|boards|$)/);
}

export async function registerTestUser(page: Page) {
  await page.goto("/register");

  const timestamp = Date.now();

  // Use keyboard.insertText for React controlled inputs
  await page.getByLabel("Workspace Name").focus();
  await page.keyboard.insertText(`Test Workspace ${timestamp}`);

  await page.getByLabel("Your Name").focus();
  await page.keyboard.insertText(`Test User ${timestamp}`);

  await page.getByLabel("Email").focus();
  await page.keyboard.insertText(`test${timestamp}@example.com`);

  await page.getByLabel("Password").focus();
  await page.keyboard.insertText("password123");

  await page.getByRole("button", { name: /create workspace/i }).click();

  // Wait for redirect
  await page.waitForURL(/\/(home|projects|docs|boards|$)/);
}
