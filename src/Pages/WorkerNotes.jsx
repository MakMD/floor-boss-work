// src/Pages/WorkerNotes.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { AppContext } from "../components/App/App";
import styles from "./WorkerNotes.module.css";

export default function WorkerNotes() {
  const { id: jobId } = useParams();
  const { user, addActivity } = useContext(AppContext);

  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: notesData, error: notesError } = await supabase
        .from("job_notes")
        .select("id, content, created_at, worker_id")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (notesError) throw notesError;
      if (!notesData || notesData.length === 0) {
        setNotes([]);
        return;
      }

      const workerIds = [...new Set(notesData.map((note) => note.worker_id))];
      const { data: workersData, error: workersError } = await supabase
        .from("workers")
        .select("id, name")
        .in("id", workerIds);

      if (workersError) throw workersError;

      const workersMap = new Map(
        workersData.map((worker) => [worker.id, worker.name])
      );

      const combinedNotes = notesData.map((note) => ({
        ...note,
        authorName: workersMap.get(note.worker_id) || "Unknown User",
      }));

      setNotes(combinedNotes);
    } catch (err) {
      setError(`Failed to load notes: ${err.message}`);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !user?.id) {
      setError("Note cannot be empty and user must be logged in.");
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from("job_notes")
        .insert([
          { job_id: jobId, worker_id: user.id, content: newNote.trim() },
        ])
        .select("id, content, created_at, worker_id")
        .single();

      if (insertError) throw insertError;

      const newCompleteNote = {
        ...data,
        authorName: user.name || "Unknown User",
      };

      setNotes((prevNotes) => [newCompleteNote, ...prevNotes]);

      addActivity({
        message: `User ${user.name || user.id} added a note to order #${jobId}`,
        jobId: jobId,
      });

      setNewNote("");
    } catch (err) {
      setError(`Failed to add note: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p className={styles.loading}>Loading notes...</p>;

  return (
    <div className={styles.workerNotesPage}>
      <h3 className={styles.subTitle}>Worker Notes for Order #{jobId}</h3>

      {error && <p className={styles.error}>{error}</p>}

      {(user?.role === "worker" || user?.role === "admin") && (
        <form onSubmit={handleAddNote} className={styles.noteForm}>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add your note here..."
            className={styles.noteTextarea}
            rows="3"
            required
          />
          <button
            type="submit"
            className={styles.addButton}
            disabled={actionLoading || !newNote.trim()}
          >
            {actionLoading ? "Adding..." : "Add Note"}
          </button>
        </form>
      )}

      {notes.length > 0 ? (
        <ul className={styles.notesList}>
          {notes.map((note) => (
            <li key={note.id} className={styles.noteItem}>
              <p className={styles.noteContent}>{note.content}</p>
              <div className={styles.noteMeta}>
                <span className={styles.noteAuthor}>
                  {/* ЗМІНА: Видалено відображення ID */}
                  By: {note.authorName}
                </span>
                <span className={styles.noteDate}>
                  On: {new Date(note.created_at).toLocaleString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p className={styles.noNotes}>No notes yet for this job.</p>
      )}
    </div>
  );
}
