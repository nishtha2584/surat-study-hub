import { useState, useEffect } from "react";
import { Card, Table, Tabs, Typography, DatePicker, Row, Col, Tag, message, ConfigProvider, Space, Progress } from "antd";
import { motion } from "framer-motion";
import { 
    BarChartOutlined, 
    AlertOutlined, 
    WalletOutlined, 
    CalendarOutlined,
    RiseOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
    getDailyAdmissionReport,
    getBatchOccupancyReport,
    getLowOccupancyAlert,
    getFeePendingReport
} from "../api/reports";
import type {
    DailyReportResponse,
    BatchOccupancyRow,
    LowOccupancyRow,
    FeePendingRow
} from "../api/reports";

const { Title, Text } = Typography;

const cardStyle: React.CSSProperties = {
  borderRadius: "20px",
  border: "1px solid #f1f5f9",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
  background: "#fff",
  overflow: "hidden"
};

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState("1");

    return (
        <ConfigProvider
            theme={{
                components: {
                    Tabs: {
                        itemSelectedColor: "#2563eb",
                        itemHoverColor: "#2563eb",
                        itemActiveColor: "#2563eb",
                        inkBarColor: "#2563eb",
                        titleFontSize: 15,
                        horizontalMargin: "0 0 24px 0"
                    },
                    Table: {
                        headerBg: "#f8fafc",
                        headerColor: "#475569",
                        headerBorderRadius: 12,
                        rowHoverBg: "#f8fafc"
                    }
                }
            }}
        >
            <div style={{ padding: "40px 48px", maxWidth: "1500px", margin: "0 auto" }}>
                <div style={{ marginBottom: 40 }}>
                    <Title level={1} style={{ margin: 0, letterSpacing: "-0.04em", fontWeight: 900, fontSize: "32px" }}>Reports</Title>
                    <Text type="secondary" style={{ fontSize: "15px", fontWeight: 500, color: "#64748b" }}>Track admissions, fees, and batch occupancy metrics.</Text>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card style={cardStyle} bodyStyle={{ padding: "32px" }}>
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            items={[
                                { 
                                    key: "1", 
                                    label: <Space><RiseOutlined />Collections</Space>, 
                                    children: <DailyAdmissionReport /> 
                                },
                                { 
                                    key: "2", 
                                    label: <Space><BarChartOutlined />Batch Occupancy</Space>, 
                                    children: <BatchOccupancyReport /> 
                                },
                                { 
                                    key: "3", 
                                    label: <Space><AlertOutlined />Low Occupancy</Space>, 
                                    children: <LowOccupancyAlerts /> 
                                },
                                { 
                                    key: "4", 
                                    label: <Space><WalletOutlined />Pending Fees</Space>, 
                                    children: <FeePendingReport /> 
                                },
                            ]}
                        />
                    </Card>
                </motion.div>
            </div>

            <style>{`
                .ant-table-thead > tr > th {
                    font-size: 11.5px !important;
                    font-weight: 800 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    color: #64748b !important;
                    padding: 20px 16px !important;
                }
                .premium-table .ant-table-row { 
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important; 
                    cursor: pointer;
                }
                .premium-table .ant-table-row:hover { 
                    background-color: #f8fafc !important; 
                    transform: scale(1.002);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    z-index: 10;
                }
                .ant-tabs-nav::before {
                    border-bottom: 2px solid #f1f5f9 !important;
                }
            `}</style>
        </ConfigProvider>
    );
}

