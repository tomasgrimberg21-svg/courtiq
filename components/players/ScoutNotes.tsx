"use client";

import { useState, useSyncExternalStore } from "react";
import { getNotesSnapshot, saveNote, subscribe } from "@/lib/storage/local";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const SUGGESTED_TAGS = ["Buen tiro", "Defensa", "Reboteador", "Creador", "Atlético", "Lesión", "Actitud", "Juventud", "Líder", "A seguir"];

/** Notas de scouting por jugador: texto libre + tags. Persiste en localStorage, reactivo. */
export function ScoutNotes({ playerId }: { playerId: string }) {
  const notes = useSyncExternalStore(subscribe, getNotesSnapshot, getNotesSnapshot);
  const current = notes[playerId];

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(current?.text ?? "");
  const [tags, setTags] = useState<string[]>(current?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  function startEdit() {
    setText(current?.text ?? "");
    setTags(current?.tags ?? []);
    setTagInput("");
    setEditing(true);
  }

  function addTag(t: string) {
    const clean = t.trim();
    if (clean && !tags.includes(clean)) setTags((arr) => [...arr, clean]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags((arr) => arr.filter((x) => x !== t));
  }

  function onSave() {
    saveNote(playerId, text, tags);
    setEditing(false);
  }

  if (!editing) {
    return (
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm uppercase text-ink-muted">Notas de scouting</h2>
          <Button variant="outline" size="sm" onClick={startEdit}>
            {current ? "Editar" : "+ Agregar nota"}
          </Button>
        </div>
        {current ? (
          <>
            {current.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {current.tags.map((t) => (
                  <span key={t} className="rounded-full border border-brand/40 px-2 py-0.5 text-[11px] text-brand">
                    {t}
                  </span>
                ))}
              </div>
            )}
            {current.text && <p className="whitespace-pre-wrap text-sm text-ink">{current.text}</p>}
            <p className="text-[10px] text-ink-muted/70">
              Actualizada {new Date(current.updatedAt).toLocaleDateString("es-AR")}
            </p>
          </>
        ) : (
          <p className="text-sm text-ink-muted">
            Sin notas. Agregá observaciones y tags (ej. “buen tiro”, “lesión 2024”) para tu cuerpo técnico.
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-heading text-sm uppercase text-ink-muted">Editar nota</h2>

      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => removeTag(t)}
            className="inline-flex items-center gap-1 rounded-full border border-brand/40 px-2 py-0.5 text-[11px] text-brand hover:border-uv-red hover:text-uv-red"
          >
            {t} <span aria-hidden>×</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
          <button
            key={t}
            onClick={() => addTag(t)}
            className="rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-muted hover:border-brand hover:text-brand"
          >
            + {t}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(tagInput);
            }
          }}
          placeholder="Tag personalizado + Enter"
          className="h-9 flex-1 rounded-md border border-line bg-panel px-3 text-sm text-ink placeholder:text-ink-muted/60 focus:border-brand"
        />
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Observaciones de scouting…"
        className="w-full rounded-md border border-line bg-panel p-3 text-sm text-ink placeholder:text-ink-muted/60 focus:border-brand"
      />

      <div className="flex gap-2">
        <Button onClick={onSave}>Guardar nota</Button>
        <Button variant="outline" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </div>
    </Card>
  );
}
