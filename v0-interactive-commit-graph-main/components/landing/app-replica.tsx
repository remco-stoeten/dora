"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Database,
  SquareTerminal,
  Table2,
  Share2,
  Settings,
  Package,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Columns3,
  FileText,
  Upload,
  PanelLeft,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  X,
  Sun,
  Info,
  Sparkles,
  Check,
  KeyRound,
  Hash,
  Pencil,
  Copy,
  CopyPlus,
  Download,
  CircleSlash2,
  Trash2,
  Play,
  Clock,
  Braces,
  Bookmark,
} from "lucide-react"

/* ---------- data model ---------- */

type Connection = {
  id: string
  name: string
  engine: string
  host: string
  color: string
}

const CONNECTIONS: Connection[] = [
  { id: "ecom", name: "Demo E-Commerce", engine: "PostgreSQL", host: "localhost", color: "#bcbcbc" },
  { id: "neon", name: "Neon Production", engine: "PostgreSQL", host: "ep-cool-bird.neon.tech", color: "#60a5fa" },
  { id: "turso", name: "Edge Analytics", engine: "libSQL", host: "analytics.turso.io", color: "#22d3ee" },
  { id: "local", name: "Local Dev", engine: "SQLite", host: "./dev.db", color: "#a3a3a3" },
]

type Column = { key: string; type: string; pk?: boolean }

type TableDef = {
  name: string
  count: number
  columns: Column[]
  indexes: number
  row: (i: number) => Record<string, string | number>
}

const FIRST = ["Mason","James","Mia","Evelyn","Charlotte","Olivia","Amelia","Oliver","Harper","Liam","Noah","Ava","Sophia","Lucas","Isabella","Ethan"]
const LAST = ["Miller","Moore","Anderson","Thomas","Wilson","Jackson","Jones","Martin","Davis","Gonzalez","Johnson","Brown","Garcia","Lee"]
const CITIES = ["Charlotte","San Antonio","Philadelphia","Chicago","Phoenix","Los Angeles","Houston","Dallas","Seattle","Boston"]
const COUNTRIES = ["Sweden","UK","Netherlands","Germany","Australia","Canada","France","Spain","Italy","Japan"]
const PRODUCTS = ["Wireless Mouse","Mechanical Keyboard","USB-C Hub","4K Monitor","Laptop Stand","Webcam","Desk Mat","Headphones","SSD 1TB","Router"]
const STATUS = ["paid","pending","shipped","refunded","cancelled"]

/* ---------- SQL console demo data ---------- */

const SQL_QUERY =
  "select name, city, country\nfrom customers\nwhere country = 'Sweden'\norder by name\nlimit 4;"

const SQL_COLUMNS = ["name", "city", "country"]
const SQL_RESULTS: Array<Record<string, string>> = [
  { name: "Amelia Davis", city: "Seattle", country: "Sweden" },
  { name: "Ethan Brown", city: "Chicago", country: "Sweden" },
  { name: "Mia Wilson", city: "Boston", country: "Sweden" },
  { name: "Oliver Jones", city: "Dallas", country: "Sweden" },
]

// lightweight SQL syntax highlighter -> coloured tokens, line by line
const SQL_TOKEN =
  /('[^']*')|(\b\d+(?:\.\d+)?\b)|(\b(?:select|from|where|order|by|group|having|limit|offset|and|or|not|insert|into|values|update|set|delete|join|left|right|inner|outer|on|as|desc|asc|null|like|in|is|distinct|count|sum|avg|min|max)\b)/gi

