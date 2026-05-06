import {
  Button,
  Card,
  Col,
  Row,
  Spin,
  Result,
  Space,
  Typography,
  Table,
  Divider,
  Modal,
  Form,
  Select,
  InputNumber,
  DatePicker,
  notification,
  ConfigProvider,
  Avatar,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getStudentById } from "../api/students";
import {
  updateEnrollment,
  leaveBatch,
  type EnrollmentPayload,
} from "../api/enrollment";
import dayjs, { Dayjs } from "dayjs";
import axios from "axios";
import {
  ArrowLeftOutlined,
  EditOutlined,
  PlusCircleOutlined,
  UserAddOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";

const { Title, Text } = Typography;

const PAYMENT_COLORS: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  PAID: { bg: "#f0fdf4", text: "#166534", dot: "#22c55e" },
  PARTIAL: { bg: "#fffbeb", text: "#92400e", dot: "#f59e0b" },
  PENDING: { bg: "#fef2f2", text: "#991b1b", dot: "#ef4444" },
};

const cardStyle: React.CSSProperties = {
  borderRadius: "20px",
  border: "1px solid #f1f5f9",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
  background: "#fff",
  overflow: "hidden",
};

type PaymentFormValues = {
  paymentStatus: "PAID" | "PARTIAL" | "PENDING";
  amountPaid?: number;
  dueDate?: Dayjs;
};

