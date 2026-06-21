import { useState } from 'react';
import axios from 'axios';

const API = 'https://pdf-jats-backend-production.up.railway.app';

const steps = ['Upload', 'Metadata', 'Authors', 'References', 'Download'];

export default function App() {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [xml, setXml] = useState('');
  const [error, setError] = useState('');

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await axios.post(`${API}/convert`, form);
      setData(res.data.data);
      setStep(1);
    } catch (e) {
      setError('Upload failed. Please try again.');
    }
    setLoading(false);
  }

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/generate`, data);
      setXml(res.data.xml);
      setStep(4);
    } catch (e) {
      setError('Generation failed. Please try again.');
    }
    setLoading(false);
  }

  function downloadXml() {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'article.jats.xml';
    a.click();
  }

  function updateField(field, value) {
    setData(prev => ({ ...prev, [field]: value }));
  }

  function updateAuthor(i, field, value) {
    const authors = [...data.authors];
    authors[i] = { ...authors[i], [field]: value };
    setData(prev => ({ ...prev, authors }));
  }

  function addAuthor() {
    setData(prev => ({
      ...prev,
      authors: [...(prev.authors || []), { first: '', last: '', affiliation: '', corresponding: false }]
    }));
  }

  function removeAuthor(i) {
    const authors = data.authors.filter((_, idx) => idx !== i);
    setData(prev => ({ ...prev, authors }));
  }

  function updateRef(i, field, value) {
    const references = [...data.references];
    references[i] = { ...references[i], [field]: value };
    setData(prev => ({ ...prev, references }));
  }

  function addRef() {
    const newId = String((data.references || []).length + 1);
    setData(prev => ({
      ...prev,
      references: [...(prev.references || []), { id: newId, authors: '', title: '', journal: '', year: '', doi: '' }]
    }));
  }

  function removeRef(i) {
    const references = data.references.filter((_, idx) => idx !== i);
    setData(prev => ({ ...prev, references }));
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>PDF to JATS XML Converter</h1>
        <p style={styles.subtitle}>Convert scientific papers to JATS 1.3 format</p>
      </div>

      <div style={styles.steps}>
        {steps.map((s, i) => (
          <div key={s} style={styles.stepItem}>
            <div style={{ ...styles.stepDot, background: i <= step ? '#6366f1' : '#e2e8f0', color: i <= step ? '#fff' : '#94a3b8' }}>{i + 1}</div>
            <span style={{ ...styles.stepLabel, color: i <= step ? '#6366f1' : '#94a3b8' }}>{s}</span>
          </div>
        ))}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {step === 0 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Upload your PDF</h2>
          <div style={styles.dropzone} onClick={() => document.getElementById('fileInput').click()}>
            <div style={styles.dropIcon}>📄</div>
            <div style={styles.dropText}>{file ? file.name : 'Click to select a PDF file'}</div>
            <div style={styles.dropSub}>Supports text-based academic PDFs up to 25MB</div>
          </div>
          <input id="fileInput" type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
          <button style={{ ...styles.btn, opacity: (!file || loading) ? 0.5 : 1 }} onClick={handleUpload} disabled={!file || loading}>
            {loading ? 'Processing...' : 'Upload & Extract'}
          </button>
        </div>
      )}

      {step === 1 && data && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Edit Metadata</h2>
          <div style={styles.field}>
            <label style={styles.label}>Article title</label>
            <input style={styles.input} value={data.title || ''} onChange={e => updateField('title', e.target.value)} />
          </div>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Journal</label>
              <input style={styles.input} value={data.journal || ''} onChange={e => updateField('journal', e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>DOI</label>
              <input style={styles.input} value={data.doi || ''} onChange={e => updateField('doi', e.target.value)} />
            </div>
          </div>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Publication date</label>
              <input style={styles.input} value={data.pub_date || ''} onChange={e => updateField('pub_date', e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Article type</label>
              <select style={styles.input} value={data.article_type || 'research-article'} onChange={e => updateField('article_type', e.target.value)}>
                <option value="research-article">Research article</option>
                <option value="review-article">Review</option>
                <option value="case-report">Case report</option>
                <option value="letter">Letter</option>
                <option value="editorial">Editorial</option>
              </select>
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Keywords (comma separated)</label>
            <input style={styles.input} value={(data.keywords || []).join(', ')} onChange={e => updateField('keywords', e.target.value.split(',').map(k => k.trim()))} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Abstract</label>
            <textarea style={styles.textarea} value={data.abstract || ''} onChange={e => updateField('abstract', e.target.value)} />
          </div>
          <div style={styles.nav}>
            <button style={styles.btnSecondary} onClick={() => setStep(0)}>Back</button>
            <button style={styles.btn} onClick={() => setStep(2)}>Next: Authors</button>
          </div>
        </div>
      )}

      {step === 2 && data && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Authors & Affiliations</h2>
          {(data.authors || []).map((a, i) => (
            <div key={i} style={styles.authorRow}>
              <input style={styles.inputSm} placeholder="First name" value={a.first || ''} onChange={e => updateAuthor(i, 'first', e.target.value)} />
              <input style={styles.inputSm} placeholder="Last name" value={a.last || ''} onChange={e => updateAuthor(i, 'last', e.target.value)} />
              <input style={{ ...styles.inputSm, flex: 2 }} placeholder="Affiliation" value={a.affiliation || ''} onChange={e => updateAuthor(i, 'affiliation', e.target.value)} />
              <label style={styles.checkLabel}>
                <input type="checkbox" checked={a.corresponding || false} onChange={e => updateAuthor(i, 'corresponding', e.target.checked)} /> Corresp.
              </label>
              <button style={styles.btnDanger} onClick={() => removeAuthor(i)}>✕</button>
            </div>
          ))}
          <button style={styles.btnAdd} onClick={addAuthor}>+ Add author</button>
          <div style={styles.nav}>
            <button style={styles.btnSecondary} onClick={() => setStep(1)}>Back</button>
            <button style={styles.btn} onClick={() => setStep(3)}>Next: References</button>
          </div>
        </div>
      )}

      {step === 3 && data && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>References <span style={styles.badge}>{(data.references || []).length} found</span></h2>
          {(data.references || []).map((r, i) => (
            <div key={i} style={styles.refRow}>
              <span style={styles.refNum}>{i + 1}</span>
              <input style={{ ...styles.inputSm, flex: 3 }} placeholder="Authors — Title" value={`${r.authors || ''} — ${r.title || ''}`} onChange={e => updateRef(i, 'title', e.target.value)} />
              <input style={styles.inputSm} placeholder="Journal" value={r.journal || ''} onChange={e => updateRef(i, 'journal', e.target.value)} />
              <input style={{ ...styles.inputSm, width: 70 }} placeholder="Year" value={r.year || ''} onChange={e => updateRef(i, 'year', e.target.value)} />
              <button style={styles.btnDanger} onClick={() => removeRef(i)}>✕</button>
            </div>
          ))}
          <button style={styles.btnAdd} onClick={addRef}>+ Add reference</button>
          <div style={styles.nav}>
            <button style={styles.btnSecondary} onClick={() => setStep(2)}>Back</button>
            <button style={{ ...styles.btn, opacity: loading ? 0.5 : 1 }} onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating...' : '✦ Generate JATS XML'}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>✓ Your XML is ready</h2>
          <div style={styles.xmlPreview}>{xml.substring(0, 800)}...</div>
          <button style={styles.btn} onClick={downloadXml}>⬇ Download JATS XML</button>
          <button style={{ ...styles.btnSecondary, marginTop: 10 }} onClick={() => { setStep(0); setFile(null); setData(null); setXml(''); }}>Convert another PDF</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: 760, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' },
  header: { textAlign: 'center', marginBottom: '2rem' },
  title: { fontSize: 28, fontWeight: 700, color: '#1e293b', margin: 0 },
  subtitle: { color: '#64748b', marginTop: 6 },
  steps: { display: 'flex', justifyContent: 'center', gap: 8, marginBottom: '2rem', flexWrap: 'wrap' },
  stepItem: { display: 'flex', alignItems: 'center', gap: 6 },
  stepDot: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 },
  stepLabel: { fontSize: 13, fontWeight: 500 },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem' },
  cardTitle: { fontSize: 18, fontWeight: 600, color: '#1e293b', marginTop: 0, marginBottom: '1.25rem' },
  field: { marginBottom: '1rem', flex: 1 },
  row: { display: 'flex', gap: 12 },
  label: { display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500 },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, minHeight: 80, boxSizing: 'border-box', resize: 'vertical' },
  btn: { background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: 12 },
  btnSecondary: { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' },
  btnDanger: { background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 13 },
  btnAdd: { background: 'none', border: '1px dashed #cbd5e1', borderRadius: 8, padding: '8px 16px', color: '#64748b', cursor: 'pointer', fontSize: 13, width: '100%', marginBottom: 12 },
  nav: { display: 'flex', justifyContent: 'space-between', marginTop: 16 },
  authorRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
  refRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
  refNum: { fontSize: 12, color: '#94a3b8', minWidth: 20 },
  inputSm: { padding: '7px 8px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, flex: 1 },
  checkLabel: { fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 },
  dropzone: { border: '2px dashed #e2e8f0', borderRadius: 10, padding: '2rem', textAlign: 'center', cursor: 'pointer', marginBottom: 16 },
  dropIcon: { fontSize: 32, marginBottom: 8 },
  dropText: { fontSize: 14, fontWeight: 500, color: '#334155' },
  dropSub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  error: { background: '#fee2e2', color: '#ef4444', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 },
  badge: { background: '#e0e7ff', color: '#6366f1', fontSize: 12, padding: '2px 10px', borderRadius: 20, fontWeight: 500 },
  xmlPreview: { fontFamily: 'monospace', fontSize: 11, background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16, overflowX: 'auto', maxHeight: 200, overflowY: 'auto', color: '#475569' },
};