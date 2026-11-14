import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, Check, X, AlertCircle, Volume2, CalendarX, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getToken } from '@/lib/api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api';
const ASR_URL = import.meta.env.VITE_ASR_URL || 'http://localhost:8000/api/voice';

type Stage = 'idle' | 'recording' | 'processing' | 'followup-prompt' | 'followup-recording' | 'followup-processing' | 'review' | 'editing' | 'confirming' | 'done' | 'error' | 'no-tables';

interface ExtractedData {
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  partySize: number | null;
  date: string | null;
  time: string | null;
  preference: string | null;
  notes: string | null;
}

interface VoiceReservationModalProps {
  open: boolean;
  onClose: () => void;
  onReservationCreated: () => void;
}

export default function VoiceReservationModal({ open, onClose, onReservationCreated }: VoiceReservationModalProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [transcript, setTranscript] = useState('');
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [editForm, setEditForm] = useState<ExtractedData | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [missingQuestions, setMissingQuestions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ reservationId: string; assignedTable: { tableNumber: number; reason: string } } | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!open) {
      stopRecording();
      setStage('idle');
      setTranscript('');
      setExtracted(null);
      setEditForm(null);
      setMissingFields([]);
      setMissingQuestions([]);
      setError('');
      setResult(null);
      setRecordingTime(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async (onDone: (blob: Blob) => void) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setRecordingTime(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        onDone(blob);
      };

      mediaRecorder.start();
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch {
      setError('Microphone access denied. Please allow microphone access and try again.');
      setStage('error');
    }
  }, []);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // ── Step 1: Initial recording ──
  const handleStartRecording = useCallback(() => {
    setStage('recording');
    setError('');
    startRecording(async (blob) => {
      setStage('processing');
      try {
        const token = getToken();
        if (!token) throw new Error('Not authenticated');

        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        // Step 1a: Send audio to Node backend for transcription
        const transcribeRes = await fetch(`${BACKEND_URL}/transcription/transcribe`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!transcribeRes.ok) {
          const err = await transcribeRes.json().catch(() => ({ detail: 'Transcription service error' }));
          throw new Error(err.detail || `Transcription error (${transcribeRes.status})`);
        }

        const transcribeData = await transcribeRes.json();
        const transcript = transcribeData.transcript;
        setTranscript(transcript);

        // Step 1b: Send transcript to Node backend to extract data (which calls ASR)
        const extractRes = await fetch(`${BACKEND_URL}/transcription/extract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ transcript }),
        });

        if (!extractRes.ok) {
          const err = await extractRes.json().catch(() => ({ detail: 'Extraction service error' }));
          throw new Error(err.detail || `Extraction error (${extractRes.status})`);
        }

        const extractData = await extractRes.json();
        setExtracted(extractData.extracted);

        if (extractData.ready) {
          setStage('review');
        } else {
          setMissingFields(extractData.missing_fields || []);
          setMissingQuestions(extractData.missing_questions || []);
          setStage('followup-prompt');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to process audio');
        setStage('error');
      }
    });
  }, [startRecording]);

  // ── Step 2: Follow-up recording ──
  const handleFollowupRecording = useCallback(() => {
    setStage('followup-recording');
    startRecording(async (blob) => {
      setStage('followup-processing');
      try {
        const token = getToken();
        if (!token) throw new Error('Not authenticated');

        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        formData.append('missing_fields', JSON.stringify(missingFields));
        formData.append('current_data', JSON.stringify(extracted));

        const res = await fetch(`${ASR_URL}/followup`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: 'ASR service error' }));
          throw new Error(err.detail || `ASR error (${res.status})`);
        }

        const data = await res.json();
        setExtracted(data.merged);
        setTranscript(prev => prev + ' → ' + (data.transcript || ''));

        if (data.ready) {
          setStage('review');
        } else {
          setMissingFields(data.missing_fields || []);
          setMissingQuestions(data.missing_questions || []);
          setStage('followup-prompt');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to process follow-up');
        setStage('error');
      }
    });
  }, [startRecording, missingFields, extracted]);

  // ── Step 3: Confirm ──
  const handleConfirm = useCallback(async () => {
    setStage('confirming');
    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${ASR_URL}/confirm`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ extracted }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to create reservation' }));
        if (res.status === 409) {
          setError(err.detail || 'No tables available for this time slot');
          setStage('no-tables');
          return;
        }
        throw new Error(err.detail || `Error (${res.status})`);
      }

      const data = await res.json();
      setResult({
        reservationId: data.reservationId,
        assignedTable: data.assignedTable,
      });
      setStage('done');
      onReservationCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to confirm reservation');
      setStage('error');
    }
  }, [extracted, onReservationCreated]);

  const handleReset = useCallback(() => {
    stopRecording();
    setStage('idle');
    setTranscript('');
    setExtracted(null);
    setEditForm(null);
    setMissingFields([]);
    setMissingQuestions([]);
    setError('');
    setResult(null);
    setRecordingTime(0);
  }, [stopRecording]);

  const handleEdit = useCallback(() => {
    setEditForm(extracted);
    setStage('editing');
  }, [extracted]);

  const handleSaveEdit = useCallback(() => {
    setExtracted(editForm);
    setStage('review');
  }, [editForm]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget && stage !== 'recording' && stage !== 'followup-recording') onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              <h2 className="font-serif text-lg text-foreground">Voice Reservation</h2>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">

            {/* ── Idle ── */}
            {stage === 'idle' && (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Mic className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-medium">Tap to start recording</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Speak naturally — mention guest name, party size, date, time, and phone number.
                  </p>
                </div>
                <Button onClick={handleStartRecording} size="lg" className="gap-2 w-full">
                  <Mic className="w-4 h-4" />
                  Start Recording
                </Button>
              </div>
            )}

            {/* ── Recording ── */}
            {(stage === 'recording' || stage === 'followup-recording') && (
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto"
                >
                  <Mic className="w-10 h-10 text-destructive" />
                </motion.div>
                <div>
                  <p className="text-foreground font-medium">Listening...</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                  </p>
                </div>
                <Button onClick={handleStopRecording} variant="destructive" size="lg" className="gap-2 w-full">
                  <MicOff className="w-4 h-4" />
                  Stop Recording
                </Button>
              </div>
            )}

            {/* ── Processing ── */}
            {(stage === 'processing' || stage === 'followup-processing') && (
              <div className="text-center space-y-4 py-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                <p className="text-foreground font-medium">Processing your voice...</p>
                <p className="text-sm text-muted-foreground">Transcribing and extracting reservation details</p>
              </div>
            )}

            {/* ── Follow-up prompt ── */}
            {stage === 'followup-prompt' && (
              <div className="space-y-4">
                {transcript && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">What we heard:</p>
                    <p className="text-sm text-foreground italic">"{transcript}"</p>
                  </div>
                )}

                {/* Show what we have */}
                {extracted && <DataPreview data={extracted} />}

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Missing information:</p>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                        {missingQuestions.map((q, i) => (
                          <li key={i}>• {q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <Button onClick={handleFollowupRecording} size="lg" className="gap-2 w-full">
                  <Mic className="w-4 h-4" />
                  Record Missing Details
                </Button>
              </div>
            )}

            {/* ── Review ── */}
            {stage === 'review' && extracted && (
              <div className="space-y-4">
                {transcript && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Transcript:</p>
                    <p className="text-sm text-foreground italic">"{transcript}"</p>
                  </div>
                )}

                <DataPreview data={extracted} />

                <div className="flex gap-2">
                  <Button onClick={handleReset} variant="outline" className="flex-1 gap-2">
                    <X className="w-4 h-4" />
                    Start Over
                  </Button>
                  <Button onClick={handleEdit} variant="outline" className="flex-1 gap-2">
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button onClick={handleConfirm} className="flex-1 gap-2">
                    <Check className="w-4 h-4" />
                    Confirm
                  </Button>
                </div>
              </div>
            )}

            {/* ── Editing ── */}
            {stage === 'editing' && editForm && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Edit2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Edit any incorrect details below and click "Save Changes"
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-name" className="text-xs text-muted-foreground uppercase tracking-wide">
                      Guest Name *
                    </Label>
                    <Input
                      id="edit-name"
                      value={editForm.guestName || ''}
                      onChange={(e) => setEditForm({ ...editForm, guestName: e.target.value })}
                      placeholder="John Doe"
                      className="mt-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-phone" className="text-xs text-muted-foreground uppercase tracking-wide">
                        Phone *
                      </Label>
                      <Input
                        id="edit-phone"
                        value={editForm.guestPhone || ''}
                        onChange={(e) => setEditForm({ ...editForm, guestPhone: e.target.value })}
                        placeholder="+1234567890"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-party" className="text-xs text-muted-foreground uppercase tracking-wide">
                        Party Size *
                      </Label>
                      <Input
                        id="edit-party"
                        type="number"
                        min="1"
                        value={editForm.partySize || ''}
                        onChange={(e) => setEditForm({ ...editForm, partySize: parseInt(e.target.value) || null })}
                        placeholder="2"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-email" className="text-xs text-muted-foreground uppercase tracking-wide">
                      Email (optional)
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editForm.guestEmail || ''}
                      onChange={(e) => setEditForm({ ...editForm, guestEmail: e.target.value })}
                      placeholder="john@example.com"
                      className="mt-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-date" className="text-xs text-muted-foreground uppercase tracking-wide">
                        Date *
                      </Label>
                      <Input
                        id="edit-date"
                        type="date"
                        value={editForm.date || ''}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-time" className="text-xs text-muted-foreground uppercase tracking-wide">
                        Time *
                      </Label>
                      <Input
                        id="edit-time"
                        type="time"
                        value={editForm.time || ''}
                        onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-preference" className="text-xs text-muted-foreground uppercase tracking-wide">
                      Seating Preference (optional)
                    </Label>
                    <Input
                      id="edit-preference"
                      value={editForm.preference || ''}
                      onChange={(e) => setEditForm({ ...editForm, preference: e.target.value })}
                      placeholder="Window, quiet area, etc."
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-notes" className="text-xs text-muted-foreground uppercase tracking-wide">
                      Notes (optional)
                    </Label>
                    <Input
                      id="edit-notes"
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      placeholder="Special requests, dietary restrictions, etc."
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={() => setStage('review')} variant="outline" className="flex-1 gap-2">
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveEdit} 
                    className="flex-1 gap-2"
                    disabled={!editForm.guestName || !editForm.guestPhone || !editForm.partySize || !editForm.date || !editForm.time}
                  >
                    <Check className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            )}

            {/* ── Confirming ── */}
            {stage === 'confirming' && (
              <div className="text-center space-y-4 py-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                <p className="text-foreground font-medium">Creating reservation...</p>
                <p className="text-sm text-muted-foreground">Finding the best table and booking it</p>
              </div>
            )}

            {/* ── Done ── */}
            {stage === 'done' && result && (
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto"
                >
                  <Check className="w-8 h-8 text-green-500" />
                </motion.div>
                <div>
                  <p className="text-foreground font-semibold text-lg">Reservation Created!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {extracted?.guestName} · {extracted?.date} at {extracted?.time} · Party of {extracted?.partySize}
                  </p>
                </div>
                {result.assignedTable && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="text-muted-foreground">
                      Table #{result.assignedTable.tableNumber} — {result.assignedTable.reason}
                    </p>
                  </div>
                )}
                <Button onClick={onClose} className="w-full">Done</Button>
              </div>
            )}

            {/* ── No tables available (409) ── */}
            {stage === 'no-tables' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                    <CalendarX className="w-8 h-8 text-amber-500" />
                  </div>
                  <p className="text-foreground font-semibold text-lg">No Tables Available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    There are no available tables for the requested time slot.
                  </p>
                </div>

                {extracted && (
                  <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">{extracted.date}</span> at <span className="font-medium text-foreground">{extracted.time}</span> · Party of <span className="font-medium text-foreground">{extracted.partySize}</span>
                    </p>
                  </div>
                )}

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Try a different time, date, or smaller party size.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleReset} variant="outline" className="flex-1 gap-2">
                    <Mic className="w-4 h-4" />
                    Start Over
                  </Button>
                  <Button onClick={handleEdit} className="flex-1 gap-2">
                    <Edit2 className="w-4 h-4" />
                    Edit & Retry
                  </Button>
                </div>
              </div>
            )}

            {/* ── Error ── */}
            {stage === 'error' && (
              <div className="space-y-4">
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
                <Button onClick={handleReset} variant="outline" className="w-full">
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Small helper to show extracted data ── */
function DataPreview({ data }: { data: ExtractedData }) {
  const fields = [
    { label: 'Name', value: data.guestName },
    { label: 'Phone', value: data.guestPhone },
    { label: 'Email', value: data.guestEmail },
    { label: 'Party Size', value: data.partySize },
    { label: 'Date', value: data.date },
    { label: 'Time', value: data.time },
    { label: 'Preference', value: data.preference },
    { label: 'Notes', value: data.notes },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-muted/30 rounded-lg p-3">
      {fields.map(({ label, value }) => (
        <div key={label}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={`text-sm ${value ? 'text-foreground' : 'text-muted-foreground/50 italic'}`}>
            {value ?? '—'}
          </p>
        </div>
      ))}
    </div>
  );
}
