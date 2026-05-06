import {
  Table,
  Tag,
  Input,
  Select,
  Spin,
  Result,
  Button,
  Row,
  Col,
  Card,
  Space,
  Typography,
  ConfigProvider,
  Progress,
  notification,
  Modal,
  Form,
  DatePicker,
} from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SearchOutlined, PlusOutlined, EditOutlined, EyeOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { markTeacherAttendance } from "../api/attendance";
import dayjs from "dayjs";

import axios from "axios";
import { useBatches } from "../hooks/useBatches";
import { useDebounce } from "../hooks/useDebounce";
import { updateBatch, type Batch } from "../api/batches";
import useAuthStore from "../stores/useAuthStore";
import { theme } from "../styles/theme";

const { Option } = Select;
const { Title, Text } = Typography;

const cardStyle: React.CSSProperties = {
  borderRadius: "20px",
  border: "1px solid #f1f5f9",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
  background: "#fff",
  overflow: "hidden"
};

export default function BatchesPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState<string | undefined>();
  const [standard, setStandard] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [teacherModal, setTeacherModal] = useState<{ 
    visible: boolean; 
    batchId: string; 
    teacherName: string;
    startDate?: string;
    endDate?: string;
  }>({
    visible: false,
    batchId: "",
    teacherName: "",
  });

  const [teacherForm] = Form.useForm();
  Form.useWatch([], teacherForm);

  const debouncedSearch = useDebounce(search, 400);

  const markTeacherMutation = useMutation({
    mutationFn: (values: { status: 'PRESENT' | 'ABSENT', date: string }) => {
      return markTeacherAttendance({ 
        batchId: teacherModal.batchId, 
        date: values.date, 
        status: values.status 
      });
    },
    onSuccess: (data) => {
      notification.info({
        message: "Teacher Status Updated",
        description: data.message,
        duration: 6,
      });
      setTeacherModal({ ...teacherModal, visible: false });
    },
    onError: (err: unknown) => {
      let msg = "Attendance Logging Failed";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string | string[] };
        msg = Array.isArray(data?.message) ? data.message[0] : (data?.message || msg);
      }
      notification.error({ 
        message: "Attendance Not Saved", 
        description: msg,
        style: { borderRadius: "12px" }
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateBatch(id, { status }),
    onSuccess: () => {
      notification.success({ message: "Status Updated", placement: "topRight" });
      refetch();
    },
    onError: () => {
      notification.error({ message: "Update Failed" });
    }
  });

  const { data, isLoading, error, refetch, isFetching } = useBatches({
    page,
    limit: pageSize,
    search: debouncedSearch,
    subject,
    standard,
    status,
  });

  const isInitialLoading = isLoading && !data;

  if (isInitialLoading) {
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
          title="Failed to load batches"
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
            <Title level={1} style={{ margin: 0, letterSpacing: "-0.04em", fontWeight: 900, fontSize: "32px" }}>Batches</Title>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Text type="secondary" style={{ fontSize: "15px", fontWeight: 500, color: "#64748b" }}>Manage all active course batches and schedules.</Text>
                <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#cbd5e1" }} />
                <Text style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb", background: "rgba(37, 99, 235, 0.06)", padding: "2px 8px", borderRadius: "6px" }}>
                    {total} active batches
                </Text>
            </div>
          </div>

          {user?.role === "ADMIN" && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    size="large"
                    onClick={() => navigate("/batches/new")}
                    style={{ 
                        height: "52px", 
                        padding: "0 32px", 
                        borderRadius: "14px",
                        boxShadow: "0 10px 20px rgba(37, 99, 235, 0.22)",
                        fontSize: "15px",
                        fontWeight: 700
                    }}
                >
                    Add Batch
                </Button>
            </motion.div>
          )}
        </div>

        {/* FILTERS */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card style={{ ...cardStyle, marginBottom: 24 }} bodyStyle={{ padding: "24px 32px" }}>
              <Row gutter={[20, 20]} align="middle">
                <Col xs={24} md={10}>
                  <Input
                    placeholder="Search by batch code..."
                    prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}
                  />
                </Col>

                <Col xs={12} md={4}>
                  <Select placeholder="All Subjects" allowClear style={{ width: "100%" }} onChange={setSubject}>
                    <Option value="MATHS">Mathematics</Option>
                    <Option value="SCIENCE">Science</Option>
                    <Option value="ENGLISH">English</Option>
                    <Option value="GUJARATI">Gujarati</Option>
                    <Option value="HINDI">Hindi</Option>
                  </Select>
                </Col>

                <Col xs={12} md={4}>
                  <Select placeholder="Standard" allowClear style={{ width: "100%" }} onChange={setStandard}>
                    <Option value="EIGHT">8th Standard</Option>
                    <Option value="NINE">9th Standard</Option>
                    <Option value="TEN">10th Standard</Option>
                    <Option value="ELEVEN">11th Standard</Option>
                    <Option value="TWELVE">12th Standard</Option>
                  </Select>
                </Col>
                <Col xs={12} md={6}>
                  <Select placeholder="Status" allowClear style={{ width: "100%" }} onChange={setStatus}>
                    <Option value="ACTIVE">Currently Active</Option>
                    <Option value="COMPLETED">Successfully Completed</Option>
                    <Option value="CANCELLED">Catalogue Cancelled</Option>
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
                loading={isFetching}
                pagination={{
                  current: page,
                  pageSize: pageSize,
                  total: total,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50"],
                  onChange: (p, s) => {
                    setPage(p);
                    setPageSize(s);
                  },
                }}
                style={{ padding: "8px 20px 20px" }}
                columns={[
                  { 
                    title: "BATCH CODE", 
                    dataIndex: "code",
                    render: (text) => <Text strong style={{ color: "#2563eb" }}>{text}</Text>
                  },
                  { title: "SUBJECT", dataIndex: "subject", render: (text) => <Text style={{ fontWeight: 600, color: "#1e293b" }}>{text}</Text> },
                  { title: "STANDARD", dataIndex: "standard" },
                  { title: "TEACHER", dataIndex: "teacherName", render: (text: string) => <Text style={{ color: "#64748b" }}>{text || "Unassigned"}</Text> },

                  {
                    title: "OCCUPANCY",
                    render: (_, b) => {
                      const occupancy = (b.occupiedSeats / b.totalSeats) * 100;
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "140px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={{ fontSize: "12px", fontWeight: 700 }}>{b.occupiedSeats} / {b.totalSeats}</Text>
                            {b.availableSeats === 0 ? <Tag color="error" style={{ fontSize: "10px" }}>FULL</Tag> : occupancy > 80 ? <Tag color="warning" style={{ fontSize: "10px" }}>LIMITED</Tag> : null}
                          </div>
                          <Progress percent={occupancy} showInfo={false} size="small" strokeColor={occupancy >= 100 ? "#ef4444" : occupancy > 80 ? "#f59e0b" : "#2563eb"} trailColor="#f1f5f9" />
                        </div>
                      );
                    },
                  },

                  {
                    title: "COURSE FEE",
                    dataIndex: "monthlyFee",
                    render: (v?: number) => <Text strong style={{ color: "#0f172a" }}>{v !== undefined ? `₹${v.toLocaleString()}` : "-"}</Text>,
                  },

                    {
                    title: "STATUS",
                    dataIndex: "status",
                    render: (status: string, record: Batch) => {
                      const isAdmin = user?.role === "ADMIN";
                      
                      const styleMap: Record<string, { bg: string; text: string; dot: string }> = {
                        ACTIVE: { bg: "#f0fdf4", text: "#166534", dot: "#22c55e" },
                        COMPLETED: { bg: "#eff6ff", text: "#1e40af", dot: "#3b82f6" },
                        CANCELLED: { bg: "#fef2f2", text: "#991b1b", dot: "#ef4444" },
                      };
                      
                      const statusStyles = styleMap[status] || { bg: "#f8fafc", text: "#64748b", dot: "#cbd5e1" };

                      if (!isAdmin) {
                        return (
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px",
                            borderRadius: "24px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
                            background: statusStyles.bg, color: statusStyles.text, textTransform: "uppercase"
                          }}>
                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: statusStyles.dot }} />
                            {status}
                          </div>
                        );
                      }

                      return (
                        <Select
                          value={status}
                          variant="borderless"
                          onChange={(newStatus) => updateStatusMutation.mutate({ id: record.id, status: newStatus })}
                          loading={updateStatusMutation.isPending && updateStatusMutation.variables?.id === record.id}
                          style={{ 
                            background: statusStyles.bg, 
                            color: statusStyles.text, 
                            borderRadius: "24px",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "0 4px",
                            width: "130px",
                            textAlign: "center"
                          }}
                          className="status-inline-select"
                        >
                          <Option value="ACTIVE"><Text strong style={{ fontSize: "11px", color: "#166534" }}>ACTIVE</Text></Option>
                          <Option value="COMPLETED"><Text strong style={{ fontSize: "11px", color: "#1e40af" }}>COMPLETED</Text></Option>
                          <Option value="CANCELLED"><Text strong style={{ fontSize: "11px", color: "#991b1b" }}>CANCELLED</Text></Option>
                        </Select>
                      );
                    },
                  },

                  {
                    title: "ACTIONS",
                    render: (_, b) => (
                      <div style={{ textAlign: "right" }}>
                        <Space size={16}>
                          <Button
                            type="text"
                            icon={<EyeOutlined style={{ color: "#64748b" }} />}
                            onClick={() => navigate(`/batches/${b.id}`)}
                            style={{ borderRadius: "8px" }}
                          />

                          {user?.role === "ADMIN" && (
                            <Button
                              type="text"
                              icon={<CheckCircleOutlined style={{ color: "#10b981" }} />}
                              onClick={() => setTeacherModal({ 
                                visible: true, 
                                batchId: b.id, 
                                teacherName: b.teacherName || "Assigned Teacher",
                                startDate: b.startDate,
                                endDate: b.endDate
                              })}
                              style={{ 
                                fontWeight: 700, 
                                color: "#10b981",
                                background: "rgba(16, 185, 129, 0.04)",
                                borderRadius: "8px",
                                padding: "4px 12px"
                              }}
                            >
                                Teacher
                            </Button>
                          )}

                          {user?.role === "ADMIN" && (
                            <Button
                              type="text"
                              icon={<EditOutlined style={{ color: "#2563eb" }} />}
                              onClick={() => navigate(`/batches/${b.id}/edit`)}
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
                          )}
                        </Space>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
        </motion.div>

        {/* TEACHER ATTENDANCE MODAL */}
        <Modal
          title={
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: "14px", color: theme.colors.primary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Administrative Control</div>
              <div style={{ fontSize: "20px", fontWeight: 800 }}>Teacher Presence - {teacherModal.teacherName}</div>
            </div>
          }
          open={teacherModal.visible}
          onCancel={() => setTeacherModal({ ...teacherModal, visible: false })}
          footer={null}
          centered
          width={400}
        >
          <Form
            form={teacherForm}
            layout="vertical"
            onFinish={(vals) => markTeacherMutation.mutate({ 
              status: vals.status, 
              date: vals.date.format("YYYY-MM-DD") 
            })}
            initialValues={{ date: dayjs(), status: "PRESENT" }}
          >
            <Form.Item name="date" label={<Text strong>Session Date</Text>} rules={[{ required: true }]}>
              <DatePicker 
                style={{ width: "100%" }} 
                allowClear={false} 
                disabledDate={(current) => {
                  const today = dayjs().endOf('day');
                  if (current && current.isAfter(today)) return true;
                  
                  if (teacherModal.startDate) {
                    const start = dayjs(teacherModal.startDate).startOf('day');
                    if (current && current.isBefore(start)) return true;
                  }
                  
                  if (teacherModal.endDate) {
                    const end = dayjs(teacherModal.endDate).endOf('day');
                    if (current && current.isAfter(end)) return true;
                  }
                  
                  return false;
                }}
              />
            </Form.Item>
            <Form.Item name="status" label={<Text strong>Presence Status</Text>} rules={[{ required: true }]}>
              <Select>
                <Option value="PRESENT">Present</Option>
                <Option value="ABSENT">Absent (Auto-Sub)</Option>
              </Select>
            </Form.Item>
            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <Button style={{ flex: 1 }} onClick={() => setTeacherModal({ ...teacherModal, visible: false })}>Cancel</Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                style={{ flex: 1 }} 
                loading={markTeacherMutation.isPending}
                disabled={!teacherForm.isFieldsTouched(true)}
              >
                Commit Record
              </Button>
            </div>
          </Form>
        </Modal>
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

