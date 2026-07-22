# 应用生成类型下拉框实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将应用管理页的生成类型搜索条件改为下拉框，并在表格中显示集中维护的中文名称。

**Architecture:** 新建生成类型常量模块，使用一个选项数组同时驱动下拉框和表格文案。页面继续向后端提交枚举值，并通过查询函数处理中文显示和未知值回退。

**Tech Stack:** Vue 3、TypeScript、Ant Design Vue

## Global Constraints

- 只支持后端枚举值 `html` 和 `multi_file`。
- 下拉框允许清空，清空后不按生成类型筛选。
- 未知类型回退显示原始值，无值显示 `-`。
- 不新增依赖。

---

### Task 1: 生成类型常量与应用管理页

**Files:**
- Create: `src/constants/codeGenType.ts`
- Modify: `src/page/admin/AppManagePage.vue:7-9,25-43,48-58`

**Interfaces:**
- Produces: `CODE_GEN_TYPE_OPTIONS`，元素结构为 `{ label: string; value: string }`
- Produces: `getCodeGenTypeLabel(codeGenType?: string): string`
- Consumes: `API.AppQueryRequest.codeGenType` 和 `API.AppVO.codeGenType`

- [ ] **Step 1: 创建生成类型常量模块**

```ts
export const CODE_GEN_TYPE_OPTIONS = [
  { label: '原生 HTML 模式', value: 'html' },
  { label: '原生多文件模式', value: 'multi_file' },
] as const

export const getCodeGenTypeLabel = (codeGenType?: string) => {
  if (!codeGenType) {
    return '-'
  }

  return (
    CODE_GEN_TYPE_OPTIONS.find((option) => option.value === codeGenType)?.label ?? codeGenType
  )
}
```

- [ ] **Step 2: 将搜索输入框替换为可清空下拉框**

在 `AppManagePage.vue` 中导入常量：

```ts
import { CODE_GEN_TYPE_OPTIONS, getCodeGenTypeLabel } from '@/constants/codeGenType'
```

将生成类型表单项改为：

```vue
<a-form-item label="生成类型">
  <a-select
    v-model:value="searchParams.codeGenType"
    :options="CODE_GEN_TYPE_OPTIONS"
    placeholder="请选择生成类型"
    allow-clear
    style="width: 180px"
  />
</a-form-item>
```

- [ ] **Step 3: 在表格中显示生成类型中文名称**

在 `bodyCell` 插槽的封面分支后增加：

```vue
<template v-else-if="column.dataIndex === 'codeGenType'">
  {{ getCodeGenTypeLabel(record.codeGenType) }}
</template>
```

- [ ] **Step 4: 运行类型检查**

Run: `npm run type-check`

Expected: 命令退出码为 0，不出现 TypeScript 或 Vue 模板类型错误。

- [ ] **Step 5: 运行生产构建**

Run: `npm run build-only`

Expected: 命令退出码为 0，Vite 成功生成生产构建。
