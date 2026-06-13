import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis
} from 'recharts'
import { BarChart3, Download } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@studio/shared/ui/button'
import { Checkbox } from '@studio/shared/ui/checkbox'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@studio/shared/ui/select'
import { cn } from '@studio/shared/utils/cn'
import {
	buildChartDataset,
	chartTypesForConfig,
	getChartDegenerateReason,
	inferColumnKind,
	suggestChartConfig
} from './chart-data'
import type {
	ResultChartAggregation,
	ResultChartColumn,
	ResultChartConfig,
	ResultChartType
} from './types'

type Props = {
	columns: ResultChartColumn[]
	rows: Record<string, unknown>[]
	config: ResultChartConfig | null
	onConfigChange: (config: ResultChartConfig) => void
	title?: string
}

const CHART_TYPES: { value: ResultChartType; label: string }[] = [
	{ value: 'bar', label: 'Bar' },
	{ value: 'line', label: 'Line' },
	{ value: 'area', label: 'Area' },
	{ value: 'pie', label: 'Pie' },
	{ value: 'scatter', label: 'Scatter' }
]

const AGGREGATIONS: { value: ResultChartAggregation; label: string }[] = [
	{ value: 'sum', label: 'Sum' },
	{ value: 'avg', label: 'Avg' },
	{ value: 'count', label: 'Count' }
]

const SERIES_COLORS = [
	'hsl(var(--primary))',
	'hsl(var(--chart-2, var(--accent-foreground)))',
	'hsl(var(--chart-3, 170 70% 45%))',
	'hsl(var(--chart-4, 35 90% 55%))',
	'hsl(var(--chart-5, 285 70% 60%))',
	'hsl(var(--muted-foreground))'
]

