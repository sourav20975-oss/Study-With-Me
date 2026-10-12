import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { MathRenderer } from '../../components/common/MathRenderer.jsx';
import {
  FileCheck,
  Calendar,
  Clock,
  Upload,
  CheckCircle,
  X,
  MessageSquare,
  Award
} from 'lucide-react';

export function HomeworkView() {
  const [assignments, setAssignments] = useState([]);
  const [submittingId, setSubmittingId] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssignments() {
      try {
        const res = await api.get('/assignments');
        setAssignments(res.assignments || []);
      } catch (err) {
        console.error('Failed to load homework:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAssignments();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await api.upload(file);
      setAttachment(res.url);
    } catch (err) {
      alert(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitHomework = async (asgId) => {
    if (!textAnswer.trim() && !attachment) {
      alert('Please provide either written solution steps or upload an image.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.post(`/assignments/${asgId}/submissions`, {
        textAnswer: textAnswer.trim(),
        attachments: attachment ? [attachment] : []
      });

      setAssignments((prev) =>
        prev.map((a) => (a.id === asgId ? { ...a, mySubmission: res.submission } : a))
      );

      setSubmittingId(null);
      setTextAnswer('');
      setAttachment(null);
    } catch (err) {
      alert(err.message || 'Submission failed.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-text-muted">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm">Loading homework assignments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-text">
          Homework & Assignments
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Complete written worksheets, submit your working, and review tutor evaluations.
        </p>
      </div>

      <div className="space-y-5">
        {assignments.map((asg) => {
          const sub = asg.mySubmission;
          const isReviewed = sub?.status === 'reviewed';
          const isSubmitted = sub?.status === 'submitted';
          const isFormOpen = submittingId === asg.id;

          const dueDateStr = asg.dueAt
            ? new Date(asg.dueAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            : 'Open';

          return (
            <div
              key={asg.id}
              className="bg-surface rounded-lg border border-border p-5 sm:p-6 space-y-4 shadow-2xs"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                      {asg.subjectName} · {asg.chapterTitle}
                    </span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Due: {dueDateStr}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg text-text">
                    {asg.title}
                  </h3>
                </div>

                <div className="shrink-0">
                  <StatusBadge status={sub?.status || 'pending'} labelOverride={sub ? null : 'Not Submitted'} />
                </div>
              </div>

              {/* Instructions */}
              <div className="text-xs sm:text-sm text-text leading-relaxed whitespace-pre-line bg-page p-3.5 rounded-md border border-border">
                <span className="font-semibold text-text-muted block text-xs mb-1 uppercase tracking-wider">
                  Instructions:
                </span>
                <MathRenderer content={asg.instructions} />
              </div>

              {/* Submission Status & Feedback */}
              {sub && (
                <div className="p-4 rounded-md bg-surface-muted/60 border border-border space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text">Your Submission</span>
                    <span className="text-text-muted text-[11px]">
                      Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {sub.textAnswer && (
                    <div className="text-text whitespace-pre-line font-mono text-xs p-3 bg-surface rounded border border-border/80">
                      {sub.textAnswer}
                    </div>
                  )}

                  {sub.attachments && sub.attachments.length > 0 && (
                    <div>
                      <img
                        src={sub.attachments[0]}
                        alt="Work attachment"
                        className="max-h-48 rounded border border-border object-contain"
                      />
                    </div>
                  )}

                  {/* Tutor Feedback */}
                  {isReviewed && (
                    <div className="p-3.5 rounded bg-surface border-l-3 border-success space-y-1 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-success text-xs uppercase tracking-wider">
                          Tutor Review Feedback
                        </span>
                        {sub.score !== null && (
                          <span className="font-bold text-text text-sm">
                            Score: {sub.score} / {asg.totalMarks || 10}
                          </span>
                        )}
                      </div>
                      <p className="text-text text-xs leading-relaxed italic">
                        "{sub.feedback}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action button to open submit form */}
              {!isFormOpen && (!sub || sub.status === 'needs_revision' || sub.status === 'submitted') && (
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => {
                      setSubmittingId(asg.id);
                      setTextAnswer(sub?.textAnswer || '');
                      setAttachment(sub?.attachments?.[0] || null);
                    }}
                    className="px-4 py-2 rounded-md bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors"
                  >
                    {sub ? 'Update Submission' : 'Submit Homework'}
                  </button>
                </div>
              )}

              {/* Submission Form Modal/Panel */}
              {isFormOpen && (
                <div className="p-4 rounded-md bg-page border border-border space-y-3 pt-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-text uppercase tracking-wider">
                      Submit Your Work
                    </h4>
                    <button
                      type="button"
                      onClick={() => setSubmittingId(null)}
                      className="p-1 rounded text-text-muted hover:text-text"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      Written Steps or Explanations:
                    </label>
                    <textarea
                      rows={5}
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      placeholder="Type your working steps, variables, and final answers..."
                      className="w-full px-3 py-2 border border-border rounded-md text-xs sm:text-sm bg-surface font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      Upload Homework Photo:
                    </label>
                    {attachment ? (
                      <div className="relative inline-block border border-border rounded p-1 bg-surface">
                        <img src={attachment} alt="Uploaded homework" className="h-28 w-auto rounded object-cover" />
                        <button
                          type="button"
                          onClick={() => setAttachment(null)}
                          className="absolute -top-2 -right-2 p-1 rounded-full bg-danger text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-md text-xs font-medium text-text-muted hover:text-text cursor-pointer bg-surface">
                        <Upload className="w-4 h-4 text-accent" />
                        <span>{uploadingImage ? 'Uploading via Cloudinary...' : 'Upload Image (PNG, JPG)'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSubmittingId(null)}
                      className="px-3 py-1.5 rounded-md border border-border text-xs text-text hover:bg-surface-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmitHomework(asg.id)}
                      disabled={isSaving || uploadingImage}
                      className="px-4 py-1.5 rounded-md bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Submitting...' : 'Submit to Tutor'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
