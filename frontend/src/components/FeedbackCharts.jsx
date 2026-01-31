import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = {
    primary: '#3b82f6',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    textMuted: '#64748b',
    grid: '#1e293b',
    bgTooltip: '#0f172a'
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                backgroundColor: COLORS.bgTooltip,
                border: '1px solid #1e293b',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
            }}>
                <p style={{ color: '#cbd5e1', marginBottom: '4px', fontSize: '0.9rem' }}>{label}</p>
                <p style={{ color: '#fff', fontWeight: 600 }}>
                    {payload[0].value} {payload[0].name === 'value' ? '' : payload[0].name}
                </p>
            </div>
        );
    }
    return null;
};

export const ConfidenceLineChart = ({ data }) => {
    // Mock fallback if specific granular data isn't present
    const chartData = data && data.length > 0 ? data : [
        { stage: 'Warmup', score: 65 },
        { stage: 'Tech 1', score: 72 },
        { stage: 'Tech 2', score: 68 },
        { stage: 'Deep Dive', score: 78 },
        { stage: 'Wrapup', score: 85 },
    ];

    return (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
                    <XAxis
                        dataKey="stage"
                        stroke={COLORS.textMuted}
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        domain={[0, 100]}
                        stroke={COLORS.textMuted}
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <Line
                        type="monotone"
                        dataKey="score"
                        stroke={COLORS.accent}
                        strokeWidth={3}
                        dot={{ r: 4, fill: COLORS.accent, strokeWidth: 0 }}
                        activeDot={{ r: 6, opacity: 0.5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export const SkillsRadarChart = ({ scores }) => {
    // Normalize scores 0-1 to 0-100 or use default
    const data = [
        { subject: 'Technical', A: (scores?.technical || 0.7) * 100, fullMark: 100 },
        { subject: 'Communication', A: (scores?.clarity || 0.8) * 100, fullMark: 100 },
        { subject: 'Confidence', A: (scores?.confidence || 0.6) * 100, fullMark: 100 },
        { subject: 'Depth', A: (scores?.depth || 0.65) * 100, fullMark: 100 },
        { subject: 'Adaptability', A: 85, fullMark: 100 }, // Mock derived from implicit signals
    ];

    return (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke={COLORS.grid} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: COLORS.textMuted, fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Candidate"
                        dataKey="A"
                        stroke={COLORS.primary}
                        fill={COLORS.primary}
                        fillOpacity={0.3}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export const SignalDonutChart = () => {
    // Mock data representing signal distribution analyzed by AI
    const data = [
        { name: 'Strong Positive', value: 35 },
        { name: 'Positive', value: 45 },
        { name: 'Neutral', value: 15 },
        { name: 'Concern', value: 5 },
    ];

    const PIE_COLORS = [COLORS.success, COLORS.primary, COLORS.warning, COLORS.error];

    return (
        <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span style={{ color: COLORS.textMuted, fontSize: 12 }}>{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center pb-8"> {/* pb-8 to offset legend */}
                    <div className="text-2xl font-bold text-white">100%</div>
                    <div className="text-xs text-secondary">Signals</div>
                </div>
            </div>
        </div>
    );
};