export function ResultChartPanel({ columns, rows, config, onConfigChange, title }: Props) {
	const chartRef = useRef<HTMLDivElement>(null)
	const suggested = useMemo(
		function () {
			return suggestChartConfig({ columns, rows, previous: config })
		},
		[columns, rows, config]
	)
	const effectiveConfig = suggested

	useEffect(
		function applySuggestedConfig() {
			if (!effectiveConfig) return
			if (config && JSON.stringify(config) === JSON.stringify(effectiveConfig)) return
			onConfigChange(effectiveConfig)
		},
		[config, effectiveConfig, onConfigChange]
	)

	const columnsByKind = useMemo(
		function () {
			return columns.map(function (column) {
				return {
					...column,
					kind: inferColumnKind(column, rows)
				}
			})
		},
		[columns, rows]
	)
	const numericColumns = columnsByKind.filter(function (column) { return column.kind === 'number' })
	const dimensionColumns = columnsByKind.filter(function (column) {
		return column.kind === 'text' || column.kind === 'date' || column.kind === 'number'
	})
	const groupColumns = columnsByKind.filter(function (column) {
		return column.kind === 'text' || column.kind === 'boolean' || column.kind === 'date'
	})

	const reason = getChartDegenerateReason({ columns, rows, config: effectiveConfig })
	const dataset = useMemo(
		function () {
			if (!effectiveConfig || reason) return null
			return buildChartDataset({ rows, config: effectiveConfig })
		},
		[rows, effectiveConfig, reason]
	)

	function updateConfig(patch: Partial<ResultChartConfig>) {
		const base = effectiveConfig ?? suggestChartConfig({ columns, rows })
		if (!base) return
		const next = { ...base, ...patch }
		if (next.type === 'pie' && next.yColumns.length > 1) {
			next.yColumns = [next.yColumns[0]]
		}
		onConfigChange(next)
	}

	function toggleYColumn(columnName: string) {
		if (!effectiveConfig) return
		const selected = new Set(effectiveConfig.yColumns)
		if (selected.has(columnName)) {
			selected.delete(columnName)
		} else {
			selected.add(columnName)
		}
		const yColumns = Array.from(selected)
		if (yColumns.length === 0) return
		updateConfig({ yColumns })
	}

	function exportSvg() {
		const svg = chartRef.current?.querySelector('svg')
		if (!svg) return
		const source = new XMLSerializer().serializeToString(svg)
		downloadBlob(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }), 'result-chart.svg')
	}

	function exportPng() {
		const svg = chartRef.current?.querySelector('svg')
		if (!svg) return
		const source = new XMLSerializer().serializeToString(svg)
		const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
		const url = URL.createObjectURL(blob)
		const image = new Image()
		image.onload = function () {
			const rect = svg.getBoundingClientRect()
			const canvas = document.createElement('canvas')
			canvas.width = Math.max(1, Math.floor(rect.width * window.devicePixelRatio))
			canvas.height = Math.max(1, Math.floor(rect.height * window.devicePixelRatio))
			const context = canvas.getContext('2d')
			if (!context) {
				URL.revokeObjectURL(url)
				return
			}
			context.fillStyle = getComputedStyle(document.documentElement)
				.getPropertyValue('--background')
				.trim()
				? `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--background')})`
				: '#ffffff'
			context.fillRect(0, 0, canvas.width, canvas.height)
			context.scale(window.devicePixelRatio, window.devicePixelRatio)
			context.drawImage(image, 0, 0, rect.width, rect.height)
			canvas.toBlob(function (pngBlob) {
				if (pngBlob) downloadBlob(pngBlob, 'result-chart.png')
				URL.revokeObjectURL(url)
			}, 'image/png')
		}
		image.src = url
	}

	return (
		<div className='flex h-full min-h-0 flex-col bg-background'>
			<div className='flex shrink-0 flex-wrap items-center gap-2 border-b border-sidebar-border bg-sidebar-accent/10 px-3 py-2'>
				<div className='flex min-w-0 items-center gap-2 text-xs font-medium text-sidebar-foreground'>
					<BarChart3 className='h-4 w-4 text-primary' />
					<span className='truncate'>{title ?? 'Chart'}</span>
				</div>

				{effectiveConfig && (
					<>
						<Field label='Type'>
							<Select
								value={effectiveConfig.type}
								onValueChange={(value) =>
									updateConfig({ type: value as ResultChartType })
								}
							>
								<SelectTrigger className='h-7 w-[96px] text-xs'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{CHART_TYPES.map(function (type) {
										const disabled = !chartTypesForConfig(effectiveConfig).includes(type.value)
										return (
											<SelectItem key={type.value} value={type.value} disabled={disabled}>
												{type.label}
											</SelectItem>
										)
									})}
								</SelectContent>
							</Select>
						</Field>

						<Field label='X'>
							<Select
								value={effectiveConfig.xColumn}
								onValueChange={(value) => updateConfig({ xColumn: value })}
							>
								<SelectTrigger className='h-7 w-[150px] text-xs'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{dimensionColumns.map(function (column) {
										return (
											<SelectItem key={column.name} value={column.name}>
												{column.name}
											</SelectItem>
										)
									})}
								</SelectContent>
							</Select>
						</Field>

						<Field label='Y'>
							<div className='flex max-w-[360px] flex-wrap gap-1'>
								{numericColumns.map(function (column) {
									const checked = effectiveConfig.yColumns.includes(column.name)
									const disabled =
										effectiveConfig.type === 'pie' &&
										!checked &&
										effectiveConfig.yColumns.length >= 1
									return (
										<label
											key={column.name}
											className={cn(
												'inline-flex h-7 items-center gap-1.5 rounded-md border border-sidebar-border bg-background px-2 text-xs text-sidebar-foreground',
												disabled && 'opacity-50'
											)}
										>
											<Checkbox
												checked={checked}
												disabled={disabled}
												onCheckedChange={() => toggleYColumn(column.name)}
											/>
											<span className='max-w-[90px] truncate'>{column.name}</span>
										</label>
									)
								})}
							</div>
						</Field>

						<Field label='Group'>
							<Select
								value={effectiveConfig.groupByColumn || '__none__'}
								onValueChange={(value) =>
									updateConfig({
										groupByColumn: value === '__none__' ? null : value
									})
								}
							>
								<SelectTrigger className='h-7 w-[140px] text-xs'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='__none__'>None</SelectItem>
									{groupColumns.map(function (column) {
										return (
											<SelectItem key={column.name} value={column.name}>
												{column.name}
											</SelectItem>
										)
									})}
								</SelectContent>
							</Select>
						</Field>

						<Field label='Agg'>
							<Select
								value={effectiveConfig.aggregation}
								onValueChange={(value) =>
									updateConfig({ aggregation: value as ResultChartAggregation })
								}
							>
								<SelectTrigger className='h-7 w-[92px] text-xs'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{AGGREGATIONS.map(function (aggregation) {
										return (
											<SelectItem key={aggregation.value} value={aggregation.value}>
												{aggregation.label}
											</SelectItem>
										)
									})}
								</SelectContent>
							</Select>
						</Field>
					</>
				)}

				<div className='ml-auto flex items-center gap-1'>
					<Button
						variant='ghost'
						size='sm'
						className='h-7 px-2 text-xs'
						onClick={exportPng}
						disabled={!dataset || dataset.points.length === 0}
					>
						<Download className='h-3.5 w-3.5' />
						PNG
					</Button>
					<Button
						variant='ghost'
						size='sm'
						className='h-7 px-2 text-xs'
						onClick={exportSvg}
						disabled={!dataset || dataset.points.length === 0}
					>
						<Download className='h-3.5 w-3.5' />
						SVG
					</Button>
				</div>
			</div>

			<div className='min-h-0 flex-1 p-4'>
				{reason ? (
					<div className='flex h-full items-center justify-center'>
						<div className='max-w-md rounded-lg border border-sidebar-border bg-sidebar-accent/20 p-5 text-center'>
							<BarChart3 className='mx-auto mb-3 h-8 w-8 text-muted-foreground' />
							<div className='text-sm font-medium text-sidebar-foreground'>
								Can't chart this result
							</div>
							<div className='mt-1 text-xs text-muted-foreground'>{reason}</div>
						</div>
					</div>
				) : dataset && effectiveConfig ? (
					<div className='flex h-full min-h-0 flex-col gap-2'>
						{dataset.wasDownsampled && (
							<div className='shrink-0 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300'>
								Showing {dataset.points.length.toLocaleString()} sampled points from{' '}
								{dataset.originalPointCount.toLocaleString()} aggregated points.
							</div>
						)}
						<div ref={chartRef} className='min-h-0 flex-1 rounded-lg border border-sidebar-border bg-background p-3'>
							<ResponsiveContainer width='100%' height='100%'>
								{renderChart(effectiveConfig, dataset)}
							</ResponsiveContainer>
						</div>
					</div>
				) : null}
			</div>
		</div>
	)
}

