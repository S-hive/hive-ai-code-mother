package com.hive.hiveaicodemother.ai;

import com.hive.hiveaicodemother.ai.model.HtmlCodeResult;
import com.hive.hiveaicodemother.ai.model.MultiFileCodeResult;
import jakarta.annotation.Resource;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AiCodeGeneratorServiceTest {

    @Resource
    private AiCodeGeneratorService aiCodeGeneratorService;

    @Test
    void generateHtmlCode() {
        HtmlCodeResult result = aiCodeGeneratorService.generateHtmlCode("为毛主席做个博客, 不超20行");
        Assertions.assertNotNull(result);
    }

    @Test
    void generateMaltiFileCode() {
        MultiFileCodeResult result = aiCodeGeneratorService.generateMaltiFileCode("为毛主席做个留言板, 不超50行");
        Assertions.assertNotNull(result);
    }
}