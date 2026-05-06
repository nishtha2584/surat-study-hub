import { Card, Row, Col, Spin, Result, Button, Table, Progress, Space, Typography, ConfigProvider } from "antd";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";

import {
  useDashboard,
  type AdminDashboardData,
  type TeacherDashboardData,
  type ReceptionistDashboardData,
} from "../hooks/useDashboard";
import useAuthStore from "../stores/useAuthStore";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const COLORS = ["#2563eb", "#60a5fa", "#3b82f6", "#1d4ed8", "#93c5fd"];

const cardStyle: React.CSSProperties = {
  borderRadius: "20px",
  border: "1px solid #f1f5f9",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
  background: "#fff",
  overflow: "hidden"
};

export default function Dashboard() {
  const { data, isLoading, error, refetch } = useDashboard();
  const user = useAuthStore((state) => state.user);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px" }}>
        <Result
          status="error"
          title="Failed to load dashboard"
          extra={<Button size="large" type="primary" onClick={() => refetch()} style={{ borderRadius: "10px" }}>Retry Connection</Button>}
        />
      </div>
    );
  }

  if (!data || !user) return null;

  const role = user.role;

  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            headerBg: "#f8fafc",
            headerColor: "#475569",
            headerBorderRadius: 12,
            rowHoverBg: "#f8fafc"
          },
          Card: {
            headerFontSize: 16,
            headerHeight: 64
          }
        }
      }}
    >
      <div style={{ padding: "40px 48px", maxWidth: "1500px", margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 40 }}>
          <Title level={1} style={{ margin: 0, letterSpacing: "-0.04em", fontWeight: 900, fontSize: "32px" }}>
            Dashboard
          </Title>
          <Text type="secondary" style={{ fontSize: "15px", fontWeight: 500, color: "#64748b" }}>
            {role === "TEACHER"
              ? "Track your classes and student attendance."
              : role === "RECEPTIONIST"
              ? "Manage student registrations and payments."
              : "Institutional overview of performance and revenue."}
          </Text>
        </div>

        {role === "TEACHER" ? (
          <TeacherDashboard data={data as TeacherDashboardData} />
        ) : role === "RECEPTIONIST" ? (
          <ReceptionistDashboard data={data as ReceptionistDashboardData} />
        ) : (
          <AdminDashboard data={data as AdminDashboardData} />
        )}
      </div>

      <style>{`
        .ant-table-thead > tr > th {
            font-size: 11.5px !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            color: #64748b !important;
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
      `}</style>
    </ConfigProvider>
  );
}

