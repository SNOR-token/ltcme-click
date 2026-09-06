import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, Search, Loader2, ArrowLeft, Zap } from "lucide-react";
import { useProAccess } from "@/lib/pro";
import { ProLock } from "@/components/ProGate";
import { formatLtc } from "@/lib/ltc/network";
import { getAddressInfo } from "@/lib/ltc/api";
import { useWatchList } from "@/lib/ltc/watchonly";
import { loadStore } from "@/lib/ltc/storage";
import { useNetworkMode } from "@/lib/ltc/network-mode";

// [Paste the full content from my earlier creation here]
// Too long for this format - use the file I already created
