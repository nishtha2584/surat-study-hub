import {
  Card,
  Descriptions,
  Spin,
  Result,
  Button,
  Row,
  Col,
  Tag,
  Table,
  Space,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

import { theme } from "../styles/theme";
import { getBatchById } from "../api/batches";
import { api } from "../api/axios";

export default function BatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // 📦 Fetch batch details
  const { data: batch, isLoading: isFetchingBatch, error: batchError } = useQuery({
    queryKey: ["batch", id],
    queryFn: () => getBatchById(id!),
    enabled: Boolean(id),
  });

  // 🧑‍🎓 Fetch batch students
  const { data: students, isLoading: isFetchingStudents } = useQuery({
    queryKey: ["batch-students", id],
    queryFn: async () => {
      const res = await api.get(`/batches/${id}/students`);
      return res.data.data;
    },
    enabled: Boolean(id),
  });

  if (isFetchingBatch) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (batchError || !batch) {
    return (
      <Result
        status="error"
        title="Failed to load batch"
        subTitle={batchError?.message || "Batch not found"}
        extra={<Button onClick={() => navigate("/batches")}>Back to Batches</Button>}
      />
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
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Space size="middle" direction="vertical">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/batches")} type="text">
              Back to List
            </Button>
            <div>
              <h1 style={{ color: theme.colors.text, marginBottom: 4, marginTop: 0 }}>
                Batch Details
              </h1>
              <p style={{ color: theme.colors.muted, margin: 0 }}>
                {batch.code}
              </p>
            </div>
          </Space>
        </Col>
      </Row>

      <Card
        bordered
        style={{
          marginBottom: 20,
          borderRadius: theme.radius,
          borderColor: theme.colors.border,
        }}
      >
        <Descriptions
          title="Information"
          bordered
          column={{ xxl: 3, xl: 3, lg: 2, md: 1, sm: 1, xs: 1 }}
        >
          <Descriptions.Item label="Code">{batch.code}</Descriptions.Item>
          <Descriptions.Item label="Subject">{batch.subject}</Descriptions.Item>
          <Descriptions.Item label="Standard">{batch.standard}</Descriptions.Item>
          <Descriptions.Item label="Teacher">{batch.teacherName || "Not Assigned"}</Descriptions.Item>
          <Descriptions.Item label="Schedule">
            {Array.isArray(batch.scheduleDays) ? batch.scheduleDays.join(", ") : batch.scheduleDays} - {batch.timeSlot}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag
              color={
                batch.status === "ACTIVE"
                  ? "success"
                  : batch.status === "COMPLETED"
                    ? "blue"
                    : "error"
              }
            >
              {batch.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Seats">
            {batch.occupiedSeats} / {batch.totalSeats}
          </Descriptions.Item>
          {batch.monthlyFee !== undefined && (
            <Descriptions.Item label="Monthly Fee">₹{batch.monthlyFee}</Descriptions.Item>
          )}
          <Descriptions.Item label="Duration">
            {dayjs(batch.startDate).format("DD MMM YYYY")} to {dayjs(batch.endDate).format("DD MMM YYYY")}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="Enrolled Students"
        bordered
        style={{
          borderRadius: theme.radius,
          borderColor: theme.colors.border,
        }}
      >
        <Table
          dataSource={students || []}
          rowKey="id"
          loading={isFetchingStudents}
          scroll={{ x: true }}
          columns={[
            {
              title: "Name",
              dataIndex: "name",
            },
            {
              title: "Enrollment No.",
              dataIndex: "enrollment_number",
            },
            {
              title: "Phone",
              dataIndex: "phone",
            },
            {
              title: "Payment Status",
              dataIndex: "payment_status",
              render: (status: string) => (
                <Tag
                  color={
                    status === "PAID"
                      ? "success"
                      : status === "PARTIAL"
                        ? "warning"
                        : "error"
                  }
                >
                  {status}
                </Tag>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
