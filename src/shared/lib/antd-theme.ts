import { theme, type ThemeConfig } from 'antd'

import type { AppTheme } from './app-theme'

export function getAntdThemeConfig(themeId: AppTheme): ThemeConfig {
  switch (themeId) {
    case 'dark':
      return {
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1677FF',
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
    case 'light':
    default:
      return {
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#5B7C99',
          colorBgBase: '#E8EAED',
          colorBgContainer: '#F4F5F7',
          colorBgLayout: '#E8EAED',
          colorText: 'rgba(0, 0, 0, 0.72)',
          colorTextSecondary: 'rgba(0, 0, 0, 0.5)',
          colorBorder: '#D5D8DC',
          colorLink: '#5B7C99',
        },
        components: {
          Layout: {
            bodyBg: '#E8EAED',
            footerBg: '#E8EAED',
            headerBg: '#F4F5F7',
            headerColor: 'rgba(0, 0, 0, 0.72)',
            siderBg: '#F4F5F7',
            triggerBg: '#E0E3E7',
            triggerColor: 'rgba(0, 0, 0, 0.72)',
          },
          Menu: {
            activeBarBorderWidth: 0,
            itemBg: 'transparent',
            subMenuItemBg: 'transparent',
            itemSelectedBg: '#E0E6EC',
            itemSelectedColor: '#3D556B',
          },
          Progress: {
            circleTextColor: 'rgba(0, 0, 0, 0.72)',
            defaultColor: '#5B7C99',
            remainingColor: 'rgba(0, 0, 0, 0.06)',
          },
        },
      }
  }
}
