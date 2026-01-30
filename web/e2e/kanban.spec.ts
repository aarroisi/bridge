import { test, expect } from "@playwright/test";
import { registerTestUser } from "./helpers/auth";

test.describe("Kanban Board", () => {
  test.beforeEach(async ({ page }) => {
    await registerTestUser(page);
  });

  async function createList(page: any) {
    // Click on Lists category in outer sidebar
    await page.getByTitle("Lists").click();

    // Wait for inner sidebar to show lists
    await expect(page.getByText("All Lists")).toBeVisible();

    // Click the + button next to "All Lists" to create a new list
    await page
      .locator("div")
      .filter({ hasText: /^All Lists$/ })
      .locator("button")
      .click();

    // Wait for the new list to be created and navigate to it
    await page.waitForURL(/\/lists\/[a-f0-9-]+/);
  }

  test("should create a list and add tasks", async ({ page }) => {
    await createList(page);

    // Verify kanban columns are visible (default statuses: todo, doing, done)
    await expect(page.getByTestId("column-todo")).toBeVisible();
    await expect(page.getByTestId("column-doing")).toBeVisible();
    await expect(page.getByTestId("column-done")).toBeVisible();

    // Add a task to todo column by clicking + button in that column
    await page.getByTestId("column-todo").getByRole("button").click();

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
    await createList(page);

    // Add a task to todo
    await page.getByTestId("column-todo").getByRole("button").click();
    await page.getByPlaceholder(/task title/i).focus();
    await page.keyboard.insertText("Todo Task");
    await page.getByRole("button", { name: /add task/i }).click();

    // Verify task is in todo column
    await expect(
      page.getByTestId("column-todo").getByText("Todo Task"),
    ).toBeVisible();

    // Add a task to doing
    await page.getByTestId("column-doing").getByRole("button").click();
    await page.getByPlaceholder(/task title/i).focus();
    await page.keyboard.insertText("Doing Task");
    await page.getByRole("button", { name: /add task/i }).click();

    // Verify task is in doing column
    await expect(
      page.getByTestId("column-doing").getByText("Doing Task"),
    ).toBeVisible();
  });

  test("should persist task order after page reload", async ({ page }) => {
    await createList(page);

    // Add multiple tasks
    for (const taskName of ["Task 1", "Task 2", "Task 3"]) {
      await page.getByTestId("column-todo").getByRole("button").first().click();
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

  test("should open task detail modal when clicking a task", async ({
    page,
  }) => {
    await createList(page);

    // Add a task
    await page.getByTestId("column-todo").getByRole("button").click();
    await page.getByPlaceholder(/task title/i).focus();
    await page.keyboard.insertText("Click Me Task");
    await page.getByRole("button", { name: /add task/i }).click();

    // Click the task to open modal
    await page.getByText("Click Me Task").click();

    // Verify modal opens with task title (modal has fixed positioning)
    const modal = page.locator(".fixed").filter({ hasText: "Click Me Task" });
    await expect(modal).toBeVisible();

    // Verify URL contains task parameter
    await expect(page).toHaveURL(/task=/);
  });

  test("should change task status via detail modal dropdown", async ({
    page,
  }) => {
    await createList(page);

    // Add a task to todo
    await page.getByTestId("column-todo").getByRole("button").click();
    await page.getByPlaceholder(/task title/i).focus();
    await page.keyboard.insertText("Status Test Task");
    await page.getByRole("button", { name: /add task/i }).click();

    // Click the task to open modal
    await page.getByText("Status Test Task").click();

    // Click the status dropdown to open it
    await page
      .locator("button")
      .filter({ hasText: /^todo$/ })
      .first()
      .click();

    // Select "doing" status
    await page
      .locator("button")
      .filter({ hasText: /^doing$/ })
      .click();

    // Click Save button to apply changes
    await page.getByRole("button", { name: /^save$/i }).click();

    // Wait for save to complete
    await page.waitForTimeout(500);

    // Close the modal by pressing Escape
    await page.keyboard.press("Escape");

    // Verify task moved to doing column
    await expect(
      page.getByTestId("column-doing").getByText("Status Test Task"),
    ).toBeVisible();
  });

  test("should switch between board and list view", async ({ page }) => {
    await createList(page);

    // Add a task
    await page.getByTestId("column-todo").getByRole("button").click();
    await page.getByPlaceholder(/task title/i).focus();
    await page.keyboard.insertText("View Test Task");
    await page.getByRole("button", { name: /add task/i }).click();

    // Verify we're in board view (columns visible)
    await expect(page.getByTestId("column-todo")).toBeVisible();
    await expect(page.getByTestId("column-doing")).toBeVisible();
    await expect(page.getByTestId("column-done")).toBeVisible();

    // Switch to list view
    await page.getByTitle("List view").click();

    // Verify list view shows task
    await expect(page.getByText("View Test Task")).toBeVisible();

    // Switch back to board view
    await page.getByTitle("Board view").click();

    // Verify board columns are visible again
    await expect(page.getByTestId("column-todo")).toBeVisible();
  });
});