function AdminDashboard({ data }: { data: AdminDashboardData }) {
  return (
    <>
      {/* KPI CARDS */}
      <Row gutter={[24, 24]}>
        {[
          { title: "Students", value: data.totalStudents, label: "Total Students" },
          { title: "Batches", value: data.activeBatches, label: "Active Batches" },
          { title: "Revenue", value: `₹${data.totalRevenue}`, label: "Total Revenue" },
          { title: "Attendance", value: `${data.attendancePercentage}%`, label: "Avg Attendance" },
        ].map((item, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card style={cardStyle} styles={{ body: { padding: "28px" } }}>
                <Text strong style={{ color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {item.label}
                </Text>
                <Title level={2} style={{ margin: "4px 0 0", fontWeight: 900, color: "#0f172a" }}>{item.value}</Title>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      {/* CHARTS */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            title={<Title level={4} style={{ margin: 0, fontWeight: 800 }}>Revenue by Standard</Title>}
            style={cardStyle}
          >
            <div style={{ padding: "24px 12px" }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.revenueByStandard}>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                  <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={<Title level={4} style={{ margin: 0, fontWeight: 800 }}>Enrollment Distribution</Title>}
            style={cardStyle}
          >
            <div style={{ padding: "24px 0" }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.enrollmentsByStandard.map(d => ({
                        ...d,
                        name: d.name.charAt(0) + d.name.slice(1).toLowerCase()
                    }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={100}
                    stroke="none"
                    paddingAngle={5}
                  >
                    {(data.enrollmentsByStandard ?? []).map((_: unknown, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    formatter={(v) => <span style={{ color: '#64748b', fontWeight: 600, fontSize: '12px' }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
}

function TeacherDashboard({ data }: { data: TeacherDashboardData }) {
  const batchColumns = [
    {
      title: "Batch Code",
      dataIndex: "code",
      key: "code",
      render: (text: string) => <Text strong style={{ color: "#2563eb" }}>{text}</Text>
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      render: (text: string) => <Text style={{ color: "#1e293b", fontWeight: 500 }}>{text}</Text>
    },
    {
      title: "Standard",
      dataIndex: "standard",
      key: "standard",
    },
    {
      title: "Students",
      dataIndex: "totalStudents",
      key: "totalStudents",
      render: (count: number) => <Text strong>{count}</Text>
    },
    {
      title: "Attendance",
      dataIndex: "attendancePercentage",
      key: "attendancePercentage",
      render: (percentage: number) => (
        <Space direction="vertical" style={{ width: "100%" }} size={0}>
          <Text style={{ fontSize: "12px", fontWeight: 700, color: percentage >= 75 ? "#10b981" : "#64748b" }}>
            {percentage}%
          </Text>
          <Progress
            percent={percentage}
            showInfo={false}
            size="small"
            strokeColor={percentage >= 75 ? "#10b981" : "#2563eb"}
            railColor="#f1f5f9"
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={[24, 24]}>
        {[
          { title: "My Batches", value: data.totalBatchesAssigned },
          { title: "My Students", value: data.totalStudentsTeaching },
          { title: "Attendance", value: `${data.attendancePercentage}%` },
        ].map((item, i) => (
          <Col xs={24} sm={12} lg={8} key={i}>
            <motion.div whileHover={{ y: -4 }}>
              <Card style={cardStyle} styles={{ body: { padding: "28px" } }}>
                <Text strong style={{ color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {item.title}
                </Text>
                <Title level={2} style={{ margin: "4px 0 0", fontWeight: 900, color: "#0f172a" }}>{item.value}</Title>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      <Row style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card
            title={<Title level={4} style={{ margin: 0, fontWeight: 800 }}>My Batches</Title>}
            style={cardStyle}
          >
            <Table
              className="premium-table"
              columns={batchColumns}
              dataSource={data.batches}
              rowKey="id"
              pagination={false}
              style={{ padding: "8px 20px 20px" }}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}

function ReceptionistDashboard({ data }: { data: ReceptionistDashboardData }) {
  const navigate = useNavigate();

  const registrationColumns = [
    {
      title: "Student Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: ReceptionistDashboardData['recentRegistrations'][0]) => (
        <Button 
          type="link" 
          onClick={() => navigate(`/students/${record.id}`)} 
          style={{ padding: 0, fontWeight: 700, height: "auto" }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: "Standard",
      dataIndex: "standard",
      key: "standard",
    },
    {
      title: "Registration Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => <Text style={{ color: "#64748b" }}>{dayjs(date).format("DD MMM YYYY")}</Text>,
    },
  ];

  return (
    <>
      <Row gutter={[24, 24]}>
        {[
          { title: "All Students", value: data.totalStudents, color: "#2563eb" },
          { title: "Due Fees", value: data.pendingPaymentsCount, color: "#ef4444" },
          { title: "All Batches", value: data.activeBatchesCount, color: "#10b981" },
        ].map((item, i) => (
          <Col xs={24} sm={12} lg={8} key={i}>
            <motion.div whileHover={{ y: -4 }}>
              <Card style={cardStyle} styles={{ body: { padding: "28px" } }}>
                <Text strong style={{ color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {item.title}
                </Text>
                <Title level={2} style={{ margin: "4px 0 0", fontWeight: 900, color: item.color }}>{item.value}</Title>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title={<Title level={4} style={{ margin: 0, fontWeight: 800 }}>New Students</Title>}
            extra={<Button onClick={() => navigate("/students")} style={{ fontWeight: 600 }}>Explore All</Button>}
            style={cardStyle}
          >
            <Table
              className="premium-table"
              columns={registrationColumns}
              dataSource={data.recentRegistrations}
              rowKey="id"
              pagination={false}
              style={{ padding: "8px 20px 20px" }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={<Title level={4} style={{ margin: 0, fontWeight: 800 }}>Actions</Title>}
            style={{ ...cardStyle, height: "100%" }}
          >
            <div style={{ padding: "24px" }}>
              <Space orientation="vertical" style={{ width: "100%" }} size="large">
                <Button 
                  type="primary" 
                  block 
                  size="large" 
                  onClick={() => navigate("/students/new")}
                  style={{ height: "52px", borderRadius: "12px", fontWeight: 700, boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)" }}
                >
                  Register Student
                </Button>
                <Button 
                  block 
                  size="large" 
                  onClick={() => navigate("/students")}
                  style={{ height: "52px", borderRadius: "12px", fontWeight: 700 }}
                >
                  Process Payments
                </Button>
                <Button 
                  block 
                  size="large" 
                  onClick={() => navigate("/batches")}
                  style={{ height: "52px", borderRadius: "12px", fontWeight: 700 }}
                >
                  Manage Batches
                </Button>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
}
