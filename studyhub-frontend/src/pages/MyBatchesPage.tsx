import { Card, Row, Col, Button, Spin, Empty, Tag, Typography, ConfigProvider, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TeamOutlined, CalendarOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useBatches } from "../hooks/useBatches";

const { Title, Text } = Typography;

const cardStyle: React.CSSProperties = {
  borderRadius: "24px",
  border: "1px solid #f1f5f9",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
  background: "#fff",
  overflow: "hidden",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
};

export default function MyBatchesPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useBatches();

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  const safeData = data?.items ?? [];

  return (
    <ConfigProvider
      theme={{
        components: {
          Card: {
            headerFontSize: 16,
            headerHeight: 64
          },
          Button: {
            borderRadius: 12,
            fontWeight: 700,
            controlHeight: 44
          }
        }
      }}
    >
      <div style={{ padding: "40px 48px", maxWidth: "1500px", margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 40 }}>
          <Title level={1} style={{ margin: 0, letterSpacing: "-0.04em", fontWeight: 900, fontSize: "32px" }}>Academic Schedule</Title>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
            <Text type="secondary" style={{ fontSize: "15px", fontWeight: 500, color: "#64748b" }}>Manage your assigned pedagogical batches and track student progress.</Text>
            {safeData.length > 0 && (
                <>
                    <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#cbd5e1" }} />
                    <Text style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb", background: "rgba(37, 99, 235, 0.06)", padding: "2px 8px", borderRadius: "6px" }}>
                        {safeData.length} assigned batches
                    </Text>
                </>
            )}
          </div>
        </div>

        {/* BATCHES GRID */}
        {safeData.length === 0 ? (
          <div style={{ paddingTop: "80px" }}>
            <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<Text type="secondary" style={{ fontSize: "16px" }}>No pedagogical batches currently assigned to you.</Text>} 
            />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {safeData.map((batch, index) => (
              <Col xs={24} sm={12} lg={8} key={batch.id}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8 }}
                >
                    <Card
                        style={cardStyle}
                        bodyStyle={{ padding: "32px" }}
                        className="batch-card"
                    >
                        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ 
                                background: "rgba(37, 99, 235, 0.05)", 
                                padding: "8px 16px", 
                                borderRadius: "10px",
                                border: "1px solid rgba(37, 99, 235, 0.1)"
                            }}>
                                <Text strong style={{ fontFamily: "'Inter', monospace", color: "#2563eb", letterSpacing: "0.02em" }}>
                                    {batch.code}
                                </Text>
                            </div>
                            {(batch.availableSeats ?? 0) === 0 && (
                                <Tag color="error" style={{ borderRadius: "6px", fontWeight: 800, margin: 0, padding: "2px 10px" }}>FULL</Tag>
                            )}
                        </div>

                        <Title level={4} style={{ margin: "0 0 8px 0", fontWeight: 800 }}>{batch.subject}</Title>
                        <Text strong style={{ color: "#64748b", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em" }}>
                            Academic Year: {batch.standard}
                        </Text>

                        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: "12px" }}>
                            <Space size={12}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <CalendarOutlined style={{ color: "#94a3b8" }} />
                                </div>
                                <Text style={{ color: "#475569", fontSize: "13px" }}>
                                    {Array.isArray(batch.scheduleDays) ? batch.scheduleDays.join(", ") : "Not set"}
                                </Text>
                            </Space>

                            <Space size={12}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <TeamOutlined style={{ color: "#94a3b8" }} />
                                </div>
                                <Text style={{ color: "#475569", fontSize: "13px" }}>
                                    <strong>{batch.occupiedSeats ?? 0}</strong> students enrolled / {batch.totalSeats ?? 0} capacity
                                </Text>
                            </Space>
                        </div>

                        <Button
                            type="primary"
                            block
                            icon={<ArrowRightOutlined />}
                            onClick={() => navigate(`/my-batches/${batch.id}/students`)}
                            style={{ 
                                marginTop: 32, 
                                height: "52px", 
                                borderRadius: "14px",
                                boxShadow: "0 8px 16px rgba(37, 99, 235, 0.15)"
                            }}
                        >
                            Review Students
                        </Button>
                    </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        )}
      </div>

      <style>{`
        .batch-card:hover {
            border-color: #2563eb !important;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08) !important;
        }
      `}</style>
    </ConfigProvider>
  );
}

