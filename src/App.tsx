import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Settings, Download, Video, Music, AlertTriangle, Search, Globe, Cpu, ShieldCheck, Activity } from 'lucide-react';

interface Format {
  format_id: string;
  ext: string;
  resolution: string;
  fps: number;
  filesize: number;
  vcodec: string;
  acodec: string;
  url: string;
  format_note?: string;
}

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration_string: string;
  webpage_url: string;
  formats: Format[];
  id: string;
}

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const findVideo = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setLogs([]);
    
    addLog("Initializing core modules...");
    setTimeout(() => addLog("Connecting to yt-dlp..."), 500);
    setTimeout(() => addLog("Finding sources..."), 1200);
    setTimeout(() => addLog(`Target identified: ${url}`), 2000);

    try {
      const response = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch video info");
      }

      const data = await response.json();
      addLog("Extracting metadata...");
      setTimeout(() => addLog("Decoding stream map..."), 500);
      setTimeout(() => addLog("Almost there..."), 1000);
      
      setTimeout(() => {
        setVideoInfo(data);
        setLoading(false);
        addLog("SUCCESS: Metadata extracted.");
      }, 1500);

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      addLog(`ERROR: ${err.message}`);
    }
  };

  // Filter formats
  const videoFormats = videoInfo?.formats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none') || [];
  const audioFormats = videoInfo?.formats.filter(f => f.vcodec === 'none' && f.acodec !== 'none') || [];

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <div className="scanline"></div>

      {/* Header */}
      <header className="border-b border-outline bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-primary font-bold tracking-widest text-xl glow-text">PALERMO</span>
            <span className="text-outline text-[10px] hidden md:block px-2 border border-outline uppercase tracking-widest">SYSTEM: ACTIVE</span>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-white hover:text-primary transition-colors flex items-center gap-2">
              <Terminal size={14} />
              <span className="text-[10px] uppercase font-bold tracking-widest">CONSOLE</span>
            </button>
            <button className="text-white hover:text-primary transition-colors flex items-center gap-2">
              <Settings size={14} />
              <span className="text-[10px] uppercase font-bold tracking-widest">CONFIG</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center px-6 py-12 md:py-20">
        <AnimatePresence mode="wait">
          {!videoInfo && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl w-full text-center space-y-12"
            >
              <div className="space-y-4">
                <div className="text-primary opacity-90 select-none mb-8">
                  <pre className="font-mono text-[0.4rem] md:text-[0.6rem] leading-none inline-block text-left">
{`██████╗  █████╗ ██╗     ███████╗██████╗ ███╗   ███╗ ██████╗ 
██╔══██╗██╔══██╗██║     ██╔════╝██╔══██╗████╗ ████║██╔═══██╗
██████╔╝███████║██║     █████╗  ██████╔╝██╔████╔██║██║   ██║
██╔═══╝ ██╔══██╗██║     ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║
██║     ██║  ██║███████╗███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝
╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ `}
                  </pre>
                </div>
                <h1 className="text-2xl md:text-4xl uppercase tracking-tight font-bold">
                  Free, simple, powerful video downloader.
                </h1>
                <p className="text-outline text-sm md:text-base max-w-xl mx-auto italic">
                  Universal media extraction interface. High-fidelity streams, zero overhead.
                </p>
              </div>

              <div className="w-full max-w-2xl mx-auto space-y-6">
                <div className="relative group">
                  <div className="absolute -top-3 left-4 bg-background px-2 text-[10px] font-bold text-outline tracking-widest uppercase z-10">
                    Input_Module_V1.0
                  </div>
                  <div className="ghost-border p-6 bg-surface flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-grow flex items-center w-full">
                      <span className="text-primary font-bold mr-3 whitespace-nowrap">ENTER LINK &gt;</span>
                      <input 
                        type="text" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && findVideo()}
                        className="bg-transparent border-none focus:ring-0 text-white w-full font-mono placeholder:text-outline/50" 
                        placeholder="https://..." 
                      />
                      <span className="terminal-loader"></span>
                    </div>
                    <button 
                      onClick={findVideo}
                      className="w-full md:w-auto px-8 py-3 bg-primary text-black font-bold hover:bg-white transition-colors whitespace-nowrap uppercase text-sm tracking-widest"
                    >
                      [ FIND VIDEO ]
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="ghost-border p-4 bg-surface text-left space-y-2">
                    <div className="flex items-center gap-2 text-secondary">
                      <Search size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Quality</span>
                    </div>
                    <div className="text-xs font-bold text-white/70">4K / 1080P / AUTO</div>
                  </div>
                  <div className="ghost-border p-4 bg-surface text-left space-y-2">
                    <div className="flex items-center gap-2 text-secondary">
                      <Activity size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Status</span>
                    </div>
                    <div className="text-xs font-bold text-white/70">READY_TO_EXTRACT</div>
                  </div>
                  <div className="ghost-border p-4 bg-surface text-left space-y-2">
                    <div className="flex items-center gap-2 text-secondary">
                      <ShieldCheck size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Secure</span>
                    </div>
                    <div className="text-xs font-bold text-white/70">ENCRYPTED_TUNNEL</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-4xl space-y-8"
            >
              <div className="flex items-center justify-between border-b border-outline pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-secondary animate-pulse"></div>
                  <h2 className="text-lg uppercase tracking-widest text-secondary font-bold">Execution_Log</h2>
                </div>
                <span className="text-outline text-[10px] uppercase">PROCESS_ID: {Math.floor(Math.random() * 9000) + 1000}-YTDL</span>
              </div>

              <div className="bg-surface border border-outline p-6 min-h-[300px] flex flex-col font-mono text-sm leading-relaxed">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-4 mb-1">
                    <span className="text-outline shrink-0">{log.split(']')[0]}]</span>
                    <span className={log.includes('ERROR') ? 'text-red-400' : log.includes('SUCCESS') ? 'text-primary' : 'text-white/80'}>
                      {log.split(']')[1]}
                    </span>
                  </div>
                ))}
                <div className="mt-4">
                  <span className="text-secondary font-medium">Processing...<span className="terminal-loader"></span></span>
                </div>
                <div ref={logEndRef} />
              </div>
            </motion.div>
          )}

          {videoInfo && !loading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-6xl space-y-8"
            >
              {/* Video Header */}
              <section className="border-l-4 border-primary bg-surface p-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="flex-grow">
                    <span className="text-secondary font-mono text-[10px] block mb-2 tracking-[0.2em] uppercase">Target Metadata</span>
                    <h1 className="text-xl md:text-3xl font-bold text-white leading-tight mb-4 uppercase tracking-tight">
                      {videoInfo.title}
                    </h1>
                    <div className="flex flex-wrap gap-8 text-outline">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest mb-1">Duration</span>
                        <span className="text-white font-mono text-lg">{videoInfo.duration_string}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest mb-1">Source ID</span>
                        <span className="text-white font-mono text-lg">{videoInfo.id}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest mb-1">Platform</span>
                        <span className="text-white font-mono text-lg">{new URL(videoInfo.webpage_url).hostname.replace('www.', '')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-64 aspect-video bg-background ghost-border overflow-hidden">
                    <img 
                      src={videoInfo.thumbnail} 
                      alt="Thumbnail" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-80"
                    />
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Video Formats */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Video className="text-primary" size={20} />
                    <h2 className="text-lg font-bold tracking-widest uppercase">Video (with audio)</h2>
                  </div>
                  <div className="space-y-2">
                    {videoFormats.length > 0 ? videoFormats.map((format, i) => (
                      <div key={i} className="group flex items-center justify-between p-4 bg-surface ghost-border hover:border-primary transition-all">
                        <div className="flex items-center gap-6">
                          <span className="text-primary font-mono text-lg font-bold w-12">{format.resolution}</span>
                          <div className="flex flex-col">
                            <span className="text-white font-medium">{format.format_note || 'Standard'}</span>
                            <span className="text-[10px] text-outline font-mono">
                              {format.fps}fps • {format.ext} • {format.filesize ? (format.filesize / (1024 * 1024)).toFixed(1) + 'MB' : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <a 
                          href={format.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-primary text-black px-6 py-2 font-mono font-bold text-xs hover:bg-white transition-colors"
                        >
                          [ DOWNLOAD ]
                        </a>
                      </div>
                    )) : (
                      <div className="p-4 bg-surface/50 border border-dashed border-outline text-outline text-center text-xs">
                        No direct video+audio formats found. Try separate streams.
                      </div>
                    )}
                  </div>
                </div>

                {/* Audio Formats */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Music className="text-tertiary" size={20} />
                    <h2 className="text-lg font-bold tracking-widest uppercase">Audio Only</h2>
                  </div>
                  <div className="space-y-4">
                    {audioFormats.slice(0, 5).map((format, i) => (
                      <div key={i} className="p-6 bg-surface border-t-2 border-tertiary flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-white text-sm">{format.ext.toUpperCase()} Stream</h3>
                            <p className="text-[10px] text-outline font-mono">
                              {format.format_note || 'Audio'} • {format.filesize ? (format.filesize / (1024 * 1024)).toFixed(1) + 'MB' : 'N/A'}
                            </p>
                          </div>
                          {i === 0 && <span className="text-tertiary font-mono text-[10px]">[HQ]</span>}
                        </div>
                        <a 
                          href={format.url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full border border-tertiary text-tertiary py-3 text-center font-mono font-bold text-xs hover:bg-tertiary hover:text-black transition-all"
                        >
                          [ GET_AUDIO ]
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => { setVideoInfo(null); setUrl(''); }}
                className="text-outline hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest"
              >
                &lt; BACK_TO_DASHBOARD
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && !loading && (
          <div className="mt-8 p-4 border border-red-500/30 bg-red-500/5 flex items-start gap-4 max-w-2xl w-full">
            <AlertTriangle className="text-red-500 shrink-0" size={18} />
            <div className="text-xs font-mono text-red-400">
              <span className="font-bold">SYSTEM_ERROR:</span> {error}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-outline bg-background py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-[10px] font-bold text-outline">
            <span className="text-primary animate-pulse">●</span>
            <span>SYSTEM READY | USER: ANONYMOUS</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-[10px] font-bold text-white hover:text-primary tracking-widest uppercase transition-colors">HELP</a>
            <a href="#" className="text-[10px] font-bold text-white hover:text-primary tracking-widest uppercase transition-colors">API_DOCS</a>
            <span className="text-[10px] font-bold text-outline uppercase">VERSION 1.0.4</span>
          </div>
          <div className="text-[10px] font-bold text-outline uppercase">
            © PALERMO_SYS_2026
          </div>
        </div>
      </footer>
    </div>
  );
}
