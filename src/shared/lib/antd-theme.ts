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
          colorPrimary: '#1677FF',
          colorBgBase: '#F5F8FF',
          colorBgContainer: '#FFFFFF',
          colorBgLayout: '#EEF3FF',
          colorText: 'rgba(0, 0, 0, 0.88)',
          colorBorder: '#D6E4FF',
          borderRadius: 8,
        },
        components: {
          Layout: {
            bodyBg: '#EEF3FF',
            footerBg: '#EEF3FF',
            headerBg: '#FFFFFF',
            headerColor: 'rgba(0, 0, 0, 0.88)',
            siderBg: '#FFFFFF',
            triggerBg: '#F0F5FF',
            triggerColor: 'rgba(0, 0, 0, 0.88)',
          },
          Menu: {
            activeBarBorderWidth: 0,
            itemBg: 'transparent',
            subMenuItemBg: 'transparent',
          },
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
