import {
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  notification,
  Card,
  Row,
  Col,
  Spin,
  Space,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import axios from "axios";

import { theme } from "../styles/theme";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUsers } from "../api/users";
import { getBatchById, createBatch, updateBatch } from "../api/batches";

type BatchFormValues = {
  code: string;
  subject: string;
  standard: string;
  teacherId: string;
  scheduleDays: string[];
  timeSlot: string;
  totalSeats: number;
  monthlyFee: number;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  status: string;
};

export default function BatchFormPage() {
  const [form] = Form.useForm<BatchFormValues>();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const subject = Form.useWatch("subject", form);
  const standard = Form.useWatch("standard", form);
  const scheduleDays = Form.useWatch("scheduleDays", form);
  const timeSlot = Form.useWatch("timeSlot", form);
  const teacherId = Form.useWatch("teacherId", form);
  const totalSeats = Form.useWatch("totalSeats", form);
  const monthlyFee = Form.useWatch("monthlyFee", form);
  const startDate = Form.useWatch("startDate", form);
  const endDate = Form.useWatch("endDate", form);

  const isEdit = Boolean(id);

  // 🧑‍🏫 Fetch teachers
  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => getUsers("TEACHER"),
  });

  // 📦 Fetch batch details for edit
  const { data: batch, isLoading: isFetchingBatch } = useQuery({
    queryKey: ["batch", id],
    queryFn: () => getBatchById(id!),
    enabled: isEdit,
  });

  // 🪄 Auto-generate batch code
  useEffect(() => {
    if (!isEdit && subject && standard && scheduleDays?.length > 0 && timeSlot) {
      const stdMap: Record<string, string> = {
        EIGHT: "8", NINE: "9", TEN: "10", ELEVEN: "11", TWELVE: "12"
      };
      const dayMap: Record<string, string> = {
        MON: "M", TUE: "T", WED: "W", THU: "TH", FRI: "F", SAT: "S", SUN: "SU"
      };

      const sub = (subject as string).toUpperCase();
      const std = stdMap[standard as string] || (standard as string);
      const days = (scheduleDays as string[]).map(d => dayMap[d] || d).join("");

      let time = (timeSlot as string).toUpperCase().replace(/\s/g, "");
      const timeMatch = (timeSlot as string).match(/^(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        let hr = parseInt(timeMatch[1]);
        const ampm = hr >= 12 ? "PM" : "AM";
        hr = hr % 12 || 12;
        time = `${hr}${ampm}`;
      }

      form.setFieldsValue({ code: `${sub}-${std}-${days}-${time}` });
    }
  }, [subject, standard, scheduleDays, timeSlot, isEdit, form]);

  useEffect(() => {
    if (batch) {
      form.setFieldsValue({
        code: batch.code,
        subject: batch.subject,
        standard: batch.standard,
        teacherId: batch.teacherId,
        scheduleDays: Array.isArray(batch.scheduleDays)
          ? batch.scheduleDays
          : (typeof batch.scheduleDays === 'string' && batch.scheduleDays.startsWith('['))
            ? JSON.parse(batch.scheduleDays || "[]")
            : (typeof batch.scheduleDays === 'string')
              ? batch.scheduleDays.split(',').map((d: string) => d.trim()).filter(Boolean)
              : [],
        timeSlot: batch.timeSlot,
        totalSeats: batch.totalSeats,
        monthlyFee: Number(batch.monthlyFee),
        startDate: dayjs(batch.startDate),
        endDate: dayjs(batch.endDate),
        status: batch.status,
      });
    }
  }, [batch, form]);

  // 🪄 Default / Valid End Date logic
  useEffect(() => {
    if (startDate) {
      const currentEndDate = form.getFieldValue("endDate");
      // If no end date, or end date is now invalid compared to new start date
      if (!currentEndDate || currentEndDate.isBefore(startDate.add(1, 'day'), 'day')) {
        form.setFieldsValue({ endDate: startDate.add(3, "month") });
      }
    }
  }, [startDate, form]);

  const onFinish = async (values: BatchFormValues) => {
    try {
      const payload = {
        code: values.code,
        subject: values.subject,
        standard: values.standard,
        teacherId: values.teacherId,
        scheduleDays: values.scheduleDays,
        timeSlot: values.timeSlot,
        totalSeats: values.totalSeats,
        monthlyFee: values.monthlyFee,
        startDate: values.startDate.format("YYYY-MM-DD"),
        endDate: values.endDate.format("YYYY-MM-DD"),
        status: values.status || "ACTIVE",
      };

      if (isEdit && id) {
        await updateBatch(id, payload);
      } else {
        await createBatch(payload);
      }

      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["batch", id] });

      notification.success({
        message: isEdit ? "Batch updated" : "Batch created",
      });

      navigate("/batches");
    } catch (err: unknown) {
      let msg = "Failed to save batch details";
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as { message?: string | string[] };
        if (Array.isArray(responseData?.message)) {
          msg = responseData.message[0];
        } else if (typeof responseData?.message === "string") {
          msg = responseData.message;
        }
      }
      notification.error({
        message: "Submission Failed",
        description: msg,
        style: { borderRadius: "12px" }
      });
    }
  };

  if (isEdit && isFetchingBatch) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

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
        <Space size="middle" direction="vertical">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/batches")}
            type="text"
          >
            Back to List
          </Button>
          <div>
            <h1
              style={{
                color: theme.colors.text,
                marginBottom: 4,
                marginTop: 0,
              }}
            >
              {isEdit ? "Edit Batch" : "Add Batch"}
            </h1>
            <p style={{ color: theme.colors.muted, margin: 0 }}>
              Batch details
            </p>
          </div>
        </Space>
      </div>

      {/* FORM */}
      <Card
        bordered
        style={{
          maxWidth: 900,
          margin: "auto",
          borderRadius: theme.radius,
          borderColor: theme.colors.border,
        }}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="code"
                label="Batch Code"
                rules={[
                  { required: true, message: "Identification code is required" },
                ]}
              >
                <Input placeholder="Auto-generated (e.g. MATH-10-MWF-6PM)" disabled />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="subject"
                label="Subject"
                rules={[{ required: true, message: "Select a primary subject" }]}
              >
                <Select placeholder="Select subject">
                  <Select.Option value="MATHS">Mathematics</Select.Option>
                  <Select.Option value="SCIENCE">Science</Select.Option>
                  <Select.Option value="ENGLISH">English Language</Select.Option>
                  <Select.Option value="GUJARATI">Gujarati</Select.Option>
                  <Select.Option value="HINDI">Hindi</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="standard"
                label="Standard"
                rules={[{ required: true, message: "Select target standard" }]}
              >
                <Select placeholder="Select standard">
                  <Select.Option value="EIGHT">8th Standard</Select.Option>
                  <Select.Option value="NINE">9th Standard</Select.Option>
                  <Select.Option value="TEN">10th Standard</Select.Option>
                  <Select.Option value="ELEVEN">11th Standard</Select.Option>
                  <Select.Option value="TWELVE">12th Standard</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="teacherId"
                label="Teacher"
                rules={[{ required: true, message: "Assign a teacher" }]}
              >
                <Select placeholder="Select a teacher">
                  {teachers?.map((t) => (
                    <Select.Option key={t.id} value={t.id}>
                      {t.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {isEdit && (
              <Col xs={24} md={12}>
                <Form.Item
                  name="status"
                  label="Operational Status"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Select.Option value="ACTIVE">Active</Select.Option>
                    <Select.Option value="COMPLETED">Completed</Select.Option>
                    <Select.Option value="CANCELLED">Cancelled</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            )}

            <Col xs={24} md={12}>
              <Form.Item
                name="timeSlot"
                label="Time Slot"
                rules={[
                  { required: true, message: "Enter time window" },
                ]}
              >
                <Input placeholder="e.g. 18:00 - 19:30" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="scheduleDays"
                label="Batch Schedule"
                rules={[{ required: true, message: "Select active days" }]}
              >
                <Select mode="multiple" placeholder="Select working days">
                  <Select.Option value="MON">Mon</Select.Option>
                  <Select.Option value="TUE">Tue</Select.Option>
                  <Select.Option value="WED">Wed</Select.Option>
                  <Select.Option value="THU">Thu</Select.Option>
                  <Select.Option value="FRI">Fri</Select.Option>
                  <Select.Option value="SAT">Sat</Select.Option>
                  <Select.Option value="SUN">Sun</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="totalSeats"
                label="Seat Capacity"
                rules={[
                  { required: true },
                  {
                    validator: (_, value: number) =>
                      value >= 5 && value <= 100
                        ? Promise.resolve()
                        : Promise.reject("Authorized capacity: 10 - 50 seats"),
                  },
                ]}
              >
                <InputNumber min={5} max={100} style={{ width: "100%" }} placeholder="Total seats available" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="monthlyFee"
                label="Monthly Fee (₹)"
                rules={[
                  { required: true, message: "Monthly fee required" },
                  {
                    validator: (_, value: number) =>
                      value >= 250
                        ? Promise.resolve()
                        : Promise.reject("Minimum fee set to ₹250"),
                  },
                ]}
              >
                <InputNumber min={250} style={{ width: "100%" }} placeholder="Amount" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="startDate"
                label="Start Date"
                rules={[{ required: true, message: "Start date is required" }]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Select date"
                  disabledDate={(current) => current && current.isBefore(dayjs().startOf('day'))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="endDate"
                label="End Date"
                rules={[
                  { required: true, message: "End date is required" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('startDate').isBefore(value)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('End date must be after start date'));
                    },
                  }),
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Select date"
                  disabledDate={(current) => {
                    if (!startDate) return false;
                    return current && current.isBefore(startDate.add(1, 'day'), 'day');
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ACTIONS */}
          <Row justify="end" style={{ marginTop: 20 }}>
            <Button
              onClick={() => navigate("/batches")}
              style={{ marginRight: 10 }}
            >
              Cancel
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              disabled={
                !(subject && standard && teacherId && timeSlot &&
                  scheduleDays?.length > 0 && totalSeats && monthlyFee && startDate && endDate)
              }
            >
              {isEdit ? "Update Batch" : "Create Batch"}
            </Button>
          </Row>
        </Form>
      </Card>
    </div>
  );
}
