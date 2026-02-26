import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { chartColors } from '../../utils/colors';

interface ChartProps {
    data: unknown[];
    type: 'area' | 'bar' | 'line' | 'pie' | 'scatter' | 'radar';
    dataKeys: string[];
    xKey?: string;
    height?: number;
    colors?: string[];
    stacked?: boolean;
    showGrid?: boolean;
    showLegend?: boolean;
    className?: string;
    gradientFill?: boolean;
}

const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
        <div className="glass p-3 text-xs" style={{ border: '1px solid var(--color-border-hover)' }}>
            {label && <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>{label}</p>}
            {payload.map((entry: any, i: number) => (
                <p key={i} style={{ color: entry.color }} className="font-numeric">
                    {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                </p>
            ))}
        </div>
    );
};

export default function Diagrams({
    data,
    type,
    dataKeys,
    xKey = 'name',
    height = 300,
    colors = chartColors,
    stacked = false,
    showGrid = true,
    showLegend = false,
    className = '',
    gradientFill = true,
}: ChartProps) {
    const axisStyle = { fontSize: 11, fill: 'var(--color-text-muted)' };

    const renderChart = () => {
        switch (type) {
            case 'area':
                return (
                    <AreaChart data={data as any[]}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />}
                        <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
                        <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltipContent />} />
                        {showLegend && <Legend />}
                        {dataKeys.map((key, i) => (
                            <Area
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={colors[i % colors.length]}
                                fill={gradientFill ? `url(#grad-${i})` : colors[i % colors.length]}
                                fillOpacity={gradientFill ? 1 : 0.15}
                                strokeWidth={2}
                                stackId={stacked ? 'stack' : undefined}
                                animationDuration={800}
                            />
                        ))}
                        <defs>
                            {dataKeys.map((_, i) => (
                                <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={colors[i % colors.length]} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={colors[i % colors.length]} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                    </AreaChart>
                );
            case 'bar':
                return (
                    <BarChart data={data as any[]}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />}
                        <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
                        <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltipContent />} />
                        {showLegend && <Legend />}
                        {dataKeys.map((key, i) => (
                            <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} stackId={stacked ? 'stack' : undefined} animationDuration={800} />
                        ))}
                    </BarChart>
                );
            case 'line':
                return (
                    <LineChart data={data as any[]}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />}
                        <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
                        <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltipContent />} />
                        {showLegend && <Legend />}
                        {dataKeys.map((key, i) => (
                            <Line key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} animationDuration={800} />
                        ))}
                    </LineChart>
                );
            case 'pie':
                return (
                    <PieChart>
                        <Pie data={data as any[]} dataKey={dataKeys[0]} nameKey={xKey} cx="50%" cy="50%" outerRadius={height / 3} innerRadius={height / 5} paddingAngle={2} animationDuration={800}>
                            {(data as any[]).map((_, i) => (
                                <Cell key={i} fill={colors[i % colors.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltipContent />} />
                        {showLegend && <Legend />}
                    </PieChart>
                );
            case 'scatter':
                return (
                    <ScatterChart>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />}
                        <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} name={xKey} />
                        <YAxis dataKey={dataKeys[0]} tick={axisStyle} axisLine={false} tickLine={false} name={dataKeys[0]} />
                        <Tooltip content={<CustomTooltipContent />} />
                        <Scatter data={data as any[]} fill={colors[0]} animationDuration={800} />
                    </ScatterChart>
                );
            case 'radar':
                return (
                    <RadarChart data={data as any[]} cx="50%" cy="50%" outerRadius="80%">
                        <PolarGrid stroke="var(--color-border)" />
                        <PolarAngleAxis dataKey={xKey} tick={axisStyle} />
                        <PolarRadiusAxis tick={axisStyle} />
                        {dataKeys.map((key, i) => (
                            <Radar key={key} dataKey={key} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.2} animationDuration={800} />
                        ))}
                        {showLegend && <Legend />}
                    </RadarChart>
                );
        }
    };

    return (
        <div className={className} style={{ width: '100%', height }}>
            <ResponsiveContainer width="100%" height="100%">
                {renderChart() as any}
            </ResponsiveContainer>
        </div>
    );
}
