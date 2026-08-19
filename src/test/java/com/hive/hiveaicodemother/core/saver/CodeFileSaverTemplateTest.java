package com.hive.hiveaicodemother.core.saver;

import cn.hutool.core.io.FileUtil;
import com.hive.hiveaicodemother.ai.model.HtmlCodeResult;
import org.junit.jupiter.api.Test;

import java.io.File;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CodeFileSaverTemplateTest {

    @Test
    void saveCodeUsesAppIdAsDirectorySuffix() {
        long appId = 437080090502733824L;
        HtmlCodeResult result = new HtmlCodeResult();
        result.setHtmlCode("<html></html>");

        File saveDir = new HtmlCodeFileSaverTemplate().saveCode(result, appId);
        try {
            assertEquals("html_" + appId, saveDir.getName());
        } finally {
            FileUtil.del(saveDir);
        }
    }
}
