import React from 'react';

export default function YoutubeCookiesInput({ value, onChange, compact = false }) {
  if (compact) {
    return (
      <details className="rounded-xl border border-white/10 bg-white/5 p-3">
        <summary className="cursor-pointer text-sm text-zinc-300 font-medium">
          YouTube cookies {value ? <span className="text-green-400 text-xs ml-2">— set</span> : <span className="text-amber-400 text-xs ml-2">— required on cloud servers</span>}
        </summary>
        <div className="mt-3 space-y-2">
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Paste the <strong>raw Netscape file</strong> from the extension (starts with <code className="text-zinc-400"># Netscape HTTP Cookie File</code>).
            Do <strong>not</strong> paste the base64 string from terminal.
          </p>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="input-field min-h-[120px] font-mono text-xs"
            placeholder={"# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\t..."}
          />
        </div>
      </details>
    );
  }

  return (
    <div className="glass-panel p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">YouTube Cookies</h2>
        <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-zinc-500 uppercase tracking-wider">Optional</span>
      </div>
      <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
        Required for <strong>YouTube URL</strong> processing on cloud servers (Zeabur, Railway, etc.).
        Export cookies from your browser in <strong>Netscape format</strong> and paste below.
        Stored only in your browser — sent to the backend per request, never saved server-side.
      </p>
      <label className="block text-sm text-zinc-400 mb-2">Netscape cookies.txt content</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field min-h-[140px] font-mono text-xs"
        placeholder={"# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\t..."}
      />
      <p className="text-[11px] text-zinc-600 mt-2">
        Use &quot;Get cookies.txt LOCALLY&quot; while logged into YouTube. Paste the <strong>raw export</strong> (with tabs and newlines), not a base64-encoded string.
      </p>
    </div>
  );
}
