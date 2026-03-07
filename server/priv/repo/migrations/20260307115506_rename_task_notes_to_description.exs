defmodule Missionspace.Repo.Migrations.RenameTaskNotesToDescription do
  use Ecto.Migration

  def change do
    rename(table(:tasks), :notes, to: :description)
  end
end
