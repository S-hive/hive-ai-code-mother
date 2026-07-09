export interface MenuItem {
  key: string
  label: string
  path: string
}

export const menuItems: MenuItem[] = [
  { key: '/home', label: '首页', path: '/' },
  { key: '/admin/userManage', label: '用户管理', path: '/admin/userManage' },
]
