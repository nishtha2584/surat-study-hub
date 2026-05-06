import {
  Table,
  Button,
  Spin,
  Card,
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  Alert,
  Space,
  Tag,
  Typography,
  notification,
  Progress,
} from "antd";
import { CheckCircleOutlined, UserOutlined, CalendarOutlined } from "@ant-design/icons";
import axios from "axios";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBatchStudents, getBatchById, markAttendance, markBulkAttendance } from "../api/batches";
import { theme } from "../styles/theme";
import dayjs from "dayjs";

const { Option } = Select;
const { Text } = Typography;

export default function MyBatchStudentsPage() {
  const navigate = useNavigate();
  const { id: batchId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [attendanceModal, setAttendanceModal] = useState<{
    visible: boolean;
    studentId: string | null;
    studentName: string;
  }>({
    visible: false,
    studentId: null,
    studentName: "",
  });

  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkAttendanceData, setBulkAttendanceData] = useState<Record<string, "PRESENT" | "ABSENT" | "LATE">>({});
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());

  const [attendanceForm] = Form.useForm();
  const [isAttendanceDirty, setIsAttendanceDirty] = useState(false);
  const [isBulkDirty, setIsBulkDirty] = useState(false);

  // ── Fetch batch info (for date range constraints) ──────────────────
  const { data: batch } = useQuery({
    queryKey: ["batch", batchId],
    queryFn: () => getBatchById(batchId!),
    enabled: !!batchId,
  });

  // ── Fetch students ─────────────────────────────────────────────────
  const { data: students, isLoading } = useQuery({
    queryKey: ["batch-students", batchId],
    queryFn: () => getBatchStudents(batchId!),
    enabled: !!batchId,
  });

  // ── Date constraints for the DatePicker ───────────────────────────
  const batchStart = batch?.startDate ? dayjs(batch.startDate) : null;
  const batchEnd = batch?.endDate ? dayjs(batch.endDate) : null;
  const today = dayjs();

  const disabledDate = (current: dayjs.Dayjs) => {
    if (!current) return false;
    if (current.isAfter(today, "day")) return true;          // no future dates
    if (batchStart && current.isBefore(batchStart, "day")) return true; // before batch start
    if (batchEnd && current.isAfter(batchEnd, "day")) return true;  // after batch end
    return false;
  };

  // ── Mutation ───────────────────────────────────────────────────────
  const markAttendanceMutation = useMutation({
    mutationFn: ({
      studentId,
      date,
      status,
      note,
    }: {
      studentId: string;
      date: string;
      status: "PRESENT" | "ABSENT" | "LATE";
      note?: string;
    }) => markAttendance(batchId!, studentId, date, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batch-students", batchId] });
      setAttendanceModal({ visible: false, studentId: null, studentName: "" });
      setAttendanceError(null);
      notification.success({
        message: "Attendance Marked",
        description: `Attendance for ${attendanceModal.studentName} has been saved successfully.`,
        icon: <CheckCircleOutlined style={{ color: "#10b981" }} />,
        placement: "topRight",
        duration: 4,
        style: { borderRadius: 16 },
      });
    },
    onError: (error: unknown) => {
      let msg = "Failed to mark attendance";
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string | string[] };
        const raw = data?.message;
        msg = Array.isArray(raw) ? raw.join(" · ") : (raw ?? msg);
      }
      setAttendanceError(msg);
    },
  });

  const handleMarkAttendance = (studentId: string, studentName: string) => {
    setAttendanceModal({ visible: true, studentId, studentName });
    setAttendanceError(null);
    setIsAttendanceDirty(false);
  };

  const markBulkMutation = useMutation({
    mutationFn: (payload: {
      batchId: string;
      date: string;
      records: { studentId: string; status: "PRESENT" | "ABSENT" | "LATE" }[];
    }) => markBulkAttendance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batch-students", batchId] });
      setBulkModalVisible(false);
      notification.success({
        message: "Attendance Synchronized",
        description: "Bulk attendance has been recorded for the entire batch.",
        icon: <CheckCircleOutlined style={{ color: "#10b981" }} />,
        placement: "topRight",
      });
    },
    onError: (error: unknown) => {
      let msg = "Could not save bulk records";
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string | string[] };
        msg = Array.isArray(data?.message) ? data.message[0] : (data?.message || msg);
      }
      notification.error({
        message: "Attendance Not Saved",
        description: msg,
      });
    },
  });


  const handleOpenBulkModal = () => {
    const initial: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
    (students ?? []).forEach((s) => {
      initial[s.id] = "PRESENT"; // Default to present
    });
    setBulkAttendanceData(initial);
    setIsBulkDirty(false);
    setBulkModalVisible(true);
  };

  const handleBulkSubmit = () => {
    if (!batchId) return;
    const records = Object.entries(bulkAttendanceData).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    markBulkMutation.mutate({
      batchId,
      date: selectedDate.format("YYYY-MM-DD"),
      records,
    });
  };

  const onAttendanceSubmit = (values: {
    date: dayjs.Dayjs;
    status: "PRESENT" | "ABSENT" | "LATE";
    note?: string;
  }) => {
    if (!attendanceModal.studentId) return;

    markAttendanceMutation.mutate({
      studentId: attendanceModal.studentId,
      date: values.date.format("YYYY-MM-DD"),
      status: values.status,
      note: values.note,
    });
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const safeStudents = students ?? [];

  return (
    <div
      style={{
        padding: 24,
        background: theme.colors.background,
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <Button
          type="link"
          onClick={() => navigate("/my-batches")}
          style={{ padding: 0, marginBottom: 16 }}
        >
          ← Back to My Batches
        </Button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ marginBottom: 4, color: theme.colors.text }}>
              Batch Students
            </h1>
            <p style={{ margin: 0, color: theme.colors.muted }}>
              Manage attendance for your students
              {batch && (
                <span style={{ marginLeft: 8, fontSize: 12, color: "#94a3b8" }}>
                  · Class dates: {batch.startDate} → {batch.endDate}
                </span>
              )}
            </p>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={handleOpenBulkModal}
              style={{
                height: 44,
                borderRadius: 12,
                fontWeight: 700,
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                border: "none",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              }}
            >
              Mark Full Session
            </Button>
          </Space>
        </div>
      </div>

      {/* TABLE */}
      <Card
        style={{
          borderRadius: theme.radius,
          borderColor: theme.colors.border,
        }}
      >
        <Table
          rowKey="id"
          dataSource={safeStudents}
          scroll={{ x: true }}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "Student Name",
              dataIndex: "name",
              key: "name",
              render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span>,
            },
            {
              title: "Enrollment No.",
              dataIndex: "enrollment_number",
              key: "enrollment_number",
              render: (v: string | null) =>
                v ? (
                  <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                    {v}
                  </span>
                ) : (
                  <span style={{ color: "#aaa" }}>—</span>
                ),
            },
            {
              title: "Attendance This Month",
              dataIndex: "attendance_percentage",
              key: "attendance_percentage",
              render: (v: number | null) => {
                if (v == null) return <span style={{ color: "#aaa" }}>No sessions yet</span>;
                const pct = Math.round(v);
                const color = pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 140 }}>
                    <Progress
                      percent={pct}
                      size="small"
                      strokeColor={color}
                      showInfo={false}
                      style={{ flex: 1, margin: 0 }}
                    />
                    <Text strong style={{ color, width: 40 }}>{pct}%</Text>
                  </div>
                );
              },
            },
            {
              title: "Last Status",
              dataIndex: "last_attendance_status",
              key: "last_attendance_status",
              render: (status: string | null) =>
                status ? (
                  <Tag
                    color={
                      status === "PRESENT"
                        ? "success"
                        : status === "LATE"
                          ? "orange"
                          : "error"
                    }
                  >
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </Tag>
                ) : (
                  <span style={{ color: "#aaa" }}>—</span>
                ),
            },
            {
              title: "Actions",
              key: "actions",
              align: "center",
              render: (_, record) => (
                <Button
                  size="small"
                  type="primary"
                  onClick={() => handleMarkAttendance(record.id, record.name)}
                >
                  Mark Attendance
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {/* ATTENDANCE MODAL */}
      <Modal
        title={
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Session Logging</div>
            <div style={{ fontSize: "18px", fontWeight: 800 }}>Marking for {attendanceModal.studentName}</div>
          </div>
        }
        open={attendanceModal.visible}
        onCancel={() => {
          setAttendanceModal({ visible: false, studentId: null, studentName: "" });
          setAttendanceError(null);
        }}
        footer={null}
        centered
      >
        {attendanceError && (
          <Alert
            title={attendanceError}
            type="error"
            showIcon
            style={{ marginBottom: 24, borderRadius: 12 }}
          />
        )}

        <Form
          form={attendanceForm}
          layout="vertical"
          onFinish={onAttendanceSubmit}
          onValuesChange={() => setIsAttendanceDirty(true)}
          initialValues={{
            date: today.isAfter(batchEnd ?? today, "day") ? batchEnd : today,
            status: "PRESENT",
          }}
          requiredMark={false}
        >
          <Form.Item
            name="date"
            label={<Text strong>Session Date</Text>}
            rules={[{ required: true, message: "Date is required" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              placeholder="Select date"
              disabledDate={disabledDate}
              allowClear={false}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label={<Text strong>Observation Status</Text>}
            rules={[{ required: true, message: "Status is required" }]}
          >
            <Select placeholder="Select status">
              <Option value="PRESENT">Present</Option>
              <Option value="ABSENT">Absent</Option>
              <Option value="LATE">Late</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="note"
            label={<Text strong>Notes (Optional)</Text>}
          >
            <Input.TextArea rows={3} placeholder="Add session details or reasons for absence..." />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right", marginTop: 32 }}>
            <Space>
              <Button
                onClick={() => {
                  setAttendanceModal({ visible: false, studentId: null, studentName: "" });
                  setAttendanceError(null);
                }}
                style={{ borderRadius: 8 }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={markAttendanceMutation.isPending}
                disabled={!isAttendanceDirty}
                style={{ borderRadius: 8, fontWeight: 700 }}
              >
                Commit Record
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* BULK ATTENDANCE MODAL */}
      <Modal
        title={
          <div style={{ paddingBottom: 16, borderBottom: `1px solid ${theme.colors.border}` }}>
            <div style={{ fontSize: "14px", color: theme.colors.primary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Session Management</div>
            <div style={{ fontSize: "24px", fontWeight: 800 }}>Full Batch Attendance</div>
          </div>
        }
        open={bulkModalVisible}
        onCancel={() => setBulkModalVisible(false)}
        onOk={handleBulkSubmit}
        confirmLoading={markBulkMutation.isPending}
        width={700}
        centered
        okText="Commit All Records"
        cancelText="Discard"
        okButtonProps={{
          style: { height: 40, borderRadius: 10, fontWeight: 600, padding: "0 24px" },
          disabled: !isBulkDirty
        }}
        cancelButtonProps={{
          style: { height: 40, borderRadius: 10 }
        }}
      >
        <div style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 24, padding: 20, background: "#f8fafc", borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <Text strong style={{ display: "block", marginBottom: 8, color: "#475569" }}>Session Date</Text>
            <DatePicker
              value={selectedDate}
              onChange={(d) => {
                if (d) {
                  setSelectedDate(d);
                  setIsBulkDirty(true);
                }
              }}
              disabledDate={disabledDate}
              style={{ width: "100%", height: 45, borderRadius: 10 }}
              allowClear={false}
            />
          </div>

          <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text strong style={{ fontSize: 16 }}>Class Roster ({safeStudents.length})</Text>
            <Space>
              <Button size="small" onClick={() => {
                const updated = { ...bulkAttendanceData };
                Object.keys(updated).forEach(id => updated[id] = "PRESENT");
                setBulkAttendanceData(updated);
                setIsBulkDirty(true);
              }}>All Present</Button>
              <Button size="small" onClick={() => {
                const updated = { ...bulkAttendanceData };
                Object.keys(updated).forEach(id => updated[id] = "ABSENT");
                setBulkAttendanceData(updated);
                setIsBulkDirty(true);
              }}>All Absent</Button>
            </Space>
          </div>

          <div style={{ maxHeight: 400, overflowY: "auto", paddingRight: 8 }}>
            {safeStudents.map((student) => (
              <div
                key={student.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 16px",
                  marginBottom: 8,
                  background: "white",
                  borderRadius: 12,
                  border: `1px solid #e2e8f0`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 16, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <UserOutlined style={{ color: "#6366f1" }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{student.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{student.enrollment_number || "No ID"}</div>
                  </div>
                </div>
                <Select
                  value={bulkAttendanceData[student.id]}
                  onChange={(val) => {
                    setBulkAttendanceData({ ...bulkAttendanceData, [student.id]: val });
                    setIsBulkDirty(true);
                  }}
                  style={{ width: 120 }}
                  popupClassName="attendance-select-popup"
                >
                  <Option value="PRESENT"><Tag color="success">Present</Tag></Option>
                  <Option value="ABSENT"><Tag color="error">Absent</Tag></Option>
                  <Option value="LATE"><Tag color="orange">Late</Tag></Option>
                </Select>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
