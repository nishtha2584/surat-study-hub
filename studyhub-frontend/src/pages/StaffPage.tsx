import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
    Table, Card, Button, Input, Modal, Form,
    Typography, message,
    Avatar, ConfigProvider, Segmented,
    Dropdown, Space
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
    PlusOutlined, SearchOutlined, EditOutlined,
    DeleteOutlined, LockOutlined, UnlockOutlined,
    KeyOutlined, SafetyCertificateOutlined,
    TeamOutlined, CustomerServiceOutlined,
    MoreOutlined
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import {
    getUsers,
    createUser,
    type CreateUserPayload,
    updateUserAdmin,
    deleteUser,
    lockUser,
    unlockUser,
    resetPassword
} from "../api/users";
import { UserRole } from "../types/User";
import { theme } from "../styles/theme";

const { Title, Text, Paragraph } = Typography;

// --- Interfaces ---
interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    is_locked: boolean;
    created_at: string;
}

// --- Custom Styled Components ---
const cardStyle: React.CSSProperties = {
    borderRadius: "20px",
    border: "1px solid #f1f5f9",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
    background: "#fff",
    overflow: "hidden"
};

const headerActionStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
    gap: "16px",
    flexWrap: "wrap"
};

const statusBadgeStyle = (isLocked: boolean): React.CSSProperties => ({
    borderRadius: "24px",
    padding: "4px 12px",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid transparent",
    background: isLocked ? "#fef2f2" : "#f0fdf4",
    color: isLocked ? "#991b1b" : "#166534",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
});

const dotStyle = (isLocked: boolean): React.CSSProperties => ({
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: isLocked ? "#ef4444" : "#22c55e",
    boxShadow: isLocked ? "0 0 8px #fecaca" : "0 0 8px #bbf7d0"
});

const ROLE_THEMES: Record<UserRole, { bg: string; text: string; dot: string }> = {
    ADMIN: { bg: "#fef2f2", text: "#991b1b", dot: "#ef4444" },
    TEACHER: { bg: "#eef2ff", text: "#3730a3", dot: "#4f46e5" },
    RECEPTIONIST: { bg: "#fffbeb", text: "#92400e", dot: "#f59e0b" },
};

interface AddEditStaffValues {
    name: string;
    email: string;
    password?: string;
}

interface ResetPasswordValues {
    newPassword: string;
}