function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<label className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
			<span>{label}</span>
			{children}
		</label>
	)
}

function renderChart(config: ResultChartConfig, dataset: NonNullable<ReturnType<typeof buildChartDataset>>) {
	if (config.type === 'pie') {
		const firstSeries = dataset.series[0]
		return (
			<PieChart>
				<Tooltip />
				<Legend />
				<Pie
					data={dataset.points}
					dataKey={firstSeries?.key}
					nameKey='__x'
					innerRadius='45%'
					outerRadius='78%'
					paddingAngle={1}
				>
					{dataset.points.map(function (_point, index) {
						return (
							<Cell
								key={index}
								fill={SERIES_COLORS[index % SERIES_COLORS.length]}
							/>
						)
					})}
				</Pie>
			</PieChart>
		)
	}

	const common = (
		<>
			<CartesianGrid stroke='hsl(var(--border))' strokeDasharray='3 3' />
			<XAxis dataKey='__x' tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
			<YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
			<Tooltip
				contentStyle={{
					background: 'hsl(var(--popover))',
					border: '1px solid hsl(var(--border))',
					color: 'hsl(var(--popover-foreground))'
				}}
			/>
			<Legend />
		</>
	)

	if (config.type === 'line') {
		return (
			<LineChart data={dataset.points}>
				{common}
				{dataset.series.map(function (series, index) {
					return (
						<Line
							key={series.key}
							type='monotone'
							dataKey={series.key}
							stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
							strokeWidth={2}
							dot={false}
							isAnimationActive={false}
						/>
					)
				})}
			</LineChart>
		)
	}

	if (config.type === 'area') {
		return (
			<AreaChart data={dataset.points}>
				{common}
				{dataset.series.map(function (series, index) {
					const color = SERIES_COLORS[index % SERIES_COLORS.length]
					return (
						<Area
							key={series.key}
							type='monotone'
							dataKey={series.key}
							stroke={color}
							fill={color}
							fillOpacity={0.22}
							isAnimationActive={false}
						/>
					)
				})}
			</AreaChart>
		)
	}

	if (config.type === 'scatter') {
		const y = dataset.series[0]?.key
		return (
			<ScatterChart data={dataset.points}>
				{common}
				<Scatter
					data={dataset.points}
					dataKey={y}
					fill={SERIES_COLORS[0]}
					isAnimationActive={false}
				/>
			</ScatterChart>
		)
	}

	return (
		<BarChart data={dataset.points}>
			{common}
			{dataset.series.map(function (series, index) {
				return (
					<Bar
						key={series.key}
						dataKey={series.key}
						fill={SERIES_COLORS[index % SERIES_COLORS.length]}
						isAnimationActive={false}
					/>
				)
			})}
		</BarChart>
	)
}

function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob)
	const anchor = document.createElement('a')
	anchor.href = url
	anchor.download = filename
	anchor.click()
	URL.revokeObjectURL(url)
}
