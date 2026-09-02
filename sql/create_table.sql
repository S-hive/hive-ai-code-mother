-- ----------------------------------------------------------------------------
-- Hive AI Code Mother 数据库初始化脚本
--
-- 使用方式：
--   mysql -u root -p < sql/create_table.sql
-- 或在客户端中直接执行本文件
--
-- 表结构与 com.hive.hiveaicodemother.model.entity 下的实体定义一致，
-- 主键由 MyBatis-Flex 雪花算法生成，因此不使用 AUTO_INCREMENT。
-- ----------------------------------------------------------------------------

-- 创建库
CREATE DATABASE IF NOT EXISTS hive_ai_code_mother
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE hive_ai_code_mother;

-- ----------------------------------------------------------------------------
-- 用户表
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user
(
    id           BIGINT                                 NOT NULL COMMENT 'id（雪花算法生成）',
    userAccount  VARCHAR(256)                           NOT NULL COMMENT '账号',
    userPassword VARCHAR(512)                           NOT NULL COMMENT '密码（MD5 + 盐值加密）',
    userName     VARCHAR(256)                           NULL COMMENT '用户昵称',
    userAvatar   VARCHAR(1024)                          NULL COMMENT '用户头像',
    userProfile  VARCHAR(512)                           NULL COMMENT '用户简介',
    userRole     VARCHAR(256) DEFAULT 'user'            NOT NULL COMMENT '用户角色：user / admin',
    editTime     DATETIME     DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '编辑时间',
    createTime   DATETIME     DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    updateTime   DATETIME     DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    isDelete     TINYINT      DEFAULT 0                 NOT NULL COMMENT '是否删除（逻辑删除）',
    PRIMARY KEY (id),
    UNIQUE KEY uk_userAccount (userAccount),
    INDEX idx_userName (userName)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci COMMENT '用户';

-- ----------------------------------------------------------------------------
-- 应用表
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app
(
    id           BIGINT                             NOT NULL COMMENT 'id（雪花算法生成）',
    appName      VARCHAR(256)                       NULL COMMENT '应用名称',
    cover        VARCHAR(512)                       NULL COMMENT '应用封面（COS 截图地址）',
    initPrompt   TEXT                               NULL COMMENT '应用初始化的 prompt',
    codeGenType  VARCHAR(64)                        NULL COMMENT '代码生成类型：html / multi_file / vue_project',
    deployKey    VARCHAR(64)                        NULL COMMENT '部署标识',
    deployedTime DATETIME                           NULL COMMENT '部署时间',
    priority     INT      DEFAULT 0                 NOT NULL COMMENT '优先级（99 为精选应用）',
    userId       BIGINT                             NOT NULL COMMENT '创建用户 id',
    editTime     DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '编辑时间',
    createTime   DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    updateTime   DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    isDelete     TINYINT  DEFAULT 0                 NOT NULL COMMENT '是否删除（逻辑删除）',
    PRIMARY KEY (id),
    UNIQUE KEY uk_deployKey (deployKey),
    INDEX idx_appName (appName),
    INDEX idx_userId (userId),
    INDEX idx_priority (priority)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci COMMENT '应用';

-- ----------------------------------------------------------------------------
-- 对话历史表
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_history
(
    id          BIGINT                             NOT NULL COMMENT 'id（雪花算法生成）',
    message     TEXT                               NOT NULL COMMENT '消息内容',
    messageType VARCHAR(32)                        NOT NULL COMMENT '消息类型：user / ai',
    appId       BIGINT                             NOT NULL COMMENT '应用 id',
    userId      BIGINT                             NOT NULL COMMENT '创建用户 id',
    createTime  DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    updateTime  DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    isDelete    TINYINT  DEFAULT 0                 NOT NULL COMMENT '是否删除（逻辑删除）',
    PRIMARY KEY (id),
    INDEX idx_appId (appId),
    INDEX idx_createTime (createTime),
    -- 游标分页按 appId + createTime 倒序查询
    INDEX idx_appId_createTime (appId, createTime)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci COMMENT '对话历史';
