"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Plus,
  RefreshCw,
  User,
  Zap,
} from "lucide-react";

// --- Types ---
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type CircuitState = "Closed" | "Open" | "Half-open";

interface RequestLog {
  id: string;
  method: HttpMethod;
  path: string;
  status: number;
  latency: number;
  consumer: string;
  timeAgo: string;
}

interface Route {
  id: string;
  prefix: string;
  target: string;
  active: boolean;
  requests: number;
}

interface UpstreamService {
  id: string;
  name: string;
  url: string;
  state: CircuitState;
  failures: number;
  lastFailure: string | null;
}

// --- Mock Data ---
const MOCK_REQUESTS: RequestLog[] = [
  {
    id: "1",
    method: "GET",
    path: "/api/v1/products",
    status: 200,
    latency: 45,
    consumer: "consumer_web_01",
    timeAgo: "2s ago",
  },
  {
    id: "2",
    method: "POST",
    path: "/auth/login",
    status: 201,
    latency: 120,
    consumer: "consumer_mobile_02",
    timeAgo: "5s ago",
  },
  {
    id: "3",
    method: "DELETE",
    path: "/api/v1/orders/ord_92kfa",
    status: 204,
    latency: 85,
    consumer: "consumer_admin_01",
    timeAgo: "12s ago",
  },
  {
    id: "4",
    method: "GET",
    path: "/billing/invoices",
    status: 403,
    latency: 42,
    consumer: "anonymous",
    timeAgo: "15s ago",
  },
  {
    id: "5",
    method: "POST",
    path: "/webhooks/stripe",
    status: 200,
    latency: 310,
    consumer: "svc_webhooks",
    timeAgo: "22s ago",
  },
  {
    id: "6",
    method: "GET",
    path: "/api/v1/search?q=keyboard",
    status: 200,
    latency: 68,
    consumer: "consumer_web_01",
    timeAgo: "28s ago",
  },
  {
    id: "7",
    method: "PATCH",
    path: "/api/v1/users/usr_8f3d",
    status: 400,
    latency: 55,
    consumer: "consumer_mobile_02",
    timeAgo: "34s ago",
  },
  {
    id: "8",
    method: "POST",
    path: "/billing/subscriptions",
    status: 502,
    latency: 405,
    consumer: "svc_billing",
    timeAgo: "41s ago",
  },
  {
    id: "9",
    method: "GET",
    path: "/health",
    status: 200,
    latency: 12,
    consumer: "anonymous",
    timeAgo: "45s ago",
  },
  {
    id: "10",
    method: "POST",
    path: "/internal/reindex",
    status: 202,
    latency: 185,
    consumer: "consumer_admin_01",
    timeAgo: "52s ago",
  },
];

const MOCK_ROUTES: Route[] = [
  {
    id: "rt_1",
    prefix: "/api/v1",
    target: "https://products-service.internal:4001",
    active: true,
    requests: 14205,
  },
  {
    id: "rt_2",
    prefix: "/auth",
    target: "https://auth-service.internal:4002",
    active: true,
    requests: 8432,
  },
  {
    id: "rt_3",
    prefix: "/billing",
    target: "https://billing-service.internal:4003",
    active: false,
    requests: 0,
  },
  {
    id: "rt_4",
    prefix: "/webhooks",
    target: "https://webhook-processor.internal:4004",
    active: true,
    requests: 310,
  },
  {
    id: "rt_5",
    prefix: "/search",
    target: "https://search-service.internal:4005",
    active: true,
    requests: 6721,
  },
  {
    id: "rt_6",
    prefix: "/internal",
    target: "https://admin-service.internal:4006",
    active: false,
    requests: 0,
  },
];

