package com.hive.hiveaicodemother.ai.memory;

import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.ChatMessageDeserializer;
import dev.langchain4j.data.message.ChatMessageSerializer;
import dev.langchain4j.store.memory.chat.ChatMemoryStore;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * 基于 StringRedisTemplate 的对话记忆存储。
 * <p>
 * 不使用 langchain4j 的 RedisChatMemoryStore：它在设置 user 时强制使用
 * Redis 6+ 的 ACL 认证（AUTH user password），而本项目的 Redis 5 只支持
 * AUTH password；不设置 user 时它又完全不认证。这里复用 Spring Boot 已
 * 配置好的连接，认证方式与 Spring Session 保持一致。
 */
public class RedisTemplateChatMemoryStore implements ChatMemoryStore {

    private final StringRedisTemplate redisTemplate;

    private final String keyPrefix;

    private final Duration ttl;

    public RedisTemplateChatMemoryStore(StringRedisTemplate redisTemplate, String keyPrefix, Duration ttl) {
        this.redisTemplate = redisTemplate;
        this.keyPrefix = keyPrefix;
        this.ttl = ttl;
    }

    @Override
    public List<ChatMessage> getMessages(Object memoryId) {
        String json = redisTemplate.opsForValue().get(toRedisKey(memoryId));
        if (!StringUtils.hasText(json)) {
            return new ArrayList<>();
        }
        return ChatMessageDeserializer.messagesFromJson(json);
    }

    @Override
    public void updateMessages(Object memoryId, List<ChatMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            return;
        }
        String json = ChatMessageSerializer.messagesToJson(messages);
        String key = toRedisKey(memoryId);
        if (ttl != null && !ttl.isZero() && !ttl.isNegative()) {
            redisTemplate.opsForValue().set(key, json, ttl);
        } else {
            redisTemplate.opsForValue().set(key, json);
        }
    }

    @Override
    public void deleteMessages(Object memoryId) {
        redisTemplate.delete(toRedisKey(memoryId));
    }

    private String toRedisKey(Object memoryId) {
        if (memoryId == null || !StringUtils.hasText(memoryId.toString())) {
            throw new IllegalArgumentException("memoryId cannot be null or empty");
        }
        return keyPrefix + memoryId;
    }
}
