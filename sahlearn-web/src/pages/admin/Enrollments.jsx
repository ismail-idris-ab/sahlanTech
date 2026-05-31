import { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2, Eye, Building2, CheckCircle2, MessageCircle, Paperclip, X, Upload, Copy, Check, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  adminGetEnrollments,
  updateEnrollmentStatus,
  deleteEnrollment,
  confirmEnrollmentPayment,
  uploadPaymentProof,
} from '../../services/enrollments.service';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

const STATUS_TABS = ['all', 'pending', 'contacted', 'enrolled', 'rejected'];

const STATUS_BADGE = {
  pending: 'bg-yellow-100 text-yellow-700',
  contacted: 'bg-blue-100 text-blue-700',
  enrolled: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const PAYMENT_BADGE = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS = ['pending', 'contacted', 'enrolled', 'rejected'];
const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed'];

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const proofRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const res = await adminGetEnrollments(params);
      setEnrollments(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load enrollments.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, updates) => {
    try {
      await updateEnrollmentStatus(id, updates);
      toast.success('Updated.');
      load();
      if (selected?.id === id) setSelected((e) => ({ ...e, ...updates }));
    } catch {
      toast.error('Update failed.');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteEnrollment(deleteTarget.id);
      toast.success('Enrollment deleted.');
      setDeleteTarget(null);
      if (selected?.id === deleteTarget.id) setSelected(null);
      load();
    } catch {
      toast.error('Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmPayment = async () => {
    setConfirming(true);
    setConfirmResult(null);
    try {
      const result = await confirmEnrollmentPayment(selected.id, {
        amountPaid: selected.amountPaid || 0,
      });
      setConfirmResult(result);
      toast.success('Payment confirmed! Student account ready.');
      setSelected((e) => ({ ...e, status: 'enrolled', paymentStatus: 'paid', enrollmentCode: result.enrollmentCode }));
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Confirmation failed.');
    } finally {
      setConfirming(false);
    }
  };

  const handleProofUpload = async () => {
    if (!proofFile) return;
    setUploadingProof(true);
    try {
      const result = await uploadPaymentProof(selected.id, proofFile);
      setSelected((e) => ({ ...e, paymentProof: result.paymentProof }));
      setProofFile(null);
      toast.success('Payment proof uploaded.');
    } catch {
      toast.error('Upload failed.');
    } finally {
      setUploadingProof(false);
    }
  };

  const openDetail = (enr) => {
    setSelected(enr);
    setConfirmResult(null);
    setProofFile(null);
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display text-ink-900">Enrollments</h1>
        <p className="text-xs text-ink-400 mt-0.5">{meta.total} total</p>
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all"
            style={activeTab === tab
              ? { background: '#068562', color: '#fff' }
              : { background: '#fff', color: '#506860', border: '1px solid rgba(168,196,188,0.4)' }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-ink-300/20" />)}
        </div>
      ) : enrollments.length === 0 ? (
        <EmptyState title="No enrollments" description="Enrollment submissions will appear here." />
      ) : (
        <div className="bg-white rounded-2xl border border-ink-300/20 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-300/20">
              <tr>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Student</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden md:table-cell">Course</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden sm:table-cell">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden lg:table-cell">Date</th>
                <th className="text-right px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/15">
              {enrollments.map((enr) => (
                <tr
                  key={enr.id}
                  onClick={() => openDetail(enr)}
                  className="hover:bg-surface-100/60 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink-900">{enr.fullName}</p>
                    <p className="text-ink-400 text-xs">{enr.email}</p>
                  </td>
                  <td className="px-5 py-4 text-ink-600 hidden md:table-cell">
                    <p className="line-clamp-1">{enr.courseTitleSnapshot}</p>
                    {enr.enrollmentCode && (
                      <p className="text-xs font-mono text-ink-400">{enr.enrollmentCode}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize w-fit ${STATUS_BADGE[enr.status]}`}>
                        {enr.status}
                      </span>
                      {enr.paymentStatus && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize w-fit ${PAYMENT_BADGE[enr.paymentStatus]}`}>
                          {enr.paymentStatus}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-ink-400 text-xs hidden lg:table-cell">
                    {new Date(enr.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDetail(enr); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-brand-primary hover:bg-brand-primary/8 transition-all"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: enr.id, name: enr.fullName }); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-brand-danger hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      <Modal isOpen={Boolean(selected)} onClose={() => { setSelected(null); setConfirmResult(null); }} title="Enrollment detail">
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-ink-500 text-xs mb-0.5">Name</p><p className="font-medium text-ink-900">{selected.fullName}</p></div>
              <div><p className="text-ink-500 text-xs mb-0.5">Email</p><p className="text-ink-900">{selected.email}</p></div>
              <div><p className="text-ink-500 text-xs mb-0.5">Phone</p><p className="text-ink-900">{selected.phone}</p></div>
              <div><p className="text-ink-500 text-xs mb-0.5">Mode</p><p className="text-ink-900 capitalize">{selected.mode}</p></div>
              {selected.preferredStartDate && (
                <div><p className="text-ink-500 text-xs mb-0.5">Preferred Start</p><p className="text-ink-900">{new Date(selected.preferredStartDate).toLocaleDateString()}</p></div>
              )}
              <div><p className="text-ink-500 text-xs mb-0.5">Submitted</p><p className="text-ink-900">{new Date(selected.createdAt).toLocaleString()}</p></div>
            </div>

            <div>
              <p className="text-ink-500 text-xs mb-0.5">Course</p>
              <p className="font-medium text-ink-900">{selected.courseTitleSnapshot}</p>
              {selected.enrollmentCode && (
                <p className="text-xs font-mono text-brand-primary mt-0.5">{selected.enrollmentCode}</p>
              )}
            </div>

            {selected.notes && (
              <div><p className="text-ink-500 text-xs mb-1">Notes</p><p className="text-ink-700 whitespace-pre-wrap bg-surface-100 rounded-lg p-3">{selected.notes}</p></div>
            )}

            {/* Payment info */}
            <div className="bg-surface-100 rounded-xl p-4 space-y-2 text-sm border border-ink-300/20">
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Payment</p>
              <div className="flex justify-between">
                <span className="text-ink-500">Method</span>
                <span className="font-medium text-ink-900 flex items-center gap-1.5 capitalize">
                  <Building2 size={13} className="text-ink-500" /> {selected.paymentMethod?.replace('_', ' ')}
                </span>
              </div>
              {selected.amountPaid > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink-500">Amount</span>
                  <span className="font-bold text-brand-primary">₦{Number(selected.amountPaid).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-ink-500">Payment status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${PAYMENT_BADGE[selected.paymentStatus]}`}>
                  {selected.paymentStatus}
                </span>
              </div>

              {/* Payment proof */}
              {selected.paymentProof?.url ? (
                <div className="flex justify-between items-center pt-1">
                  <span className="text-ink-500">Proof</span>
                  <a
                    href={selected.paymentProof.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-brand-primary text-xs font-medium hover:underline"
                  >
                    <Paperclip size={11} />
                    {selected.paymentProof.originalName || 'View proof'}
                  </a>
                </div>
              ) : (
                <div className="pt-1">
                  <p className="text-ink-500 text-xs mb-1.5">Upload payment proof</p>
                  {proofFile ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 flex-1 px-2 py-1.5 bg-white rounded-lg border border-ink-200 text-xs">
                        <Paperclip size={11} className="text-ink-400" />
                        <span className="truncate text-ink-700">{proofFile.name}</span>
                        <button onClick={() => setProofFile(null)} className="ml-auto text-ink-400 hover:text-red-500"><X size={11} /></button>
                      </div>
                      <Button size="sm" loading={uploadingProof} onClick={handleProofUpload}>
                        <Upload size={12} /> Save
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => proofRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-ink-300 rounded-lg text-xs text-ink-500 hover:border-brand-primary hover:text-brand-primary transition-colors"
                    >
                      <Paperclip size={12} /> Attach proof
                    </button>
                  )}
                  <input ref={proofRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                </div>
              )}
            </div>

            {/* Confirm payment — main CTA */}
            {selected.paymentStatus !== 'paid' || selected.status !== 'enrolled' ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-green-700 mb-2">Confirm Payment</p>
                <p className="text-xs text-green-600 mb-3">
                  This will mark the enrollment as paid, generate Student ID + Enrollment Code, and send login credentials to the student.
                </p>
                <Button
                  variant="primary"
                  loading={confirming}
                  onClick={handleConfirmPayment}
                  className="w-full"
                >
                  <CheckCircle2 size={14} /> Confirm Payment & Activate Account
                </Button>
              </div>
            ) : null}

            {/* Result after confirm */}
            {confirmResult && (
              <CredentialCard
                result={confirmResult}
                studentName={selected.fullName}
                studentEmail={selected.email}
                studentPhone={selected.phone}
              />
            )}

            {/* Status controls */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-ink-300/40">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-ink-700">Status:</label>
                <select
                  value={selected.status}
                  onChange={(e) => handleStatusChange(selected.id, { status: e.target.value })}
                  className="border border-ink-300 rounded-lg px-3 py-1.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-ink-700">Payment:</label>
                <select
                  value={selected.paymentStatus || 'pending'}
                  onChange={(e) => handleStatusChange(selected.id, { paymentStatus: e.target.value })}
                  className="border border-ink-300 rounded-lg px-3 py-1.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  {PAYMENT_STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete modal */}
      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete enrollment?">
        <p className="text-ink-700 text-sm mb-6">Enrollment from "{deleteTarget?.name}" will be permanently deleted.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function CredentialCard({ result, studentName, studentEmail, studentPhone }) {
  const [copied, setCopied] = useState(false);
  const loginUrl = `${window.location.origin.replace('/admin', '')}/student/login`;

  const credentialText =
    `Sahlearn Student Login Details\n` +
    `──────────────────────────────\n` +
    `Name:            ${studentName}\n` +
    `Email:           ${studentEmail}\n` +
    `Temp Password:   ${result.tempPassword || '(sent by email)'}\n` +
    `Student ID:      ${result.student?.studentId}\n` +
    `Enrollment Code: ${result.enrollmentCode}\n` +
    `Login URL:       ${loginUrl}\n` +
    `──────────────────────────────\n` +
    `Please change your password after first login.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(credentialText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const waLink = result.whatsappLink;
  const smsBody = encodeURIComponent(credentialText);
  const smsLink = studentPhone ? `sms:${studentPhone}?body=${smsBody}` : null;

  return (
    <div className="border border-brand-primary/25 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-brand-primary px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-white" />
          <span className="text-white text-xs font-semibold uppercase tracking-wider">Account Activated</span>
        </div>
        <span className="text-white/70 text-xs">{result.isNewStudent ? 'New student' : 'Existing student — new course'}</span>
      </div>

      {/* Credential block */}
      <div className="bg-ink-900 p-4 font-mono text-xs leading-relaxed">
        <div className="space-y-1.5 text-surface-200">
          <CredRow label="Name" value={studentName} />
          <CredRow label="Email" value={studentEmail} highlight />
          {result.tempPassword && <CredRow label="Temp Password" value={result.tempPassword} highlight />}
          <CredRow label="Student ID" value={result.student?.studentId} highlight />
          <CredRow label="Enrollment Code" value={result.enrollmentCode} />
          <div className="border-t border-white/10 pt-1.5 mt-1.5">
            <CredRow label="Login URL" value={loginUrl} />
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 text-xs text-amber-700">
        Email with credentials sent automatically. Share below if student didn't receive it.
      </div>

      {/* Action buttons */}
      <div className="bg-white px-4 py-3 flex flex-wrap gap-2 border-t border-ink-100">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 bg-ink-900 text-white text-xs font-medium rounded-lg hover:bg-ink-700 transition-colors"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy credentials'}
        </button>

        <a
          href={loginUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 border border-brand-primary text-brand-primary text-xs font-medium rounded-lg hover:bg-brand-primary/5 transition-colors"
        >
          <ExternalLink size={12} /> Open login page
        </a>

        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors"
          >
            <MessageCircle size={12} /> WhatsApp
          </a>
        )}

        {smsLink && (
          <a
            href={smsLink}
            className="flex items-center gap-1.5 px-3 py-2 border border-ink-300 text-ink-700 text-xs font-medium rounded-lg hover:bg-surface-100 transition-colors"
          >
            SMS
          </a>
        )}
      </div>
    </div>
  );
}

function CredRow({ label, value, highlight }) {
  return (
    <div className="flex gap-3">
      <span className="text-ink-400 w-28 flex-shrink-0">{label}:</span>
      <span className={highlight ? 'text-white font-bold tracking-wide' : 'text-surface-300'}>{value}</span>
    </div>
  );
}
