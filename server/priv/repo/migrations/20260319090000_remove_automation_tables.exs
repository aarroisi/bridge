defmodule Missionspace.Repo.Migrations.RemoveAutomationTables do
  use Ecto.Migration

  def up do
    execute("DROP TABLE IF EXISTS agent_run_events CASCADE")
    execute("DROP TABLE IF EXISTS agent_runs CASCADE")
    execute("DROP TABLE IF EXISTS task_agent_assignments CASCADE")
    execute("DROP TABLE IF EXISTS workspace_automation_repositories CASCADE")
    execute("DROP TABLE IF EXISTS workspace_automation_settings CASCADE")
    execute("DROP TABLE IF EXISTS oban_jobs CASCADE")
  end

  def down do
    raise "Irreversible migration"
  end
end
