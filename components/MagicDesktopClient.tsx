"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import QRCode from "react-qr-code";
import { v4 as uuidv4 } from "uuid";
import { Copy } from "lucide-react";

// Initialize Supabase Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MagicDesktopClient() {
    const [sessionId, setSessionId] = useState("");
    const [content, setContent] = useState<string | null>(null);
    const [status, setStatus] = useState("Scan to Connect");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // 1. Get or Generate Session ID (Persistent)
        let sessionId = localStorage.getItem("magic_session_id");
        if (!sessionId) {
            sessionId = uuidv4();
            localStorage.setItem("magic_session_id", sessionId);
        }
        setSessionId(sessionId);

        // 2. Subscribe to Realtime Channel
        const channel = supabase.channel(`magic-${sessionId}`);

        channel
            .on("broadcast", { event: "clipboard-sync" }, (payload) => {
                console.log("Received payload:", payload);
                if (payload.payload?.text) {
                    handleNewContent(payload.payload.text);
                }
            })
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    console.log("Ready to receive on channel " + sessionId);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleNewContent = async (text: string) => {
        setContent(text);
        setStatus("Received!");

        // Auto-copy if focused and supported
        try {
            await navigator.clipboard.writeText(text);
            setStatus("Copied to Clipboard!");
        } catch (e) {
            setStatus("Click to Copy");
        }
    };

    const manualCopy = async () => {
        if (content) {
            try {
                await navigator.clipboard.writeText(content);
                setStatus("Copied!");
            } catch (e) {
                setStatus("Failed to copy");
            }
        }
    };

    const mobileUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/mobile?s=${sessionId}`
        : '';

    if (!mounted || !sessionId) return <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">Initializing Magic Drop...</div>;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-white/20 selection:text-white">
            {content ? (
                // CONTENT RECEIVED STATE
                <div className="text-center animate-in fade-in zoom-in duration-300 max-w-2xl w-full">
                    <div
                        className="relative bg-gray-900 rounded-2xl border border-gray-800 hover:border-white/20 transition-all text-left overflow-hidden group shadow-2xl shadow-blue-500/10"
                    >
                        {/* Header / Status */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                            <span className="text-gray-400 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                {status}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    manualCopy();
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors border border-white/5 hover:border-white/20"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                Copy
                            </button>
                        </div>

                        {/* Content Area */}
                        <div
                            onClick={manualCopy}
                            className="p-8 cursor-pointer hover:bg-white/5 transition-colors min-h-[120px] max-h-[60vh] overflow-y-auto custom-scrollbar"
                        >
                            <pre className="text-sm md:text-xl font-mono whitespace-pre-wrap break-words text-gray-100">
                                {content}
                            </pre>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setContent(null);
                            setStatus("Ready");
                        }}
                        className="mt-8 text-gray-500 hover:text-white transition-colors text-sm font-mono flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                    >
                        ← Scan Another QR Code
                    </button>
                </div>
            ) : (
                // QR CODE STATE
                <div className="text-center space-y-8 animate-in fade-in duration-500">
                    <div className="bg-white p-4 rounded-xl inline-block shadow-2xl shadow-white/5 hover:scale-105 transition-transform duration-300">
                        <QRCode value={mobileUrl} size={256} />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">Magic Drop</h1>
                        <p className="text-gray-500 font-mono text-sm">Scan with your phone to send clipboard instantly</p>
                    </div>

                    {/* Debug info */}
                    <div className="text-[10px] text-gray-800 font-mono font-bold tracking-widest uppercase opacity-20">
                        Session: {sessionId.slice(0, 8)}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="fixed bottom-4 text-xs text-gray-800 font-mono opacity-20 hover:opacity-100 transition-opacity">
                Made with ❤️ by Pipe
            </div>
        </div>
    );
}