// ----------------------------------------------------------------------
// 1. Daily Admission & Collection Summary
// ----------------------------------------------------------------------
function DailyAdmissionReport() {
    const [date, setDate] = useState<dayjs.Dayjs>(dayjs());
    const [data, setData] = useState<DailyReportResponse | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        getDailyAdmissionReport(date.format("YYYY-MM-DD"))
            .then(setData)
            .catch(() => message.error("Failed to load daily report"))
            .finally(() => setLoading(false));
    }, [date]);

    return (
        <div style={{ paddingTop: "12px" }}>
            <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: "16px" }}>
                <Text strong style={{ color: "#475569" }}>Select Date:</Text>
                <DatePicker 
                    value={date} 
                    onChange={(d) => d && setDate(d)} 
                    allowClear={false}
                    suffixIcon={<CalendarOutlined style={{ color: "#2563eb" }} />}
                    style={{ borderRadius: "10px", height: "44px", width: "220px", border: "1px solid #e2e8f0" }}
                />
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
                {[
                    { title: "New Admissions", value: data?.summary?.total_new_admissions || 0, color: "#0f172a" },
                    { title: "Enrollments", value: data?.summary?.total_students_enrolled || 0, color: "#0f172a" },
                    { title: "Fees Collected", value: `₹${(data?.summary?.total_fee_collected || 0).toLocaleString()}`, color: "#166534" },
                    { title: "Pending Fees", value: `₹${(data?.summary?.total_pending_fees || 0).toLocaleString()}`, color: "#991b1b" },
                ].map((stat, i) => (
                    <Col xs={24} sm={12} lg={6} key={i}>
                        <div style={{ background: "#f8fafc", padding: "24px", borderRadius: "16px", border: "1px solid #eef2f6" }}>
                            <Text strong style={{ color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.title}</Text>
                            <div style={{ marginTop: "4px" }}>
                                <Text style={{ fontSize: "24px", fontWeight: 900, color: stat.color }}>{stat.value}</Text>
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>

            <div style={{ marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Top Enrolled Batches</Title>
                <Text type="secondary">Primary high-velocity batches based on selected date.</Text>
            </div>
            <Table
                className="premium-table"
                loading={loading}
                dataSource={data?.topBatches || []}
                rowKey="code"
                pagination={false}
                columns={[
                    { title: "Batch Code", dataIndex: "code", key: "code", render: v => <Text strong style={{ color: "#2563eb" }}>{v}</Text> },
                    { title: "Subject", dataIndex: "subject", key: "subject", render: v => <Text style={{ fontWeight: 600 }}>{v}</Text> },
                    { title: "Total Enrollments", dataIndex: "new_admissions", key: "new_admissions", render: v => <Text strong>{v}</Text> },
                ]}
                style={{ paddingBottom: "20px" }}
            />
        </div>
    );
}

// ----------------------------------------------------------------------
// 2. Batch Occupancy Report
// ----------------------------------------------------------------------
function BatchOccupancyReport() {
    const [data, setData] = useState<BatchOccupancyRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getBatchOccupancyReport()
            .then(setData)
            .catch(() => message.error("Failed to load occupancy report"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ paddingTop: "12px" }}>
            <Table
                className="premium-table"
                loading={loading}
                dataSource={data}
                rowKey="code"
                pagination={{ pageSize: 10 }}
                columns={[
                    { title: "Batch", dataIndex: "code", key: "code", render: v => <Text strong style={{ color: "#2563eb" }}>{v}</Text> },
                    { title: "Subject", dataIndex: "subject", key: "subject", render: v => <Text style={{ fontWeight: 600 }}>{v}</Text> },
                    { title: "Standard", dataIndex: "standard", key: "standard" },
                    { title: "Teacher", dataIndex: "teacher_name", key: "teacher_name", render: v => <Text style={{ color: "#64748b" }}>{v || "Unassigned"}</Text> },
                    {
                        title: "Occupancy",
                        key: "occupancy",
                        render: (_, b) => {
                            const val = b.occupancy_percentage;
                            const color = val > 75 ? "#22c55e" : val > 40 ? "#f59e0b" : "#ef4444";
                            return (
                                <div style={{ width: "160px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                        <Text style={{ fontSize: "12px", fontWeight: 700 }}>{b.occupied_seats} / {b.total_seats}</Text>
                                        <Text style={{ fontSize: "12px", fontWeight: 800, color }}>{val}%</Text>
                                    </div>
                                    <Progress percent={val} showInfo={false} size="small" strokeColor={color} trailColor="#f1f5f9" />
                                </div>
                            );
                        }
                    },
                    { title: "Seats Left", dataIndex: "available_seats", key: "available_seats", render: v => <Text strong>{v}</Text> },
                ]}
            />
        </div>
    );
}

// ----------------------------------------------------------------------
// 3. Low Occupancy Alerts
// ----------------------------------------------------------------------
function LowOccupancyAlerts() {
    const [data, setData] = useState<LowOccupancyRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLowOccupancyAlert()
            .then(setData)
            .catch(() => message.error("Failed to load low occupancy alerts"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ paddingTop: "12px" }}>
            <Table
                className="premium-table"
                loading={loading}
                dataSource={data}
                rowKey="code"
                columns={[
                    { title: "Batch", dataIndex: "code", key: "code", render: v => <Text strong style={{ color: "#ef4444" }}>{v}</Text> },
                    { title: "Subject", dataIndex: "subject", key: "subject", render: v => <Text style={{ fontWeight: 600 }}>{v}</Text> },
                    { title: "Teacher", dataIndex: "teacher_name", key: "teacher_name" },
                    { title: "Occupied", dataIndex: "occupied_seats", key: "occupied_seats", render: v => <Text strong>{v}</Text> },
                    { title: "Seats Left", dataIndex: "available_seats", key: "available_seats" },
                    {
                        title: "Status",
                        dataIndex: "occupancy_status",
                        key: "occupancy_status",
                        render: (status: string) => (
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px",
                                borderRadius: "24px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
                                background: status === 'AT RISK' ? '#fef2f2' : '#fffbeb',
                                color: status === 'AT RISK' ? '#991b1b' : '#92400e',
                                textTransform: "uppercase"
                            }}>
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: status === 'AT RISK' ? '#ef4444' : '#f59e0b' }} />
                                {status}
                            </div>
                        )
                    },
                ]}
            />
        </div>
    );
}

