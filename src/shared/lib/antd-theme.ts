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
          colorPrimary: '#8B5E3C',
          colorBgBase: '#F4EDE0',
          colorBgContainer: '#F8F2E8',
          colorText: '#3D2E1F',
          colorBorder: '#D4C4A8',
        },
      }
    case 'light':
    default:
      return {
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#f07d00',
        },
      }
  }
}
