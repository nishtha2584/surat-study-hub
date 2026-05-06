import {
  Form,
  Input,
  DatePicker,
  Button,
  notification,
  Card,
  Row,
  Col,
  Space,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStudent, getStudentById, updateStudent, type CreateStudentPayload } from "../api/students";
import { theme } from "../styles/theme";
import dayjs from "dayjs";
import axios from "axios";
import { useEffect } from "react";
import type { Student } from "../types/Student";

type StudentFormValues = {
  name: string;
  parentName: string;
  phone: string;
  email?: string;
  dob: dayjs.Dayjs;
  address: string;
};

export default function StudentFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm<StudentFormValues>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();


  // Fetch student data in edit mode
  const { data: student, isLoading } = useQuery<Student, Error>({
    queryKey: ["student", id],
    queryFn: () => getStudentById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (student) {
      form.setFieldsValue({
        name: student.name,
        parentName: student.parent_name ?? student.parentName ?? "",
        phone: student.phone,
        email: student.email ?? "",
        dob: dayjs(student.dob),
        address: student.address,
      });
    }
  }, [student, form]);

  const createMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: (newStudent) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      notification.success({ message: "Student registered successfully!" });
      // Navigate straight to enroll so receptionist can enroll immediately
      navigate(`/students/${newStudent.id}/enroll`);
    },
    onError: (err: unknown) => {
      let msg = "Could not register student";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string | string[] };
        msg = Array.isArray(data?.message) ? data.message[0] : (data?.message || msg);
      }
      notification.error({ message: "Registration Failed", description: msg });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<CreateStudentPayload>) =>
      updateStudent(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      notification.success({
        message: "Saved",
        description: "Student details have been updated."
      });
      navigate(`/students/${id}`);
    },
    onError: (err: unknown) => {
      let msg = "Could not update record";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string | string[] };
        msg = Array.isArray(data?.message) ? data.message[0] : (data?.message || msg);
      }
      notification.error({
        message: "Update Failed",
        description: msg
      });
    },
  });

  const onFinish = (values: StudentFormValues) => {
    const payload = {
      name: values.name,
      parentName: values.parentName,
      phone: values.phone,
      email: values.email,
      dob: values.dob.format("YYYY-MM-DD"),
      address: values.address,
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} type="text">
            Back
          </Button>
          <div>
            <h1 style={{ color: theme.colors.text, marginBottom: 4, marginTop: 0 }}>
              {isEdit ? "Edit Student" : "Add New Student"}
            </h1>
            <p style={{ color: theme.colors.muted, margin: 0 }}>
              {isEdit
                ? "Update student information below"
                : "Fill in the details below to register the student."}
            </p>
          </div>
        </Space>
      </div>

      {/* FORM */}
      <Card
        loading={isLoading}
        style={{
          maxWidth: 860,
          margin: "auto",
          borderRadius: theme.radius,
          borderColor: theme.colors.border,
        }}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[16, 0]}>
            {/* Student Name */}
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Student Name"
                rules={[
                  { required: true, message: "Student name is required" },
                  { min: 3, message: "Name must be at least 3 letters" },
                ]}
              >
                <Input placeholder="Enter student's full name (e.g. Rahul Sharma)" />
              </Form.Item>
            </Col>

            {/* Parent Name */}
            <Col xs={24} md={12}>
              <Form.Item
                name="parentName"
                label="Parent / Guardian Name"
                rules={[
                  { required: true, message: "Parent name is required" },
                  { min: 3, message: "Name must be at least 3 letters" },
                ]}
              >
                <Input placeholder="Father's or Mother's Name" />
              </Form.Item>
            </Col>

            {/* Phone */}
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[
                  { required: true, message: "Phone is required" },
                  { pattern: /^\d{10}$/, message: "Please enter exactly 10 digits" },
                ]}
              >
                <Input placeholder="e.g. 9876543210 (10 digits only)" maxLength={10} />
              </Form.Item>
            </Col>

            {/* Email */}
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="Email Address (Optional)"
                rules={[
                  { type: "email", message: "Enter a valid email address format" },
                ]}
              >
                <Input placeholder="student@example.com" />
              </Form.Item>
            </Col>

            {/* Date of Birth */}
            <Col xs={24} md={12}>
              <Form.Item
                name="dob"
                label="Date of Birth"
                rules={[{ required: true, message: "Date of birth is required" }]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Select birth date"
                  disabledDate={(d) => d && d.isAfter(dayjs())}
                  format="DD MMM YYYY"
                />
              </Form.Item>
            </Col>

            {/* Address */}
            <Col xs={24}>
              <Form.Item
                name="address"
                label="Complete Address"
                rules={[
                  { required: true, message: "Complete address is required" },
                  { min: 10, message: "Enter complete address (min 10 chars)" },
                ]}
              >
                <Input.TextArea rows={3} placeholder="Enter full permanent residential address" />
              </Form.Item>
            </Col>
          </Row>

          {/* ACTIONS */}
          <Row justify="end" style={{ marginTop: 8 }}>
            <Space>
              <Button onClick={() => navigate("/students")}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isPending}
                disabled={!form.isFieldsTouched(true)}
              >
                {isEdit ? "Update Student" : "Register & Enroll →"}
              </Button>
            </Space>
          </Row>
        </Form>
      </Card>
    </div>
  );
}
