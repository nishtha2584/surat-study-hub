import { useState } from "react";
import {
  Layout,
  Menu,
  Button,
  Avatar,
  ConfigProvider,
  Dropdown,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  UserOutlined,
  SolutionOutlined,
  PieChartOutlined,
  TeamOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../stores/useAuthStore";
import { api } from "../api/axios";
import { theme } from "../styles/theme";

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  ADMIN: { bg: "#fef2f2", text: "#991b1b", dot: "#ef4444" },
  TEACHER: { bg: "#eef2ff", text: "#3730a3", dot: "#4f46e5" },
  RECEPTIONIST: { bg: "#fffbeb", text: "#92400e", dot: "#f59e0b" },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const user = useAuthStore((s) => s.user);
  const logoutStore = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await api.post("/auth/logout", { refreshToken });
    } catch (err) {
      console.log("Logout API failed", err);
    }
    logoutStore();
    navigate("/login");
  };

  const isAdmin = user?.role === "ADMIN";
  const isReceptionist = user?.role === "RECEPTIONIST";
  const isTeacher = user?.role === "TEACHER";

  const menuItems: MenuProps["items"] = [
    {
      type: "group" as const,
      label: "MAIN",
      children: [
        {
          key: "/dashboard",
          icon: <DashboardOutlined style={{ fontSize: "17px" }} />,
          label: "Dashboard",
          onClick: () => navigate("/dashboard"),
        },
      ],
    },
    ...(isAdmin || isReceptionist || isTeacher
      ? [
          {
            type: "group" as const,
            label: "CLASSES",
            children: [
              ...(isAdmin || isReceptionist
                ? [
                    {
                      key: "/batches",
                      icon: <AppstoreOutlined style={{ fontSize: "17px" }} />,
                      label: "Batches",
                      onClick: () => navigate("/batches"),
                    },
                  ]
                : []),
              ...(isTeacher
                ? [
                    {
                      key: "/my-batches",
                      icon: <SolutionOutlined style={{ fontSize: "17px" }} />,
                      label: "My Classes",
                      onClick: () => navigate("/my-batches"),
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),
    ...(isAdmin || isReceptionist
      ? [
          {
            type: "group" as const,
            label: "STUDENTS",
            children: [
              {
                key: "/students",
                icon: <UserOutlined style={{ fontSize: "17px" }} />,
                label: "Students",
                onClick: () => navigate("/students"),
              },
            ],
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            type: "group" as const,
            label: "ADMIN",
            children: [
              {
                key: "/staff",
                icon: <TeamOutlined style={{ fontSize: "17px" }} />,
                label: "Staff",
                onClick: () => navigate("/staff"),
              },
              {
                key: "/reports",
                icon: <PieChartOutlined style={{ fontSize: "17px" }} />,
                label: "Reports",
                onClick: () => navigate("/reports"),
              },
            ],
          },
        ]
      : []),
  ];

  const userMenu = {
    items: [
      {
        key: "profile",
        label: "Account Profile",
        icon: <UserOutlined />,
        onClick: () => navigate("/profile"),
      },
      { type: "divider" as const },
      {
        key: "logout",
        label: "Sign Out",
        danger: true,
        icon: <LogoutOutlined />,
        onClick: handleLogout,
      },
    ],
  };

  const roleTheme = ROLE_COLORS[user?.role || "TEACHER"];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: theme.colors.primary,
          borderRadius: theme.radius,
        },
        components: {
          Menu: {
            itemBg: "transparent",
            itemColor: "#64748b",
            itemSelectedColor: theme.colors.primary,
            itemSelectedBg: "#eff6ff",
            itemActiveBg: "#f8fafc",
            itemPaddingInline: 16,
            itemMarginInline: 12,
            itemBorderRadius: 8,
          },
        },
      }}
    >
      <Layout style={{ height: "100vh", background: "#f8fafc" }}>
        <style>{`
          .ant-menu-item { margin-top: 4px !important; margin-bottom: 4px !important; }
          .ant-menu-item-selected { 
            background: rgba(37, 99, 235, 0.08) !important; 
            color: #2563eb !important; 
            position: relative;
            font-weight: 700 !important;
          }
          .ant-menu-item-selected::after {
            content: ""; position: absolute; left: 0px; top: 15%; bottom: 15%; width: 3px;
            background: #2563eb; border-radius: 0 4px 4px 0; opacity: 1; transition: all 0.3s ease;
          }
          .ant-layout-sider-collapsed .ant-menu-item-selected::after { display: none; }
          .ant-menu-item:not(.ant-menu-item-selected):hover { background-color: #f1f5f9 !important; }
          .ant-menu-item-group-title {
            font-size: 10px !important;
            font-weight: 800 !important;
            color: #94a3b8 !important;
            letter-spacing: 0.12em !important;
            padding: 28px 24px 12px !important;
            text-transform: uppercase;
          }
          .ant-menu-item { font-weight: 500 !important; transition: all 0.2s ease !important; }
          .role-pill {
            display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px;
            border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
            text-transform: uppercase;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          .header-user-widget:hover { background: #f1f5f9; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        `}</style>

        <Sider
          width={280}
          trigger={null}
          collapsible
          collapsed={collapsed}
          breakpoint="lg"
          collapsedWidth={80}
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
            borderRight: "1px solid #eef2f6",
            zIndex: 1000,
            boxShadow: "4px 0 24px rgba(0,0,0,0.01)",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            {/* Brand Identity */}
            <div
              style={{
                padding: collapsed ? "24px 0" : "40px 32px",
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: "16px",
              }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{
                  width: "42px",
                  height: "42px",
                  background:
                    "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 16px rgba(37, 99, 235, 0.2)",
                }}
              >
                <SolutionOutlined style={{ color: "#fff", fontSize: "22px" }} />
              </motion.div>
              {!collapsed && (
                <span
                  style={{
                    fontSize: "22px",
                    fontWeight: 900,
                    color: "#0f172a",
                    letterSpacing: "-0.5px",
                  }}
                >
                  StudyHub
                </span>
              )}
            </div>

            <div style={{ flex: 1, padding: "8px 0" }}>
              <Menu
                mode="inline"
                inlineCollapsed={collapsed}
                selectedKeys={[location.pathname]}
                style={{ border: "none", background: "transparent" }}
                items={menuItems}
              />
            </div>

            <div
              style={{
                padding: "20px",
                display: "flex",
                justifyContent: collapsed ? "center" : "flex-end",
              }}
            >
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ color: "#cbd5e1", fontSize: "18px" }}
              />
            </div>
          </div>
        </Sider>

        <Layout style={{ background: "#f8fafc" }}>
          <Header
            style={{
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(12px)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 40px",
              borderBottom: "1px solid #f1f5f9",
              height: "80px",
              position: "sticky",
              top: 0,
              zIndex: 999,
            }}
          >
            <div />

            <Dropdown
              menu={userMenu}
              trigger={["click"]}
              placement="bottomRight"
            >
              <motion.div
                whileHover={{ y: -1 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  cursor: "pointer",
                  padding: "8px 16px",
                  borderRadius: "14px",
                  transition: "all 0.2s",
                }}
                className="header-user-widget"
              >
                <div
                  className="role-pill"
                  style={{
                    background: roleTheme.bg,
                    color: roleTheme.text,
                    height: "26px",
                    display: "flex",
                    alignItems: "center",
                    border: `1px solid ${roleTheme.dot}20`,
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: roleTheme.dot,
                    }}
                  />
                  {user?.role}
                </div>
                <Avatar
                  size={40}
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}&backgroundColor=f1f5f9,e2e8f0`}
                  style={{
                    border: "2px solid #fff",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Text
                  strong
                  style={{
                    fontSize: "14px",
                    color: "#1e293b",
                    fontWeight: 700,
                  }}
                >
                  {user?.name}
                </Text>
                <DownOutlined style={{ fontSize: "10px", color: "#94a3b8" }} />
              </motion.div>
            </Dropdown>
          </Header>

          <Content>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                  height: "calc(100vh - 80px)",
                  overflowY: "auto",
                  padding: "20px 0",
                }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
