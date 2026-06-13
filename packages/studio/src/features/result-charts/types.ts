export type ResultChartType = 'bar' | 'line' | 'area' | 'pie' | 'scatter'

export type ResultChartAggregation = 'count' | 'sum' | 'avg'

export type ResultChartColumnKind = 'number' | 'date' | 'text' | 'boolean' | 'unknown'

export type ResultChartColumn = {
	name: string
	type?: string | null
}

export type ResultChartConfig = {
	type: ResultChartType
	xColumn: string
	yColumns: string[]
	groupByColumn?: string | null
	aggregation: ResultChartAggregation
}

export type ResultChartPoint = Record<string, string | number | null>

export type ResultChartSeries = {
	key: string
	label: string
}

export type ResultChartDataset = {
	points: ResultChartPoint[]
	series: ResultChartSeries[]
	wasDownsampled: boolean
	originalPointCount: number
}
