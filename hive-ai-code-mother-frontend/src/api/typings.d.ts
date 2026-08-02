declare namespace API {
  /**
   * 后端主键为 Java Long，响应经 json-bigint 解析后为字符串，请求时两种形式都要允许。
   * 注意：本文件由 openapi2ts 生成，重新生成后需要手动恢复 Id 相关改动。
   */
  type Id = number | string

  type AppAddRequest = {
    initPrompt?: string
  }

  type AppAdminUpdateRequest = {
    id?: Id
    appName?: string
    cover?: string
    priority?: number
  }

  type AppDeployRequest = {
    appId?: Id
  }

  type AppQueryRequest = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    id?: Id
    appName?: string
    cover?: string
    initPrompt?: string
    codeGenType?: string
    deployKey?: string
    priority?: number
    userId?: Id
  }

  type AppUpdateRequest = {
    id?: Id
    appName?: string
  }

  type AppVO = {
    id?: Id
    appName?: string
    cover?: string
    initPrompt?: string
    codeGenType?: string
    deployKey?: string
    deployedTime?: string
    priority?: number
    userId?: Id
    createTime?: string
    updateTime?: string
    user?: UserVO
  }

  type BaseResponseAppVO = {
    code?: number
    data?: AppVO
    message?: string
  }

  type BaseResponseBoolean = {
    code?: number
    data?: boolean
    message?: string
  }

  type BaseResponseLoginUserVO = {
    code?: number
    data?: LoginUserVO
    message?: string
  }

  type BaseResponseLong = {
    code?: number
    data?: Id
    message?: string
  }

  type BaseResponsePageAppVO = {
    code?: number
    data?: PageAppVO
    message?: string
  }

  type BaseResponsePageChatHistory = {
    code?: number
    data?: PageChatHistory
    message?: string
  }

  type BaseResponsePageUserVO = {
    code?: number
    data?: PageUserVO
    message?: string
  }

  type BaseResponseString = {
    code?: number
    data?: string
    message?: string
  }

  type BaseResponseUser = {
    code?: number
    data?: User
    message?: string
  }

  type BaseResponseUserVO = {
    code?: number
    data?: UserVO
    message?: string
  }

  type ChatHistory = {
    id?: Id
    message?: string
    messageType?: string
    appId?: Id
    userId?: Id
    createTime?: string
    updateTime?: string
    isDelete?: number
  }

  type ChatHistoryQueryRequest = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    id?: Id
    message?: string
    messageType?: string
    appId?: Id
    userId?: Id
    lastCreateTime?: string
  }

  type chatToGenCodeParams = {
    appId: Id
    message: string
  }

  type DeleteRequest = {
    id?: Id
  }

  type getAppVOByIdByAdminParams = {
    id: Id
  }

  type getAppVOByIdParams = {
    id: Id
  }

  type getInfoParams = {
    id: Id
  }

  type getUserByIdParams = {
    id: Id
  }

  type getUserVOByIdParams = {
    id: Id
  }

  type listAppChatHistoryParams = {
    appId: Id
    pageSize?: number
    lastCreateTime?: string
  }

  type LoginUserVO = {
    id?: Id
    userAccount?: string
    userName?: string
    userAvatar?: string
    userProfile?: string
    userRole?: string
    createTime?: string
    updateTime?: string
  }

  type PageAppVO = {
    records?: AppVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type PageChatHistory = {
    records?: ChatHistory[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type pageParams = {
    page: PageUser
  }

  type PageUser = {
    records?: User[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type PageUserVO = {
    records?: UserVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type removeParams = {
    id: Id
  }

  type ServerSentEventString = true

  type serveStaticResourceParams = {
    deployKey: string
  }

  type User = {
    id?: Id
    userAccount?: string
    userPassword?: string
    userName?: string
    userAvatar?: string
    userProfile?: string
    userRole?: string
    editTime?: string
    createTime?: string
    updateTime?: string
    isDelete?: number
  }

  type UserAddRequest = {
    userName?: string
    userAccount?: string
    userAvatar?: string
    userProfile?: string
    userRole?: string
  }

  type UserLoginRequest = {
    userAccount?: string
    userPassword?: string
  }

  type UserQueryRequest = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    id?: Id
    userName?: string
    userAccount?: string
    userProfile?: string
    userRole?: string
  }

  type UserRegisterRequest = {
    userAccount?: string
    userPassword?: string
    checkPassword?: string
  }

  type UserUpdateRequest = {
    id?: Id
    userName?: string
    userAvatar?: string
    userProfile?: string
    userRole?: string
  }

  type UserVO = {
    id?: Id
    userAccount?: string
    userName?: string
    userAvatar?: string
    userProfile?: string
    userRole?: string
    createTime?: string
  }
}