function highlightSql(text: string) {
  const out: React.ReactNode[] = []
  let last = 0
  let i = 0
  let m: RegExpExecArray | null
  SQL_TOKEN.lastIndex = 0
  while ((m = SQL_TOKEN.exec(text)) !== null) {
    if (m.index > last) out.push(<span key={i++}>{text.slice(last, m.index)}</span>)
    let cls = "text-[#cfcfcf]"
    if (m[1]) cls = "text-[#a8cc8c]" // string literal
    else if (m[2]) cls = "text-[#c8a165]" // number
    else if (m[3]) cls = "text-[#7aa6d6]" // keyword
    out.push(
      <span key={i++} className={cls}>
        {m[0]}
      </span>,
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(<span key={i++}>{text.slice(last)}</span>)
  return out
}

function SqlConsole({
  sqlText,
  phase,
  ms,
  caret,
}: {
  sqlText: string
  phase: "idle" | "running" | "done"
  ms: number | null
  caret: boolean
}) {
  const lines = sqlText.split("\n")
  return (
    <>
      {/* tab bar */}
      <div className="flex items-center h-[38px] border-b border-[#1f1f1f] px-2">
        <div className="flex items-center gap-2 h-[30px] px-3 rounded-t-[4px] bg-[#161616] border border-b-0 border-[#262626]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
          <span className="text-[12px] text-[#e6e6e6]">Query 1</span>
          <X className="w-3 h-3 text-[#6a6a6a]" />
        </div>
        <Plus className="w-3.5 h-3.5 text-[#6a6a6a] ml-1.5" strokeWidth={1.8} />
      </div>

      {/* toolbar */}
      <div className="flex items-center justify-between h-11 px-2.5 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 rounded-[4px] hover:bg-[#161616] text-[#8a8a8a] cursor-pointer">
            <Database className="w-4 h-4" strokeWidth={1.7} />
          </div>
          <div className="p-1.5 rounded-[4px] hover:bg-[#161616] text-[#8a8a8a] cursor-pointer">
            <Clock className="w-4 h-4" strokeWidth={1.7} />
          </div>
          <div className="w-px h-5 bg-[#262626] mx-1" />
          <div className="flex items-center gap-0.5 h-7 rounded-[5px] bg-[#161616] border border-[#262626] p-0.5">
            <span className="inline-flex items-center gap-1 h-6 px-2 rounded-[4px] bg-[#262626] text-[12px] text-[#e6e6e6]">
              SQL
            </span>
            <span className="inline-flex items-center h-6 px-2 rounded-[4px] text-[12px] text-[#8a8a8a]">
              Drizzle
            </span>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 h-7 px-2 rounded-[4px] text-[12px] text-[#bcbcbc] hover:bg-[#161616] transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5" strokeWidth={1.8} />
            Save
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-demo="run-query"
            className={`flex items-center gap-1.5 h-7 pl-2.5 pr-2 rounded-[4px] text-xs font-medium transition-colors ${
              phase === "running"
                ? "bg-[#bcbcbc] text-[#0a0a0a]"
                : "bg-[#ededed] text-[#0a0a0a] hover:bg-white"
            }`}
          >
            <Play className="w-3.5 h-3.5" strokeWidth={2} fill="currentColor" />
            {phase === "running" ? "Running…" : "Run"}
            <kbd className="ml-0.5 inline-flex items-center h-4 px-1 rounded-[3px] bg-black/15 text-[9px] font-sans">
              ⌘↵
            </kbd>
          </button>
        </div>
      </div>

      {/* editor */}
      <div data-demo="sql-editor" className="flex-1 min-h-0 overflow-auto bg-[#0e0e0e]">
        <div className="flex font-mono text-[12.5px] leading-[22px] py-2">
          <div className="shrink-0 w-10 text-right pr-3 select-none text-[#3a3a3a] tabular-nums">
            {lines.map((_, idx) => (
              <div key={idx}>{idx + 1}</div>
            ))}
          </div>
          <pre className="flex-1 whitespace-pre pr-4 text-[#cfcfcf]">
            {lines.map((line, idx) => (
              <div key={idx}>
                {highlightSql(line)}
                {caret && idx === lines.length - 1 ? (
                  <span className="dora-caret inline-block w-[1.5px] h-[14px] ml-px bg-[#d4d4d4] align-middle" />
                ) : null}
                {line.length === 0 && !(caret && idx === lines.length - 1) ? "\u200b" : ""}
              </div>
            ))}
          </pre>
        </div>
      </div>

      {/* results panel */}
      <div className="h-[188px] shrink-0 border-t border-[#1f1f1f] flex flex-col">
        <div className="flex items-center gap-2 h-8 px-3 border-b border-[#1f1f1f] text-[#8a8a8a]">
          <Table2 className="w-3.5 h-3.5" strokeWidth={1.8} />
          <Braces className="w-3.5 h-3.5" strokeWidth={1.8} />
          <span className="flex-1" />
          {phase === "done" ? (
            <span className="text-[11px] text-[#7a7a7a] tabular-nums">
              {SQL_RESULTS.length} rows · <span className="text-[#e6e6e6]">{ms}ms</span>
            </span>
          ) : null}
          <Download className="w-3.5 h-3.5 ml-2" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          {phase === "done" ? (
            <div className="min-w-max">
              <div className="flex items-center h-8 border-b border-[#1f1f1f] bg-[#111111] sticky top-0">
                {SQL_COLUMNS.map((c) => (
                  <div key={c} className="w-[180px] shrink-0 px-3 text-[12px] font-medium text-[#cfcfcf]">
                    {c}
                  </div>
                ))}
              </div>
              {SQL_RESULTS.map((r, idx) => (
                <div
                  key={r.name}
                  className="dora-rowin flex items-center h-[30px] border-b border-[#161616]"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {SQL_COLUMNS.map((c) => (
                    <div
                      key={c}
                      className={`w-[180px] shrink-0 px-3 text-[12.5px] truncate ${
                        c === "name" ? "text-[#dcdcdc]" : "text-[#bcbcbc]"
                      }`}
                    >
                      {r[c]}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[12px] text-[#5a5a5a]">
              {phase === "running" ? "Executing query…" : "Run a query to see results"}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function pad(n: number) {
  return n.toString().padStart(2, "0")
}

const TABLES: TableDef[] = [
  {
    name: "customers",
    count: 50,
    indexes: 2,
    columns: [
      { key: "id", type: "serial", pk: true },
      { key: "name", type: "varchar(100)" },
      { key: "email", type: "varchar(255)" },
      { key: "phone", type: "varchar(20)" },
      { key: "city", type: "varchar(50)" },
      { key: "country", type: "varchar(50)" },
      { key: "created_at", type: "timestamp" },
    ],
    row: (i) => {
      const first = FIRST[i % FIRST.length]
      const last = LAST[(i * 3 + 1) % LAST.length]
      return {
        id: i + 1,
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
        phone: `+1-${100 + ((i * 37) % 900)}-${200 + ((i * 53) % 700)}-${1000 + ((i * 97) % 9000)}`,
        city: CITIES[(i * 7) % CITIES.length],
        country: COUNTRIES[(i * 5) % COUNTRIES.length],
        created_at: `2025-${pad(1 + (i % 12))}-${pad(1 + (i % 27))} 09:${pad(i % 60)}`,
      }
    },
  },
  {
    name: "products",
    count: 25,
    indexes: 1,
    columns: [
      { key: "id", type: "serial", pk: true },
      { key: "title", type: "varchar(120)" },
      { key: "sku", type: "varchar(24)" },
      { key: "price", type: "numeric(10,2)" },
      { key: "stock", type: "integer" },
      { key: "created_at", type: "timestamp" },
    ],
    row: (i) => ({
      id: i + 1,
      title: PRODUCTS[i % PRODUCTS.length],
      sku: `SKU-${1000 + i * 7}`,
      price: `$${(19 + ((i * 13) % 480)).toFixed(2)}`,
      stock: (i * 17) % 240,
      created_at: `2025-${pad(1 + (i % 12))}-${pad(1 + (i % 27))} 11:${pad(i % 60)}`,
    }),
  },
  {
    name: "orders",
    count: 100,
    indexes: 3,
    columns: [
      { key: "id", type: "serial", pk: true },
      { key: "customer_id", type: "integer" },
      { key: "total", type: "numeric(10,2)" },
      { key: "status", type: "varchar(20)" },
      { key: "created_at", type: "timestamp" },
    ],
    row: (i) => ({
      id: i + 1,
      customer_id: 1 + ((i * 7) % 50),
      total: `$${(25 + ((i * 53) % 940)).toFixed(2)}`,
      status: STATUS[i % STATUS.length],
      created_at: `2025-${pad(1 + (i % 12))}-${pad(1 + (i % 27))} 14:${pad(i % 60)}`,
    }),
  },
  {
    name: "order_items",
    count: 150,
    indexes: 2,
    columns: [
      { key: "id", type: "serial", pk: true },
      { key: "order_id", type: "integer" },
      { key: "product_id", type: "integer" },
      { key: "qty", type: "integer" },
      { key: "unit_price", type: "numeric(10,2)" },
    ],
    row: (i) => ({
      id: i + 1,
      order_id: 1 + ((i * 3) % 100),
      product_id: 1 + ((i * 5) % 25),
      qty: 1 + (i % 6),
      unit_price: `$${(9 + ((i * 11) % 220)).toFixed(2)}`,
    }),
  },
  {
    name: "inventory",
    count: 120,
    indexes: 1,
    columns: [
      { key: "id", type: "serial", pk: true },
      { key: "product_id", type: "integer" },
      { key: "warehouse", type: "varchar(40)" },
      { key: "on_hand", type: "integer" },
      { key: "reserved", type: "integer" },
    ],
    row: (i) => ({
      id: i + 1,
      product_id: 1 + ((i * 5) % 25),
      warehouse: CITIES[(i * 3) % CITIES.length],
      on_hand: (i * 23) % 500,
      reserved: (i * 7) % 60,
    }),
  },
  {
    name: "transactions",
    count: 250,
    indexes: 4,
    columns: [
      { key: "id", type: "serial", pk: true },
      { key: "order_id", type: "integer" },
      { key: "amount", type: "numeric(10,2)" },
      { key: "method", type: "varchar(20)" },
      { key: "created_at", type: "timestamp" },
    ],
    row: (i) => ({
      id: i + 1,
      order_id: 1 + ((i * 3) % 100),
      amount: `$${(25 + ((i * 53) % 940)).toFixed(2)}`,
      method: ["card", "paypal", "wire", "credit"][i % 4],
      created_at: `2025-${pad(1 + (i % 12))}-${pad(1 + (i % 27))} 16:${pad(i % 60)}`,
    }),
  },
  {
    name: "subscriptions",
    count: 60,
    indexes: 2,
    columns: [
      { key: "id", type: "serial", pk: true },
      { key: "customer_id", type: "integer" },
      { key: "plan", type: "varchar(20)" },
      { key: "status", type: "varchar(20)" },
      { key: "renews_at", type: "date" },
    ],
    row: (i) => ({
      id: i + 1,
      customer_id: 1 + ((i * 7) % 50),
      plan: ["free", "pro", "team", "enterprise"][i % 4],
      status: ["active", "trialing", "past_due", "canceled"][i % 4],
      renews_at: `2026-${pad(1 + (i % 12))}-${pad(1 + (i % 27))}`,
    }),
  },
]

const COL_WIDTH: Record<string, string> = {
  id: "w-[110px]",
  name: "w-[170px]",
  title: "w-[180px]",
  email: "w-[250px]",
  phone: "w-[160px]",
  city: "w-[140px]",
  country: "w-[140px]",
  created_at: "w-[170px]",
  renews_at: "w-[140px]",
  customer_id: "w-[130px]",
  order_id: "w-[120px]",
  product_id: "w-[130px]",
  sku: "w-[140px]",
  price: "w-[120px]",
  unit_price: "w-[130px]",
  total: "w-[120px]",
  amount: "w-[120px]",
  stock: "w-[110px]",
  qty: "w-[90px]",
  on_hand: "w-[120px]",
  reserved: "w-[120px]",
  warehouse: "w-[150px]",
  status: "w-[130px]",
  method: "w-[120px]",
  plan: "w-[120px]",
}

function cellClass(key: string) {
  if (key === "id") return "text-[#7a7a7a] tabular-nums"
  if (key === "email") return "text-[#9fb8d6]"
  if (key === "name" || key === "title") return "text-[#dcdcdc]"
  if (["price", "unit_price", "total", "amount", "stock", "qty", "on_hand", "reserved", "customer_id", "order_id", "product_id"].includes(key))
    return "text-[#bcbcbc] tabular-nums"
  return "text-[#bcbcbc]"
}

/* ---------- motion helpers ---------- */

type Pt = { x: number; y: number }

// Real cubic-bezier timing solver (Newton-Raphson) -> After Effects style eases
function makeBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const dx = sampleX(t) - x
      if (Math.abs(dx) < 1e-5) break
      const d = slopeX(t)
      if (Math.abs(d) < 1e-6) break
      t -= dx / d
    }
    return sampleY(t)
  }
}

// snappy travel: punch out fast, glide into the target
const easeTravel = makeBezier(0.6, 0.02, 0.16, 1)
// short hops + exits: clean ease-out
const easeSettle = makeBezier(0.22, 1, 0.32, 1)

function quadBezier(p0: Pt, c: Pt, p1: Pt, t: number): Pt {
  const u = 1 - t
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  }
}

/* ---------- small pieces ---------- */

function RailIcon({
  icon: Icon,
  active,
  dataRail,
  onClick,
}: {
  icon: typeof Database
  active?: boolean
  dataRail?: string
  onClick?: () => void
}) {
  return (
    <div className="relative flex items-center justify-center" data-rail={dataRail}>
      {active ? (
        <span className="absolute -left-[6px] top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-r-full bg-[#e6e6e6]" />
      ) : null}
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center justify-center w-9 h-9 rounded-[4px] transition-colors cursor-pointer ${
          active ? "bg-[#171717] text-[#f0f0f0]" : "text-[#6a6a6a] hover:text-[#bcbcbc] hover:bg-[#161616]"
        }`}
      >
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.6} />
      </button>
    </div>
  )
}

function ToolbarButton({
  children,
  icon: Icon,
  primary,
  onClick,
  dataDemo,
}: {
  children: React.ReactNode
  icon?: typeof Plus
  primary?: boolean
  onClick?: () => void
  dataDemo?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-demo={dataDemo}
      className={`flex items-center gap-1.5 h-7 px-2.5 rounded-[4px] text-xs whitespace-nowrap transition-colors ${
        primary
          ? "bg-[#ededed] text-[#0a0a0a] font-medium hover:bg-white"
          : "text-[#bcbcbc] border border-[#262626] hover:bg-[#161616]"
      }`}
    >
      {Icon ? <Icon className="w-3.5 h-3.5" strokeWidth={1.8} /> : null}
      {children}
    </button>
  )
}

function Checkbox({ checked, indeterminate }: { checked: boolean; indeterminate?: boolean }) {
  return (
    <div
      className={`w-3.5 h-3.5 rounded-[2px] flex items-center justify-center border transition-colors ${
        checked || indeterminate
          ? "bg-[#ededed] border-[#ededed]"
          : "border-[#3a3a3a] group-hover:border-[#4a4a4a]"
      }`}
    >
      {checked ? (
        <Check className="w-2.5 h-2.5 text-[#0a0a0a]" strokeWidth={3} />
      ) : indeterminate ? (
        <div className="w-1.5 h-0.5 bg-[#0a0a0a] rounded-full" />
      ) : null}
    </div>
  )
}

function SelBtn({ icon: Icon, label }: { icon: typeof Database; label: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 h-7 px-2 rounded-[5px] text-[12px] text-[#bcbcbc] hover:bg-[#1f1f1f] transition-colors"
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
      {label}
    </button>
  )
}

/* ---------- main ---------- */

export function AppReplica() {
  const [connId, setConnId] = useState(CONNECTIONS[0].id)
  const [connOpen, setConnOpen] = useState(false)
  const [activeTable, setActiveTable] = useState("customers")
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [structureOpen, setStructureOpen] = useState(true)

  // demo state
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [extraRows, setExtraRows] = useState<Array<Record<string, string | number>>>([])
  const [highlightId, setHighlightId] = useState<number | null>(null)
  const [flash, setFlash] = useState<{ x: number; y: number; ms: number; id: number } | null>(null)
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null)
  const [cursorVisible, setCursorVisible] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [cursorLabel, setCursorLabel] = useState<string | null>(null)
  const [queryMs, setQueryMs] = useState<number | null>(null)
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set())
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set())
  const [heldKeys, setHeldKeys] = useState<{ keys: string[]; caption?: string } | null>(null)

  // database switcher + SQL console state
  const [view, setView] = useState<"table" | "sql">("table")
  const [connFx, setConnFx] = useState(false)
  const [sqlText, setSqlText] = useState("")
  const [sqlPhase, setSqlPhase] = useState<"idle" | "running" | "done">("idle")
  const [sqlResultMs, setSqlResultMs] = useState<number | null>(null)
  const [keyPulse, setKeyPulse] = useState(0)
  // ambient realtime updates streaming in from "other clients"
  const [liveVals, setLiveVals] = useState<Record<string, string>>({})
  const [liveFx, setLiveFx] = useState<Record<string, number>>({})

  const scrollRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const posRef = useRef<Pt>({ x: 0, y: 0 })
  const rafRef = useRef<number>(0)
  const arcSignRef = useRef(1)

  const conn = CONNECTIONS.find((c) => c.id === connId) ?? CONNECTIONS[0]
  const table = TABLES.find((t) => t.name === activeTable) ?? TABLES[0]

  const visibleBase = Math.min(table.count, 50)
  const baseRows = useMemo(
    () => Array.from({ length: visibleBase }, (_, i) => table.row(i)),
    [table, visibleBase],
  )
  const rows = useMemo(
    () => [...extraRows, ...baseRows].filter((r) => !removedIds.has(r.id as number)),
    [extraRows, baseRows, removedIds],
  )
  const total = table.count + extraRows.length - removedIds.size

  const allChecked = selected.size === rows.length && rows.length > 0
  const someChecked = selected.size > 0 && !allChecked

  function toggleRow(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id as number))))
  }

  function switchTable(name: string) {
    setActiveTable(name)
    setSelected(new Set())
    setEdits({})
    setExtraRows([])
    setEditingKey(null)
    setHighlightId(null)
    setQueryMs(null)
    setRemovedIds(new Set())
    setRemovingIds(new Set())
    setHeldKeys(null)
    setLiveVals({})
    setLiveFx({})
    scrollRef.current?.scrollTo({ top: 0 })
  }

  /* ---------- cinematic cursor choreography ---------- */
  useEffect(() => {
    if (activeTable !== "customers") return
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let cancelled = false
    const root = rootRef.current
    if (!root) return

    function setCursor(p: Pt) {
      posRef.current = p
      const el = cursorRef.current
      if (el) el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
    }

    function center(selector: string): Pt | null {
      const r = rootRef.current
      if (!r) return null
      const el = r.querySelector(selector) as HTMLElement | null
      if (!el) return null
      const cr = r.getBoundingClientRect()
      const er = el.getBoundingClientRect()
      return {
        x: er.left - cr.left + er.width * 0.5,
        y: er.top - cr.top + er.height * 0.5,
      }
    }

    const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms))

    // move with an arcing bezier path (spatial) + bezier-eased timing (hand-animated feel)
    function moveTo(to: Pt, duration: number, ease = easeTravel) {
      return new Promise<void>((resolve) => {
        const from = { ...posRef.current }
        const dx = to.x - from.x
        const dy = to.y - from.y
        const len = Math.hypot(dx, dy) || 1
        // perpendicular control offset -> arc
        const nx = -dy / len
        const ny = dx / len
        arcSignRef.current *= -1
        const k = Math.min(len * 0.2, 72) * arcSignRef.current
        const ctrl = { x: (from.x + to.x) / 2 + nx * k, y: (from.y + to.y) / 2 + ny * k }
        const start = performance.now()
        const step = (now: number) => {
          if (cancelled) return resolve()
          let t = (now - start) / duration
          if (t > 1) t = 1
          setCursor(quadBezier(from, ctrl, to, ease(t)))
          if (t < 1) rafRef.current = requestAnimationFrame(step)
          else resolve()
        }
        rafRef.current = requestAnimationFrame(step)
      })
    }

    // gentle idle wobble while paused at a point -> never looks frozen
    function hold(ms: number, base: Pt) {
      return new Promise<void>((resolve) => {
        const start = performance.now()
        const step = (now: number) => {
          if (cancelled) return resolve()
          const e = now - start
          const ox = Math.sin(e / 430) * 1.7 + Math.sin(e / 160) * 0.5
          const oy = Math.cos(e / 380) * 1.4
          setCursor({ x: base.x + ox, y: base.y + oy })
          if (e < ms) rafRef.current = requestAnimationFrame(step)
          else resolve()
        }
        rafRef.current = requestAnimationFrame(step)
      })
    }

    async function click() {
      const p = posRef.current
      setRipple({ x: p.x + 3, y: p.y + 4, id: Date.now() })
      setPressed(true)
      await sleep(80)
      if (cancelled) return
      setPressed(false)
      await sleep(45)
    }

    async function typeText(text: string, base: Pt, setter: (s: string) => void = setDraft) {
      let cur = ""
      for (const ch of text) {
        if (cancelled) return
        cur += ch
        setter(cur)
        const delay = ch === " " ? 70 : ch === "\n" ? 90 : 26 + Math.random() * 38
        await hold(delay, base)
      }
    }

    function makeNewCustomer(id: number): Record<string, string | number> {
      const now = new Date()
      return {
        id,
        name: "—",
        email: "new.customer@example.com",
        phone: "+1-555-019-2042",
        city: "San Francisco",
        country: "USA",
        created_at: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
          now.getHours(),
        )}:${pad(now.getMinutes())}`,
      }
    }

    async function cycle() {
      const rect = root!.getBoundingClientRect()
      const w = rect.width
      const h = rect.height

      // enter from off-screen, lower-right
      setCursor({ x: w - 60, y: h + 30 })
      setCursorVisible(true)
      await sleep(200)
      if (cancelled) return

      // ---- 1. inline edit an existing cell ----
      const cityCell = center('[data-cell="3:city"]')
      if (cityCell) {
        setCursorLabel("Edit cell")
        await moveTo(cityCell, 520)
        if (cancelled) return
        await hold(80, cityCell)
        await click()
        if (cancelled) return
        setEditingKey("3:city")
        setDraft("")
        await hold(120, cityCell)
        await typeText("Stockholm", cityCell)
        if (cancelled) return
        await hold(200, cityCell)
        // blur -> commit + show update timing
        const ms = 7 + Math.floor(Math.random() * 10)
        setEdits((e) => ({ ...e, "3:city": "Stockholm" }))
        setEditingKey(null)
        setQueryMs(ms)
        const after = center('[data-cell="3:city"]') ?? cityCell
        setFlash({ x: after.x, y: after.y - 4, ms, id: Date.now() })
        setCursorLabel(null)
        await hold(720, after)
        setFlash(null)
        if (cancelled) return
      }

      // ---- 2. add a record ----
      const addBtn = center('[data-demo="add-record"]')
      if (addBtn) {
        setCursorLabel("Add record")
        await moveTo(addBtn, 460)
        if (cancelled) return
        await hold(80, addBtn)
        await click()
        if (cancelled) return
        const newId = table.count + 1
        setExtraRows([makeNewCustomer(newId)])
        setHighlightId(newId)
        setCursorLabel(null)
        await hold(520, addBtn)
        if (cancelled) return

        // ---- 3. edit the new row inline ----
        const nameCell = center(`[data-cell="${newId}:name"]`)
        if (nameCell) {
          setCursorLabel("Edit cell")
          await moveTo(nameCell, 420, easeSettle)
          if (cancelled) return
          await hold(80, nameCell)
          await click()
          if (cancelled) return
          setEditingKey(`${newId}:name`)
          setDraft("")
          await hold(120, nameCell)
          await typeText("Ada Lovelace", nameCell)
          if (cancelled) return
          await hold(200, nameCell)
          const ms = 6 + Math.floor(Math.random() * 9)
          setEdits((e) => ({ ...e, [`${newId}:name`]: "Ada Lovelace" }))
          setEditingKey(null)
          setQueryMs(ms)
          const after = center(`[data-cell="${newId}:name"]`) ?? nameCell
          setFlash({ x: after.x, y: after.y - 4, ms, id: Date.now() })
          setCursorLabel(null)
          await hold(720, after)
          setFlash(null)
          if (cancelled) return
        }
        setHighlightId(null)
      }

      // ---- 4. keyboard-driven multi-select + delete ----
      const firstCheck = center('[data-check="6"]')
      if (firstCheck) {
        // click the first row to anchor the selection
        setCursorLabel("Select row")
        await moveTo(firstCheck, 500)
        if (cancelled) return
        await hold(70, firstCheck)
        await click()
        if (cancelled) return
        setSelected(new Set([6]))
        setCursorLabel(null)
        await hold(280, firstCheck)
        if (cancelled) return

        // hold Shift and tap ArrowDown to extend the selection by keyboard
        setHeldKeys({ keys: ["⇧ Shift", "↓"], caption: "Extend selection" })
        await sleep(220)
        for (const id of [7, 8]) {
          if (cancelled) return
          setKeyPulse((n) => n + 1)
          await sleep(140)
          setSelected((s) => new Set([...s, id]))
          await hold(400, firstCheck)
        }
        if (cancelled) return
        await hold(260, firstCheck)
        setHeldKeys(null)
        await sleep(220)
        if (cancelled) return

        // press Del to delete the selected rows (no mouse needed)
        const delBtn = center('[data-demo="delete-rows"]')
        setHeldKeys({ keys: ["Del"], caption: "Delete rows" })
        setKeyPulse((n) => n + 1)
        await sleep(300)
        if (cancelled) return
        setRemovingIds(new Set([6, 7, 8]))
        await sleep(380)
        if (cancelled) return
        const ms = 8 + Math.floor(Math.random() * 11)
        setRemovedIds((prev) => new Set([...prev, 6, 7, 8]))
        setRemovingIds(new Set())
        setSelected(new Set())
        setHeldKeys(null)
        setQueryMs(ms)
        if (delBtn) setFlash({ x: delBtn.x, y: delBtn.y - 16, ms, id: Date.now() })
        await sleep(720)
        setFlash(null)
        if (cancelled) return
      }

      // ---- 5. switch the database connection ----
      const connTrigger = center('[data-demo="conn-trigger"]')
      if (connTrigger) {
        setCursorLabel("Switch database")
        await moveTo(connTrigger, 540)
        if (cancelled) return
        await hold(80, connTrigger)
        await click()
        if (cancelled) return
        setConnOpen(true)
        await hold(420, connTrigger)
        if (cancelled) return
        const connTarget = center('[data-conn-item="neon"]')
        if (connTarget) {
          await moveTo(connTarget, 380, easeSettle)
          if (cancelled) return
          await hold(90, connTarget)
          await click()
          if (cancelled) return
          setConnId("neon")
          setConnOpen(false)
          setConnFx(true)
          setCursorLabel(null)
          await hold(820, connTarget)
          setConnFx(false)
          if (cancelled) return
        } else {
          setConnOpen(false)
        }
      }

      // ---- 6. open the SQL console, type and run a query ----
      const sqlRail = center('[data-rail="sql"]')
      if (sqlRail) {
        setCursorLabel("SQL Console")
        await moveTo(sqlRail, 500)
        if (cancelled) return
        await hold(80, sqlRail)
        await click()
        if (cancelled) return
        setSqlText("")
        setSqlPhase("idle")
        setSqlResultMs(null)
        setView("sql")
        setCursorLabel(null)
        await hold(460, sqlRail)
        if (cancelled) return

        // type the query into the editor
        const editor = center('[data-demo="sql-editor"]')
        if (editor) {
          const typeAt = { x: editor.x - 120, y: editor.y - 120 }
          await moveTo(typeAt, 460, easeSettle)
          if (cancelled) return
          await hold(160, typeAt)
          await typeText(SQL_QUERY, typeAt, setSqlText)
          if (cancelled) return
          await hold(300, typeAt)
        }

        // hit Run
        const runBtn = center('[data-demo="run-query"]')
        if (runBtn) {
          setCursorLabel("Run query")
          await moveTo(runBtn, 440)
          if (cancelled) return
          await hold(80, runBtn)
          await click()
          if (cancelled) return
          setCursorLabel(null)
          setSqlPhase("running")
          await sleep(560)
          if (cancelled) return
          const qms = 9 + Math.floor(Math.random() * 14)
          setSqlPhase("done")
          setSqlResultMs(qms)
          setFlash({ x: runBtn.x - 8, y: runBtn.y - 18, ms: qms, id: Date.now() })
          await hold(1700, runBtn)
          setFlash(null)
          if (cancelled) return
        }

        // back to the data viewer
        const tableRail = center('[data-rail="table"]')
        if (tableRail) {
          setCursorLabel("Data Viewer")
          await moveTo(tableRail, 480)
          if (cancelled) return
          await hold(80, tableRail)
          await click()
          if (cancelled) return
          setView("table")
          setCursorLabel(null)
          await hold(420, tableRail)
          if (cancelled) return
        }
      }

      // ---- exit + reset ----
      await moveTo({ x: w - 50, y: h + 50 }, 420, easeSettle)
      setCursorVisible(false)
      await sleep(300)
      if (cancelled) return
      setEdits({})
      setExtraRows([])
      setQueryMs(null)
      setRemovedIds(new Set())
      setRemovingIds(new Set())
      setSelected(new Set())
      setHeldKeys(null)
      setView("table")
      setConnId(CONNECTIONS[0].id)
      setConnOpen(false)
      setConnFx(false)
      setSqlText("")
      setSqlPhase("idle")
      setSqlResultMs(null)
    }

    async function loop() {
      while (!cancelled) {
        await cycle()
        if (cancelled) break
        await sleep(450)
      }
    }

    let started = false
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true
          loop()
        }
      },
      { threshold: 0.4 },
    )
    io.observe(root)

    return () => {
      cancelled = true
      io.disconnect()
      cancelAnimationFrame(rafRef.current)
    }
  }, [activeTable, table.count])

  /* ---------- ambient realtime updates (data changing under you) ---------- */
  useEffect(() => {
    if (activeTable !== "customers") return
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    // rows the main choreography never touches -> safe to mutate live
    const SAFE_ROWS = [12, 13, 14, 15, 16, 17, 19, 21, 22, 24]
    const FIELDS: Array<{ col: string; pool: string[] }> = [
      { col: "city", pool: CITIES },
      { col: "country", pool: COUNTRIES },
    ]

    function tick() {
      if (cancelled) return
      const id = SAFE_ROWS[Math.floor(Math.random() * SAFE_ROWS.length)]
      const field = FIELDS[Math.floor(Math.random() * FIELDS.length)]
      const val = field.pool[Math.floor(Math.random() * field.pool.length)]
      const key = `${id}:${field.col}`
      const fxId = Date.now()
      setLiveVals((v) => ({ ...v, [key]: val }))
      setLiveFx((f) => ({ ...f, [key]: fxId }))
      setQueryMs(5 + Math.floor(Math.random() * 9))
      // fade the glow but keep the freshly-synced value
      setTimeout(() => {
        if (cancelled) return
        setLiveFx((f) => {
          if (f[key] !== fxId) return f
          const next = { ...f }
          delete next[key]
          return next
        })
      }, 1650)
      timer = setTimeout(tick, 1500 + Math.random() * 1900)
    }

    // wait past the intro so the first live update doesn't collide with the edit
    timer = setTimeout(tick, 2400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [activeTable])



  return (
    <div
      ref={rootRef}
      className="relative flex flex-col h-full w-full select-none overflow-hidden bg-[#111111] text-[#e6e6e6] font-sans text-[13px]"
    >
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
      {/* Icon rail */}
      <div className="flex flex-col items-center justify-between w-12 shrink-0 border-r border-[#1f1f1f] py-3 bg-[#0d0d0d]">
        <div className="flex flex-col items-center gap-1">
          <RailIcon icon={Database} />
          <RailIcon
            icon={SquareTerminal}
            active={view === "sql"}
            dataRail="sql"
            onClick={() => setView("sql")}
          />
          <RailIcon
            icon={Table2}
            active={view === "table"}
            dataRail="table"
            onClick={() => setView("table")}
          />
          <RailIcon icon={Share2} />
          <RailIcon icon={Settings} />
        </div>
        <RailIcon icon={Package} />
      </div>

      {/* Sidebar */}
      <div className="flex flex-col w-[252px] shrink-0 border-r border-[#1f1f1f]">
        {/* Connection dropdown */}
        <div className="relative px-2.5 py-2.5 border-b border-[#1f1f1f]">
          <button
            type="button"
            data-demo="conn-trigger"
            onClick={() => setConnOpen((v) => !v)}
            className="flex items-center gap-2.5 w-full px-2 h-11 rounded-[4px] border border-transparent hover:border-[#262626] hover:bg-[#161616] transition-colors"
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-[4px] bg-[#1a1a1a] border transition-all duration-300 ${
                connFx ? "border-[#22c55e] ring-2 ring-[#22c55e]/40" : "border-[#262626]"
              }`}
            >
              <Database className="w-4 h-4" strokeWidth={1.8} style={{ color: conn.color }} />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-[13px] font-semibold text-[#e6e6e6]">{conn.name}</div>
              <div className="truncate text-[11px] text-[#7a7a7a]">
                {conn.engine} • {conn.host}
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#6a6a6a] transition-transform ${connOpen ? "rotate-180" : ""}`}
            />
          </button>

          {connOpen ? (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setConnOpen(false)} />
              <div className="absolute left-2.5 right-2.5 top-[58px] z-40 rounded-[6px] border border-[#2a2a2a] bg-[#161616] py-1 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]">
                <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-[#6a6a6a]">
                  Saved connections
                </div>
                {CONNECTIONS.map((c) => {
                  const active = c.id === connId
                  return (
                    <button
                      key={c.id}
                      type="button"
                      data-conn-item={c.id}
                      onClick={() => {
                        setConnId(c.id)
                        setConnOpen(false)
                      }}
                      className={`flex items-center gap-2.5 w-full px-2.5 h-10 text-left transition-colors ${
                        active ? "bg-[#1c1c1c]" : "hover:bg-[#1a1a1a]"
                      }`}
                    >
                      <span className="flex items-center justify-center w-6 h-6 rounded-[4px] bg-[#1a1a1a] border border-[#2a2a2a]">
                        <Database className="w-3.5 h-3.5" strokeWidth={1.8} style={{ color: c.color }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] text-[#e6e6e6]">{c.name}</span>
                        <span className="block truncate text-[10.5px] text-[#7a7a7a]">
                          {c.engine} • {c.host}
                        </span>
                      </span>
                      {active ? <Check className="w-3.5 h-3.5 text-[#e6e6e6]" strokeWidth={2.4} /> : null}
                    </button>
                  )
                })}
                <div className="mt-1 border-t border-[#262626] pt-1">
                  <button
                    type="button"
                    onClick={() => setConnOpen(false)}
                    className="flex items-center gap-2 w-full px-2.5 h-9 text-left text-[12.5px] text-[#9a9a9a] hover:bg-[#1a1a1a] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={1.8} />
                    New connection
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <div className="flex items-center gap-2 flex-1 h-7 px-2 rounded-[4px] bg-[#161616] border border-[#1f1f1f]">
            <Search className="w-3.5 h-3.5 text-[#6a6a6a]" />
            <span className="text-[12px] text-[#6a6a6a]">Search…</span>
          </div>
          <Filter className="w-4 h-4 text-[#6a6a6a]" />
          <RefreshCw className="w-4 h-4 text-[#6a6a6a]" />
        </div>

        {/* Table list */}
        <div className="flex items-center justify-between px-3 pt-1 pb-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#5a5a5a]">Tables</span>
          <span className="text-[10px] text-[#4a4a4a] tabular-nums">{TABLES.length}</span>
        </div>
        <div className="flex flex-col gap-px px-2 overflow-y-auto flex-1">
          {TABLES.map((t) => {
            const active = t.name === activeTable
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => switchTable(t.name)}
                className={`relative flex items-center gap-2 h-8 px-2 rounded-[4px] transition-colors text-left ${
                  active ? "bg-[#171717]" : "hover:bg-[#141414]"
                }`}
              >
                {active ? (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-r-full bg-[#e6e6e6]" />
                ) : null}
                <Table2
                  className={`w-3.5 h-3.5 ${active ? "text-[#e6e6e6]" : "text-[#6a6a6a]"}`}
                  strokeWidth={1.8}
                />
                <span className={`flex-1 text-[13px] ${active ? "text-[#e6e6e6]" : "text-[#9a9a9a]"}`}>
                  {t.name}
                </span>
                <span
                  className={`text-[11px] tabular-nums px-1.5 rounded-[3px] ${
                    active ? "bg-[#0d0d0d] text-[#8a8a8a]" : "text-[#5a5a5a]"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Structure (expandable) */}
        <div className="border-t border-[#1f1f1f]">
          <button
            type="button"
            onClick={() => setStructureOpen((v) => !v)}
            className="flex items-center justify-between w-full px-3 h-10 hover:bg-[#141414] transition-colors"
          >
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#6a6a6a]">
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${structureOpen ? "rotate-90" : ""}`}
              />
              Structure
            </span>
            <span className="text-[11px] text-[#5a5a5a]">{table.columns.length} columns</span>
          </button>
          {structureOpen ? (
            <div className="max-h-[150px] overflow-y-auto pb-2">
              {table.columns.map((c) => (
                <div key={c.key} className="flex items-center gap-2 px-3 h-7">
                  {c.pk ? (
                    <KeyRound className="w-3 h-3 text-[#d4a017]" strokeWidth={1.8} />
                  ) : (
                    <Hash className="w-3 h-3 text-[#5a5a5a]" strokeWidth={1.8} />
                  )}
                  <span className="flex-1 text-[12px] text-[#bcbcbc]">{c.key}</span>
                  <span className="text-[11px] text-[#6a6a6a]">{c.type}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 h-7 mt-1 text-[11px] uppercase tracking-wider text-[#6a6a6a]">
                <span>Indexes</span>
                <span className="text-[#5a5a5a]">{table.indexes}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Main panel */}
      <div className="flex flex-col flex-1 min-w-0">
        {view === "sql" ? (
          <SqlConsole
            sqlText={sqlText}
            phase={sqlPhase}
            ms={sqlResultMs}
            caret={sqlPhase === "idle"}
          />
        ) : (
          <>
        {/* Tab bar */}
        <div className="flex items-center h-[38px] border-b border-[#1f1f1f] px-2">
          <div className="flex items-center gap-2 h-[30px] px-3 rounded-t-[4px] bg-[#161616] border border-b-0 border-[#262626]">
            <span className="text-[12px] text-[#e6e6e6]">{table.name}</span>
            <X className="w-3 h-3 text-[#6a6a6a]" />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between h-11 px-2.5 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              <div className="p-1.5 rounded-[4px] hover:bg-[#161616] text-[#8a8a8a] cursor-pointer">
                <PanelLeft className="w-4 h-4" strokeWidth={1.7} />
              </div>
              <div className="p-1.5 rounded-[4px] bg-[#1a1a1a] text-[#e6e6e6] cursor-pointer">
                <LayoutGrid className="w-4 h-4" strokeWidth={1.7} />
              </div>
              <div className="p-1.5 rounded-[4px] hover:bg-[#161616] text-[#8a8a8a] cursor-pointer">
                <FileText className="w-4 h-4" strokeWidth={1.7} />
              </div>
            </div>
            <div className="w-px h-5 bg-[#262626] mx-1" />
            <ToolbarButton icon={Filter}>Filters</ToolbarButton>
            <ToolbarButton icon={Columns3}>Columns</ToolbarButton>
            {selected.size > 0 ? (
              <span className="ml-1 text-[11px] text-[#bcbcbc]">{selected.size} selected</span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            <ToolbarButton icon={FileText}>Dry Edit</ToolbarButton>
            <ToolbarButton icon={Upload}>Import CSV</ToolbarButton>
            <ToolbarButton icon={Plus} primary dataDemo="add-record">
              Add record
            </ToolbarButton>
          </div>
        </div>

        {/* Table */}
        <div ref={scrollRef} className="flex-1 overflow-auto relative">
          <div className="min-w-max">
            {/* Header row */}
            <div className="flex items-center h-9 border-b border-[#1f1f1f] bg-[#111111] sticky top-0 z-10">
              <button
                type="button"
                onClick={toggleAll}
                className="flex items-center justify-center w-10 shrink-0 group h-full"
              >
                <Checkbox checked={allChecked} indeterminate={someChecked} />
              </button>
              {table.columns.map((c) => (
                <div
                  key={c.key}
                  className={`${COL_WIDTH[c.key] ?? "w-[140px]"} shrink-0 flex items-center gap-1.5 px-2 border-r border-[#161616]`}
                >
                  <span className="text-[12px] font-medium text-[#cfcfcf]">{c.key}</span>
                  <span className="text-[11px] text-[#5a5a5a]">{c.type}</span>
                </div>
              ))}
            </div>

            {/* Body rows */}
            <div>
              {rows.map((r) => {
                const id = r.id as number
                const checked = selected.has(id)
                const isNew = id === highlightId
                const isRemoving = removingIds.has(id)
                return (
                  <div
                    key={id}
                    onClick={() => toggleRow(id)}
                    className={`flex items-center h-[33px] border-b border-[#161616] group cursor-pointer transition-colors ${
                      isRemoving
                        ? "dora-rowout"
                        : isNew
                          ? "dora-rowin"
                          : checked
                            ? "bg-[#ffffff]/[0.045]"
                            : "hover:bg-[#151515]"
                    }`}
                  >
                    <div data-check={id} className="flex items-center justify-center w-10 shrink-0">
                      <Checkbox checked={checked} />
                    </div>
                    {table.columns.map((c) => {
                      const key = `${id}:${c.key}`
                      const isEditing = editingKey === key
                      const value = liveVals[key] ?? edits[key] ?? r[c.key]
                      const fx = liveFx[key]
                      return (
                        <div
                          key={fx ? `${c.key}-${fx}` : c.key}
                          data-cell={key}
                          className={`${COL_WIDTH[c.key] ?? "w-[140px]"} shrink-0 px-2 text-[12.5px] ${
                            isEditing ? "" : "truncate"
                          } ${cellClass(c.key)} ${fx ? "dora-cellfx" : ""}`}
                        >
                          {isEditing ? (
                            <span className="inline-flex items-center -my-0.5 h-[22px] px-1 rounded-[2px] bg-[#0d0d0d] ring-1 ring-[#6a6a6a] text-[#f0f0f0]">
                              {draft}
                              <span className="dora-caret inline-block w-[1.5px] h-[14px] ml-px bg-[#d4d4d4] align-middle" />
                            </span>
                          ) : fx ? (
                            <span className="dora-val">{value}</span>
                          ) : (
                            value
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
          </>
        )}
      </div>
      </div>

      {/* Status bar — swaps to the selection toolbar while rows are selected */}
      {selected.size > 0 ? (
        <div
          key="selbar"
          className="dora-bar-in flex items-center h-9 shrink-0 border-t border-[#1f1f1f] text-[11px] text-[#7a7a7a] bg-[#0f0f0f] pl-4 pr-3 gap-3"
        >
          <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#ededed] text-[11px] font-semibold text-[#0a0a0a] tabular-nums">
            {selected.size}
          </span>
          <span className="text-[12px] text-[#bcbcbc]">rows selected</span>
          <span className="flex-1" />
          <div className="flex items-center gap-1">
            <SelBtn icon={Copy} label="Copy" />
            <SelBtn icon={CopyPlus} label="Duplicate" />
            <SelBtn icon={Download} label="Export" />
            <SelBtn icon={Pencil} label="Edit" />
            <SelBtn icon={CircleSlash2} label="Set NULL" />
          </div>
          <span className="flex-1" />
          <button
            type="button"
            data-demo="delete-rows"
            className={`flex items-center gap-1.5 h-7 pl-2 pr-1.5 rounded-[5px] text-[12px] text-[#f87171] transition-colors ${
              heldKeys?.keys.includes("Del") ? "bg-[#3a1818]" : "hover:bg-[#2a1515]"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
            Delete
            <kbd
              className={`ml-0.5 inline-flex items-center h-4 px-1 rounded-[3px] border text-[9px] font-sans transition-colors ${
                heldKeys?.keys.includes("Del")
                  ? "bg-[#f87171] border-[#f87171] text-[#1a0a0a]"
                  : "bg-[#0d0d0d] border-[#2f2f2f] text-[#7a7a7a]"
              }`}
            >
              DEL
            </kbd>
          </button>
          <button
            type="button"
            className="flex items-center gap-1 h-7 px-1.5 rounded-[5px] text-[12px] text-[#8a8a8a] hover:bg-[#1f1f1f] transition-colors"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.8} />
            <kbd className="inline-flex items-center h-4 px-1 rounded-[3px] bg-[#0d0d0d] border border-[#2f2f2f] text-[9px] text-[#7a7a7a] font-sans">
              ESC
            </kbd>
          </button>
        </div>
      ) : view === "sql" ? (
        <div className="flex items-center h-9 shrink-0 border-t border-[#1f1f1f] text-[11px] text-[#7a7a7a] bg-[#0f0f0f] px-4 gap-3">
          <span className="flex items-center gap-1.5" style={{ color: conn.color }}>
            <Database className="w-3.5 h-3.5" strokeWidth={1.8} />
            <span className="text-[#cfcfcf]">{conn.name}</span>
          </span>
          <span>{conn.engine}</span>
          <span className="flex-1" />
          {sqlPhase === "done" ? (
            <span className="tabular-nums">
              {SQL_RESULTS.length} rows · <span className="text-[#e6e6e6]">{sqlResultMs}ms</span>
            </span>
          ) : sqlPhase === "running" ? (
            <span className="flex items-center gap-1.5">
              <span className="dora-live-dot w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              Executing…
            </span>
          ) : (
            <span>Ready</span>
          )}
        </div>
      ) : (
        <div className="flex items-stretch h-9 shrink-0 border-t border-[#1f1f1f] text-[11px] text-[#7a7a7a] bg-[#0f0f0f]">
          <div className="flex items-center gap-1 w-[300px] shrink-0 pl-[58px] pr-3 border-r border-[#1f1f1f]">
            {[Sparkles, Info, Settings, Sun].map((Icon, i) => (
              <div
                key={i}
                className="flex items-center justify-center w-6 h-6 rounded-[4px] text-[#6a6a6a] hover:text-[#bcbcbc] hover:bg-[#161616] transition-colors cursor-pointer"
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.7} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between flex-1 min-w-0 px-3">
            <div className="flex items-center gap-3">
              <span
                className={`tabular-nums transition-colors ${queryMs != null ? "text-[#e6e6e6]" : ""}`}
              >
                {queryMs != null ? queryMs : 34 + ((table.count * 7) % 40)}ms
              </span>
              <span className="flex items-center gap-1.5">
                <span className="dora-live-dot w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                Live · 5s
              </span>
              <span>
                Showing 1-{rows.length} of {total} rows
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                Limit:
                <span className="inline-flex items-center h-5 px-2 rounded-[3px] bg-[#161616] border border-[#262626] tabular-nums">
                  50
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                Offset:
                <span className="inline-flex items-center h-5 px-2 rounded-[3px] bg-[#161616] border border-[#262626] tabular-nums">
                  0
                </span>
              </span>
              <span>Page 1 of {Math.max(1, Math.ceil(total / 50))}</span>
            </div>
          </div>
        </div>
      )}

      {/* ---- demo overlay: held keyboard keys (combo + caption) ---- */}
      {heldKeys ? (
        <div className="dora-key-in absolute left-1/2 bottom-[64px] z-40 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none">
          <div className="flex items-center gap-1.5">
            {heldKeys.keys.map((k, i) => (
              <span
                key={`${k}-${i === heldKeys.keys.length - 1 ? keyPulse : "h"}`}
                className={`${i === heldKeys.keys.length - 1 ? "dora-key-pulse" : ""} inline-flex items-center justify-center h-9 min-w-9 px-3 rounded-[8px] bg-gradient-to-b from-[#2f2f2f] to-[#1c1c1c] border border-[#444] text-[14px] font-semibold text-[#f5f5f5] shadow-[0_4px_0_0_#0b0b0b,0_10px_20px_-4px_rgba(0,0,0,0.75)]`}
              >
                {k}
              </span>
            ))}
          </div>
          {heldKeys.caption ? (
            <span className="rounded-[4px] bg-[#0a0a0a]/80 px-2 py-0.5 text-[10px] font-medium text-[#cfcfcf]">
              {heldKeys.caption}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* ---- demo overlay: flash pill ---- */}
      {flash ? (
        <div
          key={flash.id}
          className="dora-pop absolute z-40 pointer-events-none"
          style={{ left: flash.x, top: flash.y }}
        >
          <span className="flex items-center gap-1 px-1.5 h-5 rounded-[3px] bg-[#ededed] text-[#0a0a0a] text-[10px] font-semibold shadow-[0_4px_12px_-2px_rgba(0,0,0,0.55)]">
            <Check className="w-3 h-3" strokeWidth={3} />
            {flash.ms}ms
          </span>
        </div>
      ) : null}

      {/* ---- demo overlay: click ripple ---- */}
      {ripple ? (
        <span
          key={ripple.id}
          className="dora-ripple absolute z-40 pointer-events-none block w-7 h-7 rounded-full border-2 border-[#9a9a9a]"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ) : null}

      {/* ---- demo overlay: animated cursor ---- */}
      <div
        ref={cursorRef}
        className={`absolute left-0 top-0 z-50 pointer-events-none transition-opacity duration-300 ${
          cursorVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ willChange: "transform" }}
      >
        <div className={`origin-top-left transition-transform duration-100 ${pressed ? "scale-90" : "scale-100"}`}>
          <svg
            width="22"
            height="24"
            viewBox="0 0 22 24"
            fill="none"
            className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)]"
          >
            <path
              d="M3 2.2L3 18.4L7.3 14.3L10.6 21.2L13.2 20L9.9 13.2L16.1 13.1L3 2.2Z"
              fill="#f5f5f5"
              stroke="#0a0a0a"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
          {cursorLabel ? (
            <span className="absolute left-5 top-5 flex items-center gap-1 whitespace-nowrap rounded-[4px] bg-[#ededed] px-1.5 py-0.5 text-[10px] font-medium text-[#0a0a0a] shadow-[0_4px_12px_-2px_rgba(0,0,0,0.6)]">
              <Pencil className="w-2.5 h-2.5" strokeWidth={2.4} />
              {cursorLabel}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
