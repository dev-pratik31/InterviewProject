import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

/**
 * Premium Color Palette
 */
const COLORS = {
    primary: '#667eea',
    primaryLight: '#764ba2',
    accent: '#06b6d4',
    accentLight: '#22d3ee',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    text: '#f8fafc',
    textMuted: '#64748b',
    grid: '#1e293b',
    gridLight: '#334155'
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                backgroundColor: '#0f172a',
                border: '2px solid #334155',
                padding: 'var(--spacing-md)',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
            }}>
                <p style={{
                    color: '#cbd5e1',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: '0.875rem',
                    fontWeight: 600
                }}>
                    {label}
                </p>
                <p style={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1.125rem'
                }}>
                    {payload[0].value} {payload[0].name === 'value' ? '' : payload[0].name}
                </p>
            </div>
        );
    }
    return null;
};

export const InterviewFunnelChart = ({ data }) => {
    const chartData = data || [
        { name: 'Applied', value: 120, color: '#667eea' },
        { name: 'Screening', value: 85, color: '#764ba2' },
        { name: 'Interview', value: 45, color: '#06b6d4' },
        { name: 'Offer', value: 12, color: '#10b981' },
    ];

    return (
        <div className="card" style={{
            padding: 'var(--spacing-xl)',
            height: '100%',
            minHeight: '400px',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
        }}>
            <div style={{
                marginBottom: 'var(--spacing-lg)',
                paddingBottom: 'var(--spacing-md)',
                borderBottom: '2px solid var(--color-border)'
            }}>
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    marginBottom: 'var(--spacing-xs)'
                }}>
                    Hiring Funnel
                </h3>
                <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)'
                }}>
                    Candidate progression through stages
                </p>
            </div>
            <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={COLORS.grid}
                            horizontal={false}
                        />
                        <XAxis
                            type="number"
                            stroke={COLORS.textMuted}
                            style={{ fontSize: '0.875rem', fontWeight: 500 }}
                        />
                        <YAxis
                            dataKey="name"
                            type="category"
                            stroke={COLORS.textMuted}
                            width={100}
                            style={{ fontSize: '0.875rem', fontWeight: 600 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(102, 126, 234, 0.1)' }} />
                        <Bar
                            dataKey="value"
                            radius={[0, 8, 8, 0]}
                            barSize={32}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const OutcomePieChart = ({ data }) => {
    const chartData = data || [
        { name: 'Strong Fit', value: 8 },
        { name: 'Potential', value: 15 },
        { name: 'Needs Review', value: 10 },
        { name: 'No Fit', value: 5 },
    ];

    const PIE_COLORS = ['#10b981', '#667eea', '#f59e0b', '#ef4444'];

    const renderCustomLabel = (entry) => {
        return `${entry.value}`;
    };

    return (
        <div className="card" style={{
            padding: 'var(--spacing-xl)',
            height: '100%',
            minHeight: '400px',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
        }}>
            <div style={{
                marginBottom: 'var(--spacing-lg)',
                paddingBottom: 'var(--spacing-md)',
                borderBottom: '2px solid var(--color-border)'
            }}>
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    marginBottom: 'var(--spacing-xs)'
                }}>
                    Interview Outcomes
                </h3>
                <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)'
                }}>
                    Candidate assessment distribution
                </p>
            </div>
            <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomLabel}
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                    stroke="none"
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-lg)'
            }}>
                {chartData.map((entry, index) => (
                    <div
                        key={index}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            padding: 'var(--spacing-xs)',
                            background: 'var(--color-bg-tertiary)',
                            borderRadius: '8px'
                        }}
                    >
                        <span style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '3px',
                            backgroundColor: PIE_COLORS[index],
                            flexShrink: 0
                        }}></span>
                        <span style={{
                            color: 'var(--color-text-primary)',
                            fontSize: '0.875rem',
                            fontWeight: 500
                        }}>
                            {entry.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ConfidenceTrendChart = () => {
    const data = [
        { name: 'Mon', value: 65 },
        { name: 'Tue', value: 72 },
        { name: 'Wed', value: 68 },
        { name: 'Thu', value: 75 },
        { name: 'Fri', value: 82 },
        { name: 'Sat', value: 78 },
        { name: 'Sun', value: 85 },
    ];

    return (
        <div className="card" style={{
            padding: 'var(--spacing-xl)',
            height: '100%',
            minHeight: '400px',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
        }}>
            <div style={{
                marginBottom: 'var(--spacing-lg)',
                paddingBottom: 'var(--spacing-md)',
                borderBottom: '2px solid var(--color-border)'
            }}>
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    marginBottom: 'var(--spacing-xs)'
                }}>
                    Candidate Confidence Trend
                </h3>
                <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)'
                }}>
                    Weekly average confidence scores
                </p>
            </div>
            <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={COLORS.grid}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="name"
                            stroke={COLORS.textMuted}
                            tickLine={false}
                            axisLine={false}
                            style={{ fontSize: '0.875rem', fontWeight: 500 }}
                        />
                        <YAxis
                            stroke={COLORS.textMuted}
                            tickLine={false}
                            axisLine={false}
                            style={{ fontSize: '0.875rem', fontWeight: 500 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#06b6d4"
                            fillOpacity={1}
                            fill="url(#colorConfidence)"
                            strokeWidth={3}
                            dot={{
                                fill: '#06b6d4',
                                strokeWidth: 2,
                                r: 5,
                                stroke: '#0f172a'
                            }}
                            activeDot={{
                                r: 7,
                                stroke: '#06b6d4',
                                strokeWidth: 3,
                                fill: '#0f172a'
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};