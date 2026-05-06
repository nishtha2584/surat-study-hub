import {
  Table,
  Button,
  Input,
  Select,
  Row,
  Col,
  Card,
  Space,
  Tag,
  Spin,
  Result,
  Typography,
  ConfigProvider,
  Avatar
} from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { SearchOutlined, PlusOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { getStudents } from "../api/students";
import { useDebounce } from "../hooks/useDebounce";

const { Title, Text } = Typography;

const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PAID: { bg: "#f0fdf4", text: "#166534", dot: "#22c55e" },
  PARTIAL: { bg: "#fffbeb", text: "#92400e", dot: "#f59e0b" },
  PENDING: { bg: "#fef2f2", text: "#991b1b", dot: "#ef4444" },
};

const cardStyle: React.CSSProperties = {
  borderRadius: "20px",
  border: "1px solid #f1f5f9",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
  background: "#fff",
  overflow: "hidden"
};

export default function StudentsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>();

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["students", page, limit, debouncedSearch, paymentStatus],
    queryFn: () => getStudents(page, limit, debouncedSearch, paymentStatus),
    placeholderData: keepPreviousData,
  });

  const isInitialLoading = isLoading && !data;

  if (isInitialLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: "40px" }}>
        <Result
            status="error"
            title="Failed to load students"
            extra={<Button onClick={() => refetch()} type="primary" size="large" style={{ borderRadius: "10px" }}>Retry Connection</Button>}
        />
      </div>
    );
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

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
          Button: {
            borderRadius: 10,
            controlHeight: 40,
            fontWeight: 600
          },
          Input: {
            borderRadius: 10,
            controlHeight: 40
          },
          Select: {
            borderRadius: 10,
            controlHeight: 40
          }
        }
      }}
    >
      <div style={{ padding: "40px 48px", maxWidth: "1500px", margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <Title level={1} style={{ margin: 0, letterSpacing: "-0.04em", fontWeight: 900, fontSize: "32px" }}>Students</Title>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Text type="secondary" style={{ fontSize: "15px", fontWeight: 500, color: "#64748b" }}>Manage all student profiles and enrollments.</Text>
                <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#cbd5e1" }} />
                <Text style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb", background: "rgba(37, 99, 235, 0.06)", padding: "2px 8px", borderRadius: "6px" }}>
                    {total} enrolled
                </Text>
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                size="large"
                onClick={() => navigate("/students/new")}
                style={{ 
                    height: "52px", 
                    padding: "0 32px", 
                    borderRadius: "14px",
                    boxShadow: "0 10px 20px rgba(37, 99, 235, 0.22)",
                    fontSize: "15px",
                    fontWeight: 700
                }}
            >
                Register New Student
            </Button>
          </motion.div>
        </div>

        {/* FILTERS */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card style={{ ...cardStyle, marginBottom: 24 }} bodyStyle={{ padding: "24px 32px" }}>
              <Row gutter={[20, 20]} align="middle">
                <Col xs={24} md={14}>
                  <Input
                    placeholder="Search by name, enrollment no., or phone..."
                    prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}
                    allowClear
                  />
                </Col>
                <Col xs={24} md={10}>
                  <Select
                    placeholder="Filter by Status"
                    allowClear
                    style={{ width: "100%" }}
                    value={paymentStatus}
                    onChange={(v) => {
                      setPaymentStatus(v);
                      setPage(1);
                    }}
                  >
                    <Select.Option value="PAID">Completely Paid</Select.Option>
                    <Select.Option value="PARTIAL">Partially Paid</Select.Option>
                    <Select.Option value="PENDING">Payment Pending</Select.Option>
                  </Select>
                </Col>
              </Row>
            </Card>
        </motion.div>

        {/* TABLE */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
              <Table
                className="premium-table"
                rowKey="id"
                dataSource={items}
                scroll={{ x: true }}
                loading={isFetching}
                pagination={{
                  current: page,
                  pageSize: limit,
                  total: total,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50"],
                  showTotal: (t) => <Text type="secondary" style={{ fontWeight: 600 }}>Total {t} students</Text>,
                  onChange: (p, s) => {
                    setPage(p);
                    setLimit(s);
                  },
                }}
                style={{ padding: "8px 20px 20px" }}
                columns={[
                  {
                    title: "ENROLLMENT NO",
                    dataIndex: "enrollment_number",
                    key: "enrollment_number",
                    render: (v: string | null) =>
                      v ? (
                        <Text strong style={{ fontFamily: "'Inter', monospace", fontSize: "13px", color: "#64748b", background: "#f8fafc", padding: "4px 8px", borderRadius: "6px", border: "1px solid #eef2f6" }}>{v}</Text>
                      ) : (
                        <Text type="secondary">—</Text>
                      ),
                  },
                  {
                    title: "STUDENT",
                    key: "name",
                    render: (_, record) => (
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <Avatar 
                                size={40} 
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${record.name}&backgroundColor=f1f5f9,e2e8f0`}
                                style={{ border: "2px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
                            />
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <Text strong style={{ fontSize: "14.5px", color: "#1e293b", lineHeight: 1.2 }}>{record.name}</Text>
                                <Text style={{ fontSize: "12px", color: "#94a3b8" }}>{record.parent_name}</Text>
                            </div>
                        </div>
                    ),
                    sorter: (a, b) => a.name.localeCompare(b.name),
                  },
                  {
                    title: "PHONE",
                    dataIndex: "phone",
                    key: "phone",
                    render: (v) => <Text style={{ color: "#64748b" }}>{v}</Text>
                  },
                  {
                    title: "ENROLLMENTS",
                    dataIndex: "batch_count",
                    key: "batch_count",
                    align: "center" as const,
                    render: (v: number) => <Tag color={v > 0 ? "processing" : "default"} style={{ fontWeight: 700, borderRadius: "6px" }}>{v ?? 0} Batches</Tag>,
                  },
                  {
                    title: "PAYMENT STATUS",
                    dataIndex: "payment_status",
                    key: "payment_status",
                    render: (status: string | null) => {
                        if (!status) return <Text type="secondary">—</Text>;
                        const theme = PAYMENT_STATUS_COLORS[status];
                        return (
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px",
                                borderRadius: "24px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
                                background: theme.bg, color: theme.text, textTransform: "uppercase"
                            }}>
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: theme.dot }} />
                                {status}
                            </div>
                        );
                    }
                  },
                  {
                    title: "MONTHLY FEE",
                    dataIndex: "total_monthly_fee",
                    key: "total_monthly_fee",
                    render: (v: number | null) =>
                        v != null ? <Text strong style={{ color: "#0f172a" }}>₹{Number(v).toLocaleString()}</Text> : <Text type="secondary">—</Text>,
                  },
                  {
                    title: "ACTIONS",
                    key: "actions",
                    fixed: "right" as const,
                    render: (_, record) => (
                      <div style={{ textAlign: "right" }}>
                        <Space size={12}>
                          <Button
                            type="text"
                            icon={<EyeOutlined style={{ color: "#64748b" }} />}
                            onClick={() => navigate(`/students/${record.id}`)}
                            style={{ borderRadius: "8px" }}
                          />
                          <Button
                            type="text"
                            icon={<EditOutlined style={{ color: "#2563eb" }} />}
                            onClick={() => navigate(`/students/${record.id}/edit`)}
                            style={{ 
                                fontWeight: 700, 
                                color: "#2563eb",
                                background: "rgba(37, 99, 235, 0.04)",
                                borderRadius: "8px",
                                padding: "4px 12px"
                            }}
                          >
                            Edit
                          </Button>
                        </Space>
                      </div>
                    ),
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
      `}</style>
    </ConfigProvider>
  );
}

