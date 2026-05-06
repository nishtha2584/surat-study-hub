import { useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Form,
  Input,
  Button,
  Avatar,
  Divider,
  Tabs,
  notification,
  ConfigProvider,
  Space
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  CameraOutlined
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getMe } from "../api/auth";
import { updateProfile } from "../api/users";
import { api } from "../api/axios";
import axios from "axios";

const { Title, Text } = Typography;

const cardStyle: React.CSSProperties = {
  borderRadius: "20px",
  border: "1px solid #f1f5f9",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
  background: "#fff",
  overflow: "hidden"
};

type ProfileFormValues = {
  name: string;
  email: string;
  role: string;
};

type PasswordFormValues = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};


export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();

  Form.useWatch([], profileForm);
  Form.useWatch([], passwordForm);

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: getMe,
  });

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }
  }, [user, profileForm]);

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      notification.success({ message: "Profile updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    },
    onError: (err: unknown) => {
      let msg = "The profile change could not be saved";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string | string[] };
        msg = Array.isArray(data?.message) ? data.message[0] : (data?.message || msg);
      }
      notification.error({ message: "Update Failed", description: msg });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (values: PasswordFormValues) => {
      const res = await api.patch("/users/change-password", {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      return res.data;
    },
    onSuccess: () => {
      notification.success({ message: "Password changed successfully!" });
      passwordForm.resetFields();
    },
    onError: (err: unknown) => {
      let msg = "Please verify your current password";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string | string[] };
        msg = Array.isArray(data?.message) ? data.message[0] : (data?.message || msg);
      }
      notification.error({ message: "Change Failed", description: msg });
    },
  });

  if (isLoading) return null;

  return (
    <ConfigProvider
      theme={{
        components: {
          Tabs: {
            itemSelectedColor: "#2563eb",
            itemActiveColor: "#2563eb",
            inkBarColor: "#2563eb",
            titleFontSize: 16
          },
          Input: {
            borderRadius: 12,
            controlHeight: 48
          },
          Button: {
            borderRadius: 12,
            controlHeight: 48,
            fontWeight: 700
          }
        }
      }}
    >
      <div style={{ padding: "40px 48px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 40 }}>
          <Title level={1} style={{ margin: 0, letterSpacing: "-0.04em", fontWeight: 900, fontSize: "32px" }}>Account Settings</Title>
          <Text type="secondary" style={{ fontSize: "15px", fontWeight: 500, color: "#64748b" }}>Manage your professional profile and security preferences.</Text>
        </div>

        {/* Cover Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card variant="borderless" style={cardStyle} bodyStyle={{ padding: 0 }}>
            <div style={{ height: 180, background: "linear-gradient(225deg, #2563eb 0%, #1e40af 100%)", position: "relative" }}>
              <div style={{ position: "absolute", top: 20, right: 20 }}>
                <Button ghost icon={<CameraOutlined />} style={{ borderRadius: "10px", fontWeight: 600 }}>Update Cover</Button>
              </div>
            </div>
            <div style={{ padding: "0 40px 40px", position: "relative" }}>
              <div style={{ position: "relative", display: "inline-block", marginTop: -60 }}>
                <Avatar
                  size={120}
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}&backgroundColor=2563eb`}
                  style={{
                    border: "6px solid white",
                    backgroundColor: "#f8fafc",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.12)"
                  }}
                />
                <div style={{
                  position: "absolute", bottom: 5, right: 5,
                  background: "#fff", padding: "6px", borderRadius: "50%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: "1px solid #f1f5f9",
                  cursor: "pointer"
                }}>
                  <CameraOutlined style={{ color: "#2563eb", fontSize: "14px" }} />
                </div>
              </div>

              <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
                <div>
                  <Title level={2} style={{ margin: 0, fontWeight: 900, fontSize: "28px" }}>{user?.name}</Title>
                  <Text style={{ fontSize: "16px", color: "#64748b", fontWeight: 500 }}>{user?.email}</Text>
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px",
                  borderRadius: "12px", fontSize: "12px", fontWeight: 800, letterSpacing: "0.05em",
                  background: "rgba(37, 99, 235, 0.08)", color: "#2563eb", textTransform: "uppercase"
                }}>
                  <SafetyCertificateOutlined />
                  {user?.role} ACCESS ENABLED
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <Row gutter={[32, 32]} style={{ marginTop: 32 }}>
          <Col xs={24} lg={16}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card variant="borderless" style={cardStyle} bodyStyle={{ padding: "40px" }}>
                <Tabs defaultActiveKey="1">
                  <Tabs.TabPane tab={<Space><UserOutlined />Personal Details</Space>} key="1">
                    <Form
                      form={profileForm}
                      layout="vertical"
                      onFinish={(vals: ProfileFormValues) => updateProfileMutation.mutate(vals)}
                      style={{ marginTop: 24 }}
                    >
                      <Row gutter={24}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="Full Legal Name"
                            name="name"
                            rules={[
                              { required: true, message: "Name is required" },
                              { min: 3, message: "Min 3 characters" },
                              { pattern: /^[^\u2600-\u27BF\u1f300-\u1f64f\u1f680-\u1f6ff]*$/, message: "Emojis not allowed" }
                            ]}
                          >
                            <Input placeholder="Official Full Name" prefix={<UserOutlined style={{ color: "#94a3b8" }} />} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="Primary Email Address"
                            name="email"
                            rules={[
                              { required: true, message: "Email is required" },
                              { type: "email", message: "Enter valid email" }
                            ]}
                          >
                            <Input placeholder="your.name@studyhub.com" prefix={<MailOutlined style={{ color: "#94a3b8" }} />} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item label="System Defined Role (Non-editable)" name="role">
                        <Input disabled prefix={<SafetyCertificateOutlined style={{ color: "#94a3b8" }} />} style={{ background: "#f8fafc" }} />
                      </Form.Item>

                      <Divider style={{ margin: "32px 0" }} />
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          size="large"
                          loading={updateProfileMutation.isPending}
                          disabled={!profileForm.isFieldsTouched(true)}
                          style={{ padding: "0 40px" }}
                        >
                          Commit Changes
                        </Button>
                      </div>
                    </Form>
                  </Tabs.TabPane>

                  <Tabs.TabPane tab={<Space><LockOutlined />Security & Credentials</Space>} key="2">
                    <Form
                      form={passwordForm}
                      layout="vertical"
                      onFinish={(vals: PasswordFormValues) => changePasswordMutation.mutate(vals)}
                      style={{ marginTop: 24, maxWidth: 480 }}
                    >
                      <Form.Item
                        label="Current System Password"
                        name="oldPassword"
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <Input.Password placeholder="Confirm current authority" prefix={<LockOutlined style={{ color: "#94a3b8" }} />} />
                      </Form.Item>

                      <Form.Item
                        label="Authorized New Password"
                        name="newPassword"
                        rules={[
                          { required: true, message: "New password is required" },
                          { min: 6, message: "Min 6 characters required" }
                        ]}
                      >
                        <Input.Password placeholder="Enter high-entropy password" prefix={<LockOutlined style={{ color: "#94a3b8" }} />} />
                      </Form.Item>

                      <Form.Item
                        label="Confirm New Password"
                        name="confirmPassword"
                        dependencies={["newPassword"]}
                        rules={[
                          { required: true, message: "Check confirmation" },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                              return Promise.reject(new Error("The confirmation passwords do not match!"));
                            },
                          })
                        ]}
                      >
                        <Input.Password placeholder="Match new password" prefix={<LockOutlined style={{ color: "#94a3b8" }} />} />
                      </Form.Item>

                      <Divider style={{ margin: "32px 0" }} />
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          size="large"
                          loading={changePasswordMutation.isPending}
                          disabled={!passwordForm.isFieldsTouched(true)}
                          style={{ padding: "0 40px" }}
                        >
                          Rotate Credentials
                        </Button>
                      </div>
                    </Form>
                  </Tabs.TabPane>
                </Tabs>
              </Card>
            </motion.div>
          </Col>

          <Col xs={24} lg={8}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card variant="borderless" style={{ ...cardStyle, background: "#f8fafc" }} bodyStyle={{ padding: "32px" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "16px", background: "rgba(37, 99, 235, 0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24
                }}>
                  <SafetyCertificateOutlined style={{ fontSize: 32, color: "#2563eb" }} />
                </div>
                <Title level={4} style={{ fontWeight: 800, margin: "0 0 12px 0" }}>Security Intelligence</Title>
                <Text type="secondary" style={{ display: "block", fontSize: "14px", lineHeight: 1.6, marginBottom: 20 }}>
                  To maintain the integrity of the coaching administrative portal, we enforce high-entropy password standards. Multi-factor authentication is recommended for all top-level administrative accounts.
                </Text>
                <Divider style={{ margin: "24px 0" }} />
                <Space direction="vertical" style={{ width: "100%" }} size="middle">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text strong style={{ fontSize: "13px" }}>Login Activity</Text>
                    <Text type="secondary" style={{ fontSize: "13px" }}>Active Now</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text strong style={{ fontSize: "13px" }}>App Version</Text>
                    <Text type="secondary" style={{ fontSize: "13px" }}>v2.4.0 (Stable)</Text>
                  </div>
                </Space>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  );
}

