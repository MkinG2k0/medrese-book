"use client";

import {
  BookOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";

const { Paragraph, Text, Title } = Typography;

export default function HomePage() {
  return (
    <Space orientation="vertical" size="large" className="w-full">
      <div>
        <Title level={2}>Добро пожаловать</Title>
        <Paragraph>
          Демонстрационная страница с базовым layout и компонентами Ant Design.
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Уроков пройдено"
              value={12}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Текущий шаг"
              value={3}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Сур в программе"
              value={8}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Учеников" value={24} prefix={<UserOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card title="Быстрые действия">
        <Space wrap>
          <Button type="primary" icon={<PlayCircleOutlined />}>
            Продолжить урок
          </Button>
          <Button icon={<BookOutlined />}>Открыть программу</Button>
          <Button icon={<UserOutlined />}>Профиль</Button>
        </Space>
      </Card>

      <Card title="Статус">
        <Space wrap>
          <Tag color="gold">Тёмная тема</Tag>
          <Tag color="green">Ant Design подключён</Tag>
          <Tag>Layout готов</Tag>
        </Space>
        <Paragraph>
          Это заглушка для проверки shell: sidebar, header, content и footer уже
          настроены. Дальше сюда можно подключить реальные маршруты и данные.
        </Paragraph>
        <Text type="secondary" className="block pt-2">
          Последнее обновление: демо-контент
        </Text>
      </Card>
    </Space>
  );
}
