package com.hive.hiveaicodemother;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

@SpringBootApplication
@MapperScan("com.hive.hiveaicodemother.mapper")
public class HiveAiCodeMotherApplication {

    public static void main(String[] args) {
        SpringApplication.run(HiveAiCodeMotherApplication.class, args);
    }

}