const MOCK_SERVICES: UpstreamService[] = [
  {
    id: "svc_1",
    name: "Products Service",
    url: "https://products-service.internal:4001",
    state: "Closed",
    failures: 0,
    lastFailure: null,
  },
  {
    id: "svc_2",
    name: "Auth Service",
    url: "https://auth-service.internal:4002",
    state: "Closed",
    failures: 1,
    lastFailure: "12m ago",
  },
  {
    id: "svc_3",
    name: "Billing Service",
    url: "https://billing-service.internal:4003",
    state: "Half-open",
    failures: 4,
    lastFailure: "2m ago",
  },
  {
    id: "svc_4",
    name: "Webhook Processor",
    url: "https://webhook-processor.internal:4004",
    state: "Open",
    failures: 12,
    lastFailure: "15s ago",
  },
  {
    id: "svc_5",
    name: "Search Service",
    url: "https://search-service.internal:4005",
    state: "Closed",
    failures: 0,
    lastFailure: null,
  },
  {
    id: "svc_6",
    name: "Analytics Service",
    url: "https://analytics-service.internal:4006",
    state: "Closed",
    failures: 2,
    lastFailure: "1h ago",
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
    className={`px-2 py-0.5 text-xs font-medium rounded-md font-mono ${className}`}
  >
    {children}
  </span>
);

const Toggle = ({
  active,
  onChange,
  label,
}: {
  active: boolean;
  onChange: () => void;
  label: string;
}) => (
  <button
    role="switch"
    aria-checked={active}
    aria-label={label}
    onClick={onChange}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0c10] ${
      active ? "bg-blue-600" : "bg-[#272a33]"
    }`}
  >
    <motion.span
      layout
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      initial={false}
      animate={{ x: active ? 16 : 0 }}
    />
  </button>
);

// --- Formatting Helpers ---
const getMethodColors = (method: HttpMethod) => {
  const map: Record<HttpMethod, string> = {
    GET: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
    POST: "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20",
    PUT: "text-purple-400 bg-purple-400/10 border border-purple-400/20",
    PATCH: "text-orange-400 bg-orange-400/10 border border-orange-400/20",
    DELETE: "text-red-400 bg-red-400/10 border border-red-400/20",
  };
  return map[method];
};

const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300) return "text-emerald-400";
  if (status >= 400 && status < 500) return "text-amber-400";
  return "text-red-400";
};

const getLatencyColor = (latency: number) => {
  if (latency < 100) return "text-emerald-400";
  if (latency <= 300) return "text-amber-400";
  return "text-red-400";
};

// --- Main Dashboard ---
export default function ConduitDashboard() {
  const [routes, setRoutes] = useState<Route[]>(MOCK_ROUTES);
  const [services, setServices] = useState<UpstreamService[]>(MOCK_SERVICES);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const handleToggleRoute = (id: string) => {
    setRoutes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)),
    );
  };

  const handleResetCircuit = (id: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, state: "Closed", failures: 0 } : s,
      ),
    );
    setResetSuccess(id);
    setTimeout(() => setResetSuccess(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#f3f4f6] font-sans selection:bg-blue-500/30 selection:text-blue-200">
      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#f3f4f6]">
              Gateway Overview
            </h1>
            <p className="mt-1 text-sm text-[#9ca3af]">
              Monitor API traffic, route health, consumers, and upstream
              reliability.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-[#14151a] border border-[#272a33] text-sm text-[#9ca3af]">
              <Clock className="h-4 w-4" />
              <span>Last 24 hours</span>
              <ChevronDown className="h-3 w-3" />
            </div>
            <button
              aria-label="Refresh"
              className="p-1.5 text-[#9ca3af] hover:text-[#f3f4f6] transition-colors rounded-md border border-[#272a33] bg-[#14151a] hover:bg-[#1a1c23]"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button className="flex items-center space-x-2 px-4 py-1.5 text-sm font-medium rounded-md bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors shadow-sm shadow-blue-900/20 active:scale-95">
              <Plus className="h-4 w-4" />
              <span>Add Route</span>
            </button>
          </div>
        </motion.div>

        {/* Metric Overview Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            {
              label: "Total Requests",
              value: "24,831",
              trend: "+12.4%",
              desc: "vs previous 24h",
              icon: Activity,
              trendUp: true,
            },
            {
              label: "Active Routes",
              value: "12",
              trend: "2 inactive",
              desc: "14 total routes",
              icon: Database,
              trendUp: false,
            },
            {
              label: "Active Consumers",
              value: "8",
              trend: "3 added",
              desc: "this week",
              icon: User,
              trendUp: true,
            },
            {
              label: "Avg Latency",
              value: "42ms",
              trend: "Healthy",
              desc: "p95 is 105ms",
              icon: Zap,
              trendUp: true,
              valColor: "text-emerald-400",
            },
          ].map((metric, i) => (
            <div
              key={i}
              className="flex flex-col p-4 rounded-xl bg-[#14151a] border border-[#272a33]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                  {metric.label}
                </span>
                <metric.icon className="h-4 w-4 text-[#6b7280]" />
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span
                  className={`text-2xl font-mono tracking-tight ${metric.valColor || "text-[#f3f4f6]"}`}
                >
                  {metric.value}
                </span>
                {/* SVG Sparkline Mock */}
                <svg
                  className="h-6 w-16 stroke-[#3b82f6] fill-none opacity-60"
                  viewBox="0 0 100 30"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 25 Q 10 15, 20 20 T 40 10 T 60 25 T 80 5 T 100 15"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="mt-2 flex items-center space-x-1 text-xs">
                <span
                  className={
                    metric.trendUp
                      ? "text-emerald-400 font-medium"
                      : "text-[#9ca3af]"
                  }
                >
                  {metric.trend}
                </span>
                <span className="text-[#6b7280]">{metric.desc}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Recent Requests */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="lg:col-span-8 flex flex-col rounded-xl bg-[#14151a] border border-[#272a33] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#272a33]">
              <div className="flex items-center space-x-3">
                <h2 className="text-base font-semibold text-[#f3f4f6]">
                  Recent Requests
                </h2>
                <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">
                    Live
                  </span>
                </div>
              </div>
              <button className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors">
                View all
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[#272a33] bg-[#1a1c23]/50">
                    <th className="px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
                      Path
                    </th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
                      Latency
                    </th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
                      Consumer
                    </th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider text-right">
                      Time Ago
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#272a33]/50">
                  {MOCK_REQUESTS.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-[#1a1c23] transition-colors group"
                    >
                      <td className="px-5 py-2.5">
                        <Badge className={getMethodColors(req.method)}>
                          {req.method}
                        </Badge>
                      </td>
                      <td className="px-5 py-2.5 font-mono text-sm text-[#d1d5db] group-hover:text-white transition-colors">
                        {req.path}
                      </td>
                      <td className="px-5 py-2.5">
                        <span
                          className={`font-mono text-sm ${getStatusColor(req.status)}`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        <span
                          className={`font-mono text-sm ${getLatencyColor(req.latency)}`}
                        >
                          {req.latency}ms
                        </span>
                      </td>
                      <td className="px-5 py-2.5 font-mono text-xs text-[#9ca3af]">
                        {req.consumer}
                      </td>
                      <td className="px-5 py-2.5 font-mono text-xs text-[#6b7280] text-right">
                        {req.timeAgo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Right Panel: Routes */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="lg:col-span-4 flex flex-col rounded-xl bg-[#14151a] border border-[#272a33]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#272a33]">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-semibold text-[#f3f4f6]">
                  Routes
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#1a1c23] border border-[#272a33] text-xs text-[#9ca3af]">
                  12
                </span>
              </div>
              <button
                aria-label="Add Route"
                className="p-1 rounded bg-[#1a1c23] border border-[#272a33] text-[#9ca3af] hover:text-white hover:border-[#3b82f6]/50 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col p-2 space-y-1 overflow-y-auto max-h-[480px]">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#1a1c23] border border-transparent hover:border-[#272a33] transition-all group"
                >
                  <div className="flex flex-col min-w-0 pr-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-medium text-[#e5e7eb] truncate">
                        {route.prefix}
                      </span>
                      <Badge className="bg-[#1a1c23] text-[#9ca3af] border border-[#272a33] px-1.5 font-sans">
                        {route.requests >= 1000
                          ? `${(route.requests / 1000).toFixed(1)}k`
                          : route.requests}
                      </Badge>
                    </div>
                    <span className="font-mono text-xs text-[#6b7280] truncate mt-1 group-hover:text-[#9ca3af] transition-colors">
                      {route.target}
                    </span>
                  </div>
                  <Toggle
                    active={route.active}
                    onChange={() => handleToggleRoute(route.id)}
                    label={`Toggle route ${route.prefix}`}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Panel: Circuit Breakers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="rounded-xl bg-[#14151a] border border-[#272a33] p-5 lg:p-6"
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#f3f4f6]">
              Circuit Breakers
            </h2>
            <p className="text-sm text-[#9ca3af]">
              Upstream service health and failure protection status.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {services.map((svc) => (
                <motion.div
                  key={svc.id}
                  layout
                  className={`flex flex-col rounded-lg border bg-[#0b0c10] p-4 transition-colors ${
                    svc.state === "Open"
                      ? "border-red-500/30 shadow-[0_0_15px_-3px_rgba(239,68,68,0.1)]"
                      : svc.state === "Half-open"
                        ? "border-amber-500/30"
                        : "border-[#272a33]"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[#f3f4f6]">
                        {svc.name}
                      </span>
                      <span
                        className="font-mono text-xs text-[#6b7280] mt-1 truncate max-w-[200px]"
                        title={svc.url}
                      >
                        {svc.url}
                      </span>
                    </div>
                    <Badge
                      className={`
                      ${svc.state === "Closed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : ""}
                      ${svc.state === "Half-open" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : ""}
                      ${svc.state === "Open" ? "bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1" : ""}
                    `}
                    >
                      {svc.state === "Open" && (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {svc.state}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#272a33]/50">
                    <div className="flex flex-col">
                      <span className="text-xs text-[#9ca3af]">
                        {svc.failures} failures
                      </span>
                      {svc.lastFailure && (
                        <span className="text-[10px] text-[#6b7280]">
                          Last: {svc.lastFailure}
                        </span>
                      )}
                    </div>

                    <button
                      disabled={svc.state === "Closed"}
                      onClick={() => handleResetCircuit(svc.id)}
                      className={`relative overflow-hidden px-3 py-1.5 text-xs font-medium rounded border transition-all ${
                        svc.state === "Closed"
                          ? "bg-[#14151a] border-[#272a33] text-[#6b7280] cursor-not-allowed"
                          : "bg-[#1a1c23] border-[#3b82f6]/50 text-[#f3f4f6] hover:bg-[#3b82f6]/10 hover:border-[#3b82f6] active:scale-95"
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {resetSuccess === svc.id ? (
                          <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center space-x-1 text-emerald-400"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Reset</span>
                          </motion.div>
                        ) : (
                          <motion.span
                            key="default"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            Reset
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
