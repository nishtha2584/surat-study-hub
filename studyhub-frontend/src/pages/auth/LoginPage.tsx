import { Form, Input, Button, Card, Typography, Alert, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { login as loginApi, type LoginPayload } from "../../api/auth";
import useAuthStore from "../../stores/useAuthStore";
import { useState, useEffect } from "react";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";

const { Title, Text } = Typography;

interface LoginError {
  message: string;
  lockUntil?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const loginStore = useAuthStore((s) => s.login);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lockUntil, setLockUntil] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // ⏲️ Timer logic
  useEffect(() => {
    if (!lockUntil) return;

    const interval = setInterval(() => {
      const now = dayjs().unix();
      const target = dayjs(lockUntil).unix();
      const remaining = Math.max(0, target - now);

      setTimeLeft(remaining);
      if (remaining === 0) {
        setLockUntil(null);
        setErrorMsg(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockUntil]);

  const onFinish = async (values: LoginPayload) => {
    setErrorMsg(null);
    setLockUntil(null);
    setLoading(true);
    try {
      const res = await loginApi(values);
      localStorage.setItem("refreshToken", res.refreshToken);
      loginStore(res.user, res.accessToken);
      navigate("/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data as LoginError;
        if (err.response?.status === 403 && errorData?.lockUntil) {
          setLockUntil(errorData.lockUntil);
          setErrorMsg(errorData.message);
        } else {
          setErrorMsg(errorData?.message || "Something went wrong. Please try again.");
        }
      } else {
        setErrorMsg("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      }}
    >
      <Card
        style={{
          width: 400,
          borderRadius: 16,
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          padding: "12px 0",
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <Title level={2} style={{ margin: 0, color: "#1a3353" }}>
              StudyHub
            </Title>
            <Text type="secondary">
              Welcome back! Please login to your account.
            </Text>
          </div>

          {(errorMsg || lockUntil) && (
            <Alert
              type={lockUntil ? "warning" : "error"}
              showIcon
              style={{
                borderRadius: 12,
                border: "none",
                padding: "12px 16px",
                background: lockUntil ? "#fffbe6" : "#fff1f0",
              }}
              title={
                <Text
                  strong
                  style={{ color: lockUntil ? "#d48806" : "#cf1322" }}
                >
                  {lockUntil ? "Account Temporarily Locked" : "Login Failed"}
                </Text>
              }
              description={
                <Space direction="vertical" size={2} style={{ marginTop: 4 }}>
                  <Text style={{ color: lockUntil ? "#8a6d3b" : "#cf1322" }}>
                    {errorMsg}
                  </Text>
                  {lockUntil && (
                    <Text
                      strong
                      style={{
                        color: "#d48806",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        className="pulsing-clock"
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#d48806",
                        }}
                      />
                      Retry available in: {formatTime(timeLeft)}
                    </Text>
                  )}
                </Space>
              }
            />
          )}

          <Form
            layout="vertical"
            onFinish={onFinish}
            size="large"
            autoComplete="off"
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Enter a valid email address" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="name@studyhub.com"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: "Password is required" }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="••••••••"
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 8, marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{ height: 48, borderRadius: 8 }}
              >
                Login
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
      <Text type="secondary" style={{ marginTop: 24, fontSize: 12 }}>
        © 2026 StudyHub Management System. All rights reserved.
      </Text>

      <style>{`
        .pulsing-clock {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(212, 136, 6, 0.4); }
          70% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 0 8px rgba(212, 136, 6, 0); }
          100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(212, 136, 6, 0); }
        }
      `}</style>
    </div>
  );
}