export default function StaffPage() {
    const [activeRole, setActiveRole] = useState<UserRole>("TEACHER");
    const [users, setUsers] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<StaffMember | null>(null);
    const [form] = Form.useForm<AddEditStaffValues>();
    const [resetForm] = Form.useForm<ResetPasswordValues>();

    const [isDirty, setIsDirty] = useState(false);
    const [isResetDirty, setIsResetDirty] = useState(false);



    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await getUsers(activeRole);
            setUsers(data as StaffMember[]);
        } catch (error) {
            message.error(`Failed to fetch ${activeRole.toLowerCase()}s`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [activeRole]);

    const handleAddEdit = async (values: AddEditStaffValues) => {
        try {
            if (editingUser) {
                await updateUserAdmin(editingUser.id, values);
                message.success({ content: "Profile updated successfully", icon: <SafetyCertificateOutlined style={{ color: "#52c41a" }} /> });
            } else {
                await createUser({ ...values, role: activeRole } as CreateUserPayload);
                message.success(`${activeRole.toLowerCase()} registered successfully`);
            }
            setIsModalOpen(false);
            form.resetFields();
            setIsDirty(false);
            fetchUsers();
        } catch (error: unknown) {
            let msg = "The requested change could not be saved";
            if (axios.isAxiosError(error)) {
                const data = error.response?.data as { message?: string | string[] };
                msg = Array.isArray(data?.message) ? data.message[0] : (data?.message || msg);
            }
            message.error({ content: msg, style: { marginTop: '10vh' } });
        }
    };

    const handleDelete = (member: StaffMember) => {
        Modal.confirm({
            title: <Text strong style={{ fontSize: "16px" }}>Remove Staff Member</Text>,
            icon: <DeleteOutlined style={{ color: "#ff4d4f" }} />,
            content: (
                <Paragraph style={{ marginTop: "12px" }}>
                    Are you sure you want to remove <Text strong>{member.name}</Text>? This action will revoke their access immediately.
                </Paragraph>
            ),
            okText: "Yes, Remove",
            okType: "danger",
            cancelText: "Cancel",
            centered: true,
            maskClosable: true,
            okButtonProps: { style: { borderRadius: "10px" } },
            cancelButtonProps: { style: { borderRadius: "10px" } },
            onOk: async () => {
                try {
                    await deleteUser(member.id);
                    message.success("Removed successfully");
                    fetchUsers();
                } catch (error) {
                    message.error("Failed to delete user");
                }
            }
        });
    };

    const handleToggleLock = async (user: StaffMember) => {
        try {
            if (user.is_locked) {
                await unlockUser(user.id);
                message.success("Access restored");
            } else {
                await lockUser(user.id);
                message.warning("Access suspended");
            }
            fetchUsers();
        } catch (error) {
            message.error("Action failed");
        }
    };

    const handleResetPassword = async (values: ResetPasswordValues) => {
        try {
            if (!editingUser) return;
            await resetPassword(editingUser.id, values);
            message.success("Password reset successfully");
            setIsResetModalOpen(false);
            resetForm.resetFields();
            setIsResetDirty(false);
        } catch (error: unknown) {
            let msg = "Security update failed";
            if (axios.isAxiosError(error)) {
                const data = error.response?.data as { message?: string | string[] };
                msg = Array.isArray(data?.message) ? data.message[0] : (data?.message || msg);
            }
            message.error(msg);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            u.name.toLowerCase().includes(searchText.toLowerCase()) ||
            u.email.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [users, searchText]);

    const columns: ColumnsType<StaffMember> = [
        {
            title: "NAME",
            key: "user",
            render: (_, record) => (
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <Avatar
                        size={44}
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${record.name}&backgroundColor=f1f5f9,e2e8f0&fontFamily=Arial&fontWeight=600`}
                        style={{ border: "2px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", background: "#fff" }}
                    />
                    <Text strong style={{ fontSize: "14.5px", color: theme.colors.text }}>{record.name}</Text>
                </div>
            )
        },
        {
            title: "ASSIGNED ROLE",
            key: "role",
            render: (_, record) => {
                const roleTheme = ROLE_THEMES[record.role] || ROLE_THEMES.TEACHER;
                return (
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px",
                        borderRadius: "24px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
                        background: roleTheme.bg, color: roleTheme.text, textTransform: "uppercase",
                        border: `1px solid ${roleTheme.dot}10`
                    }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: roleTheme.dot }} />
                        {record.role}
                    </div>
                );
            }
        },
        {
            title: "EMAIL ADDRESS",
            dataIndex: "email",
            key: "email",
            render: (email: string) => (
                <Text style={{ color: "#64748b", fontSize: "14px" }}>{email}</Text>
            )
        },
        {
            title: "STATUS",
            key: "status",
            render: (_, record) => (
                <div style={statusBadgeStyle(record.is_locked)}>
                    <div style={dotStyle(record.is_locked)} />
                    {record.is_locked ? "SUSPENDED" : "ACTIVE"}
                </div>
            )
        },
        {
            title: "ACTIONS",
            key: "actions",
            render: (_, record) => (
                <div style={{ textAlign: "center" }}>
                    <Space size={16}>
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined style={{ color: "#2563eb", fontSize: "14px" }} />}
                            onClick={() => {
                                setEditingUser(record);
                                form.setFieldsValue(record);
                                setIsDirty(false);
                                setIsModalOpen(true);
                            }}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontWeight: 700,
                                color: "#2563eb",
                                padding: "4px 12px",
                                borderRadius: "8px",
                                background: "rgba(37, 99, 235, 0.04)"
                            }}
                        >
                            Edit
                        </Button>
                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        key: 'lock',
                                        label: record.is_locked ? 'Restore Access' : 'Suspend Access',
                                        icon: record.is_locked ? <UnlockOutlined /> : <LockOutlined />,
                                        danger: !record.is_locked,
                                        onClick: () => handleToggleLock(record)
                                    },
                                    {
                                        key: 'reset',
                                        label: 'Reset Password',
                                        icon: <KeyOutlined />,
                                        onClick: () => {
                                            setEditingUser(record);
                                            setIsResetDirty(false);
                                            setIsResetModalOpen(true);
                                        }
                                    },
                                    { type: 'divider' as const },
                                    {
                                        key: 'delete',
                                        label: 'Remove from Staff',
                                        danger: true,
                                        icon: <DeleteOutlined />,
                                        onClick: () => handleDelete(record)
                                    }
                                ]
                            }}
                            trigger={['click']}
                        >
                            <Button
                                type="text"
                                icon={<MoreOutlined style={{ color: "#94a3b8", fontSize: "18px" }} />}
                                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                            />
                        </Dropdown>
                    </Space>
                </div>
            )
        }
    ];

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
                    Segmented: {
                        itemSelectedBg: "#fff",
                        itemSelectedColor: "#2563eb",
                        borderRadius: 12,
                        controlHeight: 44,
                        itemActiveBg: "#fff"
                    }
                }
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ padding: "40px 64px", maxWidth: "1500px", margin: "0 auto" }}
            >
                {/* Header Section */}
                <div style={headerActionStyle}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <Title level={1} style={{ margin: 0, letterSpacing: "-0.04em", fontWeight: 900, fontSize: "32px" }}>Staff Management</Title>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Text type="secondary" style={{ fontSize: "15px", fontWeight: 500, color: "#64748b" }}>Manage, monitor and control directory permissions.</Text>
                            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#cbd5e1" }} />
                            <Text style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb", background: "rgba(37, 99, 235, 0.06)", padding: "2px 8px", borderRadius: "6px" }}>
                                {filteredUsers.length} total members
                            </Text>
                        </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            onClick={() => {
                                setEditingUser(null);
                                form.resetFields();
                                setIsModalOpen(true);
                            }}
                            style={{
                                height: "52px",
                                padding: "0 32px",
                                borderRadius: "14px",
                                boxShadow: "0 10px 20px rgba(37, 99, 235, 0.22)",
                                fontSize: "15px",
                                fontWeight: 700
                            }}
                        >
                            Add New {activeRole === 'TEACHER' ? 'Teacher' : 'Receptionist'}
                        </Button>
                    </motion.div>
                </div>

                {/* Main Content Card */}
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }}>
                    <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
                        <div style={{ padding: "28px 32px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
                            <Segmented
                                value={activeRole}
                                onChange={(val) => setActiveRole(val as UserRole)}
                                options={[
                                    { label: "Teachers", value: "TEACHER", icon: <TeamOutlined /> },
                                    { label: "Receptionists", value: "RECEPTIONIST", icon: <CustomerServiceOutlined /> }
                                ]}
                                className="premium-segmented"
                                style={{ padding: "6px", background: "#f1f5f9", fontWeight: 700 }}
                            />

                            <Input
                                placeholder={`Search ${activeRole.toLowerCase()}s...`}
                                prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                                style={{ maxWidth: "360px", background: "#f8fafc", border: "1px solid #eef2f6" }}
                                onChange={(e) => setSearchText(e.target.value)}
                                value={searchText}
                                allowClear
                            />
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeRole}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                <Table
                                    columns={columns}
                                    dataSource={filteredUsers}
                                    loading={loading}
                                    rowKey="id"
                                    pagination={{
                                        pageSize: 8,
                                        showTotal: (total) => <Text type="secondary" style={{ fontWeight: 600 }}>Total {total} members</Text>
                                    }}
                                    style={{ padding: "8px 20px 20px" }}
                                    className="premium-table"
                                    onRow={() => ({
                                        style: { opacity: 1 },
                                    })}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </Card>
                </motion.div>

                {/* ... Modals (keep same) ... */}
                <Modal
                    title={<Title level={4} style={{ margin: 0, fontWeight: 800 }}>{editingUser ? "Edit Profile" : "Create Account"}</Title>}
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    footer={null}
                    destroyOnHidden
                    centered
                    width={480}
                    style={{ borderRadius: "20px" }}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleAddEdit}
                        onValuesChange={() => setIsDirty(true)}
                        requiredMark={false}
                        style={{ marginTop: "24px" }}
                    >
                        <Form.Item
                            name="name"
                            label={<Text strong style={{ color: "#475569" }}>Full Name</Text>}
                            rules={[
                                { required: true, message: "Name is required" },
                                { min: 3, message: "Name must be at least 3 characters" },
                            ]}
                        >
                            <Input placeholder="e.g. Elena Smith" style={{ borderRadius: "10px" }} />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label={<Text strong style={{ color: "#475569" }}>Email Address</Text>}
                            rules={[
                                { required: true, message: "Email is required" },
                                { type: "email", message: "Please enter a valid email format" }
                            ]}
                        >
                            <Input placeholder="elena@studyhub.com" style={{ borderRadius: "10px" }} />
                        </Form.Item>

                        {!editingUser && (
                            <Form.Item
                                name="password"
                                label={<Text strong style={{ color: "#475569" }}>Initial Password</Text>}
                                rules={[
                                    { required: true, message: "Password is required" },
                                    { min: 6, message: "Minimum 6 characters needed" }
                                ]}
                            >
                                <Input.Password placeholder="Create a secure password" style={{ borderRadius: "10px" }} />
                            </Form.Item>
                        )}

                        <div style={{ marginTop: "32px", display: "flex", gap: "16px" }}>
                            <Button style={{ flex: 1, height: "48px", borderRadius: "12px" }} onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button
                                type="primary"
                                style={{ flex: 1, height: "48px", borderRadius: "12px", fontWeight: 700 }}
                                htmlType="submit"
                                disabled={!isDirty}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </Form>
                </Modal>

                <Modal
                    title={<span style={{ fontWeight: 800 }}>Account Security</span>}
                    open={isResetModalOpen}
                    onCancel={() => setIsResetModalOpen(false)}
                    footer={[
                        <Button key="can" style={{ borderRadius: "10px" }} onClick={() => setIsResetModalOpen(false)}>Cancel</Button>,
                        <Button
                            key="sub"
                            type="primary"
                            danger
                            style={{ borderRadius: "10px", fontWeight: 700 }}
                            onClick={() => resetForm.submit()}
                            disabled={!isResetDirty}
                        >
                            Reset Password
                        </Button>
                    ]}
                    centered
                >
                    <div style={{ background: "#fef2f2", padding: "16px", borderRadius: "12px", marginBottom: "24px", border: "1px solid #fee2e2" }}>
                        <Text type="danger" style={{ fontWeight: 600 }}>Security Warning: This will immediately change the password for {editingUser?.name}.</Text>
                    </div>
                    <Form
                        form={resetForm}
                        layout="vertical"
                        onFinish={handleResetPassword}
                        onValuesChange={() => setIsResetDirty(true)}
                    >
                        <Form.Item
                            name="newPassword"
                            label={<Text strong>New Access Key</Text>}
                            rules={[
                                { required: true, message: "New password is required" },
                                { min: 6, message: "Min 6 characters" }
                            ]}
                        >
                            <Input.Password placeholder="Enter new strong password" style={{ borderRadius: "10px" }} />
                        </Form.Item>
                    </Form>
                </Modal>
            </motion.div>

            <style>{`
                .premium-segmented .ant-segmented-item-selected {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
                    font-weight: 800 !important;
                }
                .premium-segmented .ant-segmented-item:not(.ant-segmented-item-selected) {
                    opacity: 0.6;
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
                .ant-table-thead > tr > th {
                    font-size: 11.5px !important;
                    font-weight: 800 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    color: #64748b !important;
                    padding: 20px 16px !important;
                }
                .ant-table-tbody > tr > td {
                    padding: 20px 16px !important;
                    border-bottom: 1px solid #f8fafc !important;
                }
            `}</style>
        </ConfigProvider>
    );
}
