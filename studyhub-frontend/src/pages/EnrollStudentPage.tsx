import type { Student } from "../types/Student";
import {
  Form,
  Select,
  Button,
  Alert,
  Card,
  Row,
  Col,
  Spin,
  Typography,
  notification,
  ConfigProvider,
} from "antd";
import { ArrowLeftOutlined, BookOutlined, CalendarOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getStudentById } from "../api/students";
import { createEnrollment } from "../api/enrollment";
import dayjs from "dayjs";
import axios from "axios";

const { Text, Title } = Typography;

const cardStyle: React.CSSProperties = {
  borderRadius: "24px",
  border: "1px solid #f1f5f9",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
  background: "#fff",
  overflow: "hidden"
};

export default function EnrollStudentPage() {
  const { id: studentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ─── Fetch student ───────────────────────────────────────────────────
  const { data: student, isLoading: loadingStudent } = useQuery<Student>({
    queryKey: ["student", studentId],
    queryFn: () => getStudentById(studentId!),
    enabled: !!studentId,
  });

  // Redirect if already enrolled in current year flow? 
  // For now, let's just allow the mutation to handle the conflict or check here
  useEffect(() => {
    if (student?.enrollment_id && !errorMsg) {
       // Optional: auto-redirect if strictly "only one time"
    }
  }, [student]);

  // ─── Mutation ─────────────────────────────────────────────────────────
  interface EnrollmentFormValues {
    standard: string;
    academicYear: string;
  }

  const enrollMutation = useMutation({
    mutationFn: createEnrollment,
    onSuccess: (enrollment) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student", studentId] }); 
      notification.success({
        message: "Admission Recorded",
        description: `Student successfully admitted for ${enrollment.academic_year}. Please select batches next.`,
        icon: <CheckCircleOutlined style={{ color: "#10b981" }} />
      });
      // STEP 3 REDIRECT
      navigate(`/students/${studentId}/assign-batches`);
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message ?? "Admission failed";
        setErrorMsg(typeof msg === "string" ? msg : JSON.stringify(msg));
      } else {
        setErrorMsg("An unexpected error occurred during the admission process.");
      }
    },
  });

  const onFinish = (values: EnrollmentFormValues) => {
    setErrorMsg(null);
    enrollMutation.mutate({
      studentId: studentId!,
      standard: values.standard,
      academicYear: values.academicYear,
      paymentStatus: "PENDING", // Default for initial admission
      dueDate: dayjs().add(7, 'days').format("YYYY-MM-DD"), // Default grace period
    });
  };

  if (loadingStudent) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Select: { borderRadius: 12, controlHeight: 48 },
          Button: { borderRadius: 12, controlHeight: 48, fontWeight: 700 }
        }
      }}
    >
      <div style={{ padding: "40px 48px", maxWidth: "800px", margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 40 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)} 
            type="text"
            style={{ marginBottom: 16, paddingLeft: 0, color: "#64748b", fontWeight: 600 }}
          >
            Cancel Admission
          </Button>
          
          <div>
            <Title level={1} style={{ margin: 0, letterSpacing: "-0.04em", fontWeight: 900, fontSize: "32px" }}>Academic Admission</Title>
            <Text type="secondary" style={{ fontSize: "15px", fontWeight: 500, color: "#64748b" }}>Specify the academic context for {student?.name}.</Text>
          </div>
        </div>

        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
            <Alert
                type="error"
                message="Admission Control"
                description={errorMsg}
                showIcon
                closable
                onClose={() => setErrorMsg(null)}
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
                >
                    <div style={{ marginBottom: 32 }}>
                        <Title level={4} style={{ fontWeight: 800, margin: "0 0 4px 0" }}>Step 2: Identity & Session</Title>
                        <Text type="secondary">Define which standard and year the student belongs to. This cannot be changed later.</Text>
                    </div>

                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="academicYear"
                                label={<Text strong style={{ color: "#475569" }}>Academic Session</Text>}
                                rules={[{ required: true, message: "Required" }]}
                            >
                                <Select placeholder="Select session" suffixIcon={<CalendarOutlined style={{ color: "#94a3b8" }} />}>
                                    <Select.Option value="2023-2024">2023-2024</Select.Option>
                                    <Select.Option value="2024-2025">2024-2025</Select.Option>
                                    <Select.Option value="2025-2026">2025-2026</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                name="standard"
                                label={<Text strong style={{ color: "#475569" }}>Target Standard</Text>}
                                rules={[{ required: true, message: "Required" }]}
                            >
                                <Select placeholder="e.g. 10th Standard" suffixIcon={<BookOutlined style={{ color: "#94a3b8" }} />}>
                                    <Select.Option value="EIGHT">8th Standard</Select.Option>
                                    <Select.Option value="NINE">9th Standard</Select.Option>
                                    <Select.Option value="TEN">10th Standard</Select.Option>
                                    <Select.Option value="ELEVEN">11th Standard</Select.Option>
                                    <Select.Option value="TWELVE">12th Standard</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ marginTop: 40, display: "flex", justifyContent: "flex-end" }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={enrollMutation.isPending}
                            style={{ 
                                padding: "0 48px", 
                                fontSize: "15px", 
                                boxShadow: "0 8px 16px rgba(37, 99, 235, 0.15)" 
                            }}
                        >
                            Proceed to Batch Selection →
                        </Button>
                    </div>
                </Form>
            </Card>
        </motion.div>
      </div>
    </ConfigProvider>
  );
}

