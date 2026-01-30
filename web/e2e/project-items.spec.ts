import { test, expect } from "@playwright/test";
import { registerTestUser } from "./helpers/auth";

test.describe("Project Items", () => {
  test.beforeEach(async ({ page }) => {
    await registerTestUser(page);
  });

  test("should create a project and add a doc to it", async ({ page }) => {
    // Navigate to projects
    await page.goto("/projects");

    // Click create project button
    await page.getByRole("button", { name: /create project/i }).click();

    // Fill in project name using keyboard.insertText for React controlled inputs
    const projectNameInput = page.getByPlaceholder(/project name/i);
    await projectNameInput.click();
    await page.keyboard.insertText("Test Project");

    // Submit project creation
    await page
      .getByRole("button", { name: /create project/i })
      .last()
      .click();

    // Should redirect to project page with nested URL
    await page.waitForURL(/\/projects\/[a-f0-9-]+$/);

    // Verify project name is visible in the heading
    await expect(
      page.getByRole("heading", { name: "Test Project" }),
    ).toBeVisible();

    // Click "Add Doc" to create a doc for this project
    await page.getByRole("button", { name: /add doc/i }).click();

    // Should navigate to new doc page with nested project URL
    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+\/docs\/new/);

    // Verify Projects icon is still highlighted (blue background)
    const projectsButton = page.locator('[title="Projects"]');
    await expect(projectsButton).toHaveClass(/bg-blue-600/);

    // Fill in doc title
    const titleInput = page.getByPlaceholder(/title/i);
    await titleInput.click();
    await page.keyboard.insertText("Project Doc");

    // Add content
    const editor = page.locator(".ProseMirror").first();
    await editor.click();
    await editor.fill("This doc belongs to the project");

    // Save the doc
    await page.getByRole("button", { name: /save/i }).first().click();
    await page
      .getByRole("button", { name: /^save$/i })
      .last()
      .click();

    // Should redirect to doc view with nested project URL
    await page.waitForURL(/\/projects\/[a-f0-9-]+\/docs\/[a-f0-9-]+$/);

    // Verify doc title is visible in the input
    await expect(page.locator('input[value="Project Doc"]')).toBeVisible();
  });

  test("should show doc under project in sidebar and highlight when clicked", async ({
    page,
  }) => {
    // Create a project first
    await page.goto("/projects");
    await page.getByRole("button", { name: /create project/i }).click();
    const projectNameInput = page.getByPlaceholder(/project name/i);
    await projectNameInput.click();
    await page.keyboard.insertText("Sidebar Test Project");
    await page
      .getByRole("button", { name: /create project/i })
      .last()
      .click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+$/);

    // Add a doc to the project
    await page.getByRole("button", { name: /add doc/i }).click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+\/docs\/new/);
    const titleInput = page.locator('input[placeholder="Add a title..."]');
    await titleInput.click();
    await page.keyboard.insertText("Sidebar Test Doc");
    await page
      .getByRole("button", { name: /^save$/i })
      .first()
      .click();
    await page
      .getByRole("button", { name: /^save$/i })
      .last()
      .click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+\/docs\/[a-f0-9-]+$/);

    // Navigate to projects list to see sidebar
    await page.click('[title="Projects"]');
    await page.waitForURL("/projects");

    // Click on the project in sidebar to expand it and show items
    const sidebar = page.locator('[class*="w-52"]');
    await sidebar.getByText("Sidebar Test Project").click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+$/);

    // Verify doc is visible under project in sidebar
    await expect(sidebar.getByText("Sidebar Test Doc")).toBeVisible();

    // Click on the doc in the sidebar
    await sidebar.getByText("Sidebar Test Doc").click();

    // URL should be nested under project
    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+\/docs\/[a-f0-9-]+/);

    // The projects icon should still be highlighted
    const projectsButton = page.locator('[title="Projects"]');
    await expect(projectsButton).toHaveClass(/bg-blue-600/);

    // The doc should be highlighted in sidebar (has text-blue-400 class)
    const docButton = sidebar.getByText("Sidebar Test Doc");
    await expect(docButton.locator("..")).toHaveClass(/text-blue-400/);
  });

  test("should not show project items in workspace-level Docs section", async ({
    page,
  }) => {
    // Create a project with a doc
    await page.goto("/projects");
    await page.getByRole("button", { name: /create project/i }).click();
    const projectNameInput = page.getByPlaceholder(/project name/i);
    await projectNameInput.click();
    await page.keyboard.insertText("Filter Test Project");
    await page
      .getByRole("button", { name: /create project/i })
      .last()
      .click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+$/);

    // Add a doc to the project
    await page.getByRole("button", { name: /add doc/i }).click();
    const titleInput = page.getByPlaceholder(/title/i);
    await titleInput.click();
    await page.keyboard.insertText("Project Only Doc");
    await page.getByRole("button", { name: /save/i }).first().click();
    await page
      .getByRole("button", { name: /^save$/i })
      .last()
      .click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+\/docs\/[a-f0-9-]+$/);

    // Now navigate to Docs section
    await page.click('[title="Docs"]');
    await page.waitForURL("/docs");

    // The sidebar should NOT show the project doc
    const sidebar = page.locator('[class*="w-52"]');
    await expect(sidebar.getByText("Project Only Doc")).not.toBeVisible();
  });

  test("should create list and channel in project with correct URLs", async ({
    page,
  }) => {
    // Create a project
    await page.goto("/projects");
    await page.getByRole("button", { name: /create project/i }).click();
    const projectNameInput = page.getByPlaceholder(/project name/i);
    await projectNameInput.click();
    await page.keyboard.insertText("Multi Item Project");
    await page
      .getByRole("button", { name: /create project/i })
      .last()
      .click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+$/);

    // Store the project URL for later
    const projectUrl = page.url();

    // Add a list
    await page.getByRole("button", { name: /add list/i }).click();

    // Should redirect to the new list with nested URL
    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+\/lists\/[a-f0-9-]+/);

    // Projects icon should still be highlighted
    let projectsButton = page.locator('[title="Projects"]');
    await expect(projectsButton).toHaveClass(/bg-blue-600/);

    // Go back to project page
    await page.goto(projectUrl);
    await page.waitForURL(/\/projects\/[a-f0-9-]+$/);

    // Verify list is shown in project page
    await expect(page.getByText("New List").first()).toBeVisible();

    // Add a channel via the dropdown menu (use exact match for the main Add Item button)
    await page.getByRole("button", { name: "Add Item", exact: true }).click();
    // Wait for menu to appear
    await expect(
      page.getByRole("button", { name: /new channel/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /new channel/i }).click();

    // Should redirect to the new channel with nested URL
    await page.waitForURL(/\/projects\/[a-f0-9-]+\/channels\/[a-f0-9-]+/);

    // Projects icon should still be highlighted
    projectsButton = page.locator('[title="Projects"]');
    await expect(projectsButton).toHaveClass(/bg-blue-600/);

    // Go back to project page
    await page.goto(projectUrl);

    // Verify both items are in the sidebar under the project
    const sidebar = page.locator('[class*="w-52"]');
    await expect(sidebar.getByText("New List")).toBeVisible();
    await expect(sidebar.getByText("new-channel")).toBeVisible();
  });

  test("workspace-level items should use regular URLs, not nested", async ({
    page,
  }) => {
    // Create a workspace-level doc (not in a project)
    await page.goto("/docs/new");

    const titleInput = page.getByPlaceholder(/title/i);
    await titleInput.click();
    await page.keyboard.insertText("Workspace Doc");

    await page.getByRole("button", { name: /save/i }).first().click();
    await page
      .getByRole("button", { name: /^save$/i })
      .last()
      .click();

    // Should redirect to regular doc URL (not nested under project)
    await page.waitForURL(/\/docs\/[a-f0-9-]+$/);

    // URL should NOT contain /projects/
    expect(page.url()).not.toContain("/projects/");

    // Docs icon should be highlighted (not Projects)
    const docsButton = page.locator('[title="Docs"]');
    await expect(docsButton).toHaveClass(/bg-blue-600/);
  });
});
