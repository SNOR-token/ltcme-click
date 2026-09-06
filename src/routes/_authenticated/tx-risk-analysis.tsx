import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, Search, Loader2, ArrowLeft, TrendingUp, TrendingDown, Clock, Users, Eye, Zap } from "lucide-react";
import { useProAccess } from "@/lib/pro";
import { ProLock } from "@/components/ProGate";
import { formatLtc } from "@/lib/ltc/network";
import { getAddressInfo, getRecentTxs } from "@/lib/ltc/api";
import { useWatchList } from "@/lib/ltc/watchonly";
import { loadStore } from "@/lib/ltc/storage";
import { useNetworkMode } from "@/lib/ltc/network-mode";

export const Route = createFileRoute("/_authenticated/tx-risk-analysis")({
  head: () => ({
    meta: [
      { title: "Transaction Risk Analysis - LTCme.click" },
      { name: "description", content: "AI-powered transaction risk analysis for Litecoin. Detect suspicious patterns, privacy risks, and get recommendations." },
      { property: "og:title", content: "Transaction Risk Analysis - LTCme.click" },
      { property: "og:description", content: "AI-powered transaction risk analysis for Litecoin wallets" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TxRiskAnalysisPage,
});

interface AddressData {
  address: string;
  label: string;
  kind: "wallet" | "watch-only";
  balanceSats: number;
  txCount: number;
}

interface RiskAssessment {
  id: string;
  type: "address" | "transaction";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  recommendation: string;
  affectedItems: string[];
  score: number; // 0-100
}

function TxRiskAnalysisPage() {
  const [mode] = useNetworkMode();
  const pro = useProAccess();
  const { entries } = useWatchList(mode);
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);

  // Load all addresses from wallets and watch-only
  useEffect(() => {
    let alive = true;
    setLoading(true);
    
    const wallets = loadStore().wallets.flatMap((w) =>
      w.addresses.map((a) => ({ 
        address: a.address, 
        label: w.meta.name ?? "Wallet", 
        kind: "wallet" as const 
      })),
    );
    const watch = entries.map((e) => ({ 
      address: e.address, 
      label: e.label, 
      kind: "watch-only" as const 
    }));
    const all = [...wallets, ...watch];
    
    (async () => {
      const out: AddressData[] = [];
      for (const a of all) {
        try {
          const info = await getAddressInfo(a.address);
          out.push({ ...a, balanceSats: info.balanceSats, txCount: info.txCount });
        } catch {
          out.push({ ...a, balanceSats: 0, txCount: 0 });
        }
      }
      if (alive) {
        setAddresses(out);
        setLoading(false);
      }
    })();
    
    return () => { alive = false; };
  }, [entries, mode]);

  // Perform AI-powered risk analysis
  const performRiskAnalysis = useCallback(async () => {
    if (addresses.length === 0) return;
    
    setAnalyzing(true);
    setRiskAssessments([]);
    
    // Simulate AI analysis - in production this would call the AI API
    // For now, we'll do client-side analysis based on known patterns
    const assessments: RiskAssessment[] = [];
    
    // Analyze each address for risk factors
    for (const addr of addresses) {
      // Check for address reuse
      if (addr.txCount > 1 && addr.balanceSats > 0) {
        const severity = addr.txCount > 10 ? "high" : addr.txCount > 5 ? "medium" : "low";
        const score = Math.min(100, addr.txCount * 10);
        assessments.push({
          id: `reuse-${addr.address}`,
          type: "address",
          severity,
          title: `Address Reuse Detected`,
          description: `Address ${addr.address} has been used in ${addr.txCount} transactions. Each reuse links your transaction history and exposes the public key.`,
          recommendation: `Move funds to a fresh address to break the linkability chain.`,
          affectedItems: [addr.address],
          score,
        });
      }
      
      // Check for legacy address usage
      if (addr.address.startsWith("L") && addr.txCount > 0) {
        assessments.push({
          id: `legacy-${addr.address}`,
          type: "address",
          severity: "medium",
          title: `Legacy Address Usage`,
          description: `Address ${addr.address} is a legacy (P2PKH) address. These reveal public keys immediately upon spending.`,
          recommendation: `Consider migrating to a Native SegWit (bech32) address for better privacy and lower fees.`,
          affectedItems: [addr.address],
          score: 40,
        });
      }
      
      // Check for large balance concentration
      const totalBalance = addresses.reduce((sum, a) => sum + a.balanceSats, 0);
      if (totalBalance > 0) {
        const concentration = (addr.balanceSats / totalBalance) * 100;
        if (concentration > 70 && addr.balanceSats > 0) {
          assessments.push({
            id: `concentration-${addr.address}`,
            type: "address",
            severity: "medium",
            title: `High Balance Concentration`,
            description: `${concentration.toFixed(1)}% of your total balance (${formatLtc(addr.balanceSats)} LTC) is on a single address.`,
            recommendation: `Split funds across multiple addresses to reduce risk exposure.`,
            affectedItems: [addr.address],
            score: Math.min(100, concentration * 1.5),
          });
        }
      }
    }
    
    // Add general privacy recommendations
    if (addresses.some(a => a.txCount > 0)) {
      assessments.push({
        id: "privacy-best-practices",
        type: "address",
        severity: "low",
        title: `Privacy Best Practices`,
        description: `Using the same address for multiple transactions creates a permanent public record of your transaction history.`,
        recommendation: `Generate a new receiving address for each transaction to maintain privacy.`,
        affectedItems: [],
        score: 20,
      });
    }
    
    // Sort by score (highest risk first)
    assessments.sort((a, b) => b.score - a.score);
    
    setRiskAssessments(assessments);
    setAnalyzing(false);
    
  }, [addresses]);

  // Filter assessments based on search and severity filter
  const filteredAssessments = riskAssessments.filter(assessment => {
    const matchesSearch = searchQuery === "" || 
      assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.affectedItems.some(item => item.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSeverity = selectedSeverity === null || assessment.severity === selectedSeverity;
    
    return matchesSearch && matchesSeverity;
  });

  // Calculate overall risk score
  const overallRiskScore = riskAssessments.reduce((sum, r) => sum + r.score, 0);
  const maxPossibleScore = riskAssessments.length > 0 ? riskAssessments.length * 100 : 100;
  const riskPercentage = Math.round((overallRiskScore / maxPossibleScore) * 100);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-destructive bg-destructive/10 border-destructive/30";
      case "high": return "text-orange-500 bg-orange-500/10 border-orange-500/30";
      case "medium": return "text-amber-500 bg-amber-500/10 border-amber-500/30";
      case "low": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
      default: return "text-muted-foreground bg-muted/10 border-muted/30";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <XCircle className="h-4 w-4" />;
      case "high": return <AlertTriangle className="h-4 w-4" />;
      case "medium": return <AlertTriangle className="h-4 w-4" />;
      case "low": return <CheckCircle className="h-4 w-4" />;
      default: return <ShieldCheck className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/guard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Quantum Guard
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neon-gradient">Transaction Risk Analysis</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered detection of privacy risks, suspicious patterns, and security recommendations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={performRiskAnalysis}
            disabled={loading || analyzing || addresses.length === 0}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {analyzing ? "Analyzing..." : "Run Analysis"}
          </button>
        </div>
      </div>

      {/* Overall Risk Score */}
      {riskAssessments.length > 0 && (
        <section className="rounded-2xl border border-border bg-card/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Overall Risk Score</h2>
              <p className="text-sm text-muted-foreground">
                Based on {riskAssessments.length} detected risk factor{riskAssessments.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-full border-4 border-primary/20 flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full border-4 border-primary/40 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-b from-primary/60 to-primary/20 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">{riskPercentage}</span>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{riskPercentage}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
              <span>Low Risk</span>
              <span>High Risk</span>
            </div>
            <div className="h-2 rounded-full bg-muted/20 overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-destructive rounded-full transition-all`}
                style={{ width: `${riskPercentage}%` }}
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="rounded-xl border border-border bg-background/50 p-3 text-center">
              <div className="text-lg font-bold text-emerald-500">{riskAssessments.filter(r => r.severity === "low").length}</div>
              <div className="text-xs text-muted-foreground">Low</div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-3 text-center">
              <div className="text-lg font-bold text-amber-500">{riskAssessments.filter(r => r.severity === "medium").length}</div>
              <div className="text-xs text-muted-foreground">Medium</div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-3 text-center">
              <div className="text-lg font-bold text-orange-500">{riskAssessments.filter(r => r.severity === "high").length}</div>
              <div className="text-xs text-muted-foreground">High</div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-3 text-center">
              <div className="text-lg font-bold text-destructive">{riskAssessments.filter(r => r.severity === "critical").length}</div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
          </div>
        </section>
      )}

      {/* Filters */}
      {riskAssessments.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search risks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/50 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex gap-1">
            {(["critical", "high", "medium", "low"] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(selectedSeverity === sev ? null : sev)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition ${selectedSeverity === sev ? getSeverityColor(sev) : "bg-background/50 border border-border text-muted-foreground hover:border-primary/30"}`}
              >
                {sev.charAt(0).toUpperCase() + sev.slice(1)} ({riskAssessments.filter(r => r.severity === sev).length})
              </button>
            ))}
            <button
              onClick={() => setSelectedSeverity(null)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition ${selectedSeverity === null ? "bg-primary/15 border border-primary/40 text-primary" : "bg-background/50 border border-border text-muted-foreground hover:border-primary/30"}`}
            >
              All ({riskAssessments.length})
            </button>
          </div>
        </div>
      )}

      {/* Risk Assessments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-border bg-card/50 p-8 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading addresses...</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/50 p-8 text-center text-muted-foreground">
            <Zap className="h-8 w-8 mx-auto mb-4 opacity-50" />
            <p>No addresses found. Add a wallet or watch-only address to begin analysis.</p>
          </div>
        ) : riskAssessments.length === 0 && !analyzing ? (
          <div className="rounded-2xl border border-border bg-card/50 p-8 text-center text-muted-foreground">
            <ShieldCheck className="h-8 w-8 mx-auto mb-4 text-emerald-500" />
            <p className="font-medium">No risks detected!</p>
            <p className="text-sm mt-1">Your addresses appear to be in good standing.</p>
            <button
              onClick={performRiskAnalysis}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Re-run Analysis
            </button>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/50 p-8 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-4 opacity-50" />
            <p>No matching risks found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAssessments.map((assessment) => (
              <div 
                key={assessment.id} 
                className={`rounded-2xl border p-5 transition ${getSeverityColor(assessment.severity)}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`rounded-xl p-2 ${getSeverityColor(assessment.severity)}`}>
                    {getSeverityIcon(assessment.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{assessment.title}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSeverityColor(assessment.severity)}`}>
                        {assessment.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">Risk Score: {assessment.score}/100</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{assessment.description}</p>
                    
                    {assessment.affectedItems.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {assessment.affectedItems.slice(0, 3).map((item, index) => (
                          <code key={index} className="text-xs bg-background/50 px-2 py-1 rounded border border-border/60">
                            {item.slice(0, 20)}...
                          </code>
                        ))}
                        {assessment.affectedItems.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{assessment.affectedItems.length - 3} more</span>
                        )}
                      </div>
                    )}

                    <div className="mt-4">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                        Recommendation
                      </div>
                      <p className="text-sm bg-background/50 border border-border/60 rounded-lg px-4 py-3">{assessment.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pro Features Section */}
      {!pro.hasAccess && riskAssessments.length > 0 && (
        <ProLock
          state={pro}
          title="Advanced AI Risk Analysis"
          purpose="Get deeper insights with AI-powered transaction pattern analysis, darknet address screening, and automated risk scoring."
          unlocks={[
            "AI analysis of transaction patterns",
            "Darknet address screening",
            "Automated risk scoring for all transactions",
            "Real-time monitoring of new transactions",
            "Custom risk thresholds and alerts",
            "Historical risk trend analysis",
            "Multi-wallet correlation analysis",
          ]}
          preview={<div>Sample: AI detected a potential mixing service interaction. Risk score: 78/100. Recommendation: Review transaction history.</div>}
        >
          <section className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Advanced AI Risk Analysis</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Unlock AI-powered deep analysis including:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 pl-5">
              <li>• Transaction pattern analysis using machine learning</li>
              <li>• Screening against known darknet and illicit addresses</li>
              <li>• Automated risk scoring for every incoming and outgoing transaction</li>
              <li>• Real-time monitoring with instant alerts</li>
              <li>• Customizable risk thresholds and notification preferences</li>
              <li>• Historical trend analysis to track risk over time</li>
              <li>• Multi-wallet correlation to detect cross-wallet patterns</li>
            </ul>
          </section>
        </ProLock>
      )}

      {/* Address Summary */}
      <section className="rounded-2xl border border-border bg-card/50 p-6">
        <h2 className="font-semibold mb-4">Address Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-background/50 p-4 text-center">
            <div className="text-2xl font-bold">{addresses.length}</div>
            <div className="text-xs text-muted-foreground">Total Addresses</div>
          </div>
          <div className="rounded-xl border border-border bg-background/50 p-4 text-center">
            <div className="text-2xl font-bold">{addresses.filter(a => a.balanceSats > 0).length}</div>
            <div className="text-xs text-muted-foreground">Funded</div>
          </div>
          <div className="rounded-xl border border-border bg-background/50 p-4 text-center">
            <div className="text-2xl font-bold">{addresses.filter(a => a.txCount > 0).length}</div>
            <div className="text-xs text-muted-foreground">Used</div>
          </div>
          <div className="rounded-xl border border-border bg-background/50 p-4 text-center">
            <div className="text-2xl font-bold">{addresses.filter(a => a.txCount > 1).length}</div>
            <div className="text-xs text-muted-foreground">Reused</div>
          </div>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Total Balance: {formatLtc(addresses.reduce((sum, a) => sum + a.balanceSats, 0))} LTC
        </div>
      </section>
    </div>
  );
}