// ----------------------------------------------------------------------
// 4. Fee Pending Tracker
// ----------------------------------------------------------------------
function FeePendingReport() {
    const [data, setData] = useState<FeePendingRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getFeePendingReport()
            .then(setData)
            .catch(() => message.error("Failed to load fee pending report"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ paddingTop: "12px" }}>
            <Table
                className="premium-table"
                loading={loading}
                dataSource={data}
                rowKey={(r) => r.enrollment_number || r.student_name}
                scroll={{ x: true }}
                columns={[
                    { 
                        title: "Student", 
                        key: "student",
                        render: (_, r) => (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <Text strong style={{ color: "#1e293b" }}>{r.student_name}</Text>
                                <Text style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>{r.enrollment_number}</Text>
                            </div>
                        )
                    },
                    { title: "Parent", dataIndex: "parent_name", key: "parent_name" },
                    { title: "Phone", dataIndex: "parent_contact", key: "parent_contact", render: v => <Text style={{ color: "#64748b" }}>{v}</Text> },
                    { title: "Total Fee", dataIndex: "total_monthly_fee", key: "total_monthly_fee", render: v => <Text strong>₹{v.toLocaleString()}</Text> },
                    { title: "Paid", dataIndex: "amount_paid", key: "amount_paid", render: v => <Text style={{ color: "#166534" }}>₹{v.toLocaleString()}</Text> },
                    { title: "Pending", dataIndex: "amount_pending", key: "amount_pending", render: v => <Text strong style={{ color: "#ef4444" }}>₹{v.toLocaleString()}</Text> },
                    {
                        title: "Status",
                        dataIndex: "days_overdue",
                        key: "days_overdue",
                        render: (days: number | null) => {
                            if (days === null) return <Tag>N/A</Tag>;
                            if (days <= 0) return <Tag color="success" style={{ borderRadius: "6px", fontWeight: 700 }}>ON TIME</Tag>;
                            return (
                                <div style={{ color: "#991b1b", fontWeight: 800, fontSize: "12px" }}>
                                    {days} DAYS OVERDUE
                                </div>
                            );
                        }
                    },
                ]}
            />
        </div>
    );
}

