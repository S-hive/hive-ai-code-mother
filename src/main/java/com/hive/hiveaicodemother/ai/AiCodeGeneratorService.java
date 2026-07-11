package com.hive.hiveaicodemother.ai;

import com.hive.hiveaicodemother.ai.model.HtmlCodeResult;
import com.hive.hiveaicodemother.ai.model.MultiFileCodeResult;
import dev.langchain4j.service.SystemMessage;
import reactor.core.publisher.Flux;

public interface AiCodeGeneratorService {

    /**
     * 生成Html代码
     *
     * @param userMessage 用户提示词
     * @return AI输出结果
     */
    @SystemMessage(fromResource = "prompt/codegen-html-system-prompt.txt")
    HtmlCodeResult generateHtmlCode(String userMessage);

    /**
     * 生成多文件代码
     *
     * @param userMessage 用户提示词
     * @return AI输出结果
     */
    @SystemMessage(fromResource = "prompt/codegen-multi-system-prompt.txt")
    MultiFileCodeResult generateMaltiFileCode(String userMessage);

    /**
     * 流式生成Html代码
     *
     * @param userMessage 用户提示词
     * @return AI输出结果
     */
    @SystemMessage(fromResource = "prompt/codegen-html-system-prompt.txt")
    Flux<String> generateHtmlCodeStream(String userMessage);

    /**
     * 流式生成多文件代码
     *
     * @param userMessage 用户提示词
     * @return AI输出结果
     */
    @SystemMessage(fromResource = "prompt/codegen-multi-system-prompt.txt")
    Flux<String> generateMaltiFileCodeStream(String userMessage);

}
