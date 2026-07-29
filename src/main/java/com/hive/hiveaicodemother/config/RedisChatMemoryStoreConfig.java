package com.hive.hiveaicodemother.config;

import com.hive.hiveaicodemother.ai.memory.RedisTemplateChatMemoryStore;
import dev.langchain4j.store.memory.chat.ChatMemoryStore;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;

@Configuration
@ConfigurationProperties(prefix = "spring.data.redis")
@Data
public class RedisChatMemoryStoreConfig {

    private static final String CHAT_MEMORY_KEY_PREFIX = "chat:memory:";

    private String host;

    private int port;

    private String password;

    private long ttl;

    @Bean
    public ChatMemoryStore redisChatMemoryStore(StringRedisTemplate stringRedisTemplate) {
        return new RedisTemplateChatMemoryStore(stringRedisTemplate, CHAT_MEMORY_KEY_PREFIX, Duration.ofSeconds(ttl));
    }
}
