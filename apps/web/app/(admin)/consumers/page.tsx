"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Box,
  Copy,
  Filter,
  Key,
  Lock,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  Terminal,
  User,
  Users,
} from "lucide-react";

// --- Types ---
type AuthType = "API Key" | "JWT" | "OAuth2" | "Basic" | "None";
type ConsumerStatus = "active" | "warning" | "revoked";

interface Consumer {
  id: string;
  name: string;
  username: string;
  authType: AuthType[];
  tags: string[];
  lastSeen: string;
  status: ConsumerStatus;
  requests24h: number;
}

// --- Mock Data ---
const MOCK_CONSUMERS: Consumer[] = [
  {
    id: "csm_prd_9x81",
    name: "Web Client (Production)",
    username: "web-client-v1",
    authType: ["JWT"],
    tags: ["frontend", "tier-1"],
    lastSeen: "Just now",
    status: "active",
    requests24h: 125430,
  },
  {
    id: "csm_ios_2m4k",
    name: "iOS Mobile App",
    username: "ios-app-v3",
    authType: ["JWT", "API Key"],
    tags: ["mobile", "tier-1"],
    lastSeen: "2m ago",
    status: "active",
    requests24h: 89021,
  },
  {
    id: "csm_ptn_7v3n",
    name: "Stripe Webhooks",
    username: "stripe-svc",
    authType: ["Basic"],
    tags: ["partner", "billing"],
    lastSeen: "15m ago",
    status: "active",
    requests24h: 432,
  },
  {
    id: "csm_dev_1a2b",
    name: "Localhost Testing",
    username: "dev-test-runner",
    authType: ["None"],
    tags: ["dev", "internal"],
    lastSeen: "3d ago",
    status: "warning",
    requests24h: 12,
  },
  {
    id: "csm_b2b_8k9l",
    name: "Acme Corp Integration",
    username: "acme-b2b-api",
    authType: ["API Key"],
    tags: ["b2b", "tier-2"],
    lastSeen: "1w ago",
    status: "revoked",
    requests24h: 0,
  },
  {
    id: "csm_adm_4p5q",
    name: "Internal Admin Dashboard",
    username: "admin-ui",
    authType: ["OAuth2"],
    tags: ["internal", "admin"],
    lastSeen: "1h ago",
    status: "active",
    requests24h: 5420,
  },
];

// --- Utility Components ---
const Badge = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`px-2 py-0.5 text-[10px] font-medium rounded-md font-mono tracking-wide border ${className}`}
  >
    {children}
  </span>
);

const MetricCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  colorClass,
}: any) => (
  <div className="bg-[#0f0f12] border border-white/5 rounded-xl p-5 shadow-sm flex flex-col relative overflow-hidden group">
    <div className="absolute -right-6 -top-6 text-white/[0.02] group-hover:text-white/[0.04] transition-colors duration-500">
      <Icon className="w-24 h-24" />
    </div>
    <div className="flex items-center gap-3 text-zinc-400 mb-3">
      <Icon className={`w-4 h-4 ${colorClass}`} />
      <span className="text-xs font-semibold uppercase tracking-wider">
        {title}
      </span>
    </div>
    <div className="text-2xl font-semibold text-white tracking-tight mb-1">
      {value}
    </div>
    <div className="flex items-center gap-2 text-xs">
      {trend && (
        <span
          className={
            trend.startsWith("+") ? "text-emerald-400" : "text-red-400"
          }
        >
          {trend}
        </span>
      )}
      <span className="text-zinc-500">{trendLabel}</span>
    </div>
  </div>
);

