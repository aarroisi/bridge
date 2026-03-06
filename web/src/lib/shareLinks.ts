export function buildAbsoluteUrl(
  pathname: string,
  searchParams?: URLSearchParams,
): string {
  const query = searchParams?.toString();

  return `${window.location.origin}${pathname}${query ? `?${query}` : ""}`;
}

export function buildBoardItemShareUrl(
  pathname: string,
  currentSearchParams: URLSearchParams,
  taskId: string,
  subtaskId?: string,
): string {
  const params = new URLSearchParams();
  const view = currentSearchParams.get("view");

  if (view) {
    params.set("view", view);
  }

  params.set("task", taskId);

  if (subtaskId) {
    params.set("subtask", subtaskId);
  }

  return buildAbsoluteUrl(pathname, params);
}
