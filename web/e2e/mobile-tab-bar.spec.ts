import { test, expect, Page } from "@playwright/test";

const ROOT_ROUTES = [
  "/dashboard",
  "/updates",
  "/projects",
  "/boards",
  "/channels",
  "/doc-folders",
  "/dms",
];

const NON_ROOT_ROUTES = [
  "/projects/test-project-id",
  "/channels/test-channel-id",
  "/dms/test-dm-id",
  "/projects/test-project-id/channels/test-channel-id",
];

const PAGINATED_ENDPOINTS = new Set([
  "/api/projects",
  "/api/boards",
  "/api/doc-folders",
  "/api/docs",
  "/api/channels",
  "/api/direct_messages",
  "/api/messages",
  "/api/notifications",
]);

async function mockAuthenticatedSession(page: Page) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());

    if (pathname === "/api/auth/me") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "test-user-id",
            name: "Test User",
            email: "test@example.com",
            avatar: "",
            timezone: null,
            role: "owner",
            workspace_id: "test-workspace-id",
          },
          workspace: {
            id: "test-workspace-id",
            name: "Test Workspace",
            slug: "test-workspace",
            logo: null,
          },
        }),
      });
      return;
    }

    if (request.method() === "GET" && PAGINATED_ENDPOINTS.has(pathname)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [],
          metadata: { after: null, limit: 50 },
        }),
      });
      return;
    }

    if (pathname === "/api/notifications/unread-count") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ count: 0 }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });
}

test.describe("Mobile tab bar visibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAuthenticatedSession(page);
  });

  test("should only render on root routes", async ({ page }) => {
    const moreTabButton = page.getByRole("button", { name: "More" });

    for (const route of ROOT_ROUTES) {
      await page.goto(route);
      await expect(moreTabButton, `Expected tab bar on ${route}`).toBeVisible();
    }

    for (const route of NON_ROOT_ROUTES) {
      await page.goto(route);
      await expect(
        moreTabButton,
        `Expected tab bar hidden on ${route}`,
      ).not.toBeVisible();
    }
  });
});
