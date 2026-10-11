


import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpDown,
  BarChart3,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Download,
  LayoutDashboard,
  MapPinned,
  Menu,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  Wallet,
  X,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts'
import './App.css'
const API = `${(import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')}/api/dashboard`


const COLORS = [
  '#635bff',
  '#16a085',
  '#f59e0b',
  '#ec4899',
  '#0ea5e9',
  '#8b5cf6',
]

const RISK_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  normal: 3,
}

const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const formatNumber = (value) =>
  new Intl.NumberFormat('en-IN').format(Number(value) || 0)

const formatCompactINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value) || 0)

const formatPercent = (value) =>
  `${(Number(value) || 0).toFixed(2)}%`

function downloadCSV(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
        .join(','),
    )
    .join('\r\n')

  const blob = new Blob(['\uFEFF', csv], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const formatLakhs = (value) => {
  const amount = Number(value) || 0

  return `₹${(amount / 100000).toFixed(0)}L`
}

function App() {
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    category: '',
    state: '',
    payment_method: '',
    fulfillment: '',
  })

  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activePage, setActivePage] = useState('Overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [productSearch, setProductSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [sortBy, setSortBy] = useState('risk')
  const [sortDirection, setSortDirection] = useState('asc')

  const queryString = useMemo(() => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })

    return params.toString()
  }, [filters])

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    const endpoints = {
      overview: '/overview',
      trend: '/sales-trend',
      categories: '/categories',
      products: '/top-products?limit=10',
      status: '/order-status',
      issues: '/order-issues',
      payments: '/payments',
      fulfillment: '/fulfillment',
      geography: '/geography',
      profitability: '/profitability?limit=100',
      profitabilitySummary: '/profitability-summary',
      financialExposure: '/financial-exposure',
    }

    try {
      const results = await Promise.all(
        Object.entries(endpoints).map(async ([key, endpoint]) => {
          const separator = endpoint.includes('?') ? '&' : '?'
          const url = `${API}${endpoint}${
            queryString ? `${separator}${queryString}` : ''
          }`

          const response = await fetch(url)

          if (!response.ok) {
            const message = await response.text()
            throw new Error(`${key}: ${response.status} ${message}`)
          }

          return [key, await response.json()]
        }),
      )

      setData(Object.fromEntries(results))
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [queryString])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  function updateFilter(key, value) {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  function resetFilters() {
    setFilters({
      start_date: '',
      end_date: '',
      category: '',
      state: '',
      payment_method: '',
      fulfillment: '',
    })
  }

  const overview = data.overview ?? {}
  const categories = data.categories ?? []
  const products = data.products ?? []
  const trend = data.trend ?? []
  const statuses = data.status ?? {}
  const payments = data.payments ?? []
  const fulfillment = data.fulfillment ?? []
  const geography = data.geography ?? []
  const orderIssues = data.issues ?? []

  const profitabilityData = data.profitability ?? {
    products_analyzed: 0,
    products: [],
  }

  const profitabilitySummary = data.profitabilitySummary ?? {
    products_analyzed: 0,
    loss_making_products: 0,
    low_margin_products: 0,
    negative_profit_total: 0,
    sales_total: 0,
    profit_total: 0,
  }

  const financialExposure = data.financialExposure ?? {
    returned: {
      orders: 0,
      recorded_sales: 0,
      recorded_profit: 0,
    },
    cancelled: {
      orders: 0,
      recorded_sales: 0,
      recorded_profit: 0,
    },
  }

  const categoryOptions = useMemo(
    () => [...new Set(categories.map((item) => item.category))],
    [categories],
  )

  const stateOptions = useMemo(
    () => [...new Set(geography.map((item) => item.state))],
    [geography],
  )

  const paymentOptions = useMemo(
    () => [...new Set(payments.map((item) => item.payment_method))],
    [payments],
  )

  const fulfillmentOptions = useMemo(
    () => [...new Set(fulfillment.map((item) => item.fulfillment))],
    [fulfillment],
  )

  const kpis = [
    {
      label: 'Total Sales',
      value: formatINR(overview.total_sales),
      icon: CircleDollarSign,
      tone: 'violet',
      description: 'Sales in selected period',
    },
    {
      label: 'Total Profit',
      value: formatINR(overview.total_profit),
      icon: Wallet,
      tone: 'green',
      description: 'Recorded profit',
    },
    {
      label: 'Total Orders',
      value: formatNumber(overview.total_orders),
      icon: ShoppingBag,
      tone: 'blue',
      description: 'Unique order IDs',
    },
    {
      label: 'Units Sold',
      value: formatNumber(overview.total_units_sold),
      icon: Boxes,
      tone: 'orange',
      description: 'Total quantity',
    },
    {
      label: 'Average Order Value',
      value: formatINR(overview.average_order_value),
      icon: CreditCard,
      tone: 'pink',
      description: 'Sales ÷ unique orders',
    },
    {
      label: 'Profit Margin',
      value: formatPercent(overview.profit_margin_pct),
      icon: Activity,
      tone: 'teal',
      description: 'Profit ÷ sales',
    },
  ]

  const searchableProfitProducts = useMemo(() => {
    const list = Array.isArray(profitabilityData.products)
      ? profitabilityData.products
      : []

    const search = productSearch.trim().toLowerCase()

    const filtered = list.filter((product) => {
      const matchesSearch =
        !search ||
        String(product.product ?? '').toLowerCase().includes(search) ||
        String(product.finding ?? '').toLowerCase().includes(search)

      const matchesRisk =
        riskFilter === 'all' || product.risk_level === riskFilter

      return matchesSearch && matchesRisk
    })

    return filtered.sort((a, b) => {
      let comparison = 0

      if (sortBy === 'risk') {
        comparison =
          (RISK_ORDER[a.risk_level] ?? 99) -
          (RISK_ORDER[b.risk_level] ?? 99)

        if (comparison === 0) {
          comparison = (Number(a.profit) || 0) - (Number(b.profit) || 0)
        }
      } else if (sortBy === 'product') {
        comparison = String(a.product ?? '').localeCompare(
          String(b.product ?? ''),
        )
      } else {
        comparison =
          (Number(a[sortBy]) || 0) - (Number(b[sortBy]) || 0)
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [
    profitabilityData.products,
    productSearch,
    riskFilter,
    sortBy,
    sortDirection,
  ])

  const riskCounts = useMemo(() => {
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      normal: 0,
    }

    for (const product of profitabilityData.products ?? []) {
      const risk = product.risk_level

      if (Object.hasOwn(counts, risk)) {
        counts[risk] += 1
      }
    }

    return counts
  }, [profitabilityData.products])

  function toggleSort(key) {
    if (sortBy === key) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDirection(key === 'product' ? 'asc' : 'desc')
    }
  }

  function exportOverview() {
    downloadCSV('amazon-india-dashboard-overview.csv', [
      ['Metric', 'Value'],
      ['Total Sales (INR)', overview.total_sales ?? 0],
      ['Total Profit (INR)', overview.total_profit ?? 0],
      ['Total Orders', overview.total_orders ?? 0],
      ['Units Sold', overview.total_units_sold ?? 0],
      ['Average Order Value', overview.average_order_value ?? 0],
      ['Profit Margin (%)', overview.profit_margin_pct ?? 0],
    ])
  }

  function exportProfitability() {
    const rows = [
      [
        'Product',
        'Risk Level',
        'Sales INR',
        'Profit INR',
        'Margin %',
        'Units Sold',
        'Orders',
        'Average Discount %',
        'Finding',
      ],
      ...searchableProfitProducts.map((product) => [
        product.product,
        product.risk_level,
        product.sales,
        product.profit,
        product.margin_pct,
        product.units_sold,
        product.orders,
        product.average_discount_pct,
        product.finding,
      ]),
    ]

    downloadCSV('amazon-india-profit-intelligence.csv', rows)
  }

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, target: 'overview' },
    { label: 'Products', icon: Package, target: 'products' },
    {
      label: 'Profit Intelligence',
      icon: CircleDollarSign,
      target: 'profit-intelligence',
    },
    { label: 'Orders', icon: ShoppingBag, target: 'orders' },
    { label: 'Payments', icon: CreditCard, target: 'payments' },
    { label: 'Geography', icon: MapPinned, target: 'geography' },
  ]

  function navigateTo(label, target) {
    setActivePage(label)
    setMobileMenuOpen(false)

    document.getElementById(target)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="app-shell">
      {mobileMenuOpen && (
        <button
          type="button"
          className="mobile-sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}
      >
        {mobileMenuOpen && (
          <button
            type="button"
            className="mobile-sidebar-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={22} />
          </button>
        )}

        <div className="brand">
          <div className="brand-mark">
            <Activity size={24} />
          </div>
          <div>
            <strong>
              AMAZON<span>IQ</span>
            </strong>
            <small>INDIA ANALYTICS</small>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">
          {navItems.map(({ label, icon: Icon, target }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? 'active' : ''}`}
              onClick={() => navigateTo(label, target)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {activePage === label && <span className="active-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-card">
            <span className="system-indicator" />
            <div>
              <strong>Analytics engine</strong>
             
            </div>
          </div>

          <div className="profile">
            <div className="avatar">AI</div>
            <div>
              <strong>Analytics Workspace</strong>
              <small>Sales intelligence</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu size={22} />
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <div className="live-badge">
            
            </div>

            <button
              className="icon-button"
              onClick={loadDashboard}
              title="Refresh dashboard"
              aria-label="Refresh dashboard"
              disabled={loading}
            >
              <RefreshCw size={18} />
            </button>

            <button className="export-button" onClick={exportOverview}>
              <Download size={17} />
              Export KPIs
            </button>
          </div>
        </header>

        <section className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" />
              BUSINESS INTELLIGENCE
            </div>

            <h1>
              Amazon India <span>Overview</span>
            </h1>

            <p>
              Understand sales performance, product trends, and operational
              outcomes in one place.
            </p>
          </div>
          
        </section>

        <section className="filter-panel">
          <div className="filter-heading">
            <div>
              <strong>Filters</strong>
              <span>Refine the entire dashboard</span>
            </div>

            <button className="reset-button" onClick={resetFilters}>
              Reset all
            </button>
          </div>

          <div className="filter-grid">
            <label className="filter-control">
              <span>Start date</span>
              <input
                type="date"
                value={filters.start_date}
                max={filters.end_date || undefined}
                onChange={(event) =>
                  updateFilter('start_date', event.target.value)
                }
              />
            </label>

            <label className="filter-control">
              <span>End date</span>
              <input
                type="date"
                value={filters.end_date}
                min={filters.start_date || undefined}
                onChange={(event) =>
                  updateFilter('end_date', event.target.value)
                }
              />
            </label>

            {[
              { key: 'category', label: 'Category', options: categoryOptions },
              { key: 'state', label: 'Shipping state', options: stateOptions },
              {
                key: 'payment_method',
                label: 'Payment method',
                options: paymentOptions,
              },
              {
                key: 'fulfillment',
                label: 'Fulfilment',
                options: fulfillmentOptions,
              },
            ].map(({ key, label, options }) => (
              <label className="filter-control" key={key}>
                <span>{label}</span>
                <div className="select-wrap">
                  <select
                    value={filters[key]}
                    onChange={(event) => updateFilter(key, event.target.value)}
                  >
                    <option value="">All {label.toLowerCase()}s</option>
                    {options.map((option) => (
                      <option value={option} key={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} />
                </div>
              </label>
            ))}
          </div>
        </section>

        {error && (
          <div className="error-banner">
            <AlertCircle size={20} />
            <div>
              <strong>Unable to load analytics</strong>
              <p>{error}</p>
              <button onClick={loadDashboard}>Try again</button>
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-banner">
            <RefreshCw size={18} className="spin" />
            Loading your sales analytics…
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="kpi-grid">
              {kpis.map(({ label, value, icon: Icon, tone, description }) => (
                <article className="kpi-card" key={label}>
                  <div className="kpi-top">
                    <span>{label}</span>
                    <div className={`kpi-icon ${tone}`}>
                      <Icon size={20} />
                    </div>
                  </div>

                  <div className="kpi-value">{value}</div>
                  <div className="kpi-description">{description}</div>
                </article>
              ))}
            </section>

            <section className="chart-grid">
              <article className="panel trend-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Sales &amp; Profit Trend</h2>
                    <p>Monthly financial performance</p>
                  </div>
                  <span className="panel-badge">MONTHLY</span>
                </div>

                <div className="chart-container trend-chart">
                  {trend.length ? (
                    <ResponsiveContainer width="100%" height="100%">
<ComposedChart
  data={trend}
  margin={{ top: 12, right: 8, left: 0, bottom: 12 }}
>
  <CartesianGrid
    strokeDasharray="3 3"
    vertical={false}
    stroke="#e9edf5"
  />

  <XAxis
  dataKey="month"
  tick={{ fontSize: 10, fill: '#647087' }}
  tickLine={false}
  axisLine={false}
  interval="preserveStartEnd"
  minTickGap={24}
  tickFormatter={(value) => {
    const [year, month] = value.split('-')

    return new Date(
      Number(year),
      Number(month) - 1,
      1,
    ).toLocaleDateString('en-IN', {
      month: 'short',
      year: '2-digit',
    })
  }}
/>

  <YAxis
    yAxisId="sales"
    orientation="left"
    tickFormatter={formatLakhs}
    tick={{ fontSize: 11, fill: '#635bff' }}
    tickLine={false}
    axisLine={false}
    width={65}
    label={{
      value: 'Sales (₹)',
      angle: -90,
      position: 'insideLeft',
      fill: '#635bff',
      fontSize: 12,
    }}
  />

  <YAxis
    yAxisId="profit"
    orientation="right"
    tickFormatter={formatLakhs}
    tick={{ fontSize: 11, fill: '#10b981' }}
    tickLine={false}
    axisLine={false}
    width={65}
    label={{
      value: 'Profit (₹)',
      angle: 90,
      position: 'insideRight',
      fill: '#10b981',
      fontSize: 12,
    }}
  />

  <Tooltip
    formatter={(value, name) => [
      formatINR(value),
      name,
    ]}
    labelFormatter={(label) => {
      const [year, month] = label.split('-')

      return new Date(
        Number(year),
        Number(month) - 1,
        1,
      ).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      })
    }}
    contentStyle={{
      border: '1px solid #e9edf5',
      borderRadius: 12,
      padding: '12px',
    }}
  />

  <Legend
    verticalAlign="bottom"
    wrapperStyle={{ paddingTop: 14 }}
  />

  <Bar
    yAxisId="sales"
    dataKey="sales"
    name="Sales"
    fill="#635bff"
    radius={[5, 5, 0, 0]}
    maxBarSize={25}
  />

  <Line
    yAxisId="profit"
    dataKey="profit"
    name="Profit"
    type="monotone"
    stroke="#10b981"
    strokeWidth={3}
    dot={{
      r: 3,
      fill: '#10b981',
      strokeWidth: 1,
      stroke: '#ffffff',
    }}
    activeDot={{ r: 6 }}
  />
</ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state">
                      No sales data for these filters.
                    </div>
                  )}
                </div>
              </article>

              <article className="panel category-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Category Performance</h2>
                    <p>Revenue distribution</p>
                  </div>
                  <BarChart3 size={19} className="heading-icon" />
                </div>

                <div className="chart-container category-chart">
                  {categories.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categories}
                          dataKey="sales"
                          nameKey="category"
                          innerRadius="48%"
                          outerRadius="72%"
                          paddingAngle={3}
                          stroke="none"
                        >
                          {categories.map((item, index) => (
                            <Cell
                              key={item.category}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>

                        <Tooltip formatter={(value) => formatINR(value)} />
                        <Legend
                          verticalAlign="bottom"
                          height={55}
                          iconType="circle"
                          wrapperStyle={{ fontSize: 11 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state">No category data.</div>
                  )}
                </div>
              </article>
            </section>

            <section className="data-grid">
              <article className="panel product-panel" id="products">
                <div className="panel-heading">
                  <div>
                    <h2>Top 10 Products</h2>
                    <p>Ranked by total sales</p>
                  </div>
                  <span className="panel-badge">TOP PRODUCTS</span>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Units</th>
                        <th>Revenue</th>
                        <th>Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product, index) => (
                        <tr key={product.product}>
                          <td>
                            <div className="product-name">
                              <span className="rank">{index + 1}</span>
                              <span>{product.product}</span>
                            </div>
                          </td>
                          <td>{formatNumber(product.units_sold)}</td>
                          <td className="money-cell">
                            {formatINR(product.sales)}
                          </td>
                          <td className="profit-cell">
                            {formatINR(product.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {!products.length && (
                    <div className="empty-state">
                      No products match the selected filters.
                    </div>
                  )}
                </div>
              </article>

              <article className="panel status-panel" id="orders">
                <div className="panel-heading">
                  <div>
                    <h2>Order Status</h2>
                    <p>Operational breakdown</p>
                  </div>
                  <Truck size={19} className="heading-icon" />
                </div>

                <div className="status-list">
                  {[
                    {
                      label: 'Delivered',
                      value: statuses.delivered ?? 0,
                      color: '#19b89a',
                    },
                    {
                      label: 'Shipped',
                      value: statuses.shipped ?? 0,
                      color: '#635bff',
                    },
                    {
                      label: 'Returned',
                      value: statuses.returned ?? 0,
                      color: '#f59e0b',
                    },
                    {
                      label: 'Cancelled',
                      value: statuses.cancelled ?? 0,
                      color: '#f06464',
                    },
                  ].map((item) => {
                    const total = statuses.total_orders || 0
                    const percentage = total
                      ? (item.value / total) * 100
                      : 0

                    return (
                      <div className="status-item" key={item.label}>
                        <div className="status-item-top">
                          <span>
                            <span
                              className="status-dot"
                              style={{ background: item.color }}
                            />
                            {item.label}
                          </span>
                          <strong>{formatNumber(item.value)}</strong>
                        </div>

                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${percentage}%`,
                              background: item.color,
                            }}
                          />
                        </div>

                        <small>{percentage.toFixed(1)}% of orders</small>
                      </div>
                    )
                  })}
                </div>

                <div className="rate-cards">
                  <div>
                    <span>Return rate</span>
                    <strong>{formatPercent(statuses.return_rate_pct)}</strong>
                    <small>
                      <ArrowDownRight size={13} />
                      Returned orders
                    </small>
                  </div>
                  <div>
                    <span>Cancellation rate</span>
                    <strong>
                      {formatPercent(statuses.cancellation_rate_pct)}
                    </strong>
                    <small>
                      <AlertCircle size={13} />
                      Cancelled orders
                    </small>
                  </div>
                </div>
              </article>
            </section>

            <section className="chart-grid bottom-grid">
              <article className="panel" id="payments">
                <div className="panel-heading">
                  <div>
                    <h2>Payment Intelligence</h2>
                    <p>Sales by payment method</p>
                  </div>
                  <CreditCard size={19} className="heading-icon" />
                </div>

                <div className="chart-container horizontal-chart">
                  {payments.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={payments}
                        layout="vertical"
                        margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                          stroke="#edf0f6"
                        />
                        <XAxis
                          type="number"
                          tickFormatter={formatCompactINR}
                          tick={{ fontSize: 10, fill: '#8a93a5' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="payment_method"
                          width={135}
                          tick={{ fontSize: 11, fill: '#647087' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip formatter={(value) => formatINR(value)} />
                        <Bar
                          dataKey="sales"
                          name="Sales"
                          fill="#635bff"
                          radius={[0, 5, 5, 0]}
                          maxBarSize={24}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state">No payment data.</div>
                  )}
                </div>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Fulfilment Performance</h2>
                    <p>Revenue by fulfilment method</p>
                  </div>
                  <Package size={19} className="heading-icon" />
                </div>

                <div className="fulfillment-list">
                  {fulfillment.map((item, index) => {
                    const total = fulfillment.reduce(
                      (sum, row) => sum + (Number(row.sales) || 0),
                      0,
                    )

                    const percentage = total
                      ? ((Number(item.sales) || 0) / total) * 100
                      : 0

                    return (
                      <div
                        className="fulfillment-item"
                        key={item.fulfillment}
                      >
                        <div className="fulfillment-icon">
                          {index === 0 ? (
                            <CheckCircle2 size={19} />
                          ) : (
                            <Truck size={19} />
                          )}
                        </div>

                        <div className="fulfillment-details">
                          <div>
                            <strong>{item.fulfillment}</strong>
                            <span>{percentage.toFixed(1)}%</span>
                          </div>

                          <div className="progress-track">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${percentage}%`,
                                background: COLORS[index % COLORS.length],
                              }}
                            />
                          </div>

                          <small>{formatNumber(item.orders)} orders</small>
                        </div>

                        <strong className="fulfillment-sales">
                          {formatCompactINR(item.sales)}
                        </strong>
                      </div>
                    )
                  })}

                  {!fulfillment.length && (
                    <div className="empty-state">No fulfilment data.</div>
                  )}
                </div>
              </article>
            </section>

            <section className="panel geography-panel" id="geography">
              <div className="panel-heading">
                <div>
                  <h2>Geographic Performance</h2>
                  <p>Sales and profitability across shipping states</p>
                </div>
                <MapPinned size={20} className="heading-icon" />
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Shipping state</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                      <th>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geography.map((item, index) => (
                      <tr key={item.state}>
                        <td>
                          <span className="rank">{index + 1}</span>
                        </td>
                        <td>{item.state}</td>
                        <td>{formatNumber(item.orders)}</td>
                        <td className="money-cell">
                          {formatINR(item.sales)}
                        </td>
                        <td className="profit-cell">
                          {formatINR(item.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!geography.length && (
                  <div className="empty-state">
                    No geographic data for these filters.
                  </div>
                )}
              </div>
            </section>

            <section
              className="profit-intelligence"
              id="profit-intelligence"
            >
              <div className="page-heading profit-heading">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-line" />
                    PROFITABILITY ANALYTICS
                  </div>

                  <h1>
                    Profit <span>Intelligence</span>
                  </h1>

                  <p>
                    Review recorded profitability and identify products
                    that trigger the configured risk rules.
                  </p>
                </div>

                <button
                  className="export-button"
                  onClick={exportProfitability}
                >
                  <Download size={17} />
                  Export risk report
                </button>
              </div>

              <div className="profit-kpi-grid">
                <article className="profit-kpi">
                  <div className="profit-kpi-label">Products analyzed</div>
                  <div className="profit-kpi-value">
                    {formatNumber(profitabilitySummary.products_analyzed)}
                  </div>
                  <small>Unique product names</small>
                </article>

                <article className="profit-kpi profit-kpi-critical">
                  <div className="profit-kpi-label">
                    Loss-making products
                  </div>
                  <div className="profit-kpi-value">
                    {formatNumber(
                      profitabilitySummary.loss_making_products,
                    )}
                  </div>
                  <small>Recorded profit below zero</small>
                </article>

                <article className="profit-kpi profit-kpi-high">
                  <div className="profit-kpi-label">
                    Low-margin products
                  </div>
                  <div className="profit-kpi-value">
                    {formatNumber(profitabilitySummary.low_margin_products)}
                  </div>
                  <small>Recorded margin below 5%</small>
                </article>

                <article className="profit-kpi">
                  <div className="profit-kpi-label">
                    Negative profit total
                  </div>
                  <div className="profit-kpi-value">
                    {formatINR(
                      profitabilitySummary.negative_profit_total,
                    )}
                  </div>
                  <small>Sum of negative product profits</small>
                </article>
              </div>

              <div className="profit-risk-overview">
                {[
                  {
                    key: 'critical',
                    label: 'Critical',
                    description: 'Negative recorded profit',
                  },
                  {
                    key: 'high',
                    label: 'High',
                    description: 'Low recorded margin',
                  },
                  {
                    key: 'medium',
                    label: 'Medium',
                    description: 'Discount and margin rule',
                  },
                  {
                    key: 'normal',
                    label: 'Normal',
                    description: 'No configured rule triggered',
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    className={`risk-summary-item risk-summary-${item.key}`}
                    onClick={() =>
                      setRiskFilter((current) =>
                        current === item.key ? 'all' : item.key,
                      )
                    }
                    aria-pressed={riskFilter === item.key}
                  >
                    <span>{item.label}</span>
                    <strong>{formatNumber(riskCounts[item.key])}</strong>
                    <small>{item.description}</small>
                  </button>
                ))}
              </div>

              <article className="panel profit-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Product Risk Register</h2>
                    <p>
                      Search and sort products by recorded profit,
                      margin, sales, or risk category.
                    </p>
                  </div>
                  <Package size={20} className="heading-icon" />
                </div>

                <div className="profit-controls">
                  <label className="profit-search">
                    <Search size={17} />
                    <input
                      type="search"
                      value={productSearch}
                      onChange={(event) =>
                        setProductSearch(event.target.value)
                      }
                      placeholder="Search products or findings..."
                    />
                  </label>

                  <label className="profit-risk-select">
                    <span>Risk level</span>
                    <div className="select-wrap">
                      <select
                        value={riskFilter}
                        onChange={(event) =>
                          setRiskFilter(event.target.value)
                        }
                      >
                        <option value="all">All risk levels</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="normal">Normal</option>
                      </select>
                      <ChevronDown size={15} />
                    </div>
                  </label>
                </div>

                <div className="profit-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          <button
                            className="table-sort-button"
                            onClick={() => toggleSort('product')}
                          >
                            Product <ArrowUpDown size={13} />
                          </button>
                        </th>
                        <th>Risk</th>
                        <th>
                          <button
                            className="table-sort-button"
                            onClick={() => toggleSort('sales')}
                          >
                            Sales <ArrowUpDown size={13} />
                          </button>
                        </th>
                        <th>
                          <button
                            className="table-sort-button"
                            onClick={() => toggleSort('profit')}
                          >
                            Profit <ArrowUpDown size={13} />
                          </button>
                        </th>
                        <th>
                          <button
                            className="table-sort-button"
                            onClick={() => toggleSort('margin_pct')}
                          >
                            Margin <ArrowUpDown size={13} />
                          </button>
                        </th>
                        <th>Units</th>
                        <th>Avg. discount</th>
                        <th>Finding</th>
                      </tr>
                    </thead>

                    <tbody>
                      {searchableProfitProducts.map((product) => (
                        <tr key={product.product}>
                          <td>
                            <strong>{product.product}</strong>
                          </td>

                          <td>
                            <span
                              className={`risk-badge risk-badge-${product.risk_level}`}
                            >
                              {product.risk_level}
                            </span>
                          </td>

                          <td>{formatINR(product.sales)}</td>

                          <td
                            className={
                              Number(product.profit) < 0
                                ? 'loss-cell'
                                : 'profit-cell'
                            }
                          >
                            {formatINR(product.profit)}
                          </td>

                          <td>{formatPercent(product.margin_pct)}</td>
                          <td>{formatNumber(product.units_sold)}</td>
                          <td>
                            {formatPercent(product.average_discount_pct)}
                          </td>
                          <td>{product.finding}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {!searchableProfitProducts.length && (
                    <div className="empty-state">
                      No products match your search and risk filters.
                    </div>
                  )}
                </div>

                <div className="profit-table-footer">
                  Showing {formatNumber(searchableProfitProducts.length)} of{' '}
                  {formatNumber(
                    profitabilityData.products?.length ?? 0,
                  )}{' '}
                  returned products
                </div>
              </article>

              <div className="exposure-grid">
                <article className="panel exposure-card">
                  <div className="exposure-card-heading">
                    <div>
                      <h2>Returned orders</h2>
                      <p>Recorded amounts associated with returned orders</p>
                    </div>
                    <ArrowDownRight size={20} />
                  </div>

                  <div className="exposure-value">
                    {formatNumber(financialExposure.returned.orders)}
                  </div>

                  <div className="exposure-detail">
                    <span>Recorded sales</span>
                    <strong>
                      {formatINR(
                        financialExposure.returned.recorded_sales,
                      )}
                    </strong>
                  </div>

                  <div className="exposure-detail">
                    <span>Recorded profit</span>
                    <strong>
                      {formatINR(
                        financialExposure.returned.recorded_profit,
                      )}
                    </strong>
                  </div>
                </article>

                <article className="panel exposure-card">
                  <div className="exposure-card-heading">
                    <div>
                      <h2>Cancelled orders</h2>
                      <p>
                        Recorded amounts associated with cancelled orders
                      </p>
                    </div>
                    <AlertCircle size={20} />
                  </div>

                  <div className="exposure-value">
                    {formatNumber(financialExposure.cancelled.orders)}
                  </div>

                  <div className="exposure-detail">
                    <span>Recorded sales</span>
                    <strong>
                      {formatINR(
                        financialExposure.cancelled.recorded_sales,
                      )}
                    </strong>
                  </div>

                  <div className="exposure-detail">
                    <span>Recorded profit</span>
                    <strong>
                      {formatINR(
                        financialExposure.cancelled.recorded_profit,
                      )}
                    </strong>
                  </div>
                </article>
              </div>

              <div className="exposure-note">
                <AlertCircle size={17} />
                <p>
                  These figures reflect amounts recorded in the dataset.
                  They are not confirmed refunds, realized financial
                  losses, or proof that a return or cancellation caused
                  a loss. Risk labels use configurable analytical rules,
                  not validated business standards.
                </p>
              </div>
            </section>
          </>
        )}

        <footer className="footer">
          <span>AMAZONIQ · INDIA ANALYTICS</span>
          <span>
            Business intelligence dashboard · Built with React &amp; FastAPI
          </span>
        </footer>
      </main>
    </div>
  )
}

export default App