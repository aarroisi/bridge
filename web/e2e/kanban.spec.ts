import { test, expect } from "@playwright/test";
import { registerTestUser } from "./helpers/auth";

test.describe("Kanban Board", () => {
  test.beforeEach(async ({ page }) => {
    await registerTestUser(page);
  });

  test("should create a list and add tasks", async ({ page }) => {
    // Expand the Lists section in sidebar and click the + button next to "Lists"
    await page.getByText("Lists").first().click();

    // Click the + button next to the Lists header to create a new list
    const listsSection = page
      .locator("div")
      .filter({ hasText: /^Lists/ })
      .first();
    await listsSection
      .locator("button")
      .filter({ has: page.locator("svg") })
      .click();

    // Wait for the new list to be created and navigate to it
    await page.waitForURL(/\/lists\/[a-f0-9-]+/);

    // Verify kanban columns are visible (default statuses: todo, doing, done)
    await expect(page.getByText("todo")).toBeVisible();
    await expect(page.getByText("doing")).toBeVisible();
    await expect(page.getByText("done")).toBeVisible();

    // Add a task to todo column by clicking + button in that column
    await page
      .locator("div")
      .filter({ hasText: /^todo/ })
      .getByRole("button")
      .click();

    // Fill in task title in modal
    const taskInput = page.getByPlaceholder(/task title/i);
    await taskInput.focus();
    await page.keyboard.insertText("My First Task");
    await page.getByRole("button", { name: /add task/i }).click();

    // Verify task appears
    await expect(page.getByText("My First Task")).toBeVisible();
  });

  test("should display tasks in correct columns based on status", async ({
    page,
  }) => {
    // Navigate to lists and create a list
    await page.getByRole("button", { name: /lists/i }).click();
    await page.getByRole("button", { name: /\+/ }).first().click();
    const listNameInput = page.getByPlaceholder(/name/i);
    await listNameInput.focus();
    await page.keyboard.insertText("Status Test Board");
    await page.getByRole("button", { name: /create/i }).click();
    await page.waitForURL(/\/lists\/[a-f0-9-]+/);

    // Add a task to To Do
    await page
      .locator("div")
      .filter({ hasText: /^To Do/ })
      .getByRole("button")
      .click();
    await page.getByPlaceholder(/task title/i).focus();
    await page.keyboard.insertText("Todo Task");
    await page.getByRole("button", { name: /add task/i }).click();

    // Verify task is in To Do column
    const todoColumn = page
      .locator("div")
      .filter({ hasText: /^To Do/ })
      .first();
    await expect(todoColumn.getByText("Todo Task")).toBeVisible();

    // Add a task to Doing
    await page
      .locator("div")
      .filter({ hasText: /^Doing/ })
      .getByRole("button")
      .click();
    await page.getByPlaceholder(/task title/i).focus();
    await page.keyboard.insertText("Doing Task");
    await page.getByRole("button", { name: /add task/i }).click();

    // Verify task is in Doing column
    const doingColumn = page
      .locator("div")
      .filter({ hasText: /^Doing/ })
      .first();
    await expect(doingColumn.getByText("Doing Task")).toBeVisible();
  });

  test("should persist task order after page reload", async ({ page }) => {
    // Navigate to lists and create a list
    await page.getByRole("button", { name: /lists/i }).click();
    await page.getByRole("button", { name: /\+/ }).first().click();
    const listNameInput = page.getByPlaceholder(/name/i);
    await listNameInput.focus();
    await page.keyboard.insertText("Persistence Test Board");
    await page.getByRole("button", { name: /create/i }).click();
    await page.waitForURL(/\/lists\/[a-f0-9-]+/);

    // Add multiple tasks
    for (const taskName of ["Task 1", "Task 2", "Task 3"]) {
      await page
        .locator("div")
        .filter({ hasText: /^To Do/ })
        .getByRole("button")
        .click();
      await page.getByPlaceholder(/task title/i).focus();
      await page.keyboard.insertText(taskName);
      await page.getByRole("button", { name: /add task/i }).click();
      await page.waitForTimeout(300); // Wait for task to be created
    }

    // Verify all tasks are visible
    await expect(page.getByText("Task 1")).toBeVisible();
    await expect(page.getByText("Task 2")).toBeVisible();
    await expect(page.getByText("Task 3")).toBeVisible();

    // Reload the page
    await page.reload();

    // Verify tasks are still visible after reload
    await expect(page.getByText("Task 1")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Task 2")).toBeVisible();
    await expect(page.getByText("Task 3")).toBeVisible();
  });

  test("should open task detail panel when clicking a task", async ({
    page,
  }) => {
    // Navigate to lists and create a list
    await page.getByRole("button", { name: /lists/i }).click();
    await page.getByRole("button", { name: /\+/ }).first().click();
    const listNameInput = page.getByPlaceholder(/name/i);
    await listNameInput.focus();
    await page.keyboard.insertText("Detail Panel Test");
    await page.getByRole("button", { name: /create/i }).click();
    await page.waitForURL(/\/lists\/[a-f0-9-]+/);

    // Add a task
    await page
      .locator("div")
      .filter({ hasText: /^To Do/ })
      .getByRole("button")
      .click();
    await page.getByPlaceholder(/task title/i).focus();
    await page.keyboard.insertText("Click Me Task");
    await page.getByRole("button", { name: /add task/i }).click();

    // Click the task
    await page.getByText("Click Me Task").click();

    // Verify detail panel opens with task title
    const detailPanel = page.locator('[class*="border-l"]').last();
    await expect(detailPanel.getByText("Click Me Task")).toBeVisible();
  });

  test("should change task status via detail panel buttons", async ({
    page,
  }) => {
    // Navigate to lists and create a list
    await page.getByRole("button", { name: /lists/i }).click();
    await page.getByRole("button", { name: /\+/ }).first().click();
    const listNameInput = page.getByPlaceholder(/name/i);
    await listNameInput.focus();
    await page.keyboard.insertText("Status Change Test");
    await page.getByRole("button", { name: /create/i }).click();
    await page.waitForURL(/\/lists\/[a-f0-9-]+/);

    // Add a task to To Do
    await page
      .locator("div")
      .filter({ hasText: /^To Do/ })
      .getByRole("button")
      .click();
    await page.getByPlaceholder(/task title/i).focus();
    await page.keyboard.insertText("Status Test Task");
    await page.getByRole("button", { name: /add task/i }).click();

    // Click the task to open detail panel
    await page.getByText("Status Test Task").click();

    // Click "Doing" status button in detail panel
    await page.getByRole("button", { name: /^doing$/i }).click();

    // Wait for status update
    await page.waitForTimeout(500);

    // Close the panel
    await page.keyboard.press("Escape");

    // Verify task moved to Doing column
    const doingColumn = page
      .locator("div")
      .filter({ hasText: /^Doing/ })
      .first();
    await expect(doingColumn.getByText("Status Test Task")).toBeVisible();
  });

  test("should switch between board and list view", async ({ page }) => {
    // Navigate to lists and create a list
    await page.getByRole("button", { name: /lists/i }).click();
    await page.getByRole("button", { name: /\+/ }).first().click();
    const listNameInput = page.getByPlaceholder(/name/i);
    await listNameInput.focus();
    await page.keyboard.insertText("View Toggle Test");
    await page.getByRole("button", { name: /create/i }).click();
    await page.waitForURL(/\/lists\/[a-f0-9-]+/);

    // Add a task
    await page
      .locator("div")
      .filter({ hasText: /^To Do/ })
      .getByRole("button")
      .click();
    await page.getByPlaceholder(/task title/i).focus();
    await page.keyboard.insertText("View Test Task");
    await page.getByRole("button", { name: /add task/i }).click();

    // Verify we're in board view (columns visible)
    await expect(page.getByText("To Do")).toBeVisible();
    await expect(page.getByText("Doing")).toBeVisible();
    await expect(page.getByText("Done")).toBeVisible();

    // Switch to list view
    await page.getByTitle("List view").click();

    // Verify list view shows task
    await expect(page.getByText("View Test Task")).toBeVisible();

    // Switch back to board view
    await page.getByTitle("Board view").click();

    // Verify board columns are visible again
    await expect(page.getByText("To Do")).toBeVisible();
  });
});