// --- Main Page Component ---
export default function ConsumersPage() {
  const [consumers, setConsumers] = useState<Consumer[]>(MOCK_CONSUMERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredConsumers = useMemo(() => {
    return consumers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [consumers, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-blue-500/30">
      <main className="mx-auto max-w-[1200px] px-6 py-12 space-y-8">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Consumers
            </h1>
            <p className="text-zinc-400 text-sm max-w-xl">
              Manage the applications and users that connect to your API
              gateway. Configure credentials, monitor activity, and enforce
              access control.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white text-zinc-900 hover:bg-zinc-200 transition-colors shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">
              <Plus className="h-4 w-4" />
              <span>New Consumer</span>
            </button>
          </div>
        </header>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <MetricCard
            title="Total Consumers"
            value="142"
            icon={Users}
            trend="+12"
            trendLabel="this month"
            colorClass="text-blue-400"
          />
          <MetricCard
            title="Active (24h)"
            value="118"
            icon={Activity}
            trend="83%"
            trendLabel="activity rate"
            colorClass="text-emerald-400"
          />
          <MetricCard
            title="Revoked / Blocked"
            value="6"
            icon={ShieldAlert}
            trend="-2"
            trendLabel="since last week"
            colorClass="text-red-400"
          />
        </motion.div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#0f0f12] p-2 rounded-xl border border-white/5 shadow-sm">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name, username, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181b] border border-white/5 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-[#18181b] border border-white/5 rounded-lg p-1">
              {(["all", "active", "warning", "revoked"] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                      statusFilter === status
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    {status}
                  </button>
                ),
              )}
            </div>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-[#18181b] border border-white/5 text-zinc-300 hover:text-white hover:bg-white/5 transition-all">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Consumers List */}
        <div className="bg-[#0f0f12] border border-white/5 rounded-xl shadow-xl overflow-hidden">
          {/* List Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-[#18181b]/50 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            <div className="col-span-5 sm:col-span-4 lg:col-span-4">
              Consumer Details
            </div>
            <div className="hidden lg:block col-span-3">Authentication</div>
            <div className="hidden sm:block col-span-3 lg:col-span-2">Tags</div>
            <div className="col-span-4 sm:col-span-3 lg:col-span-2">
              Activity
            </div>
            <div className="col-span-3 sm:col-span-2 lg:col-span-1 text-right">
              Status
            </div>
          </div>

          {/* List Body */}
          <div className="divide-y divide-white/5">
            <AnimatePresence initial={false}>
              {filteredConsumers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-6 py-12 text-center flex flex-col items-center justify-center"
                >
                  <Users className="h-10 w-10 text-zinc-700 mb-3" />
                  <p className="text-zinc-300 text-sm font-medium">
                    No consumers found
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">
                    Try adjusting your search criteria.
                  </p>
                </motion.div>
              ) : (
                filteredConsumers.map((consumer, index) => (
                  <motion.div
                    key={consumer.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="group grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Consumer Details */}
                    <div className="col-span-5 sm:col-span-4 lg:col-span-4 flex items-center gap-4 min-w-0 pr-4">
                      <div className="hidden sm:flex h-9 w-9 rounded-lg bg-[#18181b] border border-white/5 items-center justify-center shrink-0 text-zinc-400 group-hover:text-white transition-colors">
                        {consumer.tags.includes("mobile") ? (
                          <User className="h-4 w-4" />
                        ) : consumer.tags.includes("b2b") ? (
                          <Box className="h-4 w-4" />
                        ) : (
                          <Terminal className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-white truncate">
                          {consumer.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-zinc-400 font-mono truncate">
                            {consumer.username}
                          </span>
                          <button className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition-all focus:opacity-100">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Authentication Type (Desktop Only) */}
                    <div className="hidden lg:flex col-span-3 items-center gap-1.5 min-w-0 pr-4">
                      {consumer.authType.map((auth, i) => (
                        <Badge
                          key={i}
                          className={`
                          ${auth === "JWT" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : ""}
                          ${auth === "API Key" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : ""}
                          ${auth === "OAuth2" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : ""}
                          ${auth === "Basic" ? "bg-zinc-500/10 text-zinc-300 border-zinc-500/20" : ""}
                          ${auth === "None" ? "bg-red-500/10 text-red-400 border-red-500/20" : ""}
                        `}
                        >
                          <span className="flex items-center gap-1">
                            {auth === "API Key" && <Key className="h-3 w-3" />}
                            {auth === "JWT" && <Lock className="h-3 w-3" />}
                            {auth}
                          </span>
                        </Badge>
                      ))}
                    </div>

                    {/* Tags */}
                    <div className="hidden sm:flex col-span-3 lg:col-span-2 flex-wrap gap-1 pr-4">
                      {consumer.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#18181b] text-zinc-400 border border-white/5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Activity */}
                    <div className="col-span-4 sm:col-span-3 lg:col-span-2 flex flex-col justify-center gap-0.5">
                      <span className="text-xs text-zinc-300">
                        {consumer.lastSeen}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {consumer.requests24h >= 1000
                          ? `${(consumer.requests24h / 1000).toFixed(1)}k req/24h`
                          : `${consumer.requests24h} req/24h`}
                      </span>
                    </div>

                    {/* Status & Actions */}
                    <div className="col-span-3 sm:col-span-2 lg:col-span-1 flex items-center justify-end gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`relative flex h-2 w-2`}>
                          {consumer.status === "active" && (
                            <>
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </>
                          )}
                          {consumer.status === "warning" && (
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          )}
                          {consumer.status === "revoked" && (
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          )}
                        </span>
                        <span className="hidden sm:inline text-xs font-medium text-zinc-400 capitalize">
                          {consumer.status}
                        </span>
                      </div>

                      <button className="text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all p-1">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Footer Pagination Mock */}
          <div className="px-6 py-4 border-t border-white/5 bg-[#18181b]/30 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Showing {filteredConsumers.length} of {consumers.length} consumers
            </span>
            <div className="flex gap-1">
              <button
                disabled
                className="px-2 py-1 text-xs text-zinc-600 font-medium rounded hover:bg-white/5 disabled:opacity-50 transition-colors"
              >
                Prev
              </button>
              <button className="px-2 py-1 text-xs text-white font-medium rounded bg-white/10 transition-colors">
                1
              </button>
              <button className="px-2 py-1 text-xs text-zinc-400 font-medium rounded hover:bg-white/5 hover:text-white transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
