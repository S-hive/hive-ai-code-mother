# 用户注册页面设计规范

**日期：** 2026-07-08  
**状态：** 待审阅  
**范围：** `hive-ai-code-mother-frontend` 用户注册页及登录页预填联动

## 背景与目标

`UserRegisterPage.vue` 目前仅为占位内容，需仿照 `UserLoginPage.vue` 的样式与代码风格完成注册功能。注册成功后自动跳转登录页，并通过路由 query 预填刚注册的账号。

## 需求摘要

| 决策项 | 结论 |
|--------|------|
| 页面风格 | 与登录页一致（布局、样式类、Ant Design Vue 表单） |
| 注册接口 | `userRegister` → `POST /user/register` |
| 请求体 | `API.UserRegisterRequest`（`userAccount`、`userPassword`、`checkPassword`） |
| 成功行为 | 提示「注册成功」→ 跳转 `/user/login?account=xxx` |
| 失败行为 | `message.error('注册失败, ' + res.data.message)` |
| 登录页联动 | 读取 `route.query.account` 预填账号字段 |

## 架构方案

采用**独立页面 + 路由 query 传参**（方案 A）：

- 注册页独立实现，结构与登录页对齐，不抽取公共组件
- 成功后通过 `router.push({ path: '/user/login', query: { account } })` 传递账号
- 登录页 `onMounted` 读取 query 并写入 `formState.userAccount`

不采用 Pinia 临时状态（刷新丢失）或公共 AuthForm 抽象（当前仅 2 页，收益不足）。

## 页面设计

### UserRegisterPage.vue

```
┌─────────────────────────────────────┐
│     hive AI 应用生成 - 用户注册       │
│        无手工, 纯添加, 写网站         │
│                                     │
│  账号      [________________]       │
│  密码      [________________]       │
│  确认密码  [________________]       │
│                    已有账号 去登录 →  │
│  [          注册          ]         │
└─────────────────────────────────────┘
```

| 元素 | 实现 |
|------|------|
| 容器 | `#userRegisterPage`，`flex flex-col items-center` |
| 标题 | `hive AI 应用生成 - 用户注册` |
| 副标题 | `无手工, 纯添加, 写网站`（与登录页相同） |
| 表单宽度 | `600px`，`margin: 0 auto` |
| 样式类 | 复用 `.title`、`.desc`、`.tips`（与登录页一致） |
| 底部链接 | `已有账号` + `<RouterLink to="/user/login">去登录</RouterLink>` |

### 表单字段与校验

| 字段 | 标签 | 校验规则 |
|------|------|----------|
| `userAccount` | 账号 | 必填 |
| `userPassword` | 密码 | 必填，最少 8 位 |
| `checkPassword` | 确认密码 | 必填，最少 8 位，与密码一致 |

确认密码一致校验使用 Ant Design Vue 自定义 validator：

```typescript
{
  validator: (_, value) =>
    value === formState.userPassword
      ? Promise.resolve()
      : Promise.reject('两次密码不一致'),
}
```

### 提交逻辑

```typescript
const handleSubmit = async (values: API.UserRegisterRequest) => {
  const res = await userRegister(values)
  if (res.data.code === 0) {
    message.success('注册成功')
    router.push({
      path: '/user/login',
      query: { account: values.userAccount },
      replace: true,
    })
  } else {
    message.error('注册失败, ' + res.data.message)
  }
}
```

## 登录页联动

### UserLoginPage.vue 改动

在现有登录页新增 query 预填逻辑（约 5 行）：

```typescript
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

onMounted(() => {
  const account = route.query.account
  if (typeof account === 'string' && account) {
    formState.userAccount = account
  }
})
```

- 仅预填账号，密码留空
- 不修改登录页其他逻辑

## 变更清单

| 操作 | 文件 |
|------|------|
| 完整实现 | `src/page/user/UserRegisterPage.vue` |
| 小改动 | `src/page/user/UserLoginPage.vue`（query 预填） |

无需修改路由、API、store 或其他文件。

## 不在本次范围

- 抽取公共 AuthForm 组件
- 账号格式额外校验（如邮箱/手机号规则）
- 注册成功后自动登录
- 登录页 UI 样式调整

## 验证方式

1. `npm run dev` 启动前端
2. 访问 `/user/register`，确认页面样式与登录页一致
3. 空表单提交，确认校验提示正常
4. 两次密码不一致时，确认提示「两次密码不一致」
5. 密码少于 8 位时，确认校验提示
6. 注册成功后跳转 `/user/login?account=xxx`，登录页账号已预填
7. 在登录页完成登录，确认流程正常
8. `npm run type-check` 无类型错误
