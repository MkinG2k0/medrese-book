import { theme, type ThemeConfig } from 'antd'

import type { AppTheme } from './app-theme'

export function getAntdThemeConfig(themeId: AppTheme): ThemeConfig {
  switch (themeId) {
    case 'dark':
      return {
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#f07d00',
        },
      }
    case 'sage':
      return {
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#4A7C59',
          colorBgBase: '#F2F5F1',
          colorBgContainer: '#F7FAF6',
          colorText: '#1F2A24',
          colorBorder: '#C5D1C4',
        },
      }
    case 'sepia':
      return {
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorInfo: '#6366f1',
          colorTextBase: '#1e293b',
          colorBgBase: 'rgba(248, 250, 252, 0.7)',
          colorPrimaryBg: 'rgba(59, 130, 246, 0.12)',
          colorPrimaryBgHover: 'rgba(59, 130, 246, 0.18)',
          colorPrimaryBorder: 'rgba(59, 130, 246, 0.35)',
          colorPrimaryBorderHover: 'rgba(59, 130, 246, 0.55)',
          colorPrimaryHover: 'rgba(59, 130, 246, 0.8)',
          colorPrimaryActive: 'rgba(37, 99, 235, 1)',
          colorPrimaryText: 'rgba(59, 130, 246, 1)',
          colorPrimaryTextHover: 'rgba(37, 99, 235, 1)',
          colorText: 'rgba(30, 41, 59, 0.82)',
          colorTextSecondary: 'rgba(30, 41, 59, 0.62)',
          colorTextTertiary: 'rgba(30, 41, 59, 0.42)',
          colorTextQuaternary: 'rgba(30, 41, 59, 0.22)',
          colorBgContainer: 'rgba(255, 255, 255, 0.65)',
          colorBgElevated: 'rgba(255, 255, 255, 0.85)',
          colorBgLayout: 'rgba(226, 232, 240, 0.6)',
          colorBgMask: 'rgba(148, 163, 184, 0.4)',
          colorBorder: 'rgba(148, 163, 184, 0.4)',
          colorBorderSecondary: 'rgba(148, 163, 184, 0.25)',
          borderRadius: 16,
          borderRadiusXS: 4,
          borderRadiusSM: 8,
          borderRadiusLG: 24,
          padding: 16,
          paddingSM: 12,
          paddingLG: 24,
          margin: 16,
          marginSM: 12,
          marginLG: 24,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
          boxShadowSecondary: '0 8px 32px 0 rgba(31, 38, 135, 0.12)',
        },
      }
    case 'light':
    default:
      return {
        algorithm: theme.defaultAlgorithm,
        components: {
          Layout: {
            bodyBg: '#f5f8ff',
            footerBg: '#f5f8ff',
            headerBg: '#ffffff',
            headerColor: 'rgba(0, 0, 0, 0.88)',
            siderBg: '#ffffff',
            triggerBg: '#f0f5ff',
            triggerColor: 'rgba(0, 0, 0, 0.88)',
          },
          Menu: {
            activeBarBorderWidth: 0,
            itemBg: 'transparent',
            subMenuItemBg: 'transparent',
          },
          Progress: {
            circleTextColor: 'rgba(0, 0, 0, 0.88)',
            defaultColor: '#1677FF',
            remainingColor: 'rgba(0, 0, 0, 0.06)',
          },
        },
      }
  }
}
