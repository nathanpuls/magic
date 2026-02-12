"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Copy, UploadCloud } from "lucide-react";

// Initialize Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MobileClient() {
    const [content, setContent] = useState<string | null>(null);
    const [status, setStatus] = useState("Tap to Send");
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("s");

    const sendClipboard = async () => {
        try {
            setStatus("Reading...");
            const text = await navigator.clipboard.readText();
            setContent(text);

            setStatus("Sending...");

            // Send via Supabase Realtime Broadcast
            await supabase.channel(`magic-${sessionId}`).send({
                type: "broadcast",
                event: "clipboard-sync",
                payload: { text: text },
            });

            setStatus("Sent!");

            // Vibrate for feedback
            if (navigator.vibrate) navigator.vibrate(50);

            setTimeout(() => {
                setStatus("Done!");
            }, 1000);

        } catch (err) {
            console.error(err);
            setStatus("Tap to Grant Access");
        }
    };

    if (!sessionId) {
        return (
            <div className="min-h-screen bg-black text-white p-8 font-bold flex items-center justify-center text-center">
                Error: Invalid Session<br />Please scan again.
            </div>
        )
    }

    return (
        <div
            className="min-h-screen bg-black text-white flex flex-col items-center justify-center cursor-pointer select-none active:bg-gray-900 transition-colors touch-manipulation"
            onClick={sendClipboard}
        >
            <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className={`
                w-32 h-32 rounded-full mx-auto flex items-center justify-center transition-all duration-300
                ${status === "Sent!" ? "bg-green-500 scale-110 shadow-green-500/50 shadow-2xl" : "bg-white/10 hover:bg-white/20 active:scale-95"}
            `}>
                    {status === "Sent!" ? (
                        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                        <UploadCloud className="w-16 h-16 text-white/80" strokeWidth={1.5} />
                    )}
                </div>

                <div>
                    <h1 className="text-3xl font-bold tracking-tight uppercase font-mono">{status}</h1>
                    <p className="text-gray-500 text-sm mt-2 font-mono">Tap anywhere</p>
                </div>

                {content && (
                    <div className="bg-gray-900 rounded-lg p-4 mx-8 text-left border border-gray-800 max-w-xs">
                        <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-1 border-b border-gray-800 pb-1">Sent Content</p>
                        <p className="text-gray-300 text-xs truncate font-mono">
                            {content}
                        </p>
                    </div>
                )}
            </div>

            <div className="fixed bottom-8 text-[10px] text-gray-700 font-mono uppercase tracking-widest">
                Session: {sessionId.slice(0, 4)}...
            </div>
        </div>
    );
}
