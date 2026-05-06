import {
  Form,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Alert,
  Card,
  Row,
  Col,
  Spin,
  Typography,
  notification,
  ConfigProvider,
  Avatar,
  Divider,
} from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined, TeamOutlined, WalletOutlined, CalendarOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getStudentById } from "../api/students";
import { getBatches } from "../api/batches";
import { addBatches } from "../api/enrollment";
import axios from "axios";
import type { Student } from "../types/Student";

const { Text, Title } = Typography;

const cardStyle: React.CSSProperties = {
  borderRadius: "24px",
  border: "1px solid #f1f5f9",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
  background: "#fff",
  overflow: "hidden"
};

export default function AssignBatchesPage() {
  const { id: studentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ─── Watch values ───────────────────────────────────────────────────
  const selectedBatchIds: string[] = Form.useWatch("batchIds", form) ?? [];
  const paymentStatus: string = Form.useWatch("paymentStatus", form);
  Form.useWatch([], form);

  // ─── Fetch student ───────────────────────────────────────────────────
  const { data: student, isLoading: loadingStudent } = useQuery<Student>({
    queryKey: ["student", studentId],
    queryFn: () => getStudentById(studentId!),
    enabled: !!studentId,
  });

  // ─── Fetch filtered active batches ───────────────────────────────────
  const { data: batchesData, isLoading: loadingBatches } = useQuery({
    queryKey: ["batches", { standard: student?.standard, status: "ACTIVE" }],
    queryFn: () => getBatches({ standard: student?.standard || undefined, status: "ACTIVE", limit: 200 }),
    enabled: !!student?.standard,
  });

  const allFilteredBatches = batchesData?.items ?? [];

  // Exclude batches student is already in
  const availableBatches = allFilteredBatches.filter(
    b => !student?.batches?.some(sb => sb.id === b.id && !sb.left_at)
  );

  // ─── Calculate Potential Fee ─────────────────────────────────────────
  const selectedBatches = allFilteredBatches.filter((b) =>
    selectedBatchIds.includes(b.id),
  );
  const potentialFee = selectedBatches.reduce(
    (sum, b) => sum + Number(b.monthlyFee ?? 0),
    0,
  );
  const finalTotalFee = Number(student?.total_monthly_fee ?? 0) + potentialFee;

  // 🔥 Sync amountPaid if PAID
  useEffect(() => {
    if (paymentStatus === "PAID") {
      form.setFieldValue("amountPaid", finalTotalFee);
    }
  }, [paymentStatus, finalTotalFee, form]);

  // ─── Mutation ─────────────────────────────────────────────────────────
  const assignMutation = useMutation({
    mutationFn: (payload: { batchIds: string[], paymentStatus: string, amountPaid?: number, dueDate?: string }) => 
        addBatches(student!.enrollment_id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      notification.success({
        message: "Classes Assigned",
        description: `Successfully enrolled ${student?.name} into ${selectedBatchIds.length} new batches.`,
        icon: <CheckCircleOutlined style={{ color: "#10b981" }} />
      });
      navigate(`/students/${studentId}`);
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message ?? "Assignment failed";
        setErrorMsg(typeof msg === "string" ? msg : JSON.stringify(msg));
      } else {
        setErrorMsg("An unexpected error occurred during batch assignment.");
      }
    },
  });

  interface AssignmentFormValues {
    batchIds: string[];
    paymentStatus: "PAID" | "PARTIAL" | "PENDING";
    amountPaid?: number;
    dueDate?: Dayjs;
  }

  const onFinish = (values: AssignmentFormValues) => {
    setErrorMsg(null);
    assignMutation.mutate({
        batchIds: values.batchIds,
        paymentStatus: values.paymentStatus,
        amountPaid: values.amountPaid,
        dueDate: values.dueDate ? dayjs(values.dueDate).format("YYYY-MM-DD") : undefined,
    });
  };

  if (loadingStudent) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!student?.enrollment_id) {
    return (
      <div style={{ padding: "80px", textAlign: "center" }}>
        <Alert
          type="warning"
          message="Admission Required"
          description="Please complete the student's academic admission before assigning batches."
          showIcon
          action={
            <Button type="primary" onClick={() => navigate(`/students/${studentId}/enroll`)}>
              Go to Admission
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          InputNumber: { borderRadius: 12, controlHeight: 48 },
          DatePicker: { borderRadius: 12, controlHeight: 48 },
          Select: { borderRadius: 12, controlHeight: 48 },
          Button: { borderRadius: 12, controlHeight: 48, fontWeight: 700 }
        }
      }}
    >
      <div style={{ padding: "40px 48px", maxWidth: "900px", margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 40 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(`/students/${studentId}`)} 
            type="text"
            style={{ marginBottom: 16, paddingLeft: 0, color: "#64748b", fontWeight: 600 }}
          >
            Back to Student Page
          </Button>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
            <div>
                <Title level={1} style={{ margin: 0, letterSpacing: "-0.04em", fontWeight: 900, fontSize: "32px" }}>Class Assignment</Title>
                <Text type="secondary" style={{ fontSize: "15px", fontWeight: 500, color: "#64748b" }}>Step 3: Link {student.name} to specific subject batches.</Text>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", padding: "12px 20px", borderRadius: "16px", border: "1px solid #eef2f6" }}>
                <Avatar 
                    size={40} 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}&backgroundColor=2563eb`}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <Text strong style={{ fontSize: "14px", color: "#1e293b" }}>{student.name}</Text>
                    <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{student.standard} • {student.academic_year}</Text>
                </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
            <Alert
                type="error"
                message="Assignment Error"
                description={errorMsg}
                showIcon
                closable
                style={{ borderRadius: "16px" }}
            />
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card style={cardStyle} bodyStyle={{ padding: "40px" }}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ paymentStatus: "PENDING" }}
                >
                    <div style={{ marginBottom: 32 }}>
                        <Title level={4} style={{ fontWeight: 800, margin: "0 0 4px 0" }}>Batch Selection</Title>
                        <Text type="secondary">Adding batches will automatically update the student's monthly fee.</Text>
                    </div>

                    <Form.Item
                        name="batchIds"
                        label={<Text strong style={{ color: "#475569" }}>Available Classes ({student.standard})</Text>}
                        rules={[{ required: true, message: "Please select at least one batch" }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Select subject batches..."
                            loading={loadingBatches}
                            style={{ width: "100%" }}
                            optionLabelProp="label"
                            suffixIcon={<TeamOutlined style={{ color: "#94a3b8" }} />}
                        >
                            {availableBatches.map((b) => (
                                <Select.Option key={b.id} value={b.id} label={b.code}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <Text strong style={{ fontSize: "14px" }}>{b.code}</Text>
                                            <Text type="secondary" style={{ fontSize: "11px" }}>{b.subject} ({b.teacherName})</Text>
                                        </div>
                                        <Text strong style={{ color: "#2563eb" }}>₹{Number(b.monthlyFee).toLocaleString()}</Text>
                                    </div>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {selectedBatchIds.length > 0 && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ marginTop: 24 }}>
                            <div style={{ 
                                background: "#f8fafc", padding: "20px", borderRadius: "16px",
                                border: "1px solid #eef2f6", display: "flex", 
                                justifyContent: "space-between", alignItems: "center"
                            }}>
                                <div>
                                    <Text strong style={{ color: "#64748b", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em" }}>New Final Monthly Fee</Text>
                                    <div style={{ marginTop: "4px" }}>
                                        <Text style={{ fontSize: "24px", fontWeight: 900, color: "#1e293b" }}>₹{finalTotalFee.toLocaleString()}</Text>
                                        <Text type="secondary" style={{ marginLeft: "8px", fontSize: "13px" }}>/ month (+ ₹{potentialFee.toLocaleString()})</Text>
                                    </div>
                                </div>
                                <div style={{ background: "rgba(37, 99, 235, 0.05)", padding: "10px", borderRadius: "10px" }}>
                                    <WalletOutlined style={{ fontSize: "20px", color: "#2563eb" }} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <Divider style={{ margin: "40px 0" }} />

                    <div style={{ marginBottom: 32 }}>
                        <Title level={4} style={{ fontWeight: 800, margin: "0 0 4px 0" }}>Financial Settlement</Title>
                        <Text type="secondary">Update the payment status for the new final total fee.</Text>
                    </div>

                    <Row gutter={32}>
                        <Col xs={24} md={8}>
                            <Form.Item
                                name="paymentStatus"
                                label={<Text strong style={{ color: "#475569" }}>Collection Status</Text>}
                                rules={[{ required: true, message: "Required" }]}
                            >
                                <Select placeholder="Choose status">
                                    <Select.Option value="PAID">Completely Paid</Select.Option>
                                    <Select.Option value="PARTIAL">Partially Paid</Select.Option>
                                    <Select.Option value="PENDING">Full Pending</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        {(paymentStatus === "PAID" || paymentStatus === "PARTIAL") && (
                            <Col xs={24} md={8}>
                                <Form.Item
                                    name="amountPaid"
                                    label={<Text strong style={{ color: "#475569" }}>Amount Collected (₹)</Text>}
                                    rules={[
                                        { required: true, message: "Required" },
                                        { type: 'number', min: 0, message: "Cannot be negative" }
                                    ]}
                                >
                                    <InputNumber
                                        style={{ width: "100%" }}
                                        placeholder="Enter amount"
                                        min={0}
                                        max={finalTotalFee}
                                        disabled={paymentStatus === "PAID"}
                                        formatter={(v) => v ? `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "₹ 0"}
                                        parser={(v) => v ? Number(v.replace(/₹\s?|(,*)/g, "")) : 0}
                                    />
                                </Form.Item>
                            </Col>
                        )}

                        {(paymentStatus === "PARTIAL" || paymentStatus === "PENDING") && (
                            <Col xs={24} md={8}>
                                <Form.Item
                                    name="dueDate"
                                    label={<Text strong style={{ color: "#475569" }}>Payment Deadline</Text>}
                                    rules={[{ required: true, message: "Deadline date is required" }]}
                                >
                                    <DatePicker
                                        style={{ width: "100%" }}
                                        placeholder="Select date"
                                        disabledDate={(d) => d && d.isBefore(dayjs(), "day")}
                                        suffixIcon={<CalendarOutlined style={{ color: "#94a3b8" }} />}
                                    />
                                </Form.Item>
                            </Col>
                        )}
                    </Row>

                    <div style={{ marginTop: 40, display: "flex", justifyContent: "flex-end" }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={assignMutation.isPending}
                            style={{ 
                                padding: "0 48px", 
                                fontSize: "15px", 
                                background: "#0f172a",
                                borderColor: "#0f172a",
                                boxShadow: "0 8px 16px rgba(15, 23, 42, 0.15)" 
                            }}
                        >
                            Enroll in Selected Classes →
                        </Button>
                    </div>
                </Form>
            </Card>
        </motion.div>
      </div>
    </ConfigProvider>
  );
}
