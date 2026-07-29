package com.hive.hiveaicodemother;

import dev.langchain4j.community.store.embedding.redis.spring.RedisEmbeddingStoreAutoConfiguration;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

@SpringBootApplication(exclude = {RedisEmbeddingStoreAutoConfiguration.class})
@MapperScan("com.hive.hiveaicodemother.mapper")
public class HiveAiCodeMotherApplication {

    public static void main(String[] args) {
        SpringApplication.run(HiveAiCodeMotherApplication.class, args);
    }

}