function standardLabel(std?: string | null) {
  const map: Record<string, string> = {
    EIGHT: "8th Standard",
    NINE: "9th Standard",
    TEN: "10th Standard",
    ELEVEN: "11th Standard",
    TWELVE: "12th Standard",
  };
  return std ? (map[std] ?? std) : "—";
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm<PaymentFormValues>();

  const {
    data: student,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["student", id],
    queryFn: () => getStudentById(id!),
    enabled: !!id,
  });

  const paymentStatusWatcher = Form.useWatch("paymentStatus", form);
  Form.useWatch([], form);

  useEffect(() => {
    if (paymentStatusWatcher === "PAID" && student) {
      form.setFieldValue("amountPaid", student.total_monthly_fee);
    }
  }, [paymentStatusWatcher, student, form]);

  const updatePaymentMutation = useMutation({
    mutationFn: (values: Partial<EnrollmentPayload>) =>
      updateEnrollment(student!.enrollment_id!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      notification.success({
        message: "Financial records updated successfully",
      });
      setIsModalOpen(false);
    },
    onError: (err: unknown) => {
      let msg = "Failed to synchronize payment records";
      if (axios.isAxiosError(err)) {
        msg = (err.response?.data as { message: string })?.message || msg;
      }
      notification.error({ message: msg });
    },
  });

  const leaveBatchMutation = useMutation({
    mutationFn: (batchId: string) =>
      leaveBatch(student!.enrollment_id!, batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      notification.success({ message: "Assignment terminated successfully" });
    },
    onError: (err: unknown) => {
      let msg = "Failed to terminate batch assignment";
      if (axios.isAxiosError(err)) {
        msg = (err.response?.data as { message: string })?.message || msg;
      }
      notification.error({ message: msg });
    },
  });

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <Result
        status="404"
        title="Portfolio Not Found"
        subTitle="The student identity you're looking for does not exist."
        extra={
          <Button onClick={() => navigate("/students")} type="primary">
            Return to Directory
          </Button>
        }
      />
    );
  }

  const s = student;

  const handleUpdatePayment = (values: PaymentFormValues) => {
    updatePaymentMutation.mutate({
      paymentStatus: values.paymentStatus,
      amountPaid: values.amountPaid,
      dueDate: values.dueDate ? dayjs(values.dueDate).toISOString() : undefined,
    });
  };

  const confirmLeaveBatch = (batchId: string, batchCode: string) => {
    Modal.confirm({
      title: "Confirm Withdrawal",
      content: `This will remove the student from ${batchCode} and trigger a fee recalculation. Proceed?`,
      okText: "Withdraw",
      okType: "danger",
      okButtonProps: { style: { borderRadius: "8px", fontWeight: 700 } },
      cancelButtonProps: { style: { borderRadius: "8px" } },
      onOk: () => leaveBatchMutation.mutate(batchId),
    });
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Button: { borderRadius: 10, fontWeight: 700, controlHeight: 40 },
          Table: {
            headerBg: "#f8fafc",
            headerColor: "#475569",
            headerBorderRadius: 10,
          },
          Modal: { borderRadiusLG: 20 },
        },
      }}
    >
      <div
        style={{ padding: "40px 48px", maxWidth: "1500px", margin: "0 auto" }}
      >
        {/* HEADER */}
        <div
          style={{
            marginBottom: 40,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          <div>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/students")}
              type="text"
              style={{
                marginBottom: 16,
                paddingLeft: 0,
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              Back to Student Directory
            </Button>
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}
            >
              <Avatar
                size={72}
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${s.name}&backgroundColor=2563eb`}
                style={{
                  border: "4px solid #fff",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                }}
              />
              <div>
                <Title
                  level={1}
                  style={{
                    margin: 0,
                    letterSpacing: "-0.04em",
                    fontWeight: 900,
                    fontSize: "32px",
                  }}
                >
                  {s.name}
                </Title>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginTop: "4px",
                  }}
                >
                  <Text
                    strong
                    style={{
                      fontFamily: "'Inter', monospace",
                      color: "#64748b",
                      background: "#f1f5f9",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  >
                    {s.enrollment_number || "PENDING ENROLLMENT"}
                  </Text>
                  <div
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      background: "#cbd5e1",
                    }}
                  />
                  <Text
                    strong
                    style={{
                      color: "#2563eb",
                      background: "rgba(37, 99, 235, 0.05)",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  >
                    {standardLabel(s.standard)}{" "}
                    {s.academic_year ? `(${s.academic_year})` : ""}
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <Space size={12}>
            <motion.div whileHover={{ scale: 1.02 }}>
              <Button
                icon={<EditOutlined style={{ color: "#2563eb" }} />}
                onClick={() => navigate(`/students/${id}/edit`)}
                style={{ height: "48px", padding: "0 24px" }}
              >
                Edit Profile
              </Button>
            </motion.div>
            {s.enrollment_id && (
              <>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Button
                    icon={<CreditCardOutlined style={{ color: "#0f172a" }} />}
                    onClick={() => {
                      form.setFieldsValue({
                        paymentStatus: s.payment_status || undefined,
                        amountPaid: Number(s.amount_paid) || undefined,
                        dueDate: s.due_date ? dayjs(s.due_date) : undefined,
                      });
                      setIsModalOpen(true);
                    }}
                    style={{ height: "48px", padding: "0 24px" }}
                  >
                    Update Payment
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Button
                    type="primary"
                    icon={<PlusCircleOutlined />}
                    onClick={() => navigate(`/students/${id}/assign-batches`)}
                    style={{
                      height: "48px",
                      padding: "0 24px",
                      background: "#0f172a",
                      borderColor: "#0f172a",
                      boxShadow: "0 8px 16px rgba(15, 23, 42, 0.15)",
                    }}
                  >
                    Assign Classes
                  </Button>
                </motion.div>
              </>
            )}
            {!s.enrollment_id && (
              <motion.div whileHover={{ scale: 1.02 }}>
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={() => navigate(`/students/${id}/enroll`)}
                  style={{
                    height: "48px",
                    padding: "0 24px",
                    boxShadow: "0 8px 16px rgba(37, 99, 235, 0.15)",
                  }}
                >
                  Process Admission →
                </Button>
              </motion.div>
            )}
          </Space>
        </div>

        <Row gutter={[32, 32]}>
          {/* LEFT COLUMN: Personal Info */}
          <Col xs={24} lg={8}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card
                title={
                  <Space style={{ fontWeight: 800 }}>
                    <UserOutlined style={{ color: "#2563eb" }} /> Identity
                    Portfolio
                  </Space>
                }
                style={cardStyle}
                bodyStyle={{ padding: "32px" }}
              >
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                  <div>
                    <Text
                      strong
                      style={{
                        color: "#64748b",
                        textTransform: "uppercase",
                        fontSize: "11px",
                        letterSpacing: "0.05em",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Primary Guardian
                    </Text>
                    <Text strong style={{ fontSize: "16px", color: "#1e293b" }}>
                      {s.parent_name}
                    </Text>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PhoneOutlined style={{ color: "#94a3b8" }} />
                      </div>
                      <Text style={{ color: "#475569", fontWeight: 600 }}>
                        {s.phone}
                      </Text>
                    </div>
                    {s.email && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: "#f8fafc",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MailOutlined style={{ color: "#94a3b8" }} />
                        </div>
                        <Text style={{ color: "#475569", fontWeight: 600 }}>
                          {s.email}
                        </Text>
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CalendarOutlined style={{ color: "#94a3b8" }} />
                      </div>
                      <Text style={{ color: "#475569", fontWeight: 600 }}>
                        Born: {dayjs(s.dob).format("DD MMM YYYY")}
                      </Text>
                    </div>
                  </div>

                  <Divider style={{ margin: "4px 0" }} />

                  <div>
                    <Text
                      strong
                      style={{
                        color: "#64748b",
                        textTransform: "uppercase",
                        fontSize: "11px",
                        letterSpacing: "0.05em",
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      Residential Context
                    </Text>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <HomeOutlined
                        style={{ marginTop: 4, color: "#94a3b8" }}
                      />
                      <Text
                        italic
                        style={{ color: "#475569", lineHeight: 1.6 }}
                      >
                        {s.address}
                      </Text>
                    </div>
                  </div>
                </Space>
              </Card>
            </motion.div>
          </Col>

          {/* RIGHT COLUMN: Enrollment & Batches */}
          <Col xs={24} lg={16}>
            <Space direction="vertical" size={32} style={{ width: "100%" }}>
              {/* Enrollment Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card
                  title={
                    <Space style={{ fontWeight: 800 }}>
                      <SafetyCertificateOutlined style={{ color: "#10b981" }} />{" "}
                      Financial Status
                    </Space>
                  }
                  style={cardStyle}
                  bodyStyle={{ padding: "32px" }}
                  extra={
                    s.payment_status && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 16px",
                          borderRadius: "24px",
                          fontSize: "11px",
                          fontWeight: 800,
                          letterSpacing: "0.05em",
                          background: PAYMENT_COLORS[s.payment_status].bg,
                          color: PAYMENT_COLORS[s.payment_status].text,
                          textTransform: "uppercase",
                        }}
                      >
                        <div
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: PAYMENT_COLORS[s.payment_status].dot,
                          }}
                        />
                        {s.payment_status}
                      </div>
                    )
                  }
                >
                  {s.enrollment_number ? (
                    <Row gutter={40}>
                      {[
                        {
                          title: "Total Monthly Fee",
                          value: `₹${Number(s.total_monthly_fee || 0).toLocaleString()}`,
                          color: "#0f172a",
                        },
                        {
                          title: "Settled Credit",
                          value: `₹${Number(s.amount_paid || 0).toLocaleString()}`,
                          color: "#166534",
                        },
                        {
                          title: "Target Due Date",
                          value:
                            s.payment_status === "PAID"
                              ? "SETTLED"
                              : s.due_date
                                ? dayjs(s.due_date).format("DD MMM YYYY")
                                : "NOT SPECIFIED",
                          color:
                            s.payment_status === "PAID" ? "#166534" : "#ef4444",
                        },
                      ].map((stat, i) => (
                        <Col span={8} key={i}>
                          <div
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <Text
                              strong
                              style={{
                                color: "#94a3b8",
                                fontSize: "11px",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: "8px",
                              }}
                            >
                              {stat.title}
                            </Text>
                            <Text
                              style={{
                                fontSize: "20px",
                                fontWeight: 900,
                                color: stat.color,
                              }}
                            >
                              {stat.value}
                            </Text>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                      <Text
                        type="secondary"
                        style={{ display: "block", marginBottom: "20px" }}
                      >
                        This student has no active academic enrollments.
                      </Text>
                      <Button
                        type="primary"
                        size="large"
                        onClick={() => navigate(`/students/${id}/enroll`)}
                        style={{ padding: "0 40px" }}
                      >
                        Initiate Enrollment
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>

              {/* Batches Table */}
              {s.enrollment_number && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card
                    title={
                      <Space style={{ fontWeight: 800 }}>
                        <TeamOutlined style={{ color: "#2563eb" }} /> Assigned
                        Batches
                      </Space>
                    }
                    style={cardStyle}
                    bodyStyle={{ padding: 0 }}
                    extra={
                      <Text type="secondary" style={{ fontWeight: 600 }}>
                        {s.batches?.length || 0} Batches Active
                      </Text>
                    }
                  >
                    <Table
                      className="premium-table"
                      dataSource={s.batches}
                      rowKey="id"
                      pagination={false}
                      columns={[
                        {
                          title: "BATCH CODE",
                          dataIndex: "code",
                          key: "code",
                          render: (text) => (
                            <Text strong style={{ color: "#2563eb" }}>
                              {text}
                            </Text>
                          ),
                        },
                        {
                          title: "SUBJECT",
                          dataIndex: "subject",
                          key: "subject",
                          render: (v) => <Text strong>{v}</Text>,
                        },
                        {
                          title: "Teacher Name",
                          dataIndex: "teacher_name",
                          key: "teacher_name",
                          render: (name) =>
                            name || <Text type="secondary">Unassigned</Text>,
                        },
                        {
                          title: "Scheduled Days",
                          dataIndex: "time_slot",
                          key: "time_slot",
                          render: (time, record) => (
                            <div>
                              <Text
                                strong
                                style={{ display: "block", fontSize: "13px" }}
                              >
                                {time}
                              </Text>
                              <Text
                                type="secondary"
                                style={{ fontSize: "11px", fontWeight: 700 }}
                              >
                                {record.scheduleDays}
                              </Text>
                            </div>
                          ),
                        },
                      ]}
                    />
                  </Card>
                </motion.div>
              )}
            </Space>
          </Col>
        </Row>

        {/* ── UPDATE PAYMENT MODAL ── */}
        <Modal
          title={
            <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
              Financial Ledger Adjustment
            </Title>
          }
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          width={500}
          centered
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdatePayment}
            style={{ marginTop: 24 }}
          >
            <Form.Item
              name="paymentStatus"
              label={<Text strong>Collection Tier Override</Text>}
              rules={[{ required: true, message: "Select target status" }]}
            >
              <Select placeholder="Specify new status">
                <Select.Option value="PAID">Completely Paid</Select.Option>
                <Select.Option value="PARTIAL">Partially Paid</Select.Option>
                <Select.Option value="PENDING">Payment Pending</Select.Option>
              </Select>
            </Form.Item>

            {(paymentStatusWatcher === "PAID" ||
              paymentStatusWatcher === "PARTIAL") && (
              <Form.Item
                name="amountPaid"
                label={<Text strong>Received Amount (₹)</Text>}
                rules={[{ required: true, message: "Amount is required" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Enter amount collected"
                  min={0}
                  max={Number(s.total_monthly_fee || 0)}
                  disabled={paymentStatusWatcher === "PAID"}
                  formatter={(v) =>
                    `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(v) => Number(v!.replace(/₹\s?|(,*)/g, ""))}
                />
              </Form.Item>
            )}

            {(paymentStatusWatcher === "PARTIAL" ||
              paymentStatusWatcher === "PENDING") && (
              <Form.Item
                name="dueDate"
                label={<Text strong>Extended Collection Deadline</Text>}
                rules={[{ required: true, message: "Deadline is required" }]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Select extension date"
                  disabledDate={(d) => d && d.isBefore(dayjs(), "day")}
                  suffixIcon={<CalendarOutlined style={{ color: "#94a3b8" }} />}
                />
              </Form.Item>
            )}

            <div
              style={{
                marginTop: 40,
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <Button
                onClick={() => setIsModalOpen(false)}
                style={{ padding: "0 24px" }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={updatePaymentMutation.isPending}
                disabled={!form.isFieldsTouched(true)}
                style={{
                  padding: "0 32px",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)",
                }}
              >
                Sync Records
              </Button>
            </div>
          </Form>
        </Modal>
      </div>

      <style>{`
        .ant-table-thead > tr > th {
            font-size: 11px !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            color: #64748b !important;
            padding: 16px !important;
        }
        .premium-table .ant-table-row { 
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important; 
        }
        .premium-table .ant-table-row:hover { 
            background-color: #f8fafc !important; 
        }
      `}</style>
    </ConfigProvider>
  );
}
