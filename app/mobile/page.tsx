"use client";

import { Suspense } from "react";
import MobileClient from "@/components/MobileClient";

export const dynamic = "force-dynamic";

export default function MobilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center font-mono animate-pulse">Scanning...</div>}>
            <MobileClient />
        </Suspense>
    );
}
